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

## 2026-10-15 fix | second-side stretch timers + sound on iPhone

Lumbar Rotation, Thoracic Rotation and Upper Trap were single holds with a
"switch" cue. They now run side 1 → 5s "Switch sides" → side 2, a full hold
each, for 15 holds (10:00 at 40s). The (L)/(R) stretches were already separate.
No sound: Web Audio on iPhone is muted by the silent switch and gets
suspended, and a 180 Hz buzzer barely comes through a phone speaker.
sound.ts now generates WAV files played through <audio> elements: unlocked
muted on the Start tap, navigator.audioSession='playback' on iOS 17+, and an
880/660 Hz buzzer of about 2.2s. Added Settings → "Test sound". Checked in
the browser that every play() resolves. Still needs a check on the real iPhone.

## 2026-10-15 change | new 15-minute stretch flow

Replaced the 12 v1 holds with Tommy's 11-stretch, 4-phase routine (Wake the
Spine / Open the Hips / Free the Shoulders / Finish Standing), each with its
own hold time. Six are one-sided and get a full hold per side, so the holds
total exactly 15:00, plus a 5s get-set step before each hold (~16.5 min overall).
Mid-hold prompts with a beep: World's Greatest (reach up at 30s), Clasped
Chest (rest/repeat at 30s and 60s), Rag Doll (roll up at 40s). Kept the
local photos that match (cat-cow, hip-flexor-l, chest-opener). The others link
out to Tommy's reference pages ("See picture"); I didn't copy third-party
images. Removed the "stretch hold" setting (each stretch has its own time)
and the unused photos. 17/17 tests, clean build, walked through live.

## 2026-10-15 change | stretch photos, 3s gaps, exactly 15:00

Added Tommy's photos for 7 stretches (public/stretch/*.jpg, resized to 1200px,
precached), and put .jpg in the workbox globs. The Rag Doll PDF says
"Unauthorized use violators will be prosecuted" and the Netlify site is public,
so I didn't use it. Tommy then sent a different Rag Doll photo in chat, but it
never reached disk; still waiting on it as a file. Mistake to avoid: I briefly
saved the newest file in the images folder (the triceps picture) as
rag-doll.jpg, caught it and removed it.
Get-set gap went from 5s to 3s (17 gaps = 51s). Trimmed holds: child-cobra
120→105, World's Greatest 60→55/side, 90/90 45→42/side, Clasped Chest 90→80,
Deep Squat 60→55, Rag Doll 60→55, with prompts moved to fit. Holds 849s + gaps
51s = 900s exactly. Unit-tested, and walked through live to "15:00".

## 2026-10-15 change | hamstring + adductor back, deep squat photo

Added Hamstring and Adductor (30s per side, original v1 photos restored from
2f51268) to Phase 2 after Kneeling Hip Flexor. Added Tommy's Deep Squat photo.
To stay at exactly 15:00 (837s of holds + 21 × 3s gaps), retimed: Cat-Cow 55,
Thread 25/side, Child-Cobra 90, World's Greatest 45/side, 90/90 36/side, Hip
Flexor 35/side, Triceps 35/side, Cross-Body 25/side, Chest 65, Squat 50, Rag
Doll 55, with prompts moved to fit. `link` is now optional, since I didn't make
up reference URLs for the two restored stretches. Live run: 13 stretches, 12
with photos (Rag Doll still has none), "15:00", 900s saved. 17/17 tests.
- 2026-10-15: Rag Doll photo added (Tommy's image, rag-doll.jpg). All 13 stretches now have photos.
- 2026-10-15: Added Upper Trap back (20s per side, v1 photo) at the start of Phase 3. Clasped Chest 65→45 (one rest prompt at 22s) and Rag Doll 55→29 (roll-up at 19s) to stay at exactly 15:00. 14 stretches, verified live.

## 2026-10-15 change | brush teeth (AM/PM) + shower

Added three tap habits: Brush teeth (morning) 07:20, Shower 21:45 and Brush
teeth (night) 22:00, which makes 11 habits. Tommy chose a good habit day of 7+
of 11 (GOOD_HABIT_DAY = 7). Good reflection day stays 5+ of 8 dimensions
(GOOD_REFLECTION_DAY = 5). togglePrayer became toggleTap; habitStatus no longer
special-cases prayers. Saved settings without the new times fill them in
from defaults (checked live). The calendar file now has 14 events.
17/17 tests, clean build.

## 2026-10-15 change | morning meditation, new morning order, meditation 2–5 min

New timer habit `meditateAM` "Morning meditation" at 07:15. Morning order is
now meditation 07:15 → prayer 07:25 → brush teeth 07:30 → stretch 07:40. The
old "Meditate" became "Evening meditation". Both meditations share
ranges.meditate (TimerId + rangeFor()), and the default range changed 5–10 →
2–5. 12 habits; good habit day stays 7+. Persist version 1 → 2 with a
migrate() that moves saved settings still on the old defaults (prayer/teeth
times, 5–10 meditation). Checked live with v1 data, and a morning meditation
run saved under meditateAM only. 18/18 tests, clean build. The .ics now has
15 events.

## 2026-10-15 change | start small (9 habits), habit switches, "Already done"

Tommy wants to start smaller: Evening meditation, Evening prayer and Brush
teeth (night) are now off by default via `settings.off`. They can be switched
back on under Settings → Daily habits (switches for all 12). Off habits are
hidden from To Do, get no reminders, and don't count toward done/good-day.
The set reminders drop an off counter from their title. Good habit day is back
to 5+ (GOOD_HABIT_DAY = 5) of the active habits. Saved settings without `off`
get the default from the merge.
Timer and stretch start screens have a grey underlined "Already done" link,
which opens a "Did you really do it? … Don't cheat yourself" confirm with
Yes / Not yet. Yes marks the habit done with 0 seconds ("Done today"). Counters
and taps were already manual. Verified live, 19/19 tests, clean build.

## 2026-10-15 change | reflection stays editable all day

Nothing locked the reflection, but once logged it only opened to a read-only
summary with a small "Edit" link, so it looked final. Now the summary's 8
tiles are tap-to-toggle buttons that save instantly, with the line "You can
keep changing today's reflection until midnight". There are "Update details
& photos" (back to the cards) and "Done for now" buttons, and the Today
button reads "Update Your Day" once logged. The reflection is keyed to the
local date, so it resets at midnight. Also used a stable empty-array fallback
in the selector. Verified live, 19/19 tests.
