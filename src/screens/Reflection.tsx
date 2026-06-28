import { useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { useNav } from '../store/useNav'
import { useGameStore } from '../store/useGameStore'
import { useReflection } from '../store/useReflection'
import { dateKey } from '../engine/time'
import { DIMENSIONS, neglectedDimension, reflectionResponse } from '../seed/reflection'

type Step = 'intention' | 'checkin' | 'summary'

export function Reflection() {
  const go = useNav((n) => n.go)
  const now = useGameStore((s) => s.now())
  const todayKey = dateKey(now)
  const byDay = useReflection((s) => s.byDay)
  const toggle = useReflection((s) => s.toggle)

  const [step, setStep] = useState<Step>('intention')
  const hit = byDay[todayKey] ?? []
  const neglected = neglectedDimension(byDay, now)

  const stepNo = step === 'intention' ? 1 : step === 'checkin' ? 2 : 3

  return (
    <div className="p-3 space-y-3 anim-rise">
      {/* header / progress — mirrors the workout player */}
      <Panel className="py-2">
        <div className="flex items-center justify-between">
          <button
            className="font-pixel text-[8px] text-dim"
            onClick={() => (step === 'intention' ? go('today') : setStep(step === 'summary' ? 'checkin' : 'intention'))}
          >
            ← {step === 'intention' ? 'QUIT' : 'BACK'}
          </button>
          <span className="font-pixel text-[8px] text-gold">REFLECTION</span>
          <span className="font-pixel text-[8px] text-dim">{stepNo}/3</span>
        </div>
      </Panel>

      {step === 'intention' && <Intention dim={neglected} onBegin={() => setStep('checkin')} />}
      {step === 'checkin' && (
        <CheckIn
          hit={hit}
          onToggle={(id) => toggle(todayKey, id)}
          onDone={() => setStep('summary')}
        />
      )}
      {step === 'summary' && <Summary hit={hit} onDone={() => go('today')} />}
    </div>
  )
}

function Intention({ dim, onBegin }: { dim: ReturnType<typeof neglectedDimension>; onBegin: () => void }) {
  return (
    <>
      <Panel accent="gold" title="MORNING INTENTION">
        <p className="font-term text-dim text-base mb-3">
          Eight dimensions make a whole day. This one’s been the quietest lately — give it a little
          attention.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{dim.icon}</span>
          <div>
            <div className="font-pixel text-[12px] text-you">{dim.name}</div>
            <div className="font-pixel text-[7px] text-cyan mt-1 uppercase">Most neglected this week</div>
          </div>
        </div>
        <p className="font-term text-lg mt-3">{dim.desc}</p>
      </Panel>

      <Panel accent="you" title="TODAY, TRY">
        <ol className="space-y-2 font-term text-lg">
          {dim.actions.map((a, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-pixel text-[9px] text-gold mt-1">{i + 1}</span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <PixelButton variant="gold" className="w-full" onClick={onBegin}>
        BEGIN CHECK-IN →
      </PixelButton>
    </>
  )
}

function CheckIn({
  hit,
  onToggle,
  onDone,
}: {
  hit: string[]
  onToggle: (id: string) => void
  onDone: () => void
}) {
  return (
    <>
      <Panel accent="you" title="DAILY CHECK-IN">
        <p className="font-term text-dim text-base">
          Tap each part of yourself you tended today. No score to beat — just an honest look.
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-2">
        {DIMENSIONS.map((d) => {
          const done = hit.includes(d.id)
          return (
            <button
              key={d.id}
              onClick={() => onToggle(d.id)}
              className={`text-left panel-tight p-2 border-3 ${done ? 'border-you bg-panel3' : 'border-line'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{d.icon}</span>
                <span className={`font-pixel text-[8px] ${done ? 'text-you' : 'text-ink-text'}`}>{d.name}</span>
                {done && <span className="ml-auto text-you font-pixel text-[8px]">✓</span>}
              </div>
              <p className="font-term text-dim text-sm mt-1 leading-snug">{d.desc}</p>
            </button>
          )
        })}
      </div>

      <PixelButton variant="gold" className="w-full" onClick={onDone}>
        DAY REFLECTED → · {hit.length}/{DIMENSIONS.length}
      </PixelButton>
    </>
  )
}

function Summary({ hit, onDone }: { hit: string[]; onDone: () => void }) {
  const pct = Math.round((hit.length / DIMENSIONS.length) * 100)
  return (
    <>
      <Panel accent="gold" className="text-center py-6">
        <div className="font-pixel text-[16px] text-gold anim-pop">DAY REFLECTED</div>
        <div className="font-pixel text-[44px] leading-none text-you mt-4 anim-pop">{pct}%</div>
        <div className="font-pixel text-[8px] text-dim mt-2">
          POTENTIAL REACHED · {hit.length}/{DIMENSIONS.length}
        </div>
        <p className="font-term text-lg mt-4 px-2">{reflectionResponse(hit.length)}</p>
      </Panel>

      <Panel title="THE EIGHT">
        <div className="grid grid-cols-4 gap-2">
          {DIMENSIONS.map((d) => {
            const done = hit.includes(d.id)
            return (
              <div key={d.id} className={`text-center ${done ? '' : 'opacity-30'}`}>
                <div className="text-2xl leading-none">{d.icon}</div>
                <div className={`font-pixel text-[6px] mt-1 ${done ? 'text-you' : 'text-dim'}`}>{d.name}</div>
              </div>
            )
          })}
        </div>
      </Panel>

      <PixelButton variant="you" className="w-full" onClick={onDone}>
        DONE
      </PixelButton>
    </>
  )
}
