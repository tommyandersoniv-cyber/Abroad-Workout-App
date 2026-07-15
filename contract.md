# Contract: 12-hour grace period for RIVAL

Started: 2026-07-15

## Goal
Let the user retroactively log yesterday's activities (habits, workout, calls,
run) during the first 12 hours of a new day (local midnight → noon), fully
reversing any `missed` penalty `resolveMisses` already applied, without
breaking the `resolveMisses` watermark invariant or double-counting.

## Design decisions (flagging before writing code)
1. `inGraceWindow(nowMs)` / `graceDateKey(nowMs)` live in `src/engine/time.ts`
   — pure, ms-in, no `Date.now()`.
2. New store action `graceLog(activityId, key?)` in `useGameStore` handles
   habits, workout, and calls. `key` defaults to
   `occurrenceKey(activity, addDays(now, -1))`; calls pass their explicit
   original occurrence key (matches the existing `CallRow` pattern, where
   `item.key` ≠ `effectiveDateKey` once an item is pushed).
   - **Complete**: strips any existing `miss:${id}:${key}` entry, appends a
     `completed` LogEntry under `key` with `+a.xp`.
   - **Undo**: removes the completed entry and re-adds the miss entry (same
     id/xp/`at` = the occurrence's original deadline) — required because
     `resolveMisses`'s watermark has already advanced past that occurrence and
     will never regenerate it on its own.
3. **Run is NOT routed through `graceLog`** — it reuses the existing
   `logRun(miles, key)`, which already keys off an explicit occurrence and
   already clears a same-key miss entry as a side effect of its "remove any
   prior entry for this key" filter. No new run-specific grace code, and no
   toggle-off (matches today's `RunRow`, which has no checkbox-uncheck for
   runs either — editing miles is the only interaction).
4. **Extra workouts are out of scope** for the grace UI — bonus/repeatable
   items are never due and never missed, and are already always loggable via
   the existing button. Matches how `lib/today.ts` and the ledger already
   exclude bonus/repeatable from every "due" list.
5. UI reuses `buildTodayModel(startMs, addDays(now, -1), log, deferrals,
   runCarry, planId)` — "yesterday, as if it were today" — the exact function
   that drives the live Today screen, clock shifted back one day. This
   inherits `weekDayItems`'s existing week-boundary behavior (a call pushed
   across a week boundary behaves the same as it already does live today —
   not something this feature fixes or regresses).
6. **Not a section on Today.tsx** — a new screen (`Grace.tsx`, nav id
   `'grace'`) reachable from the existing left-side Drawer menu (alongside
   Library / Catalog / The Eight / Settings), matching the app's existing
   pattern for secondary screens. The drawer item (and the screen itself)
   only appears while `inGraceWindow(s.now())` is true — it's absent from the
   menu entirely after noon, and the Drawer is already workout-mode-only, so
   no extra mode gating is needed. The screen lists yesterday's daily habits +
   workout (if it was a training day) + any call/run whose `effectiveDateKey`
   equals yesterday's key, with the same row components/checkbox styling and
   toggle-off as today's list, except run (see #3).

## Acceptance Criteria
- [x] G1 — `inGraceWindow(nowMs)` is true for any local time before
      12:00:00.000 and false at/after noon; tested at the 11:59:59.999 /
      12:00:00.000 boundary. ✅ `time.test.ts`.
- [x] G2 — `graceDateKey(nowMs)` returns the calendar day immediately before
      the day containing `nowMs`, correct across a DST boundary (reuses
      `addDays`, inherits its DST-safety — tested against the existing Oct
      25/26 2026 Berlin fixtures in `time.test.ts`). ✅ + spring-forward case.
- [x] G3 — Grace-completing a daily/workout/call item that has a
      `miss:${id}:${key}` entry removes that miss and adds a `completed` entry
      at full positive `xp`; net XP swing for the occurrence is exactly
      `+xp − (−missPenalty)` (the full round-trip). ✅ `graceLog.test.ts` +
      verified live (stretch toggled on → ME +10).
- [x] G4 — Calling `resolve()` again after a grace-completion does NOT
      recreate the miss for that occurrence (watermark already passed it). ✅
- [x] G5 — Toggling a grace-completion back off removes the completed entry
      AND restores the original miss entry (same negative xp, same `at` =
      original deadline) — final log state matches pre-grace state exactly.
      ✅ tested + verified live (toggled off → ME −15, exact original miss).
- [x] G6 — On/off/on toggling is idempotent: no duplicate ids, no duplicate
      miss entries; odd toggle count → completed, even → missed. ✅
- [x] G7 — `demoOffsetMs` is respected: grace checks use `realNow(state)`
      (`Date.now() + demoOffsetMs`), not `Date.now()` directly — tested by
      driving the demo clock into and out of the grace window. ✅ tested +
      verified live (demoOffsetMs pushed past noon → GRACE item vanished).
- [x] G8 — A weekly-cadence occurrence files its grace completion under the
      *week's* key (`dateKey(startOfWeek(yesterday))`), not the raw calendar
      day (tested with a synthetic weekly activity — none exist in the
      current catalog, so this is an engine/store-level test). ✅
      `ledger.test.ts`.
- [x] G9 — Excused/pushed occurrences: an item deferred away from yesterday
      does not appear in yesterday's grace list; an item deferred *into*
      yesterday from an earlier day appears once, keyed to its *original*
      occurrence key, and grace-completing it creates no duplicate entry. ✅
      `lib/today.test.ts` (weekDayItems) + `graceLog.test.ts` (explicit key).
- [x] G10 — DST-adjacent day: grace-completing "yesterday" the calendar day
      right after a DST transition resolves to the correct calendar date
      (extends the existing Oct 25/26 Berlin fixtures). ✅
- [x] G11 — The "GRACE" drawer item / `Grace.tsx` screen appears only when
      `inGraceWindow(s.now())`, and disappears entirely (menu item gone, not
      just the screen) once local time crosses noon (verified live in the
      browser). ✅ verified live in both directions.
- [x] G12 — `npm test` and `npm run build` both pass with zero regressions. ✅
      84/84 tests pass (12 new + 72 existing), clean `tsc -b && vite build`.

## Out of Scope
- Grace toggle-off for `run` (see design decision #3).
- Grace logging for `extra` (see design decision #4).
- Retroactively logging anything older than yesterday.

## Status
- [x] Contract agreed (UI placement moved from Today.tsx to a drawer-menu screen per user feedback)
- [x] Built
- [x] Checked against every criterion above
- [x] Done
