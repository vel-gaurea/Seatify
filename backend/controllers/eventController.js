const Event = require('../models/Event');
const Seat = require('../models/Seat');

// Natural sort: splits "A10" into ["A", 10] so numeric parts compare numerically,
// not lexicographically (which would put "A10" right after "A1").
const naturalSeatSort = (a, b) => {
  const parse = (seatNumber) => {
    const match = seatNumber.match(/^([A-Za-z]+)(\d+)$/);
    return match ? { letter: match[1], num: parseInt(match[2], 10) } : { letter: seatNumber, num: 0 };
  };
  const seatA = parse(a.seatNumber);
  const seatB = parse(b.seatNumber);

  if (seatA.letter !== seatB.letter) {
    return seatA.letter.localeCompare(seatB.letter);
  }
  return seatA.num - seatB.num;
};

// GET /api/events - list all events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// GET /api/events/:id - get single event with its seats
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const seats = await Seat.find({ eventId: event._id });
    seats.sort(naturalSeatSort);

    res.status(200).json({ event, seats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

module.exports = { getEvents, getEventById };