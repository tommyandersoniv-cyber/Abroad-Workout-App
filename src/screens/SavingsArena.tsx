import { useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { Sprite } from '../components/Sprite'
import { ModeToggle } from '../components/ModeToggle'
import { useSavingsStore, selectSavingsView, type SavingsView } from '../store/useSavingsStore'
import { useNav } from '../store/useNav'
import { useFx } from '../store/useFx'
import { useTick } from '../hooks/useNow'
import { money } from '../savings'

export function SavingsArena() {
  useTick(1000) // live rival climb
  const s = useSavingsStore()
  const go = useNav((n) => n.go)
  const view = selectSavingsView(s)

  return (
    <div className="p-3 space-y-3 anim-rise">
      <ModeToggle />
      {view ? (
        <Dashboard view={view} />
      ) : (
        <Intro onBrowse={() => go('savingsLibrary')} onCustom={() => go('savingsSetup', 'deploy')} />
      )}
    </div>
  )
}

// ── First run — no goal deployed yet ───────────────────────────────────────
function Intro({ onBrowse, onCustom }: { onBrowse: () => void; onCustom: () => void }) {
  return (
    <>
      <Panel accent="save" title="💰 SAVINGS ARENA" className="crt">
        <p className="font-term text-lg leading-snug">
          A second discipline game — but the score is <span className="text-save">money saved</span>.
        </p>
        <p className="font-term text-dim text-base mt-2">
          Deploy a challenge (or set a custom target) and race a perfect-discipline version of you that
          saves on schedule. The whole game is the gap. No penalties — your money only goes up.
        </p>
      </Panel>
      <PixelButton variant="save" className="w-full" onClick={onBrowse}>
        📚 BROWSE THE LIBRARY →
      </PixelButton>
      <button className="btn w-full" onClick={onCustom}>
        🎯 OR SET A CUSTOM TARGET
      </button>
    </>
  )
}

// ── Money taunts — flavor, picked deterministically off the gap ─────────────
const AHEAD_TAUNTS = ['Stacking faster than schedule. Don’t blink.', 'You’re printing. Keep the lead.', 'Ahead of the line — that’s the whole game.']
const BEHIND_TAUNTS = ['The schedule’s pulling away. Catch up.', 'Disciplined-you already banked. Did you?', 'Every skipped deposit is a head start for the line.']

function taunt(v: SavingsView): string {
  const bank = v.status === 'ahead' ? AHEAD_TAUNTS : BEHIND_TAUNTS
  return bank[Math.abs(Math.round(v.you)) % bank.length]
}

function youStage(v: SavingsView): number {
  if (v.ideal <= 0) return 2
  const r = v.you / v.ideal
  return r >= 1.2 ? 3 : r >= 1 ? 2 : r >= 0.7 ? 1 : 0
}

// ── Configured — the live arena ────────────────────────────────────────────
function Dashboard({ view: v }: { view: SavingsView }) {
  const go = useNav((n) => n.go)
  const logToday = useSavingsStore((st) => st.logToday)
  const logContribution = useSavingsStore((st) => st.logContribution)
  const undoLast = useSavingsStore((st) => st.undoLast)
  const contributions = useSavingsStore((st) => st.contributions)
  const say = useFx((f) => f.say)

  const [addOpen, setAddOpen] = useState(false)
  const [addStr, setAddStr] = useState('')
  const last = contributions.length ? contributions.reduce((a, b) => (b.at >= a.at ? b : a)) : null

  function doUndo() {
    const amt = undoLast()
    if (amt > 0) say(`↩ Undid ${money(amt)}`)
  }

  const barMax = Math.max(v.you, v.ideal, 1)

  function doLogToday() {
    const amt = logToday()
    if (amt > 0) say(`+${money(amt)} saved!`)
    else say('Nothing due — goal complete 🏁')
  }
  function doAdd() {
    const amt = parseFloat(addStr) || 0
    if (amt <= 0) return
    logContribution(amt)
    say(`+${money(amt)} saved!`)
    setAddStr('')
    setAddOpen(false)
  }

  return (
    <>
      {/* Header */}
      <Panel className="flex items-center justify-between crt">
        <button className="flex items-center gap-2 text-left" onClick={() => v.mode === 'target' && go('savingsSetup', 'edit')}>
          <span className="text-2xl">{v.goal.icon}</span>
          <div>
            <div className="font-pixel text-[11px] text-save leading-tight">{v.goal.name}</div>
            <div className="font-term text-dim text-sm">
              Day {v.day}
              {v.mode === 'target'
                ? ` · ${money(v.perDeposit)}/${v.paceWord}`
                : v.challenge
                  ? ` · ${v.challenge.name}`
                  : ''}
            </div>
          </div>
        </button>
        <div className="text-right">
          <div className="font-pixel text-[18px] text-save leading-none">{money(v.you)}</div>
          <div className="font-term text-dim text-sm">SAVED</div>
        </div>
      </Panel>

      {/* Fighters — you vs the pace rival */}
      <Panel className="crt overflow-hidden">
        <div className="text-center font-pixel text-[11px] text-cyan mb-2">DAY {v.day}</div>
        <div className="grid grid-cols-2 items-end gap-1">
          <Fighter who="hero" stage={youStage(v)} name="YOU" amount={v.you} tone="text-save" caption={v.status === 'ahead' ? 'AHEAD' : 'BEHIND'} />
          <Fighter who="tommy" stage={3} name={v.idealLabel} amount={v.ideal} tone="text-tommy" caption={v.mode === 'challenge' ? 'on schedule' : 'on pace'} flip />
        </div>
        <div className="text-center font-pixel text-[8px] text-gold anim-flash mt-1">— VS —</div>

        <div className="mt-3 space-y-2">
          <SaveBar label="YOU" value={v.you} max={barMax} fill="var(--color-save)" text="text-save" />
          <SaveBar label={v.idealLabel} value={v.ideal} max={barMax} fill="var(--color-tommy)" text="text-tommy" align="right" />
        </div>

        {v.finishTarget != null && (
          <div className="mt-3 pt-2 border-t border-line/50">
            <div className="flex items-center justify-between font-term text-sm">
              <span className="text-dim">
                {v.complete
                  ? '🏁 COMPLETE'
                  : v.mode === 'challenge'
                    ? `PERIOD ${Math.min(v.periodIndex + 1, v.totalPeriods)} / ${v.totalPeriods}`
                    : 'TO GOAL'}
              </span>
              <span className="text-gold">{money(v.you)} / {money(v.finishTarget)}</span>
            </div>
            <div className="hud h-3 mt-1 p-[2px]">
              <div className="bar-fill h-full" style={{ width: `${v.periodPct}%`, background: 'var(--color-gold)' }} />
            </div>
          </div>
        )}
      </Panel>

      {/* The gap */}
      <Panel className="py-4">
        <div className="text-center font-term text-dim uppercase tracking-widest text-sm">The Gap</div>
        <div className="mt-2">
          <GapColumn name={v.idealLabel} gap={v.gapIdeal} tone="text-tommy" />
        </div>
        <p className="mt-3 text-center font-term text-base">
          {v.status === 'ahead' ? (
            <span className="text-save">▲ Ahead of pace — keep stacking.</span>
          ) : (
            <span className="text-danger">▼ Behind pace — {money(Math.abs(v.gapIdeal))} to catch up.</span>
          )}
        </p>
      </Panel>

      {/* Taunt */}
      <Panel className="flex items-center gap-3">
        <Sprite who="tommy" stage={3} px={4} flip />
        <p className="font-term text-tommy text-lg leading-tight">
          <span className="text-dim">{v.idealLabel}:</span> “{taunt(v)}”
        </p>
      </Panel>

      {/* Log a save */}
      <Panel accent="save" title="LOG A SAVE">
        {v.complete ? (
          <p className="font-term text-lg text-save">
            🏁 Goal complete — {money(v.you)} banked. Deploy a new one from the Library.
          </p>
        ) : (
          <>
            <button className="btn btn-save w-full flex items-center justify-between" onClick={doLogToday}>
              <span>✓ {v.todayTargetLabel}</span>
              <span>SAVE {money(v.todayTarget)}</span>
            </button>
            <div className="font-term text-dim text-sm mt-1 text-center">
              {v.mode === 'challenge'
                ? `This ${v.paceWord}’s challenge amount`
                : `${money(v.perDeposit)} per ${v.paceWord} keeps you on pace`}
              {v.savedToday > 0 && <span className="text-save"> · saved {money(v.savedToday)} today</span>}
            </div>

            {addOpen ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="font-pixel text-[12px] text-save">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  min={0}
                  step={1}
                  value={addStr}
                  onChange={(e) => setAddStr(e.target.value)}
                  className="bg-night border-3 border-ink px-2 py-1 flex-1 font-pixel text-[11px] text-save text-center"
                  style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
                />
                <PixelButton variant="save" onClick={doAdd}>ADD</PixelButton>
                <PixelButton onClick={() => { setAddOpen(false); setAddStr('') }}>✕</PixelButton>
              </div>
            ) : (
              <PixelButton className="w-full mt-2" onClick={() => setAddOpen(true)}>
                + ADD ANY AMOUNT
              </PixelButton>
            )}
            {last && (
              <button className="btn w-full mt-2 text-dim" onClick={doUndo}>
                ↩ UNDO LAST SAVE (−{money(last.amount)})
              </button>
            )}
          </>
        )}
      </Panel>

      {/* Quick stats → full stats screen */}
      <button className="block w-full text-left" onClick={() => go('savingsStats')}>
        <Panel title="PROGRESS">
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="SAVED" value={money(v.you)} tone="text-save" />
            <MiniStat label="STREAK" value={`${v.streak}🔥`} tone="text-gold" />
            <MiniStat label="DAYS IN" value={`${v.daysSaved}`} tone="text-cyan" />
          </div>
          <div className="font-term text-dim text-sm text-center mt-2">Tap for stats & reports →</div>
        </Panel>
      </button>
    </>
  )
}

function Fighter({
  who,
  stage,
  name,
  amount,
  tone,
  caption,
  flip,
}: {
  who: 'hero' | 'rival' | 'tommy'
  stage: number
  name: string
  amount: number
  tone: string
  caption: string
  flip?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <Sprite who={who} stage={stage} px={6} className={who === 'hero' ? 'anim-bob' : 'anim-bob-fast'} flip={flip} />
      <div className={`font-pixel text-[8px] mt-2 ${tone} truncate max-w-full`}>{name}</div>
      <div className={`font-pixel text-[10px] ${tone}`}>{money(amount)}</div>
      <div className="font-term text-dim text-[11px] leading-tight text-center">{caption}</div>
    </div>
  )
}

function SaveBar({
  label,
  value,
  max,
  fill,
  text,
  align = 'left',
}: {
  label: string
  value: number
  max: number
  fill: string
  text: string
  align?: 'left' | 'right'
}) {
  const pct = max <= 0 ? 0 : Math.max(2, Math.min(100, (value / max) * 100))
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className={`font-pixel text-[8px] ${text}`}>{label}</span>
        <span className="font-pixel text-[10px]">{money(value)}</span>
      </div>
      <div className="hud h-4 mt-1 p-[2px]">
        <div className="bar-fill h-full" style={{ width: `${pct}%`, background: fill, marginLeft: align === 'right' ? 'auto' : undefined }} />
      </div>
    </div>
  )
}

function GapColumn({ name, gap, tone }: { name: string; gap: number; tone: string }) {
  const ahead = gap >= 0
  return (
    <div className="text-center">
      <div className={`font-pixel text-[9px] ${tone}`}>{name}</div>
      <div
        className={`font-pixel text-[32px] leading-none mt-1 ${ahead ? 'text-save' : 'text-danger'}`}
        style={{ textShadow: '0 2px 0 rgba(0,0,0,0.6)' }}
      >
        {ahead ? '+' : '−'}
        {money(Math.abs(gap)).slice(1)}
      </div>
      <div className="font-pixel text-[7px] mt-1 text-dim">{ahead ? 'AHEAD' : 'BEHIND'}</div>
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <div className={`font-pixel text-[12px] ${tone}`}>{value}</div>
      <div className="font-term text-dim text-xs uppercase tracking-wide">{label}</div>
    </div>
  )
}
