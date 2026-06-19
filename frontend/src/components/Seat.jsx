const statusStyles = {
  available: 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-500 hover:bg-slate-750 cursor-pointer',
  selected: 'bg-violet-600 border-violet-500 text-white cursor-pointer',
  reserved: 'bg-amber-500/20 border-amber-500/40 text-amber-400 cursor-not-allowed',
  booked: 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed',
}

const Seat = ({ seatNumber, status, isSelected, onClick }) => {
  const visualState = isSelected ? 'selected' : status
  const isDisabled = status === 'reserved' || status === 'booked'

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      title={`${seatNumber} — ${status}`}
      className={`aspect-square w-full rounded-lg border-2 text-xs font-semibold flex items-center justify-center transition-all ${statusStyles[visualState]}`}
    >
      {seatNumber}
    </button>
  )
}

export default Seat