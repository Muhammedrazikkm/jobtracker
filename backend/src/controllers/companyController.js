const Company = require('../models/Company');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

const getSheetDoc = async (sheetId) => {
  try {
    let creds;

    // 1. Try to load from Environment Variable first (Railway Deployment)
    if (process.env.GOOGLE_CREDS_JSON) {
      creds = JSON.parse(process.env.GOOGLE_CREDS_JSON);
    } 
    // 2. Fallback to local file (Local Development)
    else {
      const credsPath = path.join(__dirname, '../../google-credentials.json');
      if (fs.existsSync(credsPath)) {
        creds = require(credsPath);
      }
    }

    if (!creds) {
      console.log('Google credentials not found! Set GOOGLE_CREDS_JSON env variable or provide google-credentials.json file.');
      return null;
    }
    
    const serviceAccountAuth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    console.log('Error initializing sheet:', error.message);
    return null;
  }
};

exports.uploadSheet = async (req, res) => {
  try {
    const { sheetUrl, skipDuplicates } = req.body;

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return res.status(400).json({ message: 'Invalid Google Sheet URL' });
    }
    const sheetId = match[1];

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    let response;
    try {
      response = await axios.get(csvUrl);
    } catch (err) {
      return res.status(400).json({ message: 'Could not fetch Google Sheet. Make sure it is public ("Anyone with the link can view").' });
    }

    const csvData = response.data;
    const records = parse(csvData, { columns: true, skip_empty_lines: true });

    let duplicatesFound = 0;
    let savedCount = 0;

    for (const record of records) {
      const getVal = (keys) => {
        let values = [];
        for (const k of Object.keys(record)) {
          if (keys.some(key => k.toLowerCase().includes(key))) {
            const val = record[k] ? String(record[k]).trim() : '';
            if (val) values.push(val);
          }
        }
        return values.join(',');
      };

      const name = getVal(['name', 'company', 'business', 'organization']);
      const addressStr = getVal(['address', 'location', 'city']);
      const emailStr = getVal(['email', 'mail']);
      const phoneStr = getVal(['phone', 'mobile', 'contact', 'number', 'tel', 'cell', 'ph']);
      const firstStr = getVal(['first', 'status']);

      if (!name) continue;

      const address = addressStr.split(',').map(s => s.trim()).filter(Boolean);
      const email = emailStr.split(',').map(s => s.trim()).filter(Boolean);
      const phone = phoneStr.split(',').map(s => s.trim()).filter(Boolean);
      const first = firstStr.toLowerCase() === 'true' || firstStr.toLowerCase() === 'yes' || firstStr === '1';

      const existing = await Company.findOne({ name });
      if (existing) {
        if (skipDuplicates) {
          // Instead of purely skipping, we SYNC the database with the latest sheet data
          existing.address = address;
          existing.email = email;
          existing.phone = phone;
          existing.sheetId = sheetId;
          existing.first = first;
          await existing.save();
          duplicatesFound++; // Counting how many were synced
          continue;
        } else {
          return res.status(409).json({ message: `Company already exists: ${name}` });
        }
      }

      await Company.create({ name, address, email, phone, sheetId, first });
      savedCount++;
    }

    res.status(200).json({ message: `Success! Added ${savedCount} new. Synced ${duplicatesFound} existing.` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const totalCompanies = await Company.countDocuments(query);
    const companies = await Company.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.status(200).json({
      companies,
      currentPage: page,
      totalPages: Math.ceil(totalCompanies / limit),
      totalCompanies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllCompanies = async (req, res) => {
  try {
    await Company.deleteMany({});
    res.status(200).json({ message: 'All companies deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { name, address, email, phone } = req.body;
    
    const addressArr = address ? address.split(',').map(s => s.trim()).filter(Boolean) : [];
    const emailArr = email ? email.split(',').map(s => s.trim()).filter(Boolean) : [];
    const phoneArr = phone ? phone.split(',').map(s => s.trim()).filter(Boolean) : [];

    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    
    const oldName = company.name;
    
    // Update DB
    company.name = name;
    company.address = addressArr;
    company.email = emailArr;
    company.phone = phoneArr;
    await company.save();

    // Update Sheet if credentials exist
    if (company.sheetId) {
      const doc = await getSheetDoc(company.sheetId);
      if (doc) {
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        
        const getHeader = (keys) => sheet.headerValues.find(h => keys.some(k => h.toLowerCase().includes(k)));
        const nameHeader = getHeader(['name', 'company', 'business', 'organization']);
        const addressHeader = getHeader(['address', 'location', 'city']);
        const emailHeader = getHeader(['email', 'mail']);
        const phoneHeader = getHeader(['phone', 'mobile', 'contact', 'number', 'tel', 'cell', 'ph']);
        
        if (nameHeader) {
          const row = rows.find(r => r.get(nameHeader) === oldName);
          if (row) {
            row.set(nameHeader, name);
            if (addressHeader) row.set(addressHeader, addressArr.join(', '));
            if (emailHeader) row.set(emailHeader, emailArr.join(', '));
            if (phoneHeader) row.set(phoneHeader, phoneArr.join(', '));
            await row.save();
          }
        }
      }
    }
    
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    
    const companyName = company.name;
    const sheetId = company.sheetId;
    
    // Delete from DB
    await company.deleteOne();
    
    // Delete from Sheet
    if (sheetId) {
      const doc = await getSheetDoc(sheetId);
      if (doc) {
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        
        const getHeader = (keys) => sheet.headerValues.find(h => keys.some(k => h.toLowerCase().includes(k)));
        const nameHeader = getHeader(['name', 'company', 'business', 'organization']);
        
        if (nameHeader) {
          const row = rows.find(r => r.get(nameHeader) === companyName);
          if (row) {
            await row.delete();
          }
        }
      }
    }

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.syncSheets = async (req, res) => {
  try {
    const sheetIds = await Company.distinct('sheetId');
    const validSheetIds = sheetIds.filter(id => id); // remove null/undefined

    if (validSheetIds.length === 0) {
      return res.status(400).json({ message: 'No Google Sheets linked. Please upload a sheet first.' });
    }

    let syncedCount = 0;

    for (const sheetId of validSheetIds) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      let response;
      try {
        response = await axios.get(csvUrl);
      } catch (err) {
        console.log(`Failed to fetch sheet ${sheetId}`);
        continue; 
      }

      const csvData = response.data;
      const records = parse(csvData, { columns: true, skip_empty_lines: true });
      
      const namesInSheet = [];

      for (const record of records) {
        const getVal = (keys) => {
          let values = [];
          for (const k of Object.keys(record)) {
            if (keys.some(key => k.toLowerCase().includes(key))) {
              const val = record[k] ? String(record[k]).trim() : '';
              if (val) values.push(val);
            }
          }
          return values.join(',');
        };

        const name = getVal(['name', 'company', 'business', 'organization']);
        if (!name) continue;
        
        namesInSheet.push(name);

        const addressStr = getVal(['address', 'location', 'city']);
        const emailStr = getVal(['email', 'mail']);
        const phoneStr = getVal(['phone', 'mobile', 'contact', 'number', 'tel', 'cell', 'ph']);
        const firstStr = getVal(['first', 'status']);

        const address = addressStr.split(',').map(s => s.trim()).filter(Boolean);
        const email = emailStr.split(',').map(s => s.trim()).filter(Boolean);
        const phone = phoneStr.split(',').map(s => s.trim()).filter(Boolean);
        const first = firstStr.toLowerCase() === 'true' || firstStr.toLowerCase() === 'yes' || firstStr === '1';

        const existing = await Company.findOne({ name });
        if (existing) {
          existing.address = address;
          existing.email = email;
          existing.phone = phone;
          existing.first = first;
          await existing.save();
          syncedCount++;
        } else {
          await Company.create({ name, address, email, phone, sheetId, first });
          syncedCount++;
        }
      }
      
      // Clean up orphaned records:
      // Find all companies in the DB tied to this sheet, and if they aren't in the sheet anymore, delete them!
      const existingCompaniesInDb = await Company.find({ sheetId });
      for (const dbComp of existingCompaniesInDb) {
        if (!namesInSheet.includes(dbComp.name)) {
          await Company.deleteOne({ _id: dbComp._id });
        }
      }
    }

    res.status(200).json({ message: `Successfully synced records from Google Sheets!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCompany = async (req, res) => {
  try {
    const { name, address, email, phone } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Company name is required' });

    const existing = await Company.findOne({ name });
    if (existing) return res.status(409).json({ message: 'Company already exists' });

    const addressArr = address ? address.split(',').map(s => s.trim()).filter(Boolean) : [];
    const emailArr = email ? email.split(',').map(s => s.trim()).filter(Boolean) : [];
    const phoneArr = phone ? phone.split(',').map(s => s.trim()).filter(Boolean) : [];

    const lastCompany = await Company.findOne({ sheetId: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
    const sheetId = lastCompany ? lastCompany.sheetId : null;

    const newCompany = await Company.create({
      name,
      address: addressArr,
      email: emailArr,
      phone: phoneArr,
      sheetId
    });

    if (sheetId) {
      const doc = await getSheetDoc(sheetId);
      if (doc) {
        const sheet = doc.sheetsByIndex[0];
        await sheet.loadHeaderRow(); // Load headers before accessing them
        
        const getHeader = (keys) => sheet.headerValues.find(h => keys.some(k => h.toLowerCase().includes(k)));
        const nameHeader = getHeader(['name', 'company', 'business', 'organization']);
        const addressHeader = getHeader(['address', 'location', 'city']);
        const emailHeader = getHeader(['email', 'mail']);
        const phoneHeader = getHeader(['phone', 'mobile', 'contact', 'number', 'tel', 'cell', 'ph']);
        
        const newRow = {};
        if (nameHeader) newRow[nameHeader] = name;
        if (addressHeader) newRow[addressHeader] = addressArr.join(', ');
        if (emailHeader) newRow[emailHeader] = emailArr.join(', ');
        if (phoneHeader) newRow[phoneHeader] = phoneArr.join(', ');
        
        await sheet.addRow(newRow);
      }
    }

    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
