// The 12-hour grace window: reachable from the drawer only while
// inGraceWindow(now) is true (see App.tsx). Lets the user retroactively log
// yesterday's habits/workout/calls/run — same rows as Today, wired to
// graceLog/logRun so a reversed miss can't be resurrected by the next resolve().
import { useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { useGameStore } from '../store/useGameStore'
import { useNav } from '../store/useNav'
import { useFx } from '../store/useFx'
import { useTick } from '../hooks/useNow'
import { buildTodayModel, type DueItem, type DayItem } from '../lib/today'
import { addDays, dateKey } from '../engine/time'

export function Grace() {
  useTick(1000)
  const s = useGameStore()
  const go = useNav((n) => n.go)
  const say = useFx((f) => f.say)

  const yMs = addDays(s.now(), -1)
  const model = buildTodayModel(s.startMs, yMs, s.log, s.deferrals, s.runCarry, s.planId)
  const yKey = dateKey(yMs)
  const dueYesterday = model.dayItems.filter((i) => i.effectiveDateKey === yKey)

  const dateLabel = new Date(yMs).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[10px] text-gold">GRACE PERIOD</div>
          <div className="font-term text-dim text-base">{dateLabel}</div>
        </div>
        <div className="text-right">
          <div className="font-pixel text-[8px] text-gold">ENDS AT NOON</div>
          <button className="font-term text-dim text-sm underline" onClick={() => go('today')}>
            back to today
          </button>
        </div>
      </Panel>

      <Panel accent="gold" title="YESTERDAY'S HABITS">
        <div className="space-y-1">
          {model.daily.map((i) => (
            <GraceHabitRow key={i.activity.id} item={i} say={say} />
          ))}
          {model.workout && <GraceHabitRow item={model.workout} say={say} />}
        </div>
      </Panel>

      {dueYesterday.length > 0 && (
        <Panel accent="gold" title="YESTERDAY'S ROUTINE ITEMS">
          <div className="space-y-2">
            {dueYesterday.map((i) =>
              i.activity.id === 'run' ? (
                <GraceRunRow key={i.key} item={i} say={say} />
              ) : (
                <GraceCallRow key={i.key} item={i} say={say} />
              ),
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}

function GraceHabitRow({ item, say }: { item: DueItem; say: (m: string) => void }) {
  const graceLog = useGameStore((s) => s.graceLog)
  const { activity, done } = item
  return (
    <div className="w-full flex items-center gap-3 py-1">
      <button
        className="pixbox shrink-0"
        onClick={() => {
          graceLog(activity.id)
          if (!done) say(`+${activity.xp} ${activity.name} (yesterday)`)
        }}
        aria-label={`mark yesterday's ${activity.name} done`}
      >
        {done && <span className="text-you font-pixel text-[10px]">✓</span>}
      </button>
      <span className="text-xl">{activity.icon}</span>
      <span className={`font-term text-lg flex-1 ${done ? 'text-dim line-through' : ''}`}>
        {activity.name}
      </span>
      <span className={`font-pixel text-[8px] ${done ? 'text-you' : 'text-dim'}`}>+{activity.xp}</span>
    </div>
  )
}

function GraceCallRow({ item, say }: { item: DayItem; say: (m: string) => void }) {
  const graceLog = useGameStore((s) => s.graceLog)
  return (
    <div className="flex items-center gap-2">
      <button
        className="pixbox"
        onClick={() => {
          graceLog('call', item.key)
          if (!item.done) say(`+2 Call · ${item.person} (yesterday)`)
        }}
      >
        {item.done && <span className="text-you font-pixel text-[10px]">✓</span>}
      </button>
      <span className="text-xl">📞</span>
      <div className="flex-1">
        <div className={`font-term text-lg leading-tight ${item.done ? 'text-dim line-through' : ''}`}>
          Call {item.person}
        </div>
        <div className="font-term text-dim text-sm">
          <span className={item.list === 'friend' ? 'text-cyan' : 'text-ymmot'}>{item.list}</span>
        </div>
      </div>
      <span className={`font-pixel text-[8px] ${item.done ? 'text-you' : 'text-dim'}`}>+2</span>
    </div>
  )
}

// No toggle-off for run (matches Today's RunRow — editing miles is the only
// interaction there too). Logs straight through logRun with yesterday's key,
// which already clears any matching miss entry as a side effect.
function GraceRunRow({ item, say }: { item: DayItem; say: (m: string) => void }) {
  const logRun = useGameStore((s) => s.logRun)
  const shake = useFx((f) => f.shake)
  const target = item.targetMiles ?? 1
  const [miles, setMiles] = useState(String(target))
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="pixbox">{item.done && <span className="text-you font-pixel text-[10px]">✓</span>}</div>
        <span className="text-xl">👟</span>
        <div className="flex-1">
          <div className={`font-term text-lg leading-tight ${item.done ? 'text-dim line-through' : ''}`}>
            Run {target} mi
          </div>
          <div className="font-term text-dim text-sm">
            {item.done ? `Banked ${item.value} mi · +${item.value * 5}` : 'yesterday'}
          </div>
        </div>
        <PixelButton onClick={() => setOpen((o) => !o)}>{item.done ? 'EDIT' : 'LOG'}</PixelButton>
      </div>
      {open && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            className="bg-night border-3 border-ink px-2 py-1 w-20 font-pixel text-[10px] text-center"
            style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
          />
          <span className="font-term text-dim text-lg">miles</span>
          <PixelButton
            variant="you"
            onClick={() => {
              const m = parseFloat(miles) || 0
              const r = logRun(m, item.key)
              setOpen(false)
              if (r === 'banked') say(`+${m * 5} Run · ${m} mi (yesterday)`)
              else {
                say('Under target — no credit.')
                shake()
              }
            }}
          >
            BANK
          </PixelButton>
        </div>
      )}
    </div>
  )
}
