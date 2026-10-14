import { useNow } from '../hooks'
import { dateKey, formatSecs, formatTime, longDate, timeToMin } from '../lib/date'
import { encouragement } from '../lib/encourage'
import {
  HABITS, counterTarget, counterTotal, doneCount, habitStatus, habitTime, habitsInOrder, upNext,
  type CounterId, type Habit, type RangeId,
} from '../lib/habits'
import { STRETCHES, STRETCH_TOTAL_SEC } from '../lib/stretch'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { Card, Icon, StatusMark, ThemeToggle } from '../components/ui'

export function Todo() {
  const now = useNow()
  const today = dateKey(now)
  const settings = useStore((s) => s.settings)
  const log = useStore((s) => s.days[today])
  const reflected = useStore((s) => (s.reflections[today]?.length ?? 0) > 0)
  const open = useUi((s) => s.open)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const next = upNext(settings, log, reflected, nowMin)
  const done = doneCount(log, settings)

  return (
    <div className="px-4 pt-safe pb-28 anim-rise">
      <header className="flex items-start justify-between pt-6">
        <div>
          <div className="text-muted text-[15px]">{longDate(now)}</div>
          <h1 className="font-serif text-[32px] leading-tight font-bold mt-1">To do</h1>
          <div className="text-muted text-[15px] mt-1">
            {done === 0 ? 'Any one of these is a great start.' : `${done} of ${HABITS.length} done today`}
          </div>
        </div>
        <div className="flex gap-1 -mr-2 text-muted">
          <ThemeToggle />
          <button aria-label="Settings" className="p-2" onClick={() => open({ kind: 'settings' })}>
            <Icon name="gear" />
          </button>
        </div>
      </header>

      {next && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
          <span className="text-[11px] tracking-[0.12em] uppercase text-muted">Up next</span>
          <span className="text-[15px] font-medium flex-1 truncate">{next.title}</span>
          <span className="text-[13px] text-muted">{formatTime(next.time)}</span>
        </div>
      )}

      <div className="space-y-3 mt-4">
        {habitsInOrder(settings.times).map((h) => (
          <HabitRow key={h.id} habit={h} today={today} nowMin={nowMin} />
        ))}
      </div>
    </div>
  )
}

function HabitRow({ habit, today, nowMin }: { habit: Habit; today: string; nowMin: number }) {
  const settings = useStore((s) => s.settings)
  const log = useStore((s) => s.days[today])
  const togglePrayer = useStore((s) => s.togglePrayer)
  const open = useUi((s) => s.open)
  const say = useUi((s) => s.say)
  const status = habitStatus(habit.id, log, settings)
  const time = habitTime(habit.id, settings.times)
  const soon = status !== 'done' && Math.abs(timeToMin(time) - nowMin) <= 30

  if (habit.kind === 'counter') return <CounterRow id={habit.id as CounterId} name={habit.name} today={today} />

  let sub = formatTime(time)
  let action: (() => void) | null = null
  if (habit.kind === 'tap') {
    action = () => {
      const turningOn = status !== 'done'
      togglePrayer(today, habit.id as 'prayAM' | 'prayPM')
      if (turningOn) say(encouragement())
    }
  } else if (habit.kind === 'timer') {
    const r = settings.ranges[habit.id as RangeId]
    const secs = log?.secs[habit.id as RangeId] ?? 0
    sub = status === 'done'
      ? (secs ? `${formatSecs(secs)} today` : 'Done today')
      : `${r.min}–${r.max} min · ${formatTime(time)}${secs ? ` · ${formatSecs(secs)} so far` : ''}`
    action = () => open({ kind: 'timer', id: habit.id as RangeId })
  } else {
    const mins = Math.round(STRETCH_TOTAL_SEC / 60)
    const secs = log?.secs.stretch ?? 0
    sub = status === 'done'
      ? (secs ? `${formatSecs(secs)} today` : 'Done today')
      : `${STRETCHES.length} stretches · ${mins} min · ${formatTime(time)}${secs ? ` · ${formatSecs(secs)} so far` : ''}`
    action = () => open({ kind: 'stretch' })
  }

  return (
    <Card className={`flex items-center gap-4 px-4 py-4 ${soon ? 'ring-1 ring-accent' : ''}`}>
      <button className="flex items-center gap-4 flex-1 text-left min-w-0" onClick={action}>
        <StatusMark status={status} />
        <div className="min-w-0">
          <div className="text-[17px] font-medium">{habit.name}</div>
          <div className="text-[13px] text-muted mt-0.5">{sub}</div>
        </div>
      </button>
      {habit.kind !== 'tap' && (
        <button
          onClick={action}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-[14px] font-medium flex items-center gap-1.5"
        >
          {status === 'done' ? 'Again' : <><Icon name="play" size={12} /> Start</>}
        </button>
      )}
    </Card>
  )
}

function CounterRow({ id, name, today }: { id: CounterId; name: string; today: string }) {
  const settings = useStore((s) => s.settings)
  const log = useStore((s) => s.days[today])
  const addCount = useStore((s) => s.addCount)
  const undoCount = useStore((s) => s.undoCount)
  const say = useUi((s) => s.say)
  const n = counterTotal(log, id)
  const target = counterTarget(settings, id)
  const status = habitStatus(id, log, settings)
  const pct = Math.min(1, n / target)
  const canUndo = (log?.adds[id]?.length ?? 0) > 0

  return (
    <Card className="px-4 py-4">
      <div className="flex items-center gap-4">
        <StatusMark status={status} />
        <div className="flex-1">
          <div className="text-[17px] font-medium">{name}</div>
          <div className="text-[13px] text-muted mt-0.5">
            <span className="text-ink font-medium tabular-nums">{n}</span> / {target}
          </div>
        </div>
        <button
          aria-label={`Undo last ${name}`}
          disabled={!canUndo}
          onClick={() => undoCount(today, id)}
          className="p-2 text-muted disabled:opacity-30"
        >
          <Icon name="undo" size={18} />
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-empty mt-3 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[5, 10, 25].map((k) => (
          <button
            key={k}
            onClick={() => {
              addCount(today, id, k)
              say(encouragement())
            }}
            className="rounded-xl bg-surface py-2.5 text-[15px] font-medium active:scale-95 transition"
          >
            +{k}
          </button>
        ))}
      </div>
    </Card>
  )
}
