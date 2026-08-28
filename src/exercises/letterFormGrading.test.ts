import { describe, it, expect } from 'vitest';
import { isCorrectPosition } from './letterFormGrading';
import { LETTERS, getLetter, POSITIONS, type PositionKey } from '../data/letters';

describe('isCorrectPosition', () => {
  // A connecting letter's four forms are pairwise distinct, so the fix
  // must agree with plain name-equality on every one of them.
  it('is true only for the exact position, for a connecting letter', () => {
    const be = getLetter('be')!;
    expect(be.connects).toBe(true);
    expect(isCorrectPosition(be, 'medial', 'medial')).toBe(true);
    for (const key of ['isolated', 'initial', 'final'] as const) {
      expect(isCorrectPosition(be, 'medial', key), key).toBe(false);
    }
  });

  // URD-054: the actual bug. alif never joins forward, so isolated and
  // initial render the identical string, and so do medial and final —
  // shown the initial shape, answering isolated is reading the glyph
  // correctly and must not be marked wrong.
  it('accepts either name for a non-connector’s two real shapes', () => {
    const alif = getLetter('alif')!;
    expect(alif.connects).toBe(false);
    expect(isCorrectPosition(alif, 'initial', 'isolated')).toBe(true);
    expect(isCorrectPosition(alif, 'isolated', 'initial')).toBe(true);
    expect(isCorrectPosition(alif, 'final', 'medial')).toBe(true);
    expect(isCorrectPosition(alif, 'medial', 'final')).toBe(true);
  });

  // The one thing a non-connector must still get wrong: crossing from the
  // unjoined pair to the joined pair, or vice versa — those really are
  // different glyphs (compare "ا" to "ـا"), and this fix must not turn
  // letterForm into "anything goes" for these letters.
  it('still rejects the genuinely different shape for a non-connector', () => {
    const alif = getLetter('alif')!;
    expect(isCorrectPosition(alif, 'isolated', 'medial')).toBe(false);
    expect(isCorrectPosition(alif, 'isolated', 'final')).toBe(false);
    expect(isCorrectPosition(alif, 'initial', 'medial')).toBe(false);
    expect(isCorrectPosition(alif, 'initial', 'final')).toBe(false);
  });

  // Exhaustive over every real letter and every pair of positions, rather
  // than assuming a shape from `connects` alone. Two letters turned up
  // while writing this test that don't follow the simple "non-connector =
  // exactly two shapes" pattern the item's own text describes: `hamza`
  // (`connects: false`, but its own hand-authored `forms` give `medial`
  // and `final` two genuinely *different* marks — ئ vs ٔ — not the usual
  // collapse) and `baRi-ye` (`connects: false`, yet all four forms are
  // pairwise distinct — it borrows `choti-ye`'s connecting shape for
  // `initial`/`medial` and only takes its own distinctive tail at
  // `isolated`/`final`, a real quirk of where this letter actually occurs
  // in written Urdu, per its own note). `isCorrectPosition` doesn't need
  // to know either exception exists, because it never infers shape from
  // `connects` — it compares the real glyphs, which is exactly why both
  // fall out correct for free. This test is the universal invariant that
  // makes that true: for every letter, `isCorrectPosition` must agree
  // with direct glyph equality, always, not just for the common shape.
  it('agrees with direct glyph equality for every letter and every position pair, with no exceptions', () => {
    let pairsChecked = 0;
    for (const letter of LETTERS) {
      for (const target of POSITIONS) {
        for (const picked of POSITIONS) {
          const expected = letter.forms[picked.key as PositionKey] === letter.forms[target.key as PositionKey];
          expect(
            isCorrectPosition(letter, target.key as PositionKey, picked.key as PositionKey),
            `${letter.id}: target=${target.key} picked=${picked.key}`
          ).toBe(expected);
          pairsChecked++;
        }
      }
    }
    expect(pairsChecked).toBe(LETTERS.length * POSITIONS.length * POSITIONS.length);
  });

  // The two real exceptions above, named directly rather than only
  // implied by the exhaustive sweep — if either letter's `forms` data
  // ever changes shape, this fails with a message pointing at exactly
  // which assumption broke, instead of only a generic mismatch above.
  it('hamza’s medial and final are genuinely different marks, despite being a non-connector', () => {
    const hamza = getLetter('hamza')!;
    expect(hamza.connects).toBe(false);
    expect(hamza.forms.isolated).toBe(hamza.forms.initial);
    expect(hamza.forms.medial).not.toBe(hamza.forms.final);
    expect(isCorrectPosition(hamza, 'medial', 'final')).toBe(false);
  });

  it('baRi-ye has four genuinely distinct forms, despite being a non-connector', () => {
    const baRiYe = getLetter('baRi-ye')!;
    expect(baRiYe.connects).toBe(false);
    const distinct = new Set(POSITIONS.map((p) => baRiYe.forms[p.key as PositionKey]));
    expect(distinct.size).toBe(4);
    // THE CRITIC: this test's own data assertion above doesn't call
    // `isCorrectPosition` at all — only the exhaustive sweep test does, so
    // a mutation specific to baRi-ye (e.g. a "collapse initial→isolated"
    // rule that happens to be right for every other non-connector) could
    // pass this test while still being wrong. Assert against the function
    // directly too: every one of baRi-ye's six position pairs is correct
    // only when the two names are literally the same one.
    for (const target of POSITIONS) {
      for (const picked of POSITIONS) {
        const key = target.key as PositionKey;
        const pickedKey = picked.key as PositionKey;
        expect(isCorrectPosition(baRiYe, key, pickedKey), `${key} vs ${pickedKey}`).toBe(key === pickedKey);
      }
    }
  });
});
