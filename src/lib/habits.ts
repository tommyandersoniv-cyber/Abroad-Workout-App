// The daily habit items, the settings that shape them, and how a day's log
// turns into done / partial / nothing-yet for each one.

import { timeToMin } from './date'

export type HabitId =
  | 'meditateAM' | 'teethAM' | 'prayAM' | 'stretch' | 'jumprope' | 'pushups' | 'situps' | 'journal' | 'meditate' | 'prayPM'
  | 'shower' | 'teethPM'
export type TapId = 'teethAM' | 'prayAM' | 'prayPM' | 'shower' | 'teethPM'
export type CounterId = 'pushups' | 'situps'
export type RangeId = 'jumprope' | 'journal' | 'meditate'
/** Timed habits. Both meditations share the 'meditate' range. */
export type TimerId = RangeId | 'meditateAM'
export const rangeFor = (id: TimerId): RangeId => (id === 'meditateAM' ? 'meditate' : id)
export type Kind = 'tap' | 'counter' | 'timer' | 'stretch'

export interface Habit {
  id: HabitId
  name: string
  kind: Kind
}

export const HABITS: Habit[] = [
  { id: 'meditateAM', name: 'Morning meditation', kind: 'timer' },
  { id: 'prayAM', name: 'Morning prayer', kind: 'tap' },
  { id: 'teethAM', name: 'Brush teeth (morning)', kind: 'tap' },
  { id: 'stretch', name: 'Stretch', kind: 'stretch' },
  { id: 'jumprope', name: 'Jump rope', kind: 'timer' },
  { id: 'pushups', name: 'Pushups', kind: 'counter' },
  { id: 'situps', name: 'Sit-ups', kind: 'counter' },
  { id: 'journal', name: 'Journal', kind: 'timer' },
  { id: 'meditate', name: 'Evening meditation', kind: 'timer' },
  { id: 'prayPM', name: 'Evening prayer', kind: 'tap' },
  { id: 'shower', name: 'Shower', kind: 'tap' },
  { id: 'teethPM', name: 'Brush teeth (night)', kind: 'tap' },
]

export const HABIT_BY_ID = Object.fromEntries(HABITS.map((h) => [h.id, h])) as Record<HabitId, Habit>

export interface Range { min: number; max: number }

export interface Times {
  meditateAM: string
  prayAM: string
  teethAM: string
  stretch: string
  jumprope: string
  /** Pushup + sit-up set reminders. */
  sets: string[]
  journal: string
  meditate: string
  prayPM: string
  shower: string
  teethPM: string
  reflect: string
}

export interface Settings {
  name: string
  pushupTarget: number
  situpTarget: number
  /** Minutes. */
  ranges: Record<RangeId, Range>
  times: Times
  theme: 'light' | 'dark'
}

export const DEFAULT_SETTINGS: Settings = {
  name: 'Tommy',
  pushupTarget: 100,
  situpTarget: 100,
  ranges: {
    jumprope: { min: 2, max: 5 },
    journal: { min: 2, max: 5 },
    meditate: { min: 2, max: 5 },
  },
  times: {
    meditateAM: '07:15',
    prayAM: '07:25',
    teethAM: '07:30',
    stretch: '07:40',
    jumprope: '08:00',
    sets: ['10:00', '13:00', '16:00', '19:00'],
    journal: '21:00',
    meditate: '21:15',
    prayPM: '21:30',
    shower: '21:45',
    teethPM: '22:00',
    reflect: '21:40',
  },
  theme: 'light',
}

export interface DayLog {
  /** Each tap of +5/+10/+25, so undo can pop the last one. */
  adds: Partial<Record<CounterId, number[]>>
  /** Seconds logged for timed habits (stretch included). */
  secs: Partial<Record<TimerId | 'stretch', number>>
  /** Explicit completion for prayers, timers and the stretch flow. */
  done: Partial<Record<HabitId, boolean>>
  journal?: string
}

export const emptyDay = (): DayLog => ({ adds: {}, secs: {}, done: {} })

export type Status = 'done' | 'partial' | 'none'

export function counterTotal(log: DayLog | undefined, id: CounterId): number {
  return (log?.adds[id] ?? []).reduce((a, b) => a + b, 0)
}

export function counterTarget(s: Settings, id: CounterId): number {
  return id === 'pushups' ? s.pushupTarget : s.situpTarget
}

export function habitStatus(h: HabitId, log: DayLog | undefined, s: Settings): Status {
  if (!log) return 'none'
  if (h === 'pushups' || h === 'situps') {
    const n = counterTotal(log, h)
    return n >= counterTarget(s, h) ? 'done' : n > 0 ? 'partial' : 'none'
  }
  if (log.done[h]) return 'done'
  if (h === 'stretch' || h === 'jumprope' || h === 'journal' || h === 'meditate' || h === 'meditateAM') {
    return (log.secs[h] ?? 0) > 0 ? 'partial' : 'none'
  }
  return 'none'
}

export function doneCount(log: DayLog | undefined, s: Settings): number {
  return HABITS.filter((h) => habitStatus(h.id, log, s) === 'done').length
}

/** First reminder time for each habit — the Today list is sorted by this. */
export function habitTime(h: HabitId, t: Times): string {
  if (h === 'pushups' || h === 'situps') return [...t.sets].sort()[0] ?? '12:00'
  return t[h]
}

export function habitsInOrder(t: Times): Habit[] {
  return [...HABITS].sort((a, b) => timeToMin(habitTime(a.id, t)) - timeToMin(habitTime(b.id, t)))
}

export interface Reminder {
  id: string
  time: string
  title: string
  /** Habits this reminder is for; empty = the reflection. */
  habits: HabitId[]
}

export function reminders(s: Settings): Reminder[] {
  const t = s.times
  const sets = t.sets.length || 1
  const pu = Math.ceil(s.pushupTarget / sets)
  const su = Math.ceil(s.situpTarget / sets)
  const list: Reminder[] = [
    {
      id: 'meditateAM', time: t.meditateAM,
      title: `Meditate ${s.ranges.meditate.min}–${s.ranges.meditate.max} min`, habits: ['meditateAM'],
    },
    { id: 'prayAM', time: t.prayAM, title: 'Morning prayer', habits: ['prayAM'] },
    { id: 'teethAM', time: t.teethAM, title: 'Brush teeth', habits: ['teethAM'] },
    { id: 'stretch', time: t.stretch, title: 'Stretch', habits: ['stretch'] },
    {
      id: 'jumprope', time: t.jumprope,
      title: `Jump rope ${s.ranges.jumprope.min}–${s.ranges.jumprope.max} min`, habits: ['jumprope'],
    },
    ...t.sets.map((time, i) => ({
      id: `set${i + 1}`, time, title: `${pu} pushups + ${su} sit-ups`, habits: ['pushups', 'situps'] as HabitId[],
    })),
    {
      id: 'journal', time: t.journal,
      title: `Journal ${s.ranges.journal.min}–${s.ranges.journal.max} min`, habits: ['journal'],
    },
    {
      id: 'meditate', time: t.meditate,
      title: `Meditate ${s.ranges.meditate.min}–${s.ranges.meditate.max} min`, habits: ['meditate'],
    },
    { id: 'prayPM', time: t.prayPM, title: 'Evening prayer', habits: ['prayPM'] },
    { id: 'shower', time: t.shower, title: 'Shower', habits: ['shower'] },
    { id: 'teethPM', time: t.teethPM, title: 'Brush teeth', habits: ['teethPM'] },
    { id: 'reflect', time: t.reflect, title: 'Log your day', habits: [] },
  ]
  return list.sort((a, b) => timeToMin(a.time) - timeToMin(b.time))
}

/**
 * The next reminder still worth doing: the first one at/after now whose
 * habits aren't all done, else the earliest earlier one that's still open.
 */
export function upNext(
  s: Settings, log: DayLog | undefined, reflected: boolean, nowMin: number,
): Reminder | null {
  const open = reminders(s).filter((r) =>
    r.habits.length === 0 ? !reflected : r.habits.some((h) => habitStatus(h, log, s) !== 'done'),
  )
  return open.find((r) => timeToMin(r.time) >= nowMin) ?? open[0] ?? null
}

/** Clamp + order a min/max minute range so min ≤ max and both are ≥ 1. */
export function normalizeRange(r: Range): Range {
  const a = Math.max(1, Math.round(r.min || 1))
  const b = Math.max(1, Math.round(r.max || 1))
  return { min: Math.min(a, b), max: Math.max(a, b) }
}

/** Random whole-second duration within [min, max] minutes, inclusive. */
export function randomDurationSec(r: Range, rand: () => number = Math.random): number {
  const lo = r.min * 60
  const hi = r.max * 60
  return lo + Math.floor(rand() * (hi - lo + 1))
}
