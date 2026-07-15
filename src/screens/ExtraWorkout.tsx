import { Panel, PixelButton } from '../components/ui'
import { PixelMedia } from '../components/PixelMedia'
import { WORKOUTS } from '../seed/workouts'
import { EXERCISE_BY_ID } from '../seed/exercises'
import { useNav } from '../store/useNav'
import type { Workout } from '../engine/types'

const TYPE_ICON: Record<Workout['type'], string> = {
  calisthenics: '🤸',
  mobility: '🧘',
  hiit: '🔥',
  mitt: '🥊',
  rest: '😴',
}

/** Total counted/timed items across a workout — a quick "size" for the card. */
function moveCount(w: Workout): number {
  return w.blocks.reduce((n, b) => n + b.items.length, 0)
}

export function ExtraWorkout() {
  const go = useNav((n) => n.go)
  const variant = useNav((n) => n.variant)
  const param = useNav((n) => n.param)
  // 'swap' = choosing a replacement for the day's assigned workout (+5, counts
  // as the daily workout); otherwise this is the extra-workout picker (+5 bonus).
  // In swap mode `param` is the workout being swapped *from* — exclude it.
  const isSwap = variant === 'swap'
  const list = WORKOUTS.filter(
    (w) => w.id !== 'morning-stretch' && !(isSwap && w.id === param),
  )

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="gold" title={isSwap ? 'SWITCH WORKOUT' : 'EXTRA WORKOUT · +5'}>
        <p className="font-term text-dim text-base">
          {isSwap ? (
            <>
              Pick a replacement for today’s assigned workout. It still counts as your daily workout —
              no penalty, streak intact — but most swaps bank{' '}
              <span className="text-gold">+5 instead of +10</span>. Full-intensity sessions like Muay
              Thai keep the <span className="text-gold">full +10</span>.
            </>
          ) : (
            <>
              Pick any session and run it guided. Banking it logs a <span className="text-gold">+5 extra</span> —
              uncapped upside above the rival ceiling, no penalty if you skip.
            </>
          )}
        </p>
      </Panel>

      <div className="space-y-2">
        {list.map((w) => {
          const firstEx = EXERCISE_BY_ID[w.blocks[0]?.items[0]?.exerciseId]
          const firstSeed = firstEx?.spriteSeed ?? 1
          return (
            <button
              key={w.id}
              className="w-full text-left"
              onClick={() => go('player', w.id, isSwap ? 'swap' : 'extra')}
            >
              <Panel className="flex items-center gap-3 py-2">
                <PixelMedia seed={firstSeed} photoUrl={firstEx?.photoUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-term text-lg leading-tight truncate">
                    {TYPE_ICON[w.type]} {w.name}
                  </div>
                  <div className="font-term text-dim text-sm capitalize">
                    {w.type} · {moveCount(w)} moves
                  </div>
                </div>
                <span className="font-pixel text-[8px] text-gold">
                  +{isSwap && w.fullCreditSwap ? 10 : 5} ▶
                </span>
              </Panel>
            </button>
          )
        })}
      </div>

      <PixelButton className="w-full" onClick={() => go('today')}>
        ← BACK
      </PixelButton>
    </div>
  )
}
