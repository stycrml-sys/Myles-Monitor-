import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { StatTile } from '../../components/charts/StatTile'
import { ChartCard, LegendDot } from '../../components/charts/ChartCard'
import { ChartTooltip } from '../../components/charts/ChartTooltip'
import { CHART_COLORS, useIsDark } from '../../components/charts/palette'
import { EmptyState } from '../../components/ui/EntryRow'
import { InsightList } from '../components/Chrome'
import {
  buildInsights,
  formatWeight,
  kgToUnit,
  pushupTotal,
  pushupWeeks,
  shiftDays,
  weekSummary,
  weightSeries,
} from '../insights'
import type { FitnessData } from '../types'

type Range = '28' | '56' | '84'

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '28', label: '4 weeks' },
  { value: '56', label: '8 weeks' },
  { value: '84', label: '12 weeks' },
]

export function TrendsScreen({ data }: { data: FitnessData }) {
  const isDark = useIsDark()
  const weightColor = isDark ? CHART_COLORS.feed.dark : CHART_COLORS.feed.light
  const pushColor = isDark ? CHART_COLORS.sleep.dark : CHART_COLORS.sleep.light
  const { unit, goalWeightKg, pushupGoal } = data.settings

  const [range, setRange] = useState<Range>('56')
  const days = Number(range)

  const series = useMemo(() => weightSeries(data.weights, unit, days), [data.weights, unit, days])
  const weeks = useMemo(() => pushupWeeks(data.pushups, days / 7), [data.pushups, days])
  const summary = useMemo(() => weekSummary(data), [data])
  const insights = useMemo(() => buildInsights(data), [data])

  const weeklyRows = useMemo(
    () =>
      weeks
        .map((w) => {
          const ws = data.weights.filter((x) => x.date >= w.weekStart && x.date < shiftDays(w.weekStart, 7))
          return {
            ...w,
            avgKg: ws.length ? ws.reduce((a, x) => a + x.weightKg, 0) / ws.length : null,
            weighIns: ws.length,
          }
        })
        .reverse(),
    [weeks, data.weights],
  )

  const bestDay = data.pushups.length ? Math.max(...data.pushups.map(pushupTotal)) : 0
  const goalInUnit = goalWeightKg !== null ? Math.round(kgToUnit(goalWeightKg, unit) * 10) / 10 : null

  const hasData = data.weights.length > 0 || data.pushups.length > 0
  if (!hasData) {
    return (
      <div className="p-4">
        <EmptyState icon="📈" text="Log a few days of weight and push-ups to see your trends here." />
      </div>
    )
  }

  const weekDiff =
    summary.thisWeekAvgKg !== null && summary.lastWeekAvgKg !== null
      ? summary.thisWeekAvgKg - summary.lastWeekAvgKg
      : null
  const pushDiff =
    summary.pushThisWeek.daysLogged && summary.pushLastWeek.daysLogged
      ? summary.pushThisWeek.avgPerDay - summary.pushLastWeek.avgPerDay
      : null

  // The shared grid color is tuned for light surfaces; use a recessive one in dark mode.
  const grid = isDark ? '#2a2838' : CHART_COLORS.grid
  const surface = isDark ? '#0f172a' : '#ffffff'
  const axisTick = { fontSize: 10, fill: CHART_COLORS.axis }
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  return (
    <div className="flex flex-col gap-4 p-4">
      <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          icon="⚖️"
          label="Latest weight"
          value={summary.latestKg !== null ? formatWeight(summary.latestKg, unit) : '—'}
          sub={
            summary.rateKgPerWeek !== null
              ? `${formatWeight(summary.rateKgPerWeek, unit, true)}/wk (4-wk trend)`
              : undefined
          }
        />
        <StatTile
          icon="📊"
          label="This week's avg"
          value={summary.thisWeekAvgKg !== null ? formatWeight(summary.thisWeekAvgKg, unit) : '—'}
          sub={weekDiff !== null ? `${formatWeight(weekDiff, unit, true)} vs last week` : undefined}
        />
        <StatTile
          icon="💪"
          label="Push-ups / day"
          value={summary.pushThisWeek.daysLogged ? String(summary.pushThisWeek.avgPerDay) : '—'}
          sub={
            pushDiff !== null
              ? `${pushDiff > 0 ? '+' : ''}${pushDiff} vs last week`
              : `${summary.pushThisWeek.daysLogged}/7 days this week`
          }
        />
        <StatTile
          icon="🏆"
          label="Best day"
          value={String(bestDay)}
          sub={summary.streak > 0 ? `${summary.streak}-day streak` : undefined}
        />
      </div>

      <ChartCard
        title={`Weight (${unit})`}
        legend={
          <div className="flex gap-3">
            <LegendDot color={weightColor} label="Daily" />
            <LegendDot color={weightColor} label="7-day avg" />
          </div>
        }
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={grid} />
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: grid }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              {goalInUnit !== null && (
                <ReferenceLine
                  y={goalInUnit}
                  stroke={CHART_COLORS.axis}
                  strokeDasharray="4 4"
                  label={{ value: 'Goal', position: 'insideTopRight', fontSize: 10, fill: CHART_COLORS.axis }}
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip
                cursor={{ stroke: grid }}
                content={(props) => (
                  <ChartTooltip
                    active={props.active}
                    label={props.label as string}
                    payload={props.payload
                      ?.filter((p) => p.value !== null && p.value !== undefined)
                      .map((p) => ({
                        name: p.dataKey === 'avg7' ? '7-day avg' : 'Weigh-in',
                        value: `${p.value} ${unit}`,
                        color: weightColor,
                      }))}
                  />
                )}
              />
              <Line
                dataKey="weight"
                stroke="none"
                dot={{ r: 3, fill: weightColor, fillOpacity: 0.35, stroke: 'none' }}
                activeDot={{ r: 5, fill: weightColor, stroke: surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line
                dataKey="avg7"
                stroke={weightColor}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Push-ups — average per day, by week">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={grid} />
              <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: grid }} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
              {pushupGoal ? (
                <ReferenceLine
                  y={pushupGoal}
                  stroke={CHART_COLORS.axis}
                  strokeDasharray="4 4"
                  label={{ value: 'Goal', position: 'insideTopRight', fontSize: 10, fill: CHART_COLORS.axis }}
                  ifOverflow="extendDomain"
                />
              ) : null}
              <Tooltip
                cursor={{ fill: cursorFill }}
                content={(props) => {
                  const w = props.payload?.[0]?.payload as (typeof weeks)[number] | undefined
                  return (
                    <ChartTooltip
                      active={props.active}
                      label={`Week of ${props.label as string}`}
                      payload={
                        w
                          ? [
                              { name: 'Avg / day', value: w.avgPerDay, color: pushColor },
                              { name: 'Total', value: w.total, color: pushColor },
                              { name: 'Days logged', value: `${w.daysLogged}/7`, color: pushColor },
                            ]
                          : []
                      }
                    />
                  )
                }}
              />
              <Bar dataKey="avgPerDay" fill={pushColor} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <h3 className="px-4 pb-2 pt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Week by week
        </h3>
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-1.5 font-medium">Week</th>
              <th className="py-1.5 font-medium">Avg weight</th>
              <th className="py-1.5 font-medium">Change</th>
              <th className="px-4 py-1.5 text-right font-medium">Push-ups/day</th>
            </tr>
          </thead>
          <tbody>
            {weeklyRows.map((row, i) => {
              const prev = weeklyRows[i + 1]
              const change = row.avgKg !== null && prev?.avgKg != null ? row.avgKg - prev.avgKg : null
              return (
                <tr key={row.weekStart} className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  <td className="px-4 py-2">{row.label}</td>
                  <td className="py-2">{row.avgKg !== null ? formatWeight(row.avgKg, unit) : '—'}</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">
                    {change !== null ? formatWeight(change, unit, true) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.daysLogged ? (
                      <>
                        {row.avgPerDay}
                        <span className="ml-1 text-[11px] text-slate-400">({row.daysLogged}d)</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Insights</h2>
        <InsightList insights={insights} />
      </div>
    </div>
  )
}
