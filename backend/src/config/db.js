const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
    console.log("=== DEBUG MONGODB CONNECTION ===");
    console.log("MONGO_URL:", process.env.MONGO_URL);
    console.log("MONGO_URI:", process.env.MONGO_URI);
    console.log("Connecting to:", mongoUri ? "URL Found (Hidden for security)" : "UNDEFINED");
    
    if (!mongoUri) {
      throw new Error("No MongoDB connection string found in environment variables!");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
