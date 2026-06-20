// ─────────────────────────────────────────────────────────────────────────
// Fresh start: a real first-run begins empty on Day 1. You and both rivals are
// at 0; the ledger fills in as you log. (Demo Controls fast-forward the clock so
// you can watch the loop, and Reset to Seed returns here.)
// ─────────────────────────────────────────────────────────────────────────

import type { LogEntry } from '../engine/types'
import { ACTIVITIES } from './activities'

/** A fresh game starts with no logged history. */
export function buildSeedLog(_startMs: number, _nowMs: number): LogEntry[] {
  void _startMs
  void _nowMs
  return []
}

/** Sanity export: the catalog ids that exist. */
export const SEED_ACTIVITY_IDS = ACTIVITIES.map((a) => a.id)
