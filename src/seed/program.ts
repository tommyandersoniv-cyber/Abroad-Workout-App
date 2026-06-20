// ─────────────────────────────────────────────────────────────────────────
// The weekly program (PRD §5.1) + Block A→B progression + U/L rotation.
//
//   Mon  Calisthenics — Upper          Fri  Calisthenics — Upper (rotates L)
//   Tue  Mobility A                     Sat  Mobility B + MITT
//   Wed  Calisthenics — Lower & Core    Sun  Rest (morning stretch only)
//   Thu  HIIT (25 min)
//
// Block A = program weeks 1–4 (ramp); Block B = week 5 → continuous, forever.
// Calisthenics U/L rotates U·L·U then L·U·L on alternating weeks so Upper and
// Lower stay balanced across two weeks (§5.1 default).
// ─────────────────────────────────────────────────────────────────────────

import type { Block, Weekday } from '../engine/types'

export interface DaySession {
  workoutId: string | null // null = rest
  label: string
}

/** 1-based program week → calisthenics block. Weeks 1–4 = A, then B forever. */
export function blockForWeek(weekNumber: number): Block {
  return weekNumber <= 4 ? 'A' : 'B'
}

/**
 * The day's session for a given 1-based program week and weekday (0=Mon).
 * Pure function — drives both the Today list and the Workout Player.
 */
export function sessionFor(weekNumber: number, day: Weekday): DaySession {
  const block = blockForWeek(weekNumber)
  const b = block.toLowerCase()

  // Calisthenics days Mon/Wed/Fri rotate Upper/Lower across two weeks.
  // Odd week: U · L · U   ·   Even week: L · U · L
  const oddWeek = weekNumber % 2 === 1
  const cali = (slot: 'mon' | 'wed' | 'fri'): DaySession => {
    const upper =
      slot === 'wed' ? !oddWeek : oddWeek // Mon/Fri match oddness, Wed is inverted
    const ul = upper ? 'upper' : 'lower'
    return {
      workoutId: `cali-${ul}-${b}`,
      label: `Calisthenics — ${upper ? 'Upper' : 'Lower & Core'} (${block})`,
    }
  }

  switch (day) {
    case 0: return cali('mon')
    case 1: return { workoutId: 'mobility-a', label: 'Mobility A' }
    case 2: return cali('wed')
    case 3: return { workoutId: 'hiit', label: 'HIIT — 25 min' }
    case 4: return cali('fri')
    case 5: return { workoutId: 'mobility-b-mitt', label: 'Mobility B + MITT' }
    case 6: return { workoutId: null, label: 'Rest — morning stretch only' }
  }
}

/** Static template for the Catalog/Builder display (Block-agnostic labels). */
export const WEEKLY_TEMPLATE: { day: string; session: string }[] = [
  { day: 'Mon', session: 'Calisthenics — Upper' },
  { day: 'Tue', session: 'Mobility A' },
  { day: 'Wed', session: 'Calisthenics — Lower & Core' },
  { day: 'Thu', session: 'HIIT (25 min)' },
  { day: 'Fri', session: 'Calisthenics — Upper (rotates Lower)' },
  { day: 'Sat', session: 'Mobility B + MITT' },
  { day: 'Sun', session: 'Rest — stretch only' },
]
