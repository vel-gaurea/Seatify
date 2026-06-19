import { useEffect } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import confetti from 'canvas-confetti'

const BookingConfirmation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { status, eventName, seatNumbers, message } = location.state || {}

  const isSuccess = status === 'success'

  useEffect(() => {
    if (!isSuccess) return

    // Fire confetti from both sides for a fuller "celebration" burst
    const duration = 1500
    const end = Date.now() + duration

    const colors = ['#7C3AED', '#A78BFA', '#34D399', '#FBBF24']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        startVelocity: 45,
        origin: { x: 0, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        startVelocity: 45,
        origin: { x: 1, y: 0.7 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [isSuccess])

  if (!status) {
    return <Navigate to="/events" replace />
  }

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pop-in">
              <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h1>
            <p className="text-slate-400 mb-1">{eventName}</p>
            <p className="text-slate-300 font-medium mb-6">
              Seats: {seatNumbers?.join(', ')}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Booking Failed</h1>
            <p className="text-slate-400 mb-6">{message || 'Something went wrong. Please try again.'}</p>
          </>
        )}

        <button
          onClick={() => navigate('/events')}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          Back to Events
        </button>
      </div>
    </div>
  )
}

export default BookingConfirmation