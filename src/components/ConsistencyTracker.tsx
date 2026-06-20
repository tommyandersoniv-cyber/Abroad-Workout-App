// Daily consistency tracker — a streak + GitHub-style heatmap of every day you
// beat BOTH rivals (Ymmot 70% and Tommy 90%). The carrot for the "no finish line".
import { Panel } from './ui'
import { computeConsistency, toWeekGrid, type DayMark } from '../lib/consistency'
import { selectGapHistory, useGameStore } from '../store/useGameStore'

const ROWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function ConsistencyTracker({ compact = false }: { compact?: boolean }) {
  const s = useGameStore()
  // Whole tracked history (clamps to game start). Measured vs BOTH rivals.
  const history = selectGapHistory(s, 120)
  const c = computeConsistency(history)
  const grid = toWeekGrid(c.days)
  const todayKey = c.days.length ? c.days[c.days.length - 1].key : ''

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-term text-base">
        <span className="text-gold">🔥 {c.current}</span>
        <span className="text-dim">day{c.current === 1 ? '' : 's'} beating both</span>
      </div>
    )
  }

  return (
    <Panel accent="gold" title="CONSISTENCY · DAYS YOU BEAT BOTH">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Metric value={`${c.current}🔥`} label="streak vs both" color="text-gold" />
        <Metric value={`${c.best}`} label="best streak" color="text-you" />
        <Metric value={`${c.beatBoth}/${c.tracked}`} label="days beat both" color="text-ink-text" />
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
              <Cell key={di} day={day} isToday={!!day && day.key === todayKey} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 font-term text-sm text-dim">
        <span className="flex items-center gap-1"><Swatch c="var(--color-you)" /> beat both</span>
        <span className="flex items-center gap-1"><Swatch c="var(--color-gold)" /> beat {s.ymmotName}</span>
        <span className="flex items-center gap-1"><Swatch c="var(--color-danger)" /> behind both</span>
      </div>
      <div className="flex justify-between mt-1 font-term text-sm">
        <span><span className="text-ymmot">vs {s.ymmotName}:</span> {c.beatYmmot}/{c.tracked}</span>
        <span><span className="text-tommy">vs {s.rival.name}:</span> {c.beatTommy}/{c.tracked}</span>
      </div>
    </Panel>
  )
}

function Cell({ day, isToday }: { day: DayMark | null; isToday: boolean }) {
  const bg = !day
    ? 'transparent'
    : day.state === 'both'
      ? 'var(--color-you)'
      : day.state === 'one'
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
    <div className="text-center">
      <div className={`font-pixel text-[13px] ${color}`}>{value}</div>
      <div className="font-term text-dim text-xs uppercase tracking-wide leading-tight mt-0.5">{label}</div>
    </div>
  )
}

function Swatch({ c }: { c: string }) {
  return <span className="inline-block w-3 h-3" style={{ background: c, border: '1px solid var(--color-ink)' }} />
}
