// ─────────────────────────────────────────────────────────────────────────
// SAVINGS LEDGER — what YOU have actually saved, derived from the
// contributions log. Pure functions; the store wires them to the clock.
// ─────────────────────────────────────────────────────────────────────────

import type { Contribution } from './types'
import { MS_DAY, dateKey, startOfDay } from '../engine/time'

/** Round to whole cents to keep money arithmetic clean. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Sum of contributions (optionally only those recorded at or before `nowMs`). */
export function savedTotal(contributions: Contribution[], nowMs?: number): number {
  const list = nowMs == null ? contributions : contributions.filter((c) => c.at <= nowMs)
  return round2(list.reduce((sum, c) => sum + c.amount, 0))
}

/** Sum of contributions recorded in the window [fromMs, nowMs]. */
export function savedSince(contributions: Contribution[], fromMs: number, nowMs: number): number {
  return round2(
    contributions
      .filter((c) => c.at >= fromMs && c.at <= nowMs)
      .reduce((sum, c) => sum + c.amount, 0),
  )
}

/** Distinct day-keys that have at least one contribution. */
export function daysSaved(contributions: Contribution[]): number {
  return new Set(contributions.map((c) => c.dateKey)).size
}

/**
 * Current saving streak: consecutive days up to today with a contribution.
 * Today not-yet-saved doesn't break it — the count then runs back from yesterday.
 */
export function savingStreak(contributions: Contribution[], nowMs: number): number {
  const keys = new Set(contributions.map((c) => c.dateKey))
  let d = startOfDay(nowMs)
  if (!keys.has(dateKey(d))) d -= MS_DAY
  let streak = 0
  while (keys.has(dateKey(d))) {
    streak++
    d -= MS_DAY
  }
  return streak
}

/** Format a dollar amount: `$1,234` whole, `$12.50` with cents. */
export function money(n: number): string {
  const r = round2(n)
  const hasCents = Math.abs(r % 1) > 0.0001
  return (
    '$' +
    r.toLocaleString(undefined, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    })
  )
}
