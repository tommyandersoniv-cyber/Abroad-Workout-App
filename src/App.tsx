import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { useNav, type Screen } from './store/useNav'
import { useGameStore, selectPlayerXP, selectRivalXP, selectYmmotXP } from './store/useGameStore'
import { useSavingsStore, selectSavedTotal } from './store/useSavingsStore'
import { useMode } from './store/useMode'
import { MODE_HOME } from './components/ModeToggle'
import { money } from './savings'
import { useFx } from './store/useFx'
import { useTick } from './hooks/useNow'
import { tierForGap, combinedGap, TIER_NAMES } from './engine/levels'
import { Arena } from './screens/Arena'
import { Today } from './screens/Today'
import { WorkoutPlayer } from './screens/WorkoutPlayer'
import { ExerciseLibrary } from './screens/ExerciseLibrary'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Stats } from './screens/Stats'
import { Catalog } from './screens/Catalog'
import { RivalSetup } from './screens/RivalSetup'
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

const SCREENS: Record<Screen, ComponentType> = {
  arena: Arena,
  today: Today,
  player: WorkoutPlayer,
  exercise: ExerciseDetail,
  library: ExerciseLibrary,
  stats: Stats,
  catalog: Catalog,
  rival: RivalSetup,
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

  return (
    <div className="h-[100dvh] w-full flex items-stretch justify-center bg-ink overflow-hidden" style={backdrop}>
      <div className="relative w-full max-w-[430px] h-[100dvh] bg-night flex flex-col crt overflow-hidden shadow-2xl">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
          <Current />
        </main>
        <BottomNav />
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

const WORKOUT_NAV: NavItem[] = [
  { id: 'stats', label: 'STATS', icon: '📊' },
  { id: 'today', label: 'TODAY', icon: '✓' },
  { id: 'arena', label: 'ARENA', icon: '⚔' },
  { id: 'library', label: 'LIB', icon: '📖' },
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
  const [menu, setMenu] = useState(false)
  const pending = selectPendingReports(useGameStore.getState()).any

  // Savings mode: three tabs, no overflow menu.
  if (mode === 'savings') {
    return (
      <nav
        className="shrink-0 grid grid-cols-3 border-t-3 border-line bg-panel z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {SAVINGS_NAV.map((n) => {
          const active = n.match ? n.match.includes(screen) : screen === n.id
          return (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`py-2 flex flex-col items-center gap-0.5 ${active ? 'bg-panel3' : ''}`}
            >
              <span className="text-lg leading-none">{n.icon}</span>
              <span className={`font-pixel text-[6px] ${active ? 'text-save' : 'text-dim'}`}>{n.label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <>
      {menu && (
        <div className="absolute inset-0 z-40 bg-ink/70" onClick={() => setMenu(false)}>
          <div className="absolute bottom-16 inset-x-3 panel p-2 space-y-2 anim-rise" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-gold w-full text-left flex items-center justify-between" onClick={() => { go('reports'); setMenu(false) }}>
              <span>📊 REPORTS</span>
              {pending && <span className="font-pixel text-[7px]">● NEW</span>}
            </button>
            {([['catalog', '📋 CATALOG / BUILDER'], ['rival', '👹 RIVALS & NAMES'], ['settings', '⚙ SETTINGS']] as const).map(
              ([id, label]) => (
                <button key={id} className="btn w-full text-left" onClick={() => { go(id); setMenu(false) }}>
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      )}
      <nav
        className="shrink-0 grid grid-cols-5 border-t-3 border-line bg-panel z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {WORKOUT_NAV.map((n) => {
          const active = n.match ? n.match.includes(screen) : screen === n.id
          return (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`py-2 flex flex-col items-center gap-0.5 ${active ? 'bg-panel3' : ''}`}
            >
              <span className="text-lg leading-none">{n.icon}</span>
              <span className={`font-pixel text-[6px] ${active ? 'text-gold' : 'text-dim'}`}>{n.label}</span>
            </button>
          )
        })}
        <button
          onClick={() => setMenu((m) => !m)}
          className={`relative py-2 flex flex-col items-center gap-0.5 ${['catalog', 'rival', 'settings', 'reports'].includes(screen) ? 'bg-panel3' : ''}`}
        >
          {pending && <span className="absolute top-1 right-3 w-2 h-2 bg-gold" style={{ boxShadow: '0 0 0 1px var(--color-ink)' }} />}
          <span className="text-lg leading-none">≡</span>
          <span className="font-pixel text-[6px] text-dim">MORE</span>
        </button>
      </nav>
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
