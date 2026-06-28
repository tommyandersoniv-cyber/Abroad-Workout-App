import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { useNav, type Screen } from './store/useNav'
import { useGameStore, selectPlayerXP, selectRivalXP, selectYmmotXP } from './store/useGameStore'
import { useSavingsStore, selectSavedTotal } from './store/useSavingsStore'
import { useMode } from './store/useMode'
import { MODE_HOME, switchMode } from './components/ModeToggle'
import { money } from './savings'
import { useFx } from './store/useFx'
import { useTick } from './hooks/useNow'
import { tierForGap, combinedGap, TIER_NAMES } from './engine/levels'
import { Arena } from './screens/Arena'
import { Today } from './screens/Today'
import { WorkoutPlayer } from './screens/WorkoutPlayer'
import { ExtraWorkout } from './screens/ExtraWorkout'
import { HabitSession } from './screens/HabitSession'
import { Reflection } from './screens/Reflection'
import { ReflectionGuide } from './screens/ReflectionGuide'
import { ExerciseLibrary } from './screens/ExerciseLibrary'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Stats } from './screens/Stats'
import { Catalog } from './screens/Catalog'
import { Settings } from './screens/Settings'
import { Reports } from './screens/Reports'
import { SavingsArena } from './screens/SavingsArena'
import { SavingsSetup } from './screens/SavingsSetup'
import { SavingsStats } from './screens/SavingsStats'
import { SavingsLibrary } from './screens/SavingsLibrary'
import { SavingsReports } from './screens/SavingsReports'
import { selectPendingReports } from './store/useGameStore'
import { Signup } from './components/Signup'
import { Tutorial } from './components/Tutorial'
import { useOnboarding } from './store/useOnboarding'
import { useDrawer } from './store/useDrawer'

const SCREENS: Record<Screen, ComponentType> = {
  arena: Arena,
  today: Today,
  player: WorkoutPlayer,
  extra: ExtraWorkout,
  habit: HabitSession,
  reflect: Reflection,
  reflectGuide: ReflectionGuide,
  exercise: ExerciseDetail,
  library: ExerciseLibrary,
  stats: Stats,
  catalog: Catalog,
  settings: Settings,
  reports: Reports,
  savings: SavingsArena,
  savingsSetup: SavingsSetup,
  savingsStats: SavingsStats,
  savingsLibrary: SavingsLibrary,
  savingsReports: SavingsReports,
}

export default function App() {
  const screen = useNav((n) => n.screen)
  const init = useGameStore((s) => s.init)
  const onboarded = useGameStore((s) => s.onboarded)
  const phase = useOnboarding((o) => o.phase)
  const mode = useMode((m) => m.mode)

  useEffect(() => {
    init()
    useSavingsStore.getState().init()
    // Open on the current mode's home screen (screen state isn't persisted).
    useNav.getState().go(MODE_HOME[useMode.getState().mode])
    // Surface any newly-completed report — only for established (onboarded) players.
    const s = useGameStore.getState()
    if (!s.onboarded) return
    const p = selectPendingReports(s)
    const due = [p.year && 'YEAR', p.month && 'MONTH', p.week && 'WEEK'].filter(Boolean)
    if (due.length) useFx.getState().say(`📊 New ${due[0]} report ready`)
  }, [init])

  // Re-resolve misses when returning to the tab.
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && useGameStore.getState().resolve()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const Current = SCREENS[screen]
  const drawerEnabled = mode === 'workout'

  // Edge-swipe to open the drawer (swipe right from the left edge) and swipe
  // left to close it. Only active in workout mode, where the drawer lives.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!drawerEnabled || !touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy)) return // not a horizontal swipe
    const { open, setOpen } = useDrawer.getState()
    if (dx > 0 && !open && t.clientX - dx < 40) setOpen(true) // started near the left edge
    else if (dx < 0 && open) setOpen(false)
  }

  return (
    <div
      className={`h-[100dvh] w-full flex items-stretch justify-center bg-ink overflow-hidden ${mode === 'savings' ? 'mode-savings' : ''}`}
      style={mode === 'savings' ? backdropSavings : backdrop}
    >
      <div
        className="relative w-full max-w-[430px] h-[100dvh] bg-night flex flex-col crt overflow-hidden shadow-2xl"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
          <Current />
        </main>
        <BottomNav />
        {drawerEnabled && <Drawer />}
        <FxLayer />
        {!onboarded && phase === 'tutorial' && <Tutorial />}
        {!onboarded && phase === 'signup' && <Signup />}
      </div>
    </div>
  )
}

const backdrop: CSSProperties = {
  background:
    'radial-gradient(circle at 50% 0%, #1a1033 0%, #07040f 70%), repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(75,46,137,0.06) 23px)',
}

// Green backdrop for Savings mode (mirrors `backdrop` but in the money palette).
const backdropSavings: CSSProperties = {
  background:
    'radial-gradient(circle at 50% 0%, #0d2a1c 0%, #03100a 70%), repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(43,138,89,0.06) 23px)',
}

function TopBar() {
  useTick(1000)
  const s = useGameStore()
  const mode = useMode((m) => m.mode)
  const isSavings = mode === 'savings'
  const saved = useSavingsStore(selectSavedTotal)
  const you = Math.round(selectPlayerXP(s))
  const ymmot = Math.round(selectYmmotXP(s))
  const tommy = Math.round(selectRivalXP(s))
  const sound = s.settings.sound

  // Internal clock — never stops after sign-up. 24h military time, resets at
  // midnight (0:00). Driven by the same offsetable clock as everything else.
  const d = new Date(s.now())
  const clock = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`

  // Evolution flourish: fires when ME's TIER changes. The tier reflects BOTH
  // rivals (gap to the midpoint of Ymmot 70% and Tommy 90%).
  const prevTier = useRef<number | null>(null)
  const evolve = useFx((f) => f.evolve)
  useEffect(() => {
    const tier = tierForGap(combinedGap(you, ymmot, tommy))
    if (prevTier.current !== null && tier !== prevTier.current) {
      const up = tier > prevTier.current
      evolve(`${s.playerName} → ${TIER_NAMES[tier]}${up ? '!' : '…'}`)
    }
    prevTier.current = tier
  }, [you, ymmot, tommy]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header
      className="shrink-0 flex items-center justify-between px-3 py-2 border-b-3 border-line bg-panel z-40"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
    >
      <div className="flex items-center gap-2">
        {!isSavings && (
          <button
            className="font-pixel text-[14px] text-dim leading-none -ml-0.5"
            onClick={() => useDrawer.getState().toggle()}
            title="menu"
            aria-label="open menu"
          >
            ≡
          </button>
        )}
        <button className="font-pixel text-[12px] text-gold" onClick={() => useNav.getState().go(MODE_HOME[mode])}>
          RIVAL
        </button>
        <span className="font-pixel text-[8px] text-cyan tabular-nums" title="internal clock (24h)" data-tour="clock">{clock}</span>
      </div>
      <div className="flex items-center gap-2 font-pixel text-[8px]">
        {isSavings ? (
          <span className="text-save">💰 {money(saved)}</span>
        ) : (
          <>
            <span className="text-you">{you.toLocaleString()}</span>
            <span className="text-dim">·</span>
            <span className="text-ymmot">{ymmot.toLocaleString()}</span>
            <span className="text-dim">·</span>
            <span className="text-tommy">{tommy.toLocaleString()}</span>
          </>
        )}
        <button className={sound ? 'text-gold' : 'text-dim'} onClick={s.toggleSound} title="sound">
          {sound ? '♪' : '✕'}
        </button>
      </div>
    </header>
  )
}

type NavItem = { id: Screen; label: string; icon: string; match?: Screen[] }

// Workout mode: Today (left) · Arena (center) · Stats (right). The secondary
// screens (Library / Catalog / Settings) live in the slide-in Drawer; Reports
// is a button on the Stats page.
const WORKOUT_NAV: NavItem[] = [
  { id: 'today', label: 'TODAY', icon: '💪', match: ['today', 'player', 'extra'] },
  { id: 'arena', label: 'ARENA', icon: '⚔' },
  { id: 'stats', label: 'STATS', icon: '📊', match: ['stats', 'reports'] },
]

const SAVINGS_NAV: NavItem[] = [
  { id: 'savingsStats', label: 'STATS', icon: '📊', match: ['savingsStats', 'savingsReports'] },
  { id: 'savings', label: 'ARENA', icon: '💰', match: ['savings', 'savingsSetup'] },
  { id: 'savingsLibrary', label: 'LIB', icon: '📚' },
]

function BottomNav() {
  useTick(5000)
  const screen = useNav((n) => n.screen)
  const go = useNav((n) => n.go)
  const mode = useMode((m) => m.mode)
  const isSavings = mode === 'savings'
  const items = isSavings ? SAVINGS_NAV : WORKOUT_NAV

  return (
    <nav
      className="shrink-0 grid grid-cols-3 border-t-3 border-line bg-panel z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((n) => {
        const active = n.match ? n.match.includes(screen) : screen === n.id
        return (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            className={`py-2 flex flex-col items-center gap-0.5 ${active ? 'bg-panel3' : ''}`}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            <span className={`font-pixel text-[6px] ${active ? (isSavings ? 'text-save' : 'text-gold') : 'text-dim'}`}>
              {n.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// Slide-in navigation drawer for the secondary workout screens. Opened from the
// ≡ button in the TopBar or by an edge-swipe (see App). Reports lives on Stats,
// so it's not here.
const DRAWER_ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id: 'library', label: 'LIBRARY', icon: '📖' },
  { id: 'catalog', label: 'CATALOG', icon: '📋' },
  { id: 'reflectGuide', label: 'THE EIGHT', icon: '🪞' },
  { id: 'settings', label: 'SETTINGS', icon: '⚙' },
]

function Drawer() {
  const open = useDrawer((d) => d.open)
  const setOpen = useDrawer((d) => d.setOpen)
  const screen = useNav((n) => n.screen)
  const go = useNav((n) => n.go)

  return (
    <>
      {/* backdrop */}
      <div
        className="absolute inset-0 z-[60] bg-ink/70"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 200ms ease' }}
        onClick={() => setOpen(false)}
      />
      {/* panel */}
      <aside
        className="absolute top-0 left-0 bottom-0 z-[61] w-60 max-w-[78%] bg-panel border-r-3 border-line flex flex-col"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 200ms ease',
          paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)',
        }}
      >
        <div className="px-3 py-3 flex items-center justify-between border-b-3 border-line">
          <span className="font-pixel text-[10px] text-gold">MENU</span>
          <button className="font-pixel text-[9px] text-dim" onClick={() => setOpen(false)} aria-label="close menu">✕</button>
        </div>
        <nav className="p-2 space-y-2">
          {DRAWER_ITEMS.map((it) => (
            <button
              key={it.id}
              className={`btn w-full text-left ${screen === it.id ? 'btn-gold' : ''}`}
              onClick={() => { go(it.id); setOpen(false) }}
            >
              <span className="mr-2">{it.icon}</span>{it.label}
            </button>
          ))}
        </nav>

        {/* Switch into Savings mode — pinned to the bottom of the drawer. */}
        <div className="mt-auto p-2 border-t-3 border-line">
          <button
            className="btn btn-save w-full flex flex-col items-center gap-1 py-3"
            onClick={() => switchMode('savings')}
            title="switch to savings mode"
          >
            <span className="text-2xl leading-none">💰</span>
            <span className="font-pixel text-[8px]">SAVINGS MODE</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function FxLayer() {
  const shakeAt = useFx((f) => f.shakeAt)
  const evolveText = useFx((f) => f.evolveText)
  const toast = useFx((f) => f.toast)
  const clearEvolve = useFx((f) => f.clearEvolve)
  const clearToast = useFx((f) => f.clearToast)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (!shakeAt) return
    setShaking(true)
    const id = setTimeout(() => setShaking(false), 800)
    return () => clearTimeout(id)
  }, [shakeAt])

  useEffect(() => {
    if (!evolveText) return
    const id = setTimeout(clearEvolve, 2600)
    return () => clearTimeout(id)
  }, [evolveText, clearEvolve])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(clearToast, 1600)
    return () => clearTimeout(id)
  }, [toast, clearToast])

  return (
    <>
      {shaking && <ShakeBinder />}
      {evolveText && (
        <div className="absolute inset-0 z-50 grid place-items-center pointer-events-none">
          <div className="panel px-6 py-5 text-center anim-pop bg-panel">
            <div className="text-4xl mb-2">✦</div>
            <div className="font-pixel text-[11px] text-gold leading-relaxed">{evolveText}</div>
          </div>
        </div>
      )}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-50 pointer-events-none">
          <div className="panel-tight px-4 py-2 bg-panel anim-rise font-pixel text-[8px] text-you">{toast}</div>
        </div>
      )}
    </>
  )
}

// Applies the shake class to the phone frame (its parent) briefly.
function ShakeBinder() {
  useEffect(() => {
    const frame = document.querySelector('.crt') as HTMLElement | null
    if (!frame) return
    frame.classList.add('anim-shake')
    const id = setTimeout(() => frame.classList.remove('anim-shake'), 800)
    return () => {
      clearTimeout(id)
      frame.classList.remove('anim-shake')
    }
  }, [])
  return null
}
