// weekDayItems' deferral handling is what the grace screen's "yesterday only"
// filter relies on (G9): a pushed item must show under its effective day and
// original occurrence key, and nowhere else.
import { describe, expect, it } from 'vitest'
import { weekDayItems } from './today'
import { addDays, dateKey, startOfWeek } from '../engine/time'

describe('weekDayItems — pushed occurrences (grace G9 support)', () => {
  const startMs = new Date(2026, 6, 1).getTime()
  const monday = startOfWeek(new Date(2026, 6, 15).getTime()) // week of Jul 13–19, 2026
  const tueKey = dateKey(addDays(monday, 1)) // Tue — a scheduled call day
  const wedKey = dateKey(addDays(monday, 2)) // Wed — where it gets pushed to

  it("a call pushed forward appears only under its effective day, keyed to its original day", () => {
    const deferrals = { [`call@${tueKey}`]: wedKey }
    const items = weekDayItems(startMs, monday, [], deferrals)

    // Wed also happens to be a scheduled run day, so scope to the call itself.
    const dueWed = items.filter((i) => i.effectiveDateKey === wedKey && i.activity.id === 'call')
    expect(dueWed).toHaveLength(1)
    expect(dueWed[0].key).toBe(tueKey) // filed under the ORIGINAL key
    expect(dueWed[0].pushed).toBe(true)

    const dueTue = items.filter((i) => i.effectiveDateKey === tueKey && i.activity.id === 'call')
    expect(dueTue).toHaveLength(0) // not also shown on its original day
  })

  it('an un-pushed call appears once, under its own day', () => {
    const items = weekDayItems(startMs, monday, [], {})
    const dueTue = items.filter((i) => i.effectiveDateKey === tueKey && i.activity.id === 'call')
    expect(dueTue).toHaveLength(1)
    expect(dueTue[0].key).toBe(tueKey)
    expect(dueTue[0].pushed).toBe(false)
  })
})
