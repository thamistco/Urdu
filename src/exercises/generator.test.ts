import { describe, expect, it } from 'vitest';

import { distractLetters, OPTIONS_PER_QUESTION, soundsOverlap, soundTokens } from './generator';
import { getLetter, LETTERS, type Letter } from '../data/letters';

/** `soundTokens` only ever reads `.sound`, so a test double needs nothing else. */
const withSound = (sound: string): Letter => ({ sound }) as Letter;

/**
 * URD-007: ذ ز ض ظ are four different letters Urdu speakers hear as one
 * sound, so `letterPick` ("which letter makes this sound?") offering two of
 * them has two right answers. `check:answerable` catches this whole-system,
 * over 107,610 generated exercises across both tracks — real and thorough,
 * but probabilistic (6 random passes) and slow to run for iterating on the
 * fix itself. These tests assert the same property directly against the two
 * pure functions it depends on, for every letter rather than a sample.
 */

describe('soundTokens / soundsOverlap', () => {
  it('strips a parenthetical aside', () => {
    expect(soundTokens(withSound('h (aspirate)'))).toEqual(['h']);
    expect(soundTokens(withSound('ḍ (hard)'))).toEqual(['ḍ']);
  });

  it('is case-insensitive', () => {
    expect(soundTokens(withSound('Z'))).toEqual(soundTokens(withSound('z')));
  });

  it('splits a multi-reading sound into separate tokens', () => {
    expect(soundTokens(withSound('a / aa'))).toEqual(['a', 'aa']);
  });

  it('every letter in the course has a non-empty sound', () => {
    for (const l of LETTERS) expect(soundTokens(l).length).toBeGreaterThan(0);
  });

  it('overlap is symmetric and requires a shared token, not just a shared string prefix', () => {
    const a = withSound('a / aa');
    const b = withSound('aa');
    const c = withSound('k');
    expect(soundsOverlap(a, b)).toBe(true);
    expect(soundsOverlap(b, a)).toBe(true);
    expect(soundsOverlap(a, c)).toBe(false);
  });

  // CURRICULUM CRITIC reviewing this item: a first version compared one
  // normalized string per letter, so it caught "z" === "z" but missed that
  // "a / aa" (alif) and "aa" (alif-madda) are different strings sharing one
  // reading — sampled 2,902 of 3,000 real generations offering both
  // together. Named explicitly, the same way the four ز-sound letters are
  // named below, so this specific regression can't come back unnoticed.
  it('alif overlaps both alif-madda and ain, which do not overlap each other', () => {
    const alif = getLetter('alif')!;
    const alifMadda = getLetter('alif-madda')!;
    const ain = getLetter('ain')!;
    expect(soundsOverlap(alif, alifMadda)).toBe(true);
    expect(soundsOverlap(alif, ain)).toBe(true);
    expect(soundsOverlap(alifMadda, ain)).toBe(false);
  });

  // The rest of the known homophone sets, named explicitly so a future change
  // to letters.ts that quietly breaks one of them fails loudly here rather
  // than only showing up as a rarer collision in check:answerable's random
  // sampling. Grouped by single-token equality here (each of these letters
  // has exactly one reading) — the alif/alif-madda/ain overlap above already
  // covers the multi-reading case, which cannot be grouped this way since
  // alif-madda and ain end up in different groups despite alif overlapping
  // both.
  it('groups the known single-reading homophone sets, and nothing else, together', () => {
    const singleReading = LETTERS.filter((l) => soundTokens(l).length === 1);
    const groups: Record<string, string[]> = {};
    for (const l of singleReading) (groups[soundTokens(l)[0]] ??= []).push(l.id);
    const multi = Object.values(groups)
      .filter((ids) => ids.length > 1)
      .map((ids) => [...ids].sort());
    expect(multi).toEqual(
      [
        ['te', 'toe'],
        ['se', 'seen', 'swaad'],
        ['baRi-he', 'choti-he', 'do-chashmi-he'],
        ['zaal', 'ze', 'zoe', 'zwaad'],
      ].map((g) => [...g].sort())
    );
  });
});

describe('distractLetters', () => {
  const n = OPTIONS_PER_QUESTION - 1;

  it('never offers a distractor that sounds like the target, or like another distractor', () => {
    // Every letter, not a sample — this is the property URD-007 exists for,
    // and it is cheap enough to check exhaustively rather than randomly.
    for (const letter of LETTERS) {
      const options = [letter, ...distractLetters(letter, n)];
      for (let i = 0; i < options.length; i++) {
        for (let j = i + 1; j < options.length; j++) {
          expect(soundsOverlap(options[i], options[j])).toBe(false);
        }
      }
    }
  });

  it('never offers the target letter itself as a distractor', () => {
    for (const letter of LETTERS) {
      expect(distractLetters(letter, n).some((d) => d.id === letter.id)).toBe(false);
    }
  });

  it('returns as many distractors as asked for, given the real letter set', () => {
    // Not a guarantee in general (see the comment on distractLetters itself)
    // — but true today, with 32 distinct readings among 40 letters and only
    // 3 ever needed, and worth knowing the moment it stops being true.
    for (const letter of LETTERS) {
      expect(distractLetters(letter, n)).toHaveLength(n);
    }
  });
});
