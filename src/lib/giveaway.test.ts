import { describe, it, expect } from 'vitest';
import { romanRevealsMeaning } from './giveaway';
import { WORDS } from '../data/words';

describe('romanRevealsMeaning', () => {
  it('catches a loanword whose transliteration is its English', () => {
    // the one the learner reported: اردو over "urdu" over an option "Urdu"
    expect(romanRevealsMeaning('urdu', 'Urdu')).toBe(true);
    expect(romanRevealsMeaning('pencil', 'pencil')).toBe(true);
    expect(romanRevealsMeaning('train', 'train')).toBe(true);
  });

  it('sees through the diacritics the scheme uses', () => {
    // ṭ and ḍ are the retroflex marks; they must not hide a match
    expect(romanRevealsMeaning('ṭrain', 'train')).toBe(true);
    expect(romanRevealsMeaning('paasporṭ', 'passport')).toBe(true);
    expect(romanRevealsMeaning('sweaṭar', 'sweater')).toBe(true);
  });

  it('matches any one gloss of a multi-sense word', () => {
    expect(romanRevealsMeaning('cheeta', 'leopard / cheetah')).toBe(true);
    expect(romanRevealsMeaning('hoṭal', 'eatery / hotel')).toBe(true);
  });

  it('leaves ordinary vocabulary alone', () => {
    // the whole point: the transliteration is a decoding aid for these, and
    // taking it away would remove real support from the words that need it
    expect(romanRevealsMeaning('chaand', 'moon')).toBe(false);
    expect(romanRevealsMeaning('kitaab', 'book')).toBe(false);
    expect(romanRevealsMeaning('paani', 'water')).toBe(false);
    expect(romanRevealsMeaning('dost', 'friend')).toBe(false);
    expect(romanRevealsMeaning('laṛka', 'boy')).toBe(false);
  });

  it('is not fooled by a couple of shared letters', () => {
    expect(romanRevealsMeaning('bhaai', 'brother')).toBe(false);
    expect(romanRevealsMeaning('maa', 'mother')).toBe(false);
    expect(romanRevealsMeaning('saal', 'year')).toBe(false);
  });

  it('handles a missing transliteration', () => {
    expect(romanRevealsMeaning(undefined, 'anything')).toBe(false);
    expect(romanRevealsMeaning('', 'anything')).toBe(false);
  });

  it('flags only a small minority of the course', () => {
    // A rule that fires on everything would silently strip the Roman from the
    // whole app; one that fires on nothing would not have caught اردو. Both
    // failure modes are invisible without a number, so this pins it.
    const flagged = WORDS.filter((w) => romanRevealsMeaning(w.roman, w.meaning));
    expect(flagged.length).toBeGreaterThan(30);
    expect(flagged.length).toBeLessThan(WORDS.length * 0.06);
  });
});
