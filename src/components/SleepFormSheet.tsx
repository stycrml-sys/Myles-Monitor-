import { useEffect, useState } from 'react'
import { Sheet } from './ui/Sheet'
import { Field, inputClass } from './ui/Field'
import { RatingStars } from './ui/RatingStars'
import { Stepper } from './ui/Stepper'
import { Button } from './ui/Button'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils/time'

export interface SleepFormValue {
  startTime: string
  endTime: string
  quality: 1 | 2 | 3 | 4 | 5
  interruptions: number
  interruptionNotes: string
  comment: string
}

export function SleepFormSheet({
  open,
  onClose,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  initial: SleepFormValue | null
  onSave: (value: SleepFormValue) => void
  onDelete?: () => void
}) {
  const [value, setValue] = useState<SleepFormValue | null>(initial)

  useEffect(() => {
    if (open) setValue(initial)
  }, [open, initial])

  if (!open || !value) return null

  const set = <K extends keyof SleepFormValue>(key: K, v: SleepFormValue[K]) =>
    setValue((prev) => (prev ? { ...prev, [key]: v } : prev))

  return (
    <Sheet open={open} title={onDelete ? 'Edit sleep' : 'Log sleep'} onClose={onClose}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fell asleep">
            <input
              type="datetime-local"
              className={inputClass}
              value={toDatetimeLocalValue(value.startTime)}
              onChange={(e) => set('startTime', fromDatetimeLocalValue(e.target.value))}
            />
          </Field>
          <Field label="Woke up">
            <input
              type="datetime-local"
              className={inputClass}
              value={toDatetimeLocalValue(value.endTime)}
              onChange={(e) => set('endTime', fromDatetimeLocalValue(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Sleep quality">
          <RatingStars value={value.quality} onChange={(v) => set('quality', v)} />
        </Field>

        <Field label="Interruptions">
          <Stepper value={value.interruptions} onChange={(v) => set('interruptions', v)} />
        </Field>

        {value.interruptions > 0 && (
          <Field label="What happened?">
            <input
              className={inputClass}
              placeholder="Hungry, needed changing, noise..."
              value={value.interruptionNotes}
              onChange={(e) => set('interruptionNotes', e.target.value)}
            />
          </Field>
        )}

        <Field label="Comments">
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Where they slept, swaddle, environment..."
            value={value.comment}
            onChange={(e) => set('comment', e.target.value)}
          />
        </Field>

        <div className="flex gap-2 pt-1">
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button className="flex-1 !bg-indigo-600" onClick={() => onSave(value)}>
            Save sleep
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
