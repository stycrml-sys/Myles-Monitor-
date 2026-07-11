import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div className="relative max-h-[88svh] overflow-y-auto rounded-t-3xl bg-white pb-[calc(1.25rem+var(--safe-bottom))] shadow-2xl dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white/95 px-5 pb-3 pt-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
          >
            ✕
          </button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  )
}
