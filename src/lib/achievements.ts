/**
 * The course's real pace — XP earned per real minute spent — derived from
 * the actual path rather than assumed.
 *
 * `src/data/achievements.ts`'s `DAILY_GOALS` labels each goal with a minute
 * figure ("20 min a day"), and that number is not read by anything else —
 * `HomeScreen.tsx`'s progress ring and the SRS scheduler both key off `xp`
 * directly. So the label is pure description, and it goes stale exactly the
 * way `levelTitle`'s tier thresholds did (`gamification.ts`): a curriculum
 * change three files away moves the real pace, and nothing connects the two
 * unless something does the arithmetic. Found here first at 12.54 XP/min,
 * assumed against a course that (after URD-A02 attempt 1's vocabulary pass)
 * paid 3.95 — and now, after the rest of that item's own list of follow-on
 * work landed, pays 4.77 (script track; measured directly, see
 * `achievements.test.ts`). Not a monotonic drift in one direction — the
 * point is only that it moves whenever lesson content moves, in either
 * direction, and nothing before this connected the two.
 *
 * `DAILY_GOALS`'s `minutes`/`desc` stay hand-set rather than computed at
 * import time — not because this is the same shape of problem `levelTitle`
 * is (it isn't: `levelTitle` gates on `level`, from a fixed internal
 * formula that cannot drift with course content, where this rate already
 * has, twice — 12.54 → 3.95 → 4.77 XP/min). It is a real tradeoff, made the
 * other way: the alternative is a full-course exercise-generation pass
 * (every lesson, once) on every app load, and 150ms in this repo's own
 * Node scripts is not evidence about a phone's JS engine — this project has
 * paid for exactly that class of mistake before (`check:shape`'s own
 * unmemoised `buildLessonExercises` calls, URD-011). `courseXpPerMinute`
 * below exists for a test to hold the hand-set numbers honest instead, so a
 * drift is a loud, CI-blocking test failure (`npm test` gates
 * deploy-preview.yml) rather than a silent one — a real, if softer,
 * insurance than `levelTitle`'s, not the identical guarantee.
 */

import { ALL_LESSONS, type Lesson } from '../data/units';
import { buildLessonExercises } from '../exercises/generator';

/** Matches scripts/check-shape.js's own estimate — the two should move
 *  together; if that number is retuned, this one should be too. */
const SECS_PER_EXERCISE = 9;

/**
 * Reading and dialogue lessons don't fit the "N exercises × 9 seconds"
 * model at all — a passage is one long "exercise" a learner spends real
 * minutes reading, not nine seconds tapping an option. check-shape.js
 * excludes them from its own length-band check for the identical reason
 * (`HAS_SESSION_LENGTH`); counting them here would pull the average toward
 * a number that describes neither kind of lesson accurately.
 */
const paced = (l: Lesson) => l.kind !== 'reading' && l.kind !== 'dialogue';

let cached: number | null = null;

/**
 * Real XP per real minute, averaged across the whole course (weighted by
 * lesson length, not lesson count) on the script track — the app's default
 * (`useSettingsStore.ts`), and so what almost every learner actually sees.
 * Memoised: every caller in one process gets the same course, and this
 * walks the entire path once per call otherwise.
 */
export function courseXpPerMinute(): number {
  if (cached != null) return cached;
  let totalXp = 0;
  let totalSeconds = 0;
  for (const lesson of ALL_LESSONS.filter(paced)) {
    totalXp += lesson.xp;
    totalSeconds += buildLessonExercises(lesson, [], 'both').length * SECS_PER_EXERCISE;
  }
  cached = totalXp / (totalSeconds / 60);
  return cached;
}

/** How many real minutes a daily-goal XP target actually takes, today. */
export function minutesForGoalXp(xp: number): number {
  return xp / courseXpPerMinute();
}
