// All app state, persisted to localStorage. Photos live separately in
// IndexedDB (see lib/photos.ts) because they're too big for localStorage.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayKey } from '../lib/date'
import type { DimensionId } from '../lib/dimensions'
import {
  DEFAULT_SETTINGS, emptyDay, type CounterId, type DayLog, type HabitId, type Settings, type TapId, type TimerId,
} from '../lib/habits'

type TimedId = TimerId | 'stretch'

interface State {
  settings: Settings
  days: Record<DayKey, DayLog>
  reflections: Record<DayKey, DimensionId[]>

  addCount: (day: DayKey, id: CounterId, n: number) => void
  undoCount: (day: DayKey, id: CounterId) => void
  addSecs: (day: DayKey, id: TimedId, secs: number, finished: boolean) => void
  toggleTap: (day: DayKey, id: TapId) => void
  setJournal: (day: DayKey, text: string) => void
  toggleDimension: (day: DayKey, id: DimensionId) => void
  updateSettings: (patch: Partial<Settings>) => void
}

function withDay(days: Record<DayKey, DayLog>, day: DayKey, fn: (d: DayLog) => DayLog) {
  return { ...days, [day]: fn(days[day] ?? emptyDay()) }
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      days: {},
      reflections: {},

      addCount: (day, id, n) =>
        set((s) => ({
          days: withDay(s.days, day, (d) => ({ ...d, adds: { ...d.adds, [id]: [...(d.adds[id] ?? []), n] } })),
        })),
      undoCount: (day, id) =>
        set((s) => ({
          days: withDay(s.days, day, (d) => ({ ...d, adds: { ...d.adds, [id]: (d.adds[id] ?? []).slice(0, -1) } })),
        })),
      addSecs: (day, id, secs, finished) =>
        set((s) => ({
          days: withDay(s.days, day, (d) => ({
            ...d,
            secs: { ...d.secs, [id]: (d.secs[id] ?? 0) + Math.max(0, Math.round(secs)) },
            done: finished ? { ...d.done, [id as HabitId]: true } : d.done,
          })),
        })),
      toggleTap: (day, id) =>
        set((s) => ({ days: withDay(s.days, day, (d) => ({ ...d, done: { ...d.done, [id]: !d.done[id] } })) })),
      setJournal: (day, text) =>
        set((s) => ({ days: withDay(s.days, day, (d) => ({ ...d, journal: text })) })),
      toggleDimension: (day, id) =>
        set((s) => {
          const cur = s.reflections[day] ?? []
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
          return { reflections: { ...s.reflections, [day]: next } }
        }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'fullday-v1',
      version: 2,
      // v2: morning order became meditation → prayer → teeth, and meditation
      // started at 2–5 min. Update saved settings still on the old defaults.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<State>
        const st = p.settings
        if (version < 2 && st) {
          const t = { ...st.times }
          if (t.prayAM === '07:30' && t.teethAM === '07:20') Object.assign(t, { prayAM: '07:25', teethAM: '07:30' })
          const m = st.ranges?.meditate
          const ranges = m && m.min === 5 && m.max === 10 ? { ...st.ranges, meditate: { min: 2, max: 5 } } : st.ranges
          p.settings = { ...st, times: t, ranges }
        }
        return p as State
      },
      // Fill in any settings added after a user's data was first saved.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>
        return {
          ...current,
          ...p,
          settings: {
            ...DEFAULT_SETTINGS,
            ...p.settings,
            ranges: { ...DEFAULT_SETTINGS.ranges, ...p.settings?.ranges },
            times: { ...DEFAULT_SETTINGS.times, ...p.settings?.times },
          },
        }
      },
    },
  ),
)
