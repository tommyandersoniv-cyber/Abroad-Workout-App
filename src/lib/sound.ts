// Synthesized sounds via Web Audio (no audio files). iOS only allows audio
// after a tap, so call unlockAudio() from a button's onClick before timing.

let ctx: AudioContext | null = null

export function unlockAudio(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    // A silent blip fully unlocks output on iOS.
    tone(0, 0.01, 440, 'sine', 0)
  } catch {
    ctx = null
  }
}

function tone(at: number, dur: number, freq: number, type: OscillatorType, vol: number) {
  if (!ctx) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0001), t + 0.01)
  gain.gain.setValueAtTime(Math.max(vol, 0.0001), t + dur - 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** End-of-timer buzzer: three loud pulses. */
export function buzzer(): void {
  for (let i = 0; i < 3; i++) tone(i * 0.45, 0.32, 180, 'square', 0.35)
}

/** Short beep between stretches. */
export function beep(): void {
  tone(0, 0.15, 880, 'sine', 0.3)
}
