// ─────────────────────────────────────────────────────────────────────────
// The eight dimensions of a day fully lived. Drives the Reflection flow:
// morning intention → daily check-in → Day Reflected summary.
// ─────────────────────────────────────────────────────────────────────────

import { MS_DAY, dateKey, endOfDay, startOfDay } from '../engine/time'

export interface Dimension {
  id: string
  name: string
  icon: string
  /** One-line description shown on the check-in card. */
  desc: string
  /** Three concrete suggestions for the morning intention card. */
  actions: [string, string, string]
  /** Reference-page explanation: what it means, why it matters, in practice. */
  long: string
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 'body',
    name: 'Body',
    icon: '💪',
    desc: 'Move, sweat, fuel, and rest the physical you.',
    actions: ['Take a brisk 15-minute walk', 'Stretch for 5 minutes', 'Drink a full glass of water now'],
    long: 'This is how you treat the vessel you live in. It covers movement, rest, and nourishment — not as obligations but as acts of care. A Body day doesn’t require a gym. It requires intention: a walk, a meal cooked with thought, eight hours of sleep prioritized over a scroll.',
  },
  {
    id: 'mind',
    name: 'Mind',
    icon: '🧠',
    desc: 'Learn, focus, and sharpen your thinking.',
    actions: ['Read 10 pages of a book', 'Do one task phone-free', 'Learn one new thing today'],
    long: 'This is the dimension of growth and discomfort. You pushed your thinking, learned something that challenged you, or sat with a hard question instead of avoiding it. The mind atrophies when it’s only consuming comfort. This dimension asks you to exercise it.',
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: '❤️',
    desc: 'Feel, process, and tend your emotions.',
    actions: ['Name one feeling out loud', 'Write down what’s weighing on you', 'Sit with a hard emotion for 2 min'],
    long: 'You felt something real today and didn’t immediately suppress it. This dimension isn’t about being emotional — it’s about being honest. Joy, grief, gratitude, longing — all of it counts. The only thing that disqualifies a Heart day is numbness by choice.',
  },
  {
    id: 'soul',
    name: 'Soul',
    icon: '✨',
    desc: 'Reach for meaning, faith, the bigger picture.',
    actions: ['Pray or meditate for 5 minutes', 'Step outside and notice one thing', 'Write one line of gratitude'],
    long: 'A moment of awe, stillness, or wonder that reminded you life is larger than your to-do list. This could be a sunset, a piece of music, a conversation that left you quiet. Soul days aren’t planned — they’re noticed.',
  },
  {
    id: 'create',
    name: 'Create',
    icon: '🎨',
    desc: 'Make something that wasn’t there before.',
    actions: ['Sketch, write, or build for 10 min', 'Capture one idea in your notes', 'Finish a small creative piece'],
    long: 'You made something that didn’t exist before. It doesn’t have to be good or finished or shared. A voice memo, a sketch, a paragraph, a meal with intention — creation is the act, not the output.',
  },
  {
    id: 'connect',
    name: 'Connect',
    icon: '🤝',
    desc: 'Reach toward the people who matter.',
    actions: ['Text someone you miss', 'Call a friend or family member', 'Truly listen to one person today'],
    long: 'You had a genuine human moment with someone. Not small talk, not a transaction — something real. A conversation where you were actually present. Connection is the dimension most people think they’re getting but aren’t.',
  },
  {
    id: 'give',
    name: 'Give',
    icon: '🎁',
    desc: 'Offer something to someone else.',
    actions: ['Do one small favor unasked', 'Give a genuine compliment', 'Help someone, no scorekeeping'],
    long: 'You did something that mattered to someone beyond yourself. Small counts. Holding a door with presence, a text that cost you vulnerability, showing up when it was inconvenient. Giving without expectation is the dimension that compounds the slowest and pays back the most.',
  },
  {
    id: 'restore',
    name: 'Restore',
    icon: '🌙',
    desc: 'Rest, recover, and refill the tank.',
    actions: ['Take a real, screen-free break', 'Get to bed 30 min earlier', 'Do nothing on purpose for 10 min'],
    long: 'You actually stopped. Not scrolled, not distracted — stopped. Rest is a dimension, not a reward. This is the one most high-performers skip and most burned-out people never learned to count.',
  },
]

export const DIMENSION_BY_ID: Record<string, Dimension> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d]),
)

/** The dateKeys for the 7 days ending today (inclusive). */
export function last7Keys(now: number): string[] {
  const keys: string[] = []
  for (let i = 6; i >= 0; i--) keys.push(dateKey(now - i * MS_DAY))
  return keys
}

/**
 * The most neglected dimension over the past 7 days — the one hit on the
 * fewest days. Ties break by the canonical dimension order. With no history
 * everything is equally untended, so this returns the first dimension.
 */
export function neglectedDimension(byDay: Record<string, string[]>, now: number): Dimension {
  const keys = last7Keys(now)
  let best = DIMENSIONS[0]
  let bestCount = Infinity
  for (const dim of DIMENSIONS) {
    const count = keys.reduce((n, k) => n + (byDay[k]?.includes(dim.id) ? 1 : 0), 0)
    if (count < bestCount) {
      bestCount = count
      best = dim
    }
  }
  return best
}

/** The 7 dateKeys of a week, given its start (Monday) in ms. */
export function weekKeys(weekStartMs: number): string[] {
  const keys: string[] = []
  for (let i = 0; i < 7; i++) keys.push(dateKey(weekStartMs + i * MS_DAY))
  return keys
}

/**
 * Potential Reached % for each given day, or null when no check-in was logged
 * that day. A logged-but-empty day reads as 0; a day with no entry reads null.
 */
export function dayScores(byDay: Record<string, string[]>, keys: string[]): (number | null)[] {
  return keys.map((k) => {
    const entry = byDay[k]
    return entry === undefined ? null : Math.round((entry.length / DIMENSIONS.length) * 100)
  })
}

/** How many of the given days have a logged check-in. */
export function loggedDayCount(byDay: Record<string, string[]>, keys: string[]): number {
  return keys.reduce((n, k) => n + (byDay[k] !== undefined ? 1 : 0), 0)
}

/**
 * The `n` most neglected dimensions across the given days — hit on the fewest
 * days. Ties break by canonical order. (Days with no check-in add nothing to
 * any dimension, so they don't skew the ranking.)
 */
export function weekNeglected(byDay: Record<string, string[]>, keys: string[], n = 2): Dimension[] {
  const counts: Record<string, number> = {}
  for (const d of DIMENSIONS) counts[d.id] = 0
  for (const k of keys) for (const id of byDay[k] ?? []) if (id in counts) counts[id]++
  return [...DIMENSIONS].sort((a, b) => counts[a.id] - counts[b.id]).slice(0, n)
}

// ── Points (PRD parity with the workout ledger) ────────────────────────────
// +2 per dimension logged, −2 per dimension not logged. Like the workout
// engine, points settle at each day's DEADLINE (midnight): only fully-closed
// days count, so the current day is editable until it banks. Rivals earn
// hold × the perfect reflection max, exactly like their workout points.

/** ± points each dimension is worth at the day's close. */
export const REFLECT_POINT = 2

/** Local-midnight ms for a `YYYY-MM-DD` key (when reflection scoring began). */
export function keyToMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/**
 * The player's net reflection points from every CLOSED day since scoring began
 * (start = first check-in's day). Each closed day: logged·(+2) + unlogged·(−2).
 * The current day isn't counted until it banks at midnight.
 */
export function reflectionPlayerScore(byDay: Record<string, string[]>, startMs: number, now: number): number {
  if (!startMs) return 0
  const total = DIMENSIONS.length
  let score = 0
  for (let d = startOfDay(startMs); endOfDay(d) <= now; d += MS_DAY) {
    const logged = byDay[dateKey(d)]?.length ?? 0
    score += logged * REFLECT_POINT - (total - logged) * REFLECT_POINT
  }
  return score
}

/** Max reflection points accruable across closed days (a perfect run). */
export function reflectionMax(startMs: number, now: number): number {
  if (!startMs) return 0
  let days = 0
  for (let d = startOfDay(startMs); endOfDay(d) <= now; d += MS_DAY) days++
  return days * DIMENSIONS.length * REFLECT_POINT
}

/** A rival's reflection total: holdFraction × the perfect max (as with workouts). */
export function reflectionRivalScore(startMs: number, now: number, hold: number): number {
  return hold * reflectionMax(startMs, now)
}

/** A short, warm response keyed to the day's Potential Reached score. */
export function reflectionResponse(hit: number): string {
  const pct = (hit / DIMENSIONS.length) * 100
  if (hit === DIMENSIONS.length) return 'Every dimension, lit. A whole day, fully lived.'
  if (pct >= 75) return 'Almost all of you, tended. A strong day.'
  if (pct >= 50) return 'More than half of you, honored. Good work.'
  if (pct >= 25) return 'A few corners tended. Tomorrow, a few more.'
  if (hit >= 1) return 'One small light still counts. Begin again tomorrow.'
  return 'A quiet day. Rest is allowed — tomorrow’s yours.'
}
