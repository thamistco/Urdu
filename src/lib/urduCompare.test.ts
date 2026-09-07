import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalise, similarity } = require('../../scripts/lib/urdu-compare.js');

/**
 * The comparison `check:pronunciation` rests on.
 *
 * That script cannot run without a speech-to-text key and a network call, so
 * the one part of it that decides right from wrong is pulled out here where it
 * can be tested for free — and where the *folding* decisions are pinned as
 * deliberate rather than incidental. A transcript never comes back
 * character-identical to the text that was synthesised, so this has to forgive
 * a great deal; every case below is something it must forgive, or something it
 * must refuse to.
 *
 * The last group is the point of the whole file. `ھ` and `ہ` are the two
 * letters this course spends a lesson separating (URD-067, URD-071) and the
 * aspirate is audible: کھانا and کہانا are different words. Every other
 * spelling variant here is folded away to stop a recogniser's lexicon
 * preferences being reported as mispronunciations; this one must survive, or
 * the check is blind to the confusion the curriculum cares most about.
 */
describe('urdu-compare: what a pronunciation check has to forgive', () => {
  it('forgives the short vowels the corpus adds only to steer the engine', () => {
    // `pronounce` fields carry harakat; no recogniser emits them.
    expect(similarity('کہنی', 'کُہنی')).toBe(1);
    expect(normalise('کُہنی')).toBe(normalise('کہنی'));
  });

  it('forgives the tatweel that letter position forms are built from', () => {
    // `letters.ts` joins with U+0640, so a letter clip would never match.
    expect(similarity('ـبـ', 'ب')).toBe(1);
  });

  it('forgives whichever alef, yeh and heh codepoints the recogniser prefers', () => {
    expect(similarity('پانی', 'پاني')).toBe(1); // arabic yeh vs farsi yeh
    expect(similarity('ہاں', 'هاں')).toBe(1); // arabic heh vs urdu heh
    expect(similarity('اسلام', 'أسلام')).toBe(1); // hamzated alef
  });

  it('forgives punctuation and spacing, which are not spoken', () => {
    expect(similarity('السلام علیکم۔', 'السلام  علیکم')).toBe(1);
  });

  it('does NOT forgive the aspirate — کھانا and کہانا are different words', () => {
    expect(similarity('کھانا', 'کہانا')).toBeLessThan(1);
    expect(normalise('ھ')).not.toBe(normalise('ہ'));
  });

  it('scores a wrong word near zero and a near miss in between, so misses rank', () => {
    const wrong = similarity('پانی', 'کتاب');
    const near = similarity('پانی', 'پانہ');
    expect(wrong).toBeLessThan(near);
    expect(near).toBeLessThan(1);
  });

  it('treats an empty transcript as a total miss rather than a match', () => {
    // A silent clip transcribes to nothing; that is the failure this whole
    // pipeline exists for, so it must never score as agreement.
    expect(similarity('پانی', '')).toBe(0);
  });
});
