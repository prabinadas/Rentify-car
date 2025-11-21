const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');

// Cancel booking
router.delete('/cancel-booking/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
