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

/** Midnight (local) at the start of the next day — a daily item's deadline. */
export function endOfDay(ms: number): number {
  return startOfDay(ms) + MS_DAY
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
  return startOfWeek(ms) + MS_WEEK
}

/** Whole days from `a`'s day-start to `b`'s day-start. */
export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_DAY)
}

/** Whole weeks elapsed from `start`'s week to `ms`'s week. */
export function weekIndex(startMs: number, ms: number): number {
  return Math.round((startOfWeek(ms) - startOfWeek(startMs)) / MS_WEEK)
}

/** Iterate day-start timestamps from `from` (inclusive) to `to` (exclusive of the day after `to`). */
export function eachDay(fromMs: number, toMs: number): number[] {
  const out: number[] = []
  for (let t = startOfDay(fromMs); t <= startOfDay(toMs); t += MS_DAY) out.push(t)
  return out
}

/** Clamp helper. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
