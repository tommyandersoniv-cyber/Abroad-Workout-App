// Daily consistency tracker — measured against BOTH rivals. Each day is:
//   'both' = you beat Tommy (90%) and Ymmot (50%)   → fully ahead
//   'one'  = you beat Ymmot (50%) but not Tommy      → human zone
//   'none' = you trailed both                         → behind
// The headline streak counts consecutive recent days beating BOTH.

export type DayState = 'both' | 'one' | 'none'

export interface DayMark {
  key: string
  state: DayState
  weekday: number // 0 = Monday
}

export interface ConsistencyStats {
  days: DayMark[]
  /** consecutive most-recent days beating BOTH rivals */
  current: number
  /** longest run of beating both */
  best: number
  beatBoth: number
  beatYmmot: number
  beatTommy: number
  tracked: number
}

export function computeConsistency(
  samples: { key: string; you: number; ymmot: number; tommy: number }[],
): ConsistencyStats {
  const days: DayMark[] = samples.map((s) => {
    const [y, m, d] = s.key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const beatT = s.you > s.tommy
    const beatY = s.you > s.ymmot
    const state: DayState = beatT ? 'both' : beatY ? 'one' : 'none'
    return { key: s.key, state, weekday: (date.getDay() + 6) % 7 }
  })

  let beatBoth = 0
  let beatYmmot = 0
  let beatTommy = 0
  for (const s of samples) {
    if (s.you > s.tommy) beatTommy++
    if (s.you > s.ymmot) beatYmmot++
    if (s.you > s.tommy && s.you > s.ymmot) beatBoth++
  }

  let current = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].state === 'both') current++
    else break
  }

  let best = 0
  let run = 0
  for (const d of days) {
    if (d.state === 'both') {
      run++
      best = Math.max(best, run)
    } else run = 0
  }

  return { days, current, best, beatBoth, beatYmmot, beatTommy, tracked: days.length }
}

/** Lay the days out GitHub-style: columns = weeks (Mon→Sun rows), padded. */
export function toWeekGrid(days: DayMark[]): (DayMark | null)[][] {
  if (days.length === 0) return []
  const weeks: (DayMark | null)[][] = []
  let col: (DayMark | null)[] = new Array(days[0].weekday).fill(null)
  for (const d of days) {
    col.push(d)
    if (d.weekday === 6) {
      weeks.push(col)
      col = []
    }
  }
  if (col.length) {
    while (col.length < 7) col.push(null)
    weeks.push(col)
  }
  return weeks
}
