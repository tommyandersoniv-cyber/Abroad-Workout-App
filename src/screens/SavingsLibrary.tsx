import { Panel } from '../components/ui'
import { useSavingsStore } from '../store/useSavingsStore'
import { useNav } from '../store/useNav'
import { useFx } from '../store/useFx'
import { CHALLENGES } from '../seed/challenges'
import { challengeTotal, money } from '../savings'

export function SavingsLibrary() {
  const s = useSavingsStore()
  const go = useNav((n) => n.go)
  const goal = s.goal

  const hasGoal = s.configured && !!goal
  const customActive = hasGoal && goal!.mode !== 'challenge'

  function deployChallenge(id: string, name: string, icon: string) {
    // Switching banks the current goal's savings to your lifetime total first.
    s.deployGoal({ name, mode: 'challenge', challengeId: id, icon })
    useFx.getState().say(`Deployed: ${name} 🚀`)
    go('savings')
  }

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="save" title="📚 SAVINGS LIBRARY" className="crt">
        <p className="font-term text-dim text-base">
          Deploy a challenge to race its built-in schedule, or set your own custom target. Switching
          banks your current savings to your lifetime total, then starts the new goal fresh at $0.
        </p>
      </Panel>

      {/* Custom target */}
      <button className="block w-full text-left" onClick={() => go('savingsSetup', customActive ? 'edit' : 'deploy')}>
        <Panel className={`flex items-center gap-3 ${customActive ? 'border-save' : ''}`}>
          <span className="text-3xl">🎯</span>
          <div className="flex-1">
            <div className="font-pixel text-[10px] text-save flex items-center gap-2">
              CUSTOM TARGET
              {customActive && <span className="font-pixel text-[6px] text-gold">● ACTIVE</span>}
            </div>
            <div className="font-term text-dim text-sm leading-tight">
              Set your own weekly / monthly / yearly amount and an optional floor rival.
            </div>
          </div>
          <span className="font-pixel text-[8px] text-dim">{customActive ? 'EDIT' : 'SET →'}</span>
        </Panel>
      </button>

      <div className="font-pixel text-[8px] text-dim px-1 pt-1">ESCALATING CHALLENGES</div>

      {CHALLENGES.map((ch) => {
        const active = hasGoal && goal!.mode === 'challenge' && goal!.challengeId === ch.id
        return (
          <button key={ch.id} className="block w-full text-left" onClick={() => deployChallenge(ch.id, ch.name, ch.icon)}>
            <Panel className={`flex items-center gap-3 ${active ? 'border-save' : ''}`}>
              <span className="text-3xl">{ch.icon}</span>
              <div className="flex-1">
                <div className="font-pixel text-[9px] flex items-center gap-2">
                  <span className={active ? 'text-save' : ''}>{ch.name}</span>
                  {active && <span className="font-pixel text-[6px] text-gold">● ACTIVE</span>}
                </div>
                <div className="font-term text-dim text-sm leading-tight">{ch.blurb}</div>
                <div className="font-term text-dim text-xs mt-0.5">
                  {ch.periods} {ch.cadence === 'weekly' ? 'weeks' : 'days'} · banks {money(challengeTotal(ch))}
                </div>
              </div>
              <div className="text-right">
                <div className="font-pixel text-[10px] text-gold">{money(challengeTotal(ch))}</div>
                <div className="font-pixel text-[7px] text-dim mt-1">{active ? 'ACTIVE' : 'DEPLOY →'}</div>
              </div>
            </Panel>
          </button>
        )
      })}
    </div>
  )
}
