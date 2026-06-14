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
const trackingRoutes = require('./routes/trackingRoutes');
const runCronJob = require('./cron/emailCron');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    
    // Allow any Vercel deployment and the exact FRONTEND_URL
    const allowedUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '';
    if (origin.includes('vercel.app') || origin === allowedUrl) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  }
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
app.use('/api/track', trackingRoutes);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = process.env.PORT || 5000;
const User = require('./models/User');

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Auto-seed admin user if none exists
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default admin...');
      await User.create({
        email: 'muhdrazikkm@gmail.com',
        password: '12345678'
      });
      console.log('Successfully seeded default admin user.');
    }
  } catch (err) {
    console.error('Error auto-seeding user:', err.message);
  }

  runCronJob();
});
