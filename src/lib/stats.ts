// Weekly/monthly roll-ups: the 4-days-per-dimension weekly goal and good
// days (≥5 of 8). Everything is scoped to the keys passed in.

import type { DayKey } from './date'
import type { DimensionId } from './dimensions'
import { doneCount, type DayLog, type Settings } from './habits'

export const WEEKLY_GOAL = 4
export const GOOD_DAY = 5

export type Days = Record<DayKey, DayLog>
export type Reflections = Record<DayKey, DimensionId[]>

export function dimensionDays(d: DimensionId, keys: DayKey[], refl: Reflections): number {
  return keys.filter((k) => refl[k]?.includes(d)).length
}

export const isGoodHabitDay = (log: DayLog | undefined, s: Settings) => doneCount(log, s) >= GOOD_DAY
export const isGoodReflectionDay = (dims: DimensionId[] | undefined) => (dims?.length ?? 0) >= GOOD_DAY
