const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    carName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deliveryType: { type: String, required: true },
    deliveryAddress: { type: String },
    pickingDate: { type: Date, required: true },
    droppingDate: { type: Date, required: true },
    pricePerDay: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'unpaid' },
    paymentId: { type: String },
    status: { type: String, default: 'pending' }
}, { timestamps: true });




module.exports = mongoose.model('Booking', bookingSchema);
