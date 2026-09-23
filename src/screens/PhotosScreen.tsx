import { useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { inputClass } from '../components/ui/Field'
import { Card } from '../components/Chrome'
import { usePhoto } from '../components/usePhoto'
import { genId } from '../storage'
import { useConfirm } from '../components/useConfirm'
import { fileToJpegBlob } from '../photoStore'
import { buildAnalysisRequest, type PhotoPair } from '../photoPrompt'
import type { Platform } from '../platform'
import {
  dateKey,
  formatWeekLabel,
  formatWeight,
  shiftDays,
  weekStartKey,
} from '../insights'
import type { BodyArea, FitnessData, PhotoCheckin } from '../types'

const AREAS: { key: BodyArea; label: string; hint: string }[] = [
  { key: 'waist', label: 'Waist', hint: 'Front-on, relaxed, same spot & lighting each week' },
  { key: 'arms', label: 'Arms', hint: 'Same pose each week (e.g. flexed, side-on)' },
]

type CompareMode = 'side' | 'slider'

export function PhotosScreen({
  data,
  platform,
  onSave,
  onDelete,
  onOpenSettings,
}: {
  data: FitnessData
  platform: Platform
  onSave: (c: PhotoCheckin) => void
  onDelete: (c: PhotoCheckin) => void
  onOpenSettings: () => void
}) {
  const confirm = useConfirm()
  const currentWeek = weekStartKey(dateKey())
  const [week, setWeek] = useState(currentWeek)
  const checkin = data.checkins.find((c) => c.weekStart === week)

  const earlier = useMemo(
    () => data.checkins.filter((c) => c.weekStart < week && Object.keys(c.photos).length > 0),
    [data.checkins, week],
  )
  const [compareId, setCompareId] = useState<string | null>(null)
  const compareTo = earlier.find((c) => c.id === compareId) ?? earlier[0]
  const [mode, setMode] = useState<CompareMode>('side')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [uploading, setUploading] = useState<BodyArea | null>(null)
  const canAnalyse = !!platform.analyze || !!data.settings.apiKey

  const upload = async (area: BodyArea, file: File) => {
    setError(null)
    setUploading(area)
    try {
      const blob = await fileToJpegBlob(file)
      const base: PhotoCheckin = checkin ?? {
        id: genId(),
        weekStart: week,
        date: week === currentWeek ? dateKey() : week,
        photos: {},
        comment: '',
        aiNotes: null,
        aiNotesAt: null,
      }
      const previous = base.photos[area]
      const photoId = await platform.savePhoto(blob)
      if (previous) void platform.deletePhoto(previous)
      // A new photo makes any previous AI notes stale.
      onSave({ ...base, photos: { ...base.photos, [area]: photoId }, aiNotes: null, aiNotesAt: null })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that photo.')
    } finally {
      setUploading(null)
    }
  }

  const runAnalysis = async () => {
    if (!checkin || !compareTo) return
    setBusy(true)
    setError(null)
    try {
      const pairs: PhotoPair[] = []
      for (const { key } of AREAS) {
        const beforeId = compareTo.photos[key]
        const afterId = checkin.photos[key]
        if (!beforeId || !afterId) continue
        const [before, after] = await Promise.all([platform.photoBlob(beforeId), platform.photoBlob(afterId)])
        if (before && after) pairs.push({ area: key, before, after })
      }
      if (!pairs.length) throw new Error('Need the same body area photographed in both weeks.')

      const avg = (start: string) => {
        const ws = data.weights.filter((w) => w.date >= start && w.date < shiftDays(start, 7))
        return ws.length ? ws.reduce((a, w) => a + w.weightKg, 0) / ws.length : null
      }
      const a = avg(compareTo.weekStart)
      const b = avg(checkin.weekStart)
      const weightNote =
        a !== null && b !== null
          ? `For context, average scale weight went from ${formatWeight(a, data.settings.unit)} to ${formatWeight(b, data.settings.unit)}.`
          : ''

      const context = {
        beforeLabel: formatWeekLabel(compareTo.weekStart),
        afterLabel: formatWeekLabel(checkin.weekStart),
        weightNote,
      }
      let notes: string
      if (platform.analyze) {
        notes = await platform.analyze(buildAnalysisRequest(pairs, context))
      } else {
        // Loaded on demand so the Claude SDK isn't in the initial bundle.
        const { analyzePhotos, describeError } = await import('../photoAnalysis')
        notes = await analyzePhotos(data.settings.apiKey, pairs, context).catch((e: unknown) => {
          throw new Error(describeError(e))
        })
      }
      onSave({ ...checkin, aiNotes: `Compared with the ${formatWeekLabel(compareTo.weekStart).replace('Week', 'week')}:\n\n${notes}`, aiNotesAt: new Date().toISOString() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-white px-2 py-2 shadow-sm dark:bg-slate-900">
        <button
          className="h-9 w-9 rounded-full text-lg active:bg-slate-100 dark:active:bg-slate-800"
          onClick={() => {
            setWeek(shiftDays(week, -7))
            setCompareId(null)
          }}
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatWeekLabel(week)}</div>
          {week === currentWeek && <div className="text-[11px] text-indigo-500">This week</div>}
        </div>
        <button
          className="h-9 w-9 rounded-full text-lg active:bg-slate-100 disabled:opacity-30 dark:active:bg-slate-800"
          disabled={week >= currentWeek}
          onClick={() => {
            setWeek(shiftDays(week, 7))
            setCompareId(null)
          }}
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <Card title="Weekly check-in">
        <div className="grid grid-cols-2 gap-3">
          {AREAS.map((a) => (
            <PhotoSlot
              key={a.key}
              label={a.label}
              hint={a.hint}
              photoId={checkin?.photos[a.key]}
              busy={uploading === a.key}
              onFile={(f) => upload(a.key, f)}
            />
          ))}
        </div>
        {checkin && (
          <textarea
            className={`${inputClass} mt-3 text-sm`}
            rows={2}
            placeholder="Notes (how you feel, how clothes fit…)"
            value={checkin.comment}
            onChange={(e) => onSave({ ...checkin, comment: e.target.value })}
          />
        )}
      </Card>

      {checkin && compareTo && (
        <Card
          title="Compare"
          right={
            earlier.length > 1 ? (
              <select
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                value={compareTo.id}
                onChange={(e) => setCompareId(e.target.value)}
              >
                {earlier.map((c) => (
                  <option key={c.id} value={c.id}>
                    vs {formatWeekLabel(c.weekStart).replace('Week of ', '')}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-400">vs {formatWeekLabel(compareTo.weekStart).replace('Week of ', '')}</span>
            )
          }
        >
          <div className="mb-3">
            <SegmentedControl
              options={[
                { value: 'side', label: 'Side by side' },
                { value: 'slider', label: 'Slider' },
              ]}
              value={mode}
              onChange={setMode}
            />
          </div>
          <div className="flex flex-col gap-4">
            {AREAS.map((a) =>
              compareTo.photos[a.key] && checkin.photos[a.key] ? (
                <div key={a.key}>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{a.label}</div>
                  <Comparison mode={mode} beforeId={compareTo.photos[a.key]!} afterId={checkin.photos[a.key]!} />
                </div>
              ) : null,
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            {canAnalyse ? (
              <Button className="w-full" onClick={runAnalysis} disabled={busy}>
                {busy ? 'Analysing…' : checkin.aiNotes ? '✨ Re-analyse changes' : '✨ Analyse changes with Claude'}
              </Button>
            ) : platform.kind === 'artifact' ? (
              <p className="text-xs text-slate-400">Written photo notes aren't available in this view.</p>
            ) : (
              <p className="text-xs text-slate-400">
                Want written notes on visible changes?{' '}
                <button className="font-semibold text-indigo-600 dark:text-indigo-400" onClick={onOpenSettings}>
                  Add a Claude API key in Settings
                </button>
                .
              </p>
            )}
            {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
            {checkin.aiNotes && (
              <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {checkin.aiNotes}
              </div>
            )}
          </div>
        </Card>
      )}

      {checkin && !compareTo && (
        <p className="text-center text-sm text-slate-400">
          Next week's photos will be compared against these.
        </p>
      )}
      {!checkin && error && <p className="text-sm text-rose-600">{error}</p>}

      {data.checkins.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">All check-ins</h2>
          <div className="flex flex-col gap-1.5">
            {data.checkins.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 text-sm shadow-sm dark:bg-slate-900 ${
                  c.weekStart === week ? 'ring-2 ring-indigo-400' : ''
                }`}
              >
                <button className="flex-1 text-left" onClick={() => { setWeek(c.weekStart); setCompareId(null) }}>
                  <div className="font-medium text-slate-700 dark:text-slate-200">{formatWeekLabel(c.weekStart)}</div>
                  <div className="text-xs text-slate-400">
                    {AREAS.filter((a) => c.photos[a.key]).map((a) => a.label).join(' + ') || 'No photos'}
                    {c.aiNotes ? ' · ✨ notes' : ''}
                  </div>
                </button>
                <button
                  className="text-slate-300 dark:text-slate-600"
                  aria-label="Delete check-in"
                  onClick={async () => (await confirm('Delete this check-in and its photos?')) && onDelete(c)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoSlot({
  label,
  hint,
  photoId,
  busy,
  onFile,
}: {
  label: string
  hint: string
  photoId: string | undefined
  busy: boolean
  onFile: (f: File) => void
}) {
  const url = usePhoto(photoId)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800"
      >
        {busy ? (
          <span className="text-xs font-medium text-slate-400">Uploading…</span>
        ) : url ? (
          <>
            <img src={url} alt={label} className="h-full w-full object-cover" />
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">
              Replace
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 text-slate-400">
            <span className="text-2xl">📷</span>
            <span className="text-xs font-medium">Add {label.toLowerCase()}</span>
          </span>
        )}
      </button>
      <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</div>
      <div className="text-[11px] leading-tight text-slate-400">{hint}</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function Comparison({ mode, beforeId, afterId }: { mode: CompareMode; beforeId: string; afterId: string }) {
  const before = usePhoto(beforeId)
  const after = usePhoto(afterId)
  const [pos, setPos] = useState(50)

  if (mode === 'side') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[
          { url: before, tag: 'Before' },
          { url: after, tag: 'After' },
        ].map(({ url, tag }) => (
          <div key={tag} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {url && <img src={url} alt={tag} className="h-full w-full object-cover" />}
            <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">{tag}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        {after && <img src={after} alt="After" className="absolute inset-0 h-full w-full object-cover" />}
        {before && (
          <img
            src={before}
            alt="Before"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          />
        )}
        <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">Before</span>
        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white">After</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-2 w-full accent-indigo-600"
        aria-label="Before/after slider"
      />
    </div>
  )
}
