import type { TabKey } from '../types'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'feed', label: 'Feed', icon: '🍼' },
  { key: 'toileting', label: 'Toileting', icon: '🧷' },
  { key: 'sleep', label: 'Sleep', icon: '😴' },
  { key: 'trends', label: 'Trends', icon: '📈' },
]

export function NavBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
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
