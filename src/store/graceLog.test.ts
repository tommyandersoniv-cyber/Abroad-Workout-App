// graceLog — retroactively logging yesterday's habits/workout/calls during the
// 12h grace window. Covers G3-G7 and G9 from contract.md; G1/G2/G8/G10 are
// pure-engine tests in src/engine/time.test.ts and ledger.test.ts.
import './testLocalStorage' // must precede the store import (zustand persist)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from './useGameStore'
import { ACTIVITY_BY_ID } from '../seed/activities'
import { missEntry } from '../engine/ledger'
import { startOfDay } from '../engine/time'
import type { LogEntry } from '../engine/types'

const START = new Date(2026, 6, 1).getTime()
const TODAY_10AM = new Date(2026, 6, 15, 10, 0, 0).getTime() // Wed Jul 15, inside grace
const YESTERDAY_KEY = '2026-07-14'
const MISS_DEADLINE = startOfDay(TODAY_10AM) // yesterday's deadline = today's midnight

const stretch = ACTIVITY_BY_ID.stretch
const originalMiss = missEntry(stretch, YESTERDAY_KEY, MISS_DEADLINE)

function freshState(log: LogEntry[] = []) {
  useGameStore.setState({
    seeded: true,
    startMs: START,
    log,
    // Simulate that resolve() already ran past yesterday's deadline — the
    // watermark will never revisit this occurrence on its own.
    lastResolvedAt: startOfDay(TODAY_10AM),
    demoOffsetMs: 0,
    deferrals: {},
    runCarry: {},
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY_10AM)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('graceLog — reversing a miss into a completion', () => {
  it('G3: removes the miss and adds a full-xp completion under the miss deadline', () => {
    freshState([originalMiss])
    useGameStore.getState().graceLog('stretch')
    const log = useGameStore.getState().log
    expect(log.find((e) => e.id === originalMiss.id)).toBeUndefined()
    const completed = log.find(
      (e) => e.activityId === 'stretch' && e.dateKey === YESTERDAY_KEY && e.status === 'completed',
    )
    expect(completed?.xp).toBe(stretch.xp)
  })

  it('G4: resolve() afterward does not resurrect the reversed miss', () => {
    freshState([originalMiss])
    useGameStore.getState().graceLog('stretch')
    useGameStore.getState().resolve()
    const log = useGameStore.getState().log
    expect(log.filter((e) => e.id === originalMiss.id)).toHaveLength(0)
    expect(log.filter((e) => e.activityId === 'stretch' && e.dateKey === YESTERDAY_KEY)).toHaveLength(1)
  })

  it('G5: toggling off restores the original miss exactly (same id/xp/at)', () => {
    freshState([originalMiss])
    useGameStore.getState().graceLog('stretch')
    useGameStore.getState().graceLog('stretch') // toggle off
    const log = useGameStore.getState().log
    expect(log).toEqual([originalMiss])
  })

  it('G6: on/off/on toggling leaves exactly one entry, ending completed, no duplicate ids', () => {
    freshState([originalMiss])
    const toggle = () => useGameStore.getState().graceLog('stretch')
    toggle() // on
    toggle() // off
    toggle() // on
    const log = useGameStore.getState().log
    const matches = log.filter((e) => e.activityId === 'stretch' && e.dateKey === YESTERDAY_KEY)
    expect(matches).toHaveLength(1)
    expect(matches[0].status).toBe('completed')
    const ids = log.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('G6: an even number of toggles ends missed again, exactly reproducing the original', () => {
    freshState([originalMiss])
    const toggle = () => useGameStore.getState().graceLog('stretch')
    toggle(); toggle(); toggle(); toggle()
    expect(useGameStore.getState().log).toEqual([originalMiss])
  })
})

describe('graceLog — respects the demo clock, not raw wall time (G7)', () => {
  it('a forward demo offset that crosses noon closes the window even though real time is still morning', () => {
    freshState([originalMiss])
    useGameStore.setState({ demoOffsetMs: 3 * 60 * 60 * 1000 }) // 10am + 3h = 1pm
    useGameStore.getState().graceLog('stretch')
    expect(useGameStore.getState().log).toEqual([originalMiss]) // untouched
  })

  it('a backward demo offset reopens the window even though real time is past noon', () => {
    vi.setSystemTime(new Date(2026, 6, 15, 13, 0, 0).getTime()) // real time: 1pm, outside grace
    freshState([originalMiss])
    useGameStore.setState({ demoOffsetMs: -2 * 60 * 60 * 1000 }) // 1pm - 2h = 11am
    useGameStore.getState().graceLog('stretch')
    const log = useGameStore.getState().log
    expect(log.find((e) => e.id === originalMiss.id)).toBeUndefined()
    expect(log.some((e) => e.activityId === 'stretch' && e.status === 'completed')).toBe(true)
  })

  it('is a no-op once real time is past noon with no demo offset', () => {
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0, 0).getTime())
    freshState([originalMiss])
    useGameStore.getState().graceLog('stretch')
    expect(useGameStore.getState().log).toEqual([originalMiss])
  })
})

describe('graceLog — explicit key for pushed-in occurrences (G9)', () => {
  const TUE_KEY = '2026-07-14' // reuse as a stand-in "original" call key
  it('grace-completes under the explicit key with no duplicate on repeat calls', () => {
    freshState([])
    useGameStore.getState().graceLog('call', TUE_KEY)
    let log = useGameStore.getState().log
    expect(log.filter((e) => e.activityId === 'call' && e.dateKey === TUE_KEY)).toHaveLength(1)

    useGameStore.getState().graceLog('call', TUE_KEY) // toggle off
    log = useGameStore.getState().log
    // No miss pre-existed, so toggling off now correctly creates one (it's
    // genuinely un-completed for an occurrence whose deadline has passed).
    const entry = log.find((e) => e.activityId === 'call' && e.dateKey === TUE_KEY)
    expect(entry?.status).toBe('missed')
    expect(log.filter((e) => e.activityId === 'call' && e.dateKey === TUE_KEY)).toHaveLength(1)
  })
})

describe('graceLog — excluded activities', () => {
  it('is a no-op for run (goes through logRun instead)', () => {
    freshState([])
    useGameStore.getState().graceLog('run')
    expect(useGameStore.getState().log).toHaveLength(0)
  })

  it('is a no-op for extra (bonus/repeatable, never due/missed)', () => {
    freshState([])
    useGameStore.getState().graceLog('extra')
    expect(useGameStore.getState().log).toHaveLength(0)
  })
})
