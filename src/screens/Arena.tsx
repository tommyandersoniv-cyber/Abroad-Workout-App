import { useMemo } from 'react'
import { Sprite } from '../components/Sprite'
import { Panel, XPBar } from '../components/ui'
import { useTick } from '../hooks/useNow'
import {
  selectMaxXP,
  selectPlayerXP,
  selectRivalXP,
  selectYmmotXP,
  selectGapTrend,
  selectGapDeltaToday,
  useGameStore,
} from '../store/useGameStore'
import { useNav } from '../store/useNav'
import { levelFor, tierForGap, combinedGap, TIER_NAMES } from '../engine/levels'
import { daysBetween } from '../engine/time'
import { pickTaunt } from '../seed/rival'
import { buildTodayModel } from '../lib/today'
import { ConsistencyTracker } from '../components/ConsistencyTracker'
import type { GapState } from '../seed/rival'

export function Arena() {
  useTick(1000) // live rival climb
  const s = useGameStore()
  const go = useNav((n) => n.go)

  const you = selectPlayerXP(s)
  const tommy = selectRivalXP(s) // 90% locked-in
  const ymmot = selectYmmotXP(s) // 70% human-achievable
  const max = selectMaxXP(s)
  const { delta7 } = selectGapTrend(s)

  // The two gaps (you − each rival) and how each moved today.
  const gapT = you - tommy
  const gapY = you - ymmot
  const deltas = selectGapDeltaToday(s)
  const day = daysBetween(s.startMs, s.now()) + 1 // Day 1, 2, 3 … since sign-up

  // ME's evolution tier reflects BOTH rivals (gap to their 80% midpoint).
  // Tier words apply only to ME; the rivals carry fixed identities.
  const meStage = tierForGap(combinedGap(you, ymmot, tommy))
  const YMMOT_STAGE = 2 // "Mr. Consistent" — steady
  const TOMMY_STAGE = 3 // "LOCKED-IN!" — maxed

  const stateFor = (g: number): GapState => (Math.abs(g) < 15 ? 'close' : g >= 0 ? 'behind' : 'ahead')
  const tommyTaunt = useMemo(
    () => pickTaunt(s.rival.personality, stateFor(gapT), Math.round(tommy)),
    [s.rival.personality, gapT, Math.round(tommy / 25)],
  )
  const ymmotTaunt = useMemo(
    () => pickTaunt('stoic', stateFor(gapY), Math.round(ymmot)),
    [gapY, Math.round(ymmot / 25)],
  )

  const today = buildTodayModel(s.startMs, s.now(), s.log, s.deferrals, s.runCarry)

  return (
    <div className="p-3 space-y-3 anim-rise">
      {/* ── Three-way clash: ME vs YMMOT (70%) vs TOMMY (90%) ────────────── */}
      <Panel className="crt overflow-hidden">
        <div className="text-center font-pixel text-[11px] text-cyan mb-2" data-tour="day">DAY {day}</div>
        <div className="grid grid-cols-3 items-end gap-1 pt-1" data-tour="lineup">
          <Fighter who="hero" stage={meStage} name={s.playerName} xp={you} tone="text-you" caption={TIER_NAMES[meStage]} />
          <Fighter who="rival" stage={YMMOT_STAGE} name={s.ymmotName} xp={ymmot} tone="text-ymmot" caption="Mr. Consistent" />
          <Fighter who="tommy" stage={TOMMY_STAGE} name={s.rival.name} xp={tommy} tone="text-tommy" caption="LOCKED-IN!" flip />
        </div>

        <div className="text-center font-pixel text-[8px] text-gold anim-flash mt-1">— VS —</div>

        {/* three cumulative bars on a shared scale */}
        <div className="mt-3 space-y-2">
          <XPBar label={s.playerName} value={you} max={max} color="me" />
          <XPBar label={`${s.ymmotName} · 70%`} value={ymmot} max={max} color="ymmot" />
          <XPBar label={`${s.rival.name} · 90%`} value={tommy} max={max} color="tommy" align="right" />
        </div>
      </Panel>

      {/* ── The GAP — both rivals, side by side (Ymmot left · Tommy right) ── */}
      <Panel className="py-4" dataTour="gap">
        <div className="text-center font-term text-dim uppercase tracking-widest text-sm">The Gap</div>
        <div className="grid grid-cols-2 gap-3 mt-2 items-start">
          <GapColumn name={s.ymmotName} sub="70%" gap={gapY} delta={deltas.ymmot} tone="text-ymmot" />
          <GapColumn name={s.rival.name} sub="90%" gap={gapT} delta={deltas.tommy} tone="text-tommy" numberClass="text-tommy" />
        </div>
        <div className="mt-3 text-center inline-flex items-center gap-2 font-term text-base w-full justify-center">
          <span className="text-dim">7-DAY vs {s.rival.name}:</span>
          <span className={delta7 >= 0 ? 'text-you' : 'text-danger'}>
            {delta7 >= 0 ? '▲ CLOSING' : '▼ WIDENING'} {delta7 >= 0 ? '+' : ''}
            {Math.round(delta7)}
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-line/50 flex justify-center">
          <button onClick={() => go('stats')}>
            <ConsistencyTracker compact />
          </button>
        </div>
      </Panel>

      {/* ── Both rivals talk ─────────────────────────────────────────────── */}
      <button onClick={() => go('rival')} className="block w-full text-left">
        <Panel className="space-y-3">
          <div className="flex items-center gap-3">
            <Sprite who="rival" stage={YMMOT_STAGE} px={4} />
            <p className="font-term text-ymmot text-lg leading-tight">
              <span className="text-dim">{s.ymmotName}:</span> “{ymmotTaunt}”
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sprite who="tommy" stage={TOMMY_STAGE} px={4} flip />
            <p className="font-term text-tommy text-lg leading-tight">
              <span className="text-dim">{s.rival.name}:</span> “{tommyTaunt}”
            </p>
          </div>
        </Panel>
      </button>

      {/* ── Straight to Today ────────────────────────────────────────────── */}
      <button className="btn btn-you w-full" onClick={() => go('today')}>
        GO TO TODAY · {today.todayDone}/{today.todayTotal} DONE →
      </button>
    </div>
  )
}

function Fighter({
  who,
  stage,
  name,
  xp,
  tone,
  caption,
  flip,
}: {
  who: 'hero' | 'rival' | 'tommy'
  stage: number
  name: string
  xp: number
  tone: string
  caption: string
  flip?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <Sprite who={who} stage={stage} px={6} className={who === 'hero' ? 'anim-bob' : 'anim-bob-fast'} flip={flip} />
      <div className={`font-pixel text-[8px] mt-2 ${tone} truncate max-w-full`}>{name}</div>
      <div className="font-term text-dim text-xs">Lv {levelFor(xp)}</div>
      <div className={`font-term text-[11px] leading-tight text-center ${tone}`}>{caption}</div>
    </div>
  )
}

function GapColumn({
  name,
  sub,
  gap,
  delta,
  tone,
  numberClass,
}: {
  name: string
  sub: string
  gap: number
  delta: number
  tone: string
  /** force the big number's colour (Tommy is always gold); else ahead→tone, behind→red */
  numberClass?: string
}) {
  const ahead = gap >= 0
  const numColor = numberClass ?? (ahead ? tone : 'text-danger')
  const gained = Math.round(delta) >= 0
  return (
    <div className="text-center">
      <div className={`font-pixel text-[9px] ${tone}`}>{name}</div>
      <div className="font-term text-dim text-xs">{sub}</div>
      {/* big gap number with the day's change pinned to its upper-right (half size) */}
      <div className="relative inline-block mt-1">
        <div
          className={`font-pixel text-[26px] leading-none ${numColor}`}
          style={{ textShadow: '0 2px 0 rgba(0,0,0,0.6)' }}
        >
          {ahead ? '+' : '−'}
          {Math.abs(Math.round(gap)).toLocaleString()}
        </div>
        <span
          className={`absolute left-full bottom-full ml-0.5 font-pixel text-[13px] leading-none whitespace-nowrap ${gained ? 'text-you' : 'text-danger'}`}
          title="change today"
        >
          {gained ? '+' : '−'}
          {Math.abs(Math.round(delta)).toLocaleString()}
        </span>
      </div>
      <div className="font-pixel text-[7px] mt-1 text-dim">{ahead ? 'AHEAD' : 'BEHIND'}</div>
    </div>
  )
}

