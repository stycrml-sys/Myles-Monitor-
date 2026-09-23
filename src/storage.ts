import { useCallback, useEffect, useRef, useState } from 'react'
import { blobToDataUrl, dataUrlToBlob, getPlatform, type Platform } from './platform'
import type { FitnessData, FitnessSettings, PhotoCheckin, PushupEntry, WeightEntry } from './types'

function defaultSettings(): FitnessSettings {
  return { name: '', unit: 'kg', goalWeightKg: null, pushupGoal: null, apiKey: '' }
}

function normalize(parsed: Partial<FitnessData>): FitnessData {
  return {
    version: 1,
    settings: { ...defaultSettings(), ...parsed.settings },
    weights: parsed.weights ?? [],
    pushups: parsed.pushups ?? [],
    checkins: parsed.checkins ?? [],
  }
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

function photoIds(checkins: PhotoCheckin[]): string[] {
  return checkins.flatMap((c) => Object.values(c.photos).filter((id): id is string => !!id))
}

export function useFitnessData() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [data, setData] = useState<FitnessData | null>(null)
  // JSON of what the store already holds, so we only write real changes.
  const savedJson = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const p = await getPlatform()
      const loaded = normalize((await p.load().catch(() => null)) ?? {})
      if (cancelled) return
      savedJson.current = JSON.stringify(loaded)
      setPlatform(p)
      setData(loaded)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!platform || !data) return
    const json = JSON.stringify(data)
    if (json === savedJson.current) return
    // Coalesce bursts of edits (typing a note, tapping +10 repeatedly).
    const t = setTimeout(() => {
      savedJson.current = json
      void platform.save(data)
    }, 600)
    return () => clearTimeout(t)
  }, [platform, data])

  // Pick up changes made on another device when the page comes back into view.
  useEffect(() => {
    if (!platform || platform.kind !== 'artifact') return
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return
      const remote = await platform.load().catch(() => null)
      if (!remote) return
      const next = normalize(remote)
      const json = JSON.stringify(next)
      if (json === savedJson.current) return
      savedJson.current = json
      setData(next)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [platform])

  const update = useCallback((fn: (d: FitnessData) => FitnessData) => {
    setData((d) => (d ? fn(d) : d))
  }, [])

  const setSettings = useCallback(
    (settings: FitnessSettings) => update((d) => ({ ...d, settings })),
    [update],
  )

  // One weight per day: saving a date that already has a weight replaces it.
  const saveWeight = useCallback(
    (entry: WeightEntry) =>
      update((d) => ({
        ...d,
        weights: [entry, ...d.weights.filter((w) => w.id !== entry.id && w.date !== entry.date)].sort(
          byDateDesc,
        ),
      })),
    [update],
  )
  const deleteWeight = useCallback(
    (id: string) => update((d) => ({ ...d, weights: d.weights.filter((w) => w.id !== id) })),
    [update],
  )

  // One push-up entry per day; the form edits the day's sets as a whole.
  const savePushups = useCallback(
    (entry: PushupEntry) =>
      update((d) => ({
        ...d,
        pushups: [entry, ...d.pushups.filter((p) => p.id !== entry.id && p.date !== entry.date)].sort(
          byDateDesc,
        ),
      })),
    [update],
  )
  const deletePushups = useCallback(
    (id: string) => update((d) => ({ ...d, pushups: d.pushups.filter((p) => p.id !== id) })),
    [update],
  )

  const saveCheckin = useCallback(
    (entry: PhotoCheckin) =>
      update((d) => ({
        ...d,
        checkins: [entry, ...d.checkins.filter((c) => c.id !== entry.id)].sort((a, b) =>
          b.weekStart.localeCompare(a.weekStart),
        ),
      })),
    [update],
  )
  const deleteCheckin = useCallback(
    (entry: PhotoCheckin) => {
      for (const id of photoIds([entry])) void platform?.deletePhoto(id)
      update((d) => ({ ...d, checkins: d.checkins.filter((c) => c.id !== entry.id) }))
    },
    [platform, update],
  )

  const exportData = useCallback(async () => {
    if (!platform || !data) return
    const photos: Record<string, string> = {}
    for (const id of photoIds(data.checkins)) {
      const blob = await platform.photoBlob(id).catch(() => undefined)
      if (blob) photos[id] = await blobToDataUrl(blob)
    }
    // Never write the API key into a backup file.
    const backup = { ...data, settings: { ...data.settings, apiKey: '' }, photos }
    await platform.saveFile(
      `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup),
    )
  }, [platform, data])

  const importData = useCallback(
    async (json: string) => {
      if (!platform) return
      const parsed = JSON.parse(json) as Partial<FitnessData> & { photos?: Record<string, string> }
      const next = normalize(parsed)
      // Photos get new ids in this app's photo store; remap the check-ins to them.
      const remap: Record<string, string> = {}
      for (const [oldId, url] of Object.entries(parsed.photos ?? {})) {
        remap[oldId] = await platform.savePhoto(await dataUrlToBlob(url))
      }
      next.checkins = next.checkins.map((c) => ({
        ...c,
        photos: Object.fromEntries(
          Object.entries(c.photos).flatMap(([area, id]) => (id && remap[id] ? [[area, remap[id]]] : [])),
        ),
      }))
      update((d) => ({ ...next, settings: { ...next.settings, apiKey: d.settings.apiKey } }))
    },
    [platform, update],
  )

  const clearAll = useCallback(() => {
    if (data) void platform?.deleteAllPhotos(photoIds(data.checkins))
    update((d) => ({ ...normalize({}), settings: d.settings }))
  }, [platform, data, update])

  return {
    platform,
    data,
    setSettings,
    saveWeight,
    deleteWeight,
    savePushups,
    deletePushups,
    saveCheckin,
    deleteCheckin,
    exportData,
    importData,
    clearAll,
  }
}
