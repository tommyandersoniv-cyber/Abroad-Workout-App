import { describe, it, expect } from 'vitest'
import { ACTIVITIES } from '../seed/activities'
import {
  maxXP,
  rivalXP,
  playerXP,
  resolveMisses,
  earnFor,
  fullOccurrenceXP,
  missEntry,
  occurrenceKey,
} from './ledger'
import { MS_DAY, MS_WEEK, endOfWeek, startOfWeek } from './time'
import type { Activity, LogEntry } from './types'

// A clean Monday 00:00 local as "day 0" so weeks line up exactly.
const MON = startOfWeek(new Date(2026, 0, 5, 12, 0, 0).getTime()) // 2026-01-05 is a Monday
const PERFECT_WEEK = 284
const A = ACTIVITIES

describe('catalog sanity', () => {
  it('a perfect week sums to exactly 284', () => {
    const weekly = A.filter((a) => a.cadence !== 'bonus' && !a.repeatable).reduce(
      (sum, a) =>
        sum + fullOccurrenceXP(a) * (a.cadence === 'weekly' ? 1 : a.schedule.length),
      0,
    )
    expect(weekly).toBe(PERFECT_WEEK)
  })
})

describe('maxXP — the rival benchmark (daily-stepped)', () => {
  it('is 0 at day 0', () => {
    expect(maxXP(A, MON, MON)).toBe(0)
  })

  it('lands on N×284 at exact week boundaries', () => {
    expect(maxXP(A, MON, MON + 1 * MS_WEEK)).toBeCloseTo(284, 6)
    expect(maxXP(A, MON, MON + 4 * MS_WEEK)).toBeCloseTo(1136, 6)
    expect(maxXP(A, MON, MON + 12 * MS_WEEK)).toBeCloseTo(3408, 6)
    expect(maxXP(A, MON, MON + 52 * MS_WEEK)).toBeCloseTo(14768, 6)
  })

  it('rival holds 90% of max — the cumulative table', () => {
    expect(rivalXP(A, MON, MON + 1 * MS_WEEK, 0.9)).toBeCloseTo(255.6, 4)
    expect(rivalXP(A, MON, MON + 4 * MS_WEEK, 0.9)).toBeCloseTo(1022.4, 4)
    expect(rivalXP(A, MON, MON + 12 * MS_WEEK, 0.9)).toBeCloseTo(3067.2, 4)
    expect(rivalXP(A, MON, MON + 52 * MS_WEEK, 0.9)).toBeCloseTo(13291.2, 4)
  })

  it('banks the CPU lump once per day, not continuously', () => {
    // Mid-day-1: no full day has elapsed yet → still 0.
    expect(maxXP(A, MON, MON + 6 * 3_600_000)).toBe(0)
    // Flat across day 4 — no smooth accrual within a day.
    const noon = maxXP(A, MON, MON + 3 * MS_DAY + 12 * 3_600_000)
    const evening = maxXP(A, MON, MON + 3 * MS_DAY + 20 * 3_600_000)
    expect(evening).toBe(noon)
    // Jumps as the next day starts.
    const startD4 = maxXP(A, MON, MON + 3 * MS_DAY)
    const startD5 = maxXP(A, MON, MON + 4 * MS_DAY)
    expect(startD4).toBe(noon) // day 4's points aren't banked until day 5 starts
    expect(startD5).toBeGreaterThan(startD4)
  })

  it('excludes extra workouts and miles beyond target from the ceiling', () => {
    // Adding a repeatable bonus activity must not change maxXP.
    const withBonus = maxXP([...A], MON, MON + MS_WEEK)
    const withoutBonus = maxXP(
      A.filter((x) => !x.repeatable),
      MON,
      MON + MS_WEEK,
    )
    expect(withBonus).toBeCloseTo(withoutBonus, 6)
  })

  it('difficulty tiers scale the hold fraction', () => {
    const m = maxXP(A, MON, MON + MS_WEEK)
    expect(rivalXP(A, MON, MON + MS_WEEK, 0.5)).toBeCloseTo(m * 0.5, 6)
    expect(rivalXP(A, MON, MON + MS_WEEK, 0.7)).toBeCloseTo(m * 0.7, 6)
  })
})

describe('miss resolution — the §4.3 "missed −15 items" table', () => {
  // Build a perfect week of completions, then knock out N workout-type items.
  function perfectWeekLog(): LogEntry[] {
    const log: LogEntry[] = []
    // daily + scheduled items (workout, stretch, rope, mind, calls, run) on their days
    const daily = A.filter((a) => a.cadence === 'daily' || a.cadence === 'scheduled')
    for (const a of daily) {
      for (let d = 0; d < 7; d++) {
        const day = MON + d * MS_DAY
        const wd = (((new Date(day).getDay() + 6) % 7))
        if (!a.schedule.includes(wd as never)) continue
        const key = isoKey(day)
        const xp = a.id === 'run' ? earnFor(a, 1) : a.xp // 1 mile per run day → +5 (×3 = 15)
        log.push(entry(a, key, xp, day))
      }
    }
    return log
  }

  it('a flawless week = +28 over the rival', () => {
    const log = perfectWeekLog()
    const you = playerXP(log)
    const rival = rivalXP(A, MON, MON + MS_WEEK, 0.9)
    expect(you).toBe(284)
    expect(you - rival).toBeCloseTo(28.4, 4)
  })

  it('each missed −15 item is a 25-point swing (259 / 234 / 209)', () => {
    const expected = [284, 259, 234, 209]
    const m15 = A.filter((a) => a.missPenalty === 15).map((a) => a.id)
    for (let n = 0; n <= 3; n++) {
      const log = perfectWeekLog()
      // Remove n workout-type completions and let resolution dock them.
      let removed = 0
      const trimmed = log.filter((e) => {
        if (removed < n && m15.includes(e.activityId) && e.dateKey === isoKey(MON)) {
          // remove this completion (the Monday occurrence of n distinct −15 items)
          if (e.activityId === pick15(m15, removed)) {
            removed++
            return false
          }
        }
        return true
      })
      const { misses } = resolveMisses(A, trimmed, MON, MON, MON + MS_WEEK)
      // Only the n removed Monday items should resolve as misses.
      const total = playerXP([...trimmed, ...misses])
      expect(total).toBe(expected[n])
    }
  })

  it('resolves misses correctly after the app is closed for a week', () => {
    // No completions at all for one full week → every scheduled item docked.
    const { misses, resolvedAt } = resolveMisses(A, [], MON, MON, MON + MS_WEEK)
    expect(resolvedAt).toBe(MON + MS_WEEK)
    // Sum of all penalties for one week:
    const dailyPenalty = A.filter(
      (a) => a.cadence === 'daily' || a.cadence === 'scheduled',
    ).reduce((s, a) => s + a.missPenalty * a.schedule.length, 0)
    const weeklyPenalty = A.filter((a) => a.cadence === 'weekly').reduce(
      (s, a) => s + a.missPenalty,
      0,
    )
    const expected = -(dailyPenalty + weeklyPenalty)
    expect(playerXP(misses)).toBe(expected)
  })

  it('does not double-resolve already-watermarked occurrences', () => {
    const first = resolveMisses(A, [], MON, MON, MON + MS_WEEK)
    const second = resolveMisses(A, first.misses, MON, first.resolvedAt, MON + MS_WEEK)
    expect(second.misses).toHaveLength(0)
  })

  it("today's items are not missed until the day ends", () => {
    // Midday of the very first day: nothing is due-and-gone yet.
    const { misses } = resolveMisses(A, [], MON, MON, MON + MS_DAY / 2)
    expect(misses).toHaveLength(0)
  })
})

describe('run hard target (1 mile/day × 3 days)', () => {
  const run = byId('run')
  it('≥1 mile → +5/mile, uncapped', () => {
    expect(earnFor(run, 1)).toBe(5)
    expect(earnFor(run, 2)).toBe(10)
    expect(earnFor(run, 3)).toBe(15)
  })
  it('under 1 mile → 0 earned (no partial credit)', () => {
    expect(earnFor(run, 0.5)).toBe(0)
    expect(earnFor(run, 0)).toBe(0)
  })
  it('a missed run day resolves to −5', () => {
    const { misses } = resolveMisses(A, [], MON, MON, MON + MS_WEEK)
    const runMiss = misses.find((m) => m.activityId === 'run')
    expect(runMiss?.xp).toBe(-5)
  })
})

describe('grace-log support: weekly occurrence keying + missEntry (G8)', () => {
  const weekly: Activity = {
    id: 'weigh-in',
    name: 'Weekly Weigh-in',
    category: 'weekly',
    icon: '⚖',
    xp: 8,
    unit: 'per_session',
    cadence: 'weekly',
    schedule: [],
    missPenalty: 6,
    requiresTimer: false,
    repeatable: false,
    blurb: '',
  }

  it("files a weekly activity's occurrence under its week's Monday key, not the raw day", () => {
    // A Sunday (last day of its week) should still key to that week's Monday.
    const sunday = MON + 6 * MS_DAY
    expect(occurrenceKey(weekly, sunday)).toBe(occurrenceKey(weekly, MON))
    expect(occurrenceKey(weekly, sunday)).not.toBe(isoKey(sunday))
  })

  it('missEntry builds a restorable miss with the week deadline, matching resolveMisses', () => {
    const key = occurrenceKey(weekly, MON)
    const restored = missEntry(weekly, key, endOfWeek(MON))
    expect(restored).toEqual({
      id: `miss:weigh-in:${key}`,
      activityId: 'weigh-in',
      dateKey: key,
      value: 0,
      xp: -weekly.missPenalty,
      status: 'missed',
      at: endOfWeek(MON),
    })
    // Round-trips through resolveMisses' own miss format exactly.
    const { misses } = resolveMisses([weekly], [], MON, MON, MON + MS_WEEK)
    expect(misses).toEqual([restored])
  })
})

// ── helpers ──────────────────────────────────────────────────────────────
function byId(id: string): Activity {
  return A.find((a) => a.id === id)!
}
function isoKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
function entry(a: Activity, key: string, xp: number, at: number): LogEntry {
  return { id: `${a.id}:${key}`, activityId: a.id, dateKey: key, value: 1, xp, status: 'completed', at }
}
// distinct −15 ids in a stable order for the swing test
function pick15(ids: string[], n: number): string {
  return ids[n]
}
