// ─────────────────────────────────────────────────────────────────────────
// THE ACTIVITY CATALOG — PRD §4.1, exact values.
// This is *data* (tunable in-app), consumed by the pure engine in src/engine.
//
// A perfect week with these defaults = 284 XP:
//   stretch 7×10 + jumprope 7×10 + (meditate+pray+journal) 7×(3+3+3)
//   + workouts 6×10 + run 3×(1mi×5) + calls 3×2  =  70+70+63 + 60 + 15 + 6 = 284
// The rival banks 0.90 × that, forever.
// ─────────────────────────────────────────────────────────────────────────

import type { Activity, Weekday } from '../engine/types'
import { CALL_WEEKDAYS, RUN_WEEKDAYS } from './social'

const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const TRAINING_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5] // Mon–Sat have an assigned workout; Sun rest

export const ACTIVITIES: Activity[] = [
  {
    id: 'workout',
    name: 'Assigned Workout',
    category: 'workout',
    icon: '🏋',
    xp: 10,
    unit: 'per_session',
    cadence: 'scheduled',
    schedule: TRAINING_DAYS,
    missPenalty: 15,
    requiresTimer: true,
    repeatable: false,
    blurb: 'Calisthenics / HIIT / mobility / MITT — the spine of the race.',
  },
  {
    id: 'stretch',
    name: 'Morning Stretch',
    category: 'movement',
    icon: '🧘',
    xp: 10,
    unit: 'per_session',
    cadence: 'daily',
    schedule: EVERY_DAY,
    missPenalty: 15,
    requiresTimer: false,
    repeatable: false,
    blurb: 'Total-body, every single morning. A non-negotiable −15 item.',
  },
  {
    id: 'jumprope',
    name: 'Jump Rope',
    category: 'movement',
    icon: '🪢',
    xp: 10,
    unit: 'per_session',
    cadence: 'daily',
    schedule: EVERY_DAY,
    missPenalty: 15,
    requiresTimer: false,
    repeatable: false,
    blurb: '2–10 min midday conditioning, every day.',
  },
  {
    id: 'meditate',
    name: 'Meditate',
    category: 'mind',
    icon: '🌀',
    xp: 3,
    unit: 'per_session',
    cadence: 'daily',
    schedule: EVERY_DAY,
    missPenalty: 2,
    requiresTimer: false,
    repeatable: false,
    blurb: 'Daily stillness. Small points, worth defending.',
  },
  {
    id: 'pray',
    name: 'Pray',
    category: 'mind',
    icon: '🙏',
    xp: 3,
    unit: 'per_session',
    cadence: 'daily',
    schedule: EVERY_DAY,
    missPenalty: 2,
    requiresTimer: false,
    repeatable: false,
    blurb: 'Daily practice.',
  },
  {
    id: 'journal',
    name: 'Journal',
    category: 'mind',
    icon: '📓',
    xp: 3,
    unit: 'per_session',
    cadence: 'daily',
    schedule: EVERY_DAY,
    missPenalty: 2,
    requiresTimer: false,
    repeatable: false,
    blurb: 'A few lines, every day.',
  },
  {
    id: 'run',
    name: 'Run',
    category: 'weekly',
    icon: '👟',
    xp: 5, // per mile
    unit: 'per_mile',
    cadence: 'scheduled',
    schedule: RUN_WEEKDAYS, // 1 mile on 3 days/week (Mon·Wed·Fri); pushable
    missPenalty: 5,
    requiresTimer: false,
    repeatable: false,
    weeklyTarget: 1, // 1 mile per run day
    blurb: '1 mile on 3 days/week. +5/mile. Push adds the mile to your next run day.',
  },
  {
    id: 'call',
    name: 'Phone Call',
    category: 'weekly',
    icon: '📞',
    xp: 2,
    unit: 'per_session',
    cadence: 'scheduled',
    schedule: CALL_WEEKDAYS, // 3 calls/week (2 family + 1 friend), each on its day
    missPenalty: 2,
    requiresTimer: false,
    repeatable: false,
    blurb: '3 calls a week — 2 family, 1 friend — each pinned to a day & person. +2 each.',
  },
  {
    id: 'extra',
    name: 'Extra Workout',
    category: 'workout',
    icon: '⚡',
    xp: 5,
    unit: 'per_session',
    cadence: 'bonus',
    schedule: [],
    missPenalty: 0,
    requiresTimer: false,
    repeatable: true,
    blurb: 'Any session beyond the assigned one. +5 each, uncapped — pure upside above the rival ceiling.',
  },
]

export const ACTIVITY_BY_ID: Record<string, Activity> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.id, a]),
)
