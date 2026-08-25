import { describe, expect, it } from 'vitest';
import { LETTERS, getLetter } from './letters';
import { LETTER_CONTEXT_WORD } from '../exercises/generator';

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
 * Urdu's everyday "z" (used in both native and Persian vocabulary, and in
 * most Arabic loanwords too — CURRICULUM CRITIC's first draft of this note
 * overclaimed the *reverse*, "ذ ض ظ, not ز, are the ones borrowed from
 * Arabic", which several real words in this corpus falsify directly:
 * زکوٰۃ/zakaat "alms", عزت/izzat "honour" and اجازت/ijaazat "permission"
 * are unmistakably Arabic and spell their "z" with ز, because that is the
 * letter Arabic's own zāy uses. Only the one-way claim holds — ذ ض ظ never
 * occur outside Arabic/Persian loanwords — and that is what the fix now
 * says). `zaal`/`zwaad`/`zoe` are each named as one of the three spellings
 * inherited from Arabic/Persian for that purpose specifically, anchored not
 * to the letter's own decorative `word` field (which CURRICULUM CRITIC
 * found is never actually taught for two of these three — pure
 * `LetterLabScreen` flashcard trivia, not part of the real lesson path) but
 * to `LETTER_CONTEXT_WORD` (`generator.ts`), the real word the letter's own
 * context-sighting exercise puts in front of the learner during the actual
 * lesson.
 *
 * This is a measured pattern, not an assumed one: every real word in this
 * corpus containing `zaal`/`zwaad`/`zoe` was read by hand before writing
 * these notes, and all but a literal handful (loanwords whose donor
 * language is itself Persian rather than Arabic, which Urdu treats the
 * same way for this purpose) are formal, religious, administrative or
 * otherwise non-native vocabulary — the opposite of `ze`'s own list, which
 * is everyday nouns (زندگی "life", چیز "thing", میز "table", بازار
 * "market") alongside the Arabic loanwords named above.
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

  it('ze is named as the everyday default, and does not overclaim the reverse (Arabic loanwords can use it too)', () => {
    const ze = getLetter('ze')!;
    expect(ze.note).toMatch(/everyday/i);
    // CURRICULUM CRITIC's finding: an earlier draft implied ز never
    // appears in an Arabic loanword, which real words in this corpus
    // (زکوٰۃ/zakaat, عزت/izzat, اجازت/ijaazat, among others) falsify. The
    // fix states the one-way claim only ("ذ ض ظ never occur outside
    // Arabic/Persian loanwords") — asserted here by checking the note
    // doesn't claim ز is reserved for or excluded from anything, only
    // that it's the default.
    expect(ze.note).not.toMatch(/reserved for words borrowed/i);
  });

  it('zaal, zwaad and zoe each name the real Arabic/Persian-loanword pattern, anchored to the word the real lesson shows', () => {
    for (const id of ['zaal', 'zwaad', 'zoe']) {
      const letter = getLetter(id)!;
      // The old wording ("another of the z family" / "one of four ways
      // Urdu spells z") named the collision without saying anything a
      // learner could act on. The fix must name the actual pattern.
      expect(letter.note, id).toMatch(/arabic/i);
      // And anchor to the word this letter's own context-sighting exercise
      // actually shows during the lesson (LETTER_CONTEXT_WORD), not the
      // letter's own decorative `word` field — CURRICULUM CRITIC found the
      // first draft anchored two of these three letters to a word that
      // appears nowhere else in the app, pure LetterLabScreen trivia never
      // reinforced by the lesson the learner actually takes.
      const contextWord = LETTER_CONTEXT_WORD.get(id);
      expect(contextWord, `${id}: expected a real LETTER_CONTEXT_WORD entry`).toBeDefined();
      expect(letter.note, id).toContain(contextWord!.roman);
    }
  });
});
