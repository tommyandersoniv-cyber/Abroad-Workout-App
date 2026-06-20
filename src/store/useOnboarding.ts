// Runtime-only onboarding phase (not persisted). Drives the sign-up + tutorial
// overlays; the persisted `onboarded` flag in useGameStore is the source of truth.
import { create } from 'zustand'

type Phase = 'signup' | 'tutorial' | 'none'

interface OnboardingState {
  phase: Phase
  step: number
  setPhase: (p: Phase) => void
  toTutorial: () => void
  setStep: (n: number) => void
  finish: () => void
}

export const useOnboarding = create<OnboardingState>((set) => ({
  phase: 'signup',
  step: 0,
  setPhase: (phase) => set({ phase }),
  toTutorial: () => set({ phase: 'tutorial', step: 0 }),
  setStep: (step) => set({ step }),
  finish: () => set({ phase: 'none', step: 0 }),
}))
