import { useEffect, useState } from 'react'

/**
 * Re-render on an interval so anything derived from the clock (the rival's
 * climbing bar, the live gap) ticks up smoothly in real time. PRD §9: 1–5s.
 */
export function useTick(ms = 1000): number {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return t
}
