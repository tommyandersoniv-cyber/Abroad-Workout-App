import { useEffect, useState } from 'react'

/** Current time, re-rendering every `ms` (and when the app comes back into view). */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, ms)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [ms])
  return now
}

/**
 * A pausable clock measured from wall-clock timestamps, so it stays accurate
 * even if iOS throttles timers while the screen is busy.
 */
export function useClock() {
  const [base, setBase] = useState(0) // seconds banked before the current run
  const [since, setSince] = useState<number | null>(null) // ms the current run started
  const [, force] = useState(0)

  useEffect(() => {
    if (since === null) return
    const id = setInterval(() => force((x) => x + 1), 200)
    return () => clearInterval(id)
  }, [since])

  const elapsed = base + (since === null ? 0 : (Date.now() - since) / 1000)
  return {
    elapsed,
    running: since !== null,
    start: () => setSince(Date.now()),
    pause: () => {
      if (since === null) return
      setBase((b) => b + (Date.now() - since) / 1000)
      setSince(null)
    },
    /** Jump to an absolute elapsed time, keeping the running state. */
    seek: (secs: number) => {
      setBase(secs)
      setSince((s) => (s === null ? null : Date.now()))
    },
  }
}
