const express = require('express');
const { confirmBooking, getMyBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, confirmBooking);
router.get('/my', protect, getMyBookings);

module.exports = router;