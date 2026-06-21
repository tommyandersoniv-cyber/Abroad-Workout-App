// Pre-built savings challenges. Data only — the math lives in
// src/savings/schedule.ts (which takes a Challenge as an argument, never
// importing this file, exactly like the engine never imports the catalog).
//
// A challenge is either a linear ramp (startAmount/stepAmount/periods) or an
// explicit per-period schedule (amounts[]). Ordered easiest → biggest.
import type { Challenge } from '../savings/types'

export const CHALLENGES: Challenge[] = [
  {
    id: 'hundred-30',
    name: '$100 in 30 Days',
    icon: '💯',
    blurb: '$1 a day, stepping up to $5 — an easy 30-day starter.',
    cadence: 'daily',
    // $1×5, $2×5, $3×5, $4×5, $5×10 → $100
    amounts: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  },
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
    id: 'grand-30',
    name: '$1,000 in 30 Days',
    icon: '🎲',
    blurb: 'A different amount each day — colour one in daily to hit $1,000.',
    cadence: 'daily',
    amounts: [
      5, 10, 15, 25, 35, 45, 35, 55, 45, 55, 25, 45, 10, 35, 15, 25, 35, 20, 20, 35, 45, 25, 55, 45,
      35, 45, 35, 55, 45, 25,
    ],
  },
  {
    id: 'grand-3mo',
    name: '$1,000 in 3 Months',
    icon: '📆',
    blurb: 'Save $84 every week for 12 weeks ($1,008).',
    cadence: 'weekly',
    startAmount: 84,
    stepAmount: 0,
    periods: 12,
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
  {
    id: 'biweekly-5k',
    name: '$5,000 Biweekly',
    icon: '💵',
    blurb: 'Save a random amount every paycheck (biweekly) for a year.',
    cadence: 'biweekly',
    amounts: [
      150, 200, 175, 125, 250, 200, 175, 125, 225, 175, 275, 150, 225, 250, 175, 225, 150, 125, 225,
      175, 200, 125, 250, 175, 275, 200,
    ],
  },
  {
    id: 'biweekly-10k',
    name: '$10,000 Biweekly',
    icon: '🏦',
    blurb: 'Alternate $275 and $475 each paycheck to bank $10k in a year.',
    cadence: 'biweekly',
    amounts: [
      275, 475, 275, 475, 275, 475, 275, 475, 275, 475, 275, 475, 275, 475, 275, 475, 275, 475, 275,
      475, 275, 475, 275, 475, 425, 575,
    ],
  },
]

export const CHALLENGE_BY_ID: Record<string, Challenge> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c]),
)
