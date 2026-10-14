// Short, warm lines shown after every log. Never about what's left undone.

export const ENCOURAGEMENTS = [
  'That counts. Nice work.',
  'One more brick in the wall.',
  'You showed up. That’s the whole game.',
  'Look at you go.',
  'Small reps, big change.',
  'Future you says thanks.',
  'Every bit adds up.',
  'Proud of you for that one.',
  'Consistency over intensity. You’re doing it.',
  'Keep stacking these.',
  'That’s how habits get built.',
  'Good. Breathe it in.',
  'You kept a promise to yourself.',
  'Momentum is on your side.',
  'Progress, not perfection.',
  'Steady wins.',
  'Another step forward.',
  'You’re becoming the person who does this.',
]

let last = -1
export function encouragement(rand: () => number = Math.random): string {
  let i = Math.floor(rand() * ENCOURAGEMENTS.length)
  if (i === last) i = (i + 1) % ENCOURAGEMENTS.length
  last = i
  return ENCOURAGEMENTS[i]
}
