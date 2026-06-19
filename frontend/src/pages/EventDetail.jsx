import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import SeatGrid from '../components/SeatGrid'
import CountdownTimer from '../components/CountdownTimer'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [reservation, setReservation] = useState(null) // { reservationId, expiresAt }
  const [pageLoading, setPageLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [bannerMsg, setBannerMsg] = useState('')

  const fetchEvent = useCallback(async () => {
    try {
      const res = await api.get(`/events/${id}`)
      setEvent(res.data.event)
      setSeats(res.data.seats)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load event details.')
    } finally {
      setPageLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // Periodically refresh seat data while the user is browsing without an
  // active reservation of their own. This prevents the grid from showing
  // stale "reserved" badges for seats that have since expired or been
  // released by other users.
  useEffect(() => {
    if (reservation) return // don't refresh out from under an active reservation

    const interval = setInterval(() => {
      fetchEvent()
    }, 15000)

    return () => clearInterval(interval)
  }, [reservation, fetchEvent])

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const handleSeatClick = (seat) => {
    if (reservation) return
    if (seat.status !== 'available') return

    setSelectedSeats((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((s) => s !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    )
  }

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return
    setActionLoading(true)
    setErrorMsg('')
    setBannerMsg('')

    try {
      const res = await api.post('/reserve', { eventId: id, seatNumbers: selectedSeats })
      setReservation({ reservationId: res.data.reservationId, expiresAt: res.data.expiresAt })
      setBannerMsg('Seats reserved! Confirm your booking before the timer runs out.')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reserve seats.')
      setSelectedSeats([])
      await fetchEvent()
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!reservation) return
    setActionLoading(true)
    setErrorMsg('')

    try {
      await api.post('/bookings', { reservationId: reservation.reservationId })
      navigate('/booking-confirmation', {
        state: {
          status: 'success',
          eventName: event.name,
          seatNumbers: selectedSeats,
        },
      })
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Booking failed.')
      setReservation(null)
      setSelectedSeats([])
      await fetchEvent()
    } finally {
      setActionLoading(false)
    }
  }

  // Called by CountdownTimer when the 10-minute window runs out client-side
  const handleExpire = useCallback(async () => {
    setReservation(null)
    setSelectedSeats([])
    setErrorMsg('Your reservation has expired. Please select your seats again.')
    setBannerMsg('')
    await fetchEvent()
  }, [fetchEvent])

  // Cancel actually releases the seats server-side via the dedicated cancel
  // endpoint, rather than just resetting local UI state and leaving seats
  // locked for everyone else until the TTL eventually expires them.
  const handleCancelReservation = async () => {
    if (!reservation) return
    setActionLoading(true)

    try {
      await api.post('/reserve/cancel', { reservationId: reservation.reservationId })
    } catch (err) {
      // Even if this fails (e.g. already expired/cleaned up server-side),
      // proceed to reset local state and refresh — the seat resolves either way.
    } finally {
      setReservation(null)
      setSelectedSeats([])
      setBannerMsg('')
      setActionLoading(false)
      await fetchEvent()
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
        <p className="text-slate-400">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-6 py-4 max-w-md text-center">
          {errorMsg || 'Event not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate('/events')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Events
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.name}</h1>
        <p className="text-slate-400 mt-1">{formatDate(event.dateTime)} · {event.venue}</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {errorMsg}
        </div>
      )}
      {bannerMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4">
          {bannerMsg}
        </div>
      )}

      <SeatGrid
        seats={seats}
        selectedSeats={selectedSeats}
        onSeatClick={handleSeatClick}
      />

      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {reservation ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-sm">Time remaining to confirm:</span>
              <CountdownTimer expiresAt={reservation.expiresAt} onExpire={handleExpire} />
            </div>
          ) : (
            <p className="text-slate-300 text-sm">
              {selectedSeats.length > 0
                ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} selected: ${selectedSeats.join(', ')}`
                : 'Select seats to begin.'}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          {reservation ? (
            <>
              <button
                onClick={handleCancelReservation}
                disabled={actionLoading}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {actionLoading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </>
          ) : (
            <button
              onClick={handleReserve}
              disabled={selectedSeats.length === 0 || actionLoading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {actionLoading ? 'Reserving...' : 'Reserve Seats'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetail