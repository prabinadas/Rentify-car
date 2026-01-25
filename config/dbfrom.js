const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const dbconnection = mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch((err) => {
    console.error("❌ DB Connection Error:", err);
});

module.exports = dbconnection;
