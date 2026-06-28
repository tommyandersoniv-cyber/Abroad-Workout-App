import { create } from 'zustand'

// Open/close state for the slide-in navigation drawer (Library / Catalog /
// Settings). Kept in a store so the TopBar trigger, the drawer itself, and the
// swipe handlers in App can all coordinate without prop-drilling.
interface DrawerState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useDrawer = create<DrawerState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
