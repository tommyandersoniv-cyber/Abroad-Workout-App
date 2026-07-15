import { create } from 'zustand'

export type Screen =
  | 'arena'
  | 'today'
  | 'player'
  | 'extra'
  | 'habit'
  | 'reflect'
  | 'reflectGuide'
  | 'exercise'
  | 'library'
  | 'stats'
  | 'catalog'
  | 'settings'
  | 'reports'
  | 'savings'
  | 'savingsSetup'
  | 'savingsStats'
  | 'savingsLibrary'
  | 'savingsReports'
  | 'grace'

interface NavState {
  screen: Screen
  /** route params (exercise id, workout id) */
  param?: string
  /** secondary route flag, e.g. 'extra' to mark an off-schedule guided session */
  variant?: string
  go: (screen: Screen, param?: string, variant?: string) => void
}

export const useNav = create<NavState>((set) => ({
  screen: 'arena',
  param: undefined,
  variant: undefined,
  go: (screen, param, variant) => set({ screen, param, variant }),
}))
