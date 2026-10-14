// The eight dimensions of a day fully lived (copy from Tommy's Lovable app).

import { addDays, dateKey, fromKey, type DayKey } from './date'

export interface Dimension {
  id: DimensionId
  name: string
  desc: string
  ideas: [string, string, string]
}

export type DimensionId =
  | 'body' | 'mind' | 'heart' | 'soul' | 'create' | 'connect' | 'give' | 'restore'

export const DIMENSIONS: Dimension[] = [
  {
    id: 'body', name: 'Body', desc: 'You moved, rested, or nourished yourself intentionally',
    ideas: ['Take a 20-minute walk', 'Cook a real meal from scratch', 'Stretch for 10 minutes before bed'],
  },
  {
    id: 'mind', name: 'Mind', desc: 'You pushed your thinking or learned something uncomfortable',
    ideas: ['Read a chapter of a challenging book', 'Watch a lecture on something new', 'Write down one idea you disagree with'],
  },
  {
    id: 'heart', name: 'Heart', desc: 'You felt something real and didn’t push it away',
    ideas: ['Tell someone how you actually feel', 'Cry if you need to', 'Sit with a feeling instead of distracting yourself'],
  },
  {
    id: 'soul', name: 'Soul', desc: 'You had a moment of awe, stillness, or wonder',
    ideas: ['Watch a sunrise', 'Sit in silence for 5 minutes', 'Listen to one song with your eyes closed'],
  },
  {
    id: 'create', name: 'Create', desc: 'You made something, even something small',
    ideas: ['Write a paragraph of anything', 'Sketch something on paper', 'Rearrange a room or a shelf'],
  },
  {
    id: 'connect', name: 'Connect', desc: 'You had a genuine human moment with someone',
    ideas: ['Call a friend you haven’t talked to', 'Have a real conversation over dinner', 'Ask someone how they’re really doing'],
  },
  {
    id: 'give', name: 'Give', desc: 'You did something that mattered to someone beyond yourself',
    ideas: ['Help a stranger with something small', 'Write a note of appreciation', 'Volunteer an hour of your time'],
  },
  {
    id: 'restore', name: 'Restore', desc: 'You actually stopped and let yourself recover',
    ideas: ['Take a nap without guilt', 'Say no to one thing', 'Spend an hour doing absolutely nothing'],
  },
]

export const DIMENSION_BY_ID = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d])) as Record<DimensionId, Dimension>

/** Small stable hash so ties break the same way all day. */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Today's intention: the dimension lived on the fewest of the previous 7 days.
 * Today's own check-ins are ignored so the pick holds steady all day.
 */
export function intentionFor(today: DayKey, byDay: Record<DayKey, DimensionId[]>): Dimension {
  const counts = new Map<DimensionId, number>(DIMENSIONS.map((d) => [d.id, 0]))
  const t = fromKey(today)
  for (let i = 1; i <= 7; i++) {
    for (const id of byDay[dateKey(addDays(t, -i))] ?? []) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const least = Math.min(...counts.values())
  const tied = DIMENSIONS.filter((d) => counts.get(d.id) === least)
  return tied[hash(today) % tied.length]
}

/** The gentle line under the day's percentage. */
export function reflectionLine(n: number): string {
  if (n === 0) return 'You are not behind. You are exactly where your attention brought you.'
  if (n <= 2) return 'A little attention is still attention. It counts.'
  if (n <= 4) return 'You showed up for more of yourself than you think.'
  if (n <= 6) return 'That’s a full day. Let it sink in.'
  if (n === 7) return 'Nearly every part of you got some care today.'
  return 'Every part of you was lived today. Remember this one.'
}
