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
 * played today, or a gap of more than one day. In that last case the streak is
 * broken, and `rollStreak` below is what says so: the progress store runs it
 * once when the app opens (`rolloverStreak`) and again inside `finishLesson`,
 * so a broken streak reads 0 from the moment the app opens rather than only
 * after the next lesson. This comment used to claim the reset had "already
 * happened elsewhere before this ever runs"; it had not, because the only
 * reset was on the lesson path, and a learner back after a week saw their old
 * streak on Home until a lesson quietly dropped it to 1. This function still
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

/** The part of the progress store the streak rules read and write. */
export type StreakState = { streak: number; freezes: number; lastActiveDay: string | null };

/** The day before `key`, as a key. Through the calendar, so DST cannot skew it. */
function dayBefore(key: string): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

/**
 * Account for the days missed since `lastActiveDay`, without counting today.
 *
 * - Played today or yesterday: nothing to do.
 * - Missed some days, holding a freeze for each, with a streak to save: spend
 *   one freeze per missed day, and treat yesterday as covered by moving
 *   `lastActiveDay` to it. Today's lesson then extends the streak exactly as
 *   it would have.
 * - More missed days than freezes held: the streak is broken and reads 0
 *   until a lesson starts a new one, and the freezes are kept, since spending
 *   them would save nothing.
 *
 * One freeze per day, up to all three a learner can hold (daily review
 * 2026-10-07, P-008). It used to be one missed day only, so a learner who had
 * bought three freezes and missed two days lost the streak anyway, which is
 * not what "a freeze covers one missed day" leads anyone to expect. Slack
 * framed as reserves brought people back after a miss 55% of the time
 * against 37% for a hard goal (Sharif and Shu 2019).
 *
 * Safe to run any number of times in a day: after one run the gap is at most
 * one day, or the streak is 0, and neither changes again. The streak must be
 * above 0 to spend a freeze, so a run over an already-broken streak cannot
 * burn one on nothing.
 */
export function rollStreak(s: StreakState, today: string = dayKey()): StreakState & { froze: number } {
  if (!s.lastActiveDay || s.streak <= 0) return { ...s, froze: 0 };
  const gap = daysBetween(s.lastActiveDay, today);
  if (gap <= 1) return { ...s, froze: 0 };
  const missed = gap - 1;
  if (missed <= s.freezes) {
    return { streak: s.streak, freezes: s.freezes - missed, lastActiveDay: dayBefore(today), froze: missed };
  }
  return { ...s, streak: 0, froze: 0 };
}

/**
 * Count today, after `rollStreak` has accounted for any gap.
 *
 * A first lesson of the day extends a streak whose last day was yesterday and
 * starts one at 1 otherwise; a second lesson the same day changes nothing.
 */
export function markActiveToday(
  { streak, freezes, lastActiveDay }: StreakState,
  today: string = dayKey()
): StreakState & { increased: boolean } {
  // Only the streak's own fields go through, so a caller passing rollStreak's
  // result (with its `froze`) gets back a plain state, not a stale flag.
  if (lastActiveDay === today) return { streak, freezes, lastActiveDay, increased: false };
  const extends_ = streak > 0 && !!lastActiveDay && daysBetween(lastActiveDay, today) === 1;
  return { streak: extends_ ? streak + 1 : 1, freezes, lastActiveDay: today, increased: true };
}
