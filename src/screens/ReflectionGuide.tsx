import { Panel } from '../components/ui'
import { DIMENSIONS } from '../seed/reflection'

// A reference page for the eight dimensions — the logic and philosophy behind
// them, revisitable any time from the menu. Mirrors the workout catalog layout.
export function ReflectionGuide() {
  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="gold" title="THE EIGHT DIMENSIONS">
        <p className="font-term text-dim text-base leading-snug">
          Eight dimensions of a day fully lived. No single one is the whole picture, and you’re not
          meant to hit all eight every day. The point is to notice which parts of yourself you’ve been
          feeding — and which have gone quiet. Here’s what each one means, why it earns a place, and
          what it looks like when you actually live it.
        </p>
      </Panel>

      {DIMENSIONS.map((d) => (
        <Panel key={d.id}>
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{d.icon}</span>
            <div>
              <div className="font-pixel text-[11px] text-you">{d.name}</div>
              <div className="font-term text-cyan text-sm mt-0.5">{d.desc}</div>
            </div>
          </div>
          <p className="font-term text-lg leading-snug mt-3">{d.long}</p>
        </Panel>
      ))}
    </div>
  )
}
