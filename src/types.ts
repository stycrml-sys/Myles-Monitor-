export type WeightUnit = 'kg' | 'lb'

export interface WeightEntry {
  id: string
  date: string // yyyy-mm-dd (one entry per day)
  weightKg: number
  comment: string
}

export interface PushupEntry {
  id: string
  date: string // yyyy-mm-dd
  sets: number[] // reps per set
  comment: string
}

export interface FoodEntry {
  id: string
  date: string // yyyy-mm-dd
  time: string // ISO datetime it was logged, for ordering within the day
  name: string
  calories: number | null // null until estimated or entered
  source: 'table' | 'claude' | 'manual'
}

export type BodyArea = 'waist' | 'arms'

export interface PhotoCheckin {
  id: string
  weekStart: string // yyyy-mm-dd (Monday of the week)
  date: string // yyyy-mm-dd the photos were taken
  // Photo blobs live in IndexedDB under these keys.
  photos: Partial<Record<BodyArea, string>>
  comment: string
  aiNotes: string | null
  aiNotesAt: string | null
}

export interface FitnessSettings {
  name: string
  unit: WeightUnit
  goalWeightKg: number | null
  pushupGoal: number | null // daily reps
  calorieGoal: number | null // daily kcal
  apiKey: string
}

export interface FitnessData {
  version: 1
  settings: FitnessSettings
  weights: WeightEntry[]
  pushups: PushupEntry[]
  foods: FoodEntry[] // newest first
  checkins: PhotoCheckin[]
}

export type FitnessTab = 'today' | 'photos' | 'trends'
