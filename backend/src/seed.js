const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

// Load env config
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'muhdrazikkm@gmail.com';
    const password = '12345678';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists in the database!');
      process.exit();
    }

    // Create new user (the pre-save hook in the User model will automatically hash the password)
    await User.create({
      email,
      password,
    });

    console.log('Successfully seeded user: ' + email);
    process.exit();
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
};

seedUser();
