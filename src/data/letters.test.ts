import { describe, expect, it } from 'vitest';
import { LETTERS, getLetter } from './letters';
import { LETTER_CONTEXT_WORD } from '../exercises/generator';
import { contrastLine } from '../exercises/letterContrastNotes';

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

/**
 * URD-053: URD-038 scoped itself to "at least the ذ ز ض ظ group" — three
 * more same-sound collisions get the identical treatment here: se/seen/
 * swaad (all "s"), baRi-he/choti-he (both "h"), te/toe (both "t"). Each
 * group's default letter is named as the one to reach for in native and
 * Persian vocabulary alike, and each loanword-only letter is anchored to
 * `LETTER_CONTEXT_WORD`, not a decorative field — the identical shape
 * URD-038's own describe block above checks for the z-group.
 *
 * `do-chashmi-he` (ھ) was in this item's own title alongside baRi-he and
 * choti-he, but does NOT belong in this fix: its `sound` is `'h
 * (aspirate)'`, not `'h'` — a real, distinct phoneme (it aspirates the
 * preceding consonant, k→kh, b→bh) rather than a second spelling of plain
 * h, and its own note already correctly describes that role. Treating it
 * as a third member of a same-sound collision would be inaccurate, not
 * merely incomplete — checked directly (below) rather than assumed, and
 * left alone.
 *
 * The "everyday vs Arabic/Persian-loanword" split was verified against the
 * real corpus for all three groups before writing anything, the same way
 * URD-038 did for the z-group — not assumed to transfer. Real counts
 * (`WORDS.filter(w => w.urdu.includes(glyph)).length`): se 19, seen 373,
 * swaad 83; baRi-he 106, choti-he 419; te 435, toe 53. Every word sampled
 * containing a loanword-only letter (se, swaad, baRi-he, toe) reads as
 * Arabic-root vocabulary (حساب/hisaab, صبر/sabr, خط/khat, مصالحہ/masaala,
 * among many others) — none of the "a handful" framing URD-038 used for
 * zaal/zwaad/zoe (18/39/29 words) fits swaad or baRi-he's much larger
 * real counts, so their notes say "never occur outside Arabic/Persian
 * loanwords" without a rarity claim the numbers don't support.
 */
describe('URD-053: the s, h and t same-sound collisions each carry a real disambiguation cue', () => {
  it('do-chashmi-he is correctly excluded — it is a distinct aspirate phoneme, not a second "h" spelling', () => {
    const doChashmiHe = getLetter('do-chashmi-he')!;
    expect(doChashmiHe.sound).not.toBe('h');
    expect(doChashmiHe.sound).toMatch(/aspirate/i);
  });

  it('every expected letter in each group is actually in the corpus with the right sound, and nothing else shares it', () => {
    const groups: [string, string[]][] = [
      ['s', ['se', 'seen', 'swaad']],
      ['h', ['baRi-he', 'choti-he']],
      ['t', ['te', 'toe']],
    ];
    for (const [sound, ids] of groups) {
      for (const id of ids) {
        const letter = getLetter(id);
        expect(letter, id).toBeDefined();
        expect(letter!.sound, id).toBe(sound);
      }
      const allWithSound = LETTERS.filter((l) => l.sound === sound).map((l) => l.id);
      expect(allWithSound.sort(), sound).toEqual([...ids].sort());
    }
  });

  it('seen, choti-he and te are each named as the everyday default, without overclaiming the reverse', () => {
    for (const id of ['seen', 'choti-he', 'te']) {
      const letter = getLetter(id)!;
      expect(letter.note, id).toMatch(/everyday/i);
      // Same non-overclaim URD-038 checks for ze: real Arabic loanwords can
      // and do use the everyday letter too, so the note must never say the
      // everyday letter is reserved for or excluded from anything.
      expect(letter.note, id).not.toMatch(/reserved for words borrowed/i);
    }
  });

  it('se, swaad, baRi-he and toe each name the real Arabic/Persian-loanword pattern, anchored to the word the real lesson shows', () => {
    for (const id of ['se', 'swaad', 'baRi-he', 'toe']) {
      const letter = getLetter(id)!;
      expect(letter.note, id).toMatch(/arabic/i);
      const contextWord = LETTER_CONTEXT_WORD.get(id);
      expect(contextWord, `${id}: expected a real LETTER_CONTEXT_WORD entry`).toBeDefined();
      expect(letter.note, id).toContain(contextWord!.roman);
    }
  });
});

/**
 * URD-062: every confusable bucket is one base letter (`confusableWith`
 * unset) plus its variants, and the notes were written to that shape — a
 * variant's note contrasts it against its base ("Daal with one dot above"),
 * while a base's note describes it standing alone. `letterContrastExercise`
 * (URD-047) reveals a note after answering, and `contrastLine`
 * (`letterContrastNotes.ts`) is the only part of it a learner ever sees at
 * that moment — its own doc comment already proves a wrong tap is always
 * contrastive (a bucket holds exactly one base, so a wrong answer always
 * involves a variant), but that guarantee says nothing about the *correct*
 * answer's own panel, which is the base's line whenever the target was the
 * base. Before this item, all 13 bases described themselves standing alone,
 * naming nothing that separates them from their own variant(s) — two were
 * actively misleading: `kaaf`'s "The stroke on top is part of the letter,
 * not an accent. Do not drop it." is read by a learner who just wrongly
 * tapped `gaaf` (kaaf with a *second* stroke) as endorsing what they saw;
 * `seen`'s "Three teeth" is equally true of `sheen`, the letter it was
 * confused with.
 *
 * Found by THE CRITIC and CURRICULUM CRITIC independently while reviewing
 * URD-047.
 */
describe('URD-062: a base letter’s note names the mark that separates it from its variants', () => {
  /**
   * Every letter that is a bucket's base, keyed to the mark its own note
   * now names — checked against `contrastLine` itself (`letterContrastNotes.ts`),
   * not a reimplementation of its split, since that function's own output,
   * not the whole `note` field, is what a learner actually sees.
   *
   * THE CRITIC: an earlier version of this table used a loose keyword regex
   * for every base (`/dot|retroflex/i` for `daal`, say), and a mutation
   * proved it gameable — a `daal` note rewritten to mention "a single dot of
   * ink where the pen first touches the page" (true of nothing about `Daal`
   * or `zaal`) still passed, because the check only proves a keyword is
   * present, not that it correctly names the real mark. Tightened two ways
   * below: the 11 buckets with exactly one variant now require that
   * variant's own id to appear by name (unambiguous and cheap — nothing
   * else in the corpus is named "gaaf" or "zwaad"), and the two buckets
   * with more than one variant (`daal`: `Daal`/`zaal`; `re`: `Re`/`ze`/`zhe`)
   * require *both* "dot" and "retroflex" to appear, not just one, since a
   * bucket that size can only be honestly described as lacking both marks a
   * single-keyword-either check would let a mutation dodge one of.
   */
  // Values are the variant's *prose* name, not always its data `id` — house
  // style (`check:writing`) forbids a hyphen in any user-facing string, so a
  // variant whose id is hyphenated (`noon-ghunna`, `baRi-ye`) is named in
  // running text by its space-separated `name` field instead
  // (`noon ghunna`, `baṛī ye`), exactly the convention the corpus's own
  // untouched notes already use for `baRi-he`/`choti-he` ("choṭī he").
  const NAMES_VARIANT: Record<string, string> = {
    be: 'pe',
    jeem: 'che',
    'baRi-he': 'khe',
    seen: 'sheen',
    swaad: 'zwaad',
    toe: 'zoe',
    ain: 'ghain',
    kaaf: 'gaaf',
    noon: 'noon ghunna',
    'choti-ye': 'baṛī ye',
  };
  const REQUIRES_BOTH_MARKS: Record<string, [RegExp, RegExp]> = {
    daal: [/dot/i, /retroflex/i],
    re: [/dot/i, /retroflex/i],
  };
  // `alif`'s own bucket has one variant (`alif-madda`), but "alif-madda" is
  // not how the note names the mark and never would be — nobody would
  // write a sentence naming a sibling letter by its data id rather than the
  // actual diacritic. "madda" is the real, specific term (a named Arabic
  // diacritic, not a generic word like "dot"), unique enough in this corpus
  // that a mutation could not stumble into it by accident the way `daal`'s
  // "dot" mutation did — checked on its own rather than folded into
  // `NAMES_VARIANT`.
  const UNIQUE_TERM: Record<string, RegExp> = { alif: /madda/i };

  it('every multi-member confusable bucket in the real corpus is accounted for — 13, matching the item’s own count', () => {
    const buckets = new Map<string, string[]>();
    for (const l of LETTERS) {
      const key = l.confusableWith ?? l.id;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(l.id);
    }
    const multiMemberBases = [...buckets.entries()].filter(([, ids]) => ids.length > 1).map(([base]) => base);
    expect(multiMemberBases.length).toBe(13);
    expect(multiMemberBases.sort()).toEqual(
      [...Object.keys(NAMES_VARIANT), ...Object.keys(REQUIRES_BOTH_MARKS), ...Object.keys(UNIQUE_TERM)].sort()
    );
  });

  it('alif names the actual diacritic (madda), a term specific enough not to appear by accident', () => {
    for (const [base, pattern] of Object.entries(UNIQUE_TERM)) {
      expect(contrastLine(getLetter(base)!), base).toMatch(pattern);
    }
  });

  it('every single-variant base names that variant by id in the line a learner actually sees', () => {
    for (const [base, variantId] of Object.entries(NAMES_VARIANT)) {
      const letter = getLetter(base);
      expect(letter, base).toBeDefined();
      // Word-boundary match, not a bare substring — `re` sits inside other
      // ids too, and this table's own ids are short enough that a loose
      // substring check would be almost as gameable as the regex it replaced.
      expect(contrastLine(letter!), base).toMatch(new RegExp(`\\b${variantId}\\b`, 'i'));
    }
  });

  it('daal and re each name both marks their multiple variants carry — a dot and the retroflex mark', () => {
    for (const [base, patterns] of Object.entries(REQUIRES_BOTH_MARKS)) {
      const letter = getLetter(base);
      expect(letter, base).toBeDefined();
      const line = contrastLine(letter!);
      for (const p of patterns) expect(line, `${base}: ${p}`).toMatch(p);
    }
  });

  it('kaaf’s note no longer reads as endorsing gaaf’s extra stroke to a learner who just tapped it', () => {
    const line = contrastLine(getLetter('kaaf')!);
    expect(line).toMatch(/gaaf/i);
    expect(line).toMatch(/second/i);
  });

  it('seen’s note no longer describes a shape sheen equally has', () => {
    const line = contrastLine(getLetter('seen')!);
    expect(line).toMatch(/sheen/i);
  });
});

/**
 * URD-067: `choti-he` (ہ) and `do-chashmi-he` (ھ) share teaching group 8 —
 * the file's own comment calls it "the h family" — are taught back to back,
 * and neither names the other via `confusableWith`. This pins that as a
 * decision rather than an omission, which the item asked for whichever way
 * the answer went.
 *
 * The answer is no link, on the criterion `confusableWith`'s own doc comment
 * states: a link is warranted where a letter's curated note describes the
 * shared shape ("Same bowl as be", "One dot above the ح (baṛī he) curve").
 * The third test below is that criterion as a corpus invariant — all 16
 * declared pairs are documented that way from one side or the other, and the
 * h pair from neither. `do-chashmi-he`'s "The h with two eyes" names its own
 * eyes, not a mark added to ہ, and `choti-he`'s note names ح, not ھ. Rendering
 * all four forms at the letter lab's own `urduGlyph(72)` in the app's own
 * Nastaliq agrees: ھ cannot be got by adding anything to ہ, the way khe is
 * baṛī he plus a dot.
 *
 * Two shortcuts were measured and rejected, recorded here so they are not
 * re-derived. The shipped trace masks score the pair 0.443 against
 * baRi-he ~ khe's 0.458, but normalise each glyph into its own square and so
 * rank 114 undeclared pairs above it. Rendered glyph width is 1.00x for
 * baRi-he ~ khe and kaaf ~ gaaf, which invites "a mark leaves the width
 * alone" — but declared pairs reach 4.00x (alif ~ alif-madda) and 2.29x
 * (noon ~ noon-ghunna), both wider apart than this pair's 2.47x.
 *
 * The item's premise that `khe` links to `baRi-he` "despite being in a
 * different group entirely" is mistaken: both are group 2. Every link is
 * same-group, which the second test states — so sharing a group is a property
 * of all of them rather than a reason for any one.
 */
describe('URD-067: the h family’s two h’s are deliberately not one confusable bucket', () => {
  const bucketKeyOf = (id: string) => getLetter(id)?.confusableWith ?? id;
  /** The ways a note can refer to another letter: its prose name, its data id,
   *  or the glyph itself — `khe`'s note names `baRi-he` as "ح (baṛī he)". */
  const refersTo = (note: string, other: (typeof LETTERS)[number]) =>
    [other.name, other.id, other.forms.isolated].some((n) => note.toLowerCase().includes(n.toLowerCase()));

  it('choti-he and do-chashmi-he sit in different buckets, so neither drills against the other', () => {
    expect(bucketKeyOf('choti-he')).not.toBe(bucketKeyOf('do-chashmi-he'));
    // The claim a link would make, and that neither note actually makes.
    const choti = getLetter('choti-he')!;
    const doChashmi = getLetter('do-chashmi-he')!;
    expect(refersTo(doChashmi.note, choti), 'do-chashmi-he’s note does not describe ہ’s shape plus a mark').toBe(false);
    expect(refersTo(choti.note, doChashmi), 'choti-he’s note does not describe ھ’s shape plus a mark').toBe(false);
  });

  it('every confusableWith link stays inside one teaching group, so a shared group is never itself the reason for one', () => {
    for (const l of LETTERS) {
      if (!l.confusableWith) continue;
      const base = getLetter(l.confusableWith);
      expect(base, `${l.id} points at a letter that does not exist`).toBeDefined();
      expect(base!.group, `${l.id} -> ${l.confusableWith}`).toBe(l.group);
    }
  });

  it('every declared pair has its shared shape written down in a note, from one side or the other', () => {
    for (const variant of LETTERS) {
      if (!variant.confusableWith) continue;
      const base = getLetter(variant.confusableWith)!;
      expect(
        refersTo(variant.note, base) || refersTo(base.note, variant),
        `${variant.id} ~ ${base.id}: neither note says they share a shape, so the link is undocumented`
      ).toBe(true);
    }
  });
});

/**
 * URD-071: `do-chashmi-he` and `noon-ghunna` are letters that carry no sound
 * of their own — they modify a neighbouring letter or vowel instead, and
 * their curated `note` already says so correctly ("it aspirates/nasalises
 * ... before it"). That correct explanation was never reaching a learner:
 * `note` renders in exactly one place in the whole app (`LetterLabScreen`,
 * already documented elsewhere in this corpus, `URD-038`'s own note above,
 * as flashcard trivia outside the real lesson path), and every real exercise
 * instead shows only `name` and the bare, untranslated jargon in `sound`
 * ("h (aspirate)", "ñ (nasal)").
 *
 * `functionNote` is the fix: a short translation of that jargon, rendered in
 * `LetterFormExercise` every time one of these letters is met, reusing the
 * "reveal a short fact after answering" convention that exercise already has
 * for a different case (`pickedATwin`). This pins the criterion for who
 * gets one — "before it" in the note is the exact textual signature the
 * finding turned on — as a corpus invariant, in both directions: every
 * letter that needs a translation has one, and no ordinary letter (whose
 * full behaviour already is its sound) gets one it doesn't need.
 */
describe('URD-071: a letter that modifies its neighbour rather than sounding on its own gets that fact translated for real play', () => {
  // The exact signature the finding turned on — a note describing a letter
  // that changes a *neighbouring* sound, not its own.
  const MODIFIES_NEIGHBOUR = /before it/i;

  it('exactly the letters whose note describes modifying a neighbour have a functionNote — 2, matching the finding', () => {
    const shouldHave = LETTERS.filter((l) => MODIFIES_NEIGHBOUR.test(l.note)).map((l) => l.id);
    const does = LETTERS.filter((l) => l.functionNote).map((l) => l.id);
    expect(shouldHave.length).toBe(2);
    expect(does.sort()).toEqual(shouldHave.sort());
  });

  it('every functionNote is a real translation of the note, not a copy of it', () => {
    for (const l of LETTERS) {
      if (!l.functionNote) continue;
      expect(l.functionNote, l.id).not.toBe(l.note);
      // Short enough to read in the half-second an exercise's reveal line
      // gets glanced at — long enough not to be a bare restatement of `sound`.
      expect(l.functionNote.length, l.id).toBeLessThan(90);
      expect(l.functionNote.length, l.id).toBeGreaterThan(20);
    }
  });

  it('do-chashmi-he and noon-ghunna each name the thing they actually change — the letter before, or the vowel before', () => {
    const doChashmiHe = getLetter('do-chashmi-he')!;
    const noonGhunna = getLetter('noon-ghunna')!;
    expect(doChashmiHe.functionNote).toMatch(/letter.*before it/i);
    expect(noonGhunna.functionNote).toMatch(/vowel.*before it/i);
  });
});
