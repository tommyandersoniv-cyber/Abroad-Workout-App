// ─────────────────────────────────────────────────────────────────────────
// Periodic performance reports — pure analytics over the log + engine.
//   • weekly (7d)  → ME this week vs last week
//   • monthly (30d) → ME vs both rivals for the month + improvement tips
//   • yearly (365d) → growth over the year
// Windows are counted from sign-up (startMs). All values derived, never stored.
// ─────────────────────────────────────────────────────────────────────────

import type { LogEntry } from '../engine/types'
import { ACTIVITY_BY_ID } from '../seed/activities'
import { rivalXP, playerXP } from '../engine/ledger'
import { MS_DAY, startOfDay, endOfDay, daysBetween } from '../engine/time'

// The two fixed benchmarks (kept local so this stays a pure lib).
const TOMMY_HOLD = 0.9
const YMMOT_HOLD = 0.7
const CATALOG = Object.values(ACTIVITY_BY_ID)

export const PERIOD_DAYS = { week: 7, month: 30, year: 365 } as const
export type Period = keyof typeof PERIOD_DAYS

const youAt = (log: LogEntry[], t: number) => playerXP(log.filter((e) => e.at <= t))
const tommyAt = (startMs: number, t: number) => rivalXP(CATALOG, startMs, t, TOMMY_HOLD)
const ymmotAt = (startMs: number, t: number) => rivalXP(CATALOG, startMs, t, YMMOT_HOLD)

/** Whole completed periods since sign-up. */
export function completedPeriods(period: Period, startMs: number, now: number): number {
  return Math.floor(daysBetween(startMs, now) / PERIOD_DAYS[period])
}

export interface PeriodWindow {
  index: number
  a: number
  b: number
  bClamped: number
  complete: boolean
}
export function periodWindow(period: Period, startMs: number, now: number, index: number): PeriodWindow {
  const len = PERIOD_DAYS[period] * MS_DAY
  const a = startOfDay(startMs) + (index - 1) * len
  const b = a + len
  return { index, a, b, bClamped: Math.min(b, now), complete: now >= b }
}

export type Cat = 'workout' | 'movement' | 'mind' | 'weekly'
export interface MeWindow {
  net: number
  earned: number
  lost: number
  completions: number
  requiredCompletions: number
  misses: number
  extras: number
  runMiles: number
  completionRate: number
  byCat: Record<Cat, { earned: number; done: number; missed: number }>
}

/** ME-focused stats for the window [a, b). */
export function meWindow(log: LogEntry[], a: number, b: number): MeWindow {
  const byCat: MeWindow['byCat'] = {
    workout: { earned: 0, done: 0, missed: 0 },
    movement: { earned: 0, done: 0, missed: 0 },
    mind: { earned: 0, done: 0, missed: 0 },
    weekly: { earned: 0, done: 0, missed: 0 },
  }
  let earned = 0
  let lost = 0
  let completions = 0
  let requiredCompletions = 0
  let misses = 0
  let extras = 0
  let runMiles = 0

  for (const e of log) {
    if (e.at < a || e.at >= b) continue
    const act = ACTIVITY_BY_ID[e.activityId]
    if (!act) continue
    const cat = act.category as Cat
    if (e.status === 'completed') {
      earned += e.xp
      completions++
      byCat[cat].earned += e.xp
      byCat[cat].done++
      if (act.repeatable) extras++
      else requiredCompletions++
      if (act.id === 'run') runMiles += e.value
    } else {
      lost += -e.xp
      misses++
      byCat[cat].missed++
    }
  }
  const scheduled = requiredCompletions + misses
  return {
    net: earned - lost,
    earned,
    lost,
    completions,
    requiredCompletions,
    misses,
    extras,
    runMiles,
    completionRate: scheduled > 0 ? requiredCompletions / scheduled : 1,
    byCat,
  }
}

export interface RivalWindow {
  youGain: number
  ymmotGain: number
  tommyGain: number
  gapY0: number
  gapY1: number
  gapT0: number
  gapT1: number
  daysBeatY: number
  daysBeatT: number
  days: number
}

export function rivalWindow(log: LogEntry[], startMs: number, a: number, b: number, now: number): RivalWindow {
  const end = Math.min(b, now)
  const y0 = youAt(log, a)
  const y1 = youAt(log, end)
  let daysBeatY = 0
  let daysBeatT = 0
  let days = 0
  for (let d = a; d < b && d < now; d += MS_DAY) {
    const de = Math.min(now, endOfDay(d))
    const y = youAt(log, de)
    if (y > ymmotAt(startMs, de)) daysBeatY++
    if (y > tommyAt(startMs, de)) daysBeatT++
    days++
  }
  return {
    youGain: y1 - y0,
    ymmotGain: ymmotAt(startMs, end) - ymmotAt(startMs, a),
    tommyGain: tommyAt(startMs, end) - tommyAt(startMs, a),
    gapY0: y0 - ymmotAt(startMs, a),
    gapY1: y1 - ymmotAt(startMs, end),
    gapT0: y0 - tommyAt(startMs, a),
    gapT1: y1 - tommyAt(startMs, end),
    daysBeatY,
    daysBeatT,
    days,
  }
}

export interface DayPoint {
  you: number
  ymmot: number
  tommy: number
}
export function series(log: LogEntry[], startMs: number, a: number, b: number, now: number): DayPoint[] {
  const out: DayPoint[] = []
  for (let d = a; d < b && d <= now; d += MS_DAY) {
    const de = Math.min(now, endOfDay(d))
    out.push({ you: youAt(log, de), ymmot: ymmotAt(startMs, de), tommy: tommyAt(startMs, de) })
  }
  return out
}

export interface Tip {
  kind: 'good' | 'warn' | 'lever'
  text: string
}

/** Improvement tips for the monthly report (names passed in for personalisation). */
export function monthlyTips(me: MeWindow, rv: RivalWindow, names: { ymmot: string; tommy: string }): Tip[] {
  const tips: Tip[] = []
  const missed15 = me.byCat.workout.missed + me.byCat.movement.missed
  const pct = Math.round(me.completionRate * 100)

  if (rv.gapT1 >= 0) {
    tips.push({
      kind: 'good',
      text: `You're ahead of ${names.tommy} by ${Math.round(rv.gapT1)}. Stack extra workouts and 4th/5th miles — they're the only XP above his 90% ceiling — to widen it.`,
    })
  } else {
    const need = Math.ceil(Math.abs(rv.gapT1) / 5)
    tips.push({
      kind: 'lever',
      text: `Behind ${names.tommy} by ${Math.abs(Math.round(rv.gapT1))}. That's ~${need} extra workouts or extra miles to pull even — the only points his ceiling never counts.`,
    })
  }

  if (missed15 > 0) {
    tips.push({
      kind: 'warn',
      text: `${missed15} missed −15 item${missed15 === 1 ? '' : 's'} this month (workouts / stretch / rope). Each is a 25-pt swing — protect these first.`,
    })
  }

  if (pct < 90) {
    tips.push({ kind: 'warn', text: `Completion rate ${pct}%. Push past 95% to stay clear of both rivals.` })
  } else if (pct >= 95) {
    tips.push({ kind: 'good', text: `Completion rate ${pct}% — elite. Keep it up.` })
  }

  if (me.extras === 0) {
    tips.push({ kind: 'lever', text: `0 extra workouts logged. They're +5 each, uncapped, and land above ${names.tommy}'s ceiling — add 1–2/week to gain ground.` })
  } else {
    tips.push({ kind: 'good', text: `${me.extras} extra workout${me.extras === 1 ? '' : 's'} banked — pure upside the rivals can't match.` })
  }

  tips.push({
    kind: rv.daysBeatT >= rv.days / 2 ? 'good' : 'warn',
    text: `You finished ahead of ${names.tommy} on ${rv.daysBeatT}/${rv.days} days and ${names.ymmot} on ${rv.daysBeatY}/${rv.days}.`,
  })

  return tips
}

/** Net XP for each whole week inside [a, b) — for the yearly "best week". */
export function weeklyNets(log: LogEntry[], a: number, b: number): number[] {
  const out: number[] = []
  for (let w = a; w < b; w += 7 * MS_DAY) out.push(meWindow(log, w, w + 7 * MS_DAY).net)
  return out
}

/** Longest run of consecutive days finishing ahead of BOTH rivals in [a, b). */
export function longestBeatBothStreak(log: LogEntry[], startMs: number, a: number, b: number, now: number): number {
  let best = 0
  let run = 0
  for (let d = a; d < b && d < now; d += MS_DAY) {
    const de = Math.min(now, endOfDay(d))
    const y = youAt(log, de)
    if (y > tommyAt(startMs, de) && y > ymmotAt(startMs, de)) {
      run++
      best = Math.max(best, run)
    } else run = 0
  }
  return best
}

export { youAt }
