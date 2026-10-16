/**
 * World Urdu Day, 9 November, the birthday of Muhammad Iqbal: a public holiday
 * in Pakistan (Iqbal Day) and marked by Urdu committees and schools in India.
 * The front door names it from the 7th to the 12th, by the learner's own
 * calendar, so the long weekend before it and the days after a post about it
 * all land on a screen that says why today (marketing review, 2026-10-11,
 * P-040; dates checked 2026-10-16).
 *
 * The line names the day, not Iqbal: the same screen opens for learners on
 * both sides of the border.
 */
// Non-breaking spaces keep "9 November" whole and the dot with the day: at
// 200% zoom the line broke as "WORLD URDU / DAY · 9 / NOVEMBER".
export const URDU_DAY_LINE = 'World Urdu Day\u00a0· 9\u00a0November';

const NOVEMBER = 10;
const FIRST = 7;
const LAST = 12;

/** The line to show on `now`'s local date, or null outside 7 to 12 November. */
export function urduDayLine(now: Date = new Date()): string | null {
  if (now.getMonth() !== NOVEMBER) return null;
  const d = now.getDate();
  return d >= FIRST && d <= LAST ? URDU_DAY_LINE : null;
}
