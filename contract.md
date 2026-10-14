# Contract: v2 — daily habit builder (rebuild from scratch)

Started: 2026-10-14 · Status: **APPROVED 2026-10-14 (rev 5) · BUILT, awaiting on-iPhone checks**

## Goal
Replace RIVAL with a small, encouraging app that does one job: help me build
daily habits, nudge me through the day, reflect on the day, and never make me
feel bad for an imperfect day.

## Rev 6 changes (2026-10-14, from Tommy). These override anything below.
- Tabs: **To Do · Today · Progress** (To Do far left). To Do = the 8 habits +
  Up next + settings gear. Today = only the reflection (date, greeting,
  intention card, Log Your Day), like Lovable. The app opens on Today.
- Progress **Week** = dimensions only: 8 rows of S–S dots with `N/4`, plus a
  header showing "X of 8 dimensions at 4 days" and the week's good reflection days.
- Progress **Month** = the calendar with the Habits | Reflection switch. A day
  is green when it's a good day (≥5 of 8 done/lived), otherwise neutral grey.
  No shading levels and no per-habit stats or totals; the header shows a
  count of the month's good days. Tapping a day still shows that day's list.
- Removed: the habit week tracker, the good-week streak, and the monthly totals.
  (Superseded: C23 habit rows, C25 streak header, C26 shading + totals, C28 streak tests.)

- [x] R1 3 tabs in order To Do · Today · Progress; app opens on Today.
- [x] R2 To Do shows Up next + the 8 habits (all logging works as before) + gear.
- [x] R3 Today shows date, greeting, intention card, Log Your Day, and nothing else.
- [x] R4 Week view: only the 8 dimension rows + header (dimensions at 4, good
      reflection days). No habit rows, no streak.
- [x] R5 Month view: good days green, others grey, for both Habits and
      Reflection; "N good days" header; no totals.
- [x] R6 Build clean, tests green, verified at 375px.

## Decisions
- Device: iPhone. App stays a web app (PWA) on Netlify, "Add to Home Screen".
- Reminders: generated calendar file (.ics) of repeating daily events with
  alerts. No server, no push.
- Old app is preserved via git tag `rival-v1`, then removed from `main`.
- **Kept from v1:** the Morning Stretch flow (12 guided holds + their photos)
  and the 8-dimension reflection content (Body, Mind, Heart, Soul, Create,
  Connect, Give, Restore). Everything else goes.
- **Look & feel mirrors Tommy's Lovable reflection app** (screenshots
  2026-10-14): white background, serif headings, light grey rounded cards,
  black pill buttons, moon icon toggles dark mode. The whole v2 app uses this
  style; the v1 pixel-art look is dropped.
- **Dimension copy comes from the Lovable app** (e.g. Body: "You moved,
  rested, or nourished yourself intentionally" + its 3 examples).
- Navigation: 2 bottom tabs **Today · Progress** (no Photos tab).
  Today = greeting + today's intention + the habit list + "Log Your Day"
  (opens the reflection flow). Progress = Screen Time-style stats.
- Weeks run **Sunday–Saturday**.
- **Weekly goal:** each habit (and each dimension) on ≥4 days of the week.
  A habit counts for a day only when fully done (e.g. 100 pushups). Partial
  days show as a half dot but don't count toward the 4.
- **Two good-day counters:** a *good habit day* = ≥5 of the 8 habit items
  fully done; a *good reflection day* = ≥5 of the 8 dimensions lived.
- **Good week** = every one of the 8 habits reached 4 days. The only streak
  is consecutive good weeks.

## The habits (8 items on Today)
| Item            | Logged how                                  | Default            |
|-----------------|---------------------------------------------|--------------------|
| Morning prayer  | one tap                                     | —                  |
| Stretch         | guided v1 Morning Stretch flow, 12 holds    | 40 s / hold (8 min)|
| Jump rope       | random-length countdown + buzzer            | 2–5 min            |
| Pushups         | counter +5/+10/+25, undo                    | 100                |
| Sit-ups         | counter +5/+10/+25, undo                    | 100                |
| Journal         | random-length countdown + buzzer + text box | 2–5 min            |
| Meditate        | random-length countdown + buzzer            | 5–10 min           |
| Evening prayer  | one tap                                     | —                  |

## Default reminder schedule (editable in-app)
07:30 Morning prayer · 07:40 Stretch · 08:00 Jump rope ·
10:00 / 13:00 / 16:00 / 19:00 Pushups + Sit-ups (¼ of daily target each) ·
21:00 Journal · 21:15 Meditate · 21:30 Evening prayer · 21:40 Log Your Day

## Acceptance criteria
**Scope / cleanup**
- [x] C1 Tag `rival-v1` exists on the last old commit (18ca4c2).
- [x] C2 Old code is gone from `main`: no savings, XP, rival, workouts,
      exercise library, grace, signup/tutorial. Only the 12 stretch photos
      remain in `public/images/`.
- [x] C3 Today shows, top to bottom: date, "Good morning/afternoon/evening,
      Tommy", today's-intention card, the 8 habit items in schedule order,
      "Log Your Day" button. Nothing else.

**Logging**
- [x] C4 Pushups/sit-ups: +5/+10/+25 add to today's count, undo removes the
      last add, count shows `N / target` and can go past the target.
- [~] C5 Random timers: on Start, the duration is picked at random (whole
      seconds) inside that habit's range and counts down. At 0 a buzzer
      sounds and the habit marks done. Pause/resume works.
- [x] C6 Stopping a timer early saves the partial time as progress (shown,
      never framed as falling short).
- [~] C7 Stretch runs the 12 v1 holds in order with photo, name, cues and a
      countdown, a short beep between holds and a buzzer at the end. Done
      when the flow finishes. Hold length is adjustable.
- [x] C8 Prayers: one tap marks done, tapping again undoes.
- [x] C9 Journal text (optional) saves locally per day and is never sent anywhere.
- [~] C10 The screen stays awake while a timer runs (Wake Lock API).
- [~] C11 All data survives reload and works offline (localStorage + PWA).
- [x] C12 A new local day starts fresh at midnight; past days stay in history.

**Settings (gear icon on Today)**
- [x] C13 Editable: min/max minutes for jump rope, journal and meditate
      (min ≤ max enforced), stretch hold seconds, pushup target, sit-up
      target, every reminder time. Changes persist and apply immediately.

**Reminders**
- [~] C14 "Add reminders to Calendar" produces a valid .ics: one event per
      reminder, `RRULE:FREQ=DAILY`, a `VALARM` at event start, floating local
      time (follows me across time zones). Unit-tested, and Tommy confirms the
      iPhone import works.
- [x] C15 Re-downloading after edits reflects the new times and targets.
- [x] C16 The "Up next" card on Today shows the next item not yet done.

**Reflection flow (mirrors Lovable)**
- [x] C17 Intention card: "TODAY'S INTENTION", the dimension touched least in
      the last 7 days (same one all day), its description, "Try: a / b / c",
      and a photo button.
- [x] C18 "Log Your Day" opens "Which dimensions did you live today?": ← Back,
      8 cards (name, description, "e.g." examples, photo button), tap a card
      to select/deselect, sticky "See My Day" button.
- [x] C19 "Your day in progress": 2×4 grid of names (selected ones filled),
      big serif %, one gentle line that changes with the count (e.g. "You are
      not behind. You are exactly where your attention brought you."), then
      "You haven't touched these today" with cards and bulleted ideas for each
      unselected dimension.
- [x] C20 Photos: attaching a photo to a dimension shrinks it (≤1280px JPEG)
      and saves it on the device (IndexedDB), tagged with day + dimension.
      It's never uploaded. The thumbnail shows on that card; no gallery
      screen in v2.0 (the data is kept ready for albums/recaps later).
- [x] C21 Reflections save per day and can be reopened and edited for today.

**Progress tab (Screen Time-style), encouraging and never discouraging**
- [x] C22 A Week | Month toggle at the top. Swiping left/right (or the ‹ ›
      arrows) moves to the previous/next period; you can't go past the current
      one. The header names the period ("This Week", "Oct 4–10", "October").
- [x] C23 Week view, HABITS: one row per habit with a dot for each day S M T W
      T F S (● done, ◐ partial, ○ nothing yet, · future), a bar filling toward
      4, and `N/4`. At 4 the row gets a ✓. Nothing is red.
- [x] C24 Week view, REFLECTION: the same row layout for the 8 dimensions
      (● lived that day), each with `N/4`.
- [x] C25 Week view header: "Good week streak: N", "X of 8 habits at 4 days",
      plus this week's good-habit-day and good-reflection-day counts. A week
      that ended short gets gentle copy ("Fresh week, fresh start").
- [x] C26 Month view: a Sun–Sat calendar with a Habits | Reflection switch.
      Each day is shaded by how many of 8 were done/lived (4 shades of one
      calm color, empty = neutral grey). Good days get a small dot. Tapping a
      day shows that day's list. Below: month totals for pushups, sit-ups,
      minutes per timed habit, good habit days and good reflection days.
- [x] C27 Stats only cover the period on screen; no lifetime totals anywhere.
- [x] C28 Unit tests: Sun–Sat week bounds; a habit at 4 full days = ✓ and
      partial days don't count; 5/8 = good day for both counters; good week =
      all 8 habits at 4; the streak counts consecutive good weeks ending last
      week (plus this week once it's already good).

- [x] C29 None of these words appear in UI copy: missed, failed, broke(n),
      lost, penalty, neglected, and "behind" except in "not behind"
      (grep-checked in src/).
- [x] C30 Every log shows a short encouraging message (rotating set of ≥15),
      and finishing all 8 in a day shows a celebration.

**Quality**
- [x] C31 `npm run build` clean; unit tests also cover day rollover,
      counters, random duration within range, settings validation, .ics.
- [x] C32 Verified in browser at iPhone width (375px), no horizontal scroll.

## Known iPhone limits (not bugs)
- The buzzer can't sound if the phone is on silent or the app is closed. It
  only plays while the app is open on screen, which C10 keeps on.

## Out of scope (v2.0)
Accounts/sync, push notifications, workouts/programs, social, XP/levels.

## Later ideas (v2.1+)
- Photo album per dimension.
- Auto-made daily/weekly recap video of the photos ("a full week").

## Results (2026-10-14, graded by Claude, [~] = needs iPhone check)
Checked with 19/19 unit tests, a clean `npm run build`, and live in the browser
at 375px.
- C1 ✓ tag `rival-v1` → 18ca4c2. Work is on branch `v2`, uncommitted.
- C2 ✓ old src/docs removed. The 12 stretch photos live in `public/stretch/`
  (not `public/images/`).
- C3 ✓ order: date, greeting, Up next (C16), intention, habits, Log Your Day.
- C4 ✓ +25×4 = 100/100 ✓, undo pops the last add.
- C5 ~ random length verified (6:47 in 5–10), finishes and marks done. The
  buzzer can't be heard from the test browser, and pause/resume wasn't exercised live.
- C6 ✓ journal stopped at 0:02 → saved as "0:02 so far", toast shown.
- C7 ~ 12 holds, prep step, skip, finish saves 8:00 + done. Beeps not heard.
- C8 ✓ tap marks done (one tap toggles).  C9 ✓ text saved per day.
- C10 ~ Wake Lock code in place; only testable on the iPhone.
- C11 ~ survives reload ✓; all 12 photos + app shell precached. Not tested in
  airplane mode.
- C12 ✓ unit-tested rollover.  C13 ✓ min>max auto-orders, targets and times persist.
- C14 ~ .ics passes unit tests (11 daily events, VALARM, floating time, ≤75
  octets). The iPhone import needs Tommy.
- C15 ✓  C16 ✓  C17–C21 ✓ (photo 3000×2000 → 1280×853 JPEG in IndexedDB)
- C22–C28 ✓ (swipe + arrows, can't go past the current period, streak 2 with
  sample data)
- C29 ✓ grep clean.  C30 ✓ 18 lines + all-8 celebration.  C31 ✓  C32 ✓ no h-scroll.
