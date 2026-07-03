// Signup wiring: the typed name identifies the 90% rival, not the player you
// control (that stays ME/YOU); the mirror benchmark takes the name backwards.
import './testLocalStorage' // must precede the store import (zustand persist)
import { describe, expect, it } from 'vitest'
import { useGameStore } from './useGameStore'

describe('completeSignup', () => {
  it('names the locked-in rival after the typed name and reverses it for the mirror', () => {
    useGameStore.getState().completeSignup('Sarah')
    const s = useGameStore.getState()
    expect(s.rival.name).toBe('Sarah')
    expect(s.ymmotName).toBe('Haras')
    expect(s.profile?.name).toBe('Sarah')
  })

  it('leaves the player labeled ME regardless of the typed name', () => {
    useGameStore.getState().completeSignup('Sarah')
    expect(useGameStore.getState().playerName).toBe('ME')
  })

  it('trims whitespace from the typed name', () => {
    useGameStore.getState().completeSignup('  Bo  ')
    const s = useGameStore.getState()
    expect(s.rival.name).toBe('Bo')
    expect(s.ymmotName).toBe('Ob')
  })
})
