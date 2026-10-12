import { describe, it, expect } from 'vitest';
import { matchesWord, nearMiss, romanSkeleton } from './roman';

describe('matchesWord', () => {
  it('folds the conventions romanisers disagree about', () => {
    expect(matchesWord('kitab', 'کتاب', 'kitaab')).toBe(true);
    expect(matchesWord('chay', 'چائے', 'chai')).toBe(true);
    expect(matchesWord('kalam', 'قلم', 'qalam')).toBe(true);
  });

  it('keeps the vowel that is grammar', () => {
    expect(matchesWord('ka', 'کی', 'ki')).toBe(false);
  });
});

/**
 * The spellings QA testers had refused (2026-10-12), against the two kinds of
 * answer that must stay wrong: a different word, and a short word.
 */
describe('nearMiss', () => {
  const taken = new Set(['zehn', 'ret', 'rat', 'garam', 'kharch'].map(romanSkeleton));

  it.each([
    ['garm', 'garam'],
    ['chadhna', 'chaṛhna'],
    ['budhaapa', 'buṛhaapa'],
    ['daakter', 'ḍaakṭar'],
    ['pattar', 'patthar'],
    ['humsafar', 'ham-safar'],
    ['kharach', 'kharch'],
    ['kanstar', 'kanastar'],
    ['fikirmand', 'fikarmand'],
    ['cheenti', 'cheeoñṭi'],
    ['bhiriya', 'bheṛiya'],
  ])('accepts %s for %s', (typed, stored) => {
    expect(nearMiss(typed, stored, taken)).toBe(true);
  });

  it('refuses a spelling that is another word', () => {
    expect(nearMiss('zehn', 'zaheen', taken)).toBe(false);
    expect(nearMiss('rat', 'raat', taken)).toBe(false);
    // pal (a moment) for phal (fruit): one letter, and a different word.
    expect(nearMiss('pal', 'phal', new Set([romanSkeleton('pal')]))).toBe(false);
  });

  it('refuses near misses on short words', () => {
    expect(nearMiss('reet', 'ret', new Set())).toBe(false);
    expect(nearMiss('saf', 'saaf', new Set())).toBe(false);
  });

  it('refuses two letters off', () => {
    expect(nearMiss('jehaiz', 'jahez', new Set())).toBe(false);
    expect(nearMiss('dozain', 'darjan', new Set())).toBe(false);
  });
});
