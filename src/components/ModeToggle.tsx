// The Workout ⇄ Savings mode switch. Lives in the Arena header area of each
// mode (just under the RIVAL bar). Flipping mode also jumps to that mode's home.
import { useMode, type AppMode } from '../store/useMode'
import { useNav, type Screen } from '../store/useNav'
import { useDrawer } from '../store/useDrawer'

export const MODE_HOME: Record<AppMode, Screen> = { workout: 'arena', savings: 'savings' }

export function switchMode(m: AppMode) {
  useMode.getState().setMode(m)
  useDrawer.getState().setOpen(false) // never leave the drawer open across modes
  useNav.getState().go(MODE_HOME[m])
}

export function ModeToggle() {
  const mode = useMode((m) => m.mode)
  const isSavings = mode === 'savings'
  return (
    <div className="flex justify-center">
      <button
        className={`font-pixel text-[7px] px-3 py-1 border-2 ${isSavings ? 'border-save text-save' : 'border-line text-gold'}`}
        onClick={() => switchMode(isSavings ? 'workout' : 'savings')}
        title="switch mode"
      >
        {isSavings ? '🏋 SWITCH TO TRAINING' : '💰 SWITCH TO SAVINGS'}
      </button>
    </div>
  )
}
