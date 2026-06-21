import { describe, it, expect } from 'vitest'
import {
  challengeAmountForPeriod,
  challengeTotal,
  challengePeriods,
  challengePeriodIndex,
  challengeCurrentAmount,
  challengeRivalTotal,
  targetDeposits,
  targetPerDeposit,
  targetRivalTotal,
  targetCurrentAmount,
  deadlineFrom,
} from './schedule'
import { savedTotal, savedSince, daysSaved, savingStreak, round2 } from './ledger'
import { CHALLENGE_BY_ID } from '../seed/challenges'
import type { Contribution } from './types'
import { MS_DAY, MS_WEEK, startOfWeek, startOfDay, addMonths } from '../engine/time'

// A clean Monday 00:00 local as "day 0" so weeks line up exactly (same anchor
// the workout engine test uses — 2026-01-05 is a Monday).
const MON = startOfWeek(new Date(2026, 0, 5, 12, 0, 0).getTime())

const c = (amount: number, at: number, dayKey = '2026-01-05'): Contribution => ({
  id: `c:${at}:${amount}`,
  goalId: 'g',
  dateKey: dayKey,
  amount,
  at,
})

describe('challenge totals', () => {
  it('30-Day Dollar Ramp sums to $465', () => {
    expect(challengeTotal(CHALLENGE_BY_ID['dollar-30'])).toBe(465)
  })
  it('52-Week Classic sums to $1,378', () => {
    expect(challengeTotal(CHALLENGE_BY_ID['week-52'])).toBe(1378)
  })
  it('52-Week Reverse also sums to $1,378 (same envelopes, reversed)', () => {
    expect(challengeTotal(CHALLENGE_BY_ID['week-52-reverse'])).toBe(1378)
  })
  it('30-Day Fiver sums to $2,325', () => {
    expect(challengeTotal(CHALLENGE_BY_ID['fiver-30'])).toBe(2325)
  })
  it('amounts-based challenges sum to their headline totals', () => {
    expect(challengeTotal(CHALLENGE_BY_ID['hundred-30'])).toBe(100)
    expect(challengeTotal(CHALLENGE_BY_ID['grand-30'])).toBe(1000)
    expect(challengeTotal(CHALLENGE_BY_ID['grand-3mo'])).toBe(1008)
    expect(challengeTotal(CHALLENGE_BY_ID['biweekly-5k'])).toBe(5000)
    expect(challengeTotal(CHALLENGE_BY_ID['biweekly-10k'])).toBe(10000)
    expect(challengeTotal(CHALLENGE_BY_ID['five-hundred-30'])).toBe(500)
  })
  it('100-envelope challenges sum to 1+2+…+100 (and its double)', () => {
    expect(challengeTotal(CHALLENGE_BY_ID['envelope-100'])).toBe(5050)
    expect(challengeTotal(CHALLENGE_BY_ID['envelope-200'])).toBe(10100)
    expect(challengePeriods(CHALLENGE_BY_ID['envelope-100'])).toBe(100)
  })
  it('challengePeriods reflects schedule length or ramp count', () => {
    expect(challengePeriods(CHALLENGE_BY_ID['hundred-30'])).toBe(30)
    expect(challengePeriods(CHALLENGE_BY_ID['biweekly-5k'])).toBe(26)
    expect(challengePeriods(CHALLENGE_BY_ID['grand-3mo'])).toBe(12)
  })
  it('amount for a period escalates linearly', () => {
    const ch = CHALLENGE_BY_ID['dollar-30']
    expect(challengeAmountForPeriod(ch, 0)).toBe(1)
    expect(challengeAmountForPeriod(ch, 1)).toBe(2)
    expect(challengeAmountForPeriod(ch, 29)).toBe(30)
  })
})

describe('challenge day index + today target (daily ramp)', () => {
  const ch = CHALLENGE_BY_ID['dollar-30']
  it('day 0 = index 0, today owes $1, rival has banked $0', () => {
    const now = MON + 12 * 3_600_000
    expect(challengePeriodIndex(ch, MON, now)).toBe(0)
    expect(challengeCurrentAmount(ch, MON, now)).toBe(1)
    expect(challengeRivalTotal(ch, MON, now)).toBe(0)
  })
  it('day 1 = index 1, today owes $2, rival banked day-0 = $1', () => {
    const now = MON + MS_DAY + 12 * 3_600_000
    expect(challengePeriodIndex(ch, MON, now)).toBe(1)
    expect(challengeCurrentAmount(ch, MON, now)).toBe(2)
    expect(challengeRivalTotal(ch, MON, now)).toBe(1)
  })
  it('at the end (+30 days) the rival has banked the full $465 and nothing is due', () => {
    const now = MON + 30 * MS_DAY
    expect(challengeRivalTotal(ch, MON, now)).toBe(465)
    expect(challengeCurrentAmount(ch, MON, now)).toBe(0)
  })
  it('rival total is capped at the challenge length past the finish', () => {
    expect(challengeRivalTotal(ch, MON, MON + 90 * MS_DAY)).toBe(465)
  })
})

describe('challenge index (weekly ramp uses 7-day blocks from start)', () => {
  const ch = CHALLENGE_BY_ID['week-52']
  it('still in week 0 after 6 days', () => {
    expect(challengePeriodIndex(ch, MON, MON + 6 * MS_DAY)).toBe(0)
    expect(challengeCurrentAmount(ch, MON, MON + 6 * MS_DAY)).toBe(1)
  })
  it('rolls to week 1 after 7 days; rival banked week 0 = $1', () => {
    const now = MON + 7 * MS_DAY + 3_600_000
    expect(challengePeriodIndex(ch, MON, now)).toBe(1)
    expect(challengeRivalTotal(ch, MON, now)).toBe(1)
  })
  it('rival banks $1+$2+$3 after 3 full weeks', () => {
    expect(challengeRivalTotal(ch, MON, MON + 3 * MS_WEEK + 3_600_000)).toBe(6)
  })
})

describe('amounts-based + biweekly challenges', () => {
  const stepped = CHALLENGE_BY_ID['hundred-30'] // daily, $1×5,$2×5,...
  it('reads the per-period schedule (daily, stepped)', () => {
    expect(challengeAmountForPeriod(stepped, 0)).toBe(1)
    expect(challengeAmountForPeriod(stepped, 5)).toBe(2)
    expect(challengeCurrentAmount(stepped, MON, MON + 5 * MS_DAY + 3_600_000)).toBe(2) // day 5
    expect(challengeRivalTotal(stepped, MON, MON + 5 * MS_DAY)).toBe(5) // first 5 days banked $1 each
  })
  const pay = CHALLENGE_BY_ID['biweekly-5k'] // biweekly paychecks
  it('biweekly cadence steps every 14 days', () => {
    expect(challengePeriodIndex(pay, MON, MON + 13 * MS_DAY)).toBe(0)
    expect(challengePeriodIndex(pay, MON, MON + 14 * MS_DAY)).toBe(1)
    expect(challengeRivalTotal(pay, MON, MON + 14 * MS_DAY)).toBe(150) // first paycheck banked
    expect(challengeRivalTotal(pay, MON, MON + 28 * MS_DAY)).toBe(350) // + second ($200)
  })
})

describe('custom target — total + timeframe + pace', () => {
  it('monthly: $1,200 over 12 months = 12 deposits of $100', () => {
    const deadline = deadlineFrom(MON, 12, 'months')
    expect(targetDeposits('monthly', MON, deadline)).toBe(12)
    expect(targetPerDeposit(1200, 'monthly', MON, deadline)).toBeCloseTo(100, 6)
    expect(targetRivalTotal(1200, 'monthly', MON, deadline, MON)).toBe(0)
    expect(targetRivalTotal(1200, 'monthly', MON, deadline, addMonths(MON, 1))).toBeCloseTo(100, 6)
    expect(targetRivalTotal(1200, 'monthly', MON, deadline, deadline)).toBeCloseTo(1200, 6)
  })
  it('daily: $300 over 30 days = 30 deposits of $10, banked daily', () => {
    const deadline = deadlineFrom(MON, 30, 'weeks') // not used for count here
    void deadline
    const dl = MON + 30 * MS_DAY
    expect(targetDeposits('daily', MON, dl)).toBe(30)
    expect(targetPerDeposit(300, 'daily', MON, dl)).toBeCloseTo(10, 6)
    expect(targetRivalTotal(300, 'daily', MON, dl, MON + MS_DAY)).toBeCloseTo(10, 6)
    expect(targetRivalTotal(300, 'daily', MON, dl, dl)).toBeCloseTo(300, 6)
    expect(targetCurrentAmount(300, 'daily', MON, dl, MON + MS_DAY)).toBeCloseTo(10, 6)
    expect(targetCurrentAmount(300, 'daily', MON, dl, dl)).toBe(0) // nothing due at/after deadline
  })
  it('bi-weekly: $260 over 20 weeks = 10 deposits of $26', () => {
    const dl = MON + 20 * MS_WEEK
    expect(targetDeposits('biweekly', MON, dl)).toBe(10)
    expect(targetPerDeposit(260, 'biweekly', MON, dl)).toBeCloseTo(26, 6)
    expect(targetRivalTotal(260, 'biweekly', MON, dl, MON + 14 * MS_DAY)).toBeCloseTo(26, 6)
  })
  it('deadlineFrom advances by the right unit', () => {
    expect(deadlineFrom(MON, 2, 'weeks')).toBe(startOfDay(MON) + 2 * MS_WEEK)
    expect(deadlineFrom(MON, 1, 'years')).toBe(addMonths(startOfDay(MON), 12))
  })
})

describe('your saved total + streak', () => {
  it('savedTotal sums contributions at/before now', () => {
    const log = [c(25, MON + 1000), c(10, MON + 2000), c(5.5, MON + 3000)]
    expect(savedTotal(log)).toBe(40.5)
    expect(savedTotal(log, MON + 1500)).toBe(25)
  })
  it('savedSince windows correctly and rounds to cents', () => {
    const log = [c(10.1, MON + 1000), c(0.2, MON + 2000)]
    expect(savedSince(log, MON, MON + 5000)).toBe(10.3)
  })
  it('daysSaved counts distinct day-keys', () => {
    const log = [c(5, MON, '2026-01-05'), c(5, MON + 1000, '2026-01-05'), c(5, MON + MS_DAY, '2026-01-06')]
    expect(daysSaved(log)).toBe(2)
  })
  it('savingStreak counts consecutive days back from today', () => {
    const now = startOfDay(MON + 2 * MS_DAY) + 12 * 3_600_000
    const log = [
      c(1, MON, '2026-01-05'),
      c(1, MON + MS_DAY, '2026-01-06'),
      c(1, MON + 2 * MS_DAY, '2026-01-07'),
    ]
    expect(savingStreak(log, now)).toBe(3)
    const gappy = [c(1, MON, '2026-01-05'), c(1, MON + 2 * MS_DAY, '2026-01-07')]
    expect(savingStreak(gappy, now)).toBe(1)
  })
  it('round2 avoids float dust', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
  })
})
