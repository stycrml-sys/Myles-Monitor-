import { useCallback, useEffect, useState } from 'react'
import { clearPhotos, deletePhoto, getPhoto, putPhoto } from './photoStore'
import type { FitnessData, FitnessSettings, PhotoCheckin, PushupEntry, WeightEntry } from './types'

const STORAGE_KEY = 'fitness-tracker:data:v1'

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

function loadData(): FitnessData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalize(raw ? (JSON.parse(raw) as Partial<FitnessData>) : {})
  } catch {
    return normalize({})
  }
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

export function useFitnessData() {
  const [data, setData] = useState<FitnessData>(() => loadData())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const setSettings = useCallback((settings: FitnessSettings) => {
    setData((d) => ({ ...d, settings }))
  }, [])

  // One weight per day: saving a date that already has a weight replaces it.
  const saveWeight = useCallback((entry: WeightEntry) => {
    setData((d) => ({
      ...d,
      weights: [entry, ...d.weights.filter((w) => w.id !== entry.id && w.date !== entry.date)].sort(
        byDateDesc,
      ),
    }))
  }, [])
  const deleteWeight = useCallback((id: string) => {
    setData((d) => ({ ...d, weights: d.weights.filter((w) => w.id !== id) }))
  }, [])

  // One push-up entry per day; the form edits the day's sets as a whole.
  const savePushups = useCallback((entry: PushupEntry) => {
    setData((d) => ({
      ...d,
      pushups: [entry, ...d.pushups.filter((p) => p.id !== entry.id && p.date !== entry.date)].sort(
        byDateDesc,
      ),
    }))
  }, [])
  const deletePushups = useCallback((id: string) => {
    setData((d) => ({ ...d, pushups: d.pushups.filter((p) => p.id !== id) }))
  }, [])

  const saveCheckin = useCallback((entry: PhotoCheckin) => {
    setData((d) => ({
      ...d,
      checkins: [entry, ...d.checkins.filter((c) => c.id !== entry.id)].sort((a, b) =>
        b.weekStart.localeCompare(a.weekStart),
      ),
    }))
  }, [])
  const deleteCheckin = useCallback((entry: PhotoCheckin) => {
    for (const id of Object.values(entry.photos)) if (id) void deletePhoto(id)
    setData((d) => ({ ...d, checkins: d.checkins.filter((c) => c.id !== entry.id) }))
  }, [])

  const exportData = useCallback(async () => {
    const photos: Record<string, string> = {}
    for (const c of data.checkins) {
      for (const id of Object.values(c.photos)) {
        const url = id ? await getPhoto(id) : undefined
        if (id && url) photos[id] = url
      }
    }
    // Never write the API key into a backup file.
    const backup = { ...data, settings: { ...data.settings, apiKey: '' }, photos }
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const importData = useCallback(async (json: string) => {
    const parsed = JSON.parse(json) as Partial<FitnessData> & { photos?: Record<string, string> }
    for (const [id, url] of Object.entries(parsed.photos ?? {})) await putPhoto(id, url)
    setData((d) => {
      const next = normalize(parsed)
      return { ...next, settings: { ...next.settings, apiKey: d.settings.apiKey } }
    })
  }, [])

  const clearAll = useCallback(() => {
    void clearPhotos()
    setData((d) => ({ ...normalize({}), settings: d.settings }))
  }, [])

  return {
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
