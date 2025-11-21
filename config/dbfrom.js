const mongoose = require('mongoose');

// Database connection
const dbconnection = mongoose.connect("mongodb://127.0.0.1:27017/Rentify1", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch((err) => {
    console.error("❌ DB Connection Error:", err);
});

module.exports = dbconnection;
