// Builds the "what's due" model shared by the Arena and Today screens.
import { ACTIVITIES, ACTIVITY_BY_ID } from '../seed/activities'
import { sessionFor, blockForWeek } from '../seed/program'
import { CALL_DAYS, RUN_WEEKDAYS, callPerson, type CallList } from '../seed/social'
import { occurrenceKey } from '../engine/ledger'
import { weekIndex, weekday, startOfWeek, startOfDay, dateKey, MS_DAY } from '../engine/time'
import type { Activity, LogEntry, Weekday } from '../engine/types'

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface DueItem {
  activity: Activity
  done: boolean
  value: number
  key: string
}

/** A day-pinned call or run, with its person and (possibly pushed) display day. */
export interface DayItem {
  activity: Activity
  key: string // original occurrence dateKey (its identity)
  weekday: Weekday
  dayLabel: string
  effectiveDateKey: string // where it currently shows (after any push)
  pushed: boolean
  done: boolean
  value: number // run miles, if logged
  person?: string
  list?: CallList
  targetMiles?: number // run: 1 + any carried miles from pushed earlier runs
}

export interface TodayModel {
  weekNumber: number
  weekday: Weekday
  block: 'A' | 'B'
  session: ReturnType<typeof sessionFor>
  isTrainingDay: boolean
  daily: DueItem[]
  workout: DueItem | null
  /** this week's calls + run, each pinned to a day */
  dayItems: DayItem[]
  /** count of obligations due *today* and how many are done */
  todayDone: number
  todayTotal: number
}

function findLog(log: LogEntry[], activityId: string, key: string): LogEntry | undefined {
  return log.find(
    (e) => e.activityId === activityId && e.dateKey === key && e.status === 'completed',
  )
}

/** This week's day-pinned calls (2 family + 1 friend) and runs (1 mi × 3 days). */
export function weekDayItems(
  startMs: number,
  now: number,
  log: LogEntry[],
  deferrals: Record<string, string>,
  runCarry: Record<string, number> = {},
): DayItem[] {
  const weekMon = startOfWeek(now)
  const wkNumber = weekIndex(startMs, now) + 1
  const startDay = startOfDay(startMs) // don't surface days before sign-up
  const items: DayItem[] = []

  for (const cd of CALL_DAYS) {
    const dayMs = weekMon + cd.weekday * MS_DAY
    if (dayMs < startDay) continue
    const key = dateKey(dayMs)
    const comp = `call@${key}`
    items.push({
      activity: ACTIVITY_BY_ID.call,
      key,
      weekday: cd.weekday,
      dayLabel: WD[cd.weekday],
      effectiveDateKey: deferrals[comp] ?? key,
      pushed: !!deferrals[comp],
      done: !!findLog(log, 'call', key),
      value: 0,
      person: callPerson(wkNumber, cd.list, cd.slot),
      list: cd.list,
    })
  }

  for (const wd of RUN_WEEKDAYS) {
    const dayMs = weekMon + wd * MS_DAY
    if (dayMs < startDay) continue
    const key = dateKey(dayMs)
    if (deferrals[`run@${key}`]) continue // pushed → its mile carried to a later run day
    const rentry = findLog(log, 'run', key)
    items.push({
      activity: ACTIVITY_BY_ID.run,
      key,
      weekday: wd,
      dayLabel: WD[wd],
      effectiveDateKey: key,
      pushed: false,
      done: !!rentry,
      value: rentry?.value ?? 0,
      targetMiles: 1 + (runCarry[key] ?? 0),
    })
  }

  return items.sort((a, b) => a.weekday - b.weekday)
}

export function buildTodayModel(
  startMs: number,
  now: number,
  log: LogEntry[],
  deferrals: Record<string, string> = {},
  runCarry: Record<string, number> = {},
): TodayModel {
  const wkNumber = weekIndex(startMs, now) + 1
  const wd = weekday(now)
  const session = sessionFor(wkNumber, wd)

  const due = (a: Activity): DueItem => {
    const key = occurrenceKey(a, now)
    const entry = findLog(log, a.id, key)
    return { activity: a, done: !!entry, value: entry?.value ?? 0, key }
  }

  const daily = ['stretch', 'jumprope', 'meditate', 'pray', 'journal'].map((id) =>
    due(ACTIVITY_BY_ID[id]),
  )
  const workout = session.workoutId ? due(ACTIVITY_BY_ID.workout) : null
  const dayItems = weekDayItems(startMs, now, log, deferrals, runCarry)

  // Today's obligations = workout + daily habits + any call/run landing today.
  const todayKey = dateKey(now)
  const dueToday = dayItems.filter((i) => i.effectiveDateKey === todayKey)
  const base = [...daily, ...(workout ? [workout] : [])]
  const todayTotal = base.length + dueToday.length
  const todayDone = base.filter((i) => i.done).length + dueToday.filter((i) => i.done).length

  return {
    weekNumber: wkNumber,
    weekday: wd,
    block: blockForWeek(wkNumber),
    session,
    isTrainingDay: !!session.workoutId,
    daily,
    workout,
    dayItems,
    todayDone,
    todayTotal,
  }
}

export const ALL_ACTIVITIES = ACTIVITIES
export { startOfWeek }
