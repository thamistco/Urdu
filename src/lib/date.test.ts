import { describe, expect, it } from 'vitest';

import { dayKey, daysBetween, isSameDay, lastSevenDayKeys } from './date';

/**
 * Streak arithmetic.
 *
 * These four functions decide whether a learner keeps a streak they earned, so
 * the interesting cases are the ones that only happen a few times a year and
 * are therefore never hit by hand: month ends, year ends, and leap days. Those
 * are exactly the dates a date bug hides behind.
 *
 * Deliberately local-time throughout, matching `dayKey` — "today" for a learner
 * is their today, not UTC's.
 */

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0);

describe('dayKey', () => {
  it('formats as YYYY-MM-DD with padding', () => {
    expect(dayKey(at(2026, 1, 5))).toBe('2026-01-05');
    expect(dayKey(at(2026, 12, 31))).toBe('2026-12-31');
  });

  it('is stable across the hours of one local day', () => {
    const morning = new Date(2026, 5, 14, 0, 0, 1);
    const night = new Date(2026, 5, 14, 23, 59, 59);
    expect(dayKey(morning)).toBe(dayKey(night));
  });
});

describe('daysBetween', () => {
  it('is zero for the same day', () => {
    expect(daysBetween('2026-03-09', '2026-03-09')).toBe(0);
  });

  it('counts one across a month boundary', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetween('2026-04-30', '2026-05-01')).toBe(1);
  });

  it('counts one across a year boundary', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('handles the leap day in both directions', () => {
    expect(daysBetween('2028-02-28', '2028-02-29')).toBe(1);
    expect(daysBetween('2028-02-29', '2028-03-01')).toBe(1);
    // 2027 is not a leap year, so February has 28 days.
    expect(daysBetween('2027-02-28', '2027-03-01')).toBe(1);
  });

  it('is negative when the second day is earlier', () => {
    expect(daysBetween('2026-03-10', '2026-03-09')).toBe(-1);
  });

  it('is antisymmetric', () => {
    expect(daysBetween('2026-01-01', '2026-06-15')).toBe(-daysBetween('2026-06-15', '2026-01-01'));
  });

  /**
   * The one that matters for streaks: a day that crosses a daylight-saving
   * boundary is still one day. `Math.round` in `daysBetween` is what makes that
   * true, and this is the test that stops someone "simplifying" it away.
   *
   * Two things had to be right before this test could fail at all, and neither
   * was, first time round:
   *
   *  - **The timezone.** It is pinned to Europe/London in vitest.config.ts.
   *    Under UTC — which this container and the CI runner both use — there is
   *    no DST, so the test passed happily with the rounding deleted.
   *  - **The dates.** The clocks change *on* the Sunday at 01:00, so the short
   *    day runs from the 29th to the 30th, not the 28th to the 29th. Measured
   *    rather than assumed: 29→30 March is 23 hours, 25→26 October is 25.
   *
   * Verified by deleting the `Math.round` and watching these fail.
   */
  it('counts DST transition days as exactly one day', () => {
    expect(daysBetween('2026-03-29', '2026-03-30')).toBe(1); // spring forward: a 23-hour day
    expect(daysBetween('2026-10-25', '2026-10-26')).toBe(1); // fall back: a 25-hour day
  });

  it('spans a DST boundary correctly over a longer gap', () => {
    // A week containing the short day is still seven days.
    expect(daysBetween('2026-03-26', '2026-04-02')).toBe(7);
    expect(daysBetween('2026-10-22', '2026-10-29')).toBe(7);
  });
});

describe('isSameDay', () => {
  it('is true only for identical keys', () => {
    expect(isSameDay('2026-07-30', '2026-07-30')).toBe(true);
    expect(isSameDay('2026-07-30', '2026-07-31')).toBe(false);
  });
});

describe('lastSevenDayKeys', () => {
  it('returns seven distinct days', () => {
    const keys = lastSevenDayKeys(at(2026, 7, 30));
    expect(keys).toHaveLength(7);
    expect(new Set(keys).size).toBe(7);
  });

  it('ends with today, oldest first', () => {
    const today = at(2026, 7, 30);
    const keys = lastSevenDayKeys(today);
    expect(keys[6]).toBe(dayKey(today));
    expect(keys[0]).toBe('2026-07-24');
  });

  it('is contiguous — one day apart all the way along', () => {
    const keys = lastSevenDayKeys(at(2026, 3, 2));
    for (let i = 1; i < keys.length; i++) {
      expect(daysBetween(keys[i - 1], keys[i])).toBe(1);
    }
  });

  it('walks back correctly across a month boundary', () => {
    expect(lastSevenDayKeys(at(2026, 3, 2))[0]).toBe('2026-02-24');
  });

  it('walks back correctly across a year boundary', () => {
    expect(lastSevenDayKeys(at(2026, 1, 3))[0]).toBe('2025-12-28');
  });

  it('walks back correctly across a leap day', () => {
    expect(lastSevenDayKeys(at(2028, 3, 3))[0]).toBe('2028-02-26');
  });
});
