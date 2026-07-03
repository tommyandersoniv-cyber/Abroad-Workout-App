import { Panel, PixelButton, Stat } from '../components/ui'
import { Sprite } from '../components/Sprite'
import { ConsistencyTracker } from '../components/ConsistencyTracker'
import { useTick } from '../hooks/useNow'
import { useNav } from '../store/useNav'
import {
  selectGapHistory,
  selectMaxXP,
  selectPlayerXP,
  selectRivalXP,
  selectYmmotXP,
  selectPendingReports,
  useGameStore,
  type GapSample,
} from '../store/useGameStore'
import { levelFor, tierForGap, combinedGap, gapToNextTier, TIER_NAMES, TIER_GAP_EDGES } from '../engine/levels'
import { ACTIVITY_BY_ID } from '../seed/activities'
import { startOfDay, MS_DAY } from '../engine/time'

export function Stats() {
  useTick(1000)
  const s = useGameStore()
  const go = useNav((n) => n.go)
  const pending = selectPendingReports(s).any
  const you = selectPlayerXP(s)
  const tommy = selectRivalXP(s)
  const ymmot = selectYmmotXP(s)
  const max = selectMaxXP(s)
  const gapY = you - ymmot
  const gapT = you - tommy
  // ME's tier reflects BOTH rivals (gap to their 80% midpoint).
  const combined = combinedGap(you, ymmot, tommy)
  const stage = tierForGap(combined)
  const nextTier = gapToNextTier(combined)

  const history = selectGapHistory(s, 21)
  const streak = computeStreak(s)

  const misses = s.log
    .filter((e) => e.status === 'missed')
    .sort((a, b) => b.at - a.at)
    .slice(0, 8)
  const runs = s.log
    .filter((e) => e.activityId === 'run' && e.status === 'completed')
    .sort((a, b) => b.at - a.at)
    .slice(0, 6)

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel title="CUMULATIVE LEDGER">
        <div className="grid grid-cols-3 gap-2">
          <Stat label={s.playerName} value={Math.round(you).toLocaleString()} color="text-you" />
          <Stat label={`${s.ymmotName} 50%`} value={Math.round(ymmot).toLocaleString()} color="text-ymmot" />
          <Stat label={`${s.rival.name} 90%`} value={Math.round(tommy).toLocaleString()} color="text-tommy" />
        </div>
        <div className="mt-2 pt-2 border-t border-line/50 grid grid-cols-2 gap-2 text-center font-term text-base">
          <div>
            <span className="text-dim">vs {s.ymmotName}: </span>
            <span className={gapY >= 0 ? 'text-ymmot' : 'text-danger'}>
              {gapY >= 0 ? '+' : '−'}{Math.abs(Math.round(gapY)).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-dim">vs {s.rival.name}: </span>
            <span className={gapT >= 0 ? 'text-tommy' : 'text-danger'}>
              {gapT >= 0 ? '+' : '−'}{Math.abs(Math.round(gapT)).toLocaleString()}
            </span>
          </div>
        </div>
      </Panel>

      {/* Daily consistency tracker */}
      <ConsistencyTracker />

      {/* Gap history graph — all three lines */}
      <Panel accent="gold" title="LEDGER HISTORY · 21 DAYS" dataTour="stats">
        <GapGraph data={history} max={max} />
        <div className="flex justify-between font-term text-sm text-dim mt-1">
          <span><span className="text-you">▬</span> {s.playerName}</span>
          <span><span className="text-ymmot">▬</span> {s.ymmotName}</span>
          <span><span className="text-tommy">▬</span> {s.rival.name}</span>
        </div>
      </Panel>

      {/* Evolution — ME's tier, dictated by the gap vs BOTH rivals */}
      <Panel title={`EVOLUTION · ${s.playerName} vs BOTH`}>
        <div className="flex items-center gap-3">
          <Sprite who="hero" stage={stage} px={6} className="anim-bob" />
          <div className="flex-1">
            <div className={`font-pixel text-[10px] ${combined >= 0 ? 'text-you' : 'text-danger'}`}>
              {TIER_NAMES[stage]} · Lv {levelFor(you)}
            </div>
            <div className="font-term text-dim text-sm mt-1">
              {nextTier.next
                ? `${Math.round(nextTier.points)} pts to ${nextTier.next}`
                : 'APEX — keep widening the lead.'}
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-3">
          {TIER_NAMES.map((n, i) => (
            <div key={n} className={`text-center flex-1 ${i === stage ? '' : 'opacity-40'}`}>
              <Sprite who="hero" stage={i} px={3} className="mx-auto" />
              <div className={`font-pixel text-[6px] mt-1 ${i === stage ? 'text-gold' : ''}`}>{n.split(' ')[0]}</div>
              <div className="font-term text-dim text-xs">
                {i === 0 ? '<-500' : i === 3 ? '+1000' : `${TIER_GAP_EDGES[i - 1]}`}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Panel title="WORKOUT STREAK"><Stat label="no-miss days" value={`${streak}🔥`} color="text-gold" /></Panel>
        <Panel title="MAX POSSIBLE"><Stat label="ceiling" value={Math.round(max).toLocaleString()} color="text-dim" /></Panel>
      </div>

      {/* Run log */}
      <Panel accent="you" title="RUN LOG">
        {runs.length === 0 ? (
          <p className="font-term text-dim">No runs banked yet.</p>
        ) : (
          <div className="space-y-1">
            {runs.map((r) => (
              <div key={r.id} className="flex justify-between font-term text-base">
                <span>👟 {new Date(r.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{r.value} mi</span>
                <span className="text-you">+{r.xp}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Miss log */}
      <Panel accent="rival" title="MISS LOG">
        {misses.length === 0 ? (
          <p className="font-term text-dim">Spotless. The rival hates that.</p>
        ) : (
          <div className="space-y-1">
            {misses.map((m) => (
              <div key={m.id} className="flex justify-between font-term text-base">
                <span>{ACTIVITY_BY_ID[m.activityId]?.icon} {ACTIVITY_BY_ID[m.activityId]?.name}</span>
                <span className="text-dim">{new Date(m.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span className="text-danger">{m.xp}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <PixelButton variant="gold" className="w-full flex items-center justify-center gap-2" onClick={() => go('reports')}>
        📊 REPORTS
        {pending && <span className="font-pixel text-[7px]">● NEW</span>}
      </PixelButton>
    </div>
  )
}

function GapGraph({ data, max }: { data: GapSample[]; max: number }) {
  const W = 320
  const H = 120
  if (data.length < 2) return <p className="font-term text-dim">Not enough history yet.</p>
  const ymax = Math.max(max, ...data.map((d) => Math.max(d.you, d.tommy, d.ymmot))) * 1.05
  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (v: number) => H - (v / ymax) * H
  const line = (pick: (d: GapSample) => number) => data.map((d, i) => `${x(i)},${y(pick(d))}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ imageRendering: 'auto' }} preserveAspectRatio="none">
      <polyline points={line((d) => d.tommy)} fill="none" stroke="var(--color-tommy)" strokeWidth={2.5} />
      <polyline points={line((d) => d.ymmot)} fill="none" stroke="var(--color-ymmot)" strokeWidth={2.5} />
      <polyline points={line((d) => d.you)} fill="none" stroke="var(--color-you)" strokeWidth={2.5} />
    </svg>
  )
}

function computeStreak(s: ReturnType<typeof useGameStore.getState>): number {
  // Consecutive past days (and today) with no missed −15 item.
  const now = s.now()
  const missedDays = new Set(
    s.log.filter((e) => e.status === 'missed' && e.xp <= -15).map((e) => e.dateKey),
  )
  let streak = 0
  for (let d = startOfDay(now); d >= startOfDay(s.startMs); d -= MS_DAY) {
    // Every day has stretch + jump rope (−15 items), so every day is countable.
    const dt = new Date(d)
    const localKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    if (missedDays.has(localKey)) break
    streak++
  }
  return streak
}
