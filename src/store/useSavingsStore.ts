// ─────────────────────────────────────────────────────────────────────────
// The SAVINGS store (Phase 2) — parallel to useGameStore but for money.
// Persisted under its OWN key. Holds only *facts* (the goal + a contributions
// log); every total/pace/gap is derived from the pure engine on read.
//
// No miss-resolution machinery: there are no penalties, so the rival is a pure
// function of the clock + the goal, and your total is just the sum of what
// you've saved. The clock is SHARED with the workout side (the demo controls'
// offset) so advancing time moves both timelines together.
// ─────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contribution, Pace, SavingsGoal, SavingsMode } from '../savings'
import {
  PACE_TODAY_LABEL,
  PACE_WORD,
  challengeCurrentAmount,
  challengePeriodIndex,
  challengeRivalTotal,
  challengeTotal,
  deadlineFrom,
  daysSaved,
  round2,
  savedSince,
  savedTotal,
  savingStreak,
  targetCurrentAmount,
  targetPerDeposit,
  targetRivalTotal,
} from '../savings'
import { CHALLENGE_BY_ID } from '../seed/challenges'
import { useGameStore } from './useGameStore'
import { MS_DAY, daysBetween, dateKey, endOfDay, startOfDay } from '../engine/time'

/** Everything the setup / library hands to the store. */
export interface GoalInput {
  name: string
  icon?: string
  mode: SavingsMode
  // target:
  totalAmount?: number
  timeframeNum?: number
  timeframeUnit?: 'weeks' | 'months' | 'years'
  pace?: Pace
  // challenge:
  challengeId?: string | null
}

/** A retired goal, kept so its saved money lives on in the lifetime total. */
export interface ArchivedGoal {
  name: string
  icon: string
  saved: number
  mode: SavingsMode
  endedAt: number
}

interface SavingsState {
  configured: boolean
  goal: SavingsGoal | null
  contributions: Contribution[]
  /** Money banked from goals you've since switched away from. */
  archivedSaved: number
  /** A log of retired goals (most recent last). */
  archive: ArchivedGoal[]

  // lifecycle
  init: () => void
  now: () => number

  // config
  configureGoal: (input: GoalInput) => void
  /** Deploy a goal — banks the current goal's savings to the lifetime total, then starts fresh at $0. */
  deployGoal: (input: GoalInput) => void
  clearGoal: () => void
  /** Wipe ALL savings data — current goal, history, and the lifetime total. */
  resetSavings: () => void

  // logging
  logContribution: (amount: number, note?: string) => void
  /** Log today's pace/challenge deposit in one tap. Returns the amount logged. */
  logToday: () => number
  removeContribution: (id: string) => void
  /** Remove the most recent deposit (undo an accidental tap). Returns the amount removed. */
  undoLast: () => number
}

/** Shared clock: real time plus the workout side's demo offset. */
function realNow(): number {
  return Date.now() + useGameStore.getState().demoOffsetMs
}

/** Build a SavingsGoal from form input + an identity (id/start/createdAt). */
function buildGoal(input: GoalInput, base: { id: string; startMs: number; createdAt: number }): SavingsGoal {
  const isChallenge = input.mode === 'challenge'
  const ch = isChallenge ? CHALLENGE_BY_ID[input.challengeId ?? ''] : null
  return {
    id: base.id,
    name: (input.name || (isChallenge ? ch?.name ?? 'Challenge' : 'Custom Target')).trim().slice(0, 24),
    icon: input.icon ?? (isChallenge ? ch?.icon ?? '🏆' : '🎯'),
    mode: input.mode,
    totalAmount: isChallenge
      ? ch ? challengeTotal(ch) : 0
      : Math.max(0, round2(input.totalAmount ?? 0)),
    deadlineMs: isChallenge
      ? null
      : deadlineFrom(base.startMs, input.timeframeNum ?? 1, input.timeframeUnit ?? 'months'),
    pace: isChallenge ? null : input.pace ?? 'monthly',
    challengeId: isChallenge ? input.challengeId ?? null : null,
    startMs: base.startMs,
    createdAt: base.createdAt,
  }
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      configured: false,
      goal: null,
      contributions: [],
      archivedSaved: 0,
      archive: [],

      now: () => realNow(),

      // Persisted + auto-hydrated. Imperative migration (no persist `version`):
      // drop any goal from a pre-release schema so it can't render as NaN.
      init: () => {
        const s = get()
        if (!Array.isArray(s.contributions)) set({ contributions: [] })
        if (s.goal && s.goal.mode !== 'target' && s.goal.mode !== 'challenge') {
          set({ configured: false, goal: null, contributions: [] })
        }
      },

      // Edit in place — keeps the goal's start day + saved history.
      configureGoal: (input) => {
        const now = realNow()
        const prev = get().goal
        const goal = buildGoal(input, {
          id: prev?.id ?? `goal:${now}`,
          startMs: prev?.startMs ?? startOfDay(now),
          createdAt: prev?.createdAt ?? now,
        })
        set({ goal, configured: true })
      },

      // Deploy a new goal — bank the current goal's savings to the lifetime
      // total (and log it), then start the new goal fresh at $0.
      deployGoal: (input) => {
        const now = realNow()
        const s = get()
        const prevSaved = savedTotal(s.contributions)
        const archive =
          s.goal && prevSaved > 0
            ? [...s.archive, { name: s.goal.name, icon: s.goal.icon, saved: prevSaved, mode: s.goal.mode, endedAt: now }]
            : s.archive
        const goal = buildGoal(input, { id: `goal:${now}`, startMs: startOfDay(now), createdAt: now })
        set({
          goal,
          configured: true,
          contributions: [],
          archivedSaved: s.archivedSaved + prevSaved,
          archive,
        })
      },

      // Scrap the current goal without banking it (an explicit do-over).
      clearGoal: () => set({ configured: false, goal: null, contributions: [] }),

      // Nuke everything — current goal, history, and the lifetime total.
      resetSavings: () =>
        set({ configured: false, goal: null, contributions: [], archivedSaved: 0, archive: [] }),

      logContribution: (amount, note) => {
        const s = get()
        if (!s.goal) return
        const amt = round2(Math.max(0, amount))
        if (amt <= 0) return
        const now = realNow()
        const key = dateKey(now)
        const entry: Contribution = {
          id: `contrib:${s.goal.id}:${key}:${now}`,
          goalId: s.goal.id,
          dateKey: key,
          amount: amt,
          note,
          at: now,
        }
        set({ contributions: [...s.contributions, entry] })
      },

      logToday: () => {
        const s = get()
        const goal = s.goal
        if (!goal) return 0
        const now = realNow()
        let amt = 0
        if (goal.mode === 'challenge') {
          const ch = CHALLENGE_BY_ID[goal.challengeId ?? '']
          if (ch) amt = challengeCurrentAmount(ch, goal.startMs, now)
        } else if (goal.pace && goal.deadlineMs != null) {
          amt = targetCurrentAmount(goal.totalAmount, goal.pace, goal.startMs, goal.deadlineMs, now)
        }
        if (amt > 0) get().logContribution(amt)
        return amt
      },

      removeContribution: (id) =>
        set({ contributions: get().contributions.filter((c) => c.id !== id) }),

      undoLast: () => {
        const list = get().contributions
        if (!list.length) return 0
        let idx = 0
        for (let i = 1; i < list.length; i++) if (list[i].at >= list[idx].at) idx = i
        const amt = list[idx].amount
        set({ contributions: list.filter((_, i) => i !== idx) })
        return amt
      },
    }),
    {
      name: 'rival-savings-v1',
      partialize: (s) => ({
        configured: s.configured,
        goal: s.goal,
        contributions: s.contributions,
        archivedSaved: s.archivedSaved,
        archive: s.archive,
      }),
    },
  ),
)

// ── Derived view (computed from the engine, never stored) ──────────────────

export interface SavingsView {
  goal: SavingsGoal
  mode: SavingsMode
  now: number
  day: number
  /** What YOU have saved. */
  you: number
  /** The single pace rival (challenge: on-schedule line; target: on-pace line). */
  ideal: number
  /** Kept for layout symmetry; always null in the single-rival model. */
  floor: number | null
  idealLabel: string
  floorLabel: string | null
  /** you − rival; positive = ahead. */
  gapIdeal: number
  gapFloor: number | null
  status: 'ahead' | 'behind'
  /** Deposit due right now + its label. */
  todayTarget: number
  todayTargetLabel: string
  savedToday: number
  /** The flat per-deposit amount (target) / current challenge amount. */
  perDeposit: number
  paceWord: string
  /** Progress toward the finish line. */
  periodLabel: string
  periodSaved: number
  periodTarget: number
  periodPct: number
  // challenge-only
  challenge: import('../savings').Challenge | null
  periodIndex: number
  totalPeriods: number
  finishTarget: number | null
  complete: boolean
  // consistency
  daysSaved: number
  streak: number
}

export function selectSavedTotal(s: SavingsState): number {
  return savedTotal(s.contributions, s.now())
}

/** Money saved across ALL goals — current plus everything banked from past ones. */
export function selectLifetimeSaved(s: SavingsState): number {
  return round2(s.archivedSaved + savedTotal(s.contributions, s.now()))
}

export function selectSavingsView(s: SavingsState): SavingsView | null {
  const goal = s.goal
  if (!s.configured || !goal) return null
  const now = s.now()
  const you = savedTotal(s.contributions, now)
  const dSaved = daysSaved(s.contributions.filter((c) => c.at <= now))
  const streak = savingStreak(s.contributions, now)
  const day = daysBetween(goal.startMs, now) + 1
  const savedToday = savedSince(s.contributions, startOfDay(now), now)

  if (goal.mode === 'challenge') {
    const ch = CHALLENGE_BY_ID[goal.challengeId ?? '']
    if (!ch) return null
    const ideal = challengeRivalTotal(ch, goal.startMs, now)
    const finishTarget = challengeTotal(ch)
    const idx = challengePeriodIndex(ch, goal.startMs, now)
    const todayTarget = challengeCurrentAmount(ch, goal.startMs, now)
    return {
      goal, mode: 'challenge', now, day, you,
      ideal, floor: null,
      idealLabel: 'ON SCHEDULE', floorLabel: null,
      gapIdeal: round2(you - ideal), gapFloor: null,
      status: you >= ideal - 0.001 ? 'ahead' : 'behind',
      todayTarget, todayTargetLabel: ch.cadence === 'weekly' ? 'THIS WEEK' : 'TODAY', savedToday,
      perDeposit: todayTarget, paceWord: ch.cadence === 'weekly' ? 'week' : 'day',
      periodLabel: 'PROGRESS', periodSaved: you, periodTarget: finishTarget,
      periodPct: finishTarget > 0 ? Math.min(100, (you / finishTarget) * 100) : 0,
      challenge: ch, periodIndex: Math.min(idx, ch.periods), totalPeriods: ch.periods,
      finishTarget, complete: you >= finishTarget - 0.001 || idx >= ch.periods,
      daysSaved: dSaved, streak,
    }
  }

  // custom target — total by a deadline, at a pace
  const total = goal.totalAmount
  const pace = goal.pace ?? 'monthly'
  const deadline = goal.deadlineMs ?? now
  const ideal = targetRivalTotal(total, pace, goal.startMs, deadline, now)
  const perDeposit = targetPerDeposit(total, pace, goal.startMs, deadline)
  const todayTarget = targetCurrentAmount(total, pace, goal.startMs, deadline, now)
  return {
    goal, mode: 'target', now, day, you,
    ideal, floor: null,
    idealLabel: 'ON PACE', floorLabel: null,
    gapIdeal: round2(you - ideal), gapFloor: null,
    status: you >= ideal - 0.001 ? 'ahead' : 'behind',
    todayTarget, todayTargetLabel: PACE_TODAY_LABEL[pace], savedToday,
    perDeposit, paceWord: PACE_WORD[pace],
    periodLabel: 'PROGRESS', periodSaved: you, periodTarget: total,
    periodPct: total > 0 ? Math.min(100, (you / total) * 100) : 0,
    challenge: null, periodIndex: 0, totalPeriods: 0,
    finishTarget: total, complete: you >= total - 0.001 || now >= deadline,
    daysSaved: dSaved, streak,
  }
}

/** One day on the savings history graph (you vs the pace rival). */
export interface SavingsHistorySample {
  key: string
  you: number
  ideal: number
  /** mirrors `ideal` (single-rival model) so the consistency helper still works. */
  floor: number
}

/** Per-day history of your saved total vs the pace rival, for the graph + heatmap. */
export function selectSavingsHistory(s: SavingsState, days: number): SavingsHistorySample[] {
  const goal = s.goal
  if (!s.configured || !goal) return []
  const now = s.now()
  const out: SavingsHistorySample[] = []
  const firstDay = startOfDay(now) - (days - 1) * MS_DAY
  const ch = goal.mode === 'challenge' ? CHALLENGE_BY_ID[goal.challengeId ?? ''] : null
  for (let d = Math.max(firstDay, startOfDay(goal.startMs)); d <= startOfDay(now); d += MS_DAY) {
    const dayEnd = Math.min(now, endOfDay(d))
    const you = savedTotal(s.contributions, dayEnd)
    const ideal =
      goal.mode === 'challenge'
        ? ch ? challengeRivalTotal(ch, goal.startMs, dayEnd) : 0
        : targetRivalTotal(goal.totalAmount, goal.pace ?? 'monthly', goal.startMs, goal.deadlineMs ?? dayEnd, dayEnd)
    out.push({ key: dateKey(d), you, ideal, floor: ideal })
  }
  return out
}
