import { useEffect, useMemo } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { PixelMedia } from '../components/PixelMedia'
import { WORKOUT_BY_ID } from '../seed/workouts'
import { EXERCISE_BY_ID } from '../seed/exercises'
import { useNav } from '../store/useNav'
import { useGameStore } from '../store/useGameStore'
import { useFx } from '../store/useFx'
import { useWorkoutSession } from '../store/useWorkoutSession'
import { playTimerStart, playTimerTick } from '../lib/sound'
import type { WorkoutItem } from '../engine/types'

interface Step {
  kind: string
  item: WorkoutItem
  /** "Set 2 of 4" / "Round 1 of 3" — blank for single-occurrence items. */
  label: string
}

/** Seconds the work phase of a step should start with. */
function stepLeft(step: Step | undefined): number {
  return step ? step.item.workSec ?? step.item.durationSec ?? 0 : 0
}

export function WorkoutPlayer() {
  const param = useNav((n) => n.param)
  const variant = useNav((n) => n.variant)
  const go = useNav((n) => n.go)
  const workout = param ? WORKOUT_BY_ID[param] : undefined
  // An off-schedule "extra" session banks +5 bonus. A "swap" is a chosen
  // replacement for the day's assigned workout: it still counts as the daily
  // workout (no penalty, streak intact) but banks +5 instead of +10. A "habit"
  // session is a daily habit (the morning stretch) run through the guided flow.
  const isExtra = variant === 'extra'
  const isSwap = variant === 'swap'
  const isHabit = variant === 'habit'

  // Expand each block into one step per set (or per circuit round), so the
  // player cycles through every set/round before moving on.
  const steps: Step[] = useMemo(() => {
    if (!workout) return []
    const out: Step[] = []
    for (const b of workout.blocks) {
      if (b.rounds && b.rounds > 1) {
        // Circuit: every item once, repeated for `rounds` rounds.
        for (let r = 1; r <= b.rounds; r++) {
          for (const item of b.items) {
            out.push({ kind: b.kind, item, label: `Round ${r} of ${b.rounds}` })
          }
        }
      } else {
        // Standard: each item runs its own `sets` count back to back.
        for (const item of b.items) {
          const n = item.sets ?? 1
          for (let setN = 1; setN <= n; setN++) {
            out.push({ kind: b.kind, item, label: n > 1 ? `Set ${setN} of ${n}` : '' })
          }
        }
      }
    }
    return out
  }, [workout])

  // Live progress lives in a store so it survives this screen unmounting when
  // the user navigates away and returns.
  const { idx, phase, running, left, done } = useWorkoutSession()

  // Start a fresh session the first time a given workout (or assigned↔extra
  // intent) is opened; otherwise leave the existing session intact so progress
  // resumes where it stopped.
  useEffect(() => {
    if (!workout) return
    const sess = useWorkoutSession.getState()
    if (sess.workoutId !== workout.id || sess.extra !== isExtra || sess.swap !== isSwap) {
      sess.start(workout.id, stepLeft(steps[0]), isExtra, isSwap)
    }
  }, [workout?.id, steps, isExtra, isSwap])

  // Clamp for display: when resuming or switching workouts, the stored idx can
  // briefly exceed this workout's step count before the start effect resets it.
  const safeIdx = steps.length ? Math.min(idx, steps.length - 1) : 0
  const step = steps[safeIdx]
  const ex = step ? EXERCISE_BY_ID[step.item.exerciseId] : undefined
  const isTimed = !!(step && (step.item.workSec || step.item.durationSec))
  const workSec = stepLeft(step)
  const restSec = step ? step.item.restSec ?? 0 : 0

  // The interval. Reads/writes the store so a remount mid-tick stays consistent.
  useEffect(() => {
    if (!running || !isTimed) return
    const id = window.setInterval(() => {
      const sess = useWorkoutSession.getState()
      if (sess.left > 1) {
        sess.set({ left: sess.left - 1 })
        return
      }
      // phase boundary
      if (sess.phase === 'work' && restSec > 0) {
        sess.set({ phase: 'rest', left: restSec })
        return
      }
      // advance to next step
      advance()
    }, 1000)
    return () => clearInterval(id)
  }, [running, isTimed, phase, restSec, idx]) // eslint-disable-line react-hooks/exhaustive-deps

  // A bell tick on each of the final five seconds of the current interval.
  useEffect(() => {
    if (running && isTimed && left >= 1 && left <= 5) playTimerTick(left === 1)
  }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  // Jump to a step and reset its timer to the work phase.
  function setStep(i: number) {
    useWorkoutSession.getState().set({ idx: i, phase: 'work', left: stepLeft(steps[i]) })
  }

  function advance() {
    if (idx + 1 >= steps.length) {
      finish()
      return
    }
    setStep(idx + 1)
  }

  function finish() {
    useWorkoutSession.getState().set({ running: false, done: true })
  }

  function bankAndExit() {
    const s = useGameStore.getState()
    if (isHabit) {
      // Daily-habit session (morning stretch) — log the stretch habit (+10).
      if (!s.isLoggedToday('stretch')) {
        s.toggleActivity('stretch')
        useFx.getState().say('+10 Morning Stretch')
      }
      useWorkoutSession.getState().clear()
      go('today')
      return
    }
    if (isExtra) {
      // Pure upside — log a +5 extra every time, uncapped.
      s.logExtra()
      useFx.getState().say('+5 Extra workout!')
    } else if (isSwap) {
      // Swapped workout — counts as the daily workout but banks only +5.
      if (!s.isLoggedToday('workout')) {
        s.completeWorkout(5)
        useFx.getState().say('SWITCHED WORKOUT · +5')
      }
    } else if (!s.isLoggedToday('workout')) {
      s.completeWorkout()
      useFx.getState().say('WORKOUT COMPLETE · +10')
    }
    useWorkoutSession.getState().clear()
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
    const xp = isHabit ? 10 : isExtra || isSwap ? 5 : 10
    return (
      <div className="p-4 space-y-4 anim-rise">
        <Panel accent="gold" className="text-center py-6">
          <div className="font-pixel text-[16px] text-gold anim-pop">SESSION CLEAR!</div>
          <div className="text-5xl my-4">{isHabit ? '🧘' : isExtra ? '⚡' : isSwap ? '⇄' : '🏆'}</div>
          <p className="font-term text-lg">
            {isHabit
              ? 'Morning stretch complete.'
              : isExtra
                ? `${workout.name} — extra session done.`
                : isSwap
                  ? `${workout.name} — swapped in for today.`
                  : 'Warmup → Main → Cooldown complete.'}
          </p>
          <div className="font-pixel text-[20px] text-you mt-3 anim-pop">+{xp} XP</div>
        </Panel>
        <PixelButton variant="you" className="w-full" onClick={bankAndExit}>
          BANK +{xp} & RETURN
        </PixelButton>
      </div>
    )
  }

  if (!step) return null

  const next = steps[safeIdx + 1]
  const progress = ((safeIdx + (phase === 'rest' ? 0.5 : 0)) / steps.length) * 100

  return (
    <div className="p-3 space-y-3">
      {/* header / progress */}
      <Panel className="py-2">
        <div className="flex items-center justify-between">
          <button className="font-pixel text-[8px] text-dim" onClick={() => go('today')}>← QUIT</button>
          <span className="font-pixel text-[8px] text-gold">{workout.name}</span>
          <span className="font-pixel text-[8px] text-dim">{safeIdx + 1}/{steps.length}</span>
        </div>
        <div className="hud h-3 mt-2 p-[2px]">
          <div className="bar-fill h-full" style={{ width: `${progress}%`, background: 'var(--color-gold)' }} />
        </div>
        <div className="font-pixel text-[7px] text-cyan mt-2 uppercase">{step.kind} block</div>
      </Panel>

      {/* Swap the assigned workout for another (banks +5 instead of +10, no
          penalty, streak intact). Hidden for extra/habit sessions. */}
      {!isExtra && !isHabit && (
        <button className="btn w-full text-[7px] text-cyan" onClick={() => go('extra', workout.id, 'swap')}>
          ⇄ SWITCH WORKOUT{!isSwap ? ' · COSTS 5 XP' : ''}
        </button>
      )}

      {/* current exercise */}
      <Panel className="crt" dataTour="player">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
          <div>
            <h2 className="font-pixel text-[11px] text-you leading-relaxed">{ex?.name}</h2>
            <p className="font-term text-dim text-base mt-1">{ex?.description}</p>
            {step.label && <div className="font-pixel text-[9px] text-gold mt-2">{step.label}</div>}
            {step.item.reps && (
              <div className="font-pixel text-[9px] text-cyan mt-1">× {step.item.reps}</div>
            )}
          </div>
          <button onClick={() => ex && go('exercise', ex.id)} className="w-24">
            <PixelMedia seed={ex?.spriteSeed ?? 1} photoUrl={ex?.photoUrl} size="lg" />
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
            <div className="font-pixel text-[9px] text-dim">
              {step.label ? `${step.label.toUpperCase()} — TAP DONE WHEN COMPLETE` : 'TAP DONE WHEN COMPLETE'}
            </div>
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
        <PixelButton onClick={() => setStep(Math.max(0, idx - 1))} disabled={idx === 0}>
          ◀ PREV
        </PixelButton>
        {isTimed ? (
          <PixelButton
            variant="you"
            onClick={() => {
              if (!running) playTimerStart()
              useWorkoutSession.getState().set({ running: !running })
            }}
          >
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
          <PixelMedia seed={EXERCISE_BY_ID[next.item.exerciseId]?.spriteSeed ?? 2} photoUrl={EXERCISE_BY_ID[next.item.exerciseId]?.photoUrl} size="sm" />
          <span className="font-term text-base">{EXERCISE_BY_ID[next.item.exerciseId]?.name}</span>
        </Panel>
      )}
    </div>
  )
}
