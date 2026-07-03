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
