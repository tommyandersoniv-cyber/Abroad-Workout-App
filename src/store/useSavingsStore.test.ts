// Store-level guard: logToday must never bank the same period twice.
import './testLocalStorage' // must precede the store import (zustand persist)
import { describe, expect, it } from 'vitest'
import { useSavingsStore } from './useSavingsStore'
import { startOfDay } from '../engine/time'

function deployChallenge(challengeId: string) {
  useSavingsStore.setState({ configured: false, goal: null, contributions: [], archivedSaved: 0, archive: [] })
  useSavingsStore.getState().deployGoal({ name: '', mode: 'challenge', challengeId })
}

describe('logToday double-log guard', () => {
  it('logs the challenge amount once, then returns 0 within the same period', () => {
    deployChallenge('week-52') // week 1 = $1
    const s = () => useSavingsStore.getState()
    expect(s().logToday()).toBe(1)
    expect(s().logToday()).toBe(0) // re-tap: nothing due
    expect(s().contributions.length).toBe(1)
  })

  it('still allows extra manual saves beyond the due amount', () => {
    deployChallenge('week-52')
    const s = () => useSavingsStore.getState()
    expect(s().logToday()).toBe(1)
    s().logContribution(50)
    expect(s().contributions.length).toBe(2)
  })

  it('guards custom-target paces the same way', () => {
    useSavingsStore.setState({ configured: false, goal: null, contributions: [], archivedSaved: 0, archive: [] })
    useSavingsStore.getState().deployGoal({
      name: 'Trip', mode: 'target', totalAmount: 120, timeframeNum: 4, timeframeUnit: 'weeks', pace: 'weekly',
    })
    const s = () => useSavingsStore.getState()
    const first = s().logToday()
    expect(first).toBe(30) // $120 over 4 weekly deposits
    expect(s().logToday()).toBe(0)
    expect(s().contributions.length).toBe(1)
  })

  it('goal starts today, so the guard window starts today', () => {
    deployChallenge('week-52')
    const goal = useSavingsStore.getState().goal!
    expect(goal.startMs).toBe(startOfDay(Date.now()))
  })
})
