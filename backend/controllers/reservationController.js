const mongoose = require('mongoose');
const Event = require('../models/Event');
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');

const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// POST /api/reserve
const reserveSeats = async (req, res) => {
  try {
    const { eventId, seatNumbers } = req.body;
    const userId = req.user._id;

    if (!eventId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ message: 'eventId and seatNumbers array are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid eventId' });
    }

    // Reject duplicate seat numbers in the same request (e.g. ["A1", "A1"])
    const uniqueSeatNumbers = [...new Set(seatNumbers)];
    if (uniqueSeatNumbers.length !== seatNumbers.length) {
      return res.status(400).json({ message: 'Duplicate seat numbers in request' });
    }

    // Confirm the event actually exists before reserving against it
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

    // Step 1: Create the reservation document first so we have an ID
    // to stamp onto the seats we successfully lock.
    const reservation = await Reservation.create({
      userId,
      eventId,
      seatNumbers: uniqueSeatNumbers,
      expiresAt,
    });

    // Step 2: Atomically claim only the seats that are currently 'available'.
    // The condition (status: 'available') and the update happen as one
    // atomic operation per document — no two concurrent requests can both
    // succeed on the same seat.
    const updateResult = await Seat.updateMany(
      {
        eventId,
        seatNumber: { $in: uniqueSeatNumbers },
        status: 'available',
      },
      {
        $set: {
          status: 'reserved',
          reservationId: reservation._id,
        },
      }
    );

    // Step 3: Verify ALL requested seats were actually claimed. If not,
    // someone else got there first — roll back fully.
    if (updateResult.modifiedCount !== uniqueSeatNumbers.length) {
      await Seat.updateMany(
        { reservationId: reservation._id },
        { $set: { status: 'available', reservationId: null } }
      );
      await Reservation.deleteOne({ _id: reservation._id });

      return res.status(409).json({
        message: 'One or more selected seats are no longer available. Please choose different seats.',
      });
    }

    res.status(201).json({
      message: 'Seats reserved successfully',
      reservationId: reservation._id,
      seatNumbers: uniqueSeatNumbers,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Reservation failed', error: error.message });
  }
};

// POST /api/reserve/cancel
const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const userId = req.user._id;

    if (!reservationId || !mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: 'Valid reservationId is required' });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      // Already gone (expired/TTL-cleaned) — still attempt to clean up any
      // orphaned seats pointing at this id, then treat as success either way.
      await Seat.updateMany(
        { reservationId },
        { $set: { status: 'available', reservationId: null } }
      );
      return res.status(200).json({ message: 'Reservation already released' });
    }

    if (reservation.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'This reservation does not belong to you' });
    }

    await Seat.updateMany(
      { reservationId: reservation._id },
      { $set: { status: 'available', reservationId: null } }
    );
    await Reservation.deleteOne({ _id: reservation._id });

    res.status(200).json({ message: 'Reservation cancelled and seats released' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel reservation', error: error.message });
  }
};

module.exports = { reserveSeats, cancelReservation };