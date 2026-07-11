import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FeedBucketPoint } from '../../utils/aggregate'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { CHART_COLORS, useIsDark } from './palette'

export function FeedTrendChart({ data }: { data: FeedBucketPoint[] }) {
  const isDark = useIsDark()
  const color = isDark ? CHART_COLORS.feed.dark : CHART_COLORS.feed.light

  return (
    <ChartCard title="Feeds — count per period">
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                    name: 'Feeds',
                    value: p.value as number,
                    color,
                  }))}
                />
              )}
            />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
