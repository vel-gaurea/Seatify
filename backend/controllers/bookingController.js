const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const Booking = require('../models/Booking');

// POST /api/bookings
const confirmBooking = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const userId = req.user._id;

    if (!reservationId) {
      return res.status(400).json({ message: 'reservationId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'Invalid reservationId' });
    }

    // Step 1: Find the reservation
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      // Either it never existed, or MongoDB's TTL index already deleted it
      // because expiresAt passed. Either way, booking can't proceed —
      // but any seats still pointing at this reservationId are orphaned
      // and must be released.
      await Seat.updateMany(
        { reservationId },
        { $set: { status: 'available', reservationId: null } }
      );

      return res.status(404).json({
        message: 'Reservation not found or has already expired',
      });
    }

    // Step 2: Ownership check — a user should only be able to confirm
    // their own reservation, not someone else's.
    if (reservation.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'This reservation does not belong to you' });
    }

    // Step 3: Manual expiry check — a deliberate safety net since
    // MongoDB's TTL background job runs roughly every 60 seconds, so a
    // reservation could be technically expired but not yet deleted.
    if (reservation.expiresAt < new Date()) {
      await Seat.updateMany(
        { reservationId: reservation._id },
        { $set: { status: 'available', reservationId: null } }
      );
      await Reservation.deleteOne({ _id: reservation._id });

      return res.status(410).json({
        message: 'Reservation has expired. Please reserve your seats again.',
      });
    }

    // Step 4: Atomically confirm the seats — only flip seats that are
    // still 'reserved' under this exact reservationId.
    const updateResult = await Seat.updateMany(
      {
        reservationId: reservation._id,
        status: 'reserved',
      },
      {
        $set: { status: 'booked' },
      }
    );

    if (updateResult.modifiedCount !== reservation.seatNumbers.length) {
      return res.status(409).json({
        message: 'Booking could not be completed due to a seat status conflict. Please try reserving again.',
      });
    }

    // Step 5: Create a permanent booking record before the reservation
    // (which is meant to be temporary) is deleted. This is what powers
    // the "My Bookings" history page.
    await Booking.create({
      userId: reservation.userId,
      eventId: reservation.eventId,
      seatNumbers: reservation.seatNumbers,
    });

    // Step 6: Reservation has served its purpose — remove it now that
    // seats are permanently booked.
    await Reservation.deleteOne({ _id: reservation._id });

    res.status(200).json({
      message: 'Booking confirmed successfully',
      eventId: reservation.eventId,
      seatNumbers: reservation.seatNumbers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ userId })
      .populate('eventId', 'name dateTime venue')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

module.exports = { confirmBooking, getMyBookings };