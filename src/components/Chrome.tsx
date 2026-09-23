import type { ReactNode } from 'react'
import type { FitnessTab } from '../types'
import type { Insight } from '../insights'

export function FitnessHeader({ name, onSettings }: { name: string; onSettings: () => void }) {
  return (
    <header className="sticky top-[var(--sticky-top)] z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 pb-3 pt-[calc(0.75rem+var(--safe-top))] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div>
        <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-50">
          {name ? `${name}'s Fitness` : 'Fitness Tracker'}
        </h1>
        <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
          Daily insights
        </p>
      </div>
      <button
        onClick={onSettings}
        aria-label="Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg active:scale-95 dark:bg-slate-800"
      >
        ⚙️
      </button>
    </header>
  )
}

const TABS: { key: FitnessTab; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '📝' },
  { key: 'photos', label: 'Photos', icon: '📸' },
  { key: 'trends', label: 'Trends', icon: '📈' },
]

export function FitnessNavBar({
  active,
  onChange,
}: {
  active: FitnessTab
  onChange: (t: FitnessTab) => void
}) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[var(--safe-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 active:scale-95"
            >
              <span
                className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : 'opacity-50'}`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const TONE_CLASS = {
  good: 'border-l-emerald-500',
  warn: 'border-l-amber-500',
  info: 'border-l-slate-300 dark:border-l-slate-600',
} as const

export function InsightList({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null
  return (
    <div className="flex flex-col gap-2">
      {insights.map((ins, i) => (
        <div
          key={i}
          className={`flex gap-2.5 rounded-xl border-l-4 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200 ${TONE_CLASS[ins.tone]}`}
        >
          <span className="shrink-0">{ins.icon}</span>
          <span>{ins.text}</span>
        </div>
      ))}
    </div>
  )
}

export function Card({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}
