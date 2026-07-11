import { useMemo, useState } from 'react'
import type { FeedEntry, SleepEntry, ToiletingEntry, TrendGranularity } from '../types'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { StatTile } from '../components/charts/StatTile'
import { FeedTrendChart } from '../components/charts/FeedTrendChart'
import { SleepTrendChart } from '../components/charts/SleepTrendChart'
import { ToiletingTrendChart } from '../components/charts/ToiletingTrendChart'
import { EmptyState } from '../components/ui/EntryRow'
import {
  aggregateFeeds,
  aggregateSleep,
  aggregateToileting,
  buildBuckets,
} from '../utils/aggregate'
import { formatDurationMin } from '../utils/time'

const GRANULARITY_OPTIONS: { value: TrendGranularity; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const RANGE_HINT: Record<TrendGranularity, string> = {
  hour: 'Last 24 hours',
  day: 'Last 14 days',
  week: 'Last 8 weeks',
  month: 'Last 6 months',
}

export function TrendsScreen({
  feeds,
  toileting,
  sleep,
}: {
  feeds: FeedEntry[]
  toileting: ToiletingEntry[]
  sleep: SleepEntry[]
}) {
  const [granularity, setGranularity] = useState<TrendGranularity>('day')

  const buckets = useMemo(() => buildBuckets(granularity), [granularity])
  const rangeStart = buckets[0]?.start
  const rangeEnd = buckets[buckets.length - 1]?.end

  const feedsInRange = useMemo(
    () => feeds.filter((f) => rangeStart && rangeEnd && new Date(f.startTime) >= rangeStart && new Date(f.startTime) < rangeEnd),
    [feeds, rangeStart, rangeEnd],
  )
  const sleepInRange = useMemo(
    () => sleep.filter((s) => rangeStart && rangeEnd && new Date(s.startTime) >= rangeStart && new Date(s.startTime) < rangeEnd),
    [sleep, rangeStart, rangeEnd],
  )
  const toiletingInRange = useMemo(
    () => toileting.filter((t) => rangeStart && rangeEnd && new Date(t.time) >= rangeStart && new Date(t.time) < rangeEnd),
    [toileting, rangeStart, rangeEnd],
  )

  const feedData = useMemo(() => aggregateFeeds(feeds, buckets), [feeds, buckets])
  const sleepData = useMemo(() => aggregateSleep(sleep, buckets), [sleep, buckets])
  const toiletingData = useMemo(() => aggregateToileting(toileting, buckets), [toileting, buckets])

  const avgFeedGapMin = useMemo(() => {
    const starts = feedsInRange
      .map((f) => new Date(f.startTime).getTime())
      .sort((a, b) => a - b)
    if (starts.length < 2) return null
    const gaps = starts.slice(1).map((t, i) => (t - starts[i]) / 60000)
    return gaps.reduce((a, b) => a + b, 0) / gaps.length
  }, [feedsInRange])

  const totalSleepHours =
    Math.round(
      sleepInRange.reduce(
        (sum, s) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000,
        0,
      ) * 10,
    ) / 10

  const totalFeedMin = feedsInRange.reduce(
    (sum, f) => sum + (f.left?.durationMin ?? 0) + (f.right?.durationMin ?? 0),
    0,
  )

  const weeCount = toiletingInRange.filter((t) => t.type === 'wee' || t.type === 'both').length
  const pooCount = toiletingInRange.filter((t) => t.type === 'poo' || t.type === 'both').length

  const hasAnyData = feeds.length > 0 || sleep.length > 0 || toileting.length > 0

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <SegmentedControl
          options={GRANULARITY_OPTIONS}
          value={granularity}
          onChange={setGranularity}
        />
        <p className="text-center text-xs text-slate-400">{RANGE_HINT[granularity]}</p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon="📈"
          text="Log a few feeds, diapers and sleeps to start seeing patterns here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon="🍼"
              label="Feeds"
              value={String(feedsInRange.length)}
              sub={totalFeedMin > 0 ? `${formatDurationMin(totalFeedMin)} total` : undefined}
            />
            <StatTile
              icon="⏱"
              label="Avg. gap between feeds"
              value={avgFeedGapMin ? formatDurationMin(avgFeedGapMin) : '—'}
            />
            <StatTile
              icon="😴"
              label="Sleep"
              value={`${totalSleepHours}h`}
              sub={`${sleepInRange.length} session${sleepInRange.length === 1 ? '' : 's'}`}
            />
            <StatTile
              icon="🧷"
              label="Diapers"
              value={String(weeCount + pooCount)}
              sub={`${weeCount} wee · ${pooCount} poo`}
            />
          </div>

          <FeedTrendChart data={feedData} />
          <SleepTrendChart data={sleepData} />
          <ToiletingTrendChart data={toiletingData} />
        </>
      )}
    </div>
  )
}
