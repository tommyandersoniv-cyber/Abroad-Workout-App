// First-run sign-up: name only. Day 1 is anchored to today. The name becomes
// the 90%-locked-in rival's identity (see completeSignup) — you play as ME/YOU.
import { useState } from 'react'
import { Sprite } from './Sprite'
import { PixelButton } from './ui'
import { useGameStore } from '../store/useGameStore'
import { useOnboarding } from '../store/useOnboarding'

export function Signup() {
  const completeSignup = useGameStore((s) => s.completeSignup)
  const toTutorial = useOnboarding((o) => o.toTutorial)
  const [name, setName] = useState('')

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const ready = name.trim().length > 0

  function start() {
    completeSignup(name)
    toTutorial()
  }

  return (
    <div className="absolute inset-0 z-[60] bg-night crt overflow-y-auto no-scrollbar">
      <div
        className="min-h-full flex flex-col justify-center p-5 space-y-4 anim-rise"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)',
        }}
      >
        <div className="text-center">
          <div className="flex justify-center gap-3 mb-3">
            <Sprite who="hero" stage={2} px={6} className="anim-bob" />
            <Sprite who="tommy" stage={3} px={6} className="anim-bob-fast" flip />
          </div>
          <h1 className="font-pixel text-[20px] text-gold">RIVAL</h1>
          <p className="font-term text-dim text-lg mt-2 leading-snug">
            A discipline game with no finish line. Out-work the 90%-of-perfect ghost of yourself.
          </p>
        </div>

        <div className="panel p-4 space-y-3">
          <label className="block">
            <span className="font-pixel text-[8px] text-you">YOUR NAME</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 14))}
              placeholder="e.g. Tommy"
              className="w-full mt-1 bg-night border-3 border-ink px-2 py-2 font-term text-lg"
              style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
            />
            <span className="font-term text-dim text-sm mt-1 block">
              Your locked-in rival is named after you. Its mirror gets your name backwards.
            </span>
          </label>

          <div className="panel-tight p-2">
            <div className="font-pixel text-[7px] text-cyan">DAY 1 STARTS</div>
            <div className="font-term text-lg">{today}</div>
            <div className="font-term text-dim text-sm">You and both rivals begin at 0 XP.</div>
          </div>
        </div>

        <PixelButton variant="gold" className="w-full" disabled={!ready} onClick={start}>
          {ready ? 'SIGN UP & SEE THE TOUR →' : 'ENTER YOUR NAME'}
        </PixelButton>
        <p className="font-term text-dim text-sm text-center">
          A quick guided tour (on sample data) comes next — then your real Day 1 begins.
        </p>
      </div>
    </div>
  )
}
