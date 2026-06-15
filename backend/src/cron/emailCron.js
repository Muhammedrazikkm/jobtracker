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
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
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

          let body = template.body.replace(/\{\{companyName\}\}/g, company.name);
          body = body.replace(/\n/g, '<br />');

          let logEntry;
          try {
            logEntry = await EmailLog.create({
              companyName: company.name,
              companyEmail: company.email[0],
              type: 'First Time',
              status: 'Pending' // Initially pending
            });

            const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
            const trackingPixel = `<img src="${backendUrl}/api/track/${logEntry._id}" width="1" height="1" style="display:none;" />`;
            const bodyWithTracking = body + trackingPixel;

            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: company.email[0],
              subject: template.subject,
              html: bodyWithTracking,
              attachments
            };

            await transporter.sendMail(mailOptions);
            // After sending, set first to false and record date
            company.first = false;
            company.lastEmailSentAt = new Date();
            company.emailCount = (company.emailCount || 0) + 1;
            await company.save();

            logEntry.status = 'Success';
            await logEntry.save();

            console.log(`[SUCCESS] Email sent to: ${company.name} (${company.email[0]})`);
            successCount++;
          } catch (err) {
            if (logEntry) {
              logEntry.status = 'Failed';
              logEntry.error = err.message;
              await logEntry.save();
            } else {
              await EmailLog.create({
                companyName: company.name,
                companyEmail: company.email[0],
                type: 'First Time',
                status: 'Failed',
                error: err.message
              });
            }
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
                  
                  let body = rTemplate.body.replace(/\{\{companyName\}\}/g, company.name);
                  body = body.replace(/\n/g, '<br />');
                  let logEntry;
                  try {
                    logEntry = await EmailLog.create({
                      companyName: company.name,
                      companyEmail: company.email[0],
                      type: 'Recurring',
                      status: 'Pending'
                    });

                    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
                    const trackingPixel = `<img src="${backendUrl}/api/track/${logEntry._id}" width="1" height="1" style="display:none;" />`;
                    const bodyWithTracking = body + trackingPixel;

                    const mailOptions = {
                      from: process.env.EMAIL_USER,
                      to: company.email[0],
                      subject: rTemplate.subject,
                      html: bodyWithTracking,
                      attachments: rAttachments
                    };

                    await transporter.sendMail(mailOptions);
                    company.lastEmailSentAt = new Date();
                    company.emailCount = (company.emailCount || 0) + 1;
                    await company.save();

                    logEntry.status = 'Success';
                    await logEntry.save();

                    rSuccess++;
                    console.log(`[RECURRING SUCCESS] Sent to: ${company.name}`);
                  } catch (err) {
                    if (logEntry) {
                      logEntry.status = 'Failed';
                      logEntry.error = err.message;
                      await logEntry.save();
                    } else {
                      await EmailLog.create({
                        companyName: company.name,
                        companyEmail: company.email[0],
                        type: 'Recurring',
                        status: 'Failed',
                        error: err.message
                      });
                    }
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

      // ----- QUICK SEND JOB -----
      const quickSetting = await Settings.findOne({ key: 'quick_send' });
      if (quickSetting && quickSetting.value && quickSetting.value.status === 'pending') {
        const qConfig = quickSetting.value;
        let shouldRunQuick = false;
        
        if (!qConfig.time) {
          shouldRunQuick = true;
        } else if (qConfig.time === currentTime) {
          shouldRunQuick = true;
        }

        if (shouldRunQuick) {
          console.log(`\n--- QUICK SEND JOB STARTED at ${currentTime} (${tz}) ---`);
          
          let qCompanies = [];
          if (qConfig.emailTo) {
             const existingCompany = await Company.findOne({ email: qConfig.emailTo });
             if (existingCompany) {
                 qCompanies = [existingCompany];
             } else {
                 qCompanies = [{
                     name: qConfig.emailTo.split('@')[0],
                     email: [qConfig.emailTo],
                     isManual: true
                 }];
             }
          }

          if (qCompanies.length > 0 && qConfig.templateId) {
            const qTemplate = await Template.findById(qConfig.templateId);
            if (qTemplate) {
              let qAttachments = [];
              if (qConfig.resumeId) {
                const qResume = await Resume.findById(qConfig.resumeId);
                if (qResume) {
                  const qFilePath = path.join(__dirname, '../../uploads/resumes', qResume.filename);
                  if (fs.existsSync(qFilePath)) {
                    qAttachments.push({ filename: qResume.originalName, path: qFilePath });
                  }
                }
              }

              let qSuccess = 0;
              let qFail = 0;

              for (const company of qCompanies) {
                if (!company.email || company.email.length === 0) continue;
                
                let body = qTemplate.body.replace(/\{\{companyName\}\}/g, company.name);
                body = body.replace(/\n/g, '<br />');
                let logEntry;
                try {
                  logEntry = await EmailLog.create({
                    companyName: company.name,
                    companyEmail: company.email[0],
                    type: 'Quick Send',
                    status: 'Pending'
                  });

                  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
                  const trackingPixel = `<img src="${backendUrl}/api/track/${logEntry._id}" width="1" height="1" style="display:none;" />`;
                  const bodyWithTracking = body + trackingPixel;

                  const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: company.email[0],
                    subject: qTemplate.subject,
                    html: bodyWithTracking,
                    attachments: qAttachments
                  };

                  await transporter.sendMail(mailOptions);
                  
                  if (!company.isManual) {
                    company.first = false;
                    company.lastEmailSentAt = new Date();
                    company.emailCount = (company.emailCount || 0) + 1;
                    await company.save();
                  }

                  logEntry.status = 'Success';
                  await logEntry.save();

                  qSuccess++;
                  console.log(`[QUICK SEND SUCCESS] Sent to: ${company.name}`);
                } catch (err) {
                  if (logEntry) {
                    logEntry.status = 'Failed';
                    logEntry.error = err.message;
                    await logEntry.save();
                  } else {
                    await EmailLog.create({
                      companyName: company.name,
                      companyEmail: company.email[0],
                      type: 'Quick Send',
                      status: 'Failed',
                      error: err.message
                    });
                  }
                  qFail++;
                  console.error(`[QUICK SEND FAILED] ${company.name}:`, err.message);
                }
              }
              console.log(`--- QUICK SEND JOB FINISHED (Success: ${qSuccess}, Failed: ${qFail}) ---\n`);
            }
          }

          // Mark as completed regardless of if there were companies to send to, to avoid looping
          quickSetting.value = { ...qConfig, status: 'completed' };
          quickSetting.markModified('value');
          await quickSetting.save();
        }
      }

    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }, 60 * 1000); // 60 seconds interval
};

module.exports = runCronJob;
