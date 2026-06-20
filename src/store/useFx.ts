// Ephemeral juice events (not persisted): screen-shake on a big miss,
// evolution / level-up flourishes. Components fire these; App renders them.
import { create } from 'zustand'

interface FxState {
  shakeAt: number
  evolveText: string | null
  toast: string | null
  shake: () => void
  evolve: (text: string) => void
  say: (text: string) => void
  clearEvolve: () => void
  clearToast: () => void
}

export const useFx = create<FxState>((set) => ({
  shakeAt: 0,
  evolveText: null,
  toast: null,
  shake: () => set({ shakeAt: Date.now() }),
  evolve: (text) => set({ evolveText: text }),
  say: (text) => set({ toast: text }),
  clearEvolve: () => set({ evolveText: null }),
  clearToast: () => set({ toast: null }),
}))
