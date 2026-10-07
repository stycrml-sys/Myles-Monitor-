// A small built-in table of common foods for instant, offline calorie
// estimates. Values are typical figures (kcal) for one usual serving, plus
// kcal per 100 g where weighing makes sense. Anything not matched here is
// estimated by Claude when that's available (see foodEstimate.ts).

export interface FoodRow {
  names: string[] // first is the display name; all are matched
  serving: string // what one unit means
  kcal: number // per one serving
  per100g?: number
}

export const FOODS: FoodRow[] = [
  // Fruit
  { names: ['apple', 'apples'], serving: 'medium', kcal: 95, per100g: 52 },
  { names: ['banana', 'bananas'], serving: 'medium', kcal: 105, per100g: 89 },
  { names: ['orange', 'oranges'], serving: 'medium', kcal: 62, per100g: 47 },
  { names: ['pear', 'pears'], serving: 'medium', kcal: 100, per100g: 57 },
  { names: ['peach', 'peaches'], serving: 'medium', kcal: 59, per100g: 39 },
  { names: ['plum', 'plums'], serving: 'medium', kcal: 30, per100g: 46 },
  { names: ['kiwi', 'kiwis', 'kiwi fruit'], serving: 'medium', kcal: 42, per100g: 61 },
  { names: ['mandarin', 'mandarins', 'clementine', 'clementines', 'satsuma', 'satsumas'], serving: 'medium', kcal: 35, per100g: 53 },
  { names: ['grapes', 'grape'], serving: 'cup', kcal: 104, per100g: 69 },
  { names: ['strawberries', 'strawberry'], serving: 'cup', kcal: 49, per100g: 32 },
  { names: ['blueberries', 'blueberry'], serving: 'cup', kcal: 84, per100g: 57 },
  { names: ['raspberries', 'raspberry'], serving: 'cup', kcal: 64, per100g: 52 },
  { names: ['mango', 'mangoes', 'mangos'], serving: 'medium', kcal: 200, per100g: 60 },
  { names: ['pineapple'], serving: 'cup', kcal: 82, per100g: 50 },
  { names: ['watermelon'], serving: 'cup', kcal: 46, per100g: 30 },
  { names: ['avocado', 'avocados'], serving: 'medium', kcal: 240, per100g: 160 },
  // Vegetables
  { names: ['carrot', 'carrots'], serving: 'medium', kcal: 25, per100g: 41 },
  { names: ['broccoli'], serving: 'cup', kcal: 31, per100g: 34 },
  { names: ['salad', 'side salad', 'green salad'], serving: 'side', kcal: 20 },
  { names: ['tomato', 'tomatoes'], serving: 'medium', kcal: 22, per100g: 18 },
  { names: ['cucumber'], serving: 'cup', kcal: 16, per100g: 15 },
  { names: ['potato', 'potatoes', 'baked potato', 'jacket potato'], serving: 'medium', kcal: 160, per100g: 93 },
  { names: ['sweet potato', 'sweet potatoes'], serving: 'medium', kcal: 112, per100g: 86 },
  { names: ['corn', 'sweetcorn'], serving: 'cup', kcal: 132, per100g: 96 },
  { names: ['peas'], serving: 'cup', kcal: 118, per100g: 81 },
  { names: ['spinach'], serving: 'cup', kcal: 7, per100g: 23 },
  // Eggs, dairy
  { names: ['egg', 'eggs', 'boiled egg', 'boiled eggs', 'poached egg', 'poached eggs'], serving: 'large', kcal: 78, per100g: 143 },
  { names: ['fried egg', 'fried eggs'], serving: 'large', kcal: 90 },
  { names: ['scrambled eggs', 'scrambled egg'], serving: '2 eggs', kcal: 200 },
  { names: ['omelette', 'omelet'], serving: '2-egg', kcal: 190 },
  { names: ['milk'], serving: 'cup (250 ml)', kcal: 125, per100g: 50 },
  { names: ['skim milk', 'skimmed milk'], serving: 'cup (250 ml)', kcal: 85, per100g: 34 },
  { names: ['greek yogurt', 'greek yoghurt'], serving: 'pot (170 g)', kcal: 150, per100g: 97 },
  { names: ['yogurt', 'yoghurt'], serving: 'pot (150 g)', kcal: 110, per100g: 72 },
  { names: ['cheese', 'cheddar'], serving: 'slice (30 g)', kcal: 120, per100g: 403 },
  { names: ['cottage cheese'], serving: 'half cup', kcal: 110, per100g: 98 },
  { names: ['butter'], serving: 'tbsp', kcal: 100, per100g: 717 },
  // Bread, grains
  { names: ['toast', 'slice of toast', 'slices of toast'], serving: 'slice', kcal: 80, per100g: 265 },
  { names: ['bread', 'slice of bread', 'slices of bread'], serving: 'slice', kcal: 80, per100g: 265 },
  { names: ['bagel', 'bagels'], serving: 'whole', kcal: 270 },
  { names: ['croissant', 'croissants'], serving: 'medium', kcal: 230 },
  { names: ['muffin', 'muffins'], serving: 'medium', kcal: 400 },
  { names: ['wrap', 'tortilla'], serving: 'large', kcal: 200 },
  { names: ['rice', 'white rice', 'cooked rice'], serving: 'cup cooked', kcal: 205, per100g: 130 },
  { names: ['brown rice'], serving: 'cup cooked', kcal: 216, per100g: 123 },
  { names: ['pasta', 'spaghetti', 'penne'], serving: 'cup cooked', kcal: 220, per100g: 158 },
  { names: ['oats', 'porridge', 'oatmeal'], serving: 'bowl (40 g oats)', kcal: 150, per100g: 389 },
  { names: ['cereal', 'bowl of cereal'], serving: 'bowl with milk', kcal: 250 },
  { names: ['granola'], serving: 'half cup', kcal: 300, per100g: 470 },
  { names: ['quinoa'], serving: 'cup cooked', kcal: 222, per100g: 120 },
  // Meat, fish, protein
  { names: ['chicken breast', 'chicken'], serving: 'breast (170 g)', kcal: 280, per100g: 165 },
  { names: ['steak', 'beef steak'], serving: '8 oz (225 g)', kcal: 610, per100g: 271 },
  { names: ['mince', 'ground beef'], serving: '100 g', kcal: 250, per100g: 250 },
  { names: ['salmon', 'salmon fillet'], serving: 'fillet (150 g)', kcal: 310, per100g: 208 },
  { names: ['tuna', 'tin of tuna', 'can of tuna'], serving: 'can (120 g)', kcal: 140, per100g: 116 },
  { names: ['bacon', 'rasher of bacon', 'rashers of bacon', 'bacon rasher', 'bacon rashers'], serving: 'rasher', kcal: 45 },
  { names: ['sausage', 'sausages'], serving: 'link', kcal: 170 },
  { names: ['ham', 'slice of ham'], serving: 'slice', kcal: 30 },
  { names: ['turkey'], serving: '100 g', kcal: 135, per100g: 135 },
  { names: ['tofu'], serving: 'half block (200 g)', kcal: 150, per100g: 76 },
  { names: ['beans', 'baked beans'], serving: 'half can', kcal: 160, per100g: 80 },
  { names: ['lentils'], serving: 'cup cooked', kcal: 230, per100g: 116 },
  { names: ['protein shake', 'protein powder', 'scoop of protein'], serving: 'scoop', kcal: 120 },
  { names: ['protein bar'], serving: 'bar', kcal: 200 },
  // Nuts, spreads, snacks
  { names: ['almonds'], serving: 'handful (28 g)', kcal: 165, per100g: 579 },
  { names: ['peanuts'], serving: 'handful (28 g)', kcal: 160, per100g: 567 },
  { names: ['nuts', 'mixed nuts'], serving: 'handful (28 g)', kcal: 170, per100g: 607 },
  { names: ['peanut butter'], serving: 'tbsp', kcal: 95, per100g: 588 },
  { names: ['jam'], serving: 'tbsp', kcal: 55 },
  { names: ['honey'], serving: 'tbsp', kcal: 64 },
  { names: ['crisps', 'chips', 'bag of crisps'], serving: 'small bag (30 g)', kcal: 160, per100g: 536 },
  { names: ['chocolate', 'chocolate bar'], serving: 'bar (45 g)', kcal: 235, per100g: 535 },
  { names: ['biscuit', 'biscuits', 'cookie', 'cookies'], serving: 'one', kcal: 75 },
  { names: ['popcorn'], serving: 'cup popped', kcal: 31 },
  { names: ['rice cake', 'rice cakes'], serving: 'one', kcal: 35 },
  // Meals, takeaway
  { names: ['pizza', 'slice of pizza', 'slices of pizza'], serving: 'slice', kcal: 285 },
  { names: ['burger', 'hamburger', 'cheeseburger'], serving: 'one', kcal: 550 },
  { names: ['fries', 'french fries', 'chips portion'], serving: 'medium portion', kcal: 365 },
  { names: ['sandwich'], serving: 'one', kcal: 400 },
  { names: ['burrito'], serving: 'one', kcal: 700 },
  { names: ['sushi', 'sushi roll'], serving: 'roll (6 pieces)', kcal: 250 },
  { names: ['soup', 'bowl of soup'], serving: 'bowl', kcal: 200 },
  { names: ['curry', 'chicken curry'], serving: 'portion', kcal: 500 },
  { names: ['fish and chips'], serving: 'portion', kcal: 900 },
  // Drinks
  { names: ['coffee', 'black coffee', 'americano', 'espresso'], serving: 'cup', kcal: 3 },
  { names: ['latte'], serving: 'medium', kcal: 190 },
  { names: ['cappuccino', 'flat white'], serving: 'medium', kcal: 130 },
  { names: ['tea'], serving: 'cup with milk', kcal: 20 },
  { names: ['orange juice', 'juice'], serving: 'glass (250 ml)', kcal: 110 },
  { names: ['coke', 'cola', 'soda', 'soft drink', 'can of coke'], serving: 'can (330 ml)', kcal: 140 },
  { names: ['diet coke', 'diet soda', 'coke zero', 'water', 'sparkling water'], serving: 'one', kcal: 0 },
  { names: ['beer', 'pint of beer', 'pint', 'lager'], serving: 'pint', kcal: 210 },
  { names: ['wine', 'glass of wine', 'red wine', 'white wine'], serving: 'glass (175 ml)', kcal: 160 },
  { names: ['smoothie'], serving: 'medium', kcal: 250 },
]

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  half: 0.5, quarter: 0.25, couple: 2, few: 3, some: 1, dozen: 12,
}

// Index every alias, longest first, so "sweet potato" beats "potato".
const ALIASES = FOODS.flatMap((row) => row.names.map((name) => ({ name, row }))).sort(
  (a, b) => b.name.length - a.name.length,
)

export interface LocalEstimate {
  name: string
  calories: number
  detail: string // how the estimate was reached, e.g. "2 × large"
  /** True when every word was understood; false for a loose match such as
   * "chicken caesar wrap" matching only "chicken". */
  exact: boolean
}

// Words that can surround a food without changing what it is.
const FILLER = new Set([
  'of', 'medium', 'large', 'big', 'small', 'little', 'regular', 'fresh', 'whole', 'cup', 'cups',
  'slice', 'slices', 'piece', 'pieces', 'portion', 'serving', 'bowl', 'glass', 'g', 'grams', 'gram',
  'gr', 'handful', 'x', 'my', 'ate', 'had', 'i', 'some',
])

/** Estimate one simple food phrase ("an apple", "2 eggs", "150g rice"). */
export function estimateLocally(text: string): LocalEstimate | null {
  const s = ` ${text.toLowerCase().replace(/[^a-z0-9.\s/]/g, ' ').replace(/\s+/g, ' ').trim()} `
  const match = ALIASES.find(({ name }) => s.includes(` ${name} `))
  if (!match) return null
  const { row } = match
  const leftover = s
    .replace(` ${match.name} `, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && !FILLER.has(w) && !(w in NUMBER_WORDS) && !/^[\d./]+(g)?$/.test(w))
  const exact = leftover.length === 0

  // Grams ("150g", "150 g", "150 grams").
  const grams = /(\d+(?:\.\d+)?)\s*(?:g|grams?|gr)\b/.exec(s)
  if (grams && row.per100g) {
    const g = parseFloat(grams[1])
    return { name: text.trim(), calories: Math.round((g * row.per100g) / 100), detail: `${g} g`, exact }
  }

  // Count: a digit, a fraction, or a number word before the food.
  let qty = 1
  const before = s.slice(0, s.indexOf(` ${match.name} `)).trim().split(' ')
  let seen = false
  for (const word of before) {
    if (/^\d+(\.\d+)?$/.test(word)) qty = parseFloat(word)
    else if (/^\d+\/\d+$/.test(word)) {
      const [n, d] = word.split('/').map(Number)
      if (d) qty = n / d
    } else if (word === 'half' && seen) qty += 0.5 // "one and a half"
    else if (word in NUMBER_WORDS) {
      // "half a banana": the article after "half" doesn't reset the count.
      if (seen && ['a', 'an', 'some'].includes(word)) continue
      qty = NUMBER_WORDS[word]
    } else continue
    seen = true
  }
  if (/\b(large|big)\b/.test(s)) qty *= 1.3
  else if (/\b(small|little)\b/.test(s)) qty *= 0.7

  const detail = qty === 1 ? `1 ${row.serving}` : `${+qty.toFixed(2)} × ${row.serving}`
  return { name: text.trim(), calories: Math.round(qty * row.kcal), detail, exact }
}

/** Split "2 eggs, toast and a coffee" into separate food phrases. */
export function splitFoods(text: string): string[] {
  return text
    .split(/,|\+|&|\band\b|\bwith\b|\bplus\b|\n/i)
    .map((p) => p.trim())
    .filter(Boolean)
}
