import Seat from './Seat'

const SeatGrid = ({ seats, selectedSeats, onSeatClick }) => {
  // Group seats by their row letter (e.g. "A12" -> row "A")
  const rows = seats.reduce((acc, seat) => {
    const rowLetter = seat.seatNumber.match(/^[A-Za-z]+/)?.[0] || '?'
    if (!acc[rowLetter]) acc[rowLetter] = []
    acc[rowLetter].push(seat)
    return acc
  }, {})

  const sortedRowKeys = Object.keys(rows).sort()

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-slate-800">
        <LegendItem colorClass="bg-slate-800 border-slate-700" label="Available" />
        <LegendItem colorClass="bg-violet-600 border-violet-500" label="Selected" />
        <LegendItem colorClass="bg-amber-500/20 border-amber-500/40" label="Reserved" />
        <LegendItem colorClass="bg-slate-950 border-slate-800" label="Booked" />
      </div>

      {/* Stage indicator for visual context */}
      <div className="text-center mb-8">
        <div className="inline-block px-12 py-2 bg-slate-800 rounded-full text-slate-400 text-xs font-semibold uppercase tracking-widest">
          Stage
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {sortedRowKeys.map((rowKey) => (
          <div key={rowKey} className="flex items-center gap-3">
            <span className="w-5 text-slate-500 text-sm font-semibold shrink-0">{rowKey}</span>
            <div className="grid grid-cols-10 gap-2 flex-1 max-w-xl">
              {rows[rowKey].map((seat) => (
                <Seat
                  key={seat._id}
                  seatNumber={seat.seatNumber}
                  status={seat.status}
                  isSelected={selectedSeats.includes(seat.seatNumber)}
                  onClick={() => onSeatClick(seat)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const LegendItem = ({ colorClass, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded border-2 ${colorClass}`} />
    <span className="text-xs text-slate-400">{label}</span>
  </div>
)

export default SeatGrid