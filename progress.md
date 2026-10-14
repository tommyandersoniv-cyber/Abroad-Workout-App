# Progress

Last updated: 2026-10-14

## Done
- **v2 "Full Day" built** on branch `v2` (uncommitted). Rev 6 layout (To Do · Today · Progress) done. Graded in contract.md
  "Results": 27 of 32 pass outright. 5 are [~] and can only be checked on an
  iPhone (buzzer/beeps, wake lock, offline, calendar import, live pause test).
  16/16 tests, clean build.
- Old app preserved at tag `rival-v1`.

## In Flight
- Committed (2f51268) and merged to main locally. **Push to GitHub failed (auth)**, so Netlify has not deployed yet.

## Blocked
- Nothing.

## Current Bottleneck
Verifying: on-device checks on Tommy's iPhone. Add to Home Screen, then:
import calendar reminders, hear the buzzer (ringer on), screen stays awake
during a timer, works in airplane mode.

## Next Session Should Start With
Tommy's on-iPhone results for the [~] items in contract.md, then fix whatever
doesn't hold up.
