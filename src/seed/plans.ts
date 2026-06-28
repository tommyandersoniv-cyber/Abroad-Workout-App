// ─────────────────────────────────────────────────────────────────────────
// Selectable weekly plans. Each plan decides which workout lands on each day
// of the week; the active plan (stored in the game store) drives what shows up
// as the scheduled session on Today/Arena.
//
// The "balanced" plan is the original program (block A→B progression + U/L
// rotation, see program.ts). The others are simple static weekly templates,
// still block-aware for the calisthenics days so they pull the right workout id.
// ─────────────────────────────────────────────────────────────────────────

import type { Block, Weekday } from '../engine/types'
import { sessionFor as balancedSessionFor, blockForWeek, type DaySession } from './program'

export interface WeeklyPlan {
  id: string
  name: string
  icon: string
  blurb: string
  /** Short Mon→Sun summary for the plan card. */
  days: string[]
  /** Resolve the session for a 1-based program week and weekday (0=Mon). */
  sessionFor: (weekNumber: number, day: Weekday) => DaySession
}

// A day slot in a static template: a rest day, a fixed workout, or a
// block-aware calisthenics upper/lower day.
type Slot = 'rest' | { id: string; label: string } | { cali: 'upper' | 'lower' }

const REST: DaySession = { workoutId: null, label: 'Rest — morning stretch only' }

function resolveSlot(slot: Slot, block: Block): DaySession {
  if (slot === 'rest') return REST
  if ('cali' in slot) {
    const upper = slot.cali === 'upper'
    return {
      workoutId: `cali-${slot.cali}-${block.toLowerCase()}`,
      label: `Calisthenics — ${upper ? 'Upper' : 'Lower & Core'} (${block})`,
    }
  }
  return { workoutId: slot.id, label: slot.label }
}

function shortLabel(slot: Slot): string {
  if (slot === 'rest') return 'Rest'
  if ('cali' in slot) return slot.cali === 'upper' ? 'Cali · Upper' : 'Cali · Lower'
  return slot.label
}

/** Build a plan from a 7-entry (Mon→Sun) static template. */
function templatePlan(
  meta: { id: string; name: string; icon: string; blurb: string },
  week: Slot[],
): WeeklyPlan {
  return {
    ...meta,
    days: week.map(shortLabel),
    sessionFor: (weekNumber, day) => resolveSlot(week[day], blockForWeek(weekNumber)),
  }
}

const BALANCED: WeeklyPlan = {
  id: 'balanced',
  name: 'Balanced Split',
  icon: '🤸',
  blurb: 'The default — calisthenics U/L rotation, mobility, HIIT & a Saturday combo.',
  days: ['Cali · Upper', 'Mobility A', 'Cali · Lower', 'HIIT', 'Cali (rot.)', 'Mob B + MITT', 'Rest'],
  sessionFor: balancedSessionFor,
}

const STRENGTH = templatePlan(
  {
    id: 'strength',
    name: 'Strength Focus',
    icon: '💪',
    blurb: 'Four calisthenics days, one mobility reset, one HIIT. Maximum hypertrophy.',
  },
  [
    { cali: 'upper' },
    { cali: 'lower' },
    { id: 'mobility-a', label: 'Mobility A' },
    { cali: 'upper' },
    { cali: 'lower' },
    { id: 'hiit', label: 'HIIT' },
    'rest',
  ],
)

const MOBILITY = templatePlan(
  {
    id: 'mobility',
    name: 'Mobility & Recovery',
    icon: '🧘',
    blurb: 'Joint health first — lots of mobility, two strength days, a gentle finisher.',
  },
  [
    { id: 'mobility-a', label: 'Mobility A' },
    { cali: 'upper' },
    { id: 'mobility-b', label: 'Mobility B' },
    { cali: 'lower' },
    { id: 'mobility-a', label: 'Mobility A' },
    { id: 'mobility-b-mitt', label: 'Mobility B + MITT' },
    'rest',
  ],
)

const HIIT = templatePlan(
  {
    id: 'hiit-blast',
    name: 'HIIT Blast',
    icon: '🔥',
    blurb: 'Conditioning-led — HIIT & MITT around two strength days. Burn the ghost down.',
  },
  [
    { id: 'hiit', label: 'HIIT' },
    { cali: 'upper' },
    { id: 'mitt', label: 'MITT' },
    { cali: 'lower' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'mobility-b-mitt', label: 'Mobility B + MITT' },
    'rest',
  ],
)

export const WEEKLY_PLANS: WeeklyPlan[] = [BALANCED, STRENGTH, MOBILITY, HIIT]

export const PLAN_BY_ID: Record<string, WeeklyPlan> = Object.fromEntries(
  WEEKLY_PLANS.map((p) => [p.id, p]),
)

export const DEFAULT_PLAN_ID = BALANCED.id

/** The active plan, falling back to the default if an unknown id is stored. */
export function planById(id: string | undefined): WeeklyPlan {
  return (id && PLAN_BY_ID[id]) || BALANCED
}

/** Resolve a day's session under a given plan id. */
export function sessionForPlan(planId: string | undefined, weekNumber: number, day: Weekday): DaySession {
  return planById(planId).sessionFor(weekNumber, day)
}
