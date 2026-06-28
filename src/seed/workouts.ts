// ─────────────────────────────────────────────────────────────────────────
// Workout definitions (warmup → main/skill → cooldown) from Appendix A.
// The Workout Player pulls the day's session from here.
// ─────────────────────────────────────────────────────────────────────────

import type { Workout, WorkoutItem } from '../engine/types'

// Standard warmup (30s/5s) and cooldown wrap every training session.
const WARMUP: WorkoutItem[] = [
  'jumping-jacks', 'cross-toe-touches', 'squat-front-kick', 'chest-opener-butt-kicks',
  'arm-circles', 'standing-knee-drives', 'inchworm-pushup', 'downdog-knee-tuck',
  'lateral-lunges', 'high-knees',
].map((exerciseId) => ({ exerciseId, workSec: 30, restSec: 5 }))

const COOLDOWN: WorkoutItem[] = [
  'downward-dog', 'cobra', 'quad-r', 'quad-l', 'seated-glute-r', 'seated-glute-l',
  'cat-cow-cd', 'supine-twist-r', 'supine-twist-l', 'wide-forward-fold',
].map((exerciseId) => ({ exerciseId, durationSec: 30 }))

/** A rep-based exercise done for `s` sets (the player cycles Set 1…N). */
function sets(exerciseId: string, s: number, reps: string): WorkoutItem {
  return { exerciseId, sets: s, reps }
}

/** A timed hold done for `s` sets — countdown, then `restSec` rest, repeated. */
function holdSets(exerciseId: string, s: number, durationSec: number, restSec = 20): WorkoutItem {
  return { exerciseId, sets: s, durationSec, restSec }
}

/** A single timed hold (one per circuit round). */
function hold(exerciseId: string, durationSec: number): WorkoutItem {
  return { exerciseId, durationSec }
}

/** A single rep-based move (one per circuit round). */
function reps(exerciseId: string, r: string): WorkoutItem {
  return { exerciseId, reps: r }
}

export const WORKOUTS: Workout[] = [
  // ── Calisthenics — Block A ───────────────────────────────────────────────
  {
    id: 'cali-upper-a',
    name: 'Calisthenics — Upper (A)',
    type: 'calisthenics',
    blocks: [
      { kind: 'warmup', items: WARMUP },
      { kind: 'main', items: [
        sets('pushups', 4, '10–15'),
        sets('pullups', 4, '6–10'),
        sets('dips', 4, '10–15'),
        sets('pike-pushups', 3, '8–12'),
        sets('plank-to-pushup', 3, '10–15'),
      ] },
      { kind: 'skill', items: [holdSets('wall-handstand', 3, 25), holdSets('tuck-lsit', 3, 12)] },
      { kind: 'cooldown', items: COOLDOWN },
    ],
  },
  {
    id: 'cali-lower-a',
    name: 'Calisthenics — Lower & Core (A)',
    type: 'calisthenics',
    blocks: [
      { kind: 'warmup', items: WARMUP },
      { kind: 'main', items: [
        sets('squats', 4, '20–25'),
        sets('lunges', 4, '15–20/leg'),
        sets('glute-bridges', 3, '20–25'),
        sets('calf-raises', 3, '20–25'),
        sets('hanging-leg-raises', 3, '8–12'),
        sets('russian-twists', 3, '20/side'),
      ] },
      { kind: 'cooldown', items: COOLDOWN },
    ],
  },

  // ── Calisthenics — Block B (permanent steady state) ──────────────────────
  {
    id: 'cali-upper-b',
    name: 'Calisthenics — Upper (B)',
    type: 'calisthenics',
    blocks: [
      { kind: 'warmup', items: WARMUP },
      { kind: 'main', items: [
        sets('decline-pushups', 4, '10–15'),
        sets('pullups', 4, '8–12'),
        sets('dips', 4, '10–15'),
        sets('archer-pushups', 3, '6–10/side'),
        sets('plank-to-pushup', 3, '15–20'),
      ] },
      { kind: 'skill', items: [
        holdSets('free-handstand', 3, 25),
        holdSets('lsit-hold', 3, 15),
        sets('muscle-up-prog', 3, '3–5'),
      ] },
      { kind: 'cooldown', items: COOLDOWN },
    ],
  },
  {
    id: 'cali-lower-b',
    name: 'Calisthenics — Lower & Core (B)',
    type: 'calisthenics',
    blocks: [
      { kind: 'warmup', items: WARMUP },
      { kind: 'main', items: [
        sets('pistol-squats', 4, '6–10/leg'),
        sets('bulgarian-split', 4, '10–15/leg'),
        sets('sl-glute-bridge', 3, '15–20/leg'),
        sets('calf-raises', 3, '25–30'),
        sets('hanging-leg-raises', 3, '10–15'),
        sets('windshield-wipers', 3, '10–15/side'),
      ] },
      { kind: 'cooldown', items: COOLDOWN },
    ],
  },

  // ── Mobility ──────────────────────────────────────────────────────────────
  {
    id: 'mobility-a',
    name: 'Mobility A',
    type: 'mobility',
    blocks: [
      // Circuit: run the whole block, then repeat for 3 rounds.
      { kind: 'main', rounds: 3, items: [
        hold('hang', 45),
        hold('deep-squat', 45),
        hold('couch-stretch', 45),
        hold('jefferson-curl', 45),
        reps('crab-stretch', '10'),
        reps('pigeon-hinge', '10 + 10s'),
      ] },
    ],
  },
  {
    id: 'mobility-b',
    name: 'Mobility B',
    type: 'mobility',
    blocks: [
      { kind: 'main', rounds: 3, items: [
        hold('hang', 45),
        reps('sl-hip-hinge', '10 + 10s'),
        reps('wall-butterfly', '10 + 10s'),
        reps('hip-ir-9090', '5–10'),
        hold('couch-stretch', 45),
        hold('butcher-block', 45),
      ] },
    ],
  },

  // ── HIIT (25 min) ───────────────────────────────────────────────────────
  {
    id: 'hiit',
    name: 'HIIT — 25 min',
    type: 'hiit',
    blocks: [
      { kind: 'warmup', items: WARMUP },
      { kind: 'main', items: [
        'squats', 'jump-squats', 'shoulder-taps', 'half-burpees',
        'mountain-climbers', 'curtsy-lunges',
      ].map((exerciseId) => ({ exerciseId, workSec: 40, restSec: 20 })) },
      { kind: 'cooldown', items: COOLDOWN },
    ],
  },

  // ── MITT (20 min) ─────────────────────────────────────────────────────────
  {
    id: 'mitt',
    name: 'MITT — 20 min',
    type: 'mitt',
    blocks: [
      { kind: 'main', items: [
        'jumping-jacks', 'squat-jacks', 'jump-squats', 'curtsy-lunges',
        'high-knees', 'half-burpees', 'mountain-climbers',
      ].map((exerciseId) => ({ exerciseId, workSec: 40, restSec: 20 })) },
    ],
  },

  // ── Mobility B + MITT (Saturday combo) ─────────────────────────────────────
  {
    id: 'mobility-b-mitt',
    name: 'Mobility B + MITT',
    type: 'mitt',
    blocks: [
      // Mobility circuit (2 rounds) → MITT conditioning circuit.
      { kind: 'main', rounds: 2, items: [
        hold('hang', 45),
        reps('wall-butterfly', '10 + 10s'),
        hold('couch-stretch', 45),
      ] },
      { kind: 'main', items: [
        'jumping-jacks', 'squat-jacks', 'jump-squats', 'half-burpees', 'mountain-climbers',
      ].map((exerciseId) => ({ exerciseId, workSec: 40, restSec: 20 })) },
    ],
  },
]

// ── Morning Stretch (the daily "stretch" habit's guided flow) ──────────────
// Total-body routine from Appendix A.1, in order. Equal 40s holds → 8:00 total
// (12 × 40s), comfortably inside the 5–10 min target.
export const MORNING_STRETCH: Workout = {
  id: 'morning-stretch',
  name: 'Morning Stretch',
  type: 'mobility',
  blocks: [
    {
      kind: 'main',
      items: [
        'lumbar-rotation', 'thoracic-rotation', 'upper-trap', 'cat-cow',
        'hip-flexor-r', 'hamstring-l', 'adductor-l', 'adductor-r',
        'hip-flexor-l', 'hamstring-r', 'chest-opener', 'overhead-w',
      ].map((exerciseId) => ({ exerciseId, durationSec: 40 })),
    },
  ],
}

WORKOUTS.push(MORNING_STRETCH)

export const WORKOUT_BY_ID: Record<string, Workout> = Object.fromEntries(
  WORKOUTS.map((w) => [w.id, w]),
)
