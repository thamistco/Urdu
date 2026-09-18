/**
 * Urdu-Indic digits, and the two facts about them worth putting in one place.
 *
 * Urdu is written right to left; its numbers are not. ۴۷ is forty-seven, read
 * in the same direction as 47, sitting inside a line that runs the other way.
 * That is the single thing a learner gets wrong, and it is why `reversedOf`
 * exists here rather than as an incidental expression inside the generator:
 * the exercise builds its distractor from it and the screen names the mistake
 * with it, and those two have to be the same function or the hint appears over
 * a tile that is not the reversal.
 */

/** ۰ to ۹, in value order, so `URDU_DIGITS[n]` is the glyph for `n`. */
export const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** 47 → "۴۷". Digit for digit, so the order is the number's own. */
export function toUrduDigits(n: number): string {
  return [...String(n)].map((d) => URDU_DIGITS[Number(d)] ?? d).join('');
}

/** "۴۷" → 47. */
export function fromUrduDigits(glyphs: string): number {
  return Number([...glyphs].map((g) => String(URDU_DIGITS.indexOf(g as (typeof URDU_DIGITS)[number]))).join(''));
}

/** 47 → 74. The mistake a right-to-left reader makes, named once. */
export function reversedOf(n: number): number {
  return Number([...String(n)].reverse().join(''));
}
