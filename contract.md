# Contract: Full-app review remediation

Started: 2026-07-03

## Goal
Fix the confirmed bugs, architectural inconsistencies, and dead code found in the
2026-07-03 whole-app review (see log.md for the findings list).

## Acceptance Criteria
Testable, falsifiable:

- [x] **C1 — Day-key consistency**: `grep -rn "toISOString" src` returns zero hits;
      `selectGapHistory` keys come from the local-time `dateKey()`. ✅ grep = 0 hits.
- [x] **C2 — DST-safe calendar stepping**: a DST-safe `addDays()` helper exists in
      `src/engine/time.ts`; `endOfDay`/`endOfWeek` return the true next-midnight even on
      a 25-hour day; no remaining `+= MS_DAY`, `+= MS_WEEK`, or `± i * MS_DAY`-style
      day/week stepping anywhere in `src/` outside `time.ts` itself (verified by grep);
      a unit test crossing the 2026 European fall-back (Oct 25) proves `addDays` visits
      each calendar day exactly once and `resolveMisses` emits no duplicate miss ids.
      ✅ grep clean (remaining `MS_DAY` hits are test fixtures + one intentional
      duration subtraction in `selectGapTrend`, which compares moments, not days);
      7 new tests in `src/engine/time.test.ts` pass under TZ=Europe/Berlin.
- [x] **C3 — Savings double-log guard**: calling `logToday()` twice within the same
      challenge/pace period logs exactly one contribution (second call returns 0);
      covered by a unit test. ✅ 4 tests in `src/store/useSavingsStore.test.ts`; also
      verified live in the browser (two taps on SAVE $1 → one $1 contribution).
- [x] **C4 — Period-correct quick-save**: `selectQuickSave`'s `done` window uses the
      challenge's own period boundaries (goal-start-anchored; two weeks for biweekly),
      not the calendar week; covered by a unit test on the new period-start helper.
      ✅ `src/savings/periods.test.ts` (weekly anchored to a Wednesday start; biweekly
      spans 14 days).
- [x] **C5 — Arena messaging**: after the guard, the SavingsArena SAVE button reports
      "already banked" distinctly from "goal complete". ✅ code-verified branch on
      `v.complete`; live double-tap produced no second contribution (toast text itself
      not captured — transient).
- [x] **C6 — Retired difficulty machinery removed**: `Difficulty`, `HOLD_FRACTION`,
      `holdFractionFor`, `setDifficulty`, and `rival.difficulty` no longer exist in
      `src/` (grep zero hits); build passes. ✅ only remaining hit is an explanatory
      comment in `engine/types.ts`. Old persisted `rival.difficulty` keys hydrate
      harmlessly (verified live).
- [x] **C7 — Dead exports removed**: `selectTommyXP`, `advanceClock`, `skipToTonight`,
      `advanceWeek`, `eachDay`, `clamp`, `daysInMonth`, `daysInYear`, the
      `endOfDay/endOfWeek/startOfWeek` re-export from useGameStore, and the
      `ALL_ACTIVITIES`/`startOfWeek` re-exports from lib/today are gone (grep zero hits). ✅
- [x] **C8 — Persistence hardening**: `useGameStore.init()` guards non-array `log` and
      non-object `deferrals`/`runCarry` the same way the savings store guards
      `contributions`. ✅
- [x] **C9 — Security headers**: `public/_headers` and `netlify.toml` both set
      `X-Frame-Options`, `X-Content-Type-Options: nosniff`, and a `Referrer-Policy`
      for `/*`, and stay mutually consistent. ✅
- [x] **C10 — Repo hygiene**: `*.tsbuildinfo` is gitignored and both tracked
      tsbuildinfo files are removed from the index (staged, not committed). ✅
- [x] **C11 — Green**: `npm test` passes — 56 tests (41 existing + 15 new) — and
      `npm run build` completes with no TypeScript errors. ✅ Also verified in the
      running app: boots clean, no console errors, both modes render, old
      localStorage hydrates.

## Out of Scope (flagged for the user instead)
- Removing the DOB field from Signup (unused PII — product/UX decision).
- Deleting the untracked `* copy.md` template files at the repo root.
- Renaming the repo folder ("Abroad Workout App" vs product name RIVAL).
- Full audit of `src/index.css` for unused classes.

## Status
- [x] Contract agreed (user pre-authorized "propose and implement fixes"; autonomous session)
- [x] Built
- [x] Checked against every criterion above
- [x] Done

## Notes
Seed-log generation (`seed/history.ts`) also stepped raw ms; fixed alongside C2 since
it shares the helper.
