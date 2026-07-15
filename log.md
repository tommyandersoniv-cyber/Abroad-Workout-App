# Log

Append-only. Never edit past entries — add a new one.

## 2026-07-03 decision | Full-app review + remediation

Whole-app review (architecture, bugs, security, dead code, decision conflicts).
A 6-agent parallel review fleet was launched but died mid-run on the org's monthly
spend limit, so the review was completed inline. Findings (all fixed unless noted):

**Bugs**
1. `selectGapHistory` keyed days with UTC `toISOString()` while everything else uses
   local `dateKey()` — for UTC+ timezones every heatmap/graph day was off by one.
2. Systemic raw-millisecond day/week stepping (`+= MS_DAY` etc.) in the engine ledger,
   history selectors, reports, reflection scoring, today-model keys, and savings
   schedules. On the 25-hour DST fall-back day the iterator visits the same day twice:
   `resolveMisses` emitted duplicate miss penalties, `maxXP` double-counted, and
   `endOfDay` came an hour early. Fixed with a DST-safe `addDays()` in engine/time.
3. SavingsArena's SAVE button had no already-saved guard — a double-tap banked the
   period amount twice (the Today-screen quick-save DID guard: inconsistent). Guard
   moved into the store (`logToday`) so every caller is covered.
4. Quick-save "done" window used the calendar week for weekly AND biweekly challenges;
   challenge periods are goal-start-anchored, and biweekly spans 14 days — so week 2
   of a paycheck period re-offered the full amount. New `challengePeriodStart` /
   `paceIntervalStart` helpers fix both.

**Decision conflicts**
5. README says "difficulty tiers are retired — benchmarks fixed at 70%/90%", but the
   code still shipped `Difficulty`, `HOLD_FRACTION`, adaptive-rival math,
   `setDifficulty`, and a `'relentless'` seed. Removed — the later decision wins.
6. Demo-clock actions (`advanceClock`, `skipToTonight`, `advanceWeek`) had no UI since
   v1.1 dropped the demo controls. Removed; `demoOffsetMs` field stays (savings shares
   the clock through it).

**Dead code** — `selectTommyXP`, `eachDay`, `clamp`, `daysInMonth`, `daysInYear`,
re-exports from useGameStore/lib-today. All removed after zero-hit usage greps.

**Hygiene/security** — tsbuildinfo untracked + gitignored; baseline security headers
added to public/_headers and netlify.toml (kept in sync); `useGameStore.init()` now
guards corrupt persisted shapes like the savings store does.

**Flagged, NOT changed (user decisions)**
- Signup collects DOB into localStorage but nothing ever reads it — drop the field or
  use it (unused plaintext PII).
- `* copy.md` template files at repo root look like accidental duplicates.
- `addMonths` doesn't actually clamp month-end days (Jan 31 + 1mo → Mar 3) despite its
  comment — only matters for month-end goal starts; left as-is.
- Repo folder is "Abroad Workout App"; product is RIVAL.

Result: 56/56 tests green (15 new), clean build, verified live in the browser.
Note: an unrelated in-flight uncommitted feature (exercise photos — photoUrl,
public/images/) was present in the working tree throughout; untouched.

## 2026-07-15 feature | 12-hour grace period

Built per contract.md (G1–G12, all passing). Design decisions of note:

1. `inGraceWindow`/`graceDateKey` are pure engine helpers (`src/engine/time.ts`),
   no `Date.now()`.
2. New `graceLog(activityId, key?)` store action handles habits/workout/calls:
   strips a matching `miss:${id}:${key}` entry on complete, and — critically —
   re-adds it (same id/xp/`at`) on undo, because `resolveMisses`'s watermark has
   already advanced past yesterday's deadline and will never regenerate a miss
   on its own. This was the crux of the feature; a naive toggle reuse
   (`toggleActivity`/`toggleScheduled`) would either double-count (miss +
   completion coexisting) or let an undo silently erase a penalty for good.
3. `run` deliberately bypasses `graceLog` — `logRun(miles, key)` already clears
   a same-key miss as a side effect of its "remove any prior entry" filter, so
   no new run-specific code was needed. No toggle-off for run in grace either,
   matching the live Today screen (RunRow has never had one).
4. UI placement changed mid-session: the user asked for it off Today.tsx and
   onto the existing left-side drawer menu instead of a collapsed section.
   Landed as a new `Grace.tsx` screen (nav id `'grace'`), reusing
   `buildTodayModel(startMs, addDays(now, -1), ...)` — literally "yesterday, as
   if it were today" — rather than building a parallel model. The drawer item
   itself is gated on `inGraceWindow(s.now())`, disappearing entirely past noon.
5. Extra workouts and anything older than yesterday are explicitly out of
   scope (bonus/repeatable items are never due/missed; the window is yesterday
   only).

Verified live: toggling a grace item on/off round-trips exactly (ME 0 → +10 →
−15, matching the activity's xp and missPenalty); pushing the demo clock past
noon (via localStorage `demoOffsetMs`, since the old demo-clock UI controls
were removed in a prior session) makes the GRACE drawer item vanish, and
pulling it back before noon brings it back.

84/84 tests green (12 new: `time.test.ts`, `ledger.test.ts`,
`lib/today.test.ts`, `store/graceLog.test.ts`), clean build. Uncommitted per
rule (commit only when asked).

## 2026-07-15 feature | Muay Thai workout, full-credit swap

Small, proportional addition — no contract.md gate for this one. Added a
`muay-thai` workout (`src/seed/workouts.ts`: warmup + 6 new striking
conditioning moves in `seed/exercises.ts` + cooldown) alongside a new
`fullCreditSwap?: boolean` field on `Workout` (`engine/types.ts`). Swapping
the assigned workout for one has always banked a reduced +5 (`WorkoutPlayer`'s
`bankAndExit`/done-screen xp calc was hardcoded to 5 for every swap); that
logic now reads `workout.fullCreditSwap` and banks the full +10 when set.
Muay Thai is the only workout with the flag set so far — any future
full-intensity session can opt in the same way. `ExtraWorkout.tsx`'s picker
badge and copy updated to reflect which swaps keep full credit.

Verified live: swapped today's assigned Calisthenics session for Muay Thai,
ran it through to done — "SESSION CLEAR! Full intensity, full credit. +10 XP"
— and confirmed ME's XP and the Assigned Workout row both landed on +10, not
the usual swap +5. 84/84 tests still green, clean build.
