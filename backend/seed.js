require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const Seat = require('./models/Seat');
const Reservation = require('./models/Reservation');

const eventsToCreate = [
  {
    name: 'Coldplay Live in Mumbai',
    dateTime: new Date('2026-08-15T19:00:00'),
    venue: 'DY Patil Stadium, Navi Mumbai',
    totalSeats: 20,
    rows: ['A', 'B'],
    seatsPerRow: 10,
  },
  {
    name: 'Arijit Singh - Unplugged Tour',
    dateTime: new Date('2026-09-05T18:30:00'),
    venue: 'Jio World Garden, Mumbai',
    totalSeats: 30,
    rows: ['A', 'B', 'C'],
    seatsPerRow: 10,
  },
  {
    name: 'Stand-Up Comedy Night ft. Zakir Khan',
    dateTime: new Date('2026-07-20T20:00:00'),
    venue: 'St. Andrews Auditorium, Bandra',
    totalSeats: 16,
    rows: ['A', 'B'],
    seatsPerRow: 8,
  },
  {
    name: 'Mumbai Indians vs Chennai Super Kings',
    dateTime: new Date('2026-10-12T19:30:00'),
    venue: 'Wankhede Stadium, Mumbai',
    totalSeats: 40,
    rows: ['A', 'B', 'C', 'D'],
    seatsPerRow: 10,
  },
  {
    name: 'Tech Conclave 2026',
    dateTime: new Date('2026-07-30T09:00:00'),
    venue: 'Bombay Exhibition Centre, Goregaon',
    totalSeats: 24,
    rows: ['A', 'B', 'C'],
    seatsPerRow: 8,
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await Event.deleteMany({});
    await Seat.deleteMany({});
    await Reservation.deleteMany({});
    console.log('Cleared existing events, seats, and reservations');

    for (const eventConfig of eventsToCreate) {
      const { rows, seatsPerRow, ...eventFields } = eventConfig;

      const event = await Event.create(eventFields);
      console.log(`Created event: ${event.name} (${event._id})`);

      const seatsToCreate = [];
      rows.forEach((row) => {
        for (let i = 1; i <= seatsPerRow; i++) {
          seatsToCreate.push({
            eventId: event._id,
            seatNumber: `${row}${i}`,
            status: 'available',
          });
        }
      });

      await Seat.insertMany(seatsToCreate);
      console.log(`  → Created ${seatsToCreate.length} seats`);
    }

    console.log(`\nSeeding complete! Created ${eventsToCreate.length} events.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();