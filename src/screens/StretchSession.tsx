import { useEffect, useMemo, useRef, useState } from 'react'
import { useClock } from '../hooks'
import { dateKey, formatSecs } from '../lib/date'
import { encouragement } from '../lib/encourage'
import { beep, buzzer, unlockAudio } from '../lib/sound'
import { PHASES, PREP_SEC, STRETCHES, STRETCH_TOTAL_SEC, stretchPhoto, type Stretch } from '../lib/stretch'
import { useWakeLock } from '../lib/wakeLock'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { BackButton, Icon, PillButton, Sheet } from '../components/ui'
import { AlreadyDone } from '../components/AlreadyDone'

const PREP = PREP_SEC

interface Segment { kind: 'prep' | 'hold'; i: number; start: number; len: number; side?: 1 | 2 }

export function StretchSession() {
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
    STRETCHES.forEach((st, i) => {
      const sides = st.sides === 2 ? ([1, 2] as const) : ([undefined] as const)
      for (const side of sides) {
        out.push({ kind: 'prep', i, start: t, len: PREP, side }); t += PREP
        out.push({ kind: 'hold', i, start: t, len: st.holdSec, side }); t += st.holdSec
      }
    })
    return out
  }, [])
  const last = segments[segments.length - 1]
  const total = last.start + last.len

  const t = clock.elapsed
  const segIdx = Math.max(0, segments.findIndex((s) => t < s.start + s.len))
  const seg = segments[segIdx] ?? last
  const left = Math.max(0, seg.start + seg.len - t)
  const intoHold = seg.kind === 'hold' ? t - seg.start : 0
  /** Seconds actually spent holding (prep time not counted). */
  const heldSecs = segments
    .filter((s) => s.kind === 'hold')
    .reduce((a, s) => a + Math.max(0, Math.min(s.len, t - s.start)), 0)

  const show: Stretch = STRETCHES[phase === 'ready' ? 0 : seg.i]
  const prompts = show.prompts ?? []
  const activePrompt = seg.kind === 'hold' ? [...prompts].reverse().find(([at]) => intoHold >= at)?.[1] : undefined
  const promptIdx = seg.kind === 'hold' ? prompts.filter(([at]) => intoHold >= at).length : 0

  // Beep at each segment change and mid-hold prompt; buzzer + save at the end.
  const lastMark = useRef('')
  useEffect(() => {
    if (phase !== 'going') return
    if (t >= total && !saved.current) {
      saved.current = true
      clock.pause()
      buzzer()
      addSecs(day, 'stretch', STRETCH_TOTAL_SEC, true)
      setPhase('finished')
      return
    }
    const mark = `${segIdx}:${promptIdx}`
    if (mark !== lastMark.current) {
      if (lastMark.current) beep()
      lastMark.current = mark
    }
  }, [phase, t, total, segIdx, promptIdx, clock, addSecs, day])

  const leave = () => {
    if (!saved.current && heldSecs >= 1) {
      saved.current = true
      addSecs(day, 'stretch', heldSecs, false)
      say(`${formatSecs(heldSecs)} of stretching logged. ${encouragement()}`)
    }
    close()
  }

  const jump = (dir: 1 | -1) => {
    const target = Math.min(STRETCHES.length - 1, Math.max(0, seg.i + dir))
    clock.seek(segments.find((s) => s.i === target)!.start)
  }

  if (phase === 'finished') {
    return (
      <Sheet>
        <div className="text-center pt-24 anim-pop">
          <div className="font-serif text-[40px] font-bold">Stretched.</div>
          <p className="text-muted text-[17px] mt-2">All {STRETCHES.length} stretches, {formatSecs(STRETCH_TOTAL_SEC)}.</p>
          <p className="text-[17px] mt-6">{cheer}</p>
          <PillButton className="w-full mt-12" onClick={close}>Back to to-do</PillButton>
        </div>
      </Sheet>
    )
  }

  const photo = stretchPhoto(show)
  const phaseNo = PHASES.indexOf(show.phase) + 1
  let label = ''
  if (phase === 'going') {
    if (seg.kind === 'prep') label = seg.side === 2 ? 'Switch sides' : 'Get into position'
    else if (seg.side) label = `Side ${seg.side} of 2`
  }

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

      <div className="mt-4 text-[12px] tracking-[0.14em] uppercase text-muted">
        Phase {phaseNo} · {show.phase}
      </div>

      {photo ? (
        <div className="mt-3 rounded-2xl overflow-hidden bg-white border border-line aspect-[4/3] relative">
          <img src={photo} alt={show.name} className="size-full object-contain p-2" />
          {show.link && (
            <a href={show.link} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 rounded-full bg-ink/80 text-on-ink text-[12px] px-3 py-1">
              More ↗
            </a>
          )}
        </div>
      ) : show.link ? (
        <a
          href={show.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4"
        >
          <span className="text-[15px] font-medium">See picture</span>
          <span className="text-muted text-[13px]">opens in Safari ↗</span>
        </a>
      ) : null}

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {label && <div className="text-[12px] tracking-[0.14em] uppercase text-accent">{label}</div>}
          <h1 className="font-serif text-[28px] font-bold leading-tight">{show.name}</h1>
          <p className="text-muted text-[15px] mt-1">{show.why}</p>
        </div>
        <div className="font-serif text-[44px] font-bold tabular-nums leading-none shrink-0">
          {phase === 'ready' ? formatSecs(show.holdSec) : formatSecs(Math.ceil(left))}
        </div>
      </div>

      {activePrompt && (
        <div className="mt-4 rounded-xl bg-accent text-on-ink px-4 py-3 text-[15px] font-medium anim-pop">{activePrompt}</div>
      )}

      <ol className="mt-4 space-y-1.5 text-[15px]">
        {show.cues.map((c, i) => (
          <li key={i} className="flex gap-3"><span className="text-faint tabular-nums">{i + 1}</span>{c}</li>
        ))}
      </ol>

      <div className="mt-8 pb-8">
        {phase === 'ready' ? (
          <>
            <p className="text-muted text-[14px] mb-4">
              {STRETCHES.length} stretches in {PHASES.length} phases, {formatSecs(STRETCH_TOTAL_SEC)} total.
              One-sided stretches time each side. You get {PREP}s to get set before each hold, and a beep marks every change.
            </p>
            <PillButton className="w-full" onClick={() => { unlockAudio(); clock.start(); setPhase('going') }}>
              Start stretching
            </PillButton>
            <AlreadyDone
              name="Stretching"
              onConfirm={() => {
                saved.current = true
                addSecs(day, 'stretch', 0, true)
                say(`Stretching checked off. ${encouragement()}`)
                close()
              }}
            />
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
