import { useCallback, useEffect, useState } from 'react'
import type { AppData, FeedEntry, SleepEntry, ToiletingEntry } from './types'

const STORAGE_KEY = 'myles-monitor:data:v1'

function defaultBirthDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 4)
  return d.toISOString().slice(0, 10)
}

function defaultData(): AppData {
  return {
    version: 1,
    baby: { name: 'Myles', birthDate: defaultBirthDate() },
    feeds: [],
    toileting: [],
    sleep: [],
  }
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      version: 1,
      baby: parsed.baby ?? defaultData().baby,
      feeds: parsed.feeds ?? [],
      toileting: parsed.toileting ?? [],
      sleep: parsed.sleep ?? [],
    }
  } catch {
    return defaultData()
  }
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const setBaby = useCallback((baby: AppData['baby']) => {
    setData((d) => ({ ...d, baby }))
  }, [])

  const addFeed = useCallback((entry: FeedEntry) => {
    setData((d) => ({ ...d, feeds: [entry, ...d.feeds] }))
  }, [])
  const updateFeed = useCallback((entry: FeedEntry) => {
    setData((d) => ({ ...d, feeds: d.feeds.map((e) => (e.id === entry.id ? entry : e)) }))
  }, [])
  const deleteFeed = useCallback((id: string) => {
    setData((d) => ({ ...d, feeds: d.feeds.filter((e) => e.id !== id) }))
  }, [])

  const addToileting = useCallback((entry: ToiletingEntry) => {
    setData((d) => ({ ...d, toileting: [entry, ...d.toileting] }))
  }, [])
  const updateToileting = useCallback((entry: ToiletingEntry) => {
    setData((d) => ({
      ...d,
      toileting: d.toileting.map((e) => (e.id === entry.id ? entry : e)),
    }))
  }, [])
  const deleteToileting = useCallback((id: string) => {
    setData((d) => ({ ...d, toileting: d.toileting.filter((e) => e.id !== id) }))
  }, [])

  const addSleep = useCallback((entry: SleepEntry) => {
    setData((d) => ({ ...d, sleep: [entry, ...d.sleep] }))
  }, [])
  const updateSleep = useCallback((entry: SleepEntry) => {
    setData((d) => ({ ...d, sleep: d.sleep.map((e) => (e.id === entry.id ? entry : e)) }))
  }, [])
  const deleteSleep = useCallback((id: string) => {
    setData((d) => ({ ...d, sleep: d.sleep.filter((e) => e.id !== id) }))
  }, [])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `myles-monitor-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const importData = useCallback((json: string) => {
    const parsed = JSON.parse(json) as Partial<AppData>
    setData({
      version: 1,
      baby: parsed.baby ?? defaultData().baby,
      feeds: parsed.feeds ?? [],
      toileting: parsed.toileting ?? [],
      sleep: parsed.sleep ?? [],
    })
  }, [])

  const clearAll = useCallback(() => {
    setData((d) => ({ ...defaultData(), baby: d.baby }))
  }, [])

  return {
    data,
    setBaby,
    addFeed,
    updateFeed,
    deleteFeed,
    addToileting,
    updateToileting,
    deleteToileting,
    addSleep,
    updateSleep,
    deleteSleep,
    exportData,
    importData,
    clearAll,
  }
}
