import { describe, it, expect } from 'vitest';
import { contrastLine, contrastNotesFor } from './letterContrastNotes';
import { LETTERS, type Letter } from '../data/letters';

/** The real confusable buckets: one base letter plus its variants. */
function buckets(): Letter[][] {
  const by = new Map<string, Letter[]>();
  for (const l of LETTERS) {
    const key = l.confusableWith ?? l.id;
    by.set(key, [...(by.get(key) ?? []), l]);
  }
  return [...by.values()].filter((b) => b.length > 1);
}

describe('URD-047: what a letterContrast explains after it is answered', () => {
  it('every real bucket is exactly one base letter plus variants — the property the guarantee rests on', () => {
    // If a bucket ever had two bases (or none), "a wrong answer always
    // involves at least one variant" would stop being true, and the panel
    // could go back to explaining nothing. This asserts the shape rather
    // than trusting it.
    const all = buckets();
    expect(all.length, 'no multi-member confusable buckets found').toBeGreaterThan(0);
    for (const bucket of all) {
      const bases = bucket.filter((l) => !l.confusableWith);
      expect(bases.length, bucket.map((l) => l.id).join(',')).toBe(1);
    }
  });

  it('THE CRITIC’s finding: on any wrong answer, at least one line shown is a contrastive (variant) note', () => {
    // The first version showed only the target's note, so for a base letter
    // — daal, re, kaaf, seen, swaad, toe, alif, ain, choti-ye — the learner
    // got a description of the letter standing alone and nothing about the
    // dot or stroke that had just cost them the answer. Checked here over
    // every bucket and every possible wrong tap, not a sampled few.
    let checked = 0;
    for (const bucket of buckets()) {
      for (const target of bucket) {
        for (const picked of bucket) {
          if (picked.id === target.id) continue;
          const lines = contrastNotesFor(target, picked);
          expect(lines.map((l) => l.letter.id).sort()).toEqual([target.id, picked.id].sort());
          expect(
            lines.some((l) => l.letter.confusableWith),
            `${target.id} answered as ${picked.id}: no contrastive line`
          ).toBe(true);
          checked++;
        }
      }
    }
    expect(checked, 'no wrong-answer pairing was exercised').toBeGreaterThan(0);
  });

  it('a correct answer shows just the one line, for the letter that was asked about', () => {
    for (const bucket of buckets()) {
      for (const target of bucket) {
        const lines = contrastNotesFor(target, target);
        expect(lines.map((l) => l.letter.id)).toEqual([target.id]);
      }
    }
  });

  it('every variant’s line actually names what it is a variant of, and stays short enough to read', () => {
    // The contrast is already in the curated notes — the fix needed no new
    // content, only the first sentence of the right one. Four of the variant
    // notes carry a long second half about Arabic/Persian "z" spellings
    // (`ze`'s runs to 356 characters), which is the wrong register for the
    // instant a learner is looking at two near-identical glyphs.
    for (const bucket of buckets()) {
      const base = bucket.find((l) => !l.confusableWith)!;
      for (const variant of bucket.filter((l) => l.confusableWith)) {
        const line = contrastLine(variant);
        expect(line.length, `${variant.id}: "${line}"`).toBeLessThanOrEqual(120);
        // It names its base — by any word of the base's name, or by the
        // base's own glyph. Matching only the name's FIRST word was too
        // narrow and failed on a line that does reference its base: `baṛī
        // ye`'s note opens "The “big” ye…", which names `choṭī ye` by its
        // second word, not its first. Diacritics are stripped so "choṭī"
        // matches "choti" and `Ḍaal` matches "Daal".
        const plain = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const namesBase =
          plain(base.name)
            .split(/\s+/)
            .filter((w) => w.length >= 2)
            .some((w) => plain(line).includes(w)) || line.includes(base.forms.isolated);
        expect(namesBase, `${variant.id}'s line does not reference ${base.id}: "${line}"`).toBe(true);
      }
    }
  });

  it('takes the first sentence, and never returns an empty line for any real letter', () => {
    expect(contrastLine({ note: 'One. Two. Three.' } as Letter)).toBe('One.');
    expect(contrastLine({ note: 'No trailing period' } as Letter)).toBe('No trailing period');
    for (const l of LETTERS) expect(contrastLine(l).length, l.id).toBeGreaterThan(0);
  });
});
