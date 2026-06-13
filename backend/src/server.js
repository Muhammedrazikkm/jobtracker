const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const templateRoutes = require('./routes/templateRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const emailLogRoutes = require('./routes/emailLogRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const runCronJob = require('./cron/emailCron');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', emailLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  runCronJob();
});
