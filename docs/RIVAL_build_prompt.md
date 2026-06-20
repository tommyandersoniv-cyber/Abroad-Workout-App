# Build prompt for Claude Code — "RIVAL" prototype

> Paste this together with `RIVAL_PRD.md` into Claude Code.

---

You're building a **high-fidelity, fully working front-end prototype** of a mobile web app called **RIVAL**. The complete spec is in the attached `RIVAL_PRD.md` — **read it fully and treat it as the source of truth.** This message tells you how to build the prototype and what to prioritize.

## Goal

A polished, interactive, **mobile-first web app** that looks and feels like a real shipped product — good enough to demo live and to serve as the definitive visual + interaction reference. The bar: "this could be deployed to Netlify right now and I'd be proud of it." No backend required — the app is offline-first by design (see PRD §9), so all state is local.

## What RIVAL is (one paragraph)

A pixel-art discipline game with **no finish line**. You and an AI **rival** each have a single XP total that starts at 0 and **never resets**. You earn XP by logging real activities (workouts, runs, stretch, meditation, prayer, journaling, family contact); you lose XP when you skip them. The rival automatically holds **90% of the maximum XP it's possible to earn**, climbing relentlessly in real time. The whole game is the **gap** between your line and the rival's. It's the Pokémon Gen-1 rival ("Red" / Gary) energy: the version of you that does 90% of everything, every day, forever — and your job is to out-work it.

## Tech & constraints

- **React + Vite + TypeScript + Tailwind CSS.** Single-page, client-only, **static-deployable** (`npm install` → `npm run dev`, `npm run build` produces a Netlify-ready static bundle).
- State in **Zustand**, persisted to **localStorage** (no server, no auth, no external API calls). Do NOT use any backend or remote storage.
- **Mobile-first:** design for a 390–430px viewport (iPhone). On larger screens, center a phone-width column with a tasteful backdrop. Touch-sized targets.
- Add PWA niceties: a web app manifest, app icon, installable, app-like chrome (no browser-looking UI inside).
- **Architecture for portability:** keep the **scoring/ledger logic in one pure, well-tested module** (e.g., `src/engine/`) and all **seed data in clearly separated files** (e.g., `src/seed/`). Keep components modular. A clean separation between "the rules," "the data," and "the UI" is a hard requirement.
- Ship a `README.md`: how to run, where the engine and seed data live, and a short list of any assumptions or stubs.

## Aesthetic — this matters as much as the logic

Retro pixel-art game UI in the lineage of Gen-1 Pokémon — but **100% original art** (do NOT copy Pokémon or any existing game's sprites/UI; generate your own pixel characters via CSS/SVG/canvas).

- Pixel display font (e.g., **"Press Start 2P"**) for headings/labels/numbers; a crisp legible font for any long body text.
- `image-rendering: pixelated`; chunky panel borders, retro HUD frames, a deliberate 8/16-bit palette (pick a strong, cohesive one — e.g., deep indigo night + CRT green/amber accents).
- **Original sprite characters** for You and the Rival, each with ~3 **evolution stages** tied to XP thresholds. Idle bob animation.
- **Juice:** XP bars that fill, numbers that tick up, the rival's bar visibly climbing, a "VS" clash on the Arena, level-up / evolution flourishes, subtle screen-shake on a big miss. Optional sound, **off by default**.

## Core mechanic — implement these numbers EXACTLY

**One perpetual ledger per side. Both start at 0. Nothing ever resets.**

**Your XP** = sum of everything you log, with these values and miss-penalties (the activity catalog):

| Activity | Cadence | Earn | Miss penalty |
|---|---|---|---|
| Assigned workout (calisthenics / HIIT / mobility / MITT) | per schedule (~6×/wk) | +10 | **−15** |
| Morning stretch | daily | +10 | −15 |
| Jump rope (2–10 min, midday) | daily | +10 | −15 |
| Meditate | daily | +3 | −2 |
| Pray | daily | +3 | −2 |
| Journal | daily | +3 | −2 |
| Run (weekly target ≥3 miles) | weekly | **+5 / mile** (3 mi = +15) | **−5** if under 3 mi, **no partial credit** |
| Family contact (talk to ≥1 person) | weekly | +4 | −3 |
| **Extra workout** (any session beyond the assigned one) | bonus, same day | **+5 each** | none (uncapped) |

- **Run is a hard target:** 3+ miles → +5/mile; under 3 miles by week's end → −5 and **no** credit for the partial miles.
- **Extra workouts and extra miles are pure upside** and deliberately sit *outside* the rival's "maximum" (see below) — they're the only way to pull ahead.

**The Rival** = `rivalXP(now) = 0.90 × maxXP(now)`, where `maxXP(now)` is the **maximum XP earnable from day 0 to now**, summing every scheduled occurrence of every catalog activity at full completion (run counted at its 3-mile target). The rival is **never penalized**, and `maxXP` does **not** include extra workouts or miles beyond 3. Compute it as a **pure function of the schedule + the clock** and recompute on a 1–5s interval so the rival's bar **ticks up smoothly in real time**. (With the default catalog, a perfect week = **282 XP**, so the rival banks **~254/week**; a flawless week beats it by only **+28**.)

**The hero number is the GAP** (you − rival): big, centered, color-flips when you fall behind. Show a 7-day trend (closing / widening).

**Missed-item resolution (offline-correct):** on app load, walk the schedule from `lastResolvedAt` to `now` and apply each item's miss penalty to anything whose deadline (default: end of day, local time) passed un-logged; advance `lastResolvedAt`. Closing the app for days and reopening should yield the correct totals.

Default difficulty: **Relentless (rival = 90% of max).** Include the other tiers from PRD §4.5 in settings.

## The demo time-control (build this — it makes the prototype sing)

Because the rival climbs over real hours, add a small **"Demo Controls" panel** (toggleable, clearly a dev tool): buttons to **advance the clock** (+1h, +4h, "skip to tonight," "advance 1 week"), **reset to seed**, and **jump to a chosen difficulty**. This lets anyone watch the full loop — rival catching up, a missed-workout swing, an evolution — in seconds without waiting a day.

## Screens (PRD §7) — make the Arena the showpiece

Build all primary screens, reachable via app navigation. Fully interactive: **Arena (home)**, **Today / Log**, **Workout Player** (guided warmup → main → cooldown with a real work/rest interval timer), **Exercise Detail**, **Exercise Library**, **Stats** (totals, gap history graph, level/evolution, streak, miss & run logs). High-fidelity is fine for **Catalog/Builder**, **Rival Setup**, **Settings** (wire what's quick; stub deeper editing with a note).

- **Arena:** the two pixel characters facing off, dual cumulative XP bars, the giant GAP number + trend, today's due items as a checklist, the rival sprite with a personality taunt line when it's ahead. This screen should feel alive.
- **Workout Player:** pull the day's session from seed; step through exercises showing the (placeholder) pixel media + text how-to + the interval timer; bank the +10 only when the session completes.

## Seed data — use the real regime in PRD Appendix A

Pre-load so the app is instantly explorable:
- The **weekly template** (Mon Calisthenics-Upper, Tue Mobility A, Wed Calisthenics-Lower&Core, Thu HIIT, Fri Calisthenics-Upper, Sat Mobility B + MITT, Sun Rest = stretch only); daily items (stretch, jump rope, meditate, pray, journal); weekly items (run, family).
- **Today = a Calisthenics-Upper day** with a few items already done and a few pending, so the loop is visible immediately.
- The **exercise library** populated from Appendix A (warmup, cooldown, mobility A/B, MITT, HIIT, the Block A & B calisthenics movements, bar-free subs) — each with its text how-to and a **placeholder pixel "media" slot** (labeled, with an "add photo" affordance; do not fetch or fabricate real photos).
- **Calisthenics progression:** Block A = weeks 1–4, then **Block B from week 5 onward, continuously** (`weekIndex ≥ 5 → Block B`). Month 1 is intentionally skipped.
- ~2–3 weeks of **back-dated history** so the gap graph and rival lead aren't empty on first load.
- The activity catalog pre-filled with the **exact XP values above**.

## Definition of done

- Launches clean, **zero console errors**, looks intentional and premium on a phone.
- The **core loop is fully playable**: see today's items → complete them (incl. running the workout player + timer) → your XP rises, the gap recalculates → the rival climbs in real time / via the time control → cross an XP threshold and a character evolves.
- Logging a **run** (enter miles), checking **habits**, and logging an **extra workout (+5)** all update the ledger by the exact rules, including the run's hard-target penalty.
- All primary screens reachable; pixel-art aesthetic consistent throughout.
- Engine logic is pure and isolated; seed data is separated; README explains it.

Build the best version of this you can. **Prioritize, in order:** (1) the scoring engine being exactly correct, (2) the Arena + core loop, (3) the pixel-art feel and juice, (4) breadth across the remaining screens. If you must stub something, stub the deep editing screens — never the core loop or the math.
