import { useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { useGameStore, selectPlayerXP } from '../store/useGameStore'
import { useSavingsStore, selectQuickSave, type QuickSave } from '../store/useSavingsStore'
import { useNav } from '../store/useNav'
import { useFx } from '../store/useFx'
import { useTick } from '../hooks/useNow'
import { buildTodayModel, type DueItem, type DayItem } from '../lib/today'
import { dateKey } from '../engine/time'
import { money } from '../savings'

export function Today() {
  useTick(1000)
  const s = useGameStore()
  const go = useNav((n) => n.go)
  const say = useFx((f) => f.say)

  const today = buildTodayModel(s.startMs, s.now(), s.log, s.deferrals, s.runCarry, s.planId)
  const you = selectPlayerXP(s)
  const todayKey = dateKey(s.now())
  const quickSave = selectQuickSave(useSavingsStore())
  // Weekly routine items (calls / runs) that land today — shown with the habits.
  const dueToday = today.dayItems.filter((i) => i.effectiveDateKey === todayKey)

  const dateLabel = new Date(s.now()).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[10px] text-you">TODAY</div>
          <div className="font-term text-dim text-base">{dateLabel} · Week {today.weekNumber} · Block {today.block}</div>
        </div>
        <div className="text-right">
          <div className="font-pixel text-[12px]">{Math.round(you).toLocaleString()}</div>
          <div className="font-term text-dim text-sm">YOUR XP</div>
        </div>
      </Panel>

      {/* Reflection flow — morning intention → check-in → day reflected */}
      <PixelButton variant="you" className="w-full" onClick={() => go('reflect')}>
        🪞 REFLECTION
      </PixelButton>

      {/* Today's checklist: daily habits + any weekly routine due today + a
          quick savings deposit — everything actionable today, in one place. */}
      <Panel accent="you" title="DAILY HABITS" dataTour="habits">
        <div className="space-y-1">
          {today.daily.map((i) => (
            <HabitRow
              key={i.activity.id}
              item={i}
              onToggle={() => {
                s.toggleActivity(i.activity.id)
                if (!i.done) say(`+${i.activity.xp} ${i.activity.name}`)
              }}
              onOpen={() => {
                const id = i.activity.id
                if (id === 'stretch') go('player', 'morning-stretch', 'habit')
                else if (id === 'meditate' || id === 'pray' || id === 'journal' || id === 'jumprope') go('habit', id)
                else {
                  s.toggleActivity(id)
                  if (!i.done) say(`+${i.activity.xp} ${i.activity.name}`)
                }
              }}
            />
          ))}
        </div>

        {(dueToday.length > 0 || quickSave) && (
          <div className="mt-2 pt-2 border-t border-line/50 space-y-2" data-tour="routines">
            {dueToday.map((i) =>
              i.activity.id === 'run' ? (
                <RunRow key={i.key} item={i} todayKey={todayKey} />
              ) : (
                <CallRow key={i.key} item={i} todayKey={todayKey} />
              ),
            )}
            {quickSave && (
              <div data-tour="save-quick">
                <SaveRow quick={quickSave} />
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Assigned workout → Workout Player */}
      <Panel accent="gold" title="ASSIGNED WORKOUT · +10 / −15">
        {today.isTrainingDay ? (
          <button
            className="w-full text-left flex items-center gap-3"
            onClick={() => go('player', today.session.workoutId!)}
          >
            <div className="pixbox">
              {today.workout?.done && <span className="text-you font-pixel text-[10px]">✓</span>}
            </div>
            <span className="text-2xl">🏋</span>
            <div className="flex-1">
              <div className="font-term text-lg leading-tight">{today.session.label}</div>
              <div className="font-term text-dim text-sm">
                {today.workout?.done ? `Completed — banked +${today.workout.xp ?? 10}` : 'Tap to run the guided session →'}
              </div>
            </div>
          </button>
        ) : (
          <p className="font-term text-dim text-lg">Rest day — morning stretch only. Enjoy it (the rival won’t).</p>
        )}
      </Panel>

      {/* Extra workout — pure upside. Pick a session and run it for +5. */}
      <PixelButton variant="gold" className="w-full" onClick={() => go('extra')}>
        + LOG EXTRA WORKOUT (+5)
      </PixelButton>
    </div>
  )
}

// The checkbox toggles done (quick manual override / undo); tapping the label
// opens the habit's guided session.
function HabitRow({ item, onToggle, onOpen }: { item: DueItem; onToggle: () => void; onOpen: () => void }) {
  const { activity, done } = item
  return (
    <div className="w-full flex items-center gap-3 py-1">
      <button className="pixbox shrink-0" onClick={onToggle} aria-label={`mark ${activity.name} done`}>
        {done && <span className="text-you font-pixel text-[10px]">✓</span>}
      </button>
      <button className="flex items-center gap-3 flex-1 text-left" onClick={onOpen}>
        <span className="text-xl">{activity.icon}</span>
        <span className={`font-term text-lg flex-1 ${done ? 'text-dim line-through' : ''}`}>
          {activity.name}
        </span>
      </button>
      <span className={`font-pixel text-[8px] ${done ? 'text-you' : 'text-dim'}`}>+{activity.xp}</span>
    </div>
  )
}

function dayTag(item: DayItem, todayKey: string): string {
  if (item.effectiveDateKey === todayKey) return 'TODAY'
  if (item.pushed) {
    const [y, m, d] = item.effectiveDateKey.split('-').map(Number)
    return '→ ' + new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' })
  }
  return item.dayLabel
}

// Quick-log a savings deposit without leaving workout mode. Amount is the active
// goal's weekly-equivalent (custom target) or the challenge's current amount.
function SaveRow({ quick }: { quick: QuickSave }) {
  const log = useSavingsStore((s) => s.logContribution)
  const say = useFx((f) => f.say)
  return (
    <button
      className="w-full flex items-center gap-2 text-left"
      onClick={() => {
        if (quick.done) return
        log(quick.amount)
        say(`+${money(quick.amount)} saved · ${quick.label}`)
      }}
    >
      <div className="pixbox">{quick.done && <span className="text-save font-pixel text-[10px]">✓</span>}</div>
      <span className="text-xl">💰</span>
      <div className="flex-1">
        <div className={`font-term text-lg leading-tight ${quick.done ? 'text-dim line-through' : ''}`}>
          Save · {quick.label}
        </div>
        <div className="font-term text-dim text-sm">
          <span className={quick.done ? 'text-save' : 'text-cyan'}>{quick.period === 'week' ? 'this week' : 'today'}</span>
          {' · '}
          {quick.done ? 'logged' : `tap to bank ${money(quick.amount)}`}
        </div>
      </div>
      <span className={`font-pixel text-[8px] ${quick.done ? 'text-save' : 'text-dim'}`}>{money(quick.amount)}</span>
    </button>
  )
}

function CallRow({ item, todayKey }: { item: DayItem; todayKey: string }) {
  const toggle = useGameStore((s) => s.toggleScheduled)
  const push = useGameStore((s) => s.pushItem)
  const say = useFx((f) => f.say)
  const isToday = item.effectiveDateKey === todayKey

  return (
    <div className="flex items-center gap-2">
      <button
        className="pixbox"
        onClick={() => {
          toggle('call', item.key)
          if (!item.done) say(`+2 Call · ${item.person}`)
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
          {' · '}
          <span className={isToday ? 'text-gold' : ''}>{dayTag(item, todayKey)}</span>
        </div>
      </div>
      {!item.done && (
        <button className="btn text-[7px]" onClick={() => { push('call', item.key); say(`Pushed ${item.person} →`) }}>
          PUSH →
        </button>
      )}
      <span className={`font-pixel text-[8px] ${item.done ? 'text-you' : 'text-dim'}`}>+2</span>
    </div>
  )
}

function RunRow({ item, todayKey }: { item: DayItem; todayKey: string }) {
  const logRun = useGameStore((s) => s.logRun)
  const push = useGameStore((s) => s.pushItem)
  const say = useFx((f) => f.say)
  const shake = useFx((f) => f.shake)
  const target = item.targetMiles ?? 1
  const [miles, setMiles] = useState(String(target))
  const [open, setOpen] = useState(false)
  const isToday = item.effectiveDateKey === todayKey

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="pixbox">{item.done && <span className="text-you font-pixel text-[10px]">✓</span>}</div>
        <span className="text-xl">👟</span>
        <div className="flex-1">
          <div className={`font-term text-lg leading-tight ${item.done ? 'text-dim line-through' : ''}`}>
            Run {target} mi{target > 1 && <span className="text-gold text-sm"> (carried)</span>}
          </div>
          <div className="font-term text-dim text-sm">
            {item.done ? `Banked ${item.value} mi · +${item.value * 5}` : <span className={isToday ? 'text-gold' : ''}>{item.dayLabel}{isToday ? ' · TODAY' : ''}</span>}
          </div>
        </div>
        {!item.done && (
          <button className="btn text-[7px]" onClick={() => { push('run', item.key); say('Pushed run →') }}>
            PUSH →
          </button>
        )}
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
              if (r === 'banked') say(`+${m * 5} Run · ${m} mi`)
              else {
                say('Under 3 mi — no credit. −5 looms.')
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
