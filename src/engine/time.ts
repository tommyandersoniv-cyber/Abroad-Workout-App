// ─────────────────────────────────────────────────────────────────────────
// Time & calendar helpers. All local-time. RIVAL weeks start Monday.
// These are pure functions of a millisecond clock — the engine never reads
// `Date.now()` itself, so it stays fully testable and the demo clock can lie.
// ─────────────────────────────────────────────────────────────────────────

import type { Weekday } from './types'

export const MS_DAY = 86_400_000
export const MS_WEEK = MS_DAY * 7

/** Local `YYYY-MM-DD` key for a moment. */
export function dateKey(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Midnight (local) at the start of the day containing `ms`. */
export function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Day-start (local midnight) `n` calendar days after the day containing `ms`.
 * DST-safe: steps via midday so a 23/25-hour day can never skip or repeat.
 */
export function addDays(ms: number, n: number): number {
  return startOfDay(startOfDay(ms) + n * MS_DAY + MS_DAY / 2)
}

/** Midnight (local) at the start of the next day — a daily item's deadline. */
export function endOfDay(ms: number): number {
  return addDays(ms, 1)
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(ms: number): Weekday {
  // JS getDay(): 0=Sun..6=Sat → shift so Monday=0.
  return (((new Date(ms).getDay() + 6) % 7) as Weekday)
}

/** Midnight (local) of the Monday that begins the week containing `ms`. */
export function startOfWeek(ms: number): number {
  return startOfDay(ms) - weekday(ms) * MS_DAY
}

/** Start of the next week — a weekly item's deadline. */
export function endOfWeek(ms: number): number {
  return addDays(startOfWeek(ms), 7)
}

/** Midnight (local) at the first day of the month containing `ms`. */
export function startOfMonth(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

/** Start of the next month — a monthly item's deadline. */
export function endOfMonth(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
}

/** Midnight (local) at Jan 1 of the year containing `ms`. */
export function startOfYear(ms: number): number {
  return new Date(new Date(ms).getFullYear(), 0, 1).getTime()
}

/** Start of next year — a yearly item's deadline. */
export function endOfYear(ms: number): number {
  return new Date(new Date(ms).getFullYear() + 1, 0, 1).getTime()
}

/** Same local time, `n` calendar months later (day clamps within the month). */
export function addMonths(ms: number, n: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate(), d.getHours(), d.getMinutes()).getTime()
}

/** Whole days from `a`'s day-start to `b`'s day-start. */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_DAY)
}

/** Whole weeks elapsed from `start`'s week to `ms`'s week. */
export function weekIndex(startMs: number, ms: number): number {
  return Math.round((startOfWeek(ms) - startOfWeek(startMs)) / MS_WEEK)
}

