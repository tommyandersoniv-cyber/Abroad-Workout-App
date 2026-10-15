import { useRef, useState } from 'react'
import { useNow } from '../hooks'
import {
  dateKey, fromKey, isCurrentOrFuture, monthKeys, periodLabel, shiftPeriod, weekKeys, weekStart, type DayKey,
} from '../lib/date'
import { DIMENSIONS } from '../lib/dimensions'
import { activeHabits, type Status } from '../lib/habits'
import { GOOD_HABIT_DAY, GOOD_REFLECTION_DAY, WEEKLY_GOAL, dimensionDays, isGoodHabitDay, isGoodReflectionDay } from '../lib/stats'
import { useStore } from '../store/useStore'
import { Card, Icon } from '../components/ui'

type Mode = 'week' | 'month'
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function Progress() {
  const now = useNow()
  const [mode, setMode] = useState<Mode>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const atCurrent = isCurrentOrFuture(anchor, mode, now)

  const go = (dir: -1 | 1) => {
    if (dir === 1 && atCurrent) return
    setAnchor((a) => shiftPeriod(mode === 'week' ? a : new Date(a.getFullYear(), a.getMonth(), 1), mode, dir))
  }
  const switchMode = (m: Mode) => {
    setMode(m)
    setAnchor(new Date())
  }

  // Swipe left/right to move between periods.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.changedTouches[0].clientX - t.x
    const dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx > 0 ? -1 : 1)
  }

  return (
    <div className="px-4 pt-safe pb-28 min-h-screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <h1 className="font-serif text-[32px] font-bold pt-6">Progress</h1>

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-surface p-1 text-[15px]">
        {(['week', 'month'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-lg py-2 font-medium capitalize ${mode === m ? 'bg-card shadow-sm text-ink' : 'text-muted'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button aria-label="Previous" onClick={() => go(-1)} className="p-2 -ml-2 text-muted"><Icon name="left" /></button>
        <div className="font-serif text-[22px] font-bold">{periodLabel(anchor, mode, now)}</div>
        <button aria-label="Next" onClick={() => go(1)} disabled={atCurrent} className="p-2 -mr-2 text-muted disabled:opacity-20">
          <Icon name="right" />
        </button>
      </div>

      <div key={`${mode}-${dateKey(mode === 'week' ? weekStart(anchor) : anchor).slice(0, mode === 'week' ? 10 : 7)}`} className="anim-rise">
        {mode === 'week' ? <WeekView anchor={anchor} now={now} /> : <MonthView anchor={anchor} now={now} />}
      </div>
    </div>
  )
}

function WeekView({ anchor, now }: { anchor: Date; now: Date }) {
  const refl = useStore((s) => s.reflections)
  const keys = weekKeys(anchor)
  const today = dateKey(now)
  const future = (k: DayKey) => k > today

  return (
    <>
      <Section title="Dimensions">
        {DIMENSIONS.map((d) => (
          <TrackRow
            key={d.id}
            name={d.name}
            marks={keys.map((k) => (future(k) ? 'future' : refl[k]?.includes(d.id) ? 'done' : 'none'))}
            count={dimensionDays(d.id, keys, refl)}
            todayIdx={keys.indexOf(today)}
          />
        ))}
      </Section>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mt-4 px-4 py-4">
      <div className="flex items-center">
        <h2 className="font-serif text-[20px] font-bold flex-1">{title}</h2>
        <div className="grid grid-cols-7 w-[147px] text-center text-[11px] text-faint">
          {DOW.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <span className="w-11" />
      </div>
      <div className="mt-2 divide-y divide-line">{children}</div>
    </Card>
  )
}

type Mark = Status | 'future'

function TrackRow({ name, marks, count, todayIdx }: { name: string; marks: Mark[]; count: number; todayIdx: number }) {
  const hit = count >= WEEKLY_GOAL
  return (
    <div className="py-2.5">
      <div className="flex items-center">
        <span className="flex-1 text-[15px] truncate pr-1">{name}</span>
        <div className="grid grid-cols-7 w-[147px] place-items-center">
          {marks.map((m, i) => <Dot key={i} mark={m} today={i === todayIdx} />)}
        </div>
        <span className={`w-11 text-right text-[13px] tabular-nums ${hit ? 'text-accent font-semibold' : 'text-muted'}`}>
          {hit ? `✓ ${count}` : `${count}/${WEEKLY_GOAL}`}
        </span>
      </div>
      <div className="h-1 rounded-full bg-empty mt-2 overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(1, count / WEEKLY_GOAL) * 100}%` }} />
      </div>
    </div>
  )
}

function Dot({ mark, today }: { mark: Mark; today: boolean }) {
  const ring = today ? 'outline outline-2 outline-offset-2 outline-ink/40' : ''
  if (mark === 'future') return <span className="size-1.5 rounded-full bg-line" />
  if (mark === 'done') return <span className={`size-4 rounded-full bg-accent ${ring}`} />
  if (mark === 'partial')
    return <span className={`size-4 rounded-full border-2 border-accent ${ring}`} style={{ background: 'linear-gradient(90deg, var(--accent) 50%, transparent 50%)' }} />
  return <span className={`size-4 rounded-full border-2 border-line ${ring}`} />
}

function MonthView({ anchor, now }: { anchor: Date; now: Date }) {
  const settings = useStore((s) => s.settings)
  const days = useStore((s) => s.days)
  const refl = useStore((s) => s.reflections)
  const [kind, setKind] = useState<'habits' | 'reflection'>('habits')
  const keys = monthKeys(anchor)
  const today = dateKey(now)
  const lead = fromKey(keys[0]).getDay()
  const isGood = (k: DayKey) => (kind === 'habits' ? isGoodHabitDay(days[k], settings) : isGoodReflectionDay(refl[k]))
  const goodCount = keys.filter((k) => k <= today && isGood(k)).length

  return (
    <>
      <div className="mt-4 flex justify-center gap-2 text-[14px]">
        {(['habits', 'reflection'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-1.5 capitalize border ${kind === k ? 'bg-ink text-on-ink border-ink' : 'border-line text-muted'}`}
          >
            {k}
          </button>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-serif text-[22px] font-bold">
            {goodCount} <span className="font-sans text-[15px] font-normal text-muted">good {goodCount === 1 ? 'day' : 'days'}</span>
          </span>
          <span className="text-[12px] text-faint">{kind === 'habits' ? `${GOOD_HABIT_DAY}+ of ${activeHabits(settings).length} habits` : `${GOOD_REFLECTION_DAY}+ of 8 dimensions`}</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-faint mb-2">
          {DOW.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
          {keys.map((k) => {
            const isFuture = k > today
            const good = !isFuture && isGood(k)
            return (
              <div
                key={k}
                aria-label={`${k}${good ? ', good day' : ''}`}
                className={`aspect-square rounded-lg text-[13px] tabular-nums ${
                  isFuture ? 'bg-surface text-faint' : good ? 'bg-accent text-on-ink font-medium' : 'bg-empty text-ink'
                } grid place-items-center ${k === today ? 'ring-2 ring-ink' : ''}`}
              >
                {Number(k.slice(8))}
              </div>
            )
          })}
        </div>
      </Card>

    </>
  )
}
