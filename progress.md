# Progress

Last updated: 2026-07-15

## In Flight
- **12-hour grace period feature** (2026-07-15) — contract proposed in
  `contract.md` (G1–G12), awaiting user approval before implementation. Not
  started: engine helpers, store action, Today.tsx UI, tests all pending.

## Done
- Full-app review + remediation (2026-07-03) — shipped, meets contract.md (all 11
  criteria checked and passing; see log.md for the findings list). 56/56 tests,
  clean build, verified in the running app.

## In Flight
- **Exercise photos feature (NOT from this session)** — uncommitted working-tree
  changes predating the review: `photoUrl` on exercises, `public/images/`, edits to
  PixelMedia/ExerciseDetail/ExerciseLibrary/WorkoutPlayer/ExtraWorkout. Builds and
  runs fine. Needs review + commit decision.
- Review-remediation changes are in the working tree, uncommitted (per rule: commit
  only when asked). tsbuildinfo removal is staged.

## Blocked
- Multi-agent workflows — org monthly Claude spend limit hit 2026-07-03; subagents
  fail until the limit resets/raises. Inline work unaffected.

## Current Bottleneck
Judgment — the fixes work and are verified, but three flagged items need a product
decision from Tommy: (1) drop or use the unused DOB signup field, (2) delete the
`* copy.md` template files, (3) whether to commit the in-flight photos feature.

## Next Session Should Start With
Decide the three flagged items above, then commit the review remediation (suggest two
commits: the photos feature separately from the review fixes).
