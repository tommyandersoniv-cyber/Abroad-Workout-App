import { useEffect, useMemo, useRef, useState } from 'react'
import { useClock } from '../hooks'
import { dateKey, formatSecs } from '../lib/date'
import { encouragement } from '../lib/encourage'
import { HABIT_BY_ID, randomDurationSec, rangeFor, type TimerId } from '../lib/habits'
import { buzzer, unlockAudio } from '../lib/sound'
import { useWakeLock } from '../lib/wakeLock'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { BackButton, PillButton, Sheet } from '../components/ui'
import { AlreadyDone } from '../components/AlreadyDone'

const DOING: Record<TimerId, string> = { jumprope: 'jump rope', journal: 'journaling', meditate: 'meditation', meditateAM: 'meditation' }

const PROMPTS: Partial<Record<TimerId, string>> = {
  journal: 'Write whatever comes. No rules, no editing.',
  meditate: 'Close your eyes. Breathe in for four, out for six.',
  meditateAM: 'Close your eyes. Breathe in for four, out for six.',
  jumprope: 'Light on your feet. Any pace counts.',
}

export function TimerSession({ id }: { id: TimerId }) {
  const habit = HABIT_BY_ID[id]
  const range = useStore((s) => s.settings.ranges[rangeFor(id)])
  const addSecs = useStore((s) => s.addSecs)
  const setJournal = useStore((s) => s.setJournal)
  const close = useUi((s) => () => s.open(null))
  const say = useUi((s) => s.say)

  const [day] = useState(() => dateKey(new Date()))
  const journal = useStore((s) => s.days[day]?.journal ?? '')
  const duration = useMemo(() => randomDurationSec(range), [range])
  const clock = useClock()
  const [phase, setPhase] = useState<'ready' | 'timing' | 'finished'>('ready')
  const saved = useRef(false)
  const [cheer] = useState(() => encouragement())
  useWakeLock(phase === 'timing')

  const remaining = Math.max(0, duration - clock.elapsed)
  const progress = Math.min(1, clock.elapsed / duration)

  // Finish: buzzer + bank the full duration.
  useEffect(() => {
    if (phase === 'timing' && remaining <= 0 && !saved.current) {
      saved.current = true
      clock.pause()
      buzzer()
      addSecs(day, id, duration, true)
      setPhase('finished')
    }
  }, [phase, remaining, clock, addSecs, day, id, duration])

  /** Leave early: whatever time was put in is kept. */
  const leave = () => {
    if (!saved.current && clock.elapsed >= 1) {
      saved.current = true
      addSecs(day, id, clock.elapsed, false)
      say(`${formatSecs(clock.elapsed)} logged. ${encouragement()}`)
    }
    close()
  }

  const r = 120
  const c = 2 * Math.PI * r

  return (
    <Sheet>
      <BackButton onClick={leave} label={phase === 'timing' ? 'Save & close' : 'Back'} />
      <h1 className="font-serif text-[30px] font-bold mt-2">{habit.name}</h1>
      <p className="text-muted text-[15px] mt-1">
        {phase === 'ready'
          ? `A surprise length between ${range.min} and ${range.max} minutes. The buzzer tells you when.`
          : PROMPTS[id]}
      </p>

      {phase === 'finished' ? (
        <div className="text-center mt-16 anim-pop">
          <div className="font-serif text-[40px] font-bold">Done.</div>
          <p className="text-muted text-[17px] mt-2">{formatSecs(duration)} of {DOING[id]}.</p>
          <p className="text-[17px] mt-6">{cheer}</p>
        </div>
      ) : (
        <div className="relative mx-auto mt-8 size-[260px]">
          <svg viewBox="0 0 260 260" className="size-full -rotate-90">
            <circle cx="130" cy="130" r={r} fill="none" stroke="var(--empty)" strokeWidth="8" />
            <circle
              cx="130" cy="130" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-serif text-[56px] font-bold tabular-nums leading-none">
                {phase === 'ready' ? '?:??' : formatSecs(Math.ceil(remaining))}
              </div>
              {phase === 'timing' && !clock.running && <div className="text-muted text-[13px] mt-2">Paused</div>}
            </div>
          </div>
        </div>
      )}

      {id === 'journal' && (
        <textarea
          value={journal}
          onChange={(e) => setJournal(day, e.target.value)}
          placeholder="Today I…"
          className="mt-8 w-full min-h-40 rounded-2xl border border-line bg-card p-4 text-[17px] leading-relaxed outline-none focus:border-ink"
        />
      )}

      <div className="mt-8 pb-8 space-y-3">
        {phase === 'ready' && (
          <>
            <PillButton className="w-full" onClick={() => { unlockAudio(); clock.start(); setPhase('timing') }}>
              Start
            </PillButton>
            <AlreadyDone
              name={habit.name}
              onConfirm={() => {
                saved.current = true
                addSecs(day, id, 0, true)
                say(`${habit.name} checked off. ${encouragement()}`)
                close()
              }}
            />
          </>
        )}
        {phase === 'timing' && (
          <PillButton variant="ghost" className="w-full" onClick={() => (clock.running ? clock.pause() : clock.start())}>
            {clock.running ? 'Pause' : 'Resume'}
          </PillButton>
        )}
        {phase === 'finished' && <PillButton className="w-full" onClick={close}>Back to today</PillButton>}
      </div>
    </Sheet>
  )
}
