# RIVAL — Phase 1 Handoff

A complete snapshot of where the project stands after Phase 1, so work can resume
cleanly (e.g. in a fresh chat).

## What it is
**RIVAL** is a pixel-art "discipline game with no finish line" — a mobile-first,
offline-first PWA where **you (ME, green)** compete forever against two automatic
versions of yourself: **Ymmot (violet, 70% of max XP)** and **Tommy (blue, 90% of
max XP)**. You earn XP by logging real habits/workouts and lose it when you skip.
The whole game is the **gap** between your line and theirs. No backend; all state
is local (localStorage).

## Repo / environment
- **GitHub:** `github.com/tommyandersoniv-cyber/Abroad-Workout-App` — `main`, tags **v1.0**, **v1.1**.
- **Local source of truth:** `/Users/tommyandersoniv/Coding Projects/Abroad Workout App`
  (a second clone exists from GitHub Desktop setup — always use this path).
- **Stack:** React + Vite + TypeScript + Tailwind v4 + Zustand (persisted). PWA via
  `vite-plugin-pwa` (offline after first load).
- **Commands:** `npm install` (if EACCES: `npm install --cache /tmp/x`), `npm run dev`,
  `npm run build`, `npm test`.

## Architecture (rules / data / UI kept separate)
- **`src/engine/`** — pure, tested rules: `ledger.ts` (`maxXP` daily-stepped,
  `rivalXP`, `resolveMisses(excused)`, `earnFor`), `levels.ts` (`tierForGap`,
  `combinedGap`, `levelFor`), `time.ts`, `types.ts`. **15 tests in `ledger.test.ts`.**
- **`src/seed/`** — `activities.ts` (catalog), `program.ts` (weekly template + Block
  A/B), `social.ts` (call names + call/run weekdays), `exercises.ts`, `workouts.ts`,
  `rival.ts` (taunts), `history.ts` (`buildSeedLog` = empty fresh start; `buildDemoLog`
  = ~5wk demo for the tutorial), `index.ts`.
- **`src/store/`** — `useGameStore` (persisted), `useNav`, `useFx`, `useOnboarding`.
- **`src/components/`** — `Sprite` (original 4-stage pixel art), `ui`,
  `ConsistencyTracker`, `Signup`, `Tutorial`, `PixelMedia`.
- **`src/screens/`** — Arena, Today, WorkoutPlayer, ExerciseDetail, ExerciseLibrary,
  Stats, Reports, Catalog, RivalSetup, Settings.
- **`docs/`** — original `RIVAL_PRD.md`, build prompt, this handoff.

## Scoring (exact — must stay correct)
- **Perfect week = 284 XP.** Rival = `holdFraction × maxXP(now)`: **Tommy 0.90**,
  **Ymmot 0.70** (fixed; old difficulty tiers retired). `maxXP` is a **daily step** —
  the CPUs bank their lump at each midnight, flat during the day.
- **Activities:** workout +10/−15 (Mon–Sat) · morning stretch +10/−15 (daily) ·
  jump rope +10/−15 (daily) · meditate/pray/journal +3/−2 (daily) ·
  **run +5/mi, 1 mile on Mon/Wed/Fri, −5 miss** · **phone call +2, 3/wk (2 family
  Tue/Thu, 1 friend Sat), −2 miss** · **extra workout +5, uncapped**.
- **Push (no penalty):** calls push to the next day; a pushed **run carries its mile
  to the next run day**. Implemented via `deferrals` + `runCarry` in the store and an
  `excused` set in `resolveMisses`.
- **Levels:** start Lv 1, **+1 every 500 XP.** **Tiers** (ME only) by gap to the 70/90
  midpoint: `<−500` WASTE OF SPACE · `−500…−100` FAILURE · `−100…+1000` CONTENDER ·
  `≥+1000` APEX. Tommy is always **"LOCKED-IN!"**, Ymmot **"Mr. Consistent"**.

## Features built
- **Onboarding:** sign-up (name + DOB; Day 1 = today) → **10-step tutorial** that jumps
  to, scrolls in, **zooms, and gold-rings** the element it's explaining (over demo
  data) → resets to a **fresh Day 1** (0 XP, empty).
- **Arena:** 3 fighters + 3 XP bars; **THE GAP** shows both gaps side-by-side (Ymmot
  left, Tommy right; Tommy's number blue), each with a half-size **daily-change badge**
  (green = you gained today, red = CPU gained); both rivals taunt.
- **Top bar:** `RIVAL` + live **24h clock** + `ME · Ymmot · Tommy` totals. **DAY N**
  counter on Arena. **Consistency tracker** = days you beat BOTH (streak + heatmap).
- **Today:** daily habits, assigned workout → guided **Workout Player** (interval
  timer), **Log Extra Workout** button, **WEEKLY ROUTINES** (calls + runs by day, each
  with PUSH).
- **Reports:** Weekly (vs last week), Monthly (vs both rivals + tips), Yearly (growth).
- **Mobile:** safe-area insets (header below the notch, nav above the home indicator);
  bottom nav pinned (frame is `100dvh`, only `main` scrolls).

## Deployment
- **`rival-abroad-workout.netlify.app`** = an early **manual** deploy (does not
  auto-update).
- A **separate Netlify site is linked to the GitHub repo** and **auto-deploys on
  push** — this is the live, current app. (Optional cleanup: delete the old manual
  site and rename the git site to `rival-abroad-workout`.)
- `netlify.toml` + `public/_redirects` + `public/_headers` make every build deploy-ready.

## Stubs / not done (Phase 2 candidates)
- Real exercise **media uploads** (currently labeled placeholders; intended:
  camera/upload → IndexedDB blobs, offline).
- **Catalog/Builder** read-only; **sprite uploads** and **schedule/notification editing**
  stubbed.
- **Workout timer** not persisted across a hard mid-session reload.
- No **"replay tutorial"**, no **sound**, no HealthKit/Strava import, accounts, or
  cloud sync (all PRD v2+).
- Minor: signing up as "Tommy" yields two Tommys (you + rival), distinguished only by
  colour — could differentiate.

## Verified
15/15 engine tests pass; typecheck + production build clean; zero console errors across
all screens; full sign-up → tutorial → fresh-Day-1 flow works on a 375px viewport.
