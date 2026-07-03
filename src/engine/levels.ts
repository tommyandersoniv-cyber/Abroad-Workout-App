// ─────────────────────────────────────────────────────────────────────────
// Progression — open-ended, "you vs yourself". The evolution TIER is dictated
// purely by the point spread (gap) between the two lines, not absolute XP.
// Read from the player's side, gap = me − rival:
//
//   gap ≥ +1000           → APEX            (you've out-worked the ghost hard)
//   −100 ≤ gap < +1000    → CONTENDER       (it's a real race)
//   −500 ≤ gap < −100     → FAILURE         (the ghost is pulling away)
//   gap <  −500           → WASTE OF SPACE  (it's a rout)
//
// The two characters read the inverse gap of one another, so when you are APEX
// your ghost-self is a WASTE OF SPACE — and the reverse when you slack.
// ─────────────────────────────────────────────────────────────────────────

export const TIER_NAMES = ['WASTE OF SPACE', 'FAILURE', 'CONTENDER', 'APEX'] as const
export const TIER_SHORT = ['WASTE', 'FAILURE', 'CONTEND', 'APEX'] as const

/** Lower gap-edge for FAILURE, CONTENDER, APEX respectively. */
export const TIER_GAP_EDGES = [-500, -100, 1000] as const

/**
 * Combined standing vs BOTH benchmarks: your gap to their midpoint (the 80%
 * line halfway between Ymmot's 50% and Tommy's 90%). ME's tier is read off this,
 * so the tier reflects both rivals at once.
 */
export function combinedGap(you: number, ymmot: number, tommy: number): number {
  return you - (ymmot + tommy) / 2
}

/** Stage 0..3 for a given gap (self − opponent). */
export function tierForGap(gap: number): number {
  if (gap >= 1000) return 3 // APEX
  if (gap >= -100) return 2 // CONTENDER
  if (gap >= -500) return 1 // FAILURE
  return 0 // WASTE OF SPACE
}

/** Level number: everyone starts at Lv 1, +1 level every 500 XP (debt floors at Lv 1). */
const XP_PER_LEVEL = 500
export function levelFor(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1)
}

/** How far (in gap points) to the next tier up, and its name. */
export function gapToNextTier(gap: number): { next: string | null; points: number } {
  if (gap >= 1000) return { next: null, points: 0 }
  if (gap >= -100) return { next: 'APEX', points: 1000 - gap }
  if (gap >= -500) return { next: 'CONTENDER', points: -100 - gap }
  return { next: 'FAILURE', points: -500 - gap }
}
