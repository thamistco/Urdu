import { dayKey, daysBetween } from './date';

/**
 * Whether a learner's streak needs today's lesson to survive, and the app is
 * the only place that can tell them so.
 *
 * There is no push notification here — see the note where this is called
 * from HomeScreen for why. This is the fallback that works today: whatever a
 * learner sees the next time they open the app, computed from data the store
 * already keeps, rather than a reminder sent while it is closed.
 *
 * `'none'` covers every case where nothing is owed: no streak yet, already
 * played today, or a gap of more than one day — which means the streak has
 * already reset elsewhere (`useProgressStore`'s own `daysBetween` check, on
 * the same grade path this reads from) before this ever runs. This function
 * does not reset anything itself; it only describes today.
 *
 * A gap of exactly one day is the only "already played today" case *and* the
 * only "at risk" case are not separate branches here: a gap of 0 already
 * fails `=== 1`, so folding the same-day check in explicitly would have added
 * a line no test could tell apart from its absence — a test that cannot fail
 * is worse than no test, and dead branches are how one gets written.
 *
 * The `lastActiveDay` null guard below is real but not provable by a unit
 * test alone: `daysBetween(null, today)` produces `NaN` through the same
 * coercion that made the redundant branch above look necessary, and
 * `NaN === 1` happens to also be false — so a test cannot distinguish the
 * guard's presence from its absence by output. What actually enforces it is
 * `tsc`: `daysBetween`'s signature is `(string, string)`, and removing the
 * guard is a compile error, confirmed by deliberately removing it and
 * reading the error rather than assuming one would appear.
 */
export type StreakStatus = 'none' | 'at-risk';

export function streakStatus(streak: number, lastActiveDay: string | null, now: Date = new Date()): StreakStatus {
  if (streak <= 0) return 'none';
  if (!lastActiveDay) return 'none';

  const today = dayKey(now);
  return daysBetween(lastActiveDay, today) === 1 ? 'at-risk' : 'none';
}
