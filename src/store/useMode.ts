// Which top-level mode the app is in. Workout and Savings are parallel worlds —
// each has its own bottom-nav screens; the top-bar toggle flips between them.
// Persisted so reopening returns you to the mode you were last in.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppMode = 'workout' | 'savings'

interface ModeState {
  mode: AppMode
  setMode: (m: AppMode) => void
  toggle: () => void
}

export const useMode = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'workout',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'workout' ? 'savings' : 'workout' }),
    }),
    { name: 'rival-mode-v1' },
  ),
)
