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

function sets(exerciseId: string, s: number, reps: string): WorkoutItem {
  return { exerciseId, sets: s, reps }
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
      { kind: 'skill', items: [sets('wall-handstand', 3, '20–30s'), sets('tuck-lsit', 3, '10–15s')] },
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
        sets('free-handstand', 3, '20–30s'),
        sets('lsit-hold', 3, '10–20s'),
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
      { kind: 'main', items: [
        sets('hang', 3, '30–60s'),
        sets('deep-squat', 3, '30–60s'),
        sets('couch-stretch', 3, '30–60s'),
        sets('jefferson-curl', 3, '30–60s'),
        sets('crab-stretch', 3, '10'),
        sets('pigeon-hinge', 3, '10 + 10s'),
      ] },
    ],
  },
  {
    id: 'mobility-b',
    name: 'Mobility B',
    type: 'mobility',
    blocks: [
      { kind: 'main', items: [
        sets('hang', 3, '30–60s'),
        sets('sl-hip-hinge', 3, '10 + 10s'),
        sets('wall-butterfly', 3, '10 + 10s'),
        sets('hip-ir-9090', 3, '5–10'),
        sets('couch-stretch', 3, '30–60s'),
        sets('butcher-block', 3, '30–60s'),
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
      { kind: 'main', items: [
        sets('hang', 2, '30–60s'),
        sets('wall-butterfly', 2, '10 + 10s'),
        sets('couch-stretch', 2, '30–60s'),
      ] },
      { kind: 'main', items: [
        'jumping-jacks', 'squat-jacks', 'jump-squats', 'half-burpees', 'mountain-climbers',
      ].map((exerciseId) => ({ exerciseId, workSec: 40, restSec: 20 })) },
    ],
  },
]

export const WORKOUT_BY_ID: Record<string, Workout> = Object.fromEntries(
  WORKOUTS.map((w) => [w.id, w]),
)
