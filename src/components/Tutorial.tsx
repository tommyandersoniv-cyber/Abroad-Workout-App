// Guided tour after sign-up. For each step it JUMPS to the screen, scrolls the
// element into view, ZOOMS it forward, and rings it in gold — so there's no doubt
// what's being explained. Finishing starts a fresh Day 1.
import { useEffect, useRef, useState } from 'react'
import { PixelButton } from './ui'
import { useGameStore } from '../store/useGameStore'
import { useSavingsStore } from '../store/useSavingsStore'
import { useMode } from '../store/useMode'
import { useOnboarding } from '../store/useOnboarding'
import { useNav, type Screen } from '../store/useNav'

interface Step {
  screen: Screen
  param?: string
  /** Which top-level mode this step belongs to (default workout). */
  mode?: 'workout' | 'savings'
  target?: string // [data-tour=…] element to spotlight + zoom
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    screen: 'arena',
    target: '[data-tour="lineup"]',
    title: 'THE ARENA',
    body: 'Home. Three versions of you climb together: ME (green) is you, Ymmot (violet) is the 70% “humanly achievable” you, and Tommy (blue) is the 90% locked-in you. The bars are total XP — both rivals rise on their own every day.',
  },
  {
    screen: 'arena',
    target: '[data-tour="gap"]',
    title: 'THE GAP',
    body: 'Your lead or deficit vs each rival, side by side — Ymmot left, Tommy right. The small number top-right is how much that gap moved today (green = you gained, red = they did). Goal: stay ahead of both.',
  },
  {
    screen: 'arena',
    target: '[data-tour="clock"]',
    title: 'CLOCK · DAY · STREAK',
    body: 'This clock never stops; the DAY counter and your tier (FAILURE → CONTENDER → APEX) track your standing, and the 🔥 counts days you beat both rivals. Tap a rival on the Arena to rename them.',
  },
  {
    screen: 'today',
    target: '[data-tour="habits"]',
    title: 'TODAY — HABITS',
    body: 'Tap to complete each daily habit (stretch, jump rope, meditate, pray, journal). The Assigned Workout above opens a guided session, and Extra Workouts are +5 each, uncapped — pure upside the rivals never count.',
  },
  {
    screen: 'today',
    target: '[data-tour="routines"]',
    title: 'WEEKLY ROUTINES',
    body: 'Phone calls (3/week: 2 family, 1 friend, +2 each) and a 1-mile run on 3 days are pinned to specific days and people. Can’t make one? Tap PUSH — no penalty. A pushed run mile just adds to your next run.',
  },
  {
    screen: 'player',
    param: 'cali-upper-b',
    target: '[data-tour="player"]',
    title: 'WORKOUT PLAYER',
    body: 'Guided warmup → main → cooldown with a real work/rest interval timer and a how-to for every move. Finish the session to bank +10. (Tap QUIT to leave anytime.)',
  },
  {
    screen: 'library',
    target: '[data-tour="library"]',
    title: 'EXERCISE LIBRARY',
    body: 'Every movement in your program with a text how-to and a media slot you can fill with your own photo. Search or filter by type; tap any for full detail.',
  },
  {
    screen: 'stats',
    target: '[data-tour="stats"]',
    title: 'STATS',
    body: 'Your three lines over time, a consistency heatmap of days you beat both rivals, your evolution tier, streaks, plus run and miss logs.',
  },
  {
    screen: 'reports',
    target: '[data-tour="reports"]',
    title: 'REPORTS',
    body: 'Auto-generated reviews: Weekly (you vs last week), Monthly (you vs both rivals, with tips), and Yearly (your growth) — all largely visual.',
  },
  {
    screen: 'savings',
    mode: 'savings',
    target: '[data-tour="save-arena"]',
    title: 'A SECOND GAME — SAVINGS',
    body: 'Tap 💰 at the top of the Arena to flip into Savings mode (it turns green). Same idea, new score: money saved. You race a perfect-discipline you who banks on schedule, and the gap is the whole game.',
  },
  {
    screen: 'savingsLibrary',
    mode: 'savings',
    target: '[data-tour="save-library"]',
    title: 'THE SAVINGS LIBRARY',
    body: 'Deploy a ready-made challenge — 100 Envelopes, 52-Week, $5k biweekly and more — or set a custom target (a total, a deadline, a pace). Switching goals banks what you’ve saved into your lifetime total.',
  },
  {
    screen: 'today',
    mode: 'workout',
    target: '[data-tour="save-quick"]',
    title: 'SAVE WITHOUT SWITCHING',
    body: 'Once a goal is live it shows up right here in Weekly Routines — one tap banks the amount due, so you can log savings from the workout side without ever changing modes.',
  },
  {
    screen: 'arena',
    title: 'YOU’RE READY',
    body: 'That sample data was just for the tour. Your real journey starts now — Day 1, zero XP, the rivals at zero too. Show up daily and out-work the ghost.',
  },
]

interface Ring {
  top: number
  left: number
  width: number
  height: number
}

export function Tutorial() {
  const step = useOnboarding((o) => o.step)
  const setStep = useOnboarding((o) => o.setStep)
  const finishPhase = useOnboarding((o) => o.finish)
  const go = useNav((n) => n.go)
  const finishOnboarding = useGameStore((s) => s.finishOnboarding)
  const playerName = useGameStore((s) => s.profile?.name ?? 'YOU')
  const [ring, setRing] = useState<Ring | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLElement | null>(null)

  const cur = STEPS[step]
  const isLast = step === STEPS.length - 1

  function clearSpot() {
    if (spotRef.current) {
      spotRef.current.classList.remove('tour-zoom')
      spotRef.current = null
    }
  }

  useEffect(() => {
    let cancelled = false
    clearSpot()
    setRing(null)
    useMode.getState().setMode(cur.mode ?? 'workout')
    go(cur.screen, cur.param)
    const main = document.querySelector('main')

    const t = setTimeout(() => {
      if (cancelled) return
      const el = cur.target ? (document.querySelector(cur.target) as HTMLElement | null) : null

      // 1. JUMP: bring the element into the upper area, clear of the bottom card.
      if (el && main && main.contains(el)) {
        const tr = el.getBoundingClientRect()
        const mr = main.getBoundingClientRect()
        main.scrollTop += tr.top - mr.top - 72
      } else if (main) {
        main.scrollTo({ top: 0 })
      }

      // 2. ZOOM: pop the element forward.
      if (el) {
        el.classList.add('tour-zoom')
        spotRef.current = el
      }

      // 3. RING: measure the (scaled) element relative to the phone frame.
      setTimeout(() => {
        if (cancelled) return
        const root = overlayRef.current
        if (!el || !root) return setRing(null)
        const fr = root.getBoundingClientRect()
        const tr = el.getBoundingClientRect()
        setRing({ top: tr.top - fr.top - 6, left: tr.left - fr.left - 6, width: tr.width + 12, height: tr.height + 12 })
      }, 300)
      // Longer settle so cross-mode re-renders (workout ⇄ savings) finish laying
      // out before we scroll/measure — keeps the spotlight from landing low.
    }, 260)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Always un-zoom the last element when the tour closes.
  useEffect(() => () => clearSpot(), [])

  // Seed a demo savings goal so the savings steps show a live Arena + quick-save
  // row. Cleared in done() so the real journey starts with no savings goal.
  useEffect(() => {
    const sav = useSavingsStore.getState()
    if (!sav.configured) {
      sav.deployGoal({
        name: 'Japan Trip',
        mode: 'target',
        totalAmount: 1200,
        timeframeNum: 12,
        timeframeUnit: 'months',
        pace: 'monthly',
      })
      sav.logContribution(80)
      sav.logContribution(70)
    }
  }, [])

  function done() {
    clearSpot()
    useMode.getState().setMode('workout')
    useSavingsStore.getState().resetSavings()
    finishOnboarding()
    finishPhase()
    go('arena')
  }

  return (
    <div ref={overlayRef} className="absolute inset-0 z-[55] pointer-events-none">
      {ring && (
        <div
          className="tour-ring absolute rounded-md"
          style={{ top: ring.top, left: ring.left, width: ring.width, height: ring.height }}
        />
      )}
      <div className="absolute inset-x-2 bottom-20">
        <div className="absolute -inset-x-2 -bottom-20 top-[-40px] bg-gradient-to-t from-ink/95 via-ink/40 to-transparent -z-10" />
        <div className="panel relative p-3 pointer-events-auto anim-rise">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[9px] text-gold">{cur.title}</span>
            <button className="font-pixel text-[7px] text-dim" onClick={done}>SKIP ✕</button>
          </div>
          <p className="font-term text-lg leading-snug">
            {isLast ? cur.body.replace('Your real journey', `${playerName}, your real journey`) : cur.body}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <PixelButton onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>◀</PixelButton>
            <div className="flex-1 text-center font-pixel text-[7px] text-dim">{step + 1} / {STEPS.length}</div>
            {isLast ? (
              <PixelButton variant="you" onClick={done}>START DAY 1 →</PixelButton>
            ) : (
              <PixelButton variant="gold" onClick={() => setStep(step + 1)}>NEXT ▶</PixelButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
