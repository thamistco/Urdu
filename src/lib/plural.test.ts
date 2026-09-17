import { describe, it, expect } from 'vitest';
import { count } from './plural';

/**
 * The property this exists to hold is not "adds an s" — it is that the noun
 * agrees with the number *at one*, which is the only value the app had ever
 * got wrong and the only one a brand new learner is guaranteed to meet.
 *
 * So the case that must fail if the guard is deleted is asserted first and on
 * its own: a naive `${n} ${word}s` passes every other test in this file.
 */
describe('count', () => {
  it('uses the singular at exactly one', () => {
    expect(count(1, 'day')).toBe('1 day');
    expect(count(1, 'gem')).toBe('1 gem');
  });

  it('uses the plural everywhere else, including zero', () => {
    expect(count(0, 'day')).toBe('0 days');
    expect(count(2, 'day')).toBe('2 days');
    expect(count(12, 'day')).toBe('12 days');
  });

  it('takes an explicit plural where English does not just add an s', () => {
    expect(count(1, 'try', 'tries')).toBe('1 try');
    expect(count(3, 'try', 'tries')).toBe('3 tries');
  });

  /**
   * A streak is a run of days, so 1 is not an error state to be routed around
   * — "1 day in a row" is a true and cheerful thing to say on the day someone
   * starts. The sentence the completion screen builds is asserted whole,
   * because the defect was in the sentence rather than in the number.
   */
  it('builds the streak line the completion screen shows', () => {
    expect(`${count(1, 'day')} in a row.`).toBe('1 day in a row.');
    expect(`${count(7, 'day')} in a row.`).toBe('7 days in a row.');
  });
});
