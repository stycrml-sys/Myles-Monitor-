const FACES = ['😖', '😣', '😐', '🙂', '😴']
const LABELS = ['Very poor', 'Poor', 'Okay', 'Good', 'Great']

export function RatingStars({
  value,
  onChange,
}: {
  value: number
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void
}) {
  return (
    <div className="flex justify-between gap-1.5">
      {FACES.map((face, i) => {
        const rating = (i + 1) as 1 | 2 | 3 | 4 | 5
        const active = value === rating
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition active:scale-95 ${
              active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <span className="text-xl leading-none">{face}</span>
            <span
              className={`text-[10px] font-medium ${active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {LABELS[i]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
