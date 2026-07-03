import { describe, expect, it } from 'vitest'
import { challengePeriodIndex, challengePeriodStart, paceIntervalStart, paceIntervalsElapsed } from './schedule'
import type { Challenge } from './types'

// Local midnights (June 2026: Mon Jun 1).
const jun = (day: number, hour = 0) => new Date(2026, 5, day, hour).getTime()

const weekly: Challenge = {
  id: 'w', name: 'W', icon: 'x', blurb: '', cadence: 'weekly', startAmount: 1, stepAmount: 1, periods: 52,
}
const biweekly: Challenge = {
  id: 'b', name: 'B', icon: 'x', blurb: '', cadence: 'biweekly',
  amounts: [100, 200, 300],
}

describe('challengePeriodStart', () => {
  it('anchors weekly periods to the goal start day, not the calendar week', () => {
    // Goal starts Wed Jun 3 → periods flip every Wednesday.
    expect(challengePeriodIndex(weekly, jun(3), jun(9, 12))).toBe(0) // Tue next week: still period 0
    expect(challengePeriodStart(weekly, jun(3), jun(9, 12))).toBe(jun(3))
    expect(challengePeriodIndex(weekly, jun(3), jun(10, 12))).toBe(1) // Wed: period 1
    expect(challengePeriodStart(weekly, jun(3), jun(10, 12))).toBe(jun(10))
  })

  it('spans two full weeks for biweekly cadence', () => {
    expect(challengePeriodStart(biweekly, jun(1), jun(12))).toBe(jun(1)) // day 11 → still period 0
    expect(challengePeriodStart(biweekly, jun(1), jun(15, 8))).toBe(jun(15)) // day 14 → period 1
    expect(challengePeriodStart(biweekly, jun(1), jun(28))).toBe(jun(15)) // day 27 → still period 1
  })
})

describe('paceIntervalStart', () => {
  it('returns the current interval start for weekly pace', () => {
    expect(paceIntervalStart('weekly', jun(3), jun(9, 23))).toBe(jun(3))
    expect(paceIntervalStart('weekly', jun(3), jun(10, 1))).toBe(jun(10))
  })

  it('anchors monthly pace on the start day-of-month', () => {
    expect(paceIntervalsElapsed('monthly', jun(15), new Date(2026, 6, 14).getTime())).toBe(0)
    expect(paceIntervalStart('monthly', jun(15), new Date(2026, 6, 14).getTime())).toBe(jun(15))
    expect(paceIntervalStart('monthly', jun(15), new Date(2026, 6, 16).getTime())).toBe(new Date(2026, 6, 15).getTime())
  })
})
