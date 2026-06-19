const express = require('express');
const { reserveSeats, cancelReservation } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, reserveSeats);
router.post('/cancel', protect, cancelReservation);

module.exports = router;