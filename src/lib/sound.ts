// Tiny synthesized chime/bell cues for countdown timers. Uses the Web Audio API
// (no asset files), and respects the global sound setting (♪ toggle). The audio
// context is created lazily and resumed on first play — which always follows a
// user gesture (tapping START / opening a session), satisfying autoplay rules.

import { useGameStore } from '../store/useGameStore'

let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function enabled(): boolean {
  return !!useGameStore.getState().settings.sound
}

// A single bell-like tone with a quick attack and exponential decay.
function tone(c: AudioContext, freq: number, at: number, dur: number, peak: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

/** A two-note rising chime played when a countdown begins. */
export function playTimerStart() {
  if (!enabled()) return
  const c = audioCtx()
  if (!c) return
  const t = c.currentTime
  tone(c, 660, t, 0.18, 0.16) // E5
  tone(c, 988, t + 0.11, 0.32, 0.16) // B5
}

/**
 * A short bell tick for each of the final seconds of a countdown. The last
 * tick (the final second) rings higher and longer so the end is unmistakable.
 */
export function playTimerTick(final = false) {
  if (!enabled()) return
  const c = audioCtx()
  if (!c) return
  const t = c.currentTime
  tone(c, final ? 1319 : 880, t, final ? 0.4 : 0.13, 0.2) // E6 vs A5
}
