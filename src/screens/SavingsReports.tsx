import { useMemo, useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { useSavingsStore, selectSavingsView } from '../store/useSavingsStore'
import { useNav } from '../store/useNav'
import { savedSince, challengeRivalTotal, targetRivalTotal, money } from '../savings'
import { CHALLENGE_BY_ID } from '../seed/challenges'
import { startOfWeek, endOfWeek, startOfMonth, startOfYear, endOfMonth, endOfYear } from '../engine/time'

type Period = 'week' | 'month' | 'year'
const TABS: { id: Period; label: string }[] = [
  { id: 'week', label: 'WEEKLY' },
  { id: 'month', label: 'MONTHLY' },
  { id: 'year', label: 'YEARLY' },
]

function periodStartOf(p: Period, ms: number): number {
  return p === 'week' ? startOfWeek(ms) : p === 'month' ? startOfMonth(ms) : startOfYear(ms)
}
function nextBoundary(p: Period, ms: number): number {
  return p === 'week' ? endOfWeek(ms) : p === 'month' ? endOfMonth(ms) : endOfYear(ms)
}

export function SavingsReports() {
  const s = useSavingsStore()
  const go = useNav((n) => n.go)
  const v = selectSavingsView(s)
  const [tab, setTab] = useState<Period>('week')
  const [index, setIndex] = useState<number | null>(null) // null → latest

  if (!v) {
    return (
      <div className="p-3 space-y-3 anim-rise">
        <Panel accent="save" title="SAVINGS REPORTS">
          <p className="font-term text-dim text-base">Deploy a goal first — reports need some saving history.</p>
        </Panel>
        <PixelButton variant="save" className="w-full" onClick={() => go('savingsLibrary')}>📚 LIBRARY →</PixelButton>
      </div>
    )
  }

  const goal = v.goal
  const ch = goal.mode === 'challenge' ? CHALLENGE_BY_ID[goal.challengeId ?? ''] : null
  const idealAt = (t: number) =>
    goal.mode === 'challenge'
      ? ch ? challengeRivalTotal(ch, goal.startMs, t) : 0
      : targetRivalTotal(goal.totalAmount, goal.pace ?? 'monthly', goal.startMs, goal.deadlineMs ?? t, t)

  // Build the list of periods from the goal's start to now.
  const periods = useMemo(() => {
    const out: { a: number; b: number }[] = []
    let a = periodStartOf(tab, goal.startMs)
    let guard = 0
    while (a <= v.now && guard++ < 800) {
      out.push({ a, b: nextBoundary(tab, a) })
      a = nextBoundary(tab, a)
    }
    return out.length ? out : [{ a: periodStartOf(tab, goal.startMs), b: nextBoundary(tab, goal.startMs) }]
  }, [tab, goal.startMs, v.now])

  const count = periods.length
  const cur = index == null ? count : Math.min(count, Math.max(1, index))
  const win = periods[cur - 1]
  const bClamp = Math.min(win.b, v.now)
  const complete = v.now >= win.b

  const saved = savedSince(s.contributions, win.a, bClamp)
  const idealGain = idealAt(bClamp) - idealAt(win.a)
  const maxGain = Math.max(1, saved, idealGain)
  const ahead = saved >= idealGain
  const inWindow = [...s.contributions].filter((c) => c.at >= win.a && c.at < bClamp).sort((a, b) => b.at - a.at)

  const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="save" title="📊 SAVINGS REPORTS">
        <div className="grid grid-cols-3 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`btn text-[8px] ${tab === t.id ? 'btn-save' : ''}`}
              onClick={() => { setTab(t.id); setIndex(null) }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <button className="btn text-[8px]" disabled={cur <= 1} onClick={() => setIndex(cur - 1)}>◀</button>
          <div className="text-center">
            <div className="font-pixel text-[10px] text-save">{tab.toUpperCase()} {cur}</div>
            <div className="font-term text-dim text-sm">{fmt(win.a)} – {fmt(bClamp - 1)}</div>
          </div>
          <button className="btn text-[8px]" disabled={cur >= count} onClick={() => setIndex(cur + 1)}>▶</button>
        </div>
      </Panel>

      <Panel className="text-center py-4">
        <div className="font-term text-dim uppercase tracking-widest text-sm">Saved this {tab}</div>
        <div className="font-pixel text-[30px] leading-none mt-2 text-save">{money(saved)}</div>
        {!complete && <div className="font-pixel text-[7px] text-gold mt-1">IN PROGRESS</div>}
        <div className={`mt-2 font-term text-base ${ahead ? 'text-save' : 'text-danger'}`}>
          {ahead ? '▲' : '▼'} {ahead ? '+' : '−'}{money(Math.abs(saved - idealGain)).slice(1)} vs {v.idealLabel} pace
        </div>
      </Panel>

      <Panel accent="save" title="SAVED vs PACE THIS PERIOD">
        <GainBar label="YOU" value={saved} max={maxGain} color="var(--color-save)" />
        <GainBar label={v.idealLabel} value={idealGain} max={maxGain} color="var(--color-tommy)" />
      </Panel>

      <Panel title="SAVES THIS PERIOD">
        {inWindow.length === 0 ? (
          <p className="font-term text-dim">No saves logged in this {tab}.</p>
        ) : (
          <div className="space-y-1">
            {inWindow.map((c) => (
              <div key={c.id} className="flex justify-between font-term text-base">
                <span className="text-dim">{new Date(c.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span className="text-save">+{money(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel accent={ahead ? 'save' : 'rival'}>
        <p className={`font-term text-lg leading-snug ${ahead ? 'text-save' : 'text-danger'}`}>
          {ahead
            ? '✓ Ahead of the pace this period — the gap is yours. Keep stacking.'
            : '✗ Behind the pace this period. A couple of catch-up deposits closes it.'}
        </p>
      </Panel>

      <button className="btn w-full" onClick={() => go('savingsStats')}>← BACK TO STATS</button>
    </div>
  )
}

function GainBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between font-term text-base">
        <span>{label}</span>
        <span className="font-pixel text-[9px]">{money(value)}</span>
      </div>
      <div className="hud h-4 mt-1 p-[2px]">
        <div className="bar-fill h-full" style={{ width: `${(Math.max(0, value) / max) * 100}%`, background: color }} />
      </div>
    </div>
  )
}
