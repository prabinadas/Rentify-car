const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    carName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryType: { type: String, required: true },
    pickingDate: { type: Date, required: true },
    droppingDate: { type: Date, required: true },
    status: { type: String, default: 'pending' } // pending, booked, cancelled, etc.
}, { timestamps: true });




module.exports = mongoose.model('Booking', bookingSchema);
