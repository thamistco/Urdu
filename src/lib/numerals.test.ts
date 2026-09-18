import { describe, it, expect } from 'vitest';
import { URDU_DIGITS, toUrduDigits, fromUrduDigits, reversedOf } from './numerals';
import { NUMERALS } from '../data/art';
import { WORDS } from '../data/words';

describe('Urdu digits', () => {
  it('writes a number in the same order it is read', () => {
    // Not a transcription of the implementation: the property is that the
    // digits keep their places, which is the whole thing the exercise teaches.
    expect(toUrduDigits(47)).toBe('۴۷');
    expect(toUrduDigits(47)).not.toBe('۷۴');
    expect(toUrduDigits(1990)).toBe('۱۹۹۰');
  });

  it('round-trips', () => {
    for (let n = 0; n < 200; n++) expect(fromUrduDigits(toUrduDigits(n))).toBe(n);
  });

  it('reverses the digits, which is the mistake the exercise is about', () => {
    expect(reversedOf(47)).toBe(74);
    expect(reversedOf(10)).toBe(1); // "01"
  });

  /**
   * The map of pictures and this table have to agree, because the exercise
   * draws its question with `toUrduDigits` and the course draws the same
   * numbers on word cards with `NUMERALS`. Two spellings of ۵۰ on two screens
   * is the kind of thing nobody notices until a learner does.
   *
   * Only the words whose meaning is a bare number are listed: "hundred
   * thousand" is a name rather than a numeral, so it is left out instead of
   * guessed at.
   */
  it('agrees with the numerals the course already draws on word cards', () => {
    const known: Record<string, number> = {
      'w-sifar': 0,
      'w-ek': 1,
      'w-do': 2,
      'w-das': 10,
      'w-bees': 20,
      'w-tees': 30,
      'w-chalees': 40,
      'w-pachaas': 50,
      'w-saath': 60,
      'w-sattar': 70,
      'w-assi': 80,
      'w-nabbe': 90,
      'w-sau': 100,
    };
    for (const [id, n] of Object.entries(known)) {
      expect(
        WORDS.find((w) => w.id === id),
        `${id} is not a word any more`
      ).toBeDefined();
      expect(NUMERALS[id], `${id} has no numeral`).toBeDefined();
      expect(NUMERALS[id], `${id} draws ${NUMERALS[id]} but is ${n}`).toBe(toUrduDigits(n));
    }
  });

  it('every number word the course draws a numeral for draws a real one', () => {
    for (const [id, glyphs] of Object.entries(NUMERALS)) {
      expect(
        [...glyphs].every((g) => (URDU_DIGITS as readonly string[]).includes(g)),
        `${id}: ${glyphs}`
      ).toBe(true);
    }
  });
});
