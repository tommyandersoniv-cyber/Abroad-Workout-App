// ─────────────────────────────────────────────────────────────────────────
// THE LEDGER ENGINE (PRD §4) — the rules, pure and isolated.
//
// Two perpetual totals, both start at 0, neither ever resets:
//   • RIVAL  = holdFraction × maxXP(now)   — a relentless function of the
//              schedule + the clock. Never penalized.
//   • YOU    = Σ logged completions − Σ resolved miss penalties.
//
// `maxXP(now)` banks each occurrence's full XP at its DEADLINE (end of day for
// daily/scheduled items, end of week for weekly ones). So the CPU rivals add
// their points in a lump as soon as the next day starts — a daily step, not a
// smooth trickle — and the total still lands exactly on the PRD's boundary
// numbers (perfect week = 282; rival @0.9 = 253.8).
// ─────────────────────────────────────────────────────────────────────────

import type { Activity, LogEntry, Weekday } from './types'
import {
  MS_DAY,
  MS_WEEK,
  dateKey,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  weekday,
} from './time'

/** Full XP a single occurrence of an activity is worth at perfect completion. */
export function fullOccurrenceXP(a: Activity): number {
  if (a.unit === 'per_mile') return a.xp * (a.weeklyTarget ?? 0) // run: 3mi target × 5 = 15
  return a.xp
}

/**
 * MAX XP earnable from `startMs` (day 0) to `nowMs`, summing every scheduled
 * occurrence of every catalog activity at full completion — run counted at its
 * 3-mile target. Excludes bonus/repeatable items (extra workouts) and miles
 * beyond the target: those sit *above* the rival's ceiling by design (§4.3).
 *
 * Each occurrence's full XP is banked at its DEADLINE — daily/scheduled items at
 * the end of their day, weekly items at the end of their week (both midnights).
 * So this is a STEP function: it holds flat during a day and jumps as soon as a
 * new day starts, yet equals N×282 at exact week boundaries.
 */
export function maxXP(activities: Activity[], startMs: number, nowMs: number): number {
  if (nowMs <= startMs) return 0
  const start = startOfDay(startMs)
  let total = 0

  for (const a of activities) {
    if (a.cadence === 'bonus' || a.repeatable) continue

    if (a.cadence === 'weekly') {
      // Banked in full once the week has fully elapsed.
      const full = fullOccurrenceXP(a)
      for (let w = startOfWeek(start); w < nowMs; w += MS_WEEK) {
        if (endOfWeek(w) <= nowMs) total += full
      }
      continue
    }

    // daily & scheduled: each qualifying day banks its full XP at the next midnight.
    // (per_mile items like the pinned run count at their target, e.g. 3mi → 15.)
    const days: Weekday[] = a.schedule
    const full = fullOccurrenceXP(a)
    for (let d = start; d < nowMs; d += MS_DAY) {
      if (!days.includes(weekday(d))) continue
      if (endOfDay(d) <= nowMs) total += full
    }
  }

  return total
}

/** The rival's live total: holdFraction × maxXP(now). Never penalized. */
export function rivalXP(
  activities: Activity[],
  startMs: number,
  nowMs: number,
  holdFraction: number,
): number {
  return holdFraction * maxXP(activities, startMs, nowMs)
}

/** Your total = sum of every log entry's signed XP. */
export function playerXP(log: LogEntry[]): number {
  return log.reduce((sum, e) => sum + e.xp, 0)
}

/**
 * The occurrence key a completion is filed under, so misses can be matched:
 * daily/scheduled → that day; weekly → the week's Monday.
 */
export function occurrenceKey(a: Activity, ms: number): string {
  return a.cadence === 'weekly' ? dateKey(startOfWeek(ms)) : dateKey(ms)
}

/** Has this activity's occurrence at `dateKey` already been logged complete? */
function isLogged(log: LogEntry[], activityId: string, key: string): boolean {
  return log.some(
    (e) => e.activityId === activityId && e.dateKey === key && e.status === 'completed',
  )
}

export interface MissResolution {
  /** New 'missed' entries to append to the log. */
  misses: LogEntry[]
  /** Advance the ledger watermark to here. */
  resolvedAt: number
}

/**
 * Walk the schedule from `lastResolvedAt` to `nowMs` and apply each item's miss
 * penalty to any occurrence whose deadline passed un-logged (PRD §4.4).
 * `excused` holds `${activityId}@${dateKey}` keys that were pushed to another
 * day — those never penalize (you can still log them later for XP).
 * Pure: returns the new entries + the advanced watermark; caller persists them.
 */
export function resolveMisses(
  activities: Activity[],
  log: LogEntry[],
  startMs: number,
  lastResolvedAt: number,
  nowMs: number,
  excused: Set<string> = new Set(),
): MissResolution {
  const misses: LogEntry[] = []
  // Never resolve earlier than the game's start day.
  const from = Math.max(lastResolvedAt, startOfDay(startMs))
  if (nowMs <= from) return { misses, resolvedAt: Math.max(lastResolvedAt, nowMs) }

  for (const a of activities) {
    if (a.cadence === 'bonus' || a.repeatable) continue // extras are never penalized

    if (a.cadence === 'weekly') {
      // Each completed week between `from` and `now` whose deadline passed.
      for (let w = startOfWeek(from); w < nowMs; w += MS_WEEK) {
        const deadline = endOfWeek(w)
        if (deadline > nowMs) break // current week not yet due
        if (deadline <= from) continue // already resolved
        const key = dateKey(w)
        if (excused.has(`${a.id}@${key}`)) continue
        if (!isLogged(log, a.id, key)) {
          misses.push(missEntry(a, key, deadline))
        }
      }
      continue
    }

    // daily & scheduled
    for (let d = startOfDay(from); d < nowMs; d += MS_DAY) {
      if (!a.schedule.includes(weekday(d))) continue
      const deadline = endOfDay(d)
      if (deadline > nowMs) break // today's items aren't missed until day end
      if (deadline <= from) continue
      const key = dateKey(d)
      if (excused.has(`${a.id}@${key}`)) continue // pushed to another day — no penalty
      if (!isLogged(log, a.id, key)) {
        misses.push(missEntry(a, key, deadline))
      }
    }
  }

  return { misses, resolvedAt: nowMs }
}

function missEntry(a: Activity, key: string, at: number): LogEntry {
  return {
    id: `miss:${a.id}:${key}`,
    activityId: a.id,
    dateKey: key,
    value: 0,
    xp: -a.missPenalty,
    status: 'missed',
    at,
  }
}

/**
 * XP a completion banks right now. Enforces the run hard-target: a run only
 * earns when miles ≥ target (else 0 — it stays "due" and resolves to −5 at
 * week's end). Per-mile pays +5 × miles with no upper cap.
 */
export function earnFor(a: Activity, value: number): number {
  if (a.unit === 'per_mile') {
    const target = a.weeklyTarget ?? 0
    return value >= target ? a.xp * value : 0
  }
  return a.xp
}
