const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
      authSource: "admin",
      maxPoolSize: 10,
      minPoolSize: 2,
      directConnection: false,
    });

    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("Error Code:", err.code);
    console.error("Connection String Used:", process.env.MONGO_URI.replace(/:[^:]*@/, ":***@"));
    process.exit(1);
  }
};

module.exports = connectDB;
