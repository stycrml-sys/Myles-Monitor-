import {
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  isToday,
  isYesterday,
} from 'date-fns'

export function nowIso(): string {
  return new Date().toISOString()
}

export function nowDatetimeLocalValue(): string {
  return toDatetimeLocalValue(nowIso())
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString()
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'h:mm a')
}

export function formatDateHeading(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEE, MMM d')
}

export function formatDateTime(iso: string): string {
  return `${formatDateHeading(iso)}, ${formatTime(iso)}`
}

export function durationMinutesBetween(startIso: string, endIso: string): number {
  return Math.max(0, differenceInMinutes(new Date(endIso), new Date(startIso)))
}

export function formatDurationMin(totalMinutes: number): string {
  const mins = Math.round(totalMinutes)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function ageInDays(birthDateIso: string): number {
  return Math.max(0, differenceInCalendarDays(new Date(), new Date(birthDateIso)))
}

export function ageLabel(birthDateIso: string): string {
  const days = ageInDays(birthDateIso)
  if (days === 0) return 'Born today'
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} old`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? '' : 's'} old`
}

export function groupByDay<T>(items: T[], getIso: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = formatDateHeading(getIso(item))
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return Array.from(map.entries())
}
