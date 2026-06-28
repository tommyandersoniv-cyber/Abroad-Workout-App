// Local store for the Reflection feature — which dimensions were checked off
// each day. Persisted under its own key; the clock is shared with the rest of
// the app via useGameStore.now() (so the demo controls move it too).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { keyToMs } from '../seed/reflection'

interface ReflectionState {
  /** dateKey → list of dimension ids checked that day. */
  byDay: Record<string, string[]>
  /** Local midnight of the first day a check-in was ever logged (0 = never). */
  startMs: number
  /** Toggle a dimension for a given day. */
  toggle: (day: string, dim: string) => void
  /** The dimensions checked on a given day. */
  forDay: (day: string) => string[]
}

export const useReflection = create<ReflectionState>()(
  persist(
    (set, get) => ({
      byDay: {},
      startMs: 0,
      toggle: (day, dim) => {
        const s = get()
        const current = s.byDay[day] ?? []
        const next = current.includes(dim)
          ? current.filter((d) => d !== dim)
          : [...current, dim]
        set({
          byDay: { ...s.byDay, [day]: next },
          // Scoring begins on the first day the user ever checks in.
          startMs: s.startMs || keyToMs(day),
        })
      },
      forDay: (day) => get().byDay[day] ?? [],
    }),
    { name: 'rival-reflection-v1' },
  ),
)
