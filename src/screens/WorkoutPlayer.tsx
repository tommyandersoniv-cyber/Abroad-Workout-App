import { useEffect, useMemo, useRef, useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { PixelMedia } from '../components/PixelMedia'
import { WORKOUT_BY_ID } from '../seed/workouts'
import { EXERCISE_BY_ID } from '../seed/exercises'
import { useNav } from '../store/useNav'
import { useGameStore } from '../store/useGameStore'
import { useFx } from '../store/useFx'
import type { WorkoutItem } from '../engine/types'

interface Step {
  kind: string
  item: WorkoutItem
}

export function WorkoutPlayer() {
  const param = useNav((n) => n.param)
  const go = useNav((n) => n.go)
  const workout = param ? WORKOUT_BY_ID[param] : undefined

  const steps: Step[] = useMemo(() => {
    if (!workout) return []
    return workout.blocks.flatMap((b) => b.items.map((item) => ({ kind: b.kind, item })))
  }, [workout])

  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'work' | 'rest'>('work')
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(0)
  const [done, setDone] = useState(false)
  const tref = useRef<number | null>(null)

  const step = steps[idx]
  const ex = step ? EXERCISE_BY_ID[step.item.exerciseId] : undefined
  const isTimed = !!(step && (step.item.workSec || step.item.durationSec))
  const workSec = step ? step.item.workSec ?? step.item.durationSec ?? 0 : 0
  const restSec = step ? step.item.restSec ?? 0 : 0

  // (Re)initialise the timer when the step changes.
  useEffect(() => {
    if (!step) return
    setPhase('work')
    setLeft(step.item.workSec ?? step.item.durationSec ?? 0)
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  // The interval.
  useEffect(() => {
    if (!running || !isTimed) return
    tref.current = window.setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1
        // phase boundary
        if (phase === 'work' && restSec > 0) {
          setPhase('rest')
          return restSec
        }
        // advance to next step
        advance()
        return 0
      })
    }, 1000)
    return () => {
      if (tref.current) clearInterval(tref.current)
    }
  }, [running, isTimed, phase, restSec, idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function advance() {
    setPhase('work')
    setIdx((i) => {
      if (i + 1 >= steps.length) {
        finish()
        return i
      }
      return i + 1
    })
  }

  function finish() {
    setRunning(false)
    setDone(true)
  }

  function bankAndExit() {
    const s = useGameStore.getState()
    if (!s.isLoggedToday('workout')) {
      s.completeWorkout()
      useFx.getState().say('WORKOUT COMPLETE · +10')
    }
    go('arena')
  }

  if (!workout) {
    return (
      <div className="p-4">
        <Panel>No workout scheduled. Rest day.</Panel>
        <PixelButton className="mt-3" onClick={() => go('today')}>← BACK</PixelButton>
      </div>
    )
  }

  if (done) {
    return (
      <div className="p-4 space-y-4 anim-rise">
        <Panel accent="gold" className="text-center py-6">
          <div className="font-pixel text-[16px] text-gold anim-pop">SESSION CLEAR!</div>
          <div className="text-5xl my-4">🏆</div>
          <p className="font-term text-lg">Warmup → Main → Cooldown complete.</p>
          <div className="font-pixel text-[20px] text-you mt-3 anim-pop">+10 XP</div>
        </Panel>
        <PixelButton variant="you" className="w-full" onClick={bankAndExit}>
          BANK +10 & RETURN
        </PixelButton>
      </div>
    )
  }

  const next = steps[idx + 1]
  const progress = ((idx + (phase === 'rest' ? 0.5 : 0)) / steps.length) * 100

  return (
    <div className="p-3 space-y-3">
      {/* header / progress */}
      <Panel className="py-2">
        <div className="flex items-center justify-between">
          <button className="font-pixel text-[8px] text-dim" onClick={() => go('today')}>← QUIT</button>
          <span className="font-pixel text-[8px] text-gold">{workout.name}</span>
          <span className="font-pixel text-[8px] text-dim">{idx + 1}/{steps.length}</span>
        </div>
        <div className="hud h-3 mt-2 p-[2px]">
          <div className="bar-fill h-full" style={{ width: `${progress}%`, background: 'var(--color-gold)' }} />
        </div>
        <div className="font-pixel text-[7px] text-cyan mt-2 uppercase">{step.kind} block</div>
      </Panel>

      {/* current exercise */}
      <Panel className="crt" dataTour="player">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
          <div>
            <h2 className="font-pixel text-[11px] text-you leading-relaxed">{ex?.name}</h2>
            <p className="font-term text-dim text-base mt-1">{ex?.description}</p>
            {step.item.reps && (
              <div className="font-pixel text-[9px] text-gold mt-2">
                {step.item.sets} × {step.item.reps}
              </div>
            )}
          </div>
          <button onClick={() => ex && go('exercise', ex.id)} className="w-24">
            <PixelMedia seed={ex?.spriteSeed ?? 1} size="lg" />
          </button>
        </div>

        {/* timer */}
        {isTimed ? (
          <div className="mt-3 text-center">
            <div className={`font-pixel text-[10px] ${phase === 'work' ? 'text-you' : 'text-rival'}`}>
              {phase === 'work' ? 'WORK' : 'REST'}
            </div>
            <div
              className={`font-pixel text-[44px] leading-none mt-2 ${phase === 'work' ? 'text-ink-text' : 'text-rival'}`}
            >
              {String(Math.floor(left / 60)).padStart(1, '0')}:{String(left % 60).padStart(2, '0')}
            </div>
            <div className="font-term text-dim text-sm mt-1">
              {workSec}s work{restSec ? ` / ${restSec}s rest` : ''}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <div className="font-pixel text-[9px] text-dim">SETS &amp; REPS — tap NEXT when done</div>
          </div>
        )}

        {/* how-to */}
        <ol className="mt-3 space-y-1 font-term text-base">
          {ex?.howTo.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-cyan font-pixel text-[8px] mt-1">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      </Panel>

      {/* controls */}
      <div className="grid grid-cols-3 gap-2">
        <PixelButton onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
          ◀ PREV
        </PixelButton>
        {isTimed ? (
          <PixelButton variant="you" onClick={() => setRunning((r) => !r)}>
            {running ? '❚❚ PAUSE' : '▶ START'}
          </PixelButton>
        ) : (
          <PixelButton variant="you" onClick={advance}>
            ✓ DONE
          </PixelButton>
        )}
        <PixelButton onClick={advance}>SKIP ▶</PixelButton>
      </div>

      {/* next up */}
      {next && (
        <Panel className="py-2 flex items-center gap-3">
          <span className="font-pixel text-[7px] text-dim">NEXT</span>
          <PixelMedia seed={EXERCISE_BY_ID[next.item.exerciseId]?.spriteSeed ?? 2} size="sm" />
          <span className="font-term text-base">{EXERCISE_BY_ID[next.item.exerciseId]?.name}</span>
        </Panel>
      )}
    </div>
  )
}
