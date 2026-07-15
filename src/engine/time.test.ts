// DST regression tests. TZ is pinned to a DST-observing zone BEFORE any Date
// use so the fall-back (25h) and spring-forward (23h) days are real.
declare const process: { env: Record<string, string | undefined> }
process.env.TZ = 'Europe/Berlin'

import { describe, expect, it } from 'vitest'
import { MS_DAY, addDays, dateKey, endOfDay, endOfWeek, graceDateKey, inGraceWindow, startOfWeek } from './time'
import { resolveMisses } from './ledger'
import type { Activity } from './types'

// Local midnights around the 2026 European fall-back (Sun Oct 25: 25 hours).
const oct = (day: number) => new Date(2026, 9, day).getTime()

describe('addDays across DST', () => {
  it('is running in a DST-observing zone (sanity)', () => {
    expect(new Date(2026, 6, 1).getTimezoneOffset()).not.toBe(new Date(2026, 11, 1).getTimezoneOffset())
  })

  it('visits each calendar day exactly once over the fall-back day', () => {
    const keys: string[] = []
    for (let d = oct(23), i = 0; i < 5; d = addDays(d, 1), i++) keys.push(dateKey(d))
    expect(keys).toEqual(['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'])
  })

  it('visits each calendar day exactly once over spring-forward', () => {
    const keys: string[] = []
    for (let d = new Date(2026, 2, 28).getTime(), i = 0; i < 4; d = addDays(d, 1), i++) keys.push(dateKey(d))
    expect(keys).toEqual(['2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31'])
  })

  it('steps backwards correctly too', () => {
    expect(dateKey(addDays(oct(26), -1))).toBe('2026-10-25')
    expect(dateKey(addDays(oct(26), -2))).toBe('2026-10-24')
  })

  it('endOfDay lands on the true next midnight even on a 25h day', () => {
    // Oct 25 has 25 hours: raw startOfDay + MS_DAY would stop at 23:00.
    expect(endOfDay(oct(25))).toBe(oct(26))
    expect(oct(26) - oct(25)).toBe(MS_DAY + 3_600_000)
  })

  it('endOfWeek lands on the next Monday midnight across the DST week', () => {
    const monday = new Date(2026, 9, 19).getTime() // Mon Oct 19
    expect(startOfWeek(oct(25))).toBe(monday)
    expect(endOfWeek(oct(25))).toBe(oct(26)) // Mon Oct 26 00:00
  })
})

describe('inGraceWindow — the 12h grace-window cutoff', () => {
  it('is true right up to the last millisecond before noon', () => {
    expect(inGraceWindow(new Date(2026, 6, 15, 11, 59, 59, 999).getTime())).toBe(true)
  })

  it('is false at exactly noon and after', () => {
    expect(inGraceWindow(new Date(2026, 6, 15, 12, 0, 0, 0).getTime())).toBe(false)
    expect(inGraceWindow(new Date(2026, 6, 15, 13, 0, 0, 0).getTime())).toBe(false)
  })

  it('is true just after midnight', () => {
    expect(inGraceWindow(new Date(2026, 6, 15, 0, 0, 0, 1).getTime())).toBe(true)
  })
})

describe('graceDateKey — yesterday relative to a moment', () => {
  it("returns the previous calendar day's key regardless of time of day", () => {
    expect(graceDateKey(new Date(2026, 6, 15, 9, 30).getTime())).toBe('2026-07-14')
  })

  it('is DST-safe across the fall-back boundary (reuses addDays)', () => {
    // "Yesterday" from Oct 26 (the day after the 25h fall-back day) is Oct 25.
    expect(graceDateKey(oct(26) + 9 * 3_600_000)).toBe('2026-10-25')
  })

  it('is DST-safe across the spring-forward boundary', () => {
    const mar31 = new Date(2026, 2, 31, 9, 0, 0).getTime()
    expect(graceDateKey(mar31)).toBe('2026-03-30')
  })
})

describe('resolveMisses across DST', () => {
  const daily: Activity = {
    id: 'stretch',
    name: 'Stretch',
    category: 'movement',
    icon: '🤸',
    xp: 5,
    unit: 'per_session',
    cadence: 'daily',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    missPenalty: 5,
    requiresTimer: false,
    repeatable: false,
    blurb: '',
  }

  it('emits exactly one miss per calendar day over the fall-back weekend', () => {
    // now = Oct 27 12:00 → deadlines passed for Oct 23–26 only (27 is still open).
    const { misses } = resolveMisses([daily], [], oct(23), oct(23), oct(27) + 12 * 3_600_000)
    const ids = misses.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length) // no duplicate ids
    expect(misses.map((m) => m.dateKey)).toEqual([
      '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26',
    ])
  })
})
