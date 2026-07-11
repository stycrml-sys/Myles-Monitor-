interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  accentClass?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accentClass = 'bg-indigo-600',
}: SegmentedControlProps<T>) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-medium transition active:scale-[0.97] ${
              active
                ? `${accentClass} text-white shadow-sm`
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
