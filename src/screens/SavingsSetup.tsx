import { useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { useSavingsStore } from '../store/useSavingsStore'
import { useNav } from '../store/useNav'
import { useFx } from '../store/useFx'
import { money, deadlineFrom, targetDeposits, targetPerDeposit, PACE_WORD, type Pace } from '../savings'

type Unit = 'weeks' | 'months' | 'years'
const UNITS: { id: Unit; label: string }[] = [
  { id: 'weeks', label: 'WEEKS' },
  { id: 'months', label: 'MONTHS' },
  { id: 'years', label: 'YEARS' },
]
const PACES: { id: Pace; label: string }[] = [
  { id: 'daily', label: 'DAILY' },
  { id: 'weekly', label: 'WEEKLY' },
  { id: 'biweekly', label: 'BI-WEEKLY' },
  { id: 'monthly', label: 'MONTHLY' },
]

export function SavingsSetup() {
  const s = useSavingsStore()
  const go = useNav((n) => n.go)
  const param = useNav((n) => n.param)
  const g = s.goal
  const editing = param === 'edit' && !!g && g.mode === 'target'
  const src = editing ? g : null

  const [name, setName] = useState(src?.name ?? '')
  const [total, setTotal] = useState(src && src.totalAmount ? String(src.totalAmount) : '')
  const [num, setNum] = useState(src ? String(approxMonths(src.startMs, src.deadlineMs)) : '12')
  const [unit, setUnit] = useState<Unit>('months')
  const [pace, setPace] = useState<Pace>(src?.pace ?? 'monthly')

  const totalNum = parseFloat(total) || 0
  const numNum = parseInt(num) || 0
  const valid = totalNum > 0 && numNum > 0

  // Live preview off the current clock.
  const start = s.now()
  const deadline = deadlineFrom(start, numNum || 1, unit)
  const deposits = valid ? targetDeposits(pace, start, deadline) : 0
  const per = valid ? targetPerDeposit(totalNum, pace, start, deadline) : 0

  function save() {
    if (!valid) return
    const input = { name, mode: 'target' as const, totalAmount: totalNum, timeframeNum: numNum, timeframeUnit: unit, pace }
    if (editing) s.configureGoal(input)
    else s.deployGoal(input)
    useFx.getState().say(editing ? 'Target updated 💰' : 'Target deployed — go save!')
    go('savings')
  }

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="save" title={editing ? 'EDIT CUSTOM TARGET' : 'CUSTOM TARGET'} className="crt">
        <p className="font-term text-dim text-base">
          Set a total to save and a deadline, then pick your pace. You’ll race a perfect-discipline
          version of you who deposits on schedule. No penalties — your money only ever goes up.
        </p>
      </Panel>

      <Panel accent="save" title="WHAT ARE YOU SAVING FOR?">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          placeholder="e.g. Japan Trip, Emergency Fund"
          className="bg-night border-3 border-ink px-2 py-2 font-pixel text-[11px] text-save text-center w-full placeholder:text-dim/60"
          style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
        />
      </Panel>

      <Panel accent="save" title="I WANT TO SAVE A TOTAL OF">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[16px] text-save">$</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            value={total}
            placeholder="5000"
            onChange={(e) => setTotal(e.target.value)}
            className="bg-night border-3 border-ink px-2 py-2 font-pixel text-[13px] text-save text-center flex-1 placeholder:text-dim/50"
            style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
          />
        </div>
      </Panel>

      <Panel title="WITHIN">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={num}
            onChange={(e) => setNum(e.target.value)}
            className="bg-night border-3 border-ink px-2 py-2 font-pixel text-[13px] text-ink-text text-center w-20"
            style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
          />
          <div className="grid grid-cols-3 gap-1 flex-1">
            {UNITS.map((u) => (
              <button key={u.id} className={`btn text-[8px] ${unit === u.id ? 'btn-save' : ''}`} onClick={() => setUnit(u.id)}>
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="SAVING PACE">
        <div className="grid grid-cols-2 gap-2">
          {PACES.map((p) => (
            <button key={p.id} className={`btn ${pace === p.id ? 'btn-save' : ''}`} onClick={() => setPace(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </Panel>

      {/* Live plan preview */}
      <Panel accent="save" title="YOUR PLAN">
        {valid ? (
          <div className="text-center">
            <div className="font-pixel text-[16px] text-save">{money(per)}<span className="text-dim text-[10px]"> / {PACE_WORD[pace]}</span></div>
            <div className="font-term text-dim text-base mt-1">
              {deposits} deposit{deposits === 1 ? '' : 's'} to reach {money(totalNum)} in {numNum} {unit}
            </div>
          </div>
        ) : (
          <p className="font-term text-dim text-base text-center">Enter a total and a timeframe to see your pace.</p>
        )}
      </Panel>

      <PixelButton variant="save" className="w-full" disabled={!valid} onClick={save}>
        {editing ? '✓ SAVE CHANGES' : '🚀 DEPLOY TARGET'}
      </PixelButton>

      {editing && (
        <button
          className="btn w-full text-danger"
          onClick={() => {
            if (confirm('Start over? This wipes this goal and all logged savings.')) {
              s.clearGoal()
              go('savings')
            }
          }}
        >
          ↺ START OVER (wipes savings)
        </button>
      )}

      <button className="btn w-full" onClick={() => go('savingsLibrary')}>
        ← BACK TO LIBRARY
      </button>
    </div>
  )
}

/** Rough months between two timestamps, for prefilling the edit form. */
function approxMonths(startMs: number, deadlineMs: number | null): number {
  if (deadlineMs == null) return 12
  return Math.max(1, Math.round((deadlineMs - startMs) / (30 * 86_400_000)))
}
