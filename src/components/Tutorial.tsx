// Guided tour after sign-up. Drives navigation through each screen and explains
// what everything means, using the loaded demo data. Finishing starts a fresh Day 1.
import { useEffect } from 'react'
import { PixelButton } from './ui'
import { useGameStore } from '../store/useGameStore'
import { useOnboarding } from '../store/useOnboarding'
import { useNav, type Screen } from '../store/useNav'

interface Step {
  screen: Screen
  param?: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    screen: 'arena',
    title: 'THE ARENA',
    body: 'This is home. Three versions of you climb together: ME (green) is you, Ymmot (violet) is the 70% “humanly achievable” you, and Tommy (blue) is the 90% locked-in you. The bars are total XP — both rivals rise on their own every day.',
  },
  {
    screen: 'arena',
    title: 'THE GAP',
    body: 'Your lead or deficit vs each rival, side by side — Ymmot left, Tommy right. The small number top-right is how much that gap moved today (green = you gained, red = they did). Goal: stay ahead of both.',
  },
  {
    screen: 'arena',
    title: 'DAY · CLOCK · STREAK',
    body: 'Top-left clock never stops; the DAY counter and your tier (FAILURE → CONTENDER → APEX) track your standing. The 🔥 counts days you beat both rivals. Tap a rival to rename them.',
  },
  {
    screen: 'today',
    title: 'TODAY — HABITS',
    body: 'Tap to complete each daily habit (stretch, jump rope, meditate, pray, journal). The Assigned Workout opens a guided session. Extra workouts are +5 each, uncapped — pure upside the rivals never count.',
  },
  {
    screen: 'today',
    title: 'WEEKLY ROUTINES',
    body: 'Phone calls (3/week: 2 family, 1 friend, +2 each) and a 1-mile run on 3 days are pinned to specific days and people. Can’t make one? Tap PUSH — no penalty. A pushed run mile just adds to your next run.',
  },
  {
    screen: 'player',
    param: 'cali-upper-b',
    title: 'WORKOUT PLAYER',
    body: 'Guided warmup → main → cooldown with a real work/rest interval timer and a how-to for every move. Finish the session to bank +10. (Tap QUIT to leave anytime.)',
  },
  {
    screen: 'library',
    title: 'EXERCISE LIBRARY',
    body: 'Every movement in your program with a text how-to and a media slot you can fill with your own photo. Search or filter by type; tap any for full detail.',
  },
  {
    screen: 'stats',
    title: 'STATS',
    body: 'Your three lines over time, a consistency heatmap of days you beat both rivals, your evolution tier, streaks, plus run and miss logs.',
  },
  {
    screen: 'reports',
    title: 'REPORTS',
    body: 'Auto-generated reviews: Weekly (you vs last week), Monthly (you vs both rivals, with tips to widen/close the gap), and Yearly (your growth) — all largely visual.',
  },
  {
    screen: 'arena',
    title: 'YOU’RE READY',
    body: 'That sample data was just for the tour. Your real journey starts now — Day 1, zero XP, the rivals at zero too. Show up daily and out-work the ghost.',
  },
]

export function Tutorial() {
  const step = useOnboarding((o) => o.step)
  const setStep = useOnboarding((o) => o.setStep)
  const finishPhase = useOnboarding((o) => o.finish)
  const go = useNav((n) => n.go)
  const finishOnboarding = useGameStore((s) => s.finishOnboarding)
  const playerName = useGameStore((s) => s.profile?.name ?? 'YOU')

  const cur = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Navigate to the step's screen + scroll to top whenever the step changes.
  useEffect(() => {
    go(cur.screen, cur.param)
    const id = setTimeout(() => document.querySelector('main')?.scrollTo({ top: 0 }), 50)
    return () => clearTimeout(id)
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  function done() {
    finishOnboarding()
    finishPhase()
    go('arena')
  }

  return (
    <div className="absolute inset-0 z-[55] pointer-events-none flex flex-col justify-end p-2 pb-20">
      {/* subtle scrim so the card is readable over any screen */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
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
  )
}
