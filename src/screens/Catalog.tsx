import { Panel } from '../components/ui'
import { ACTIVITIES } from '../seed/activities'
import { WEEKLY_PLANS, planById } from '../seed/plans'
import { FAMILY, FRIENDS } from '../seed/social'
import { useGameStore } from '../store/useGameStore'
import { useFx } from '../store/useFx'

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Catalog() {
  const planId = useGameStore((st) => st.planId)
  const setPlan = useGameStore((st) => st.setPlan)
  const say = useFx((f) => f.say)
  const active = planById(planId)

  return (
    <div className="p-3 space-y-3 anim-rise">
      {/* ── Weekly plan picker — sets what's scheduled each day ─────────────── */}
      <Panel accent="gold" title="WEEKLY PLAN">
        <p className="font-term text-dim text-sm mb-2">
          Pick the split that drives your week. The selected plan decides which workout is scheduled on
          each day in Today &amp; the Arena.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {WEEKLY_PLANS.map((p) => {
            const selected = p.id === planId
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id === planId) return
                  setPlan(p.id)
                  say(`Plan set · ${p.name}`)
                }}
                className={`text-left panel-tight p-2 border-3 ${
                  selected ? 'border-gold bg-panel3' : 'border-line'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{p.icon}</span>
                  <span className={`font-pixel text-[8px] ${selected ? 'text-gold' : 'text-you'}`}>
                    {p.name}
                  </span>
                </div>
                <p className="font-term text-dim text-sm mt-1 leading-snug">{p.blurb}</p>
                {selected && <div className="font-pixel text-[6px] text-gold mt-1">● ACTIVE</div>}
              </button>
            )
          })}
        </div>
      </Panel>

      {/* ── The active plan's week, day by day ─────────────────────────────── */}
      <Panel accent="you" title={`THIS WEEK · ${active.name.toUpperCase()}`}>
        <div className="space-y-1">
          {active.days.map((session, i) => (
            <div key={i} className="flex font-term text-base">
              <span className="font-pixel text-[8px] text-cyan w-12">{WD[i]}</span>
              <span className={session === 'Rest' ? 'text-dim' : ''}>{session}</span>
            </div>
          ))}
        </div>
        <p className="font-term text-dim text-sm mt-2">
          Every day: stretch · jump rope · meditate · pray · journal. Each week: run ≥3 mi · 3 calls (2 family · 1 friend).
        </p>
      </Panel>

      {/* ── Weekly routines: everyone in the call rotation, by list ────────── */}
      <Panel accent="rival" title="WEEKLY ROUTINES">
        <p className="font-term text-dim text-sm mb-3">
          3 calls a week — 2 family · 1 friend, +2 each — cycling through everyone below. Plus a 1-mile run
          on 3 days. Today’s due calls and runs show on the Today screen.
        </p>

        <div className="font-pixel text-[8px] text-ymmot mb-1">📞 FAMILY</div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-3">
          {FAMILY.map((name) => (
            <span key={name} className="font-term text-base">{name}</span>
          ))}
        </div>

        <div className="font-pixel text-[8px] text-cyan mb-1">📞 FRIENDS</div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {FRIENDS.map((name) => (
            <span key={name} className="font-term text-base">{name}</span>
          ))}
        </div>
      </Panel>

      <Panel accent="gold" title="ACTIVITY CATALOG">
        <p className="font-term text-dim text-sm mb-2">
          The exact XP rules driving the ledger. A perfect week = 282; the rival banks 90% of it.
        </p>
        <div className="space-y-1">
          <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] font-pixel text-[6px] text-dim pb-1">
            <span>ACTIVITY</span><span className="text-you text-right">EARN</span><span className="text-danger text-right">MISS</span>
          </div>
          {ACTIVITIES.map((a) => (
            <div key={a.id} className="grid grid-cols-[1.6fr_0.7fr_0.7fr] items-center font-term text-base border-t border-line/40 py-1">
              <span>{a.icon} {a.name}</span>
              <span className="text-you text-right">
                +{a.xp}{a.unit === 'per_mile' ? '/mi' : ''}
              </span>
              <span className="text-danger text-right">{a.missPenalty ? `−${a.missPenalty}` : '—'}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="PROGRESSION">
        <div className="font-term text-base space-y-1">
          <div><span className="font-pixel text-[8px] text-gold">BLOCK A</span> — weeks 1–4 (ramp): split + skill intro.</div>
          <div><span className="font-pixel text-[8px] text-gold">BLOCK B</span> — week 5 → continuous: advanced + skill mastery. The permanent steady state.</div>
        </div>
      </Panel>
    </div>
  )
}
