import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { useNav, type Screen } from './store/useNav'
import { useGameStore, selectPlayerXP, selectRivalXP, selectYmmotXP } from './store/useGameStore'
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
import { selectPendingReports } from './store/useGameStore'

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
}

export default function App() {
  const screen = useNav((n) => n.screen)
  const init = useGameStore((s) => s.init)

  useEffect(() => {
    init()
    // Surface any newly-completed report (weekly / monthly / yearly).
    const p = selectPendingReports(useGameStore.getState())
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
        <DemoControls />
        <FxLayer />
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
    <header className="shrink-0 flex items-center justify-between px-3 py-2 border-b-3 border-line bg-panel z-40">
      <div className="flex items-center gap-2">
        <button className="font-pixel text-[12px] text-gold" onClick={() => useNav.getState().go('arena')}>
          RIVAL
        </button>
        <span className="font-pixel text-[8px] text-cyan tabular-nums" title="internal clock (24h)">{clock}</span>
      </div>
      <div className="flex items-center gap-2 font-pixel text-[8px]">
        <span className="text-you">{you.toLocaleString()}</span>
        <span className="text-dim">·</span>
        <span className="text-ymmot">{ymmot.toLocaleString()}</span>
        <span className="text-dim">·</span>
        <span className="text-tommy">{tommy.toLocaleString()}</span>
        <button className={sound ? 'text-gold' : 'text-dim'} onClick={s.toggleSound} title="sound">
          {sound ? '♪' : '✕'}
        </button>
      </div>
    </header>
  )
}

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'stats', label: 'STATS', icon: '📊' },
  { id: 'today', label: 'TODAY', icon: '✓' },
  { id: 'arena', label: 'ARENA', icon: '⚔' },
  { id: 'library', label: 'LIB', icon: '📖' },
]

function BottomNav() {
  useTick(5000)
  const screen = useNav((n) => n.screen)
  const go = useNav((n) => n.go)
  const [menu, setMenu] = useState(false)
  const pending = selectPendingReports(useGameStore.getState()).any

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
      <nav className="shrink-0 grid grid-cols-5 border-t-3 border-line bg-panel z-30">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            className={`py-2 flex flex-col items-center gap-0.5 ${screen === n.id ? 'bg-panel3' : ''}`}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            <span className={`font-pixel text-[6px] ${screen === n.id ? 'text-gold' : 'text-dim'}`}>{n.label}</span>
          </button>
        ))}
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

function DemoControls() {
  const [open, setOpen] = useState(false)
  const s = useGameStore()
  const shake = useFx((f) => f.shake)

  function withSwing(fn: () => void) {
    const before = selectPlayerXP(useGameStore.getState())
    fn()
    const after = selectPlayerXP(useGameStore.getState())
    if (before - after >= 15) shake()
  }

  return (
    <div className="absolute right-2 bottom-20 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="panel p-2 w-52 space-y-1.5 anim-rise">
          <div className="font-pixel text-[7px] text-gold">⏱ DEMO CONTROLS</div>
          <div className="font-term text-dim text-xs -mt-1">dev tool · advance the clock</div>
          <div className="grid grid-cols-2 gap-1">
            <button className="btn text-[7px]" onClick={() => withSwing(() => s.advanceClock(3600_000))}>+1 HOUR</button>
            <button className="btn text-[7px]" onClick={() => withSwing(() => s.advanceClock(4 * 3600_000))}>+4 HOURS</button>
            <button className="btn text-[7px]" onClick={() => withSwing(s.skipToTonight)}>SKIP TO 11:30PM</button>
            <button className="btn text-[7px]" onClick={() => withSwing(s.advanceWeek)}>+1 WEEK</button>
          </div>
          <div className="font-term text-dim text-xs pt-1">
            Benchmarks are fixed: {s.ymmotName} 70% · {s.rival.name} 90%.
          </div>
          <button className="btn btn-gold w-full text-[7px] mt-1" onClick={s.resetToSeed}>↺ RESET TO SEED</button>
        </div>
      )}
      <button
        className="btn btn-gold !p-2 text-[8px] rounded-none"
        onClick={() => setOpen((o) => !o)}
        title="demo controls"
      >
        {open ? '▼' : '⏱'}
      </button>
    </div>
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
