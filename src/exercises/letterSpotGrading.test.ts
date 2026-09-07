import { describe, it, expect } from 'vitest';
import { isCorrectTap } from './letterSpotGrading';
import { getLetter } from '../data/letters';
import { getWord } from '../data/words';
import type { Exercise } from './types';

type SpotEx = Extract<Exercise, { kind: 'letterSpot' }>;

function spotEx(overrides: Partial<SpotEx> = {}): SpotEx {
  return {
    kind: 'letterSpot',
    letter: getLetter('alif')!,
    word: getWord('w-paani')!,
    tiles: ['پا', 'پان', 'انی', 'نی'],
    fromWord: [true, true, true, true],
    correct: [true, false, false, false],
    wordBreakAfter: [false, false, false, false],
    ...overrides,
  };
}

describe('isCorrectTap', () => {
  // THE CRITIC, URD-045: mutating LetterSpot.tsx's inline correctness check
  // to "always true" passed every existing check — generator.test.ts tests
  // the generator's output, not the component's own grading decision, and a
  // full component render is blocked entirely (see this module's own doc
  // comment). These directly exercise the one line that decision now lives
  // in, isolated from anything react-native.
  it('is true for the tile marked correct', () => {
    expect(isCorrectTap(spotEx(), 0)).toBe(true);
  });

  it('is false for a tile not marked correct', () => {
    expect(isCorrectTap(spotEx(), 1)).toBe(false);
    expect(isCorrectTap(spotEx(), 2)).toBe(false);
    expect(isCorrectTap(spotEx(), 3)).toBe(false);
  });

  it('is true for every tile a word with a repeated letter marks correct, not only the first', () => {
    // A word can hold the taught letter more than once — every occurrence
    // is a right answer, not only whichever one the learner taps first.
    const ex = spotEx({ correct: [true, false, true, false] });
    expect(isCorrectTap(ex, 0)).toBe(true);
    expect(isCorrectTap(ex, 2)).toBe(true);
    expect(isCorrectTap(ex, 1)).toBe(false);
  });

  it('is false, not a thrown error, for an out-of-range index', () => {
    expect(isCorrectTap(spotEx(), 99)).toBe(false);
  });
});
