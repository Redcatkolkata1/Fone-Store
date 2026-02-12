// backend/data/conn.js
const mongoose = require("mongoose");

const connectDB = async (MONGO_URI) => {
  try {
    await mongoose.connect(MONGO_URI);  // clean - no options
    
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
