import { Panel, PixelButton, Stat } from '../components/ui'
import { useTick } from '../hooks/useNow'
import {
  useSavingsStore,
  selectSavingsView,
  selectSavingsHistory,
  selectLifetimeSaved,
  type SavingsHistorySample,
} from '../store/useSavingsStore'
import { useNav } from '../store/useNav'
import { money } from '../savings'
import { computeConsistency, toWeekGrid, type DayMark } from '../lib/consistency'

const ROWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function SavingsStats() {
  useTick(1000)
  const s = useSavingsStore()
  const go = useNav((n) => n.go)
  const v = selectSavingsView(s)

  if (!v) {
    return (
      <div className="p-3 space-y-3 anim-rise">
        <Panel accent="save" title="SAVINGS STATS">
          <p className="font-term text-dim text-base">No goal deployed yet — pick one from the Library to start tracking.</p>
        </Panel>
        <PixelButton variant="save" className="w-full" onClick={() => go('savingsLibrary')}>
          📚 BROWSE THE LIBRARY →
        </PixelButton>
      </div>
    )
  }

  const history = selectSavingsHistory(s, 21)
  // Map savings lines onto the consistency helper: ideal=tommy, floor=ymmot.
  const consSamples = selectSavingsHistory(s, 120).map((d) => ({
    key: d.key,
    you: d.you,
    tommy: d.ideal,
    ymmot: d.floor,
  }))
  const c = computeConsistency(consSamples)
  const grid = toWeekGrid(c.days)
  const todayKey = c.days.length ? c.days[c.days.length - 1].key : ''

  const recent = [...s.contributions].sort((a, b) => b.at - a.at).slice(0, 10)
  const single = v.floor == null
  const lifetime = selectLifetimeSaved(s)
  const archive = [...s.archive].reverse()

  return (
    <div className="p-3 space-y-3 anim-rise">
      {/* Cumulative ledger */}
      <Panel title="THE LEDGER">
        <div className={`grid ${single ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          <Stat label="YOU" value={money(v.you)} color="text-save" />
          {v.floor != null && <Stat label={v.floorLabel ?? 'FLOOR'} value={money(v.floor)} color="text-ymmot" />}
          <Stat label={v.idealLabel} value={money(v.ideal)} color="text-tommy" />
        </div>
        <div className="mt-2 pt-2 border-t border-line/50 grid grid-cols-2 gap-2 text-center font-term text-base">
          {v.gapFloor != null && (
            <div>
              <span className="text-dim">vs {v.floorLabel}: </span>
              <span className={v.gapFloor >= 0 ? 'text-save' : 'text-danger'}>
                {v.gapFloor >= 0 ? '+' : '−'}{money(Math.abs(v.gapFloor)).slice(1)}
              </span>
            </div>
          )}
          <div className={v.gapFloor != null ? '' : 'col-span-2'}>
            <span className="text-dim">vs {v.idealLabel}: </span>
            <span className={v.gapIdeal >= 0 ? 'text-tommy' : 'text-danger'}>
              {v.gapIdeal >= 0 ? '+' : '−'}{money(Math.abs(v.gapIdeal)).slice(1)}
            </span>
          </div>
        </div>
      </Panel>

      {/* Reports entry point */}
      <PixelButton variant="save" className="w-full" onClick={() => go('savingsReports')}>
        📊 SAVINGS REPORTS →
      </PixelButton>

      {/* Consistency heatmap — days you stayed ahead of the pace */}
      <Panel accent="gold" title="CONSISTENCY · DAYS AHEAD OF PACE">
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <Metric value={`${c.current}🔥`} label="streak ahead" color="text-gold" />
          <Metric value={`${c.best}`} label="best streak" color="text-save" />
          <Metric value={`${c.beatBoth}/${c.tracked}`} label="days ahead" color="text-ink-text" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex flex-col gap-[3px] pt-[2px]">
            {ROWS.map((r, i) => (
              <div key={i} className="h-[14px] font-term text-dim text-[10px] leading-[14px] w-3 text-center">
                {i % 2 === 1 ? r : ''}
              </div>
            ))}
          </div>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <Cell key={di} day={day} isToday={!!day && day.key === todayKey} single={single} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 font-term text-sm text-dim">
          <span className="flex items-center gap-1"><Swatch c="var(--color-save)" /> ahead of {single ? 'pace' : 'both'}</span>
          {!single && <span className="flex items-center gap-1"><Swatch c="var(--color-gold)" /> above floor only</span>}
          <span className="flex items-center gap-1"><Swatch c="var(--color-danger)" /> behind</span>
        </div>
      </Panel>

      {/* History graph */}
      <Panel accent="gold" title="SAVED vs PACE · 21 DAYS">
        <HistoryGraph data={history} single={single} />
        <div className="flex justify-between font-term text-sm text-dim mt-1">
          <span><span className="text-save">▬</span> YOU</span>
          {!single && <span><span className="text-ymmot">▬</span> {v.floorLabel}</span>}
          <span><span className="text-tommy">▬</span> {v.idealLabel}</span>
        </div>
      </Panel>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2">
        <Panel className="!p-2"><Stat label="this goal" value={money(v.you)} color="text-save" /></Panel>
        <Panel className="!p-2"><Stat label="lifetime" value={money(lifetime)} color="text-gold" /></Panel>
        <Panel className="!p-2"><Stat label="days saved" value={`${v.daysSaved}`} color="text-cyan" /></Panel>
      </div>

      {/* Recent saves */}
      <Panel title="RECENT SAVES">
        {recent.length === 0 ? (
          <p className="font-term text-dim">Nothing logged yet. Bank your first save in the Arena.</p>
        ) : (
          <div className="space-y-1">
            {recent.map((cn) => (
              <div key={cn.id} className="flex items-center gap-2 font-term text-base">
                <span className="text-save font-pixel text-[10px]">+{money(cn.amount)}</span>
                <span className="text-dim flex-1">{prettyDate(cn.dateKey)}</span>
                <button className="text-dim hover:text-danger px-1" title="remove" onClick={() => s.removeContribution(cn.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Past goals — savings banked from goals you've switched away from */}
      {archive.length > 0 && (
        <Panel title="PAST GOALS · BANKED">
          <div className="space-y-1">
            {archive.map((a, i) => (
              <div key={i} className="flex items-center gap-2 font-term text-base">
                <span className="text-xl">{a.icon}</span>
                <span className="flex-1 text-dim truncate">{a.name}</span>
                <span className="text-gold font-pixel text-[10px]">{money(a.saved)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <button
        className="btn w-full text-danger"
        onClick={() => {
          if (confirm('Reset ALL savings? This wipes your goal, history, and lifetime total.')) {
            s.resetSavings()
            go('savings')
          }
        }}
      >
        ↺ RESET ALL SAVINGS
      </button>
    </div>
  )
}

function HistoryGraph({ data, single }: { data: SavingsHistorySample[]; single: boolean }) {
  const W = 320
  const H = 120
  if (data.length < 2) return <p className="font-term text-dim">Not enough history yet — save a few days.</p>
  const ymax = Math.max(1, ...data.map((d) => Math.max(d.you, d.ideal, d.floor))) * 1.05
  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (val: number) => H - (val / ymax) * H
  const line = (pick: (d: SavingsHistorySample) => number) => data.map((d, i) => `${x(i)},${y(pick(d))}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ imageRendering: 'auto' }} preserveAspectRatio="none">
      <polyline points={line((d) => d.ideal)} fill="none" stroke="var(--color-tommy)" strokeWidth={2.5} />
      {!single && <polyline points={line((d) => d.floor)} fill="none" stroke="var(--color-ymmot)" strokeWidth={2.5} />}
      <polyline points={line((d) => d.you)} fill="none" stroke="var(--color-save)" strokeWidth={2.5} />
    </svg>
  )
}

function Cell({ day, isToday, single }: { day: DayMark | null; isToday: boolean; single: boolean }) {
  const bg = !day
    ? 'transparent'
    : day.state === 'both'
      ? 'var(--color-save)'
      : day.state === 'one' && !single
        ? 'var(--color-gold)'
        : 'var(--color-danger)'
  return (
    <div
      className="w-[14px] h-[14px]"
      style={{
        background: bg,
        border: day ? '1px solid var(--color-ink)' : '1px solid transparent',
        boxShadow: isToday ? '0 0 0 2px var(--color-gold)' : undefined,
        opacity: day ? 1 : 0.25,
      }}
    />
  )
}

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <div className={`font-pixel text-[13px] ${color}`}>{value}</div>
      <div className="font-term text-dim text-xs uppercase tracking-wide leading-tight mt-0.5">{label}</div>
    </div>
  )
}

function Swatch({ c }: { c: string }) {
  return <span className="inline-block w-3 h-3" style={{ background: c, border: '1px solid var(--color-ink)' }} />
}

function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
