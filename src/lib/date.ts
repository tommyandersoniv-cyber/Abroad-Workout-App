// Local-calendar date helpers. Days are identified by a "YYYY-MM-DD" key in
// the phone's local time zone; weeks run Sunday → Saturday.

export type DayKey = string

export function dateKey(d: Date): DayKey {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Sunday that starts the week containing `d`. */
export function weekStart(d: Date): Date {
  return addDays(d, -d.getDay())
}

/** The 7 day keys (Sun → Sat) of the week containing `d`. */
export function weekKeys(d: Date): DayKey[] {
  const start = weekStart(d)
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)))
}

/** Every day key in the month containing `d`. */
export function monthKeys(d: Date): DayKey[] {
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => dateKey(new Date(d.getFullYear(), d.getMonth(), i + 1)))
}

/** Shift a period anchor by `n` weeks or months. */
export function shiftPeriod(d: Date, mode: 'week' | 'month', n: number): Date {
  return mode === 'week' ? addDays(d, 7 * n) : new Date(d.getFullYear(), d.getMonth() + n, 1)
}

/** True when the period containing `d` is the current one or later. */
export function isCurrentOrFuture(d: Date, mode: 'week' | 'month', now: Date): boolean {
  if (mode === 'week') return weekStart(d).getTime() >= weekStart(now).getTime()
  return d.getFullYear() * 12 + d.getMonth() >= now.getFullYear() * 12 + now.getMonth()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function periodLabel(d: Date, mode: 'week' | 'month', now: Date): string {
  if (mode === 'month') {
    const sameYear = d.getFullYear() === now.getFullYear()
    return MONTHS_LONG[d.getMonth()] + (sameYear ? '' : ` ${d.getFullYear()}`)
  }
  const s = weekStart(d)
  if (s.getTime() === weekStart(now).getTime()) return 'This Week'
  if (s.getTime() === addDays(weekStart(now), -7).getTime()) return 'Last Week'
  const e = addDays(s, 6)
  const left = `${MONTHS[s.getMonth()]} ${s.getDate()}`
  const right = s.getMonth() === e.getMonth() ? `${e.getDate()}` : `${MONTHS[e.getMonth()]} ${e.getDate()}`
  return `${left}–${right}`
}

export function longDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function greeting(d: Date): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** "HH:MM" → minutes after midnight. */
export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`
}

export function formatSecs(s: number): string {
  const sec = Math.max(0, Math.round(s))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}
