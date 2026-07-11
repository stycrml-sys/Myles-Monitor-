import { useEffect, useState } from 'react'
import { Sheet } from './ui/Sheet'
import { Field, inputClass } from './ui/Field'
import { SegmentedControl } from './ui/SegmentedControl'
import { Button } from './ui/Button'
import type { FeedExtent } from '../types'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils/time'

const EXTENT_OPTIONS: { value: FeedExtent; label: string }[] = [
  { value: 'little', label: 'A little' },
  { value: 'some', label: 'Some' },
  { value: 'full', label: 'Full feed' },
]

export interface FeedFormValue {
  startTime: string
  endTime: string
  leftUsed: boolean
  leftDuration: number
  leftExtent: FeedExtent
  rightUsed: boolean
  rightDuration: number
  rightExtent: FeedExtent
  comment: string
}

export function FeedFormSheet({
  open,
  onClose,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  initial: FeedFormValue | null
  onSave: (value: FeedFormValue) => void
  onDelete?: () => void
}) {
  const [value, setValue] = useState<FeedFormValue | null>(initial)

  useEffect(() => {
    if (open) setValue(initial)
  }, [open, initial])

  if (!open || !value) return null

  const set = <K extends keyof FeedFormValue>(key: K, v: FeedFormValue[K]) =>
    setValue((prev) => (prev ? { ...prev, [key]: v } : prev))

  const canSave = value.leftUsed || value.rightUsed

  return (
    <Sheet open={open} title={onDelete ? 'Edit feed' : 'Log a feed'} onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Started">
            <input
              type="datetime-local"
              className={inputClass}
              value={toDatetimeLocalValue(value.startTime)}
              onChange={(e) => set('startTime', fromDatetimeLocalValue(e.target.value))}
            />
          </Field>
          <Field label="Finished">
            <input
              type="datetime-local"
              className={inputClass}
              value={toDatetimeLocalValue(value.endTime)}
              onChange={(e) => set('endTime', fromDatetimeLocalValue(e.target.value))}
            />
          </Field>
        </div>

        {(['left', 'right'] as const).map((side) => {
          const used = side === 'left' ? value.leftUsed : value.rightUsed
          const duration = side === 'left' ? value.leftDuration : value.rightDuration
          const extent = side === 'left' ? value.leftExtent : value.rightExtent
          return (
            <div
              key={side}
              className={`rounded-2xl border p-3.5 transition ${
                used
                  ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30'
                  : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => set(side === 'left' ? 'leftUsed' : 'rightUsed', !used)}
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                  {side} breast
                </span>
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${used ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition ${used ? 'translate-x-5' : ''}`}
                  />
                </span>
              </button>
              {used && (
                <div className="mt-3 flex flex-col gap-3">
                  <Field label="Duration (minutes)">
                    <input
                      type="number"
                      min={0}
                      max={180}
                      inputMode="numeric"
                      className={inputClass}
                      value={duration}
                      onChange={(e) =>
                        set(
                          side === 'left' ? 'leftDuration' : 'rightDuration',
                          Number(e.target.value),
                        )
                      }
                    />
                  </Field>
                  <Field label="Extent">
                    <SegmentedControl
                      options={EXTENT_OPTIONS}
                      value={extent}
                      onChange={(v) => set(side === 'left' ? 'leftExtent' : 'rightExtent', v)}
                      accentClass="bg-amber-500"
                    />
                  </Field>
                </div>
              )}
            </div>
          )
        })}

        <Field label="Comments">
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Latching, spit-up, fussiness..."
            value={value.comment}
            onChange={(e) => set('comment', e.target.value)}
          />
        </Field>

        {!canSave && (
          <p className="text-xs text-rose-500">Turn on at least one side to save this feed.</p>
        )}

        <div className="flex gap-2 pt-1">
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button className="flex-1" disabled={!canSave} onClick={() => onSave(value)}>
            Save feed
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
