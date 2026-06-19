# Seatify — Event Ticket Booking Flow

A simplified event ticket booking app built for the SortMyScene Full Stack Developer hiring assignment. Browse events, select seats on an interactive seat map, reserve them for 10 minutes, and confirm your booking.

**Stack:** MongoDB, Express, React, Node.js (MERN)

---

## How to Run

### Prerequisites
- Node.js (v18+)
- MongoDB running locally

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/sortmyscene
JWT_SECRET=your_secret_key_here
```

Seed sample events and seats:
```bash
node seed.js
```

Start the server:
```bash
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend

In a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Try it out

Sign up → pick an event → select seats → Reserve → Confirm Booking before the timer runs out. Check **My Bookings** (navbar dropdown) to see your booking history.

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|--------------|------|
| POST | `/api/auth/signup` | Create account | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/events` | List all events | Yes |
| GET | `/api/events/:id` | Get event + its seats | Yes |
| POST | `/api/reserve` | Reserve seats (10 min hold) | Yes |
| POST | `/api/reserve/cancel` | Release a held reservation early | Yes |
| POST | `/api/bookings` | Confirm booking | Yes |
| GET | `/api/bookings/my` | Get logged-in user's booking history | Yes |

Protected routes need header: `Authorization: Bearer <token>`.

---

## How Double-Booking Is Prevented

The risk: two users trying to reserve the same seat at the same instant. A "check, then update" approach has a gap where both requests could pass the check before either updates.

Instead, seat reservation uses one atomic conditional update:

```js
Seat.updateMany(
  { eventId, seatNumber: { $in: seatNumbers }, status: 'available' },
  { $set: { status: 'reserved', reservationId } }
)
```

MongoDB applies the condition and the update as a single atomic operation per document — only one request can ever match a seat that's `available`, so two requests can never both succeed on the same seat. After the update, we compare how many seats were actually modified against how many were requested. If they don't match, the whole reservation is rolled back (any seats that were claimed are released, and the reservation is deleted) — it's all-or-nothing.

*(Note: this uses atomic operations rather than multi-document transactions, since transactions require MongoDB to run as a replica set. The assignment allows either approach.)*

## How Expiry Is Handled

Reservations carry a 10-minute `expiresAt` and a MongoDB TTL index that auto-deletes them once expired. Since the TTL cleanup job runs roughly every 60 seconds (not instantly), the booking endpoint also does a manual expiry check rather than trusting the document's existence alone. If a reservation's TTL has already cleaned it up before a booking attempt, the endpoint still releases any orphaned seats pointing at that reservation ID.

---

## Assumptions

- Sample events/seats are seeded via `node seed.js`; there's no event-creation endpoint since it wasn't part of the spec.
- All event routes require authentication, for consistency with the auth requirement.
- "Cancel" on the frontend calls a release endpoint to free seats immediately, rather than waiting for the 10-minute TTL — added after testing showed letting seats sit locked after a user cancels is a poor experience for other users.