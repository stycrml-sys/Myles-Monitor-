export function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-medium text-slate-600 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
      >
        −
      </button>
      <span className="w-8 text-center text-lg font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-medium text-slate-600 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
      >
        +
      </button>
    </div>
  )
}
