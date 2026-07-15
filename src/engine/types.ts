// ─────────────────────────────────────────────────────────────────────────
// RIVAL — core domain types (the vocabulary the rules speak in)
// Pure data shapes. No React, no storage, no clock side-effects.
// ─────────────────────────────────────────────────────────────────────────

/** How often an activity comes due. */
export type Cadence = 'daily' | 'weekly' | 'scheduled' | 'bonus'

/** What a single completion is measured in. */
export type Unit = 'per_session' | 'per_mile'

/** Days of the week, 0 = Monday … 6 = Sunday (RIVAL weeks start Monday). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * An entry in the activity catalog — the *rules* for one kind of loggable thing.
 * XP values here are the calibrated PRD §4.1 defaults; tunable in-app later.
 */
export interface Activity {
  id: string
  name: string
  category: 'workout' | 'mind' | 'movement' | 'weekly'
  icon: string
  /** XP earned per completion. For per_mile, this is XP *per mile*. */
  xp: number
  unit: Unit
  cadence: Cadence
  /**
   * Which weekdays this is due on. For `scheduled` items (the assigned workout)
   * this is the set of training days. Daily items are due every day.
   * Weekly items have a single deadline at the end of the week.
   */
  schedule: Weekday[]
  /** Points lost when the item's deadline passes un-logged. Stored positive. */
  missPenalty: number
  /** Whether completing requires the guided interval timer to finish. */
  requiresTimer: boolean
  /** Run = 3. Below target → −missPenalty, no partial credit. */
  weeklyTarget?: number
  /** Extra workouts: +xp each, uncapped, never penalized. */
  repeatable: boolean
  /** Short human description for the catalog screen. */
  blurb: string
}

/** One thing the player actually did (or a resolved miss). */
export interface LogEntry {
  /** Stable id so completions can be toggled / de-duped. */
  id: string
  activityId: string
  /** ISO date key for the occurrence this satisfies: `YYYY-MM-DD` (period start). */
  dateKey: string
  /** Miles for a run, otherwise 1 (or the extra-workout count is one entry each). */
  value: number
  /** XP this entry moved the ledger by (positive earn, negative resolved miss). */
  xp: number
  status: 'completed' | 'missed'
  /** Epoch ms the entry was recorded (for ordering / history). */
  at: number
}

/** A single exercise in the library. */
export interface Exercise {
  id: string
  name: string
  category:
    | 'warmup'
    | 'main'
    | 'skill'
    | 'cooldown'
    | 'mobility'
    | 'stretch'
    | 'conditioning'
  description: string
  howTo: string[]
  commonMistakes?: string[]
  targetMuscles?: string[]
  equipment?: string[]
  defaultPrescription?: string
  substitutionOfId?: string
  videoRef?: { url: string; startSec?: number }
  /** Deterministic sprite seed so the placeholder pixel-media is stable. */
  spriteSeed: number
  /** Path to a real reference photo (e.g. /images/exercises/<id>.webp). When absent, the pixel placeholder is shown. */
  photoUrl?: string
}

/** One timed/counted item inside a workout block. */
export interface WorkoutItem {
  exerciseId: string
  sets?: number
  reps?: string
  durationSec?: number
  workSec?: number
  restSec?: number
}

export interface WorkoutBlock {
  kind: 'warmup' | 'main' | 'skill' | 'cooldown'
  items: WorkoutItem[]
  /** Circuit blocks (e.g. Mobility A/B) run every item once, then repeat the
   *  whole block this many rounds. When unset, each item runs its own `sets`. */
  rounds?: number
}

export interface Workout {
  id: string
  name: string
  type: 'calisthenics' | 'mobility' | 'hiit' | 'mitt' | 'rest'
  blocks: WorkoutBlock[]
  /** Swapping this in for the assigned workout still banks the full +10
   *  (instead of the usual swap-reduced +5) — for sessions demanding enough
   *  that they shouldn't be penalized relative to the scheduled workout. */
  fullCreditSwap?: boolean
}

export type Block = 'A' | 'B'

/** Maps each weekday to a workout id (or REST). */
export interface ProgramTemplate {
  /** weekday (0=Mon) → workout id, by block. REST = no assigned workout. */
  dayMap: Record<Weekday, { A: string | 'REST'; B: string | 'REST' }>
}

export type Personality = 'cocky' | 'stoic' | 'hypeman' | 'sarcastic'

// Difficulty tiers are retired (README): the benchmarks are fixed at
// Ymmot 50% / Tommy 90%, so the rival config carries identity only.
export interface RivalConfig {
  name: string
  spriteId: string
  personality: Personality
}

/** A point on the gap-history graph. */
export interface GapSample {
  /** ISO date key. */
  dateKey: string
  you: number
  rival: number
}
