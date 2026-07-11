import type { ReactNode } from 'react'

export function EntryRow({
  onEdit,
  onDelete,
  leading,
  title,
  subtitle,
  meta,
}: {
  onEdit: () => void
  onDelete: () => void
  leading: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm dark:bg-slate-900">
      <button
        onClick={onEdit}
        className="flex flex-1 items-center gap-3 text-left active:opacity-70"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-800">
          {leading}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
          )}
        </div>
      </button>
      {meta && <div className="shrink-0 text-xs text-slate-400">{meta}</div>}
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm('Delete this entry?')) onDelete()
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 active:scale-95 active:bg-rose-50 active:text-rose-500 dark:text-slate-600"
        aria-label="Delete entry"
      >
        🗑
      </button>
    </div>
  )
}

export function DateGroupHeading({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[52px] z-10 -mx-4 bg-[#f5f4fb]/90 px-4 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400 backdrop-blur dark:bg-[#131120]/90">
      {children}
    </div>
  )
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center text-slate-400">
      <span className="text-4xl">{icon}</span>
      <p className="max-w-[220px] text-sm">{text}</p>
    </div>
  )
}
