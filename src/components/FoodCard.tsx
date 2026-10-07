import { useMemo, useState } from 'react'
import { Button } from './ui/Button'
import { inputClass } from './ui/Field'
import { Card } from './Chrome'
import { estimateFoods } from '../foodEstimate'
import { dateKey, formatKcal } from '../insights'
import { genId } from '../storage'
import type { Platform } from '../platform'
import type { FitnessSettings, FoodEntry } from '../types'

export function FoodCard({
  day,
  foods,
  settings,
  platform,
  onSave,
  onDelete,
}: {
  day: string
  foods: FoodEntry[]
  settings: FitnessSettings
  platform: Platform
  onSave: (entries: FoodEntry[]) => void
  onDelete: (id: string) => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const todays = useMemo(
    () => foods.filter((f) => f.date === day).sort((a, b) => a.time.localeCompare(b.time)),
    [foods, day],
  )
  const total = todays.reduce((sum, f) => sum + (f.calories ?? 0), 0)
  const goal = settings.calorieGoal

  // Foods logged before, most recent first, for one-tap re-adding.
  const recent = useMemo(() => {
    const seen = new Set(todays.map((f) => f.name.toLowerCase()))
    const out: FoodEntry[] = []
    for (const f of foods) {
      const key = f.name.toLowerCase()
      if (f.calories === null || seen.has(key)) continue
      seen.add(key)
      out.push(f)
      if (out.length === 8) break
    }
    return out
  }, [foods, todays])

  const timeFor = () => (day === dateKey() ? new Date().toISOString() : `${day}T12:00:00.000Z`)

  const add = async () => {
    const input = text.trim()
    if (!input || busy) return
    setBusy(true)
    setNote(null)
    try {
      const { items, note } = await estimateFoods(input, { platform, apiKey: settings.apiKey })
      const time = timeFor()
      onSave(items.map((i) => ({ id: genId(), date: day, time, name: i.name, calories: i.calories, source: i.source })))
      setText('')
      setNote(note)
    } finally {
      setBusy(false)
    }
  }

  const reAdd = (f: FoodEntry) =>
    onSave([{ id: genId(), date: day, time: timeFor(), name: f.name, calories: f.calories, source: f.source }])

  return (
    <Card
      title="🍽️ Food"
      right={
        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {formatKcal(total)}
          {goal ? <span className="font-medium text-slate-400"> / {goal.toLocaleString('en')}</span> : null}
        </span>
      }
    >
      {goal ? (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
          <div
            className={`h-full rounded-full ${total > goal ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (total / goal) * 100)}%` }}
          />
        </div>
      ) : null}

      {todays.length > 0 && (
        <ul className="mb-3 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {todays.map((f) => (
            <FoodRow key={f.id} food={f} onSave={(e) => onSave([e])} onDelete={() => onDelete(f.id)} />
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
      >
        <input
          id="food-input"
          className={`${inputClass} flex-1`}
          placeholder="What did you eat? e.g. an apple"
          value={text}
          onChange={(e) => setText(e.target.value)}
          enterKeyHint="done"
          autoComplete="off"
        />
        <Button type="submit" disabled={!text.trim() || busy}>
          {busy ? '…' : 'Add'}
        </Button>
      </form>
      <p className="mt-1.5 text-xs text-slate-400">
        {busy
          ? 'Estimating calories…'
          : note ?? 'Calories are filled in automatically. Several foods at once works too: "2 eggs, toast and a coffee".'}
      </p>

      {recent.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-slate-400">Add again</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => reAdd(f)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
              >
                {f.name} <span className="text-xs text-slate-400">{f.calories}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function FoodRow({
  food,
  onSave,
  onDelete,
}: {
  food: FoodEntry
  onSave: (f: FoodEntry) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(food.calories === null)
  const [value, setValue] = useState(food.calories === null ? '' : String(food.calories))

  const commit = () => {
    const n = parseInt(value, 10)
    if (Number.isFinite(n) && n >= 0) {
      if (n !== food.calories) onSave({ ...food, calories: n, source: 'manual' })
      setEditing(false)
    } else if (food.calories !== null) {
      setValue(String(food.calories))
      setEditing(false)
    }
  }

  return (
    <li className="flex items-center gap-2 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{food.name}</span>
      {editing ? (
        <input
          type="number"
          inputMode="numeric"
          autoFocus={food.calories !== null}
          placeholder="kcal"
          aria-label={`Calories for ${food.name}`}
          className={`w-24 rounded-lg border px-2 py-1 text-right text-sm tabular-nums outline-none ${
            food.calories === null
              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
              : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
          } text-slate-900 dark:text-slate-100`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg px-2 py-1 text-right text-sm font-semibold tabular-nums text-slate-900 active:bg-slate-100 dark:text-slate-50 dark:active:bg-slate-800"
          aria-label={`Edit calories for ${food.name}`}
          title={food.source === 'manual' ? 'Entered by you' : 'Estimated; tap to adjust'}
        >
          {food.source !== 'manual' && <span className="mr-0.5 font-normal text-slate-400">≈</span>}
          {food.calories}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 active:bg-rose-50 active:text-rose-500 dark:text-slate-600"
        aria-label={`Remove ${food.name}`}
      >
        ✕
      </button>
    </li>
  )
}
