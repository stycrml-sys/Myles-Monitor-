import { useState } from 'react'
import type { FeedEntry, FeedExtent, Side } from '../types'
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
import { FeedFormSheet, type FeedFormValue } from '../components/FeedFormSheet'

interface ActiveFeed {
  startTime: string
  currentSide: Side
  currentSegmentStart: string
  segments: { side: Side; minutes: number }[]
}

function segmentMinutesFor(active: ActiveFeed, side: Side, now: number): number {
  const completed = active.segments
    .filter((s) => s.side === side)
    .reduce((sum, s) => sum + s.minutes, 0)
  const live =
    active.currentSide === side
      ? (now - new Date(active.currentSegmentStart).getTime()) / 60000
      : 0
  return completed + live
}

export function FeedScreen({
  feeds,
  onAdd,
  onUpdate,
  onDelete,
}: {
  feeds: FeedEntry[]
  onAdd: (entry: FeedEntry) => void
  onUpdate: (entry: FeedEntry) => void
  onDelete: (id: string) => void
}) {
  const [active, setActive] = useState<ActiveFeed | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formInitial, setFormInitial] = useState<FeedFormValue | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useTick(active !== null)

  const startFeed = (side: Side) => {
    const now = nowIso()
    setActive({ startTime: now, currentSide: side, currentSegmentStart: now, segments: [] })
  }

  const switchSide = () => {
    setActive((prev) => {
      if (!prev) return prev
      const now = nowIso()
      const minutes = (Date.now() - new Date(prev.currentSegmentStart).getTime()) / 60000
      return {
        ...prev,
        segments: [...prev.segments, { side: prev.currentSide, minutes }],
        currentSide: prev.currentSide === 'left' ? 'right' : 'left',
        currentSegmentStart: now,
      }
    })
  }

  const stopFeed = () => {
    if (!active) return
    const now = Date.now()
    const leftMin = Math.round(segmentMinutesFor(active, 'left', now))
    const rightMin = Math.round(segmentMinutesFor(active, 'right', now))
    setFormInitial({
      startTime: active.startTime,
      endTime: new Date(now).toISOString(),
      leftUsed: leftMin > 0,
      leftDuration: leftMin,
      leftExtent: 'some',
      rightUsed: rightMin > 0,
      rightDuration: rightMin,
      rightExtent: 'some',
      comment: '',
    })
    setEditingId(null)
    setActive(null)
    setFormOpen(true)
  }

  const cancelFeed = () => {
    if (window.confirm('Discard this feed?')) setActive(null)
  }

  const openManualAdd = () => {
    const now = nowIso()
    setFormInitial({
      startTime: now,
      endTime: now,
      leftUsed: false,
      leftDuration: 10,
      leftExtent: 'some',
      rightUsed: false,
      rightDuration: 10,
      rightExtent: 'some',
      comment: '',
    })
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (entry: FeedEntry) => {
    setFormInitial({
      startTime: entry.startTime,
      endTime: entry.endTime,
      leftUsed: entry.left !== null,
      leftDuration: entry.left?.durationMin ?? 10,
      leftExtent: entry.left?.extent ?? 'some',
      rightUsed: entry.right !== null,
      rightDuration: entry.right?.durationMin ?? 10,
      rightExtent: entry.right?.extent ?? 'some',
      comment: entry.comment,
    })
    setEditingId(entry.id)
    setFormOpen(true)
  }

  const handleSave = (value: FeedFormValue) => {
    const now = nowIso()
    const entry: FeedEntry = {
      id: editingId ?? genId(),
      kind: 'feed',
      startTime: value.startTime,
      endTime: value.endTime > value.startTime ? value.endTime : value.startTime,
      left: value.leftUsed
        ? { durationMin: value.leftDuration, extent: value.leftExtent as FeedExtent }
        : null,
      right: value.rightUsed
        ? { durationMin: value.rightDuration, extent: value.rightExtent as FeedExtent }
        : null,
      comment: value.comment.trim(),
      createdAt: editingId ? feeds.find((f) => f.id === editingId)?.createdAt ?? now : now,
      updatedAt: now,
    }
    if (editingId) onUpdate(entry)
    else onAdd(entry)
    setFormOpen(false)
  }

  const grouped = groupByDay(feeds, (f) => f.startTime)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        {!active ? (
          <>
            <p className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Start a feed
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="!bg-amber-500 py-4"
                onClick={() => startFeed('left')}
              >
                🍼 Start Left
              </Button>
              <Button className="!bg-amber-500 py-4" onClick={() => startFeed('right')}>
                🍼 Start Right
              </Button>
            </div>
            <button
              onClick={openManualAdd}
              className="mt-3 w-full text-center text-sm font-medium text-indigo-500 active:opacity-70"
            >
              + Log a feed manually
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Feeding on {active.currentSide} · started {formatTime(active.startTime)}
            </p>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatDurationMin(segmentMinutesFor(active, 'left', Date.now()))}
                </div>
                <div className="text-xs text-slate-400">Left</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatDurationMin(segmentMinutesFor(active, 'right', Date.now()))}
                </div>
                <div className="text-xs text-slate-400">Right</div>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-3">
              <Button variant="secondary" onClick={switchSide}>
                🔄 Switch side
              </Button>
              <Button className="!bg-amber-500" onClick={stopFeed}>
                ⏹ Stop
              </Button>
            </div>
            <button
              onClick={cancelFeed}
              className="text-xs font-medium text-rose-400 active:opacity-70"
            >
              Discard feed
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {feeds.length === 0 && (
          <EmptyState icon="🍼" text="No feeds logged yet. Start a timer or log one manually." />
        )}
        {grouped.map(([label, items]) => (
          <div key={label}>
            <DateGroupHeading>{label}</DateGroupHeading>
            <div className="flex flex-col gap-2">
              {items.map((entry) => {
                const totalMin = durationMinutesBetween(entry.startTime, entry.endTime)
                const sides = [
                  entry.left && `L ${entry.left.durationMin}m`,
                  entry.right && `R ${entry.right.durationMin}m`,
                ]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <EntryRow
                    key={entry.id}
                    leading="🍼"
                    title={formatDateTime(entry.startTime)}
                    subtitle={`${sides || 'No side recorded'}${entry.comment ? ` · ${entry.comment}` : ''}`}
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

      <FeedFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={formInitial}
        onSave={handleSave}
        onDelete={
          editingId
            ? () => {
                if (window.confirm('Delete this feed?')) {
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
