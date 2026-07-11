export function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-2xl bg-white p-3.5 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}
