import { useNow } from '../hooks'
import { dateKey, greeting, longDate } from '../lib/date'
import { intentionFor } from '../lib/dimensions'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { Card, PillButton, ThemeToggle } from '../components/ui'
import { PhotoButton } from '../components/PhotoButton'

/** The reflection home page, mirroring the Lovable design. */
export function Today() {
  const now = useNow()
  const today = dateKey(now)
  const name = useStore((s) => s.settings.name)
  const reflections = useStore((s) => s.reflections)
  const open = useUi((s) => s.open)
  const intention = intentionFor(today, reflections)
  const reflected = (reflections[today]?.length ?? 0) > 0

  return (
    <div className="px-4 pt-safe pb-28 anim-rise">
      <header className="flex items-start justify-between pt-6">
        <div>
          <div className="text-muted text-[15px]">{longDate(now)}</div>
          <h1 className="font-serif text-[32px] leading-tight font-bold mt-1">
            {greeting(now)}, {name}
          </h1>
        </div>
        <div className="-mr-2 text-muted"><ThemeToggle /></div>
      </header>

      <Card className="mt-8 p-6">
        <div className="text-[12px] tracking-[0.14em] uppercase text-muted">Today’s intention</div>
        <h2 className="font-serif text-[26px] font-bold mt-3">{intention.name}</h2>
        <p className="text-muted text-[17px] mt-3 leading-relaxed">{intention.desc}</p>
        <p className="text-faint text-[15px] mt-4 leading-relaxed">Try: {intention.ideas.join(' / ')}</p>
        <div className="mt-5">
          <PhotoButton day={today} dimension={intention.id} />
        </div>
      </Card>

      <PillButton className="w-full mt-8" onClick={() => open({ kind: 'reflect' })}>
        {reflected ? 'Review Your Day' : 'Log Your Day'}
      </PillButton>
    </div>
  )
}
