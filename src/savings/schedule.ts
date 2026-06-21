// ─────────────────────────────────────────────────────────────────────────
// SAVINGS SCHEDULE MATH — the pace rival, pure and clock-injected.
//
// A "rival" is a perfect-discipline version of you who always deposits on
// schedule. Two kinds:
//   • target    — flat deposits toward `total` by a deadline, at a chosen pace;
//                 banks one equal deposit at each pace interval.
//   • challenge — banks each escalating period's amount at its deadline.
// Both reach their finish line exactly at the end, as a daily/period STEP.
// ─────────────────────────────────────────────────────────────────────────

import type { Challenge, Pace } from './types'
import { MS_DAY, MS_WEEK, startOfDay, addMonths } from '../engine/time'

// ── Challenge schedules ────────────────────────────────────────────────────

/** How many periods the challenge runs for (schedule length or ramp count). */
export function challengePeriods(ch: Challenge): number {
  return ch.amounts ? ch.amounts.length : ch.periods ?? 0
}

/** Word for one challenge period, by cadence. */
export function challengeUnit(ch: Challenge): string {
  return ch.cadence === 'daily' ? 'day' : ch.cadence === 'biweekly' ? 'paycheck' : 'week'
}

/** Amount the challenge calls for in its period `i` (0-based). */
export function challengeAmountForPeriod(ch: Challenge, i: number): number {
  if (ch.amounts) return ch.amounts[i] ?? 0
  return (ch.startAmount ?? 0) + (ch.stepAmount ?? 0) * i
}

/** Total a challenge sums to if completed perfectly. */
export function challengeTotal(ch: Challenge): number {
  if (ch.amounts) return ch.amounts.reduce((sum, a) => sum + a, 0)
  const n = ch.periods ?? 0
  return n * (ch.startAmount ?? 0) + ((ch.stepAmount ?? 0) * n * (n - 1)) / 2
}

function challengeStepMs(ch: Challenge): number {
  return ch.cadence === 'daily' ? MS_DAY : ch.cadence === 'biweekly' ? 2 * MS_WEEK : MS_WEEK
}

/**
 * 0-based index of the period the clock is currently in (and equivalently the
 * count of periods whose deadline has already passed). 0 on the first day.
 */
export function challengePeriodIndex(ch: Challenge, startMs: number, nowMs: number): number {
  const base = startOfDay(startMs)
  if (nowMs <= base) return 0
  return Math.floor((nowMs - base) / challengeStepMs(ch))
}

/** The amount due for the CURRENT challenge period (0 once the challenge is over). */
export function challengeCurrentAmount(ch: Challenge, startMs: number, nowMs: number): number {
  const i = challengePeriodIndex(ch, startMs, nowMs)
  return i >= 0 && i < challengePeriods(ch) ? challengeAmountForPeriod(ch, i) : 0
}

/** The disciplined rival's running total: sums every period whose deadline passed. */
export function challengeRivalTotal(ch: Challenge, startMs: number, nowMs: number): number {
  const completed = Math.min(challengePeriods(ch), challengePeriodIndex(ch, startMs, nowMs))
  let total = 0
  for (let i = 0; i < completed; i++) total += challengeAmountForPeriod(ch, i)
  return total
}

// ── Custom target schedules ────────────────────────────────────────────────

export const PACE_WORD: Record<Pace, string> = {
  daily: 'day',
  weekly: 'week',
  biweekly: '2 weeks',
  monthly: 'month',
}

export const PACE_TODAY_LABEL: Record<Pace, string> = {
  daily: 'TODAY',
  weekly: 'THIS WEEK',
  biweekly: 'THIS FORTNIGHT',
  monthly: 'THIS MONTH',
}

const PACE_STEP_DAYS: Record<'daily' | 'weekly' | 'biweekly', number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
}

/** Whole calendar months from `baseMs` to `toMs`, anchored on the start day-of-month. */
function monthsElapsed(baseMs: number, toMs: number): number {
  const b = new Date(baseMs)
  const t = new Date(toMs)
  let m = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth())
  if (t.getDate() < b.getDate()) m -= 1
  return Math.max(0, m)
}

/** Number of full pace intervals elapsed between the goal start and `nowMs`. */
export function paceIntervalsElapsed(pace: Pace, startMs: number, nowMs: number): number {
  const base = startOfDay(startMs)
  if (nowMs <= base) return 0
  if (pace === 'monthly') return monthsElapsed(base, nowMs)
  return Math.floor((nowMs - base) / (PACE_STEP_DAYS[pace] * MS_DAY))
}

/** How many deposits the target plan calls for (pace intervals up to the deadline). */
export function targetDeposits(pace: Pace, startMs: number, deadlineMs: number): number {
  return Math.max(1, paceIntervalsElapsed(pace, startMs, deadlineMs))
}

/** The flat amount each deposit must be to hit `total` by the deadline. */
export function targetPerDeposit(total: number, pace: Pace, startMs: number, deadlineMs: number): number {
  return total / targetDeposits(pace, startMs, deadlineMs)
}

/** The on-pace rival's running total: one equal deposit banked per elapsed interval. */
export function targetRivalTotal(
  total: number,
  pace: Pace,
  startMs: number,
  deadlineMs: number,
  nowMs: number,
): number {
  const n = targetDeposits(pace, startMs, deadlineMs)
  const per = total / n
  const done = Math.min(n, paceIntervalsElapsed(pace, startMs, nowMs))
  return per * done
}

/** The deposit amount due right now (0 once the deadline has passed). */
export function targetCurrentAmount(
  total: number,
  pace: Pace,
  startMs: number,
  deadlineMs: number,
  nowMs: number,
): number {
  if (nowMs >= deadlineMs) return 0
  return targetPerDeposit(total, pace, startMs, deadlineMs)
}

/** Deadline for a target = start day + a timeframe (weeks / months / years). */
export function deadlineFrom(startMs: number, num: number, unit: 'weeks' | 'months' | 'years'): number {
  const base = startOfDay(startMs)
  const n = Math.max(1, Math.round(num))
  if (unit === 'weeks') return base + n * MS_WEEK
  if (unit === 'years') return addMonths(base, n * 12)
  return addMonths(base, n)
}
