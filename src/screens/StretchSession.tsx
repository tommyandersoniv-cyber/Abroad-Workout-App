import { useEffect, useMemo, useRef, useState } from 'react'
import { useClock } from '../hooks'
import { dateKey, formatSecs } from '../lib/date'
import { encouragement } from '../lib/encourage'
import { beep, buzzer, unlockAudio } from '../lib/sound'
import { STRETCHES, stretchPhoto } from '../lib/stretch'
import { useWakeLock } from '../lib/wakeLock'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { BackButton, Icon, PillButton, Sheet } from '../components/ui'

const PREP = 5 // seconds to get into position before each hold

interface Segment { kind: 'prep' | 'hold'; i: number; start: number; len: number }

export function StretchSession() {
  const hold = useStore((s) => s.settings.stretchHoldSec)
  const addSecs = useStore((s) => s.addSecs)
  const close = useUi((s) => () => s.open(null))
  const say = useUi((s) => s.say)
  const [day] = useState(() => dateKey(new Date()))
  const clock = useClock()
  const [phase, setPhase] = useState<'ready' | 'going' | 'finished'>('ready')
  const saved = useRef(false)
  const [cheer] = useState(() => encouragement())
  useWakeLock(phase === 'going')

  const segments = useMemo(() => {
    const out: Segment[] = []
    let t = 0
    STRETCHES.forEach((_, i) => {
      out.push({ kind: 'prep', i, start: t, len: PREP }); t += PREP
      out.push({ kind: 'hold', i, start: t, len: hold }); t += hold
    })
    return out
  }, [hold])
  const total = segments[segments.length - 1].start + segments[segments.length - 1].len

  const t = clock.elapsed
  const segIdx = Math.max(0, segments.findIndex((s) => t < s.start + s.len))
  const seg = segments[segIdx] ?? segments[segments.length - 1]
  const stretch = STRETCHES[seg.i]
  const left = Math.max(0, seg.start + seg.len - t)
  /** Seconds actually spent holding (prep time not counted). */
  const heldSecs = segments.filter((s) => s.kind === 'hold').reduce((a, s) => a + Math.max(0, Math.min(s.len, t - s.start)), 0)

  // Beep at each segment change; buzzer + save at the end.
  const lastSeg = useRef(-1)
  useEffect(() => {
    if (phase !== 'going') return
    if (t >= total && !saved.current) {
      saved.current = true
      clock.pause()
      buzzer()
      addSecs(day, 'stretch', STRETCHES.length * hold, true)
      setPhase('finished')
      return
    }
    if (segIdx !== lastSeg.current) {
      if (lastSeg.current !== -1) beep()
      lastSeg.current = segIdx
    }
  }, [phase, t, total, segIdx, clock, addSecs, day, hold])

  const leave = () => {
    if (!saved.current && heldSecs >= 1) {
      saved.current = true
      addSecs(day, 'stretch', heldSecs, false)
      say(`${formatSecs(heldSecs)} of stretching logged. ${encouragement()}`)
    }
    close()
  }

  const jump = (dir: 1 | -1) => {
    // Jump to the prep segment of the next/previous stretch.
    const target = Math.min(STRETCHES.length - 1, Math.max(0, seg.i + dir))
    clock.seek(segments[target * 2].start)
  }

  if (phase === 'finished') {
    return (
      <Sheet>
        <div className="text-center pt-24 anim-pop">
          <div className="font-serif text-[40px] font-bold">Stretched.</div>
          <p className="text-muted text-[17px] mt-2">All {STRETCHES.length} holds, {formatSecs(STRETCHES.length * hold)}.</p>
          <p className="text-[17px] mt-6">{cheer}</p>
          <PillButton className="w-full mt-12" onClick={close}>Back to today</PillButton>
        </div>
      </Sheet>
    )
  }

  const show = phase === 'ready' ? STRETCHES[0] : stretch
  return (
    <Sheet>
      <div className="flex items-center justify-between">
        <BackButton onClick={leave} label={phase === 'going' ? 'Save & close' : 'Back'} />
        <span className="text-muted text-[14px] tabular-nums">
          {(phase === 'ready' ? 0 : seg.i) + 1} / {STRETCHES.length}
        </span>
      </div>
      <div className="h-1 rounded-full bg-empty overflow-hidden mt-2">
        <div className="h-full bg-accent transition-all" style={{ width: `${(t / total) * 100}%` }} />
      </div>

      <div className="mt-5 rounded-2xl overflow-hidden bg-white border border-line aspect-[4/3]">
        <img src={stretchPhoto(show.id)} alt={show.name} className="size-full object-contain p-2" />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {phase === 'going' && seg.kind === 'prep' && (
            <div className="text-[12px] tracking-[0.14em] uppercase text-accent">Get into position</div>
          )}
          <h1 className="font-serif text-[28px] font-bold leading-tight">{show.name}</h1>
          <p className="text-muted text-[15px] mt-1">{show.desc}</p>
        </div>
        <div className="font-serif text-[44px] font-bold tabular-nums leading-none shrink-0">
          {phase === 'ready' ? formatSecs(hold) : formatSecs(Math.ceil(left))}
        </div>
      </div>

      <ol className="mt-4 space-y-1.5 text-[15px]">
        {show.cues.map((c, i) => (
          <li key={i} className="flex gap-3"><span className="text-faint tabular-nums">{i + 1}</span>{c}</li>
        ))}
      </ol>

      <div className="mt-8 pb-8">
        {phase === 'ready' ? (
          <>
            <p className="text-muted text-[14px] mb-4">
              {STRETCHES.length} holds × {hold}s, with {PREP}s to switch between each. A beep marks every change.
            </p>
            <PillButton className="w-full" onClick={() => { unlockAudio(); clock.start(); setPhase('going') }}>
              Start stretching
            </PillButton>
          </>
        ) : (
          <div className="flex gap-3">
            <button aria-label="Previous stretch" onClick={() => jump(-1)} className="rounded-2xl border border-line px-5 text-muted">
              <Icon name="left" />
            </button>
            <PillButton variant="ghost" className="flex-1" onClick={() => (clock.running ? clock.pause() : clock.start())}>
              {clock.running ? 'Pause' : 'Resume'}
            </PillButton>
            <button aria-label="Next stretch" onClick={() => jump(1)} className="rounded-2xl border border-line px-5 text-muted">
              <Icon name="right" />
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
