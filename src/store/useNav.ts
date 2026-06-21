import { create } from 'zustand'

export type Screen =
  | 'arena'
  | 'today'
  | 'player'
  | 'exercise'
  | 'library'
  | 'stats'
  | 'catalog'
  | 'rival'
  | 'settings'
  | 'reports'
  | 'savings'
  | 'savingsSetup'
  | 'savingsStats'
  | 'savingsLibrary'
  | 'savingsReports'

interface NavState {
  screen: Screen
  /** route params (exercise id, workout id) */
  param?: string
  go: (screen: Screen, param?: string) => void
}

export const useNav = create<NavState>((set) => ({
  screen: 'arena',
  param: undefined,
  go: (screen, param) => set({ screen, param }),
}))
