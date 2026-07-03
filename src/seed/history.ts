// ─────────────────────────────────────────────────────────────────────────
// Two seeders:
//   • buildSeedLog  — a real first-run: empty ledger, Day 1 (everyone at 0).
//   • buildDemoLog  — ~5 weeks of believable history, used ONLY by the sign-up
//                     tutorial so every screen is populated while it's explained.
// Deterministic (seeded PRNG) — no Date.now/Math.random at module scope.
// ─────────────────────────────────────────────────────────────────────────

import type { LogEntry } from '../engine/types'
import { ACTIVITIES, ACTIVITY_BY_ID } from './activities'
import { sessionFor } from './program'
import { CALL_WEEKDAYS, RUN_WEEKDAYS } from './social'
import { addDays, dateKey, daysBetween, startOfDay, weekIndex, weekday } from '../engine/time'
import { earnFor } from '../engine/ledger'

/** A fresh game starts with no logged history. */
export function buildSeedLog(_startMs: number, _nowMs: number): LogEntry[] {
  void _startMs
  void _nowMs
  return []
}

// ── Demo history (for the tutorial only) ───────────────────────────────────
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(key: string): number {
  let t = (hash(key) + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
function entry(activityId: string, key: string, value: number, xp: number, at: number): LogEntry {
  return { id: `demo:${activityId}:${key}:${at}`, activityId, dateKey: key, value, xp, status: 'completed', at }
}
const DAILY_IDS = ['stretch', 'jumprope', 'meditate', 'pray', 'journal']
function completed(activityId: string, dayIndex: number): boolean {
  const a = ACTIVITY_BY_ID[activityId]
  const missRate = a.missPenalty >= 15 ? 0.05 : 0.08
  return rng(`${activityId}#${dayIndex}`) > missRate
}

/** ~5 weeks of disciplined-but-human history; today left partially done. */
export function buildDemoLog(startMs: number, nowMs: number): LogEntry[] {
  const log: LogEntry[] = []
  const todayStart = startOfDay(nowMs)
  const start = startOfDay(startMs)

  for (let d = start; d <= todayStart; d = addDays(d, 1)) {
    const dayIndex = daysBetween(start, d)
    const key = dateKey(d)
    const wd = weekday(d)
    const wkNum = weekIndex(start, d) + 1
    const isToday = d === todayStart
    const at = d + 11 * 3_600_000

    if (isToday) {
      // A curated partial state so the loop is visible mid-explanation.
      log.push(entry('stretch', key, 1, ACTIVITY_BY_ID.stretch.xp, at))
      log.push(entry('meditate', key, 1, ACTIVITY_BY_ID.meditate.xp, at))
      log.push(entry('pray', key, 1, ACTIVITY_BY_ID.pray.xp, at))
      continue
    }

    for (const id of DAILY_IDS) {
      if (completed(id, dayIndex)) log.push(entry(id, key, 1, ACTIVITY_BY_ID[id].xp, at))
    }
    const session = sessionFor(wkNum, wd)
    if (session.workoutId && completed('workout', dayIndex)) {
      log.push(entry('workout', key, 1, ACTIVITY_BY_ID.workout.xp, at + 3_600_000))
    }
    if (rng(`extra#${dayIndex}`) > 0.78) {
      log.push(entry('extra', key, 1, ACTIVITY_BY_ID.extra.xp, at + 4_000_000))
    }
    if (CALL_WEEKDAYS.includes(wd) && completed('call', dayIndex)) {
      log.push(entry('call', key, 1, ACTIVITY_BY_ID.call.xp, at + 5_000_000))
    }
    if (RUN_WEEKDAYS.includes(wd) && completed('run', dayIndex)) {
      const miles = rng(`runmi#${dayIndex}`) > 0.85 ? 2 : 1 // mostly 1 mi, sometimes 2
      log.push(entry('run', key, miles, earnFor(ACTIVITY_BY_ID.run, miles), at + 6_000_000))
    }
  }

  return log
}

/** Sanity export: the catalog ids that exist. */
export const SEED_ACTIVITY_IDS = ACTIVITIES.map((a) => a.id)
