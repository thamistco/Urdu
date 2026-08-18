import { describe, expect, it } from 'vitest';

import { courseXpPerMinute, minutesForGoalXp } from './achievements';
import { DAILY_GOALS } from '../data/achievements';

/**
 * URD-009: `DAILY_GOALS`' `minutes`/`desc` labels ("20 min a day") were
 * hand-set once, at 12.54 XP/min — a number nothing in the app re-checks
 * against the real path, so a curriculum change three files away can move
 * the real pace and leave the label describing a course that no longer
 * exists. Measured at the time this item was filed: the course had already
 * moved to 3.95 XP/min after one curriculum pass, making "20 min a day"
 * really 30.4 minutes.
 *
 * These stay hand-set data rather than computed at import time (see
 * `src/lib/achievements.ts`'s own header for why), so this test is what
 * keeps them honest: it computes the real rate from the real path and
 * fails the moment a label drifts too far from what that rate implies —
 * the same shape `gamification.test.ts` already holds `levelTitle`'s tiers
 * to, for the identical reason.
 */

describe('the daily goal labels describe the real course', () => {
  it('computes a real, positive, finite rate from the actual path', () => {
    const rate = courseXpPerMinute();
    expect(rate).toBeGreaterThan(0);
    expect(Number.isFinite(rate)).toBe(true);
  });

  // The property this item exists for. A label allowed to be off by more
  // than a minute is exactly the gap that let "20 min a day" stand in for
  // 30.4 — this is the number that must go red first when the course moves
  // again, not a downstream symptom three files later.
  it('every goal is within a minute of what the real course pace implies', () => {
    for (const goal of DAILY_GOALS) {
      const real = minutesForGoalXp(goal.xp);
      expect(Math.abs(goal.minutes - real)).toBeLessThanOrEqual(1);
    }
  });

  it("desc matches minutes — the label doesn't quote a different number than it displays", () => {
    for (const goal of DAILY_GOALS) {
      expect(goal.desc).toBe(`${goal.minutes} min a day`);
    }
  });

  it('a bigger XP target always means more real minutes', () => {
    const sorted = [...DAILY_GOALS].sort((a, b) => a.xp - b.xp);
    for (let i = 1; i < sorted.length; i++) {
      expect(minutesForGoalXp(sorted[i].xp)).toBeGreaterThan(minutesForGoalXp(sorted[i - 1].xp));
    }
  });
});
