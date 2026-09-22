import { describe, expect, it } from 'vitest';
import { streakStatus } from './streak';

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
