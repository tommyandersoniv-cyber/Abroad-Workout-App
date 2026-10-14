import { describe, expect, it } from 'vitest'
import { addDays, dateKey, fromKey, isCurrentOrFuture, monthKeys, periodLabel, shiftPeriod, weekKeys, weekStart } from './date'
import {
  DEFAULT_SETTINGS, doneCount, emptyDay, habitStatus, habitsInOrder, normalizeRange, randomDurationSec,
  reminders, upNext, type DayLog,
} from './habits'
import { dimensionDays, isGoodHabitDay, isGoodReflectionDay } from './stats'
import { intentionFor } from './dimensions'
import { buildIcs } from './ics'
import { ENCOURAGEMENTS } from './encourage'

const S = DEFAULT_SETTINGS

/** A day with every habit fully done. */
function fullDay(): DayLog {
  return {
    adds: { pushups: [100], situps: [100] },
    secs: { stretch: 480, jumprope: 180, journal: 180, meditate: 400 },
    done: { prayAM: true, prayPM: true, stretch: true, jumprope: true, journal: true, meditate: true },
  }
}
/** A day with exactly n habits done (in HABITS order). */
function dayWith(n: number): DayLog {
  const f = fullDay()
  const d = emptyDay()
  const order = ['prayAM', 'stretch', 'jumprope', 'pushups', 'situps', 'journal', 'meditate', 'prayPM'] as const
  for (const id of order.slice(0, n)) {
    if (id === 'pushups' || id === 'situps') d.adds[id] = f.adds[id]
    else d.done[id] = true
  }
  return d
}

describe('dates', () => {
  it('weeks run Sunday → Saturday', () => {
    const wed = new Date(2026, 9, 14) // Wed Oct 14 2026
    expect(dateKey(weekStart(wed))).toBe('2026-10-11')
    expect(weekKeys(wed)).toEqual([
      '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17',
    ])
    expect(dateKey(weekStart(new Date(2026, 9, 11)))).toBe('2026-10-11') // Sunday is its own start
    expect(dateKey(weekStart(new Date(2026, 9, 17)))).toBe('2026-10-11') // Saturday
  })
  it('day keys roll over at local midnight', () => {
    expect(dateKey(new Date(2026, 9, 14, 23, 59, 59))).toBe('2026-10-14')
    expect(dateKey(new Date(2026, 9, 15, 0, 0, 0))).toBe('2026-10-15')
    expect(dateKey(addDays(fromKey('2026-10-31'), 1))).toBe('2026-11-01')
  })
  it('month keys and period navigation', () => {
    expect(monthKeys(new Date(2026, 1, 10))).toHaveLength(28)
    const now = new Date(2026, 9, 14)
    expect(isCurrentOrFuture(now, 'week', now)).toBe(true)
    expect(isCurrentOrFuture(shiftPeriod(now, 'week', -1), 'week', now)).toBe(false)
    expect(isCurrentOrFuture(shiftPeriod(now, 'month', -1), 'month', now)).toBe(false)
    expect(periodLabel(now, 'week', now)).toBe('This Week')
    expect(periodLabel(shiftPeriod(now, 'week', -1), 'week', now)).toBe('Last Week')
    expect(periodLabel(shiftPeriod(now, 'week', -2), 'week', now)).toBe('Sep 27–Oct 3')
    expect(periodLabel(now, 'month', now)).toBe('October')
  })
})

describe('habits', () => {
  it('counters: done at target, partial below, can exceed', () => {
    expect(habitStatus('pushups', { ...emptyDay(), adds: { pushups: [25, 25] } }, S)).toBe('partial')
    expect(habitStatus('pushups', { ...emptyDay(), adds: { pushups: [50, 50] } }, S)).toBe('done')
    expect(habitStatus('pushups', { ...emptyDay(), adds: { pushups: [100, 25] } }, S)).toBe('done')
    expect(habitStatus('pushups', emptyDay(), S)).toBe('none')
    expect(habitStatus('situps', { ...emptyDay(), adds: { situps: [40] } }, { ...S, situpTarget: 40 })).toBe('done')
  })
  it('timers: partial seconds count as progress, done only when finished', () => {
    expect(habitStatus('journal', { ...emptyDay(), secs: { journal: 70 } }, S)).toBe('partial')
    expect(habitStatus('journal', { ...emptyDay(), secs: { journal: 200 }, done: { journal: true } }, S)).toBe('done')
    expect(habitStatus('prayAM', { ...emptyDay(), done: { prayAM: true } }, S)).toBe('done')
  })
  it('random duration stays inside the range', () => {
    const r = { min: 5, max: 10 }
    expect(randomDurationSec(r, () => 0)).toBe(300)
    expect(randomDurationSec(r, () => 0.999999)).toBe(600)
    for (let i = 0; i < 500; i++) {
      const s = randomDurationSec(r)
      expect(s).toBeGreaterThanOrEqual(300)
      expect(s).toBeLessThanOrEqual(600)
      expect(Number.isInteger(s)).toBe(true)
    }
  })
  it('settings ranges are normalized so min ≤ max', () => {
    expect(normalizeRange({ min: 8, max: 3 })).toEqual({ min: 3, max: 8 })
    expect(normalizeRange({ min: 0, max: 0 })).toEqual({ min: 1, max: 1 })
  })
  it('Today order follows the reminder schedule', () => {
    expect(habitsInOrder(S.times).map((h) => h.id)).toEqual([
      'prayAM', 'stretch', 'jumprope', 'pushups', 'situps', 'journal', 'meditate', 'prayPM',
    ])
  })
  it('up next skips what is already done', () => {
    const log = { ...emptyDay(), done: { prayAM: true } }
    expect(upNext(S, log, false, 7 * 60)?.id).toBe('stretch')
    expect(upNext(S, emptyDay(), false, 22 * 60)?.id).toBe('prayAM') // wraps to earliest open
    expect(upNext(S, fullDay(), true, 12 * 60)).toBeNull()
  })
})

describe('stats', () => {
  const now = new Date(2026, 9, 14)
  const wk = weekKeys(now)
  it('good days need 5 of 8', () => {
    expect(isGoodHabitDay(dayWith(4), S)).toBe(false)
    expect(isGoodHabitDay(dayWith(5), S)).toBe(true)
    expect(doneCount(fullDay(), S)).toBe(8)
    expect(isGoodReflectionDay(['body', 'mind', 'heart', 'soul'])).toBe(false)
    expect(isGoodReflectionDay(['body', 'mind', 'heart', 'soul', 'give'])).toBe(true)
  })
  it('a dimension counts each day it was lived this week', () => {
    const refl = { [wk[0]]: ['body' as const], [wk[2]]: ['body' as const, 'mind' as const], '2026-09-01': ['body' as const] }
    expect(dimensionDays('body', wk, refl)).toBe(2)
    expect(dimensionDays('give', wk, refl)).toBe(0)
  })
})

describe('intention', () => {
  it('picks the dimension lived least in the previous 7 days, ignoring today', () => {
    const today = '2026-10-14'
    const byDay = {
      '2026-10-13': ['body', 'mind', 'heart', 'soul', 'create', 'connect', 'give'] as const,
      '2026-10-14': [] as const,
    }
    expect(intentionFor(today, byDay as never).id).toBe('restore')
    expect(intentionFor(today, { ...byDay, '2026-10-14': ['restore'] } as never).id).toBe('restore')
  })
})

describe('calendar file', () => {
  const ics = buildIcs(S, new Date(2026, 9, 14), new Date(Date.UTC(2026, 9, 14, 12)))
  const events = ics.split('BEGIN:VEVENT').slice(1)
  it('has one daily repeating event with an alarm per reminder', () => {
    expect(events).toHaveLength(reminders(S).length)
    expect(events).toHaveLength(11)
    for (const e of events) {
      expect(e).toContain('RRULE:FREQ=DAILY')
      expect(e).toContain('BEGIN:VALARM')
      expect(e).toContain('TRIGGER:PT0S')
    }
  })
  it('uses floating local times and CRLF line endings', () => {
    expect(ics).toContain('DTSTART:20261014T073000\r\n')
    expect(ics).toContain('DTSTART:20261014T214000\r\n')
    expect(ics).not.toMatch(/DTSTART[^\r]*Z/)
    expect(ics).not.toContain('TZID')
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true)
  })
  it('reflects edited times and targets', () => {
    const edited = buildIcs({ ...S, pushupTarget: 80, times: { ...S.times, prayAM: '06:15' } }, new Date(2026, 9, 14))
    expect(edited).toContain('DTSTART:20261014T061500')
    expect(edited).toContain('SUMMARY:20 pushups + 25 sit-ups')
  })
})

describe('copy', () => {
  it('has at least 15 encouragements', () => expect(ENCOURAGEMENTS.length).toBeGreaterThanOrEqual(15))
})

describe('stretch flow', () => {
  it('runs 14 stretches in exactly 15:00 including 3s get-set gaps', async () => {
    const { STRETCHES, STRETCH_TOTAL_SEC, PHASES } = await import('./stretch')
    expect(STRETCHES).toHaveLength(14)
    expect(PHASES).toEqual(['Wake the Spine', 'Open the Hips', 'Free the Shoulders', 'Finish Standing'])
    expect(STRETCH_TOTAL_SEC).toBe(15 * 60)
    expect(STRETCHES.filter((s) => s.sides === 2)).toHaveLength(9)
  })
})
