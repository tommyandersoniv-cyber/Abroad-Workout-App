import { create } from 'zustand'

export type WorkoutPhase = 'work' | 'rest'

interface WorkoutSessionState {
  /** Workout currently in progress, or null when no session is active. */
  workoutId: string | null
  /** Current step index. */
  idx: number
  /** Whether the active step is in its work or rest phase. */
  phase: WorkoutPhase
  /** Whether the countdown timer is running. */
  running: boolean
  /** Seconds left in the current phase. */
  left: number
  /** Whether the session reached completion. */
  done: boolean
  /** Off-schedule extra session (+5 bonus) rather than the day's assigned (+10). */
  extra: boolean
  /** Swapped-in replacement for the day's assigned workout (banks +5, not +10). */
  swap: boolean
  /** Patch any subset of the live state. */
  set: (patch: Partial<Omit<WorkoutSessionState, 'set' | 'start' | 'clear'>>) => void
  /** Begin a fresh session for a workout, parked at the first step. */
  start: (workoutId: string, firstLeft: number, extra?: boolean, swap?: boolean) => void
  /** Discard the session (e.g. after banking a completed workout). */
  clear: () => void
}

const EMPTY = {
  workoutId: null,
  idx: 0,
  phase: 'work' as WorkoutPhase,
  running: false,
  left: 0,
  done: false,
  extra: false,
  swap: false,
}

// Live state for the in-progress guided workout. Kept in a store (not the
// WorkoutPlayer's local state) so progress survives the screen unmounting when
// the user navigates away and back. In-memory only — a full app reload starts
// fresh, matching how the rest of the app treats screen/session state.
export const useWorkoutSession = create<WorkoutSessionState>((set) => ({
  ...EMPTY,
  set: (patch) => set(patch),
  start: (workoutId, firstLeft, extra = false, swap = false) =>
    set({ ...EMPTY, workoutId, left: firstLeft, extra, swap }),
  clear: () => set(EMPTY),
}))
