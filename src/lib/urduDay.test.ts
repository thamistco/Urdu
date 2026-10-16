import { describe, expect, it } from 'vitest';
import { urduDayLine, URDU_DAY_LINE } from './urduDay';

// Local time throughout, as the learner's calendar is (the suite runs in
// Europe/London; see vitest.config.ts).
const at = (m: number, d: number, h = 12, min = 0, y = 2026) => new Date(y, m - 1, d, h, min);

describe('urduDayLine', () => {
  it('shows from the first minute of 7 November to the last of the 12th', () => {
    expect(urduDayLine(at(11, 7, 0, 0))).toBe(URDU_DAY_LINE);
    expect(urduDayLine(at(11, 9))).toBe(URDU_DAY_LINE);
    expect(urduDayLine(at(11, 12, 23, 59))).toBe(URDU_DAY_LINE);
  });
  it('does not show on the 6th or the 13th', () => {
    expect(urduDayLine(at(11, 6, 23, 59))).toBeNull();
    expect(urduDayLine(at(11, 13, 0, 0))).toBeNull();
  });
  it('does not show on the same days of another month', () => {
    expect(urduDayLine(at(10, 9))).toBeNull();
    expect(urduDayLine(at(12, 9))).toBeNull();
  });
  it('comes back every year', () => {
    expect(urduDayLine(at(11, 9, 12, 0, 2027))).toBe(URDU_DAY_LINE);
  });
});
