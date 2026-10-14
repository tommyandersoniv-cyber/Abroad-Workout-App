import { useEffect, useRef, useState } from 'react'
import { useNow } from './hooks'
import { dateKey } from './lib/date'
import { HABITS, doneCount } from './lib/habits'
import { useStore } from './store/useStore'
import { useUi } from './store/useUi'
import { Today } from './screens/Today'
import { Todo } from './screens/Todo'
import { Progress } from './screens/Progress'
import { TimerSession } from './screens/TimerSession'
import { StretchSession } from './screens/StretchSession'
import { Settings } from './screens/Settings'
import { Reflect } from './screens/Reflect'
import { PillButton } from './components/ui'

export default function App() {
  const theme = useStore((s) => s.settings.theme)
  const { tab, overlay, setTab } = useUi()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111111' : '#ffffff')
  }, [theme])

  // Freeze the page under full-screen overlays.
  useEffect(() => {
    document.body.style.overflow = overlay ? 'hidden' : ''
  }, [overlay])

  return (
    <div className="mx-auto max-w-md min-h-screen bg-bg">
      {tab === 'todo' ? <Todo /> : tab === 'today' ? <Today /> : <Progress />}

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-bg/95 backdrop-blur pb-safe">
        <div className="mx-auto max-w-md grid grid-cols-3">
          {([['todo', 'To Do'], ['today', 'Today'], ['progress', 'Progress']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); window.scrollTo(0, 0) }}
              className={`py-4 text-[16px] ${tab === t ? 'text-ink font-medium' : 'text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {overlay?.kind === 'timer' && <TimerSession id={overlay.id} />}
      {overlay?.kind === 'stretch' && <StretchSession />}
      {overlay?.kind === 'settings' && <Settings />}
      {overlay?.kind === 'reflect' && <Reflect />}

      <Toast />
      <Celebration />
    </div>
  )
}

function Toast() {
  const toast = useUi((s) => s.toast)
  if (!toast) return null
  return (
    <div
      key={toast.n}
      role="status"
      className="anim-toast fixed left-1/2 bottom-24 z-[60] max-w-[90vw] rounded-full bg-ink text-on-ink px-5 py-3 text-[15px] shadow-lg pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis"
    >
      {toast.text}
    </div>
  )
}

/** Shows once when the day's 8th habit gets done. */
function Celebration() {
  const now = useNow()
  const today = dateKey(now)
  const settings = useStore((s) => s.settings)
  const n = useStore((s) => doneCount(s.days[today], s.settings))
  const prev = useRef({ day: today, n })
  const [show, setShow] = useState(false)

  useEffect(() => {
    const p = prev.current
    if (p.day === today && p.n < HABITS.length && n === HABITS.length) setShow(true)
    prev.current = { day: today, n }
  }, [n, today, settings])

  if (!show) return null
  const bits = Array.from({ length: 28 }, (_, i) => i)
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-bg/90 backdrop-blur-sm px-6" onClick={() => setShow(false)}>
      {bits.map((i) => (
        <span
          key={i}
          className="absolute bottom-0 size-2.5 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: ['var(--shade-2)', 'var(--shade-3)', 'var(--shade-4)', 'var(--ink)'][i % 4],
            animation: `float-up ${2.2 + (i % 5) * 0.35}s ease-out ${(i % 7) * 0.12}s both`,
          }}
        />
      ))}
      <div className="text-center anim-pop">
        <div className="font-serif text-[44px] font-bold leading-tight">All 8. A full day.</div>
        <p className="text-muted text-[17px] mt-3">Every habit, done. This is who you’re becoming.</p>
        <PillButton className="mt-8 px-10" onClick={() => setShow(false)}>Thank you</PillButton>
      </div>
    </div>
  )
}
