import { useEffect, useMemo, useState } from 'react'
import { Panel } from '../components/ui'
import { useGameStore } from '../store/useGameStore'
import {
  type Period,
  type DayPoint,
  completedPeriods,
  periodWindow,
  meWindow,
  rivalWindow,
  series,
  monthlyTips,
  weeklyNets,
  longestBeatBothStreak,
  youAt,
} from '../lib/reports'
import { combinedGap, tierForGap, TIER_NAMES, levelFor } from '../engine/levels'

const TABS: { id: Period; label: string }[] = [
  { id: 'week', label: 'WEEKLY' },
  { id: 'month', label: 'MONTHLY' },
  { id: 'year', label: 'YEARLY' },
]

export function Reports() {
  const s = useGameStore()
  const markSeen = useGameStore((st) => st.markReportsSeen)
  const [tab, setTab] = useState<Period>('week')

  useEffect(() => {
    markSeen()
  }, [markSeen])

  const now = s.now()
  const done = completedPeriods(tab, s.startMs, now)
  const current = done + 1 // 1-based in-progress period
  const [idxByTab, setIdxByTab] = useState<Record<Period, number | null>>({ week: null, month: null, year: null })
  const index = idxByTab[tab] ?? Math.max(1, done) // default: latest completed (or current if none)

  const setIndex = (i: number) => setIdxByTab((m) => ({ ...m, [tab]: Math.min(current, Math.max(1, i)) }))

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="gold" title="REPORTS">
        <div className="grid grid-cols-3 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`btn text-[8px] ${tab === t.id ? 'btn-gold' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <button className="btn text-[8px]" disabled={index <= 1} onClick={() => setIndex(index - 1)}>◀</button>
          <div className="text-center">
            <div className="font-pixel text-[10px] text-gold">{tab.toUpperCase()} {index}</div>
            <RangeLabel period={tab} startMs={s.startMs} now={now} index={index} />
          </div>
          <button className="btn text-[8px]" disabled={index >= current} onClick={() => setIndex(index + 1)}>▶</button>
        </div>
      </Panel>

      {tab === 'week' && <WeeklyReport index={index} />}
      {tab === 'month' && <MonthlyReport index={index} />}
      {tab === 'year' && <YearlyReport index={index} />}
    </div>
  )
}

// ── Weekly: ME this week vs last week ──────────────────────────────────────
function WeeklyReport({ index }: { index: number }) {
  const s = useGameStore()
  const now = s.now()
  const { me, prev, win } = useMemo(() => {
    const w = periodWindow('week', s.startMs, now, index)
    const p = periodWindow('week', s.startMs, now, index - 1)
    return {
      win: w,
      me: meWindow(s.log, w.a, w.bClamped),
      prev: index > 1 ? meWindow(s.log, p.a, p.b) : null,
    }
  }, [s.log, s.startMs, now, index])

  const dNet = prev ? me.net - prev.net : me.net
  const pctText = prev && prev.net !== 0 ? ` (${dNet >= 0 ? '+' : ''}${Math.round((dNet / Math.abs(prev.net)) * 100)}%)` : ''

  return (
    <>
      <Panel className="text-center py-4">
        <div className="font-term text-dim uppercase tracking-widest text-sm">Net XP this week</div>
        <div className={`font-pixel text-[30px] leading-none mt-2 ${me.net >= 0 ? 'text-you' : 'text-danger'}`}>
          {me.net >= 0 ? '+' : '−'}{Math.abs(Math.round(me.net)).toLocaleString()}
        </div>
        {!win.complete && <div className="font-pixel text-[7px] text-gold mt-1">IN PROGRESS</div>}
        {prev && (
          <div className={`mt-2 font-term text-base ${dNet >= 0 ? 'text-you' : 'text-danger'}`}>
            {dNet >= 0 ? '▲' : '▼'} {dNet >= 0 ? '+' : '−'}{Math.abs(Math.round(dNet))}{pctText} vs last week
          </div>
        )}
      </Panel>

      <Panel accent="you" title="THIS WEEK vs LAST WEEK">
        <Compare label="XP earned" now={me.earned} prev={prev?.earned ?? 0} color="var(--color-you)" />
        <Compare label="Completions" now={me.requiredCompletions} prev={prev?.requiredCompletions ?? 0} color="var(--color-cyan)" />
        <Compare label="Misses" now={me.misses} prev={prev?.misses ?? 0} color="var(--color-danger)" invert />
        <Compare label="Extra workouts" now={me.extras} prev={prev?.extras ?? 0} color="var(--color-gold)" />
        <Compare label="Run miles" now={me.runMiles} prev={prev?.runMiles ?? 0} color="var(--color-ymmot)" />
      </Panel>

      <Panel title="COMPLETION RATE">
        <RateBar label="this week" rate={me.completionRate} />
        {prev && <RateBar label="last week" rate={prev.completionRate} dim />}
      </Panel>

      <Panel title="WHERE THE XP CAME FROM">
        <CatBars me={me} />
      </Panel>

      <Verdict
        good={me.net >= (prev?.net ?? 0)}
        goodText="You out-earned last week. Momentum is yours — keep stacking."
        badText="You earned less than last week. Lock the −15 items first and add an extra workout."
      />
    </>
  )
}

// ── Monthly: ME vs both rivals + tips ──────────────────────────────────────
function MonthlyReport({ index }: { index: number }) {
  const s = useGameStore()
  const now = s.now()
  const { me, rv, ser, tips, win } = useMemo(() => {
    const w = periodWindow('month', s.startMs, now, index)
    const m = meWindow(s.log, w.a, w.bClamped)
    const r = rivalWindow(s.log, s.startMs, w.a, w.b, now)
    return {
      win: w,
      me: m,
      rv: r,
      ser: series(s.log, s.startMs, w.a, w.b, now),
      tips: monthlyTips(m, r, { ymmot: s.ymmotName, tommy: s.rival.name }),
    }
  }, [s.log, s.startMs, now, index, s.ymmotName, s.rival.name])

  const maxGain = Math.max(1, me.net, rv.ymmotGain, rv.tommyGain)

  return (
    <>
      {!win.complete && <div className="text-center font-pixel text-[7px] text-gold">MONTH IN PROGRESS</div>}
      <Panel accent="gold" title="POINTS GAINED THIS MONTH">
        <GainBar label={s.playerName} value={me.net} max={maxGain} color="var(--color-you)" />
        <GainBar label={`${s.ymmotName} · 70%`} value={rv.ymmotGain} max={maxGain} color="var(--color-ymmot)" />
        <GainBar label={`${s.rival.name} · 90%`} value={rv.tommyGain} max={maxGain} color="var(--color-tommy)" />
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <GapCard name={s.ymmotName} g0={rv.gapY0} g1={rv.gapY1} tone="text-ymmot" />
        <GapCard name={s.rival.name} g0={rv.gapT0} g1={rv.gapT1} tone="text-tommy" />
      </div>

      <Panel title="DAYS FINISHED AHEAD">
        <ProgressLine label={s.ymmotName} value={rv.daysBeatY} total={rv.days} color="var(--color-ymmot)" />
        <ProgressLine label={s.rival.name} value={rv.daysBeatT} total={rv.days} color="var(--color-tommy)" />
      </Panel>

      <Panel accent="you" title="THE MONTH, DAY BY DAY">
        <Spark data={ser} />
        <Legend ymmot={s.ymmotName} tommy={s.rival.name} you={s.playerName} />
      </Panel>

      <Panel accent="rival" title="HOW TO CLOSE / WIDEN THE GAP">
        <div className="space-y-2">
          {tips.map((t, i) => (
            <TipCard key={i} kind={t.kind} text={t.text} />
          ))}
        </div>
      </Panel>
    </>
  )
}

// ── Yearly: growth over the year ───────────────────────────────────────────
function YearlyReport({ index }: { index: number }) {
  const s = useGameStore()
  const now = s.now()
  const data = useMemo(() => {
    const w = periodWindow('year', s.startMs, now, index)
    const me = meWindow(s.log, w.a, w.bClamped)
    const ser = series(s.log, s.startMs, w.a, w.b, now)
    const nets = weeklyNets(s.log, w.a, Math.min(w.b, now))
    const last = ser[ser.length - 1]
    const youStart = youAt(s.log, w.a)
    const youEnd = youAt(s.log, w.bClamped)
    return {
      win: w,
      me,
      ser,
      youStart,
      youEnd,
      growth: youEnd - youStart,
      bestWeek: nets.length ? Math.max(...nets) : 0,
      worstWeek: nets.length ? Math.min(...nets) : 0,
      streak: longestBeatBothStreak(s.log, s.startMs, w.a, w.b, now),
      tier0: tierForGap(combinedGap(ser[0]?.you ?? 0, ser[0]?.ymmot ?? 0, ser[0]?.tommy ?? 0)),
      tier1: tierForGap(combinedGap(last?.you ?? 0, last?.ymmot ?? 0, last?.tommy ?? 0)),
    }
  }, [s.log, s.startMs, now, index])

  const grew = data.growth >= 0
  return (
    <>
      <Panel className="text-center py-4">
        <div className="font-term text-dim uppercase tracking-widest text-sm">Growth this year</div>
        <div className={`font-pixel text-[30px] leading-none mt-2 ${grew ? 'text-you' : 'text-danger'}`}>
          {grew ? '+' : '−'}{Math.abs(Math.round(data.growth)).toLocaleString()}
        </div>
        <div className="font-term text-dim text-base mt-2">
          {Math.round(data.youStart).toLocaleString()} → {Math.round(data.youEnd).toLocaleString()} XP
        </div>
        {!data.win.complete && <div className="font-pixel text-[7px] text-gold mt-1">YEAR IN PROGRESS</div>}
      </Panel>

      <Panel accent="gold" title="THE YEAR, CHARTED">
        <Spark data={data.ser} tall />
        <Legend ymmot={s.ymmotName} tommy={s.rival.name} you={s.playerName} />
      </Panel>

      <Panel title="THE TALLY">
        <div className="grid grid-cols-3 gap-2">
          <Tally label="completions" value={data.me.completions} color="text-you" />
          <Tally label="misses" value={data.me.misses} color="text-danger" />
          <Tally label="run miles" value={Math.round(data.me.runMiles)} color="text-ymmot" />
          <Tally label="extra workouts" value={data.me.extras} color="text-gold" />
          <Tally label="best week" value={`${data.bestWeek >= 0 ? '+' : ''}${Math.round(data.bestWeek)}`} color="text-you" />
          <Tally label="🔥 best streak" value={data.streak} color="text-gold" />
        </div>
      </Panel>

      <Panel title="STANDING">
        <div className="flex items-center justify-center gap-3 font-pixel text-[10px]">
          <span className="text-dim">{TIER_NAMES[data.tier0]}</span>
          <span className="text-gold">→</span>
          <span className={grew ? 'text-you' : 'text-danger'}>{TIER_NAMES[data.tier1]}</span>
        </div>
        <div className="text-center font-term text-dim text-sm mt-1">Lv {levelFor(data.youEnd)}</div>
      </Panel>

      <Verdict
        good={grew}
        goodText="Real growth. The line only goes up because you kept showing up."
        badText="The line slipped this year. One disciplined month resets the trajectory."
      />
    </>
  )
}

// ── Reusable visual bits ───────────────────────────────────────────────────
function Compare({ label, now, prev, color, invert }: { label: string; now: number; prev: number; color: string; invert?: boolean }) {
  const max = Math.max(1, now, prev)
  const better = invert ? now <= prev : now >= prev
  return (
    <div className="mb-2">
      <div className="flex justify-between font-term text-base">
        <span>{label}</span>
        <span className={better ? 'text-you' : 'text-danger'}>
          {Math.round(now * 10) / 10} <span className="text-dim text-sm">vs {Math.round(prev * 10) / 10}</span>
        </span>
      </div>
      <div className="hud h-3 mt-1 p-[2px]"><div className="h-full" style={{ width: `${(now / max) * 100}%`, background: color }} /></div>
      <div className="hud h-2 mt-0.5 p-[2px] opacity-50"><div className="h-full" style={{ width: `${(prev / max) * 100}%`, background: color }} /></div>
    </div>
  )
}

function RateBar({ label, rate, dim }: { label: string; rate: number; dim?: boolean }) {
  return (
    <div className={`mb-2 ${dim ? 'opacity-60' : ''}`}>
      <div className="flex justify-between font-term text-base">
        <span>{label}</span>
        <span className={rate >= 0.95 ? 'text-you' : rate >= 0.85 ? 'text-gold' : 'text-danger'}>{Math.round(rate * 100)}%</span>
      </div>
      <div className="hud h-4 mt-1 p-[2px]">
        <div className="bar-fill h-full" style={{ width: `${rate * 100}%`, background: rate >= 0.95 ? 'var(--color-you)' : rate >= 0.85 ? 'var(--color-gold)' : 'var(--color-danger)' }} />
      </div>
    </div>
  )
}

function CatBars({ me }: { me: ReturnType<typeof meWindow> }) {
  const cats: { key: 'workout' | 'movement' | 'mind' | 'weekly'; label: string }[] = [
    { key: 'workout', label: 'Workouts' },
    { key: 'movement', label: 'Stretch / Rope' },
    { key: 'mind', label: 'Mind' },
    { key: 'weekly', label: 'Run / Calls' },
  ]
  const max = Math.max(1, ...cats.map((c) => me.byCat[c.key].earned))
  return (
    <div className="space-y-2">
      {cats.map((c) => (
        <div key={c.key}>
          <div className="flex justify-between font-term text-base">
            <span>{c.label}</span>
            <span className="text-you">+{me.byCat[c.key].earned}{me.byCat[c.key].missed > 0 && <span className="text-danger"> · {me.byCat[c.key].missed} missed</span>}</span>
          </div>
          <div className="hud h-3 mt-1 p-[2px]"><div className="h-full" style={{ width: `${(me.byCat[c.key].earned / max) * 100}%`, background: 'var(--color-you)' }} /></div>
        </div>
      ))}
    </div>
  )
}

function GainBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between font-term text-base">
        <span>{label}</span>
        <span className="font-pixel text-[9px]">{value >= 0 ? '+' : '−'}{Math.abs(Math.round(value)).toLocaleString()}</span>
      </div>
      <div className="hud h-4 mt-1 p-[2px]"><div className="bar-fill h-full" style={{ width: `${(Math.max(0, value) / max) * 100}%`, background: color }} /></div>
    </div>
  )
}

function GapCard({ name, g0, g1, tone }: { name: string; g0: number; g1: number; tone: string }) {
  const d = g1 - g0
  return (
    <Panel className="text-center !p-2">
      <div className={`font-pixel text-[8px] ${tone}`}>{name}</div>
      <div className="font-term text-dim text-sm mt-1">{Math.round(g0)} → {Math.round(g1)}</div>
      <div className={`font-pixel text-[12px] mt-1 ${d >= 0 ? 'text-you' : 'text-danger'}`}>
        {d >= 0 ? '▲+' : '▼−'}{Math.abs(Math.round(d))}
      </div>
      <div className="font-term text-dim text-xs">gap change</div>
    </Panel>
  )
}

function ProgressLine({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between font-term text-base"><span>{label}</span><span>{value}/{total} days</span></div>
      <div className="hud h-4 mt-1 p-[2px]"><div className="bar-fill h-full" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  )
}

function Tally({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-center">
      <div className={`font-pixel text-[13px] ${color}`}>{value}</div>
      <div className="font-term text-dim text-xs uppercase tracking-wide leading-tight mt-0.5">{label}</div>
    </div>
  )
}

function TipCard({ kind, text }: { kind: 'good' | 'warn' | 'lever'; text: string }) {
  const icon = kind === 'good' ? '✓' : kind === 'warn' ? '⚠' : '⚡'
  const color = kind === 'good' ? 'text-you' : kind === 'warn' ? 'text-danger' : 'text-gold'
  return (
    <div className="flex gap-2 items-start panel-tight p-2">
      <span className={`font-pixel text-[10px] ${color} mt-0.5`}>{icon}</span>
      <p className="font-term text-base leading-snug">{text}</p>
    </div>
  )
}

function Verdict({ good, goodText, badText }: { good: boolean; goodText: string; badText: string }) {
  return (
    <Panel accent={good ? 'you' : 'rival'}>
      <p className={`font-term text-lg leading-snug ${good ? 'text-you' : 'text-danger'}`}>
        {good ? '✓ ' : '✗ '}{good ? goodText : badText}
      </p>
    </Panel>
  )
}

function Spark({ data, tall }: { data: DayPoint[]; tall?: boolean }) {
  const W = 320
  const H = tall ? 130 : 90
  if (data.length < 2) return <p className="font-term text-dim">Not enough data yet.</p>
  const ymax = Math.max(1, ...data.map((d) => Math.max(d.you, d.tommy, d.ymmot))) * 1.05
  const ymin = Math.min(0, ...data.map((d) => d.you))
  const span = ymax - ymin || 1
  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (v: number) => H - ((v - ymin) / span) * H
  const line = (pick: (d: DayPoint) => number) => data.map((d, i) => `${x(i)},${y(pick(d))}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ imageRendering: 'auto' }} preserveAspectRatio="none">
      <polyline points={line((d) => d.tommy)} fill="none" stroke="var(--color-tommy)" strokeWidth={2.5} />
      <polyline points={line((d) => d.ymmot)} fill="none" stroke="var(--color-ymmot)" strokeWidth={2.5} />
      <polyline points={line((d) => d.you)} fill="none" stroke="var(--color-you)" strokeWidth={2.5} />
    </svg>
  )
}

function Legend({ you, ymmot, tommy }: { you: string; ymmot: string; tommy: string }) {
  return (
    <div className="flex justify-between font-term text-sm text-dim mt-1">
      <span><span className="text-you">▬</span> {you}</span>
      <span><span className="text-ymmot">▬</span> {ymmot}</span>
      <span><span className="text-tommy">▬</span> {tommy}</span>
    </div>
  )
}

function RangeLabel({ period, startMs, now, index }: { period: Period; startMs: number; now: number; index: number }) {
  const w = periodWindow(period, startMs, now, index)
  const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return <div className="font-term text-dim text-sm">{fmt(w.a)} – {fmt(Math.min(w.b, now) - 1)}</div>
}
