import { useState } from 'react'
import type { SleepEntry } from '../types'
import { genId } from '../storage'
import { useTick } from '../utils/useTick'
import {
  durationMinutesBetween,
  formatDateTime,
  formatDurationMin,
  formatTime,
  groupByDay,
  nowIso,
} from '../utils/time'
import { DateGroupHeading, EmptyState, EntryRow } from '../components/ui/EntryRow'
import { Button } from '../components/ui/Button'
import { SleepFormSheet, type SleepFormValue } from '../components/SleepFormSheet'

const QUALITY_EMOJI = ['', '😖', '😣', '😐', '🙂', '😴']

export function SleepScreen({
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: {
  entries: SleepEntry[]
  onAdd: (entry: SleepEntry) => void
  onUpdate: (entry: SleepEntry) => void
  onDelete: (id: string) => void
}) {
  const [activeStart, setActiveStart] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<SleepFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useTick(activeStart !== null, 1000)

  const startSleep = () => setActiveStart(nowIso())

  const stopSleep = () => {
    if (!activeStart) return
    setFormInitial({
      startTime: activeStart,
      endTime: nowIso(),
      quality: 4,
      interruptions: 0,
      interruptionNotes: '',
      comment: '',
    })
    setEditingId(null)
    setActiveStart(null)
    setFormOpen(true)
  }

  const cancelSleep = () => {
    if (window.confirm('Discard this sleep session?')) setActiveStart(null)
  }

  const openManualAdd = () => {
    const now = nowIso()
    setFormInitial({
      startTime: now,
      endTime: now,
      quality: 4,
      interruptions: 0,
      interruptionNotes: '',
      comment: '',
    })
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (entry: SleepEntry) => {
    setFormInitial({
      startTime: entry.startTime,
      endTime: entry.endTime,
      quality: entry.quality,
      interruptions: entry.interruptions,
      interruptionNotes: entry.interruptionNotes,
      comment: entry.comment,
    })
    setEditingId(entry.id)
    setFormOpen(true)
  }

  const handleSave = (value: SleepFormValue) => {
    const now = nowIso()
    const entry: SleepEntry = {
      id: editingId ?? genId(),
      kind: 'sleep',
      startTime: value.startTime,
      endTime: value.endTime > value.startTime ? value.endTime : value.startTime,
      quality: value.quality,
      interruptions: value.interruptions,
      interruptionNotes: value.interruptionNotes.trim(),
      comment: value.comment.trim(),
      createdAt: editingId ? entries.find((e) => e.id === editingId)?.createdAt ?? now : now,
      updatedAt: now,
    }
    if (editingId) onUpdate(entry)
    else onAdd(entry)
    setFormOpen(false)
  }

  const grouped = groupByDay(entries, (e) => e.startTime)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        {!activeStart ? (
          <>
            <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Track sleep
            </p>
            <Button className="w-full !bg-indigo-600 py-4" onClick={startSleep}>
              😴 Start sleep
            </Button>
            <button
              onClick={openManualAdd}
              className="mt-3 w-full text-center text-sm font-medium text-indigo-500 active:opacity-70"
            >
              + Log sleep manually
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Asleep since {formatTime(activeStart)}
            </p>
            <div className="text-3xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatDurationMin(
                (Date.now() - new Date(activeStart).getTime()) / 60000,
              )}
            </div>
            <Button className="w-full !bg-indigo-600" onClick={stopSleep}>
              ⏹ Wake up / stop
            </Button>
            <button
              onClick={cancelSleep}
              className="text-xs font-medium text-rose-400 active:opacity-70"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {entries.length === 0 && (
          <EmptyState icon="😴" text="No sleep sessions logged yet." />
        )}
        {grouped.map(([label, items]) => (
          <div key={label}>
            <DateGroupHeading>{label}</DateGroupHeading>
            <div className="flex flex-col gap-2">
              {items.map((entry) => {
                const totalMin = durationMinutesBetween(entry.startTime, entry.endTime)
                const subtitleParts = [
                  `${entry.interruptions} interruption${entry.interruptions === 1 ? '' : 's'}`,
                ]
                if (entry.comment) subtitleParts.push(entry.comment)
                return (
                  <EntryRow
                    key={entry.id}
                    leading={QUALITY_EMOJI[entry.quality]}
                    title={formatDateTime(entry.startTime)}
                    subtitle={subtitleParts.join(' · ')}
                    meta={formatDurationMin(totalMin)}
                    onEdit={() => openEdit(entry)}
                    onDelete={() => onDelete(entry.id)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <SleepFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={formInitial}
        onSave={handleSave}
        onDelete={
          editingId
            ? () => {
                if (window.confirm('Delete this sleep entry?')) {
                  onDelete(editingId)
                  setFormOpen(false)
                }
              }
            : undefined
        }
      />
    </div>
  )
}
