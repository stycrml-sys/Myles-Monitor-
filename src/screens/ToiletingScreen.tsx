import { useState } from 'react'
import type { ToiletingEntry, ToiletingType } from '../types'
import { genId } from '../storage'
import { formatDateTime, groupByDay, nowIso } from '../utils/time'
import { DateGroupHeading, EmptyState, EntryRow } from '../components/ui/EntryRow'
import { Button } from '../components/ui/Button'
import { ToiletingFormSheet, type ToiletingFormValue } from '../components/ToiletingFormSheet'

function typeFrom(wee: boolean, poo: boolean): ToiletingType {
  if (wee && poo) return 'both'
  return poo ? 'poo' : 'wee'
}

const COLOUR_LABEL: Record<string, string> = {
  black: 'Black',
  'dark-green': 'Dark green',
  green: 'Green',
  yellow: 'Yellow',
  brown: 'Brown',
  red: 'Red',
  'white-pale': 'Pale',
}

export function ToiletingScreen({
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: {
  entries: ToiletingEntry[]
  onAdd: (entry: ToiletingEntry) => void
  onUpdate: (entry: ToiletingEntry) => void
  onDelete: (id: string) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<ToiletingFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const openQuick = (wee: boolean, poo: boolean) => {
    setFormInitial({
      time: nowIso(),
      wee,
      poo,
      pooColour: null,
      pooConsistency: null,
      comment: '',
    })
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (entry: ToiletingEntry) => {
    setFormInitial({
      time: entry.time,
      wee: entry.type === 'wee' || entry.type === 'both',
      poo: entry.type === 'poo' || entry.type === 'both',
      pooColour: entry.pooColour,
      pooConsistency: entry.pooConsistency,
      comment: entry.comment,
    })
    setEditingId(entry.id)
    setFormOpen(true)
  }

  const handleSave = (value: ToiletingFormValue) => {
    const now = nowIso()
    const entry: ToiletingEntry = {
      id: editingId ?? genId(),
      kind: 'toileting',
      time: value.time,
      type: typeFrom(value.wee, value.poo),
      pooColour: value.poo ? value.pooColour : null,
      pooConsistency: value.poo ? value.pooConsistency : null,
      comment: value.comment.trim(),
      createdAt: editingId ? entries.find((e) => e.id === editingId)?.createdAt ?? now : now,
      updatedAt: now,
    }
    if (editingId) onUpdate(entry)
    else onAdd(entry)
    setFormOpen(false)
  }

  const grouped = groupByDay(entries, (e) => e.time)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Log a diaper change
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button className="!bg-sky-500 py-4" onClick={() => openQuick(true, false)}>
            💧 Wee
          </Button>
          <Button className="!bg-orange-500 py-4" onClick={() => openQuick(false, true)}>
            💩 Poo
          </Button>
        </div>
        <button
          onClick={() => openQuick(true, true)}
          className="mt-3 w-full text-center text-sm font-medium text-indigo-500 active:opacity-70"
        >
          Both at once
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {entries.length === 0 && (
          <EmptyState icon="🧷" text="No diaper changes logged yet." />
        )}
        {grouped.map(([label, items]) => (
          <div key={label}>
            <DateGroupHeading>{label}</DateGroupHeading>
            <div className="flex flex-col gap-2">
              {items.map((entry) => {
                const parts: string[] = []
                if (entry.type === 'wee' || entry.type === 'both') parts.push('Wee')
                if (entry.type === 'poo' || entry.type === 'both') {
                  parts.push(entry.pooColour ? `Poo (${COLOUR_LABEL[entry.pooColour]})` : 'Poo')
                }
                const subtitleParts = [...parts]
                if (entry.comment) subtitleParts.push(entry.comment)
                return (
                  <EntryRow
                    key={entry.id}
                    leading={entry.type === 'wee' ? '💧' : entry.type === 'poo' ? '💩' : '🧷'}
                    title={formatDateTime(entry.time)}
                    subtitle={subtitleParts.join(' · ')}
                    onEdit={() => openEdit(entry)}
                    onDelete={() => onDelete(entry.id)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ToiletingFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={formInitial}
        onSave={handleSave}
        onDelete={
          editingId
            ? () => {
                if (window.confirm('Delete this entry?')) {
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
