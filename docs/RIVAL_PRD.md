# RIVAL — Product Requirements Document (MVP)

> **Working title:** RIVAL *(alternatives: NEMESIS, GHOST, 1UP, SHADOW SELF — see §12)*
> **Version:** 0.2 · June 2026
> **One-liner:** A pixel-art discipline game with no finish line. Your rival banks 90% of a perfect week — every workout, run, stretch, prayer — automatically, forever. Your score climbs when you show up and drops when you skip. The gap between you is the whole game.
> **Built for:** AI-assisted ("vibe") coding. Written to hand straight to a coding assistant and build milestone by milestone.

---

## 0. How to use this document

§1–2 are the pitch. **§3–4 are the game and the scoring — read these first.** §5–6 are your real training program and the exercise/media system. §7–9 are the build (screens, data, tech). §10 is the milestone plan. §12 is the short list of decisions I still need from you. Appendix A is your full regime as seed data; Appendix B is the photo shot list.

---

## 1. Project Overview

A mobile-first, fully offline app that turns your real life — training, running, mindfulness, family — into a permanent one-on-one contest against an AI rival. There is **no daily reset and no end.** You and the rival each have a single XP total that only ever moves forward in time. You earn XP by logging what you actually do. The rival automatically banks **90% of the maximum XP it's possible to earn**, every period, relentlessly — it never has an off day. If you're perfect you slowly pull ahead; the moment you slack, it's already past you and pulling away.

The aesthetic is pixel art in the lineage of the Pokémon rival (Red/Blue's Gary): a character always one step ahead, always training while you rest. The rival is customizable (name, sprite, personality), and the MVP is built around one specific person's real regime — calisthenics, mobility, conditioning, running, and daily mindfulness — with an exercise library that carries a photo, a short description, and a how-to for every movement.

Single-player. Local. No internet required after install.

---

## 2. At a Glance

| | |
|---|---|
| **Level** | Medium |
| **Type** | Mobile-first PWA · Gamification · Fitness/Discipline · Offline-first |
| **Platform** | Installable Progressive Web App (browser + "Add to Home Screen") |
| **Scope (v1)** | Single-player, local storage, one user (you) |
| **Core model** | One **perpetual XP ledger** per side. Never resets. |
| **Rival rule** | Always holds **90% of the maximum possible XP** — a relentless, ever-climbing benchmark. |
| **Skills required** | React (PWA) · Service workers / offline caching · IndexedDB (state + media blobs) · State management (Zustand or similar) · CSS/pixel-art rendering · Local media handling (photo/GIF) · Date/schedule logic |
| **No backend** | The rival is a function of the schedule + the clock; everything resolves on-device. See §4.4. |

---

## 3. The Game — The Four Questions

### 3.1 What is the game?

A rivalry with no finish line. You both start at **0, once.** From then on there are two lines that only climb: the rival's and yours. The rival's line is mechanical — it sits at 90% of a theoretically perfect you, advancing every single day and week whether you move or not. Your line is human — it rises when you log a workout, a run, a prayer, a call home, and it *drops 15* when you skip an assigned workout. The entire game is the distance between those two lines. There's no "win today and reset." There's only: are you ahead of the version of you that does 90% of everything, right now, this week, this season?

### 3.2 How do I play?

1. **Log your life.** Each day surfaces what's due — the assigned workout, morning stretch, midday jump rope, meditate / pray / journal — plus the weekly items (a 3-mile run, one real conversation with family). Tap to complete; for the run, enter your miles.
2. **Earn or bleed XP.** Every completion banks its points (see the catalog in §4.1). Miss something and its deadline passes and you're docked — workouts −15, the smaller habits less. Bank **+5** for any extra workout you do.
3. **The rival never sleeps.** Its total automatically tracks **90% of the maximum** earnable to date. You don't watch it do tasks; you watch it sit relentlessly at 90% of perfect and climb.
4. **Watch the gap.** The home screen ("the Arena") shows both totals and the live gap. Slack for a few days and you'll see the rival's line stretch out ahead of yours.
5. **There's no buzzer.** It just keeps going. Your job is to stay above the line — forever.

### 3.3 What are the patterns behind the game?

- **The rival is perfection minus 10%, and it's never penalized.** It banks 90% of the max every period. A flawless week earns you 100% of max — a cushion of just **+28** over the rival. But every missed −15 item is a **25-point swing** against that perfect baseline (you forgo +10 *and* eat −15), so the cushion is gone after about **one missed workout-type item a week.** Miss two and the rival is already ahead. That asymmetry is the relentlessness.
- **Misses cost more than completions pay.** A workout is +10 to do, −15 to skip — a 25-point swing. One skipped workout is more damage than two completed habits repair.
- **Extra effort is your only way to beat the ceiling.** The rival's benchmark assumes your *minimum*. Every mile beyond 3 (+5) and every **extra workout (+5)** is XP the rival's 90%-of-max never accounted for. **Out-earning the rival means doing more than the maximum it's measured against.**
- **Consistency compounds and so does neglect.** Because nothing resets, a great month builds a lead that's hard to lose — and a skipped week digs a hole of several hundred points you have to climb back out of.

### 3.4 How do I excel?

Be nearly perfect, indefinitely. Never eat a −15 — protect the workouts above all. Stack every small daily (meditate, pray, journal); each is now worth defending. Then use your two levers: **run past three miles** and **bank extra workouts (+5 each)** — the only XP that lands above the rival's ceiling. The rival never has a bad day, so your durable edge is doing *slightly more than the maximum it's measured against*, consistently, for a long time.

---

## 4. Core Mechanics — The Ledger

### 4.1 The Activity Catalog (XP values)

Everything you can log, its cadence, and what it's worth. **These are calibrated defaults and are fully tunable in-app** (§12-E).

| Activity | Cadence | XP | Miss penalty |
|---|---|---|---|
| **Assigned workout** (calisthenics / HIIT / mobility / MITT) | per schedule (~6×/wk) | **+10** | **−15** |
| **Morning stretch** | daily | +10 | −15 |
| **Jump rope** (2–10 min, midday) | daily | +10 | −15 |
| **Meditate** | daily | +3 | **−2** |
| **Pray** | daily | +3 | **−2** |
| **Journal** | daily | +3 | **−2** |
| **Run** (weekly target ≥3 miles) | weekly | **+5 / mile** (3 mi = +15) | **−5** if under 3 mi |
| **Family contact** (talk to ≥1 person) | weekly | +4 | **−3** |
| **Extra workout** (any session beyond the assigned one) | bonus, same-day | **+5** each | — (uncapped) |

**Everything bites if missed**, scaled to the item: workout-type items −15, mindfulness habits −2 each, the weekly run −5, family contact −3. **Run is a hard target** — hit 3+ miles to earn +5/mile; fall short and it's **−5 with no partial credit** (running 1 mile and stopping = −5, not +5). **Extra workouts are pure upside** (+5 each, no cap), exactly like extra miles — both land *above* the rival's ceiling (§4.3), so they're how you out-earn it. *(Run cliff is smoothable if you'd rather reward partial miles — §12-F.)*

**A perfect week with these defaults = 282 XP.** So the rival banks **~254 XP/week** (90%), forever.

### 4.2 The two ledgers

- **You and the rival each have ONE cumulative XP total. Both start at 0. Neither ever resets.**
- **Your total** = sum of XP for everything you've logged, minus the catalog miss-penalty for anything you skip (workouts/stretch/rope −15, mindfulness −2, run −5, family −3), plus +5 for any extra workouts. (It can dip; the headline number on screen is the *gap* vs. the rival — see §12-H on whether your line may go negative.)
- **The rival's total** = `0.90 × (maximum XP earnable from day 0 to now)`. It is never penalized and never stalls. As each day and week elapse, the max grows and the rival's line grows with it, locked at 90% of perfect.

### 4.3 What the numbers actually do (worked example)

A flawless week = 282 XP; the rival banks 254. You start each week only **+28** ahead — and every missed −15 item (workout, stretch, jump rope) is a **25-point swing** against perfect:

| Missed −15 items this week (else perfect) | Your week | Rival | Gap |
|---|---|---|---|
| 0 | 282 | 254 | **+28** |
| 1 | 257 | 254 | **+3** |
| 2 | 232 | 254 | **−22** |
| 3 | 207 | 254 | **−47** |

With everything else done, **~1 missed workout-type item per week is your entire margin** before the rival's line passes yours. The smaller habits sting too — each skipped meditate/pray/journal is a 5-point swing (−2 plus the +3 forgone), so a couple of sloppy days quietly erase the cushion as well. Your way back above the line: extra miles and extra workouts (+5 each), which the rival's ceiling never counts.

Cumulative, no reset (rival = 90% of running max):

| | Week 1 | Week 4 | Week 12 | Week 52 |
|---|---|---|---|---|
| Max possible | 282 | 1,128 | 3,384 | 14,664 |
| **Rival (90%)** | 254 | 1,015 | 3,046 | 13,198 |
| **You @ 100%** | 282 (+28) | 1,128 (+113) | 3,384 (+338) | 14,664 (+1,466) |

**Two facts that define the feel:**
- **Miss one workout** → −25 against your own perfect line (forgo +10, eat −15) while the rival's 90% already banked it. A single skip erases your weekly cushion.
- **Run a 4th and 5th mile** → +10 that lands entirely above the rival's ceiling (its benchmark only assumes your 3-mile minimum). Extra effort is the one thing that compounds in your favor faster than the rival climbs.

### 4.4 Computing it offline (no backend)

Nothing runs server-side. Both lines are derived from the **activity catalog + the schedule + the clock + your completion log**:

- **Rival total** = `0.90 × maxXP(elapsedSchedule)`, where `maxXP` sums every scheduled occurrence of every activity (run counted at its 3-mile target) from day 0 to `now`. Pure function of time + catalog → recomputed on render, ticking up smoothly.
- **Your total** = sum of logged completions; **miss penalties resolve on app-open** by walking the schedule from `lastResolvedAt` to `now` and applying each item's catalog penalty (−15 / −2 / −5 / −3) to anything whose deadline passed un-logged.
- Close the app for a week and reopen it: the rival is correctly ~254 further ahead, and any workouts you blew are already debited. State is *derived*, not babysat.

### 4.5 Difficulty tiers

The tier sets **what fraction of max the rival holds.** Ship all four; default Relentless.

| Tier | Rival holds | Feel |
|---|---|---|
| Gentle | 50% of max | A nudge; easy to stay ahead. |
| Balanced | 70% of max | Stay ahead with solid weeks. |
| **Relentless** *(default)* | **90% of max** | Near-perfection required. The rival is the disciplined ghost of you. |
| Adaptive | trails your 4-week average by 10% | Always just behind your best, so it never feels unfair or trivial. |

### 4.6 Progression, streaks, evolution (open-ended, no end state)

- **Levels & evolution** trigger at **cumulative-XP thresholds** — open-ended, so they fit a game with no finish. Both characters evolve through pixel-art stages as their totals climb. Watching the rival evolve because you fell behind is the stick; your own evolution is the carrot.
- **Streaks** (consecutive days with zero missed workouts) grant a small completion bonus (e.g., +1 XP/day, capped) — a gentle lever to help a diligent player edge above the rival's ceiling over time.
- **Head-to-head** is simply who's ahead and by how much, shown as the gap and its 7-day trend (closing or widening).

### 4.7 Honesty model (anti-cheese)

MVP is honor-system logging — right for a single-player tool you build for yourself. To make it feel earned:
- **Guided workout player** with a built-in interval timer (work/rest — e.g., HIIT 40s/20s, warmup 30s/5s); a workout banks its +10 when the session timer completes, not on a single tap.
- **Run logging** takes a mile value (manual in v1; HealthKit/Strava import is v2).
- Timer/log state is **persisted** so reloads or screen-locks never lose progress.

### 4.8 Rival personality

Name, sprite, and a personality preset (Cocky / Stoic / Hype-man / Sarcastic) that drives a fixed copy bank — surfaced on the Arena when the rival's lead grows and at evolution milestones. No LLM needed offline; v2 can add generated lines.

---

## 5. The Training Program (your real regime)

This feeds the "workout" rows of the catalog. Full detail in **Appendix A**.

> **The daily non-negotiables:** the assigned workout and the morning stretch. Those are the −15 items — the spine of the race. Jump rope, meditate, pray, journal are daily margin; the run and family contact are weekly.

### 5.1 Phase 1 weekly template

> **Decision flagged (§12-A):** your structure says **3 calisthenics + 2 mobility days**, but the calisthenics program (Block A/B) is a **4-day Upper/Lower split**, and the mobility routine prescribes **A 1× / B 2× = 3 sessions.** Below is a clean default honoring "3 calisthenics + 2 mobility + 1 HIIT + 1 rest"; deviations noted.

| Day | Session | |
|---|---|---|
| Mon | **Calisthenics — Upper** | + warmup & cooldown |
| Tue | **Mobility A** | |
| Wed | **Calisthenics — Lower & Core** | + warmup & cooldown |
| Thu | **HIIT (25 min)** | + warmup & cooldown |
| Fri | **Calisthenics — Upper** *(rotates Lower next week)* | + warmup & cooldown |
| Sat | **Mobility B + MITT (20 min)** | |
| Sun | **Rest** — morning stretch only | |

**Every day:** morning stretch · jump rope (midday) · meditate · pray · journal.
**Every week:** run ≥3 miles · contact ≥1 family member.
**Every workout** is wrapped: **warmup → main → cooldown** (Appendix A.2 / A.3).

**Deviations, flagged honestly:**
- 3 calisthenics days running a 4-day split → default **rotates U / L / U then L / U / L** on alternating weeks so Upper and Lower stay balanced over two weeks. *(Alt: bump to 4 calisthenics days — §12-A.)*
- 2 mobility days delivers **Mobility B 1×**, not 2× as the routine prescribes. *(To honor B 2×, append a short B to one cooldown or to Sunday — §12-A.)*
- **Jump rope on the rest day?** Sunday is "stretch only" — include the midday rope or truly rest? (§12-B)

### 5.2 The progression (Month 1 skipped)

Per your note, **Month 1 (beginner foundation) is skipped.** Block A is a **4-week ramp**; then the app advances to **Block B and stays there continuously** — Block B is the permanent program, not an 8-week endpoint:

| Block | App weeks | Source | Frequency | Focus |
|---|---|---|---|---|
| **Block A** | 1–4 (ramp) | your "Month 2" | 4×/wk split | Split + skill intro (wall handstand, tuck L-sit) |
| **Block B** | **5 → continuous** | your "Month 3" | 4–5×/wk | Advanced + skill mastery (free handstand, L-sit hold, muscle-up progressions) — permanent steady state |

Calisthenics days pull their exercise list from the current block; full set/rep prescriptions in Appendix A.7. After week 4 the app switches to Block B and **keeps running it indefinitely** (`weekIndex ≥ 5 → Block B`); the daily workout updates automatically.

### 5.3 Bar-free substitutions

One-tap swaps for any day without a pull-up bar (Appendix A.8): scapular push-ups, reverse/table rows, Superman holds + YTW raises, pike push-up progressions.

---

## 6. Exercise Library & Media System

You specified a **photo, short description, and how-to for every exercise and stretch** — so this is a first-class feature.

### 6.1 Per-exercise content model

| Field | Purpose |
|---|---|
| `name` | "Pike Push-up" |
| `category` | warmup / main / skill / cooldown / mobility / stretch / conditioning |
| `media` | **local** photo or GIF/clip of the movement |
| `description` | 1–2 line summary |
| `howTo` | ordered steps / form cues |
| `commonMistakes` | optional cues |
| `targetMuscles`, `equipment` | tags |
| `defaultPrescription` | sets×reps or work/rest seconds |
| `substitutionOf` | links bar-free alternatives |
| `videoRef` | **optional** online source link + timestamp (your YouTube refs) |

### 6.2 Media handling (the honest part)

You want **real human photos** of each movement. Two realities the design respects:

1. **I cannot source or generate real human demo photos for you** — that would mean fabricating or lifting copyrighted media. So the app is built so **you populate the media**, shipping with clearly-labeled placeholders until you do.
2. **Fully offline ≠ YouTube.** Your video links are excellent *source references* but can't be the offline how-to. So: **offline how-to** = text steps + cues + a **local** image/GIF stored on-device; **online bonus** = deep-link to your YouTube reference at the exact timestamp when connected.

**In-app pipeline:** every exercise has an **"Add media" slot** (capture/upload → stored as a blob in IndexedDB → works offline forever). Ships with placeholder silhouettes so it's fully functional before media exists. Graceful degradation: no local media + offline → placeholder + text; online → offer the video link.

> **Good fit for your shop:** the cleanest path to "real human photos" is to shoot them yourself (on-brand for Modern Day Hippyys) in one batch session. **Appendix B is the exact shot list.**

---

## 7. Screens / Information Architecture

| Screen | Purpose |
|---|---|
| **Arena (Home)** | The two cumulative XP lines (You vs. Rival), the live gap + 7-day trend, today's due items, rival sprite + taunt. The hero screen. |
| **Today / Log** | Everything due today; tap to complete; enter run miles; log extra workouts (+5); quick-check meditate/pray/journal/family. |
| **Workout Player** | Guided warmup → main → cooldown with interval timer, current exercise media + how-to, next-up preview. Banks XP on completion. |
| **Exercise Detail** | Photo/GIF, description, how-to, cues, target muscles, bar-free swap, optional online video. |
| **Exercise Library** | Browse/search all movements; add/edit media + how-to. |
| **Catalog / Builder** | Edit activities, XP values, cadences, the weekly template, U/L rotation, active hours/deadlines, difficulty. |
| **Rival Setup** | Name, sprite, personality, difficulty tier. |
| **Stats** | Cumulative totals, gap history, level/evolution, streak, miss log, run log. |
| **Settings** | Schedule/deadlines, notifications, theme, data export/reset. |

---

## 8. Data Model (local, offline)

```
Player        { id, name, level, cumulativeXP, currentStreak, longestStreak,
                spriteId }

Rival         { name, spriteId, personality, holdFraction(0.9),
                level, cumulativeXP /* = holdFraction × maxXPToDate */ }

Activity      { id, name, category, xp, unit: per_session|per_mile,
                cadence: daily|weekly|scheduled|bonus, schedule:[days],
                missPenalty /* workout/stretch/rope -15, mind -2, run -5, family -3, bonus 0 */,
                requiresTimer:bool, weeklyTarget? /* run=3; under target -> penalty, no partial credit */,
                repeatable:bool /* extra workout: +5 each, uncapped */ }

Exercise      { id, name, category, mediaId?, description, howTo[],
                commonMistakes[], targetMuscles[], equipment[],
                defaultPrescription, substitutionOfId?, videoRef{url,startSec}? }

Workout       { id, name, type, blocks:[{ kind:warmup|main|skill|cooldown,
                items:[{ exerciseId, sets, reps|durationSec, workSec, restSec }] }] }

ProgramWeek   { weekIndex, block:A|B, dayMap:{ Mon:workoutId|REST, ... } }

LogEntry      { activityId, date, value /* miles, or 1 */, xpEarned, status }

Ledger        { lastResolvedAt }   // walk schedule→now to apply rival climb + missed-workout penalties

MediaAsset    { id, blob, type, exerciseId }
Settings      { difficulty, scheduleWindow, notifications, theme,
                allowNegative:bool }
```

---

## 9. Technical Approach

- **Stack:** React + Vite, installable PWA via `vite-plugin-pwa`.
- **Offline:** service worker pre-caches the app shell + seed content; all user data and media in IndexedDB (e.g., Dexie). Airplane-mode functional after first load.
- **State:** Zustand (or Redux) with persistence; log entries written as they happen.
- **The ledger engine** (§4.4): rival = `0.9 × maxXP(elapsedSchedule)` computed on render (smooth tick via 1–5s interval); player penalties resolved by schedule-walk on app-open; `lastResolvedAt` advanced. No background jobs, no server.
- **Timers:** persist start timestamps so reloads/locks don't lose workout state.
- **Pixel-art:** pixel font (e.g., *Press Start 2P*), `image-rendering: pixelated`, original sprite sheets for evolution stages (keep art original to avoid copying existing games); Tailwind for layout.
- **Notifications (PWA, optional):** local nudges — "Rival's lead is +40 and climbing," workout deadline reminders.
- **No backend, no auth, no network dependency** in v1.

---

## 10. Milestones

**M1 — Ledger Engine.** Activity catalog, perpetual cumulative scoring, rival = 90%-of-max, missed-workout penalties, schedule-walk resolution. Headless-testable; reproduce the §4.3 numbers exactly.

**M2 — The Arena (UI + pixel art).** Dual cumulative lines, live gap + trend, due-today list, rival sprite + taunt bank.

**M3 — Workout Player + Exercise Library + Media.** Guided warmup→main→cooldown with interval timer; exercise detail (media + how-to); library browse/edit; add-media (camera/upload → IndexedDB); placeholders + online-video fallback.

**M4 — Catalog & Program.** Editable activities/XP/cadences, run-mile logging, extra-workout logging (+5), habit checks, weekly template, U/L rotation, Block A→B then continuous-B auto-advance, bar-free swaps.

**M5 — Progression.** XP-threshold levels + evolution, streak bonus, stats/gap history, miss & run logs.

**M6 — Offline + Polish.** PWA install + service worker, local notifications, evolution animations, settings + data export/reset.

---

## 11. Out of Scope (v1) / Future

Accounts, cloud sync, multi-device · leaderboards / social / human rivals · HealthKit / Strava / wearable auto-import · LLM-generated taunts · auto-sourced exercise media. All v2+.

---

## 12. Open Questions / Decisions Needed

- **A. Weekly structure** — 3 calisthenics (rotating U/L) or bump to 4? And Mobility B 2× (append a short B somewhere) or accept B 1×?
- **B. Jump rope on the rest day?** — include the midday rope on Sunday or truly rest?
- **C. Media sourcing** — shoot your own library (recommended; Appendix B is the shot list), license a set, or run on placeholders for now?
- **D. App name** — RIVAL (working) or NEMESIS / GHOST / 1UP / SHADOW SELF?
- **E. XP values** — confirm the §4.1 catalog (workouts +10, stretch/jump rope +10, meditate/pray/journal +3, run +5/mi, family +4). Anything mis-weighted? Should the morning stretch and jump rope really be +10 like a full workout, or lower?
- **F. Run scoring** — confirm the hard target: under 3 miles = −5 with **no partial credit**; 3+ miles = +5/mile, uncapped. Want partial-mile credit or a weekly cap instead?
- **G. Penalties (now locked in per your fixes)** — workouts/stretch/rope −15, meditate/pray/journal −2, run −5, family −3; extra workout +5 (no cap). Flag any that still feel off.
- **H. Negative balance** — may your line go negative (debt), or floor at 0? (Default: allow it; the gap is the real number.)
- **I. Deadlines** — when does a daily item count as "missed"? (Default: end of day, local time.)

---

## 13. Summary

**What's done:** A complete MVP PRD built on a single perpetual ledger — both sides start at 0 and never reset; you earn the §4.1 catalog values and take scaled penalties for anything missed (workouts/stretch/rope −15, mindfulness −2, run −5, family −3), with extra workouts and extra miles as +5 upside levers; the rival relentlessly holds 90% of the maximum possible XP, forever. Includes verified scoring math (a flawless week beats the rival by just +28, so ~1 missed workout is your weekly margin), difficulty tiers, open-ended XP-threshold progression, a calisthenics Block A ramp flowing into a continuous Block B, the full screen map, an offline no-backend ledger model, a 6-milestone build plan, your entire regime as seed content (Appendix A), and a per-movement media/how-to system designed for offline use.

**What's missing / needs you:** the decisions in §12 — most importantly the run-scoring rule (F), the weekly structure (A), the media plan (C), and a name (D). And the real photos, which I can't source for you; Appendix B is the shot list.

**Next step:** answer §12 (even just E, G, A, D) and I'll (1) lock the catalog and weekly template, (2) turn Appendix A into a ready-to-import **seed JSON** you can drop straight into the build, and (3) if you want, scaffold Milestone 1 (the ledger engine) so you can start vibe-coding immediately.

---
---

# Appendix A — Seed Content (your regime, verbatim)

### A.1 Morning stretch — total-body (every day)
Lumbar Rotation · Thoracic Rotation · Upper Trap · Cat/Cow · Hip Flexor (R) · Hamstring (L) · Adductor (L) · Adductor (R) · Hip Flexor (L) · Hamstring (R) · Chest Opener · Overhead & W Stretch

### A.2 Warmup — every workout (30s work / 5s rest) · *src: https://youtu.be/_6-k5-w1bZw*
Jumping Jacks · Cross Toe Touches · Squat + Front Kick · Chest Opener + Butt Kicks · Arm Circles (switch halfway) · Standing Knee Drives · Inchworm Push-up · Down Dog + Knee Tuck · Lateral Lunges · High Knees

### A.3 Cooldown — every workout · *src: https://www.youtube.com/watch?v=NUIMZ4IcBy8*
Downward Dog · Cobra · Quad (R) · Quad (L) · Seated Glute (R) · Seated Glute (L) · Cat/Cow · Supine Spinal Twist (R) · Supine Spinal Twist (L) · Wide-Stance Forward Fold

### A.4 Mobility (3 sessions/wk) · *src: https://youtu.be/bg5ltVL3fok*
**Mobility A (1×):** A (2–3 sets) Hang 30–60s · Squat 30–60s | B (2–3 sets) Couch Stretch 30–60s · Jefferson Curl 30–60s | C (2–3 sets) Crab Stretch 10 · Elevated Pigeon Hinge 10 + 10s hold
**Mobility B (2×):** A (2–3 sets) Hang 30–60s · Straight-Leg Hip Hinge 10 + 10s hold | B (2–3 sets) Wall Butterfly 10 + 10s hold · 90/90 Hip IR Isometrics 5–10 | C (2–3 sets) Couch Stretch 30–60s · Butcher Block 30–60s

### A.5 MITT — 20 min, weekly (40s/20s) · *src: https://youtu.be/ioZYglRIVzA*
**Warmup:** Squat Hip Circle · Air Squats · Reverse Lunge Stretch · Wide-Leg Stretch
**Workout:** Jumping Jacks · Squat Jacks · Squat Jumps · Squat Crunch Jump · Squat Lunge Jump · Curtsy Lunges (L) · Curtsy Lunges (R) · High Knees · Half Burpees · Side-to-Side Half Burpees · Half Burpee High Jump · Lunge Knee Drive (R) · Lunge Knee Drive (L) · In-Out Jumps · Half Burpee + 4 Climbers · Fast Climbers

### A.6 HIIT — 25 min, weekly · *src: https://youtu.be/npofZutKsfA*
Squats · Jump Squats · Shoulder Taps · Push-up Alt Shoulder Taps · Static Lunge (R) · Static Lunge Hops (R) · Alt Plank Toe Taps · Blast-Off Push-ups · Prayer Crunches · Lean-Back Pulses · Static Lunge (L) · Static Lunge Hops (L) · Bear Plank Dead Bugs · Half Burpees · Sumo Squats · In+Out Jump Squats · Step-Back Knee Drive (R) · Step-Back Knee Drive (L) · Scissor Kicks on Elbows · Cross-Over Scissors · Rear Lunge to Knee Drive (R) · Rear Lunge to Knee Drive (L) · Plank Jacks · Cross Mountain Climbers · Alt Rear Lunges · Alt Jump Switch Lunges · Commandos · Push-up Pulses · Reverse Crunches · Alt Leg Lifts · Curtsy Lunge + Staggered Squat (R) · Curtsy Lunge + Staggered Squat (L) · Push-up Alt Plank Reach · Skull-Crusher Push-ups · Lateral Squat Walk · Lateral Speed Skater Hops · Spider Climber Push-ups · Chest-to-Floor Burpees
**Finisher (20/20/20, no rest):** Kneel-to-Squat Hops · Fast Narrow Push-ups · 6× Mountain-Climber Burpees

### A.7 Calisthenics progression (Month 1 skipped)
**Block A — Weeks 1–4 ("Month 2"): Split + Skill Intro — 4×/wk**
*Days 1 & 4 Upper:* Warmup · Push-ups 4×10–15 · Pull-ups/Inverted Rows 4×6–10 · Dips 4×10–15 · Pike Push-ups 3×8–12 · Plank-to-Push-up 3×10–15 · Cooldown
*Days 2 & 3 Lower & Core:* Warmup · Squats 4×20–25 · Lunges 4×15–20/leg · Glute Bridges 3×20–25 · Calf Raises 3×20–25 · Hanging Leg Raises 3×8–12 · Russian Twists 3×20/side · Cooldown
*Skill (2–3×/wk):* Wall Handstand 3×20–30s · Tuck L-Sit 3×10–15s

**Block B — Weeks 5–8 ("Month 3"): Advanced + Skill Mastery — 4–5×/wk**
*Days 1 & 4 Upper:* Warmup · Decline Push-ups 4×10–15 · Pull-ups 4×8–12 · Dips 4×10–15 · Archer Push-ups 3×6–10/side · Plank-to-Push-up 3×15–20 · Cooldown
*Days 2 & 3 Lower & Core:* Warmup · Assisted Pistol Squats 4×6–10/leg · Bulgarian Split Squats 4×10–15/leg · Single-Leg Glute Bridges 3×15–20/leg · Calf Raises 3×25–30 · Hanging Leg Raises 3×10–15 · Windshield Wipers 3×10–15/side · Cooldown
*Skill (3–4×/wk):* Free Handstand 3×20–30s · L-Sit Hold 3×10–20s · Muscle-Up Progressions (jumping/band) 3×3–5

### A.8 Bar-free substitutions
Scapular push-ups (pull initiators) · Reverse/table push-ups = bodyweight rows · Superman holds & YTW raises (posterior chain + rear delts) · Pike push-ups + progressions (overhead press)

---

# Appendix B — Media Production Checklist (shot list)

Each movement needs **one clear photo (or short GIF)** of the working position; consistent frame/lighting for a cohesive pixel-treated library. Until populated, the app shows labeled placeholders.

- **Morning stretch (12):** all of A.1
- **Warmup (10):** all of A.2
- **Cooldown (10):** all of A.3
- **Mobility A & B:** Hang · Squat · Couch Stretch · Jefferson Curl · Crab Stretch · Elevated Pigeon Hinge · Straight-Leg Hip Hinge · Wall Butterfly · 90/90 Hip IR · Butcher Block
- **Calisthenics (A + B):** Push-up · Decline Push-up · Archer Push-up · Pike Push-up · Pull-up · Inverted/Table Row · Dip · Plank-to-Push-up · Squat · Lunge · Bulgarian Split Squat · Assisted Pistol Squat · Glute Bridge · Single-Leg Glute Bridge · Calf Raise · Hanging Leg Raise · Russian Twist · Windshield Wiper
- **Skills:** Wall Handstand · Free Handstand · Tuck L-Sit · L-Sit Hold · Muscle-Up progression
- **Bar-free subs:** Scapular Push-up · Superman Hold · YTW Raise
- **MITT (≈20):** all of A.5 · **HIIT (≈40):** all of A.6 · **Conditioning:** Jump Rope
- **Lifestyle (icons, not photos):** Meditate · Pray · Journal · Run · Family contact
