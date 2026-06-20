// Barrel for all seed data + the seed-time helpers.
export * from './activities'
export * from './exercises'
export * from './workouts'
export * from './program'
export * from './rival'
export { buildSeedLog, buildDemoLog } from './history'

import { startOfDay, startOfWeek, MS_WEEK } from '../engine/time'

/**
 * Day 0 for a fresh game: the start of *today*. You and both rivals begin at 0,
 * Day 1, with an empty ledger — a real first-run you build up by showing up.
 */
export function computeStartDate(nowMs: number): number {
  return startOfDay(nowMs)
}

/**
 * Day 0 for the tutorial's demo data: the Monday five weeks back, so "now" sits
 * in program week 6 (Block B) with a full gap graph and report history.
 */
export function computeDemoStartDate(nowMs: number): number {
  return startOfWeek(nowMs) - 5 * MS_WEEK
}
