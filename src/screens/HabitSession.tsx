import { useEffect, useRef, useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { useNav } from '../store/useNav'
import { useGameStore } from '../store/useGameStore'
import { useFx } from '../store/useFx'
import { ACTIVITY_BY_ID } from '../seed/activities'
import { playTimerStart, playTimerTick } from '../lib/sound'

// Per-habit guided-session config. Stretch isn't here — it routes through the
// WorkoutPlayer (the existing guided workout flow).
interface HabitMeta {
  /** Fixed duration in seconds, or null when the user picks (meditate). */
  fixed: number | null
  /** Random whole-minute range [min,max] when fixed is null-by-random (journal). */
  randomMin?: [number, number]
  prompt: string
}

const HABIT_META: Record<string, HabitMeta> = {
  journal: {
    fixed: null,
    randomMin: [2, 5],
    prompt: 'Write freely until the timer ends — whatever’s on your mind.',
  },
  jumprope: {
    fixed: null,
    randomMin: [2, 5],
    prompt: 'Light bounces on the balls of your feet — keep a steady rhythm until the timer ends.',
  },
  pray: {
    fixed: 60,
    prompt: 'One minute of focused prayer. Settle in and begin.',
  },
  meditate: {
    fixed: null, // user chooses
    prompt: 'Close your eyes, follow the breath, and let thoughts pass.',
  },
}

const MEDITATE_PRESETS = [2, 5, 10] // minutes

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

export function HabitSession() {
  const habitId = useNav((n) => n.param) ?? ''
  const go = useNav((n) => n.go)
  const meta = HABIT_META[habitId]
  const activity = ACTIVITY_BY_ID[habitId]

  // Resolve the starting duration once: pray = fixed 60s; journal = a random
  // 2–5 min; meditate = null until the user picks.
  const [total, setTotal] = useState<number | null>(() => {
    if (!meta) return null
    if (meta.fixed != null) return meta.fixed
    if (meta.randomMin) {
      const [lo, hi] = meta.randomMin
      return (lo + Math.floor(Math.random() * (hi - lo + 1))) * 60
    }
    return null // meditate — choose first
  })
  const [left, setLeft] = useState<number>(total ?? 0)
  const [running, setRunning] = useState<boolean>(total != null) // auto-start once we have a duration
  const [done, setDone] = useState(false)
  const tref = useRef<number | null>(null)
  const endAtRef = useRef<number | null>(null)

  // The countdown. Tracks a wall-clock end time instead of decrementing a
  // counter each tick, so the display stays correct even if the interval is
  // throttled or suspended while the screen is locked/backgrounded.
  useEffect(() => {
    if (!running) return
    endAtRef.current = Date.now() + left * 1000
    const sync = () => {
      if (endAtRef.current == null) return
      setLeft(Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)))
    }
    tref.current = window.setInterval(sync, 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') sync() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      if (tref.current) clearInterval(tref.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [running]) // eslint-disable-line react-hooks/exhaustive-deps

  // Chime when an auto-starting session (journal / jump rope / prayer) begins.
  useEffect(() => {
    if (running) playTimerStart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A bell tick on each of the final five seconds.
  useEffect(() => {
    if (running && left >= 1 && left <= 5) playTimerTick(left === 1)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  // Finish when the clock runs out.
  useEffect(() => {
    if (running && total != null && left === 0) {
      setRunning(false)
      setDone(true)
    }
  }, [left, running, total])

  function choose(minutes: number) {
    const sec = Math.max(1, Math.min(60, Math.round(minutes))) * 60
    setTotal(sec)
    setLeft(sec)
    setRunning(true)
    playTimerStart()
  }

  function bankAndExit() {
    const s = useGameStore.getState()
    if (!s.isLoggedToday(habitId)) {
      s.toggleActivity(habitId)
      useFx.getState().say(`+${activity.xp} ${activity.name}`)
    }
    go('today')
  }

  if (!meta || !activity) {
    return (
      <div className="p-4">
        <Panel>Unknown habit.</Panel>
        <PixelButton className="mt-3" onClick={() => go('today')}>← BACK</PixelButton>
      </div>
    )
  }

  // Meditate duration picker.
  if (total == null) {
    return <MeditatePicker icon={activity.icon} onChoose={choose} onBack={() => go('today')} />
  }

  if (done) {
    return (
      <div className="p-4 space-y-4 anim-rise">
        <Panel accent="gold" className="text-center py-6">
          <div className="font-pixel text-[16px] text-gold anim-pop">SESSION CLEAR!</div>
          <div className="text-5xl my-4">{activity.icon}</div>
          <p className="font-term text-lg">{activity.name} — {fmt(total)} done.</p>
          <div className="font-pixel text-[20px] text-you mt-3 anim-pop">+{activity.xp} XP</div>
        </Panel>
        <PixelButton variant="you" className="w-full" onClick={bankAndExit}>
          BANK +{activity.xp} & RETURN
        </PixelButton>
      </div>
    )
  }

  const ranToZero = left === 0
  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel className="py-2">
        <div className="flex items-center justify-between">
          <button className="font-pixel text-[8px] text-dim" onClick={() => go('today')}>← QUIT</button>
          <span className="font-pixel text-[8px] text-gold">{activity.name.toUpperCase()}</span>
          <span className="font-pixel text-[8px] text-dim">{fmt(total)}</span>
        </div>
      </Panel>

      <Panel className="crt text-center py-10">
        <div className="text-5xl mb-4">{activity.icon}</div>
        <div className={`font-pixel text-[56px] leading-none ${running ? 'text-you' : 'text-ink-text'}`}>
          {fmt(left)}
        </div>
        {meta.randomMin && (
          <div className="font-term text-dim text-sm mt-3">Random session · {Math.round(total / 60)} min</div>
        )}
        <p className="font-term text-dim text-base mt-4 px-4">{meta.prompt}</p>
      </Panel>

      <div className="grid grid-cols-2 gap-2">
        <PixelButton
          variant="you"
          onClick={() => setRunning((r) => { if (!r) playTimerStart(); return !r })}
          disabled={ranToZero}
        >
          {running ? '❚❚ PAUSE' : '▶ RESUME'}
        </PixelButton>
        <PixelButton onClick={() => { setRunning(false); setDone(true) }}>
          ✓ FINISH
        </PixelButton>
      </div>
    </div>
  )
}

function MeditatePicker({
  icon,
  onChoose,
  onBack,
}: {
  icon: string
  onChoose: (minutes: number) => void
  onBack: () => void
}) {
  const [custom, setCustom] = useState('15')
  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel className="py-2">
        <div className="flex items-center justify-between">
          <button className="font-pixel text-[8px] text-dim" onClick={onBack}>← QUIT</button>
          <span className="font-pixel text-[8px] text-gold">MEDITATE</span>
          <span className="font-pixel text-[8px] text-dim" />
        </div>
      </Panel>

      <Panel accent="gold" title="CHOOSE A DURATION">
        <div className="text-5xl text-center my-2">{icon}</div>
        <div className="grid grid-cols-3 gap-2">
          {MEDITATE_PRESETS.map((m) => (
            <PixelButton key={m} variant="you" onClick={() => onChoose(m)}>
              {m} MIN
            </PixelButton>
          ))}
        </div>

        <PixelButton
          variant="gold"
          className="w-full mt-2"
          onClick={() => onChoose(5 + Math.floor(Math.random() * 26))} // random 5–30 min
        >
          🎲 RANDOMIZE (5–30 MIN)
        </PixelButton>

        <div className="font-pixel text-[7px] text-dim mt-4 mb-2">OR A CUSTOM TIME (UP TO 60 MIN)</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="bg-night border-3 border-ink px-2 py-2 w-24 font-pixel text-[12px] text-center"
            style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
          />
          <span className="font-term text-dim text-lg">minutes</span>
          <PixelButton
            variant="gold"
            className="ml-auto"
            onClick={() => {
              const m = Math.max(1, Math.min(60, Math.round(parseFloat(custom) || 0)))
              onChoose(m)
            }}
          >
            START ▶
          </PixelButton>
        </div>
      </Panel>
    </div>
  )
}
