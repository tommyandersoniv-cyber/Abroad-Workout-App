import { Panel, PixelButton } from '../components/ui'
import { PixelMedia } from '../components/PixelMedia'
import { EXERCISE_BY_ID } from '../seed/exercises'
import { useNav } from '../store/useNav'
import { useFx } from '../store/useFx'

export function ExerciseDetail() {
  const param = useNav((n) => n.param)
  const go = useNav((n) => n.go)
  const say = useFx((f) => f.say)
  const ex = param ? EXERCISE_BY_ID[param] : undefined
  if (!ex) return <div className="p-4"><Panel>Unknown exercise.</Panel></div>

  const sub = ex.substitutionOfId ? EXERCISE_BY_ID[ex.substitutionOfId] : undefined

  return (
    <div className="p-3 space-y-3 anim-rise">
      <button className="font-pixel text-[8px] text-dim" onClick={() => go('library')}>← LIBRARY</button>

      <Panel className="crt">
        <PixelMedia seed={ex.spriteSeed} photoUrl={ex.photoUrl} label={ex.name} size="lg" onAdd={() => say('Media capture is stubbed in this prototype')} />
        <h1 className="font-pixel text-[12px] text-you mt-3 leading-relaxed">{ex.name}</h1>
        <div className="font-pixel text-[6px] text-cyan uppercase mt-1">{ex.category}</div>
        <p className="font-term text-lg text-dim mt-2">{ex.description}</p>
        {ex.defaultPrescription && (
          <div className="font-pixel text-[9px] text-gold mt-2">{ex.defaultPrescription}</div>
        )}
      </Panel>

      <Panel accent="you" title="HOW TO">
        <ol className="space-y-2 font-term text-lg">
          {ex.howTo.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-cyan font-pixel text-[8px] mt-1">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      </Panel>

      {ex.commonMistakes && ex.commonMistakes.length > 0 && (
        <Panel accent="rival" title="COMMON MISTAKES">
          <ul className="space-y-1 font-term text-lg">
            {ex.commonMistakes.map((m, i) => (
              <li key={i}>⚠ {m}</li>
            ))}
          </ul>
        </Panel>
      )}

      {(ex.targetMuscles?.length || ex.equipment?.length) && (
        <Panel title="TAGS">
          <div className="flex flex-wrap gap-1">
            {ex.targetMuscles?.map((t) => (
              <span key={t} className="btn !p-1.5 text-[7px]">{t}</span>
            ))}
            {ex.equipment?.map((t) => (
              <span key={t} className="btn btn-gold !p-1.5 text-[7px]">{t}</span>
            ))}
          </div>
        </Panel>
      )}

      {sub && (
        <Panel accent="gold" title="BAR-FREE SWAP">
          <button className="flex items-center gap-2" onClick={() => go('exercise', sub.id)}>
            <PixelMedia seed={sub.spriteSeed} photoUrl={sub.photoUrl} size="sm" />
            <span className="font-term text-lg">{sub.name} →</span>
          </button>
        </Panel>
      )}

      {ex.videoRef && (
        <Panel title="ONLINE REFERENCE (when connected)">
          <a
            href={ex.videoRef.url}
            target="_blank"
            rel="noreferrer"
            className="font-term text-cyan text-lg underline break-all"
          >
            ▶ {ex.videoRef.url}
          </a>
          <p className="font-term text-dim text-sm mt-1">
            Offline how-to above is the source of truth; the video is a bonus when you have signal.
          </p>
        </Panel>
      )}

      <PixelButton className="w-full" onClick={() => go('library')}>← BACK TO LIBRARY</PixelButton>
    </div>
  )
}
