import { estimateLocally, splitFoods } from './foodTable'
import type { Platform } from './platform'

export interface FoodEstimate {
  name: string
  calories: number | null // null: couldn't estimate, ask the user
  source: 'table' | 'claude' | 'manual'
}

export const FOOD_PROMPT = (text: string) => `Estimate the calories in food someone just logged in their fitness tracker.

What they ate: "${text}"

Split it into the separate foods or drinks it contains (keep a single dish as one item). \
Use the quantities given; otherwise assume a typical single portion. Calories are whole kcal \
numbers, your best realistic estimate. Keep each name short and in the user's words, with the \
quantity (e.g. "2 scrambled eggs").

Reply with only JSON in this shape:
{"items": [{"name": "2 scrambled eggs", "calories": 200}]}`

export interface ClaudeItems {
  items: { name: string; calories: number }[]
}

function cleanItems(raw: unknown): FoodEstimate[] | null {
  const items = (raw as Partial<ClaudeItems> | null)?.items
  if (!Array.isArray(items)) return null
  const out = items
    .filter((i) => i && typeof i.name === 'string' && i.name.trim() && Number.isFinite(Number(i.calories)))
    .map((i) => ({ name: i.name.trim(), calories: Math.max(0, Math.round(Number(i.calories))), source: 'claude' as const }))
  return out.length ? out : null
}

/**
 * Turn what the user typed into one or more food entries with calories.
 * Simple, fully understood foods use the built-in table (instant, free).
 * Anything else goes to Claude when available; otherwise loose table matches
 * are used and unknown foods come back with `calories: null`.
 * `note` explains when the estimate fell back.
 */
export async function estimateFoods(
  text: string,
  opts: { platform: Platform; apiKey: string },
): Promise<{ items: FoodEstimate[]; note: string | null }> {
  const pieces = splitFoods(text)
  const local = pieces.map((p) => ({ piece: p, est: estimateLocally(p) }))
  const fromTable = (): FoodEstimate[] =>
    local.map(({ piece, est }) => ({
      name: piece,
      calories: est ? est.calories : null,
      source: est ? ('table' as const) : ('manual' as const),
    }))

  if (local.every(({ est }) => est?.exact)) return { items: fromTable(), note: null }

  const canAsk = !!opts.platform.askJson || !!opts.apiKey
  if (canAsk) {
    try {
      let raw: unknown
      if (opts.platform.askJson) raw = await opts.platform.askJson(FOOD_PROMPT(text))
      else {
        // Loaded on demand so the Claude SDK isn't in the initial bundle.
        const { askFoodCalories } = await import('./foodClaude')
        raw = await askFoodCalories(opts.apiKey, FOOD_PROMPT(text))
      }
      const items = cleanItems(raw)
      if (items) return { items, note: null }
    } catch (e) {
      const items = fromTable()
      return { items, note: e instanceof Error ? e.message : "Couldn't reach Claude for an estimate." }
    }
  }

  const items = fromTable()
  const missing = items.some((i) => i.calories === null)
  const loose = local.some(({ est }) => est && !est.exact)
  return {
    items,
    note: missing
      ? canAsk
        ? "Couldn't estimate everything. Enter the missing calories."
        : "Not in the built-in food list. Enter the calories, or add a Claude API key in Settings for automatic estimates."
      : loose
        ? 'Rough estimate from a similar food. Tap the number to adjust.'
        : null,
  }
}
