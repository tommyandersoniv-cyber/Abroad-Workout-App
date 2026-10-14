// Transient UI state: which tab/overlay is open and the toast line.

import { create } from 'zustand'
import type { RangeId } from '../lib/habits'

export type Overlay =
  | { kind: 'timer'; id: RangeId }
  | { kind: 'stretch' }
  | { kind: 'settings' }
  | { kind: 'reflect' }
  | null

interface Ui {
  tab: 'todo' | 'today' | 'progress'
  overlay: Overlay
  toast: { text: string; n: number } | null
  setTab: (t: Ui['tab']) => void
  open: (o: Overlay) => void
  say: (text: string) => void
}

export const useUi = create<Ui>()((set) => ({
  tab: 'today',
  overlay: null,
  toast: null,
  setTab: (tab) => set({ tab }),
  open: (overlay) => set({ overlay }),
  say: (text) => set((s) => ({ toast: { text, n: (s.toast?.n ?? 0) + 1 } })),
}))

