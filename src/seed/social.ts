// ─────────────────────────────────────────────────────────────────────────
// Phone calls — 3 per week (2 family + 1 friend), each pinned to a weekday and
// a specific person cycled deterministically from these lists. +2 XP per call.
// ─────────────────────────────────────────────────────────────────────────

import type { Weekday } from '../engine/types'

export const FAMILY = [
  'Tim', 'Titus', 'Mia', 'Tyger', 'Bell', 'Mom', 'Mama',
  'Granny Linda', 'Aunt Tracy', 'Ms Charlene', 'Brandon', 'Kris',
]

export const FRIENDS = [
  'Elijah', 'Roman', 'Nyobe', 'Justin', 'Christian', 'Alston', 'Eric', 'Brook',
  'Greg', 'Kunlae', 'Jeff', 'Antonio', 'Gio', 'Lee', 'Jai', 'EBT Josh',
  'Hoffman', 'Watu', 'Sean Micheal', 'Jono',
]

export type CallList = 'family' | 'friend'

/** The three weekly call slots: two family, one friend, each on a fixed weekday. */
export const CALL_DAYS: { weekday: Weekday; list: CallList; slot: number }[] = [
  { weekday: 1, list: 'family', slot: 0 }, // Tue · family
  { weekday: 3, list: 'family', slot: 1 }, // Thu · family
  { weekday: 5, list: 'friend', slot: 0 }, // Sat · friend
]

export const CALL_WEEKDAYS: Weekday[] = CALL_DAYS.map((c) => c.weekday)
/** Run 1 mile on three days a week (Mon · Wed · Fri). */
export const RUN_WEEKDAYS: Weekday[] = [0, 2, 4]

/** Who to call for a given 1-based program week + list + slot. Cycles each list. */
export function callPerson(weekNumber: number, list: CallList, slot: number): string {
  const w = Math.max(0, weekNumber - 1)
  if (list === 'family') return FAMILY[(w * 2 + slot) % FAMILY.length]
  return FRIENDS[w % FRIENDS.length]
}

/** The person assigned to the call on a given weekday in a given week (or null). */
export function personForDay(weekNumber: number, day: Weekday): { name: string; list: CallList } | null {
  const cd = CALL_DAYS.find((c) => c.weekday === day)
  if (!cd) return null
  return { name: callPerson(weekNumber, cd.list, cd.slot), list: cd.list }
}
