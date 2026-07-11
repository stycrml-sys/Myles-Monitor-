interface TooltipEntry {
  name: string
  value: number | string
  color: string
}

export function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: TooltipEntry[]
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
