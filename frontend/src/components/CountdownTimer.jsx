import { useState, useEffect } from 'react'

const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000))
  )

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.()
      return
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const isUrgent = secondsLeft <= 60

  return (
    <div
      className={`flex items-center gap-2 font-mono text-lg font-bold ${
        isUrgent ? 'text-red-400' : 'text-amber-400'
      }`}
    >
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}

export default CountdownTimer