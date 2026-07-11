import { ageLabel } from '../utils/time'
import type { BabyProfile } from '../types'

export function Header({ baby, onSettings }: { baby: BabyProfile; onSettings: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 pb-3 pt-[calc(0.75rem+var(--safe-top))] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div>
        <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-50">
          {baby.name}'s Monitor
        </h1>
        <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400">
          {ageLabel(baby.birthDate)}
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
