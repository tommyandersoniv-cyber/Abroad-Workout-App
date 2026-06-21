// ─────────────────────────────────────────────────────────────────────────
// SAVINGS — core domain types (Phase 2). Pure data shapes, no React/storage.
// The money side mirrors the workout engine: facts only (a contributions log
// + a goal), every total derived on read. There are NO penalties — saved money
// only ever goes up; falling behind the pace line is the punishment.
// ─────────────────────────────────────────────────────────────────────────

/** A goal is either a custom TARGET (total by a deadline, at a chosen pace) or a CHALLENGE preset. */
export type SavingsMode = 'target' | 'challenge'

/** How often you deposit toward a custom target. */
export type Pace = 'daily' | 'weekly' | 'biweekly' | 'monthly'

/**
 * A pre-built escalating savings challenge — the rival "inputs the correct
 * amount each time" by following this schedule perfectly. Period `i` (0-based)
 * calls for `startAmount + stepAmount * i`.
 *   • 30-Day Dollar Ramp: daily, start 1, step 1, 30 periods  → $465 total
 *   • 52-Week Classic:     weekly, start 1, step 1, 52 periods → $1,378 total
 */
export interface Challenge {
  id: string
  name: string
  icon: string
  blurb: string
  /** Step interval — a new amount each day, week, or paycheck (every 2 weeks). */
  cadence: 'daily' | 'weekly' | 'biweekly'
  /** Explicit per-period schedule ($). When set, takes precedence over the ramp fields. */
  amounts?: number[]
  /** Linear ramp (used only when `amounts` is absent): period i = startAmount + stepAmount·i. */
  startAmount?: number
  stepAmount?: number
  periods?: number
}

/**
 * The active savings goal. You race a single perfect-discipline rival:
 *   • target   — the on-pace line that reaches `totalAmount` by `deadlineMs`,
 *                depositing at `pace`.
 *   • challenge — the chosen preset's built-in schedule.
 */
export interface SavingsGoal {
  id: string
  name: string
  icon: string
  mode: SavingsMode
  /** The finish line ($): a target's goal amount, or a challenge's perfect total. */
  totalAmount: number
  /** target: when the total should be reached. null for challenges. */
  deadlineMs: number | null
  /** target: deposit cadence. null for challenges. */
  pace: Pace | null
  /** challenge: the chosen preset id (see seed/challenges); null for targets. */
  challengeId: string | null
  /** Day 0 for this goal — start of the day it was created (demo-clock aware). */
  startMs: number
  createdAt: number
}

/** One deposit the user actually made. The savings analog of LogEntry. */
export interface Contribution {
  id: string
  goalId: string
  /** Local `YYYY-MM-DD` of when it was logged. */
  dateKey: string
  /** Dollars saved — always ≥ 0 (no penalties). */
  amount: number
  note?: string
  /** Epoch ms the deposit was recorded. */
  at: number
}
