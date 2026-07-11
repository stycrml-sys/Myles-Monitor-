export type Side = 'left' | 'right'

export type FeedExtent = 'little' | 'some' | 'full'

export interface FeedSideDetail {
  durationMin: number
  extent: FeedExtent
}

export interface FeedEntry {
  id: string
  kind: 'feed'
  startTime: string // ISO datetime
  endTime: string // ISO datetime
  left: FeedSideDetail | null
  right: FeedSideDetail | null
  comment: string
  createdAt: string
  updatedAt: string
}

export type ToiletingType = 'wee' | 'poo' | 'both'

export type PooColour =
  | 'black' // meconium
  | 'dark-green'
  | 'green'
  | 'yellow'
  | 'brown'
  | 'red'
  | 'white-pale'

export type PooConsistency = 'sticky-tarry' | 'seedy-soft' | 'runny' | 'formed' | 'hard'

export interface ToiletingEntry {
  id: string
  kind: 'toileting'
  time: string // ISO datetime
  type: ToiletingType
  pooColour: PooColour | null
  pooConsistency: PooConsistency | null
  comment: string
  createdAt: string
  updatedAt: string
}

export type SleepQuality = 1 | 2 | 3 | 4 | 5

export interface SleepEntry {
  id: string
  kind: 'sleep'
  startTime: string // ISO datetime
  endTime: string // ISO datetime
  quality: SleepQuality
  interruptions: number
  interruptionNotes: string
  comment: string
  createdAt: string
  updatedAt: string
}

export type AnyEntry = FeedEntry | ToiletingEntry | SleepEntry

export interface BabyProfile {
  name: string
  birthDate: string // ISO date (yyyy-mm-dd)
}

export interface AppData {
  version: 1
  baby: BabyProfile
  feeds: FeedEntry[]
  toileting: ToiletingEntry[]
  sleep: SleepEntry[]
}

export type TabKey = 'feed' | 'toileting' | 'sleep' | 'trends'

export type TrendGranularity = 'hour' | 'day' | 'week' | 'month'
