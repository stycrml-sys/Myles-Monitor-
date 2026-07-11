import { useEffect, useState } from 'react'
import { Sheet } from './ui/Sheet'
import { Field, inputClass } from './ui/Field'
import { Button } from './ui/Button'
import type { PooColour, PooConsistency } from '../types'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils/time'

const COLOUR_OPTIONS: { value: PooColour; label: string; note?: string }[] = [
  { value: 'black', label: 'Black (meconium)' },
  { value: 'dark-green', label: 'Dark green' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow / mustard' },
  { value: 'brown', label: 'Brown' },
  { value: 'red', label: 'Red / bloody', note: 'Mention to your doctor' },
  { value: 'white-pale', label: 'Pale / white', note: 'Mention to your doctor' },
]

const CONSISTENCY_OPTIONS: { value: PooConsistency; label: string }[] = [
  { value: 'sticky-tarry', label: 'Sticky & tarry' },
  { value: 'seedy-soft', label: 'Seedy & soft' },
  { value: 'runny', label: 'Runny' },
  { value: 'formed', label: 'Formed' },
  { value: 'hard', label: 'Hard' },
]

export interface ToiletingFormValue {
  time: string
  wee: boolean
  poo: boolean
  pooColour: PooColour | null
  pooConsistency: PooConsistency | null
  comment: string
}

export function ToiletingFormSheet({
  open,
  onClose,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  initial: ToiletingFormValue | null
  onSave: (value: ToiletingFormValue) => void
  onDelete?: () => void
}) {
  const [value, setValue] = useState<ToiletingFormValue | null>(initial)

  useEffect(() => {
    if (open) setValue(initial)
  }, [open, initial])

  if (!open || !value) return null

  const set = <K extends keyof ToiletingFormValue>(key: K, v: ToiletingFormValue[K]) =>
    setValue((prev) => (prev ? { ...prev, [key]: v } : prev))

  const selectedColourNote = COLOUR_OPTIONS.find((c) => c.value === value.pooColour)?.note

  const canSave = value.wee || value.poo

  return (
    <Sheet open={open} title={onDelete ? 'Edit entry' : 'Log toileting'} onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Time">
          <input
            type="datetime-local"
            className={inputClass}
            value={toDatetimeLocalValue(value.time)}
            onChange={(e) => set('time', fromDatetimeLocalValue(e.target.value))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => set('wee', !value.wee)}
            className={`flex flex-col items-center gap-1 rounded-2xl border py-4 transition active:scale-[0.97] ${
              value.wee
                ? 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40'
                : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
            }`}
          >
            <span className="text-2xl">💧</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Wee</span>
          </button>
          <button
            type="button"
            onClick={() => set('poo', !value.poo)}
            className={`flex flex-col items-center gap-1 rounded-2xl border py-4 transition active:scale-[0.97] ${
              value.poo
                ? 'border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40'
                : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
            }`}
          >
            <span className="text-2xl">💩</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Poo</span>
          </button>
        </div>

        {value.poo && (
          <>
            <Field label="Colour">
              <select
                className={inputClass}
                value={value.pooColour ?? ''}
                onChange={(e) => set('pooColour', (e.target.value || null) as PooColour | null)}
              >
                <option value="">Not noted</option>
                {COLOUR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {selectedColourNote && (
                <p className="mt-1 text-xs font-medium text-rose-500">⚠ {selectedColourNote}</p>
              )}
            </Field>
            <Field label="Consistency">
              <select
                className={inputClass}
                value={value.pooConsistency ?? ''}
                onChange={(e) =>
                  set('pooConsistency', (e.target.value || null) as PooConsistency | null)
                }
              >
                <option value="">Not noted</option>
                {CONSISTENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        <Field label="Comments">
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Anything else worth noting..."
            value={value.comment}
            onChange={(e) => set('comment', e.target.value)}
          />
        </Field>

        {!canSave && (
          <p className="text-xs text-rose-500">Select wee and/or poo to save this entry.</p>
        )}

        <div className="flex gap-2 pt-1">
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button className="flex-1" disabled={!canSave} onClick={() => onSave(value)}>
            Save
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
