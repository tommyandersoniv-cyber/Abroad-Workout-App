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

## 2026-10-14 decision | v2 rebuild: habit builder replaces RIVAL

Tommy wants to scrap RIVAL (too much going on) and rebuild around 7 daily
habits: jump rope, pushups, sit-ups, stretch, pray, meditate, journal, with
reminders through the day and an encouraging (never discouraging) tone.
Decided: iPhone, stay a PWA, reminders via a generated .ics calendar file
(web push on iOS needs a server and is flaky; native needs 7-day re-signing
on a free account). Old app to be preserved as tag `rival-v1`. Contract
drafted in contract.md, awaiting approval.

## 2026-10-14 decision | v2 contract rev 2

Tommy's feedback: meditate 5–10 min; keep the v1 Morning Stretch flow (12×40s
holds, MORNING_STRETCH in seed/workouts.ts); add a Reflect screen using the
v1 8 dimensions, mirroring his Lovable project; random-length timers with an
end buzzer; settings for ranges and pushup/sit-up totals; add evening prayer.
The Lovable link is a private project ("You don't have access"), so the
reflection layout is pending until I get a shareable link, screenshots or code.
Recommended 3 tabs (Today/Reflect/Progress) over a 2-screen toggle.

## 2026-10-14 decision | v2 contract rev 3: Lovable design adopted

Tommy sent screenshots of the Lovable reflection app (Today intention card →
"Log Your Day" → "Which dimensions did you live today?" with photo per card →
"See My Day" → "Your day in progress" with %, a gentle line, and cards for
the dimensions not yet touched). Proposed: the whole v2 app takes that style,
the dimension copy comes from Lovable, and the tabs mirror it (Photos · Today ·
This Week), with the habit list living on Today. Photos stay on the device in
IndexedDB, downscaled. Have not seen the Photos or This Week screens, so I'll
design those in the same style unless Tommy sends them.

## 2026-10-14 decision | v2 contract rev 4: good-week streak, Screen Time stats

Tommy: the only streak is a "good week" (≥5 of the daily habits on ≥4 days).
Stats show only the current week or month, Screen Time style (swipe back
through past weeks, with a Week/Month toggle). No Photos tab. Albums per
dimension or recap videos could come later. Contract updated: 2 tabs
(Today · Progress), Monday-start weeks, "good day" = ≥5 of 8 items, no
lifetime totals. Photos are still saved per dimension (no gallery) so a later
album/recap has data to work with.

## 2026-10-14 decision | v2 contract rev 5: per-habit weekly tracker

Tommy: weeks run Sun–Sat. The goal is each habit on ≥4 days/week, so it's a
habit tracker rather than a day tracker. Answers: two good-day counters
(≥5/8 habits and ≥5/8 dimensions), good week = all 8 habits at 4 days, and
both Week and Month views show both habits and reflection (month = colored
calendar with a Habits|Reflection switch). Only full completions count toward
the 4; partials show as a half dot.

## 2026-10-14 build | v2 "Full Day" built on branch v2

Tagged rival-v1 at 18ca4c2, branched `v2`, deleted the old src/docs/images
(kept the 12 Morning Stretch photos in public/stretch). New stack is the same
(Vite + React + Tailwind 4 + zustand persist + vite-plugin-pwa). Pure logic is
in src/lib (date, habits, stats, dimensions, ics, photos, sound, wakeLock,
stretch, encourage) with 19 unit tests. Screens: Today, Progress (Week/Month),
TimerSession, StretchSession, Reflect, Settings. App name "Full Day", with a
new icon of 8 sage dots.
Fixes found during live testing: stretch photos were cropped (now
object-contain); tab switch kept the scroll position; "Evening prayer" was cut
off in the tracker; long subtitles were cut off; the page behind overlays
could scroll; "behind" appeared in stretch cues (reworded).
Calendar download: iOS goes to the blob URL (Safari's calendar sheet), other
platforms download it. Not yet confirmed on a real iPhone.

## 2026-10-14 change | rev 6: To Do page, dimension-only week, binary month

Tommy split habits and reflection: new To Do tab (far left) holds the habits,
Up next and the settings gear; Today is now only the Lovable reflection home.
Progress Week = the 8 dimensions (N/4 rows + dimensions-at-4 and good
reflection days). Month = calendar with the Habits|Reflection switch, where a
good day (≥5/8) is green and anything else grey, plus an "N good days" count.
Removed the good-week streak, the habit week tracker and the monthly totals, along
with their code and tests (still in git history if wanted back). R1–R6 verified
live at 375px; 16/16 tests, clean build.

## 2026-10-14 change | Progress trimmed

Removed the summary card above the Week dimension rows and the tapped-day
detail under the Month calendar, which is no longer tappable. Month keeps
the "N good days" line in the calendar card. 16/16 tests, clean build,
checked at 375px.
