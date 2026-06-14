require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./src/models/Company'); // Adjust path based on where script is placed

const resetFirstStatus = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    console.log('Updating all companies to first = true...');
    const result = await Company.updateMany({}, { $set: { first: true } });
    
    console.log(`Success! Updated ${result.modifiedCount} companies.`);
  } catch (error) {
    console.error('Error updating companies:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

resetFirstStatus();
