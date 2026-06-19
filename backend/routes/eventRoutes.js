const express = require('express');
const { getEvents, getEventById } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);

module.exports = router;