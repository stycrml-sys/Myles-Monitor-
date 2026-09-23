import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import type { FitnessData, PushupEntry, WeightEntry, WeightUnit } from './types'

const KG_PER_LB = 0.45359237

// ---------- dates ----------

export function dateKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

export function weekStartKey(key: string): string {
  return dateKey(startOfWeek(parseISO(key), { weekStartsOn: 1 }))
}

export function shiftDays(key: string, days: number): string {
  return dateKey(addDays(parseISO(key), days))
}

export function formatDay(key: string): string {
  const today = dateKey()
  if (key === today) return 'Today'
  if (key === shiftDays(today, -1)) return 'Yesterday'
  return format(parseISO(key), 'EEE, MMM d')
}

export function formatWeekLabel(weekStart: string): string {
  return `Week of ${format(parseISO(weekStart), 'MMM d')}`
}

// ---------- units ----------

export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

export function unitToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB
}

export function formatWeight(kg: number, unit: WeightUnit, signed = false): string {
  const v = Math.round(kgToUnit(kg, unit) * 10) / 10
  const sign = signed && v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)} ${unit}`
}

// ---------- push-ups ----------

export function pushupTotal(e: PushupEntry): number {
  return e.sets.reduce((a, b) => a + b, 0)
}

export interface PushupWeek {
  weekStart: string
  label: string
  total: number
  daysLogged: number
  avgPerDay: number // averaged over the days push-ups were logged
  best: number
}

export function pushupWeeks(pushups: PushupEntry[], weeks = 8): PushupWeek[] {
  const current = weekStartKey(dateKey())
  const out: PushupWeek[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = shiftDays(current, -7 * i)
    const end = shiftDays(start, 7)
    const inWeek = pushups.filter((p) => p.date >= start && p.date < end)
    const totals = inWeek.map(pushupTotal)
    const total = totals.reduce((a, b) => a + b, 0)
    out.push({
      weekStart: start,
      label: format(parseISO(start), 'MMM d'),
      total,
      daysLogged: inWeek.length,
      avgPerDay: inWeek.length ? Math.round(total / inWeek.length) : 0,
      best: totals.length ? Math.max(...totals) : 0,
    })
  }
  return out
}

function pushupStreak(pushups: PushupEntry[]): number {
  const days = new Set(pushups.filter((p) => pushupTotal(p) > 0).map((p) => p.date))
  let key = dateKey()
  // Today not logged yet shouldn't break the streak.
  if (!days.has(key)) key = shiftDays(key, -1)
  let streak = 0
  while (days.has(key)) {
    streak++
    key = shiftDays(key, -1)
  }
  return streak
}

// ---------- weight ----------

export interface WeightPoint {
  date: string
  label: string
  weight: number | null // in display unit
  avg7: number | null // trailing 7-day average, display unit
}

function avgKgBetween(weights: WeightEntry[], start: string, endExclusive: string): number | null {
  const inRange = weights.filter((w) => w.date >= start && w.date < endExclusive)
  if (!inRange.length) return null
  return inRange.reduce((a, w) => a + w.weightKg, 0) / inRange.length
}

export function weightSeries(weights: WeightEntry[], unit: WeightUnit, days = 42): WeightPoint[] {
  const today = dateKey()
  const byDate = new Map(weights.map((w) => [w.date, w.weightKg]))
  const out: WeightPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = shiftDays(today, -i)
    const kg = byDate.get(date)
    const avg = avgKgBetween(weights, shiftDays(date, -6), shiftDays(date, 1))
    out.push({
      date,
      label: format(parseISO(date), 'MMM d'),
      weight: kg === undefined ? null : Math.round(kgToUnit(kg, unit) * 10) / 10,
      avg7: avg === null ? null : Math.round(kgToUnit(avg, unit) * 10) / 10,
    })
  }
  return out
}

/** Least-squares slope in kg per week over the last `days` days (null if too little data). */
export function weightRateKgPerWeek(weights: WeightEntry[], days = 28): number | null {
  const since = shiftDays(dateKey(), -(days - 1))
  const pts = weights
    .filter((w) => w.date >= since)
    .map((w) => ({ x: parseISO(w.date).getTime() / 86400000, y: w.weightKg }))
  if (pts.length < 5) return null
  const span = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))
  if (span < 7) return null
  const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length
  const my = pts.reduce((a, p) => a + p.y, 0) / pts.length
  const num = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0)
  const den = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  return den === 0 ? null : (num / den) * 7
}

// ---------- insights ----------

export type Tone = 'good' | 'warn' | 'info'

export interface Insight {
  icon: string
  tone: Tone
  text: string
}

export interface WeekSummary {
  thisWeekAvgKg: number | null
  lastWeekAvgKg: number | null
  latestKg: number | null
  rateKgPerWeek: number | null
  pushThisWeek: PushupWeek
  pushLastWeek: PushupWeek
  streak: number
}

export function weekSummary(data: FitnessData): WeekSummary {
  const today = dateKey()
  const thisWeek = weekStartKey(today)
  const lastWeek = shiftDays(thisWeek, -7)
  const weeks = pushupWeeks(data.pushups, 2)
  return {
    thisWeekAvgKg: avgKgBetween(data.weights, thisWeek, shiftDays(thisWeek, 7)),
    lastWeekAvgKg: avgKgBetween(data.weights, lastWeek, thisWeek),
    latestKg: data.weights[0]?.weightKg ?? null,
    rateKgPerWeek: weightRateKgPerWeek(data.weights),
    pushThisWeek: weeks[1],
    pushLastWeek: weeks[0],
    streak: pushupStreak(data.pushups),
  }
}

export function buildInsights(data: FitnessData): Insight[] {
  const { unit, goalWeightKg, pushupGoal } = data.settings
  const today = dateKey()
  const s = weekSummary(data)
  const out: Insight[] = []

  // --- weight ---
  const weights = data.weights // sorted newest first
  if (!weights.some((w) => w.date === today)) {
    out.push({ icon: '⚖️', tone: 'info', text: "You haven't logged today's weight yet." })
  }

  if (weights.length >= 2) {
    const [latest, prev] = weights
    const jump = latest.weightKg - prev.weightKg
    const gapDays = Math.max(
      1,
      (parseISO(latest.date).getTime() - parseISO(prev.date).getTime()) / 86400000,
    )
    if (Math.abs(jump) / prev.weightKg > 0.015 && gapDays <= 2) {
      out.push({
        icon: '💧',
        tone: 'warn',
        text: `Weight moved ${formatWeight(jump, unit, true)} since ${formatDay(prev.date).toLowerCase()}. Day-to-day swings that size are usually water, salt or food timing — watch the weekly average instead.`,
      })
    }
  }

  if (s.thisWeekAvgKg !== null && s.lastWeekAvgKg !== null) {
    const diff = s.thisWeekAvgKg - s.lastWeekAvgKg
    let tone: Tone = 'info'
    if (goalWeightKg !== null && Math.abs(diff) >= 0.05) {
      const towardGoal = Math.sign(goalWeightKg - s.lastWeekAvgKg) === Math.sign(diff)
      tone = towardGoal ? 'good' : 'warn'
    }
    out.push({
      icon: diff < 0 ? '📉' : diff > 0 ? '📈' : '➖',
      tone,
      text:
        Math.abs(diff) < 0.05
          ? `Weekly average weight is steady at ${formatWeight(s.thisWeekAvgKg, unit)}.`
          : `Weekly average is ${formatWeight(s.thisWeekAvgKg, unit)}, ${formatWeight(diff, unit, true)} vs last week.`,
    })
  }

  if (s.rateKgPerWeek !== null && s.latestKg !== null) {
    const pct = (s.rateKgPerWeek / s.latestKg) * 100
    if (pct < -1) {
      out.push({
        icon: '⚠️',
        tone: 'warn',
        text: `Losing about ${formatWeight(-s.rateKgPerWeek, unit)}/week (${Math.abs(pct).toFixed(1)}% of bodyweight). Faster than ~1%/week tends to cost muscle — consider easing off.`,
      })
    } else if (goalWeightKg !== null) {
      const remaining = goalWeightKg - s.latestKg
      if (Math.abs(remaining) < 0.3) {
        out.push({ icon: '🎯', tone: 'good', text: "You're at your goal weight. Nice work." })
      } else if (Math.sign(remaining) === Math.sign(s.rateKgPerWeek) && Math.abs(s.rateKgPerWeek) > 0.05) {
        const weeksLeft = Math.ceil(remaining / s.rateKgPerWeek)
        out.push({
          icon: '🎯',
          tone: 'good',
          text: `${formatWeight(Math.abs(remaining), unit)} to goal. At your 4-week pace (${formatWeight(s.rateKgPerWeek, unit, true)}/week) that's roughly ${weeksLeft} week${weeksLeft === 1 ? '' : 's'}.`,
        })
      } else {
        out.push({
          icon: '🎯',
          tone: 'warn',
          text: `${formatWeight(Math.abs(remaining), unit)} to goal, but the 4-week trend (${formatWeight(s.rateKgPerWeek, unit, true)}/week) isn't heading that way yet.`,
        })
      }
    }
  }

  // --- push-ups ---
  const todayPush = data.pushups.find((p) => p.date === today)
  if (!todayPush) {
    out.push({
      icon: '💪',
      tone: 'info',
      text: s.streak > 0 ? `No push-ups logged today — keep your ${s.streak}-day streak alive.` : 'No push-ups logged today yet.',
    })
  } else if (s.streak >= 3) {
    out.push({ icon: '🔥', tone: 'good', text: `${s.streak}-day push-up streak.` })
  }

  const tw = s.pushThisWeek
  const lw = s.pushLastWeek
  if (tw.daysLogged > 0 && lw.daysLogged > 0) {
    const diff = tw.avgPerDay - lw.avgPerDay
    const pct = lw.avgPerDay ? Math.round((diff / lw.avgPerDay) * 100) : 0
    out.push({
      icon: diff >= 0 ? '⬆️' : '⬇️',
      tone: diff > 0 ? 'good' : diff < 0 ? 'warn' : 'info',
      text:
        diff === 0
          ? `Averaging ${tw.avgPerDay} push-ups a day — same as last week.`
          : `Averaging ${tw.avgPerDay} push-ups a day, ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} (${pct > 0 ? '+' : ''}${pct}%) on last week.`,
    })
  }

  if (todayPush && data.pushups.length > 1) {
    const total = pushupTotal(todayPush)
    const prevBest = Math.max(...data.pushups.filter((p) => p.id !== todayPush.id).map(pushupTotal))
    if (total > prevBest) {
      out.push({ icon: '🏆', tone: 'good', text: `New daily record: ${total} push-ups (previous best ${prevBest}).` })
    }
  }

  if (pushupGoal && tw.daysLogged > 0 && tw.avgPerDay < pushupGoal) {
    out.push({
      icon: '🎯',
      tone: 'info',
      text: `${pushupGoal - tw.avgPerDay} more a day on average to hit your ${pushupGoal}/day goal this week.`,
    })
  }

  // --- photos ---
  const thisWeek = weekStartKey(today)
  const checkin = data.checkins.find((c) => c.weekStart === thisWeek)
  if (!checkin || !checkin.photos.waist || !checkin.photos.arms) {
    out.push({ icon: '📸', tone: 'info', text: "This week's waist & arm photos aren't in yet." })
  }

  return out
}
