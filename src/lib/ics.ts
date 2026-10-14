// Builds an iCalendar file of daily repeating reminders with an alert at the
// start of each. Times are "floating" (no time zone), so 7:30 stays 7:30 local
// wherever the phone is.

import { dateKey } from './date'
import { reminders, type Settings } from './habits'

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Fold lines longer than 75 octets, per RFC 5545. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let cur = ''
  let curLen = 0
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length
    const limit = out.length === 0 ? 75 : 74
    if (curLen + len > limit) {
      out.push(cur)
      cur = ''
      curLen = 0
    }
    cur += ch
    curLen += len
  }
  out.push(cur)
  return out.join('\r\n ')
}

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildIcs(s: Settings, today: Date, now: Date = new Date()): string {
  const day = dateKey(today).replace(/-/g, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Full Day//Daily habits//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Full Day',
  ]
  for (const r of reminders(s)) {
    const [h, m] = r.time.split(':')
    const start = `${day}T${h}${m}00`
    lines.push(
      'BEGIN:VEVENT',
      `UID:fullday-${r.id}@fullday.app`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${start}`,
      'DURATION:PT10M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(r.title)}`,
      'DESCRIPTION:Open Full Day. Any amount counts.',
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(r.title)}`,
      'TRIGGER:PT0S',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
