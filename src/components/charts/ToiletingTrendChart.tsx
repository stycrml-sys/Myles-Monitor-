import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ToiletingBucketPoint } from '../../utils/aggregate'
import { ChartCard, LegendDot } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS, useIsDark } from './palette'

export function ToiletingTrendChart({ data }: { data: ToiletingBucketPoint[] }) {
  const isDark = useIsDark()
  const weeColor = isDark ? CHART_COLORS.wee.dark : CHART_COLORS.wee.light
  const pooColor = isDark ? CHART_COLORS.poo.dark : CHART_COLORS.poo.light

  return (
    <ChartCard
      title="Diapers — wee vs. poo"
      legend={
        <div className="flex gap-3">
          <LegendDot color={weeColor} label="Wee" />
          <LegendDot color={pooColor} label="Poo" />
        </div>
      }
    >
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
              axisLine={{ stroke: CHART_COLORS.grid }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  label={props.label as string}
                  payload={props.payload?.map((p) => ({
                    name: p.dataKey === 'wee' ? 'Wee' : 'Poo',
                    value: p.value as number,
                    color: p.dataKey === 'wee' ? weeColor : pooColor,
                  }))}
                />
              )}
            />
            <Bar dataKey="wee" fill={weeColor} radius={[4, 4, 0, 0]} maxBarSize={12} />
            <Bar dataKey="poo" fill={pooColor} radius={[4, 4, 0, 0]} maxBarSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
