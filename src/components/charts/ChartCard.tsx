import type { ReactNode } from 'react'

export function ChartCard({
  title,
  legend,
  children,
}: {
  title: string
  legend?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
        {legend}
      </div>
      {children}
    </div>
  )
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
