import { describe, it, expect } from 'vitest';

import { WORDS } from './words';
import { SENTENCES } from './sentences';

/**
 * Noon ghunna, ں, is a nasal vowel, and the course writes it ñ: "meñ",
 * "nahiñ", "jaaooñ". Five forms had slipped to plain n, "jaaoon" and
 * "karoon" among them, against "kaise jaaooñ" in the vocabulary (content
 * review, 2026-10-18 and 2026-10-21, P-092).
 *
 * One direction only. The other does not hold: a nasal vowel in the middle
 * of a word is spelt with an ordinary ن, so "aañkh" and "chaañd" carry ñ with
 * no ں, and are right.
 *
 * Three exceptions, kept as the whole course and the learners' own Roman Urdu
 * write them: میں (main, "I"), ہیں (hain), ہوں (hoon).
 */
const KEPT = new Set(['میں', 'ہیں', 'ہوں']);
const ghunna = (urdu: string) => urdu.includes('ں') && !KEPT.has(urdu);

describe('the nasal ñ', () => {
  it('is written in every word spelt with ں', () => {
    const slips = WORDS.filter((w) => w.urdu.split(/\s+/).some(ghunna) && !w.roman.includes('ñ'));
    expect(slips.map((w) => `${w.id}: ${w.urdu} ${w.roman}`)).toEqual([]);
  });

  it('is written in every sentence word spelt with ں', () => {
    const slips: string[] = [];
    for (const s of SENTENCES) {
      const roman = s.roman.replace(/[?.,!]/g, '').split(/\s+/);
      // Only where the words line up one to one; elsewhere there is nothing to pair.
      if (roman.length !== s.words.length) continue;
      s.words.forEach((u, i) => {
        if (ghunna(u) && !roman[i].includes('ñ')) slips.push(`${s.id}: ${u} ${roman[i]}`);
      });
    }
    expect(slips).toEqual([]);
  });

  it('pairs most sentences word for word, so the check above is not empty', () => {
    const paired = SENTENCES.filter((s) => s.roman.replace(/[?.,!]/g, '').split(/\s+/).length === s.words.length);
    expect(paired.length).toBeGreaterThan(SENTENCES.length * 0.8);
  });
});
