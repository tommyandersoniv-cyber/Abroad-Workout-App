// Timer sounds. They're generated as little WAV files and played through
// <audio> elements rather than Web Audio, because on iPhone Web Audio is muted
// by the ring/silent switch and is easily suspended. iOS only lets audio play
// after a tap, so unlockAudio() must run inside a button's onClick (Start);
// after that the same elements can be played by the timer later.

const RATE = 22050

/** Build a mono 16-bit WAV from a list of [frequency Hz, seconds, volume 0–1] notes. */
function wav(notes: [number, number, number][]): string {
  const total = notes.reduce((n, [, d]) => n + Math.round(d * RATE), 0)
  const buf = new ArrayBuffer(44 + total * 2)
  const v = new DataView(buf)
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF'); v.setUint32(4, 36 + total * 2, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, RATE, true); v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, total * 2, true)
  let o = 44
  for (const [freq, dur, vol] of notes) {
    const n = Math.round(dur * RATE)
    const fade = Math.min(n / 2, RATE * 0.01)
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / fade, (n - i) / fade)
      // Square-ish wave (sine + odd harmonics) cuts through a phone speaker.
      const ph = (2 * Math.PI * freq * i) / RATE
      const sample = freq ? (Math.sin(ph) + Math.sin(3 * ph) / 3 + Math.sin(5 * ph) / 5) * 0.8 : 0
      v.setInt16(o, Math.max(-1, Math.min(1, sample * vol * env)) * 32767, true)
      o += 2
    }
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

let buzzerEl: HTMLAudioElement | null = null
let beepEl: HTMLAudioElement | null = null

function elements(): HTMLAudioElement[] {
  if (!buzzerEl) {
    const pulse: [number, number, number][] = [[880, 0.22, 1], [660, 0.22, 1], [0, 0.12, 0]]
    buzzerEl = new Audio(wav([...pulse, ...pulse, ...pulse, ...pulse]))
    beepEl = new Audio(wav([[1046, 0.18, 0.9]]))
    for (const el of [buzzerEl, beepEl!]) {
      el.preload = 'auto'
      el.setAttribute('playsinline', '')
    }
  }
  return [buzzerEl, beepEl!]
}

export function unlockAudio(): void {
  try {
    // iOS 17+: treat this page's audio as playback so the silent switch doesn't mute it.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
    for (const el of elements()) {
      el.muted = true
      el.play()
        .then(() => {
          el.pause()
          el.currentTime = 0
          el.muted = false
        })
        .catch(() => {
          el.muted = false
        })
    }
  } catch {
    /* sound is a nice-to-have */
  }
}

function play(el: HTMLAudioElement | null) {
  if (!el) return
  try {
    el.muted = false
    el.currentTime = 0
    void el.play().catch(() => {})
  } catch {
    /* ignore */
  }
}

/** End-of-timer buzzer: four two-tone pulses (~2.2s). */
export function buzzer(): void {
  play(elements()[0])
}

/** Short beep between stretches. */
export function beep(): void {
  play(elements()[1])
}
