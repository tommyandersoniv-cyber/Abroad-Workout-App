import { Panel } from '../components/ui'
import { ACTIVITIES } from '../seed/activities'
import { WEEKLY_TEMPLATE } from '../seed/program'

export function Catalog() {
  return (
    <div className="p-3 space-y-3 anim-rise">
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

      <Panel accent="you" title="WEEKLY TEMPLATE">
        <div className="space-y-1">
          {WEEKLY_TEMPLATE.map((d) => (
            <div key={d.day} className="flex font-term text-base">
              <span className="font-pixel text-[8px] text-cyan w-12">{d.day}</span>
              <span>{d.session}</span>
            </div>
          ))}
        </div>
        <p className="font-term text-dim text-sm mt-2">
          Every day: stretch · jump rope · meditate · pray · journal. Each week: run ≥3 mi · 3 calls (2 family · 1 friend).
        </p>
      </Panel>

      <Panel title="PROGRESSION">
        <div className="font-term text-base space-y-1">
          <div><span className="font-pixel text-[8px] text-gold">BLOCK A</span> — weeks 1–4 (ramp): split + skill intro.</div>
          <div><span className="font-pixel text-[8px] text-gold">BLOCK B</span> — week 5 → continuous: advanced + skill mastery. The permanent steady state.</div>
        </div>
      </Panel>

      <Panel title="EDITING">
        <p className="font-term text-dim text-base">
          Full activity / XP / cadence / template editing is stubbed in this prototype — the values above
          are the live, single source of truth for the engine. Difficulty is editable in Rival Setup &amp; Settings.
        </p>
      </Panel>
    </div>
  )
}
