import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { inputClass } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { Card, InsightList } from '../components/Chrome'
import { useConfirm } from '../components/useConfirm'
import { genId } from '../storage'
import {
  buildInsights,
  dateKey,
  formatDay,
  formatWeight,
  kgToUnit,
  pushupTotal,
  unitToKg,
} from '../insights'
import type { FitnessData, PushupEntry, WeightEntry } from '../types'

const QUICK_SETS = [5, 10, 15, 20, 25]

export function TodayScreen({
  data,
  onSaveWeight,
  onDeleteWeight,
  onSavePushups,
  onDeletePushups,
}: {
  data: FitnessData
  onSaveWeight: (e: WeightEntry) => void
  onDeleteWeight: (id: string) => void
  onSavePushups: (e: PushupEntry) => void
  onDeletePushups: (id: string) => void
}) {
  const confirm = useConfirm()
  const { unit } = data.settings
  const [day, setDay] = useState(dateKey())
  const weight = data.weights.find((w) => w.date === day)
  const pushups = data.pushups.find((p) => p.date === day)

  const [weightInput, setWeightInput] = useState('')
  const [customSet, setCustomSet] = useState('')

  useEffect(() => {
    setWeightInput(weight ? String(Math.round(kgToUnit(weight.weightKg, unit) * 10) / 10) : '')
  }, [weight, unit])

  const insights = useMemo(() => buildInsights(data), [data])

  const saveWeight = () => {
    const value = parseFloat(weightInput)
    if (!Number.isFinite(value) || value <= 0) return
    onSaveWeight({
      id: weight?.id ?? genId(),
      date: day,
      weightKg: unitToKg(value, unit),
      comment: weight?.comment ?? '',
    })
  }

  const setSets = (sets: number[]) => {
    if (sets.length === 0) {
      if (pushups) onDeletePushups(pushups.id)
      return
    }
    onSavePushups({ id: pushups?.id ?? genId(), date: day, sets, comment: pushups?.comment ?? '' })
  }
  const addSet = (reps: number) => {
    if (reps > 0) setSets([...(pushups?.sets ?? []), reps])
  }

  const history = useMemo(() => {
    const days = new Set([...data.weights.map((w) => w.date), ...data.pushups.map((p) => p.date)])
    return [...days].sort((a, b) => b.localeCompare(a)).slice(0, 14)
  }, [data.weights, data.pushups])

  const isToday = day === dateKey()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Logging for</span>
        <input
          type="date"
          className={`${inputClass} flex-1 py-2`}
          value={day}
          max={dateKey()}
          onChange={(e) => e.target.value && setDay(e.target.value)}
        />
        {!isToday && (
          <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400" onClick={() => setDay(dateKey())}>
            Today
          </button>
        )}
      </div>

      <Card
        title="⚖️ Weight"
        right={weight && <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={`Weight in ${unit}`}
              className={`${inputClass} pr-12 text-lg font-semibold`}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveWeight()}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              {unit}
            </span>
          </div>
          <Button onClick={saveWeight} disabled={!weightInput}>
            {weight ? 'Update' : 'Save'}
          </Button>
        </div>
        {weight && (
          <button
            className="mt-2 text-xs text-slate-400"
            onClick={async () => (await confirm('Delete this weight entry?')) && onDeleteWeight(weight.id)}
          >
            Delete entry
          </button>
        )}
      </Card>

      <Card
        title="💪 Push-ups"
        right={
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {pushups ? pushupTotal(pushups) : 0} total
          </span>
        }
      >
        {pushups && pushups.sets.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {pushups.sets.map((reps, i) => (
              <button
                key={i}
                onClick={() => setSets(pushups.sets.filter((_, j) => j !== i))}
                className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 active:scale-95 dark:bg-indigo-950 dark:text-indigo-300"
                aria-label={`Remove set of ${reps}`}
              >
                {reps} <span className="text-xs opacity-60">✕</span>
              </button>
            ))}
          </div>
        )}
        <p className="mb-2 text-xs text-slate-400">Tap to add a set</p>
        <div className="mb-2 flex gap-1.5">
          {QUICK_SETS.map((n) => (
            <button
              key={n}
              onClick={() => addSet(n)}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
            >
              +{n}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Custom reps"
            className={`${inputClass} flex-1`}
            value={customSet}
            onChange={(e) => setCustomSet(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addSet(parseInt(customSet, 10))
                setCustomSet('')
              }
            }}
          />
          <Button
            variant="secondary"
            disabled={!(parseInt(customSet, 10) > 0)}
            onClick={() => {
              addSet(parseInt(customSet, 10))
              setCustomSet('')
            }}
          >
            Add set
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Insights</h2>
        <InsightList insights={insights} />
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent days</h2>
        {history.length === 0 ? (
          <EmptyState icon="🏁" text="Log your weight and push-ups above to get started." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((d) => {
              const w = data.weights.find((x) => x.date === d)
              const p = data.pushups.find((x) => x.date === d)
              return (
                <button
                  key={d}
                  onClick={() => {
                    setDay(d)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-left text-sm shadow-sm active:opacity-70 dark:bg-slate-900 ${
                    d === day ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatDay(d)}</span>
                  <span className="flex gap-4 tabular-nums text-slate-500 dark:text-slate-400">
                    <span>{w ? formatWeight(w.weightKg, unit) : '—'}</span>
                    <span className="w-20 text-right">{p ? `${pushupTotal(p)} push-ups` : '—'}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
