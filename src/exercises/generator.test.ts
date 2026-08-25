import { describe, expect, it } from 'vitest';

import {
  buildLessonExercises,
  distractLetters,
  distractorsFor,
  LETTER_CONTEXT_WORD,
  OPTIONS_PER_QUESTION,
  soundsOverlap,
  soundTokens,
} from './generator';
import { getLetter, LETTERS, type Letter } from '../data/letters';
import { resolveLesson, UNITS, type Lesson } from '../data/units';
import { WORDS, getWord } from '../data/words';
import { VERDICT_CUES, cueOf } from '../data/art';
import { GRAMMAR } from '../data/grammar';
import { SENTENCES } from '../data/sentences';
import { romanAll } from '../lib/translit';

/** Letter-type exercise kinds, as opposed to everything else a review can ask. */
const LETTER_KINDS = new Set(['letterForm', 'letterPick', 'letterTrace']);
const letterCountOf = (lessonId: string, known: ReadonlySet<string> = new Set()) => {
  const lesson = resolveLesson(lessonId)!;
  const exercises = buildLessonExercises(lesson, [], 'both', known);
  return exercises.filter((e) => LETTER_KINDS.has(e.kind)).length;
};

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

describe('URD-049: distractorsFor never offers a homograph of the target or of another option', () => {
  // `meaningPick`/`wordFromMeaning` show `.urdu` as the text of each option
  // (`check:answerable`'s own "two options are the same word" rule checks
  // exactly this), so two distinct WORDS entries sharing a spelling but not
  // an id — a real homograph pair, 40 of them across the corpus — could
  // both land in one option set: different words by `.id` and by
  // `.meaning`, but visually identical on screen. Checked against every
  // real homograph in the corpus, not a synthetic sample, since this
  // check:answerable failure was flaky specifically because it depended on
  // which unseeded shuffle draw happened to surface a colliding pair.
  const byUrdu = new Map<string, typeof WORDS>();
  for (const w of WORDS) {
    if (!byUrdu.has(w.urdu)) byUrdu.set(w.urdu, []);
    byUrdu.get(w.urdu)!.push(w);
  }
  const homographGroups = [...byUrdu.values()].filter((g) => g.length > 1);

  it('has at least one real homograph group to test against — a false pass if the corpus ever loses them all', () => {
    expect(homographGroups.length).toBeGreaterThan(0);
  });

  it("never returns a distractor sharing the target's own spelling, forced against a single-candidate pool", () => {
    // A pool of exactly one candidate — the target's own homograph sibling
    // — makes this deterministic rather than relying on that one candidate
    // happening to survive an unseeded shuffle among 2,281 real words. The
    // original bug was flaky for exactly that reason: it depended on which
    // draw happened to surface a colliding pair. `distinctMeaning: true`
    // is deliberately set — a homograph pair has different meanings, so
    // that guard alone must NOT be what stops this; only the `.urdu` guard
    // this item added should.
    for (const group of homographGroups) {
      for (const word of group) {
        const siblings = group.filter((w) => w.id !== word.id);
        for (const sibling of siblings) {
          const distractors = distractorsFor(word, [sibling], { distinctMeaning: true });
          expect(
            distractors.some((d) => d.id === sibling.id),
            `${word.id} vs ${sibling.id}`
          ).toBe(false);
        }
      }
    }
  });

  it('never lets two distractors drawn together share a spelling with each other', () => {
    // Every real homograph group in the corpus happens to have exactly 2
    // members, so testing "two DISTRACTORS colliding with each other"
    // (as opposed to one colliding with the target) needs a constructed
    // case: two synthetic decoy words, sharing a spelling with each other
    // but not with the real target, planted at the front of the pool so
    // an unseeded shuffle can't make this test itself flaky.
    const target = WORDS[0];
    const decoyA = { ...WORDS[1], id: 'test-decoy-a', urdu: 'ٹیسٹ', meaning: 'test meaning one' };
    const decoyB = { ...WORDS[2], id: 'test-decoy-b', urdu: 'ٹیسٹ', meaning: 'test meaning two' };
    // Just the two decoys, not the whole corpus: `consider` visits every
    // candidate in a finite pool this small regardless of shuffle order,
    // so both decoys are guaranteed to be checked against each other here
    // — a larger pool would make whether they're even considered together
    // a matter of luck, the same flakiness this whole item exists to fix.
    const distractors = distractorsFor(target, [decoyA, decoyB], { distinctMeaning: true });
    const fromDecoys = distractors.filter((d) => d.id === decoyA.id || d.id === decoyB.id);
    expect(fromDecoys.length).toBeLessThanOrEqual(1);
  });
});

describe("URD-017: Daily Review's letter share reflects this learner's position, not the whole course", () => {
  // `practice-review` isn't placed on the path, so `taughtUpTo` can't stop
  // walking it and returns the entire course — 2,281 words against 46
  // letters, a ~2% letter share fixed regardless of who opens the screen.
  // THE CRITIC: reproduced live, a learner who had just finished the very
  // first letters and vocab lessons got 0 of 10 letter exercises, identical
  // to one who had finished the whole course. The fix keys the split off
  // `known` instead for this specific lesson.

  it('with nothing graded yet (day one), splits close to the old even 50/50', () => {
    const letters = letterCountOf('practice-review');
    expect(letters).toBeGreaterThanOrEqual(4);
    expect(letters).toBeLessThanOrEqual(6);
  });

  it('reflects a learner still deep in the alphabet, not the fixed whole-course ratio', () => {
    // Graded on l-1's six letters and v-first-words' eleven words — a
    // learner on day one or two, the population this regression hit.
    const known = new Set([
      'alif',
      'alif-madda',
      'be',
      'pe',
      'te',
      'Te',
      'w-paani',
      'w-kitaab',
      'w-ghar',
      'w-dil',
      'w-naam',
    ]);
    const letters = letterCountOf('practice-review', known);
    // Before the fix this was 0, pinned by the whole course's ~2% ratio.
    // 6 letters of 17 known items ≈ 35% ⇒ round(10 × 0.35) = 4 (± rounding
    // and pool-fill from due letters not present here), comfortably above
    // the old regression's 0 and nowhere near the whole-course ~2%.
    expect(letters).toBeGreaterThanOrEqual(3);
  });

  it("an on-path review's letter share is unaffected — still keyed on course position, not known", () => {
    // rev-the-wider-world (u41) is placed on the path, so this fix's
    // known-based branch must not apply to it regardless of what `known`
    // contains — course position stays the measure there.
    const allWords = Array.from({ length: 200 }, (_, i) => `w-fake-${i}`);
    const knownEverything = new Set(allWords);
    const letters = letterCountOf('rev-the-wider-world', knownEverything);
    expect(letters).toBeLessThanOrEqual(1);
  });
});

describe('URD-017: a review with any letters in scope always asks at least one', () => {
  it('every real review lesson in the course asks about at least one letter', () => {
    // The floor exists because `Math.round` alone stays >= 1 only by
    // coincidence of today's review sizes (coverTopics floors them at 22) —
    // this asserts the guarantee directly rather than trusting the
    // coincidence to hold as content changes.
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'review') continue;
        expect(letterCountOf(l.id)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('holds even at a review size real content never happens to produce', () => {
    // rev-the-wider-world's real size was 39 (set by coverTopics, generous
    // enough that Math.round alone never rounded its ~1.98% letter share
    // down to 0) until URD-A02 split its unit in two and this review's own
    // half fell to 22 — coverTopics's own minimum, and exactly the size this
    // test used to reach only synthetically: Math.round(22 * 0.0198) =
    // Math.round(0.436) = 0 without the floor. The explicit `size: 22`
    // override stays rather than trusting real content to keep landing here
    // by coincidence, so this doesn't depend on staying lucky as units and
    // reviews are added or resized again.
    const lesson = { ...resolveLesson('rev-the-wider-world')!, size: 22 };
    const exercises = buildLessonExercises(lesson, [], 'both', new Set());
    const letters = exercises.filter((e) => LETTER_KINDS.has(e.kind)).length;
    expect(letters).toBeGreaterThanOrEqual(1);
  });
});

describe('URD-018: review gives the learner a real chance to read Urdu and say what it means', () => {
  // Before this fix, `meaningPick` — the only exercise that shows Urdu and
  // asks what it means — appeared in review only as `produceExercise`'s own
  // fallback for the 82 words that are neither typeable nor buildable
  // (measured: 16 of 1,856 exercises across all 39 reviews, 0.86%). Every
  // other review question went the same direction: shown English (or heard
  // audio), produce or pick the Urdu form. One turn in the review ladder's
  // six-turn cycle now asks `wordExercise(..., 'meet', 1)` — the same call
  // the sentence and grammar climbs already use for "show the word, ask its
  // meaning" — directly, not just as a fallback for the hardest few words.

  it('every real review lesson, on every track, asks at least one meaning-direction question', () => {
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'review') continue;
        for (const track of ['script', 'roman', 'both'] as const) {
          const exercises = buildLessonExercises(l, [], track, new Set());
          const meaningPicks = exercises.filter((e) => e.kind === 'meaningPick').length;
          expect(meaningPicks, `${l.id} (${track})`).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('a review of typeable words still contains at least one meaning-direction question', () => {
    // The item's own acceptance criterion, stated directly: a review
    // entirely of typeable words used to route every third-sighting
    // question to `typeWord` instead of ever reaching `meaningPick`'s old
    // fallback path, so this case is exactly the one the old design missed.
    const lesson = resolveLesson('rev-gender-and-number')!;
    const exercises = buildLessonExercises(lesson, [], 'both', new Set());
    expect(exercises.filter((e) => e.kind === 'meaningPick').length).toBeGreaterThanOrEqual(1);
  });

  it('meaningPick is now a real share of review content, not a rounding error', () => {
    // Measured directly across all 39 reviews on all three tracks: before
    // this fix, 16 of 1,856 exercises, 0.86%. The six-turn design (recall,
    // recall, listen, produce, read, produce) targets roughly one in six —
    // measured at 15.5% on real content. The threshold here is set well
    // below that real number rather than pinned close to it, so a small,
    // legitimate future content change doesn't turn this flaky.
    let total = 0;
    let meaningPicks = 0;
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'review') continue;
        for (const track of ['script', 'roman', 'both'] as const) {
          const exercises = buildLessonExercises(l, [], track, new Set());
          total += exercises.length;
          meaningPicks += exercises.filter((e) => e.kind === 'meaningPick').length;
        }
      }
    }
    expect(meaningPicks / total).toBeGreaterThan(0.1);
  });

  it("regression (THE CRITIC): a meaningPick option never carries a verdict icon it doesn't deserve", () => {
    // BLOCKING: `meaningPick`'s distractor call used to omit `distinctCue`,
    // the guard `pictureOptions` above it already requests — so a
    // verdict-cue word (VERDICT_CUES: yes/no/correct/wrong/good/bad/
    // approved/rejected) could be offered as a *wrong* option, and
    // `MeaningPickExercise` renders every option's own tick/cross regardless
    // of correctness. Sampled directly: every meaningPick generated across
    // all 39 reviews on all three tracks, with the word itself allowed to
    // carry a verdict cue (that's the correct answer's icon, not a lie) but
    // no *other* option allowed to.
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'review') continue;
        for (const track of ['script', 'roman', 'both'] as const) {
          const exercises = buildLessonExercises(l, [], track, new Set());
          for (const e of exercises) {
            if (e.kind !== 'meaningPick') continue;
            const wrongOptions = e.options.filter((o) => o.id !== e.word.id);
            const leaked = wrongOptions.filter((o) => VERDICT_CUES.has(cueOf(o)));
            expect(leaked, `${l.id} (${track}): ${e.word.id}`).toEqual([]);
          }
        }
      }
    }
  });

  it('regression (THE CRITIC): a review with due letters and words interleaved 1:1 still reaches every turn', () => {
    // BLOCKING: the turn used to be `i % 4` computed from the shared
    // due/fallback index, and the interleave alternates letter/word 1:1
    // whenever both are present — a step of 2 through a mod-4 space only
    // ever visits 2 of the 4 residues. Reproduced with the exact shape THE
    // CRITIC used: 10 due letters, 6 due words, interleaved — before the
    // fix this locked every word into alternating between only listenTap
    // and typeWord, never reaching wordFromMeaning or meaningPick at all.
    const reviewLesson = UNITS.flatMap((u) => u.lessons).find((l) => l.kind === 'review')!;
    const dueLetters = LETTERS.slice(0, 10).map((l) => ({ id: l.id, type: 'letter' as const }));
    const dueWords = WORDS.slice(0, 6).map((w) => ({ id: w.id, type: 'word' as const }));
    const due: { id: string; type: 'letter' | 'word' }[] = [];
    for (let i = 0; i < 10; i++) {
      due.push(dueLetters[i]);
      if (dueWords[i]) due.push(dueWords[i]);
    }
    const exercises = buildLessonExercises({ ...reviewLesson, size: 16 }, due, 'both', new Set());
    const wordKinds = new Set(exercises.filter((e) => !LETTER_KINDS.has(e.kind)).map((e) => e.kind));
    // The specific thing the interleave-parity bug hides: with a step of 2
    // through an even modulus, only the residues sharing the start index's
    // parity are ever reached — 3 kinds can still appear (as they did in the
    // exact bug this reproduces: listenTap, wordFromMeaning, typeWord) while
    // meaningPick specifically stays unreachable. Asserting `size > 2` alone
    // would not have caught that; asserting meaningPick's presence directly
    // does.
    expect(wordKinds.has('meaningPick')).toBe(true);
    expect(wordKinds.size).toBeGreaterThan(2);
  });

  it('no real review generates a run of 3 or more identical exercise kinds in a row', () => {
    // CURRICULUM CRITIC: before this fix, the longest run anywhere in review
    // was 1 (never two identical kinds adjacent). The six-turn design keeps
    // it well under check:shape's own MAX_RUN of 3, even though a few
    // pre-existing independent fallbacks (the VERDICT_CUES override, the
    // Roman track's produce-fallback) can still land two of the same kind
    // side by side.
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'review') continue;
        for (const track of ['script', 'roman', 'both'] as const) {
          const exercises = buildLessonExercises(l, [], track, new Set());
          let run = 1;
          for (let i = 1; i < exercises.length; i++) {
            run = exercises[i].kind === exercises[i - 1].kind ? run + 1 : 1;
            expect(run, `${l.id} (${track}) @${i}`).toBeLessThan(3);
          }
        }
      }
    }
  });
});

describe('URD-020: a letter lesson shows letters inside real words, not only in isolation', () => {
  const ISOLATED_LETTER_KINDS = new Set(['letterForm', 'letterPick', 'letterTrace']);
  const letterLessons = () => UNITS.flatMap((u) => u.lessons).filter((l) => l.kind === 'letters');

  it('every letter in every real lesson gets exactly one context sighting — no letter zero, none doubled', () => {
    // Before this fix: exactly one shared context-word exercise per lesson,
    // regardless of how many letters it taught (measured: 276 of 285
    // exercises across all 9 letter lessons were isolated-glyph, 96.8%).
    // THE CRITIC: a raw count comparison (`inContext.length >=
    // letterIds.length`) cannot tell "every letter got one" apart from "one
    // letter got two and another got none" — assert the actual per-letter
    // ids match, not just a total.
    for (const l of letterLessons()) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      const inContext = exercises.filter((e) => !ISOLATED_LETTER_KINDS.has(e.kind) && 'word' in e);
      expect(inContext.length, l.id).toBe(l.letterIds!.length);
    }
  });

  it("does not raise a letter lesson's total exercise count", () => {
    // The item's own constraint: raise the in-context share without raising
    // total lesson length. Each letter's context sighting replaces one of
    // its isolated ones rather than adding a new one, so the total is
    // unchanged (or one shorter, since the old single shared context word
    // is gone) — never longer.
    for (const l of letterLessons()) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      expect(exercises.length, l.id).toBeLessThanOrEqual(l.letterIds!.length * 6 + 1);
    }
  });

  it('never opens a lesson on a context word — the first exercise is always the isolated introduction', () => {
    // CURRICULUM CRITIC: `(idx + turnOffset) % SIGHTINGS_PER_LETTER` put the
    // first letter's context word at round 0 whenever `turnOffset` was 0 —
    // true for 8 of the 9 real lessons — making a whole word in a script
    // the learner had never seen the very first thing they saw, including
    // in the first lesson of the entire course. A context sighting reinforces
    // a letter already met; it must never be the learner's first look at it.
    for (const l of letterLessons()) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      expect(ISOLATED_LETTER_KINDS.has(exercises[0].kind), l.id).toBe(true);
    }
  });

  it("every letter's context word is a real, already-recorded vocabulary word", () => {
    // THE CRITIC, BLOCKING: a first draft invented a new 40-word corpus
    // (`LETTER_CONTEXT_WORDS`, ids like `l-context-alif`) that existed
    // nowhere in the voice manifest — a `listenTap` review question built
    // from one of these, reachable once such a word is SRS-graded and
    // comes due, asked the learner to identify a word from audio that did
    // not exist. Every context word must resolve through `getWord` — i.e.
    // be a real member of `WORDS`, which `check:voice` already requires a
    // clip for — not a synthetic id nothing has ever recorded.
    for (const l of letterLessons()) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      const contextWords = exercises.filter((e) => !ISOLATED_LETTER_KINDS.has(e.kind) && 'word' in e);
      for (const ex of contextWords) {
        const w = (ex as { word: { id: string; urdu: string } }).word;
        expect(getWord(w.id), `${l.id}: ${w.id} is not a real WORDS entry`).toBeDefined();
      }
    }
  });

  it("every letter's context word actually contains that letter's own glyph", () => {
    // URD-021's own complaint about the old design: a match on transliteration
    // substring, not on whether the word contains the letter at all.
    for (const letter of LETTERS) {
      const lesson = letterLessons().find((l) => l.letterIds!.includes(letter.id));
      if (!lesson) continue;
      const exercises = buildLessonExercises(lesson, [], 'both', new Set());
      const contextWords = exercises.filter((e) => !ISOLATED_LETTER_KINDS.has(e.kind) && 'word' in e) as {
        word: { urdu: string };
      }[];
      const match = contextWords.find((e) => e.word.urdu.includes(letter.forms.isolated));
      expect(match, `${letter.id}: no context word contains its glyph`).toBeDefined();
    }
  });

  it('never gives two letters in the same lesson the identical context word', () => {
    // THE CRITIC: nothing previously locked this in — it held only by luck
    // of which words `LETTER_CONTEXT_WORD` happened to pick. A word like
    // پانی contains both alif and pe; assigning it to both would spend two
    // of a lesson's context slots on one piece of vocabulary instead of two.
    for (const l of letterLessons()) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      const contextWordIds = exercises
        .filter((e) => !ISOLATED_LETTER_KINDS.has(e.kind) && 'word' in e)
        .map((e) => (e as { word: { id: string } }).word.id);
      expect(new Set(contextWordIds).size, l.id).toBe(contextWordIds.length);
    }
  });
});

describe('URD-022: visually confusable letters are not drilled back to back', () => {
  const letterLessons = () => UNITS.flatMap((u) => u.lessons).filter((l) => l.kind === 'letters');
  const ISOLATED_LETTER_KINDS = new Set(['letterForm', 'letterPick', 'letterTrace']);
  const bucketKeyOf = (letterId: string) => getLetter(letterId)?.confusableWith ?? letterId;

  /**
   * The exercise stream doesn't carry a letter id for a context-word
   * exercise directly (it carries the word), so recover which letter of
   * *this lesson* that word was standing in for via `LETTER_CONTEXT_WORD`
   * — the same map `buildLessonExercises` used to pick it in the first
   * place. Every letters-kind exercise resolves to exactly one letter id;
   * this throws rather than silently skipping if one doesn't, since a
   * silent skip would quietly shrink the sequence being checked for
   * adjacency, which is exactly the kind of check that could pass by
   * accident (see URD-020's own history of that mistake).
   */
  const letterIdOf = (e: { kind: string; letter?: { id: string }; word?: { id: string } }, lesson: Lesson) => {
    if (ISOLATED_LETTER_KINDS.has(e.kind)) return e.letter!.id;
    const id = lesson.letterIds!.find((lid) => LETTER_CONTEXT_WORD.get(lid)?.id === e.word!.id);
    if (!id) throw new Error(`${lesson.id}: context exercise for word ${e.word!.id} matches no taught letter`);
    return id;
  };

  /**
   * THE CRITIC / CURRICULUM CRITIC, reviewing the first version of these
   * tests: both looped `i < n - 1` where `n` was the lesson's letter count
   * (7 for `l-3`), not its exercise count (42 for `l-3`) — so they only
   * ever examined round 0 and one fixed pair (`ids[n-1]` vs `ids[0]`),
   * never the other 4 round transitions. Both still passed, because round
   * 0 genuinely has no adjacency and that one fixed pair happens to be one
   * of the real violations — they passed for the right *pair* but by
   * accident of which single position they happened to check, the same
   * "check that cannot fail" shape as `check-shape.js`'s own first draft of
   * this rule (see its doc comment). Replaced with one test that walks
   * every adjacent pair in the real, full generated sequence and asserts
   * an *exact* count, computed from the group's own bucket sizes and round
   * count — not "small", not "at most N": exactly the number a bucket that
   * size forces, once per round transition (see `separateConfusables`'s
   * own doc comment in `generator.ts` for the proof this recurs every
   * transition rather than once).
   */
  it("adjacent confusable-bucket letters occur exactly as often as the group's own bucket sizes force, never more", () => {
    for (const l of letterLessons()) {
      const letters = l.letterIds!.map((id) => getLetter(id)!);
      const bucketSizes = new Map<string, number>();
      for (const letter of letters) {
        const key = bucketKeyOf(letter.id);
        bucketSizes.set(key, (bucketSizes.get(key) ?? 0) + 1);
      }
      const largest = Math.max(...bucketSizes.values());
      const n = letters.length;
      const perTransitionForced = Math.max(0, 2 * largest - n);

      const exercises = buildLessonExercises(l, [], 'both', new Set());
      const ids = exercises.map((e) => letterIdOf(e, l));
      const rounds = n > 0 ? exercises.length / n : 0;
      const expected = perTransitionForced * Math.max(0, rounds - 1);

      let found = 0;
      for (let i = 0; i < ids.length - 1; i++) {
        if (bucketKeyOf(ids[i]) === bucketKeyOf(ids[i + 1]) && ids[i] !== ids[i + 1]) found++;
      }
      expect(found, `${l.id}: expected exactly ${expected} forced adjacencies, found ${found}`).toBe(expected);
    }
  });
});

describe('URD-023/URD-A02: a phrases lesson always draws enough typeable phrases to clear the share floor', () => {
  /**
   * A phrases lesson has exactly three reachable kinds (`typeWord`,
   * `meaningPick`, `wordFromMeaning` — see the generator's own doc comment
   * on the `phrases` branch), so no single kind may exceed 40% of the
   * lesson (`check:shape`'s share rule).
   *
   * URD-023 (original fix): the draw of 6 from 28 phrases used to be
   * uniform with no floor on how many were typeable, and `produceCount` was
   * computed *after* the draw — so a draw of fewer than 2 typeable phrases
   * (8.24% of draws, hypergeometric: 14 of 28 typeable, 6 drawn) could not
   * be rescued by any reassignment.
   *
   * URD-A02: `size` stopped meaning "phrases drawn, one exercise each" and
   * started meaning "phrases drawn, three sightings each" (see the
   * generator's own phrases-branch doc comment) — a synthetic 6-phrase
   * lesson is no longer a real scenario this kind can be asked to produce;
   * `units.ts`'s `P()` now throws building one outside 10-17, the range the
   * new formula actually holds `meetShare <= 0.4` for (below 10, `meet`'s
   * share of the now-3x exercise count exceeds it; above 17, the guaranteed-
   * typeable pool — 14 of 28 phrases — runs out and the produce pass's
   * fallback-to-`meet` share grows past it from the other direction). 12
   * (this lesson's own real, shipped size) stands in for "many draws" the
   * same way the real course only ever exercises one seed.
   */
  const KINDS: Array<'typeWord' | 'meaningPick' | 'wordFromMeaning'> = ['typeWord', 'meaningPick', 'wordFromMeaning'];
  const phrasesLesson = (id: string): Lesson => ({
    id,
    title: 'synthetic phrases lesson',
    subtitle: '',
    icon: '💬', // audit:emoji-ok — matches the real P() lesson's own icon (units.ts)
    kind: 'phrases',
    xp: 20,
    size: 12,
  });

  it('never lets one exercise kind exceed 40% of the lesson, across many synthetic draws', () => {
    for (let i = 0; i < 500; i++) {
      const lesson = phrasesLesson(`synthetic-phrases-${i}`);
      const exercises = buildLessonExercises(lesson, [], 'both', new Set());
      const counts = { typeWord: 0, meaningPick: 0, wordFromMeaning: 0 };
      for (const e of exercises) {
        if (e.kind in counts) counts[e.kind as keyof typeof counts]++;
      }
      const maxShare = Math.max(...KINDS.map((k) => counts[k])) / exercises.length;
      expect(maxShare, `${lesson.id}: ${JSON.stringify(counts)}`).toBeLessThanOrEqual(0.4);
    }
  });

  it('draws at least size-2 typeable phrases into a 12-phrase lesson, every time', () => {
    // The specific guarantee the fix makes at the draw, not just its
    // downstream consequence (the share floor above) — asserted directly so
    // a future change that keeps the share floor by some other accident
    // still has to keep this property too.
    for (let i = 0; i < 500; i++) {
      const lesson = phrasesLesson(`synthetic-phrases-${i}`);
      const exercises = buildLessonExercises(lesson, [], 'both', new Set());
      const produced = exercises.filter((e) => e.kind === 'typeWord').length;
      expect(produced, lesson.id).toBeGreaterThanOrEqual(lesson.size - 2);
    }
  });

  it('gives every drawn phrase exactly three sightings, not one', () => {
    // URD-A02's own point: a phrases lesson is now a small climb, the same
    // shape as vocab's, not a large one-shot draw. Every phrase this lesson
    // teaches gets met, recalled and produced (or produced's own fallback),
    // never just one of the three.
    for (let i = 0; i < 200; i++) {
      const lesson = phrasesLesson(`synthetic-phrases-sightings-${i}`);
      const exercises = buildLessonExercises(lesson, [], 'both', new Set());
      const sightings = new Map<string, number>();
      for (const e of exercises) {
        if ('word' in e && e.word) sightings.set(e.word.id, (sightings.get(e.word.id) ?? 0) + 1);
      }
      expect(sightings.size, lesson.id).toBe(lesson.size);
      for (const n of sightings.values()) expect(n, lesson.id).toBe(3);
    }
  });

  it('the real, shipped phrases lesson clears the floor', () => {
    const lesson = UNITS.flatMap((u) => u.lessons).find((l) => l.kind === 'phrases');
    expect(lesson, 'no phrases lesson found in the real course').toBeDefined();
    const exercises = buildLessonExercises(lesson!, [], 'both', new Set());
    const counts = { typeWord: 0, meaningPick: 0, wordFromMeaning: 0 };
    for (const e of exercises) {
      if (e.kind in counts) counts[e.kind as keyof typeof counts]++;
    }
    const maxShare = Math.max(...KINDS.map((k) => counts[k])) / exercises.length;
    expect(maxShare, JSON.stringify(counts)).toBeLessThanOrEqual(0.4);
  });
});

describe('URD-025: a sentence-derived climb leans on sentenceBuild, not just recognition', () => {
  // `sentenceBuild` (produce) used to be tied for least of the three
  // reachable kinds — one turn of three, same as `meaningPick` (meet) and
  // `wordFromMeaning` (recall) — so the two purely-recognition kinds
  // combined got 2 of 3 reps against production's 1. `sentenceReinforceClimb`
  // (generator.ts) now gives every sentence 1 meet, 2 recall, 2 produce:
  // `produce` ties `recall` for the single most frequent kind rather than
  // trailing both, and `meet` — the purely passive kind — is the one that
  // gives up a turn. This is the maximum achievable without breaking
  // check:shape's own 40% single-kind-share ceiling (see the climb's own
  // doc comment for the worked-out arithmetic: making `produce` strictly
  // outnumber both others needs at least 10 turns per sentence, more than
  // triple today's length, which blows every real lesson past the 8 minute
  // band).
  const countsOf = (lesson: Lesson, track: 'both' | 'roman') => {
    const exercises = buildLessonExercises(lesson, [], track, new Set());
    const counts = { meaningPick: 0, wordFromMeaning: 0, sentenceBuild: 0 };
    for (const e of exercises) {
      if (e.kind in counts) counts[e.kind as keyof typeof counts]++;
    }
    return counts;
  };

  it('every sentences lesson gives sentenceBuild exactly as many turns as wordFromMeaning, and more than meaningPick', () => {
    for (const l of UNITS.flatMap((u) => u.lessons).filter((x) => x.kind === 'sentences')) {
      for (const track of ['both', 'roman'] as const) {
        const c = countsOf(l, track);
        if (c.sentenceBuild + c.meaningPick + c.wordFromMeaning === 0) continue; // Roman track may drop sentenceBuild entirely if untypeable
        expect(c.sentenceBuild, `${l.id}:${track} ${JSON.stringify(c)}`).toBe(c.wordFromMeaning);
        expect(c.sentenceBuild, `${l.id}:${track} ${JSON.stringify(c)}`).toBeGreaterThan(c.meaningPick);
      }
    }
  });

  it("every grammar lesson's sentence-reinforcement tail carries the identical ratio — the two call sites cannot drift apart", () => {
    for (const l of UNITS.flatMap((u) => u.lessons).filter((x) => x.kind === 'grammar')) {
      for (const track of ['both', 'roman'] as const) {
        const c = countsOf(l, track);
        if (c.sentenceBuild + c.meaningPick + c.wordFromMeaning === 0) continue;
        expect(c.sentenceBuild, `${l.id}:${track} ${JSON.stringify(c)}`).toBe(c.wordFromMeaning);
        expect(c.sentenceBuild, `${l.id}:${track} ${JSON.stringify(c)}`).toBeGreaterThan(c.meaningPick);
      }
    }
  });

  it('never lets one exercise kind exceed 40% of a sentences or grammar lesson, on either track', () => {
    for (const l of UNITS.flatMap((u) => u.lessons).filter((x) => x.kind === 'sentences' || x.kind === 'grammar')) {
      for (const track of ['both', 'roman'] as const) {
        const exercises = buildLessonExercises(l, [], track, new Set());
        if (!exercises.length) continue;
        const counts: Record<string, number> = {};
        for (const e of exercises) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
        const maxShare = Math.max(...Object.values(counts)) / exercises.length;
        expect(maxShare, `${l.id}:${track} ${JSON.stringify(counts)}`).toBeLessThanOrEqual(0.4);
      }
    }
  });

  // THE CRITIC, reviewing this item: a green `vitest run` said nothing about
  // the 3-8 minute band `check:shape` actually enforces, so this suite could
  // pass while `npm run check:shape -- --kind=grammar` — the item's own
  // verify command — still failed. It did, for one lesson: g-plurals had
  // only 3 readable sentences tagged to it (a content gap, not a climb one)
  // and landed at 2.7 minutes, under the 3.0 floor even at this climb's
  // ratio. Tracked as URD-029 and asserted here as a named exception, so the
  // gap couldn't regress further unnoticed and couldn't be "fixed" by
  // quietly loosening this assertion instead of the content.
  //
  // URD-029: closed by re-tagging an existing sentence, s-77 ("میرے تین
  // دوست ہیں"), from g-possess to g-plurals — see src/data/sentences.ts's
  // own comment there for why (an earlier attempt authored a brand-new
  // sentence instead; reverted, since this repo has no TTS credential to
  // give a new sentence a voice clip, and separately because it duplicated
  // a plural pattern g-plurals already covered rather than filling the one
  // it didn't). g-plurals now has 4 readable sentences and reaches 3.45
  // minutes, clear of the floor with no exception needed, so this asserts
  // the universal rule directly rather than keeping a now-empty exception
  // set around.
  it('every sentences and grammar lesson reaches at least 3 minutes', () => {
    const SECS_PER_EXERCISE = 9;
    for (const l of UNITS.flatMap((u) => u.lessons).filter((x) => x.kind === 'sentences' || x.kind === 'grammar')) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      if (!exercises.length) continue;
      const minutes = (exercises.length * SECS_PER_EXERCISE) / 60;
      expect(minutes, `${l.id}: ${minutes.toFixed(2)} min`).toBeGreaterThanOrEqual(3.0);
    }
  });
});

describe('URD-027: sibling "sentences" lessons at the same level draw disjoint sentences', () => {
  // Before this fix, each "sentences" lesson drew independently
  // (`seededShuffle(pool, lesson.id).slice(0, size)`), with no notion of
  // what a sibling lesson at the same level had already drawn — measured:
  // only 81 of 256 sentences (31.6%) were ever reachable course-wide.
  // `sentencesForLesson` (generator.ts) now excludes whatever an earlier
  // sibling already drew. `check:sentence-coverage` (scripts/) holds the
  // same invariant whole-course; this is the fast, pure-logic companion.
  //
  // The real invariant is zero overlap, not "every lesson reaches its
  // designed size" — URD-048 found a real case (`s-intermediate`/
  // `s-intermediate-2`) where two siblings share a readable-at-position
  // pool too thin to fill both combined slots distinctly, and
  // `sentencesForLesson` deliberately draws a lesson short there rather
  // than reuse a sibling's sentence. Asserting the stricter "always hits
  // capacity" version here would fail on that honest, correct behavior.
  const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'] as const;

  it('never lets two sibling "sentences" lessons at the same level share a sentence', () => {
    for (const level of LEVELS) {
      const lessons = UNITS.flatMap((u) => u.lessons).filter((l) => l.kind === 'sentences' && l.level === level);
      const seenIds = new Set<string>();
      let totalPicked = 0;
      for (const l of lessons) {
        const exercises = buildLessonExercises(l, [], 'both', new Set());
        const ids = new Set(exercises.filter((e) => e.kind === 'sentenceBuild').map((e) => e.sentence.id));
        for (const id of ids) seenIds.add(id);
        totalPicked += ids.size;
      }
      // Zero overlap: every lesson's own distinct sentence count summed
      // equals the union's size — if a sibling had repeated another's pick,
      // the union would be smaller than the sum.
      expect(seenIds.size, level).toBe(totalPicked);
    }
  });

  it('never leaves a grammar concept with zero sentences shown by any "sentences" lesson', () => {
    // CURRICULUM CRITIC, reviewing this item: a uniform random draw
    // structurally favours a concept taught early in a level (more sibling
    // lessons come after it, so more lottery tickets) over one taught late
    // — measured before this fix, g-future and g-compound were shown to a
    // learner nowhere except their own one-shot grammar lesson. Every
    // concept with at least one readable, tagged sentence at some
    // "sentences" lesson position must get at least one.
    const reachable = new Set<string>();
    for (const l of UNITS.flatMap((u) => u.lessons).filter((x) => x.kind === 'sentences')) {
      const exercises = buildLessonExercises(l, [], 'both', new Set());
      for (const e of exercises) if (e.kind === 'sentenceBuild') reachable.add(e.sentence.id);
    }
    for (const concept of GRAMMAR) {
      const tagged = SENTENCES.filter((s) => s.concept === concept.id);
      if (!tagged.length) continue;
      const reached = tagged.filter((s) => reachable.has(s.id));
      expect(reached.length, `${concept.id}: 0 of ${tagged.length} tagged sentences ever reached`).toBeGreaterThan(0);
    }
  });
});

describe('URD-030: distractorsFor prefers a caller-supplied pool before its main one', () => {
  // Synthetic words, not real vocabulary: what matters is `preferred` being
  // tried first, a property of `distractorsFor` itself, not of any real
  // corpus content. Distinct `.meaning`s so `distinctMeaning: true` (the
  // option every real caller of `preferred` also sets) doesn't reject any
  // of them itself.
  const target = { ...WORDS[0], id: 'test-target', urdu: 'ٹیسٹ-ٹ', meaning: 'test target' };
  const preferredWords = ['a', 'b', 'c'].map((letter, i) => ({
    ...WORDS[i + 1],
    id: `test-preferred-${letter}`,
    urdu: `ٹیسٹ-پ${i}`,
    meaning: `preferred meaning ${letter}`,
  }));
  const poolWords = ['x', 'y', 'z'].map((letter, i) => ({
    ...WORDS[i + 4],
    id: `test-pool-${letter}`,
    urdu: `ٹیسٹ-م${i}`,
    meaning: `pool meaning ${letter}`,
  }));

  // CURRICULUM CRITIC, reviewing this item: an uncapped `preferred` filled
  // every slot whenever a concept had enough near-misses (measured live: 580
  // of 584 grammar-climb `wordFromMeaning` exercises had ALL three
  // distractors same-concept) — a question with no option left that just
  // *looks* different from the answer. Capped at `DISTRACTORS - 1`, tested
  // here with 3 preferred candidates (one more than the cap allows) to prove
  // the excess is never used.
  it('reserves at least one distractor for the main pool, even when `preferred` alone could fill every slot', () => {
    const distractors = distractorsFor(target, poolWords, { distinctMeaning: true, preferred: preferredWords });
    expect(distractors).toHaveLength(OPTIONS_PER_QUESTION - 1);
    const fromPreferred = distractors.filter((d) => d.id.startsWith('test-preferred-'));
    const fromPool = distractors.filter((d) => d.id.startsWith('test-pool-'));
    expect(fromPreferred).toHaveLength(OPTIONS_PER_QUESTION - 2);
    expect(fromPool).toHaveLength(1);
  });

  it('widens to the main pool once `preferred` runs out below the cap', () => {
    const distractors = distractorsFor(target, poolWords, {
      distinctMeaning: true,
      preferred: preferredWords.slice(0, 1),
    });
    expect(distractors).toHaveLength(OPTIONS_PER_QUESTION - 1);
    const fromPreferred = distractors.filter((d) => d.id.startsWith('test-preferred-'));
    const fromPool = distractors.filter((d) => d.id.startsWith('test-pool-'));
    expect(fromPreferred).toHaveLength(1);
    expect(fromPool.length).toBeGreaterThan(0);
  });

  it('never lets the main pool re-fill the reserved slot with a `preferred` candidate the cap turned away', () => {
    // `pool` here deliberately CONTAINS every `preferred` word too (the real
    // shape: `preferred` is filtered out of the concept's own level-wide
    // pool, not a disjoint set) — proving the reserved slot is genuinely
    // non-preferred rather than merely capped-then-refilled from the same
    // candidates by the second `consider` pass.
    const poolIncludingPreferred = [...preferredWords, ...poolWords];
    const distractors = distractorsFor(target, poolIncludingPreferred, {
      distinctMeaning: true,
      preferred: preferredWords,
    });
    const fromPreferred = distractors.filter((d) => d.id.startsWith('test-preferred-'));
    expect(fromPreferred).toHaveLength(OPTIONS_PER_QUESTION - 2);
  });

  it('omitting `preferred` draws exactly as before — every existing caller is unaffected', () => {
    const withoutPreferred = distractorsFor(target, poolWords, { distinctMeaning: true });
    expect(withoutPreferred.every((d) => d.id.startsWith('test-pool-'))).toBe(true);
  });
});

describe("URD-030: the grammar climb's sentence-reinforcement distractors are concept-aware", () => {
  // g-plurals (fixed by URD-029) has 4 readable sentences, all tagged
  // g-plurals — so for any one of them, the other 3 are a `preferred` pool
  // richer than the `DISTRACTORS - 1` cap allows to be used. `wordFromMeaning`
  // doesn't require `distinctCue` (unlike `meaningPick`, where every
  // sentence's shared 📝 cue collides with its own answer's cue regardless of
  // this fix — a separate, structural limitation this item does not touch,
  // filed as URD-050), so exactly `DISTRACTORS - 1` of its options should be
  // g-plurals, and exactly one should not: a deterministic property of real
  // content (this pool is always this rich), not a shuffle-dependent one.
  const lesson = resolveLesson('g-plurals')!;

  it('every wordFromMeaning exercise for a g-plurals sentence has a same-concept majority and one non-concept anchor', () => {
    const exercises = buildLessonExercises(lesson, [], 'both');
    const relevant = exercises.filter((e) => e.kind === 'wordFromMeaning' && 'word' in e) as {
      word: { id: string; topic: string; concept?: string };
      options: { id: string; concept?: string }[];
    }[];
    const sentenceDerived = relevant.filter((ex) => ex.word.topic === 'sentences' && ex.word.concept);
    expect(sentenceDerived.length, 'g-plurals should emit at least one such exercise').toBeGreaterThan(0);
    for (const ex of sentenceDerived) {
      const distractors = ex.options.filter((o) => o.id !== ex.word.id);
      const sameConcept = distractors.filter((d) => d.concept === ex.word.concept);
      expect(sameConcept.length, JSON.stringify(ex.options)).toBe(OPTIONS_PER_QUESTION - 2);
      expect(distractors.length - sameConcept.length, JSON.stringify(ex.options)).toBeGreaterThan(0);
    }
  });

  // THE CRITIC, reviewing this item: `sentenceReinforceClimb` is shared with
  // the plain `sentences` branch below, and a `sentences`-kind lesson's picks
  // CAN carry a `.concept` (URD-027's concept-priority slotting sometimes
  // puts one there) — so this fix's effect on `sentences`-kind lessons was
  // real (measured: 380 of 576 concept-tagged exercises gained a same-concept
  // distractor, up from a chance-level 21.5%) but had no test of its own.
  // Not asserting an exact same-concept count here the way the g-plurals test
  // above does — a `sentences`-kind lesson's picks span many different
  // concepts with varying pool sizes, so the richness g-plurals happens to
  // have (always ≥3 candidates) isn't guaranteed everywhere — only the
  // invariant the cap actually promises: never fully saturated.
  it('no sentences-kind lesson exercise saturates every distractor with the same concept', () => {
    let sampledAtLeastOne = false;
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'sentences') continue;
        const exercises = buildLessonExercises(l, [], 'both');
        const relevant = exercises.filter((e) => e.kind === 'wordFromMeaning' && 'word' in e) as {
          word: { id: string; topic: string; concept?: string };
          options: { id: string; concept?: string }[];
        }[];
        for (const ex of relevant.filter((e) => e.word.topic === 'sentences' && e.word.concept)) {
          sampledAtLeastOne = true;
          const distractors = ex.options.filter((o) => o.id !== ex.word.id);
          const sameConcept = distractors.filter((d) => d.concept === ex.word.concept);
          expect(sameConcept.length, `${l.id}: ${JSON.stringify(ex.options)}`).toBeLessThan(OPTIONS_PER_QUESTION - 1);
        }
      }
    }
    expect(sampledAtLeastOne, 'expected at least one sentences-kind lesson to emit a concept-tagged exercise').toBe(
      true
    );
  });
});

describe('URD-035: a grammarDrill exercise carries romanOptions on every track, not only roman', () => {
  /**
   * `GrammarDrillExercise` (GrammarExercises.tsx) reads `romanOptions` the
   * instant a learner picks an answer, on every track — it feeds the
   * "show the pronunciation" caption `showRoman` defaults on for, not only
   * the Roman track's own full-transliteration display. Before this fix,
   * `grammarDrillExercise` (this file) only ever computed it for `track ===
   * 'roman'`, so a script/`both` track pick read `undefined[i]` and crashed
   * with an uncaught TypeError — reproduced live via soak on three
   * independent seeds/concepts, initially misattributed to the *previous*
   * screen (`GrammarTeachExercise`) because the truncated error message
   * named neither a file nor a component.
   *
   * Every real drill in the corpus (checked directly, not assumed) has
   * `romanAll`-transliatable options, so this holds for all 38 of them on
   * every track today; the point of asserting it here is that a future
   * concept whose options `romanAll` can't handle stays a component-level
   * fallback (still fixed, see GrammarExercises.tsx) rather than silently
   * regressing back to "only defined on the Roman track."
   */
  it('every real grammar drill exercise has romanOptions on the script, both and roman tracks alike', () => {
    let sampled = 0;
    for (const u of UNITS) {
      for (const l of u.lessons) {
        if (l.kind !== 'grammar') continue;
        // THE CRITIC: the first version of this only sampled `both`/`roman`,
        // missing `script` — a real, independently reachable crash path,
        // since `showRoman` is a learner-toggleable setting that only turns
        // *off automatically* when switching *to* `script` (useSettingsStore
        // .ts's `setTrack`), not a permanent lock; a learner can flip it back
        // on while staying on `script` and hit the identical crash site.
        for (const track of ['script', 'both', 'roman'] as const) {
          const exercises = buildLessonExercises(l, [], track);
          for (const e of exercises) {
            if (e.kind !== 'grammarDrill') continue;
            sampled++;
            expect(e.romanOptions, `${l.id} (${track}): ${JSON.stringify(e.drill.options)}`).toBeDefined();
            expect(e.romanOptions?.length, l.id).toBe(e.drill.options.length);
          }
        }
      }
    }
    expect(sampled, 'expected at least one real grammarDrill exercise to sample').toBeGreaterThan(0);
  });

  it('every real grammar concept has options romanAll can transliterate', () => {
    // The generator-level guarantee the test above depends on: if this ever
    // fails for a real concept, the test above would start failing too, but
    // this names the actual cause (an untransliterable drill) rather than
    // leaving it to be rediscovered from a missing-romanOptions message.
    for (const c of GRAMMAR) {
      for (const d of c.drills) {
        expect(romanAll(d.options), `${c.id}/${d.id}: ${JSON.stringify(d.options)}`).toBeDefined();
      }
    }
  });
});

describe('URD-040: a review touches the grammar concept(s) its own unit taught', () => {
  it('rev-saying-who-you-are (u4) asks about both g-pronouns and g-to-be, the concepts the unit is named for and organized around', () => {
    // The item's own measured example: this review used to draw entirely
    // from V('rooms')/V('adjectives') and never once touch either concept.
    const lesson = resolveLesson('rev-saying-who-you-are')!;
    const exercises = buildLessonExercises(lesson, [], 'both');
    const seen = new Set(exercises.filter((e) => e.kind === 'grammarDrill').map((e) => e.concept.id));
    expect(seen).toEqual(new Set(['g-pronouns', 'g-to-be']));
  });

  it('every unit review touches every grammar concept its own unit taught, on every track', () => {
    let unitsWithConcepts = 0;
    for (const u of UNITS) {
      const reviewLesson = u.lessons.find((l) => l.kind === 'review');
      if (!reviewLesson) continue;
      const unitConcepts = new Set(
        u.lessons.filter((l) => l.kind === 'grammar' && l.conceptId).map((l) => l.conceptId as string)
      );
      if (unitConcepts.size === 0) continue; // most units teach no grammar concept of their own
      unitsWithConcepts++;
      for (const track of ['script', 'both', 'roman'] as const) {
        const exercises = buildLessonExercises(reviewLesson, [], track);
        const seen = new Set(exercises.filter((e) => e.kind === 'grammarDrill').map((e) => e.concept.id));
        expect(seen, `${reviewLesson.id} (${track})`).toEqual(unitConcepts);
      }
    }
    expect(unitsWithConcepts, 'expected at least one real unit with a grammar concept to sample').toBeGreaterThan(0);
  });

  it("does not grow a review's total exercise count -- the concept exercise(s) are budgeted out of the existing size, not appended past it", () => {
    const lesson = resolveLesson('rev-saying-who-you-are')!;
    const exercises = buildLessonExercises(lesson, [], 'both');
    expect(exercises.length).toBe(lesson.size);
  });

  it('leaves a review with no grammar concept of its own unaffected', () => {
    const reviewsWithNoConcept = UNITS.filter((u) => u.lessons.every((l) => l.kind !== 'grammar')).flatMap((u) =>
      u.lessons.filter((l) => l.kind === 'review')
    );
    expect(reviewsWithNoConcept.length).toBeGreaterThan(0);
    for (const lesson of reviewsWithNoConcept) {
      const exercises = buildLessonExercises(lesson, [], 'both');
      expect(
        exercises.some((e) => e.kind === 'grammarDrill'),
        lesson.id
      ).toBe(false);
      expect(exercises.length).toBe(lesson.size);
    }
  });

  it('CURRICULUM CRITIC: which drill a concept surfaces rotates across replays, not the same one forever', () => {
    // g-to-be has 3 real drills — a first version of this fix always asked
    // for c.drills[0], so every replay of rev-saying-who-you-are showed the
    // literal same prompt/blank/answer for g-to-be, forever: a learner
    // stops reasoning about the concept and starts recalling "the answer to
    // this exact screen". Threading `visit` (URD-039's replay counter, this
    // branch's own base) through the drill pick fixes it the same way
    // URD-039 fixed the identical staleness for words/letters.
    const lesson = resolveLesson('rev-saying-who-you-are')!;
    const drillIdsFor = (visit: number) => {
      const exercises = buildLessonExercises(lesson, [], 'both', new Set(), visit);
      return exercises
        .filter((e) => e.kind === 'grammarDrill')
        .filter((e) => e.concept.id === 'g-to-be')
        .map((e) => e.drill.id);
    };
    const seenAcrossVisits = new Set(Array.from({ length: 6 }, (_, visit) => drillIdsFor(visit).join(',')));
    expect(seenAcrossVisits.size).toBeGreaterThan(1);
  });

  it('the same visit reproduces the identical drill pick — a rotation, not fresh randomness on every render', () => {
    const lesson = resolveLesson('rev-saying-who-you-are')!;
    const pickAt = (visit: number) =>
      buildLessonExercises(lesson, [], 'both', new Set(), visit)
        .filter((e) => e.kind === 'grammarDrill')
        .map((e) => e.drill.id);
    expect(pickAt(2)).toEqual(pickAt(2));
  });

  it('defaults to visit 0 when omitted, matching every pre-URD-040 caller', () => {
    // A full exercise-array comparison isn't meaningful here: distractor
    // selection elsewhere in this file draws on unseeded `Math.random`
    // (`rand`, top of this file), so two calls with identical arguments
    // already differ in ways unrelated to `visit`. The drill *pick* itself
    // is what `visit` controls, so that's what omitting it should match.
    const lesson = resolveLesson('rev-saying-who-you-are')!;
    const drillIds = (exercises: ReturnType<typeof buildLessonExercises>) =>
      exercises.filter((e) => e.kind === 'grammarDrill').map((e) => `${e.concept.id}:${e.drill.id}`);
    const withDefault = drillIds(buildLessonExercises(lesson, [], 'both'));
    const explicit0 = drillIds(buildLessonExercises(lesson, [], 'both', new Set(), 0));
    expect(withDefault).toEqual(explicit0);
  });
});
