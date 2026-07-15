// ─────────────────────────────────────────────────────────────────────────
// The store — integration layer between the pure engine and the UI.
// Persisted to localStorage. Holds only *facts* (the log, the clock offset,
// config); every total is derived from the engine on read, never stored.
// ─────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LogEntry, RivalConfig } from '../engine'
import {
  earnFor,
  endOfDay,
  endOfWeek,
  inGraceWindow,
  missEntry,
  occurrenceKey,
  playerXP as sumXP,
  resolveMisses,
  rivalXP as engineRivalXP,
  maxXP,
} from '../engine'
import { ACTIVITY_BY_ID } from '../seed/activities'
import { DEFAULT_PLAN_ID } from '../seed/plans'
import { useReflection } from './useReflection'
import { reflectionPlayerScore, reflectionRivalScore, reflectionMax } from '../seed/reflection'
import { buildSeedLog, buildDemoLog, computeStartDate, computeDemoStartDate, DEFAULT_RIVAL, reverseName } from '../seed'
import { RUN_WEEKDAYS } from '../seed/social'
import { MS_DAY, addDays, daysBetween, startOfDay, weekday, dateKey } from '../engine/time'

export interface Settings {
  allowNegative: boolean
  sound: boolean
  /** Adaptive-tier average window cache is recomputed live; nothing to persist. */
}

interface GameState {
  seeded: boolean
  startMs: number
  log: LogEntry[]
  lastResolvedAt: number
  rival: RivalConfig // "Tommy" — the 90% locked-in version
  ymmotName: string // "Ymmot" — the 50% human-achievable version
  settings: Settings
  demoOffsetMs: number
  playerName: string
  playerSpriteId: string
  /** highest completed report index the user has acknowledged, per cadence */
  reportsSeen: { week: number; month: number; year: number }
  /** pushed calls/runs: `${activityId}@${originalDateKey}` → new display dateKey */
  deferrals: Record<string, string>
  /** extra miles carried onto a run day (its dateKey) by pushing earlier runs */
  runCarry: Record<string, number>
  /** has the player completed the sign-up + tutorial flow? */
  onboarded: boolean
  /** sign-up profile */
  profile: { name: string } | null
  /** active weekly plan id — decides which workout is scheduled each day */
  planId: string

  // lifecycle
  init: () => void
  resolve: () => void
  now: () => number

  // logging
  isLoggedToday: (activityId: string) => boolean
  toggleActivity: (activityId: string) => void
  toggleScheduled: (activityId: string, key: string) => void
  pushItem: (activityId: string, key: string) => void
  logRun: (miles: number, key?: string) => 'banked' | 'under-target'
  logExtra: () => void
  completeWorkout: (xp?: number) => void

  // 12-hour grace window (local midnight → noon): retroactively log/undo a
  // habit, workout, or call from YESTERDAY. `key` overrides the computed
  // occurrence key — required for calls, whose file-key is the original
  // (possibly pre-push) day, not always yesterday's own date. Run is excluded
  // (goes through logRun); extras are excluded (bonus/repeatable, never due).
  graceLog: (activityId: string, key?: string) => void

  // config
  setPlan: (planId: string) => void
  setRival: (patch: Partial<RivalConfig>) => void
  setYmmotName: (name: string) => void
  setPlayer: (patch: { name?: string; spriteId?: string }) => void
  setAllowNegative: (b: boolean) => void
  toggleSound: () => void
  markReportsSeen: () => void

  // onboarding
  completeSignup: (name: string) => void
  loadDemo: () => void
  finishOnboarding: () => void

  resetToSeed: () => void
}

function realNow(state: GameState): number {
  return Date.now() + state.demoOffsetMs
}
function catalog() {
  return Object.values(ACTIVITY_BY_ID)
}

/** The dateKey of the next scheduled run day strictly after `key`'s date. */
function nextRunDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const base = new Date(y, m - 1, d).getTime()
  for (let i = 1; i <= 14; i++) {
    const t = addDays(base, i)
    if (RUN_WEEKDAYS.includes(weekday(t))) return dateKey(t)
  }
  return dateKey(addDays(base, 2))
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      seeded: false,
      startMs: 0,
      log: [],
      lastResolvedAt: 0,
      rival: DEFAULT_RIVAL,
      ymmotName: 'Ymmot',
      settings: { allowNegative: true, sound: false },
      demoOffsetMs: 0,
      playerName: 'ME',
      playerSpriteId: 'hero',
      reportsSeen: { week: 0, month: 0, year: 0 },
      deferrals: {},
      runCarry: {},
      onboarded: false,
      profile: null,
      planId: DEFAULT_PLAN_ID,

      now: () => realNow(get()),

      init: () => {
        const s = get()
        // Guard rehydrated storage against corrupt/foreign shapes (mirrors the
        // savings store's contributions guard).
        if (!Array.isArray(s.log)) set({ log: [] })
        if (typeof s.deferrals !== 'object' || s.deferrals === null || Array.isArray(s.deferrals)) set({ deferrals: {} })
        if (typeof s.runCarry !== 'object' || s.runCarry === null || Array.isArray(s.runCarry)) set({ runCarry: {} })
        if (!s.seeded) {
          const now = Date.now()
          const startMs = computeStartDate(now)
          const log = buildSeedLog(startMs, now)
          set({ seeded: true, startMs, log, lastResolvedAt: startMs, demoOffsetMs: 0 })
        }
        // Migrate older default names → the three-line model (me / Ymmot / Tommy).
        if (s.rival.name === 'GHOST' || s.rival.name === 'YOU')
          set({ rival: { ...get().rival, name: 'Tommy' } })
        if (s.playerName === 'YOU') set({ playerName: 'ME' })
        if (!s.ymmotName) set({ ymmotName: 'Ymmot' })
        get().resolve()
      },

      resolve: () => {
        const s = get()
        if (!s.seeded) return
        const now = realNow(s)
        const { misses, resolvedAt } = resolveMisses(
          catalog(),
          s.log,
          s.startMs,
          s.lastResolvedAt,
          now,
          new Set(Object.keys(s.deferrals)), // pushed occurrences never penalize
        )
        if (misses.length > 0 || resolvedAt !== s.lastResolvedAt) {
          // De-dupe by id so repeated resolves never double-count.
          const have = new Set(s.log.map((e) => e.id))
          const fresh = misses.filter((m) => !have.has(m.id))
          set({ log: [...s.log, ...fresh], lastResolvedAt: resolvedAt })
        }
      },

      isLoggedToday: (activityId) => {
        const s = get()
        const a = ACTIVITY_BY_ID[activityId]
        if (!a) return false
        const key = occurrenceKey(a, realNow(s))
        return s.log.some(
          (e) => e.activityId === activityId && e.dateKey === key && e.status === 'completed',
        )
      },

      toggleActivity: (activityId) => {
        const s = get()
        const a = ACTIVITY_BY_ID[activityId]
        if (!a || a.unit === 'per_mile' || a.repeatable) return
        const now = realNow(s)
        const key = occurrenceKey(a, now)
        const existing = s.log.find(
          (e) => e.activityId === activityId && e.dateKey === key && e.status === 'completed',
        )
        if (existing) {
          set({ log: s.log.filter((e) => e.id !== existing.id) })
        } else {
          const entry: LogEntry = {
            id: `log:${activityId}:${key}:${now}`,
            activityId,
            dateKey: key,
            value: 1,
            xp: a.xp,
            status: 'completed',
            at: now,
          }
          set({ log: [...s.log, entry] })
        }
      },

      // Log the day's assigned workout as completed. A swapped-in workout banks a
      // reduced xp (passed in) but still counts as done — no miss penalty, streak
      // intact. Defaults to the activity's full xp (+10).
      completeWorkout: (xp) => {
        const s = get()
        if (s.isLoggedToday('workout')) return
        const a = ACTIVITY_BY_ID.workout
        const now = realNow(s)
        const key = occurrenceKey(a, now)
        const entry: LogEntry = {
          id: `log:workout:${key}:${now}`,
          activityId: 'workout',
          dateKey: key,
          value: 1,
          xp: xp ?? a.xp,
          status: 'completed',
          at: now,
        }
        set({ log: [...s.log, entry] })
      },

      // Toggle a day-pinned scheduled item (e.g. a phone call) under a specific
      // occurrence key, so it works whether logged on its day or a pushed day.
      toggleScheduled: (activityId, key) => {
        const s = get()
        const a = ACTIVITY_BY_ID[activityId]
        if (!a) return
        const now = realNow(s)
        const existing = s.log.find(
          (e) => e.activityId === activityId && e.dateKey === key && e.status === 'completed',
        )
        if (existing) {
          set({ log: s.log.filter((e) => e.id !== existing.id) })
        } else {
          set({
            log: [
              ...s.log,
              { id: `log:${activityId}:${key}:${now}`, activityId, dateKey: key, value: 1, xp: a.xp, status: 'completed', at: now },
            ],
          })
        }
      },

      // Push a call/run — no penalty for the original day.
      //  • call: moves to the next calendar day (still loggable for full XP).
      //  • run:  carries its mile(s) onto the NEXT scheduled run day.
      pushItem: (activityId, key) => {
        const s = get()
        if (activityId === 'run') {
          const owed = 1 + (s.runCarry[key] ?? 0) // miles owed on this run day
          const nextKey = nextRunDayKey(key)
          set({
            deferrals: { ...s.deferrals, [`run@${key}`]: nextKey }, // excuse this day
            runCarry: { ...s.runCarry, [nextKey]: (s.runCarry[nextKey] ?? 0) + owed },
          })
        } else {
          const compositeKey = `${activityId}@${key}`
          const current = s.deferrals[compositeKey] ?? key
          const [y, m, d] = current.split('-').map(Number)
          const next = new Date(y, m - 1, d + 1)
          set({ deferrals: { ...s.deferrals, [compositeKey]: dateKey(next.getTime()) } })
        }
        get().resolve()
      },

      logRun: (miles, key) => {
        const s = get()
        const a = ACTIVITY_BY_ID.run
        const now = realNow(s)
        key = key ?? occurrenceKey(a, now)
        const xp = earnFor(a, miles)
        // Remove any prior run entry this week, then record the new one.
        const without = s.log.filter(
          (e) => !(e.activityId === 'run' && e.dateKey === key),
        )
        if (xp === 0) {
          // Under target — no credit, no entry. Stays "due" → resolves to −5.
          set({ log: without })
          return 'under-target'
        }
        const entry: LogEntry = {
          id: `log:run:${key}:${now}`,
          activityId: 'run',
          dateKey: key,
          value: miles,
          xp,
          status: 'completed',
          at: now,
        }
        set({ log: [...without, entry] })
        return 'banked'
      },

      logExtra: () => {
        const s = get()
        const a = ACTIVITY_BY_ID.extra
        const now = realNow(s)
        const entry: LogEntry = {
          id: `log:extra:${now}:${s.log.length}`,
          activityId: 'extra',
          dateKey: occurrenceKey(a, now),
          value: 1,
          xp: a.xp,
          status: 'completed',
          at: now,
        }
        set({ log: [...s.log, entry] })
      },

      graceLog: (activityId, key) => {
        const s = get()
        const now = realNow(s)
        if (!inGraceWindow(now)) return
        const a = ACTIVITY_BY_ID[activityId]
        if (!a || a.unit === 'per_mile' || a.repeatable) return // run → logRun; extras never due
        const occKey = key ?? occurrenceKey(a, addDays(now, -1))
        const existing = s.log.find(
          (e) => e.activityId === activityId && e.dateKey === occKey && e.status === 'completed',
        )
        const missId = `miss:${activityId}:${occKey}`
        if (existing) {
          // Undo: the settle watermark has already passed this occurrence, so
          // resolve() will never regenerate its miss — restore it here.
          const hasMiss = s.log.some((e) => e.id === missId)
          const [y, m, d] = occKey.split('-').map(Number)
          const dayMs = new Date(y, m - 1, d).getTime()
          const deadline = a.cadence === 'weekly' ? endOfWeek(dayMs) : endOfDay(dayMs)
          const restored = hasMiss ? [] : [missEntry(a, occKey, deadline)]
          set({ log: [...s.log.filter((e) => e.id !== existing.id), ...restored] })
        } else {
          const withoutMiss = s.log.filter((e) => e.id !== missId)
          const entry: LogEntry = {
            id: `grace:${activityId}:${occKey}:${now}`,
            activityId,
            dateKey: occKey,
            value: 1,
            xp: a.xp,
            status: 'completed',
            at: now,
          }
          set({ log: [...withoutMiss, entry] })
        }
      },

      setPlan: (planId) => set({ planId }),
      setRival: (patch) => set({ rival: { ...get().rival, ...patch } }),
      setYmmotName: (name) => set({ ymmotName: name }),
      setPlayer: (patch) =>
        set({
          playerName: patch.name ?? get().playerName,
          playerSpriteId: patch.spriteId ?? get().playerSpriteId,
        }),
      setAllowNegative: (b) => set({ settings: { ...get().settings, allowNegative: b } }),
      toggleSound: () => set({ settings: { ...get().settings, sound: !get().settings.sound } }),
      markReportsSeen: () => {
        const s = get()
        const now = realNow(s)
        const days = daysBetween(s.startMs, now)
        set({
          reportsSeen: {
            week: Math.floor(days / 7),
            month: Math.floor(days / 30),
            year: Math.floor(days / 365),
          },
        })
      },

      // ── Onboarding ─────────────────────────────────────────────────────
      // The typed name identifies the 90%-locked-in rival (you're always ME/
      // YOU on-screen); the mirror benchmark takes that name backwards.
      completeSignup: (name) => {
        const trimmed = name.trim() || 'Tommy'
        set({
          profile: { name: trimmed },
          rival: { ...get().rival, name: trimmed },
          ymmotName: reverseName(trimmed),
        })
        get().loadDemo() // populate every screen for the tutorial
      },
      loadDemo: () => {
        const now = Date.now()
        const startMs = computeDemoStartDate(now)
        set({
          seeded: true,
          startMs,
          log: buildDemoLog(startMs, now),
          lastResolvedAt: startMs,
          demoOffsetMs: 0,
          deferrals: {},
          runCarry: {},
        })
        get().resolve()
      },
      finishOnboarding: () => {
        // The real journey begins: fresh Day 1, empty ledger, keep their name.
        const now = Date.now()
        const startMs = computeStartDate(now)
        set({
          onboarded: true,
          seeded: true,
          startMs,
          log: buildSeedLog(startMs, now),
          lastResolvedAt: startMs,
          demoOffsetMs: 0,
          deferrals: {},
          runCarry: {},
          reportsSeen: { week: 0, month: 0, year: 0 },
        })
        get().resolve()
      },

      resetToSeed: () => {
        const now = Date.now()
        const startMs = computeStartDate(now)
        set({
          seeded: true,
          startMs,
          log: buildSeedLog(startMs, now),
          lastResolvedAt: startMs,
          demoOffsetMs: 0,
          deferrals: {},
          runCarry: {},
        })
        get().resolve()
      },
    }),
    {
      name: 'rival-game-v1',
      partialize: (s) => ({
        seeded: s.seeded,
        startMs: s.startMs,
        log: s.log,
        lastResolvedAt: s.lastResolvedAt,
        rival: s.rival,
        ymmotName: s.ymmotName,
        settings: s.settings,
        demoOffsetMs: s.demoOffsetMs,
        playerName: s.playerName,
        playerSpriteId: s.playerSpriteId,
        reportsSeen: s.reportsSeen,
        deferrals: s.deferrals,
        runCarry: s.runCarry,
        onboarded: s.onboarded,
        profile: s.profile,
        planId: s.planId,
      }),
    },
  ),
)

// ── The two fixed benchmark lines (both start at 0 on day 0) ───────────────
export const TOMMY_HOLD = 0.9 // "Tommy" — the totally locked-in version
export const YMMOT_HOLD = 0.5 // "Ymmot" — the human-achievable version

// ── Derived selectors (computed from the engine, never stored) ─────────────

// Reflection points fold into the same totals as workouts: the player's net
// from closed days, and each rival's hold × reflection max (identical to how
// their workout points are computed). Read live from the reflection store.
function reflYou(now: number): number {
  const r = useReflection.getState()
  return reflectionPlayerScore(r.byDay, r.startMs, now)
}
function reflRival(now: number, hold: number): number {
  return reflectionRivalScore(useReflection.getState().startMs, now, hold)
}

export function selectPlayerXP(s: GameState): number {
  const now = s.now()
  const total = sumXP(s.log.filter((e) => e.at <= now)) + reflYou(now)
  return s.settings.allowNegative ? total : Math.max(0, total)
}

/** Tommy (90%) is the primary nemesis — the gap, tiers and tracker measure vs him. */
export function selectRivalXP(s: GameState): number {
  return engineRivalXP(catalog(), s.startMs, s.now(), TOMMY_HOLD) + reflRival(s.now(), TOMMY_HOLD)
}

/** Ymmot (50%) — the constant human-consistency benchmark. */
export function selectYmmotXP(s: GameState): number {
  return engineRivalXP(catalog(), s.startMs, s.now(), YMMOT_HOLD) + reflRival(s.now(), YMMOT_HOLD)
}

export function selectMaxXP(s: GameState): number {
  return maxXP(catalog(), s.startMs, s.now()) + reflectionMax(useReflection.getState().startMs, s.now())
}

export interface GapSample {
  key: string
  you: number
  tommy: number
  ymmot: number
}

/** Per-day history of all three lines for the trend graph + consistency tracker. */
export function selectGapHistory(s: GameState, days: number): GapSample[] {
  const now = s.now()
  const out: GapSample[] = []
  const firstDay = addDays(now, -(days - 1))
  for (let d = Math.max(firstDay, startOfDay(s.startMs)); d <= startOfDay(now); d = addDays(d, 1)) {
    const dayEnd = Math.min(now, endOfDay(d))
    const you = sumXP(s.log.filter((e) => e.at <= dayEnd)) + reflYou(dayEnd)
    out.push({
      key: dateKey(d),
      you,
      tommy: engineRivalXP(catalog(), s.startMs, dayEnd, TOMMY_HOLD) + reflRival(dayEnd, TOMMY_HOLD),
      ymmot: engineRivalXP(catalog(), s.startMs, dayEnd, YMMOT_HOLD) + reflRival(dayEnd, YMMOT_HOLD),
    })
  }
  return out
}

/**
 * How much each gap (you − rival) moved since the start of the current day.
 * Positive = you gained on them today; negative = the CPU gained on you.
 */
export function selectGapDeltaToday(s: GameState): { ymmot: number; tommy: number } {
  const now = s.now()
  // The last instant of yesterday — *before* the CPUs banked their overnight
  // lump at this morning's midnight — so that lump shows up as today's change.
  const then = startOfDay(now) - 1
  const youNow = sumXP(s.log.filter((e) => e.at <= now)) + reflYou(now)
  const youThen = sumXP(s.log.filter((e) => e.at <= then)) + reflYou(then)
  const tNow = engineRivalXP(catalog(), s.startMs, now, TOMMY_HOLD) + reflRival(now, TOMMY_HOLD)
  const tThen = engineRivalXP(catalog(), s.startMs, then, TOMMY_HOLD) + reflRival(then, TOMMY_HOLD)
  const yNow = engineRivalXP(catalog(), s.startMs, now, YMMOT_HOLD) + reflRival(now, YMMOT_HOLD)
  const yThen = engineRivalXP(catalog(), s.startMs, then, YMMOT_HOLD) + reflRival(then, YMMOT_HOLD)
  return {
    tommy: youNow - tNow - (youThen - tThen),
    ymmot: youNow - yNow - (youThen - yThen),
  }
}

/** Gap vs Tommy now and 7 days ago, for the trend chip. */
export function selectGapTrend(s: GameState): { gap: number; delta7: number } {
  const now = s.now()
  const gapNow = selectPlayerXP(s) - selectRivalXP(s)
  const wkAgo = Math.max(startOfDay(s.startMs), now - 7 * MS_DAY)
  const youThen = sumXP(s.log.filter((e) => e.at <= wkAgo)) + reflYou(wkAgo)
  const tommyThen = engineRivalXP(catalog(), s.startMs, wkAgo, TOMMY_HOLD) + reflRival(wkAgo, TOMMY_HOLD)
  return { gap: gapNow, delta7: gapNow - (youThen - tommyThen) }
}

/** Which report cadences have a newly-completed period the user hasn't seen. */
export function selectPendingReports(s: GameState): { week: boolean; month: boolean; year: boolean; any: boolean } {
  const now = s.now()
  const days = daysBetween(s.startMs, now)
  const week = Math.floor(days / 7) > s.reportsSeen.week
  const month = Math.floor(days / 30) > s.reportsSeen.month
  const year = Math.floor(days / 365) > s.reportsSeen.year
  return { week, month, year, any: week || month || year }
}
