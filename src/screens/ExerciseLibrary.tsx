import { useState } from 'react'
import { Panel, PixelButton } from '../components/ui'
import { PixelMedia } from '../components/PixelMedia'
import { EXERCISES } from '../seed/exercises'
import { useNav } from '../store/useNav'
import type { Exercise } from '../engine/types'

const CATEGORIES: { id: Exercise['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'main', label: 'STRENGTH' },
  { id: 'skill', label: 'SKILL' },
  { id: 'mobility', label: 'MOBILITY' },
  { id: 'stretch', label: 'STRETCH' },
  { id: 'warmup', label: 'WARMUP' },
  { id: 'cooldown', label: 'COOLDOWN' },
  { id: 'conditioning', label: 'CONDITIONING' },
]

export function ExerciseLibrary() {
  const go = useNav((n) => n.go)
  const [cat, setCat] = useState<Exercise['category'] | 'all'>('all')
  const [q, setQ] = useState('')

  const list = EXERCISES.filter(
    (e) =>
      (cat === 'all' || e.category === cat) &&
      e.name.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="p-3 space-y-3 anim-rise">
      {/* Jump straight into a guided session (same picker as Today's extra workout). */}
      <PixelButton variant="gold" className="w-full" onClick={() => go('extra')}>
        🏋 WORKOUTS
      </PixelButton>

      <Panel accent="you" title="EXERCISE LIBRARY" dataTour="library">
        <input
          placeholder="search movements…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-night border-3 border-ink px-2 py-2 font-term text-lg"
          style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
        />
        <div className="flex gap-1 overflow-x-auto no-scrollbar mt-2 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`btn text-[7px] whitespace-nowrap ${cat === c.id ? 'btn-you' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2">
        {list.map((e) => (
          <button key={e.id} onClick={() => go('exercise', e.id)} className="text-left">
            <Panel className="!p-2 h-full">
              <PixelMedia seed={e.spriteSeed} size="lg" />
              <div className="font-term text-base mt-1 leading-tight">{e.name}</div>
              <div className="font-pixel text-[6px] text-cyan uppercase mt-1">{e.category}</div>
            </Panel>
          </button>
        ))}
      </div>
      {list.length === 0 && <Panel><p className="font-term text-dim">No movements match.</p></Panel>}
    </div>
  )
}
