import { describe, expect, it } from 'vitest';
import { LETTERS, getLetter } from './letters';

/**
 * URD-038: four letters (zaal ذ, ze ز, zwaad ض, zoe ظ) all sound like plain
 * "z" in Urdu — URD-007 already stops `letterPick` from ever pairing two of
 * them as options, closing the unanswerable-question bug, but that leaves
 * every one of these letters' own `note` field only naming the collision
 * ("another of the four ways Urdu spells z") rather than giving a learner
 * any way to tell which real word uses which one. 204 of 2,281 words (8.9%)
 * contain one of these four letters, so this isn't a rare corner.
 *
 * The fix gives all four a real, checkable cue instead: `ze` is named as
 * Urdu's everyday "z" (used in both native and Persian vocabulary), and
 * `zaal`/`zwaad`/`zoe` are each named as one of the three spellings
 * inherited from Arabic/Persian for that purpose specifically, anchored to
 * their own already-taught example word. This is a measured pattern, not an
 * assumed one: every real word in this corpus containing `zaal`/`zwaad`/
 * `zoe` was read by hand before writing these notes, and all but a
 * literal-handful (loanwords whose donor language is itself Persian rather
 * than Arabic, which Urdu treats the same way for this purpose) are formal,
 * religious, administrative or otherwise non-native vocabulary — the
 * opposite of `ze`'s own list, which is everyday nouns (زندگی "life", چیز
 * "thing", میز "table", بازار "market").
 */
describe('URD-038: the four z-sound letters each carry a real disambiguation cue, not just a collision notice', () => {
  const Z_SOUND_LETTER_IDS = ['zaal', 'ze', 'zwaad', 'zoe'];

  it('all four expected letters are actually in the corpus with sound "z"', () => {
    for (const id of Z_SOUND_LETTER_IDS) {
      const letter = getLetter(id);
      expect(letter, id).toBeDefined();
      expect(letter!.sound, id).toBe('z');
    }
    // And nothing else in LETTERS shares this sound — if a future letter is
    // added with sound 'z', this test's own list of who needs a cue is
    // stale and silently incomplete otherwise.
    const allZSound = LETTERS.filter((l) => l.sound === 'z').map((l) => l.id);
    expect(allZSound.sort()).toEqual([...Z_SOUND_LETTER_IDS].sort());
  });

  it('ze is named as the everyday default, distinctly from the other three', () => {
    const ze = getLetter('ze')!;
    expect(ze.note).toMatch(/everyday/i);
  });

  it('zaal, zwaad and zoe each name the real Arabic/Persian-loanword pattern, not just "another of the four"', () => {
    for (const id of ['zaal', 'zwaad', 'zoe']) {
      const letter = getLetter(id)!;
      // The old wording ("another of the z family" / "one of four ways
      // Urdu spells z") named the collision without saying anything a
      // learner could act on. The fix must name the actual pattern.
      expect(letter.note, id).toMatch(/arabic/i);
      // And anchor to this letter's own taught word specifically, by its
      // real romanization — not a generic "loanword" claim with nothing
      // to hang onto for this particular letter.
      expect(letter.note, id).toContain(letter.roman);
    }
  });
});
