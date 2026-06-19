import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const EventsList = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events')
        setEvents(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load events.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center">
        <p className="text-slate-400">Loading events...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-6 py-4 max-w-md text-center">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Upcoming Events</h1>
        <p className="text-slate-400 mt-1">Pick an event to choose your seats.</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No events available right now.</p>
          <p className="text-slate-500 text-sm mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <button
              key={event._id}
              onClick={() => navigate(`/events/${event._id}`)}
              className="group bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-2xl p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">
                  {event.totalSeats} seats
                </span>
              </div>

              <h2 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                {event.name}
              </h2>

              <div className="space-y-1.5 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {formatDate(event.dateTime)}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 20 20" fill="none">
                    <path d="M10 18s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {event.venue}
                </div>
              </div>

              <div className="mt-4 text-sm font-medium text-violet-400 group-hover:text-violet-300 flex items-center gap-1">
                Select seats
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventsList