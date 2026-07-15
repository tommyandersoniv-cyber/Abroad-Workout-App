# Progress

Last updated: 2026-07-15

## Done
- **Muay Thai workout + full-credit swap** (2026-07-15) — new `muay-thai`
  workout (6 new striking exercises), new `Workout.fullCreditSwap` flag so
  swapping it in for the assigned workout banks the full +10 instead of the
  usual swap +5. Verified live. 84/84 tests, clean build. Uncommitted.
- **12-hour grace period feature** (2026-07-15) — shipped, meets contract.md
  (all 12 criteria G1–G12 checked and passing). `inGraceWindow`/`graceDateKey`
  in engine/time.ts, `graceLog` store action, new drawer-menu `Grace.tsx`
  screen (UI placement moved off Today.tsx per user feedback mid-session).
  84/84 tests (12 new), clean build, verified live in the browser (toggle
  on/off round-trip, noon cutoff hides the drawer item both directions via
  demoOffsetMs). Uncommitted (per rule: commit only when asked).
- Full-app review + remediation (2026-07-03) — shipped, meets contract.md (all 11
  criteria checked and passing; see log.md for the findings list). 56/56 tests,
  clean build, verified in the running app.

## In Flight
- **Exercise photos feature (NOT from this session)** — uncommitted working-tree
  changes predating the review: `photoUrl` on exercises, `public/images/`, edits to
  PixelMedia/ExerciseDetail/ExerciseLibrary/WorkoutPlayer/ExtraWorkout. Builds and
  runs fine. Needs review + commit decision.
- Review-remediation changes and the grace-period feature are both in the working
  tree, uncommitted (per rule: commit only when asked). tsbuildinfo removal is staged.

## Blocked
- Multi-agent workflows — org monthly Claude spend limit hit 2026-07-03; subagents
  fail until the limit resets/raises. Inline work unaffected.

## Current Bottleneck
Judgment — three prior-session items still need a product decision from Tommy:
(1) drop or use the unused DOB signup field, (2) delete the `* copy.md` template
files, (3) whether to commit the in-flight photos feature. The grace-period
feature itself is fully verified and just needs a commit decision.

## Next Session Should Start With
Decide the flagged items above, then commit in logical groups (photos feature,
review remediation, and grace-period feature as separate commits, most likely).
