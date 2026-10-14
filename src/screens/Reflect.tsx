import { useState } from 'react'
import { dateKey } from '../lib/date'
import { DIMENSIONS, reflectionLine } from '../lib/dimensions'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { BackButton, Card, PillButton, Sheet } from '../components/ui'
import { PhotoButton } from '../components/PhotoButton'

export function Reflect() {
  const [day] = useState(() => dateKey(new Date()))
  const lived = useStore((s) => s.reflections[day] ?? [])
  const toggle = useStore((s) => s.toggleDimension)
  const close = useUi((s) => () => s.open(null))
  const [step, setStep] = useState<'checkin' | 'summary'>(lived.length ? 'summary' : 'checkin')

  if (step === 'summary') {
    const untouched = DIMENSIONS.filter((d) => !lived.includes(d.id))
    const pct = Math.round((lived.length / DIMENSIONS.length) * 100)
    return (
      <Sheet>
        <BackButton onClick={() => setStep('checkin')} label="Edit" />
        <h1 className="font-serif text-[30px] font-bold mt-3">Your day in progress</h1>
        <div className="grid grid-cols-2 gap-3 mt-7">
          {DIMENSIONS.map((d) => {
            const on = lived.includes(d.id)
            return (
              <div
                key={d.id}
                className={`rounded-2xl border py-5 text-center text-[17px] ${on ? 'bg-ink text-on-ink border-ink' : 'border-line text-muted'}`}
              >
                {d.name}
              </div>
            )
          })}
        </div>
        <div className="text-center mt-10">
          <div className="font-serif text-[48px] font-bold leading-none anim-pop">{pct}%</div>
          <p className="italic text-muted text-[17px] mt-4 px-6 leading-relaxed">{reflectionLine(lived.length)}</p>
        </div>
        {untouched.length > 0 && (
          <>
            <h2 className="text-muted text-[16px] mt-10 mb-3">You haven’t touched these today</h2>
            <div className="space-y-3">
              {untouched.map((d) => (
                <Card key={d.id} className="p-5">
                  <div className="text-[19px] font-medium">{d.name}</div>
                  <p className="text-muted text-[16px] mt-1 leading-relaxed">{d.desc}</p>
                  <ul className="mt-3 space-y-2 text-muted text-[15px]">
                    {d.ideas.map((x) => (
                      <li key={x} className="flex gap-2"><span aria-hidden>·</span>{x}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </>
        )}
        <PillButton className="w-full mt-8 mb-8" onClick={close}>Done</PillButton>
      </Sheet>
    )
  }

  return (
    <Sheet>
      <BackButton onClick={close} />
      <h1 className="font-serif text-[26px] font-bold mt-3 text-center">Which dimensions did you live today?</h1>
      <div className="space-y-3 mt-7 pb-32">
        {DIMENSIONS.map((d) => {
          const on = lived.includes(d.id)
          return (
            <div
              key={d.id}
              role="checkbox"
              aria-checked={on}
              tabIndex={0}
              onClick={() => toggle(day, d.id)}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && toggle(day, d.id)}
              className={`rounded-2xl border p-5 transition cursor-pointer ${on ? 'border-ink border-2 bg-surface' : 'border-line bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[20px] font-medium">{d.name}</div>
                {on && <span className="text-[12px] tracking-[0.12em] uppercase text-accent">Lived</span>}
              </div>
              <p className="text-muted text-[17px] mt-2 leading-relaxed">{d.desc}</p>
              <div className="flex items-end gap-3 mt-3">
                <p className="text-faint text-[14px] flex-1 leading-relaxed">e.g. {d.ideas.join(' / ')}</p>
                <PhotoButton day={day} dimension={d.id} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 pb-safe bg-gradient-to-t from-bg via-bg to-transparent pt-6">
        <div className="mx-auto max-w-md px-4 pb-4">
          <PillButton className="w-full" onClick={() => setStep('summary')}>See My Day</PillButton>
        </div>
      </div>
    </Sheet>
  )
}
