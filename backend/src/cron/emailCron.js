const Settings = require('../models/Settings');
const Company = require('../models/Company');
const Template = require('../models/Template');
const Resume = require('../models/Resume');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const EmailLog = require('../models/EmailLog');

const runCronJob = () => {
  let transporter;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Use standard JS setInterval instead of node-cron
  // This polls exactly every 1 minute to check the time and send emails if the exact hour/minute matches.
  // It is perfectly safe for VPS, Shared Hosting, and Railway.
  setInterval(async () => {
    if (!transporter) return;

    try {
      const timezoneSetting = await Settings.findOne({ key: 'timezone' });
      const tz = timezoneSetting ? timezoneSetting.value : 'UTC';

      const emailSetting = await Settings.findOne({ key: 'automated_email_first' });
      if (!emailSetting || !emailSetting.value) return;

      const { templateId, resumeId, time, days } = emailSetting.value;
      if (!templateId || !time || !days || days.length === 0) return;

      const now = new Date();
      const currentDay = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now);
      const timeParts = now.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).split(':');
      let currentHour = timeParts[0].padStart(2, '0');
      // Fix for midnight in some Node versions returning 24
      if (currentHour === '24') currentHour = '00';
      const currentTime = `${currentHour}:${timeParts[1].padStart(2, '0')}`;

      if (days.includes(currentDay) && currentTime === time) {
        console.log(`\n--- AUTOMATED EMAIL JOB STARTED at ${currentDay} ${currentTime} (${tz}) ---`);
        
        const companies = await Company.find({ first: true });
        console.log(`Found ${companies.length} companies with first=true to email.`);
        if (companies.length === 0) return;

        const template = await Template.findById(templateId);
        if (!template) {
          console.log(`[ERROR] Template not found (ID: ${templateId})`);
          return;
        }
        console.log(`Using Template: "${template.subject}"`);

        let attachments = [];
        if (resumeId) {
          const resume = await Resume.findById(resumeId);
          if (resume) {
            const filePath = path.join(__dirname, '../../uploads/resumes', resume.filename);
            if (fs.existsSync(filePath)) {
              attachments.push({
                filename: resume.originalName,
                path: filePath
              });
              console.log(`Attached Resume: ${resume.originalName}`);
            } else {
               console.log(`[WARNING] Resume file missing from disk: ${filePath}`);
            }
          }
        }

        let successCount = 0;
        let failCount = 0;

        for (const company of companies) {
          if (!company.email || company.email.length === 0) {
             console.log(`[SKIP] Company "${company.name}" has no email address.`);
             continue;
          }

          const body = template.body.replace(/\{\{companyName\}\}/g, company.name);

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: company.email[0],
            subject: template.subject,
            html: body,
            attachments
          };

          try {
            await transporter.sendMail(mailOptions);
            // After sending, set first to false and record date
            company.first = false;
            company.lastEmailSentAt = new Date();
            company.emailCount = (company.emailCount || 0) + 1;
            await company.save();

            await EmailLog.create({
              companyName: company.name,
              companyEmail: company.email[0],
              type: 'First Time',
              status: 'Success'
            });

            console.log(`[SUCCESS] Email sent to: ${company.name} (${company.email[0]})`);
            successCount++;
          } catch (err) {
            await EmailLog.create({
              companyName: company.name,
              companyEmail: company.email[0],
              type: 'First Time',
              status: 'Failed',
              error: err.message
            });
            console.error(`[FAILED] Error sending to ${company.name} (${company.email[0]}):`, err.message);
            failCount++;
          }
        }
        
        console.log(`--- AUTOMATED EMAIL JOB FINISHED (Success: ${successCount}, Failed: ${failCount}) ---\n`);
      }

      // ----- RECURRING EMAIL JOB -----
      const recurringSetting = await Settings.findOne({ key: 'automated_email_recurring' });
      if (recurringSetting && recurringSetting.value) {
        const rConfig = recurringSetting.value;
        if (rConfig.templateId && rConfig.time && rConfig.intervalDays > 0) {
          if (currentTime === rConfig.time) {
            const cutOffDate = new Date();
            cutOffDate.setDate(cutOffDate.getDate() - parseInt(rConfig.intervalDays));

            const recurringCompanies = await Company.find({
              first: false,
              $or: [
                { lastEmailSentAt: { $lte: cutOffDate } },
                { lastEmailSentAt: { $exists: false }, createdAt: { $lte: cutOffDate } },
                { lastEmailSentAt: null, createdAt: { $lte: cutOffDate } }
              ]
            });

            if (recurringCompanies.length > 0) {
              console.log(`\n--- RECURRING EMAIL JOB STARTED at ${currentTime} (${tz}) ---`);
              console.log(`Found ${recurringCompanies.length} companies to email.`);
              
              const rTemplate = await Template.findById(rConfig.templateId);
              if (rTemplate) {
                let rAttachments = [];
                if (rConfig.resumeId) {
                  const rResume = await Resume.findById(rConfig.resumeId);
                  if (rResume) {
                    const rFilePath = path.join(__dirname, '../../uploads/resumes', rResume.filename);
                    if (fs.existsSync(rFilePath)) {
                      rAttachments.push({ filename: rResume.originalName, path: rFilePath });
                    }
                  }
                }

                let rSuccess = 0;
                let rFail = 0;

                for (const company of recurringCompanies) {
                  if (!company.email || company.email.length === 0) continue;
                  
                  const body = rTemplate.body.replace(/\{\{companyName\}\}/g, company.name);
                  const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: company.email[0],
                    subject: rTemplate.subject,
                    html: body,
                    attachments: rAttachments
                  };

                  try {
                    await transporter.sendMail(mailOptions);
                    company.lastEmailSentAt = new Date();
                    company.emailCount = (company.emailCount || 0) + 1;
                    await company.save();

                    await EmailLog.create({
                      companyName: company.name,
                      companyEmail: company.email[0],
                      type: 'Recurring',
                      status: 'Success'
                    });

                    rSuccess++;
                    console.log(`[RECURRING SUCCESS] Sent to: ${company.name}`);
                  } catch (err) {
                    await EmailLog.create({
                      companyName: company.name,
                      companyEmail: company.email[0],
                      type: 'Recurring',
                      status: 'Failed',
                      error: err.message
                    });

                    rFail++;
                    console.error(`[RECURRING FAILED] ${company.name}:`, err.message);
                  }
                }
                console.log(`--- RECURRING JOB FINISHED (Success: ${rSuccess}, Failed: ${rFail}) ---\n`);
              }
            }
          }
        }
      }

    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }, 60 * 1000); // 60 seconds interval
};

module.exports = runCronJob;
