// ─────────────────────────────────────────────────────────────────────────
// Rival defaults + personality copy banks (PRD §4.8). No LLM — fixed banks,
// surfaced on the Arena when the lead grows and at evolution milestones.
// ─────────────────────────────────────────────────────────────────────────

import type { Personality, RivalConfig } from '../engine/types'

export const DEFAULT_RIVAL: RivalConfig = {
  name: 'Tommy',
  spriteId: 'tommy',
  personality: 'cocky',
}

interface CopyBank {
  /** Said when the rival is comfortably ahead. */
  ahead: string[]
  /** Said when you're ahead — grudging. */
  behind: string[]
  /** Said when it's neck-and-neck. */
  close: string[]
  /** Said at an evolution milestone. */
  evolve: string[]
}

export const TAUNTS: Record<Personality, CopyBank> = {
  cocky: {
    ahead: [
      'Already done. You?',
      "I don't take days off. Must be nice.",
      'This lead? I built it while you slept.',
      'Catch up. I dare you.',
    ],
    behind: ['Lucky week.', "Enjoy it. I'm not slowing down.", 'A blip. Watch.'],
    close: ['Cute. Stay close.', "We'll see who blinks.", 'One missed rep decides this.'],
    evolve: ['Evolved. Obviously.', 'Stronger. While you debated it.'],
  },
  stoic: {
    ahead: [
      'The work was done. That is all.',
      'I do not rest. I do not rush.',
      'Discipline is not a mood.',
      'The line only moves forward.',
    ],
    behind: ['You showed up. Good.', 'Maintain it.', 'The gap is yours, for now.'],
    close: ['Even ground. Hold it.', 'Neither ahead. Both moving.', 'Steady.'],
    evolve: ['Growth follows repetition.', 'The form changes. The habit does not.'],
  },
  hypeman: {
    ahead: [
      "LET'S GOOO — but you're behind!",
      "I'm cooking out here! Where you at?!",
      'Every. Single. Day. That\'s the move!',
      'Come ON, close that gap!',
    ],
    behind: ["OKAY you're cooking too! Respect!", 'Big week! Keep it ROLLING!', "Don't you dare coast now!"],
    close: ['NECK AND NECK baby!', 'This is the good stuff!', "Photo finish energy — let's GO!"],
    evolve: ['NEW FORM UNLOCKED!! 🔥', 'EVOLUTION! We leveling UP!'],
  },
  sarcastic: {
    ahead: [
      'Wow, the couch must be comfy.',
      'No rush. The gap loves you.',
      "I'd wait up, but, you know. I won't.",
      'Bold of you to skip that one.',
    ],
    behind: ['Look who found their shoes.', "Don't strain yourself.", 'A good week. Shocking.'],
    close: ['Tied. Thrilling.', "Try not to trip.", "Oh, it's a contest now?"],
    evolve: ['Evolved. You noticed? Cool.', 'New look. Same relentless me.'],
  },
}

export type GapState = 'ahead' | 'behind' | 'close'

/** Pick a stable taunt for the given gap state (no randomness flicker per render). */
export function pickTaunt(p: Personality, state: GapState, salt: number): string {
  const bank = TAUNTS[p][state]
  return bank[Math.abs(salt) % bank.length]
}
