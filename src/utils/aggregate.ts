import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { FeedEntry, SleepEntry, ToiletingEntry, TrendGranularity } from '../types'

export interface Bucket {
  start: Date
  end: Date
  label: string
}

const CONFIG: Record<TrendGranularity, { count: number; step: (d: Date) => Date; label: string }> = {
  hour: { count: 24, step: (d) => addHours(d, 1), label: 'ha' },
  day: { count: 14, step: (d) => addDays(d, 1), label: 'EEE d' },
  week: { count: 8, step: (d) => addWeeks(d, 1), label: 'MMM d' },
  month: { count: 6, step: (d) => addMonths(d, 1), label: 'MMM' },
}

function startOf(granularity: TrendGranularity, d: Date): Date {
  switch (granularity) {
    case 'hour':
      return startOfHour(d)
    case 'day':
      return startOfDay(d)
    case 'week':
      return startOfWeek(d, { weekStartsOn: 1 })
    case 'month':
      return startOfMonth(d)
  }
}

export function buildBuckets(granularity: TrendGranularity, now: Date = new Date()): Bucket[] {
  const { count, step, label } = CONFIG[granularity]
  const currentStart = startOf(granularity, now)
  const buckets: Bucket[] = []
  let cursor = currentStart
  const starts: Date[] = [cursor]
  for (let i = 1; i < count; i++) {
    cursor = stepBack(granularity, cursor)
    starts.unshift(cursor)
  }
  for (const s of starts) {
    buckets.push({ start: s, end: step(s), label: format(s, label) })
  }
  return buckets
}

function stepBack(granularity: TrendGranularity, d: Date): Date {
  switch (granularity) {
    case 'hour':
      return addHours(d, -1)
    case 'day':
      return addDays(d, -1)
    case 'week':
      return addWeeks(d, -1)
    case 'month':
      return addMonths(d, -1)
  }
}

function inBucket(iso: string, bucket: Bucket): boolean {
  const t = new Date(iso).getTime()
  return t >= bucket.start.getTime() && t < bucket.end.getTime()
}

export interface FeedBucketPoint {
  label: string
  count: number
  totalMin: number
}

export function aggregateFeeds(feeds: FeedEntry[], buckets: Bucket[]): FeedBucketPoint[] {
  return buckets.map((b) => {
    const inRange = feeds.filter((f) => inBucket(f.startTime, b))
    const totalMin = inRange.reduce(
      (sum, f) => sum + (f.left?.durationMin ?? 0) + (f.right?.durationMin ?? 0),
      0,
    )
    return { label: b.label, count: inRange.length, totalMin: Math.round(totalMin) }
  })
}

export interface SleepBucketPoint {
  label: string
  count: number
  totalHours: number
}

export function aggregateSleep(sleep: SleepEntry[], buckets: Bucket[]): SleepBucketPoint[] {
  return buckets.map((b) => {
    const inRange = sleep.filter((s) => inBucket(s.startTime, b))
    const totalMin = inRange.reduce((sum, s) => {
      const mins = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000
      return sum + Math.max(0, mins)
    }, 0)
    return { label: b.label, count: inRange.length, totalHours: Math.round((totalMin / 60) * 10) / 10 }
  })
}

export interface ToiletingBucketPoint {
  label: string
  wee: number
  poo: number
}

export function aggregateToileting(
  entries: ToiletingEntry[],
  buckets: Bucket[],
): ToiletingBucketPoint[] {
  return buckets.map((b) => {
    const inRange = entries.filter((e) => inBucket(e.time, b))
    let wee = 0
    let poo = 0
    for (const e of inRange) {
      if (e.type === 'wee' || e.type === 'both') wee++
      if (e.type === 'poo' || e.type === 'both') poo++
    }
    return { label: b.label, wee, poo }
  })
}
