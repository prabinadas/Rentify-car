const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB Atlas");

  } catch (err) {

    console.error("❌ MongoDB Error:", err.message);

  }
};

module.exports = connectDB;
