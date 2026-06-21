// Pre-built escalating savings challenges. Data only — the math lives in
// src/savings/schedule.ts (which takes a Challenge as an argument, never
// importing this file, exactly like the engine never imports the catalog).
import type { Challenge } from '../savings/types'

export const CHALLENGES: Challenge[] = [
  {
    id: 'dollar-30',
    name: '30-Day Dollar Ramp',
    icon: '📅',
    blurb: 'Save $1 on day 1, then +$1 more each day for 30 days.',
    cadence: 'daily',
    startAmount: 1,
    stepAmount: 1,
    periods: 30,
  },
  {
    id: 'week-52',
    name: '52-Week Classic',
    icon: '🗓',
    blurb: 'Week 1 = $1, then +$1 every week for a full year.',
    cadence: 'weekly',
    startAmount: 1,
    stepAmount: 1,
    periods: 52,
  },
  {
    id: 'week-52-reverse',
    name: '52-Week Reverse',
    icon: '🔻',
    blurb: 'Start at $52 and drop $1 a week — it gets easier as you go.',
    cadence: 'weekly',
    startAmount: 52,
    stepAmount: -1,
    periods: 52,
  },
  {
    id: 'fiver-30',
    name: '30-Day Fiver',
    icon: '🖐',
    blurb: 'For bigger goals: $5 on day 1, +$5 each day for 30 days.',
    cadence: 'daily',
    startAmount: 5,
    stepAmount: 5,
    periods: 30,
  },
]

export const CHALLENGE_BY_ID: Record<string, Challenge> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c]),
)
