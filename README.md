# RIVAL

A pixel-art discipline game with **no finish line**. You and an AI **rival** each
hold a single XP total that starts at 0 and never resets. You earn XP by logging
real activities (workouts, runs, stretch, meditation, prayer, journaling, family
contact) and lose it when you skip them. The rival automatically banks **90% of
the maximum XP it's possible to earn**, climbing relentlessly in real time. The
whole game is the **gap** between your line and the rival's — the version of you
that does 90% of everything, every day, forever.

Built as a polished, offline-first, mobile-web prototype. No backend, no auth, no
network calls — all state is local.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173  (open on a phone-width viewport)
npm run build    # → dist/  (static, Netlify-ready)
npm run preview  # serve the production build
npm test         # run the engine test suite (Vitest)
```

> **macOS npm cache note:** if `npm install` fails with `EACCES … ~/.npm/_cacache`,
> your global npm cache has root-owned files (a known old-npm bug). Either run the
> one-time fix `sudo chown -R $(id -u):$(id -g) ~/.npm`, or install with a local
> cache: `npm install --cache ./.npmcache`.

Open it on a 390–430px viewport (iPhone-ish). On a desktop the app centers a
phone-width column over an arcade backdrop. It's an installable PWA (manifest +
service worker via `vite-plugin-pwa`) — "Add to Home Screen" gives app-like chrome.

## Host it live + install it on your phone

`npm run build` emits a fully static, offline-first bundle into `dist/` — host that
folder anywhere. A `netlify.toml` is included (SPA redirect + no-cache on the SW),
so the fastest path is:

**Option A — Netlify drag-and-drop (no account-CLI needed)**
1. `npm run build`
2. Go to <https://app.netlify.com/drop> and drag the `dist/` folder onto the page.
3. You get a live `https://<name>.netlify.app` URL in seconds.

**Option B — Netlify CLI / Git**
- CLI: `npx netlify deploy --prod --dir=dist`
- Git: push the repo and "New site from Git" on Netlify — it reads `netlify.toml`
  and runs `npm run build` for you. (Vercel/Cloudflare Pages/GitHub Pages work too;
  just publish `dist/` and serve `index.html` as the SPA fallback.)

**Install as a phone webapp**
- **iPhone (Safari):** open the live URL → Share → *Add to Home Screen*. Launches
  full-screen with the RIVAL icon, no browser chrome, and works offline.
- **Android (Chrome):** open the URL → menu → *Install app* / *Add to Home Screen*.

> Must be served over **https** (Netlify is, automatically) for the service worker
> and install prompt to work. `npm run dev` over localhost also counts as secure.

---

## How it's built (the hard requirement: rules / data / UI are separate)

```
src/
  engine/          ← THE RULES. Pure, isolated, fully unit-tested. No React, no clock.
    types.ts         core domain types
    time.ts          local-time / Monday-week calendar helpers (clock passed in, never read)
    ledger.ts        rivalXP = holdFraction × maxXP(now); player totals; offline miss-resolution
    levels.ts        gap-driven evolution tiers (WASTE OF SPACE / FAILURE / CONTENDER / APEX)
    ledger.test.ts   reproduces the PRD §4.3 numbers exactly (15 tests)
  seed/            ← THE DATA. Clearly separated, hand-transcribed from PRD Appendix A.
    activities.ts    the activity catalog with the EXACT XP values (perfect week = 282)
    exercises.ts     the exercise library (how-to + placeholder media slots)
    workouts.ts      warmup → main/skill → cooldown definitions per session
    program.ts       weekly template + Block A→B progression + U/L rotation
    history.ts       deterministic ~5-week back-history generator
    rival.ts         rival defaults + per-personality taunt banks
  store/           ← the integration layer
    useGameStore.ts  Zustand + localStorage; holds only facts, derives every total from the engine
    useNav.ts        screen routing   ·   useFx.ts  ephemeral juice events
  components/        Sprite (original pixel art), PixelMedia, shared retro UI
  screens/           Arena · Today · WorkoutPlayer · ExerciseDetail · ExerciseLibrary
                     · Stats · Catalog · RivalSetup · Settings
  lib/today.ts       the shared "what's due today" model
  lib/consistency.ts daily tracker: streak + heatmap of every day you beat the rival
  lib/reports.ts     weekly / monthly / yearly performance analytics (pure)
```

**The engine is the source of truth for every number.** Totals are never stored —
they're recomputed from the activity catalog + the schedule + the clock + your log
on every read, so closing the app for days and reopening yields the correct totals.

**Reports (MORE → 📊 REPORTS).** Three cadenced, largely-visual reports, each
navigable across past periods (a gold dot on MORE flags a newly-completed one):
- **Weekly (7d)** — ME only: net XP this week with a vs-last-week delta, paired
  this/last comparison bars (earned, completions, misses, extras, miles), completion
  rate, and a category breakdown.
- **Monthly (30d)** — ME vs both rivals: points gained (you/Ymmot/Tommy), per-rival
  gap-change cards, days-finished-ahead bars, a day-by-day sparkline, and
  personalized tips on how to widen or close each gap.
- **Yearly (365d)** — growth: start→end XP, a full-year 3-line chart, a tally
  (completions, misses, miles, extras, best week, best streak), and tier change.

**Internal clock & day counter.** A live 24h military clock runs at the far right of
the top bar (never stops after sign-up; resets at midnight to 0:00), and a **DAY N**
counter (days since sign-up) sits above the fighters on the Arena. The CPU rivals
bank their points in a **daily lump as soon as the next day starts** — `maxXP` is a
step function (each day's XP banks at the next midnight), so the rival totals hold
flat through the day and jump at midnight rather than trickling up.

### The scoring, exactly (PRD §4.1 / §4.3)

- A **perfect week = 284 XP**; the rival (Relentless, 90%) banks **~256/week**.
- Miss penalties: workout / stretch / jump-rope **−15**, meditate / pray / journal
  **−2**, run **−5**, phone call **−2**. Extra workouts **+5 each, uncapped**.
- **Phone calls:** 3/week — **2 family + 1 friend**, +2 each — each pinned to a
  weekday and a person cycled deterministically from your lists.
- **Run:** 1 mile on **3 days/week** (Mon·Wed·Fri), +5/mile; under 1 mi → 0 (no
  partial credit). Pushing a run carries its mile onto your **next run day**.
- **Pinned to days + pushable:** the run and each call sit on specific days; if you
  can't make one, **push it to another day with no XP penalty** (the original day is
  excused from resolution and it stays loggable for full XP under its key).
- **Rival** = `0.90 × maxXP(now)` where `maxXP` sums every scheduled occurrence at
  full completion (run at its 3-mile target), **excluding** extra workouts and miles
  past 3. Pushes never change the rival — it always completes on schedule, so
  serially pushing without doing still loses you ground.
- **Offline miss-resolution:** on load / tab-focus the engine walks the schedule from
  `lastResolvedAt` to `now` and docks anything whose deadline passed un-logged
  (skipping pushed/excused occurrences), then advances the watermark.

`npm test` asserts the cumulative table (W1 256, W4 1022, W12 3067, W52 13291), the
"+28 / +3 / −22 / −47" missed-item swing table, the run cliff, the daily-lump
stepping (flat within a day, jumps at midnight), and closed-for-a-week resolution.

### Three lines ("you vs yourself") + evolution tiers

It's a contest between three versions of you, all starting at **0 on day 1**:

| line | who | value |
|---|---|---|
| **ME** (green) | the player you control | sum of your logged completions − misses |
| **Ymmot** (violet) | the humanly-achievable version | a constant **50% of max** |
| **Tommy** (blue, red headband) | the totally locked-in version — your nemesis | a constant **90% of max** |

Tommy is the new blue-shirt/red-headband hero; Ymmot inherits the original ghost
avatar and sits in the middle; ME stays the green hero. Everything measures against
**both** rivals: the GAP section shows both numbers side by side (Ymmot left, Tommy
right) — each with a half-size **daily change** badge at its upper-right (green `+` when
you gained on that rival today, red `−` when they gained on you), and Tommy's gap
number is always gold. Both rivals deliver taunts (Ymmot speaks as the steady "Mr. Consistent"),
and the consistency tracker is a 3-state heatmap — **beat both** / beat Ymmot only /
behind both — with the headline streak counting consecutive days beating **both**.
Only **ME** carries an evolution tier word; Tommy is labelled **LOCKED-IN!** and
Ymmot **Mr. Consistent**. Names are editable on the RIVALS & NAMES screen.

The evolution **tier is dictated by the gap**, not absolute XP — and reflects both
rivals: it reads off your gap to the **midpoint** of Ymmot (50%) and Tommy (90%),
i.e. the 70% line. From there:

| gap | tier |
|---|---|
| ≥ +1000 | **APEX** |
| −100 … +1000 | **CONTENDER** |
| −500 … −100 | **FAILURE** |
| < −500 | **WASTE OF SPACE** |

Crossing a tier (up or down) fires an evolution flourish. The rivals carry fixed
identities rather than tiers — Tommy at a maxed "locked-in" look, Ymmot steady. (The
old per-rival difficulty tiers are retired — the benchmarks are fixed at 50%/90%.)

### Demo time-control

The gold **⏱ button** (bottom-right) opens a clearly-labeled dev panel: advance the
clock (+1h, +4h, skip to 11:30pm, +1 week) and reset to seed.
This lets you watch the whole loop — the rival catching up, a missed-week swing, an
evolution — in seconds. Try: open the panel → **+1 WEEK** a few times and watch the
rival pull away and evolve to APEX while your line bleeds.

---

## First run = a fresh Day 1

A new install starts **empty on Day 1**: you and both rivals at 0 XP, program week 1
(Block A), nothing logged. You build the ledger by showing up — the gap, graphs and
reports fill in as days pass. Progress saves automatically to localStorage, so it
persists across reloads and works fully offline after first load. Use the Demo
Controls (gold ⏱) to fast-forward the clock and watch the whole loop, or **Reset to
Seed** to return to a clean Day 1.

---

## Assumptions & stubs

- **Decisions taken** (PRD §12): Relentless default; jump rope **every day incl.
  Sunday** (required by the 282 math); 3 calisthenics days with U/L rotation +
  Mobility B 1×; run cliff with no partial credit; penalties as locked in §12-G;
  negative balance **allowed** (the gap is the real number); deadlines at end of
  day / week, local time.
- **Stubbed (high-fidelity but not deep-editable):** the Catalog/Builder is
  read-only (the catalog *is* the live engine input); Rival Setup wires name /
  personality / all three names but sprite uploads are stubbed; Settings
  wires sound, allow-negative, JSON export and reset-to-seed but schedule-window /
  notification editing is noted as stubbed. **The core loop and the math are never
  stubbed.**
- **Media:** every exercise ships a labeled placeholder pixel-media slot with an
  "add photo" affordance. Per PRD §6.2 the app never fetches or fabricates real
  demo photos — you populate them. Appendix-A YouTube refs appear as optional
  online-reference links on the Exercise Detail screen.
- **Workout-player timer** persists for the duration of the session in component
  state; it banks +10 only when the full warmup→main→cooldown completes. Persisting
  timer state across a hard reload mid-session is the one place a deeper build would
  go further (PRD §4.7).
- **Art is 100% original** — pixel fighters are drawn as SVG rect grids in
  `components/Sprite.tsx` with four gap-tier looks (diminished → headband/spikes →
  crown/horns + aura); nothing is copied from any existing game.

---

*RIVAL · v0.2 — the rival never has a bad day. Your durable edge is doing slightly
more than the maximum it's measured against, consistently, for a long time.*
