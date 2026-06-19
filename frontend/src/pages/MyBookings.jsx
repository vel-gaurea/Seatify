import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/my')
        setBookings(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your bookings.')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
        <p className="text-slate-400">Loading your bookings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate('/events')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Events
      </button>

      <h1 className="text-3xl font-bold text-white mb-1">My Bookings</h1>
      <p className="text-slate-400 mb-8">A history of all your confirmed bookings.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">You haven't booked any tickets yet.</p>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 text-violet-400 hover:text-violet-300 font-medium text-sm"
          >
            Browse events →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <h2 className="text-white font-semibold">
                  {booking.eventId?.name || 'Event no longer available'}
                </h2>
                {booking.eventId && (
                  <p className="text-slate-400 text-sm mt-0.5">
                    {formatDate(booking.eventId.dateTime)} · {booking.eventId.venue}
                  </p>
                )}
                <p className="text-slate-500 text-xs mt-1">
                  Booked on {formatDate(booking.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  Seats: {booking.seatNumbers.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyBookings