import { describe, expect, it } from 'vitest';
import { markActiveToday, rollStreak, streakStatus, type StreakState } from './streak';

/**
 * Deliberately local-time throughout, matching `date.ts` — "today" for a
 * learner is their today, not UTC's. See date.test.ts's own note on why the
 * boundary dates (month ends, year ends) are the ones worth naming rather
 * than trusting to arbitrary examples.
 *
 * The null-guard on `lastActiveDay` is checked by `tsc`, not here — see the
 * comment on `streakStatus` itself for why a unit test cannot tell the two
 * apart by output.
 */
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h, 0, 0);

describe('streakStatus', () => {
  it('is none with no streak yet, even the day after one was seeded', () => {
    expect(streakStatus(0, null, at(2026, 6, 14))).toBe('none');
    expect(streakStatus(0, '2026-06-13', at(2026, 6, 14))).toBe('none');
  });

  it('is none once today is already played', () => {
    expect(streakStatus(5, '2026-06-14', at(2026, 6, 14))).toBe('none');
  });

  it('is at-risk exactly one day after the last one played', () => {
    expect(streakStatus(5, '2026-06-13', at(2026, 6, 14))).toBe('at-risk');
  });

  it('is none once the gap is more than a day — the streak already broke elsewhere', () => {
    expect(streakStatus(5, '2026-06-10', at(2026, 6, 14))).toBe('none');
  });

  it('crosses a month boundary the same way daysBetween does', () => {
    expect(streakStatus(3, '2026-01-31', at(2026, 2, 1))).toBe('at-risk');
  });

  it('crosses a year boundary the same way', () => {
    expect(streakStatus(3, '2025-12-31', at(2026, 1, 1))).toBe('at-risk');
  });

  it('crosses a leap day the same way', () => {
    expect(streakStatus(3, '2028-02-28', at(2028, 2, 29))).toBe('at-risk');
  });

  it('holds across the hours of one local day, matching dayKey', () => {
    const morning = at(2026, 6, 14, 0);
    const night = at(2026, 6, 14, 23);
    expect(streakStatus(5, '2026-06-13', morning)).toBe('at-risk');
    expect(streakStatus(5, '2026-06-13', night)).toBe('at-risk');
  });
});

describe('rollStreak and markActiveToday', () => {
  const TODAY = '2026-03-30'; // the day after the UK clocks go forward, pinned in vitest.config
  const daysAgo = (n: number) => {
    const d = new Date(TODAY + 'T00:00:00');
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  };
  const at = (gap: number, freezes: number, streak = 12): StreakState => ({
    streak,
    freezes,
    lastActiveDay: daysAgo(gap),
  });

  it('shows a lapsed streak as broken at launch, not only after the next lesson', () => {
    expect(rollStreak(at(5, 0), TODAY).streak).toBe(0);
    expect(rollStreak(at(4, 2), TODAY).streak).toBe(0); // three missed days, two freezes
  });

  it('spends a freeze on one missed day and keeps the streak', () => {
    const r = rollStreak(at(2, 1), TODAY);
    expect(r).toMatchObject({ streak: 12, freezes: 0, lastActiveDay: daysAgo(1), froze: 1 });
  });

  it('spends one freeze for each missed day while there are enough', () => {
    expect(rollStreak(at(3, 3), TODAY)).toMatchObject({ streak: 12, freezes: 1, lastActiveDay: daysAgo(1), froze: 2 });
    expect(rollStreak(at(4, 3), TODAY)).toMatchObject({ streak: 12, freezes: 0, froze: 3 });
  });

  it('keeps the freezes when there are too few to save the streak', () => {
    expect(rollStreak(at(5, 3), TODAY)).toMatchObject({ streak: 0, freezes: 3, froze: 0 });
  });

  it('leaves a streak alone when yesterday or today was played', () => {
    for (const gap of [0, 1]) expect(rollStreak(at(gap, 1), TODAY)).toMatchObject({ streak: 12, freezes: 1, froze: 0 });
  });

  it('is safe to run twice in a day, and never burns a freeze on a broken streak', () => {
    for (const s of [at(2, 2), at(4, 2), at(1, 1), at(2, 0)]) {
      const once = rollStreak(s, TODAY);
      const twice = rollStreak(once, TODAY);
      expect(twice.streak).toBe(once.streak);
      expect(twice.freezes).toBe(once.freezes);
    }
  });

  /**
   * The promise that makes a launch-time rollover safe to add: opening the app
   * first must never change what the next lesson does to the streak. Asked of
   * every gap from same-day to three weeks, with and without freezes.
   */
  it('gives the same streak whether or not the app rolled it over at launch', () => {
    for (let gap = 0; gap <= 21; gap++) {
      for (const freezes of [0, 1, 3]) {
        const s = at(gap, freezes);
        const lessonOnly = markActiveToday(rollStreak(s, TODAY), TODAY);
        const launchFirst = markActiveToday(rollStreak(rollStreak(s, TODAY), TODAY), TODAY);
        expect(launchFirst, `gap ${gap}, ${freezes} freezes`).toEqual(lessonOnly);
      }
    }
  });

  it('gives the streak the rules promise after a lesson today, for every gap', () => {
    const promised = (gap: number, freezes: number) => {
      // Stated from the rules, not the code: same day changes nothing,
      // yesterday extends, and each missed day costs a freeze while they last.
      if (gap === 0) return { streak: 12, freezes };
      if (gap === 1) return { streak: 13, freezes };
      if (gap - 1 <= freezes) return { streak: 13, freezes: freezes - (gap - 1) };
      return { streak: 1, freezes };
    };
    for (let gap = 0; gap <= 10; gap++) {
      for (const freezes of [0, 1, 2, 3]) {
        const now = markActiveToday(rollStreak(at(gap, freezes), TODAY), TODAY);
        expect({ streak: now.streak, freezes: now.freezes }, `gap ${gap}, ${freezes} freezes`).toEqual(
          promised(gap, freezes)
        );
      }
    }
  });

  /**
   * Found by the P-008 second check: a learner who opened the app on each
   * missed day had the gap paid one freeze per launch, and then lost those
   * freezes when a later day broke the streak, while one who stayed away kept
   * theirs. Opening the app must change nothing about where a lesson lands,
   * and the count the lesson reports must be every freeze the gap cost.
   */
  it('ends the same whether the app was opened on every missed day or not at all', () => {
    const plusDays = (n: number) => {
      const d = new Date(TODAY + 'T00:00:00');
      d.setDate(d.getDate() + n);
      return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
    };
    for (let missed = 1; missed <= 6; missed++) {
      for (const freezes of [0, 1, 2, 3]) {
        const start: StreakState = { streak: 12, freezes, lastActiveDay: TODAY, freezesOnHold: 0 };
        const lessonDay = plusDays(missed + 1);
        const away = rollStreak(start, lessonDay, 3);
        let s: StreakState = start;
        for (let d = 1; d <= missed + 1; d++) s = rollStreak(s, plusDays(d), 3);
        const label = `${missed} missed, ${freezes} freezes`;
        const pick = (r: StreakState) => ({ streak: r.streak, freezes: r.freezes, held: r.freezesOnHold });
        expect(pick(s), label).toEqual(pick(away));
        expect(markActiveToday(s, lessonDay), label).toEqual(markActiveToday(away, lessonDay));
        // What the lesson reports: every freeze spent, or none over a break.
        expect(s.freezesOnHold, label).toBe(missed <= freezes ? missed : 0);
      }
    }
  });

  it('starts a first-ever streak at 1 and does not count a second lesson the same day', () => {
    expect(markActiveToday({ streak: 0, freezes: 1, lastActiveDay: null }, TODAY)).toMatchObject({
      streak: 1,
      increased: true,
    });
    expect(markActiveToday(at(0, 1), TODAY)).toMatchObject({ streak: 12, increased: false });
  });
});
