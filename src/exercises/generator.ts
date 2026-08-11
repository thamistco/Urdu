import { LETTERS, getLetter, Letter, PositionKey, POSITIONS } from '../data/letters';
import { WORDS, getWord, wordsByTopic, glossOf, Word, PHRASES } from '../data/words';
import { Lesson, ALL_LESSONS } from '../data/units';
import { getGrammar, type GrammarConcept, type GrammarDrill } from '../data/grammar';
import { romanAll } from '../lib/translit';
import { romanRevealsMeaning } from '../lib/giveaway';
import type { LearnTrack } from '../store/useSettingsStore';
import {
  SENTENCES,
  PASSAGES,
  DIALOGUES,
  getPassage,
  getDialogue,
  registerOf as pronounRegisterOf,
  type Sentence,
} from '../data/sentences';
import { cueOf, VERDICT_CUES } from '../data/art';
import { GLYPH_MASKS } from '../data/glyphMasks';
import { shuffle, seededShuffle } from '../lib/shuffle';
import { Exercise, ItemRef } from './types';

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function sample<T>(pool: T[], n: number, exclude: (t: T) => boolean): T[] {
  return shuffle(pool.filter((t) => !exclude(t))).slice(0, n);
}

/**
 * Phrases reshaped as word-like items so they flow through the same exercises.
 *
 * `register` is set from the phrase's own text — تم makes it casual, آپ makes
 * it polite — the same pronoun read `sentences.ts` already does for sentences
 * and dialogue lines. That lets `glossOf` (words.ts) show it automatically:
 * register there is "the word's own, or its topic's", and a phrase's own is
 * exactly what this computes. Nothing extra to maintain, and a phrase using
 * "aap" or "tum" cannot silently go unmarked the way a hand-kept field would.
 */
const PHRASE_WORDS: Word[] = PHRASES.map((p) => ({
  id: p.id,
  urdu: p.urdu,
  roman: p.roman,
  meaning: p.meaning,
  emoji: '💬', // audit:emoji-ok — phrases have no picture of their own
  topic: 'phrases',
  register: pronounRegisterOf(p.urdu),
}));

/**
 * Sentences reshaped as word-like items, the same move as `PHRASE_WORDS`
 * above and for the same reason: `sentenceBuild` was the only exercise kind
 * a sentence could appear in, which meant a sentences lesson could not be
 * lengthened into a sitting without becoming 100% one kind the moment it
 * passed six exercises — the exact failure `check:shape`'s share rule
 * catches, and the one letters and phrases both had before their own fixes.
 *
 * `id` is the sentence's own id, not a new one, which matters beyond
 * consistency: `check:voice`'s speakable list already includes every
 * `Sentence`, so the "hear it" button on a `meaningPick`/`wordFromMeaning`
 * exercise resolves to a clip that already exists. Nothing new needed
 * generating or auditing.
 */
const SENTENCE_WORDS: Word[] = SENTENCES.map((s) => ({
  id: s.id,
  urdu: s.words.join(' '),
  roman: s.roman,
  meaning: s.meaning,
  emoji: '📝', // audit:emoji-ok — a sentence has no picture of its own
  topic: 'sentences',
  level: s.level,
  register: pronounRegisterOf(s.words.join(' ')),
}));

const getAnyWord = (id: string): Word | undefined =>
  getWord(id) ?? PHRASE_WORDS.find((w) => w.id === id) ?? SENTENCE_WORDS.find((w) => w.id === id);

/** Distractors for a review item. Phrases and sentences are not in WORDS, so
 *  `wordsByTopic` returns nothing for them and they would be offered against
 *  random nouns. */
const poolFor = (w: Word): Word[] =>
  w.topic === 'phrases' ? PHRASE_WORDS : w.topic === 'sentences' ? SENTENCE_WORDS : wordsByTopic(w.topic);

// ---- per-item exercise builders -----------------------------------------

function letterExercise(letter: Letter): Exercise {
  // Three ways to meet a letter: name the position of a glyph, pick the glyph
  // out of four, or draw it. Tracing is the slowest, so it stays a minority.
  const roll = Math.random();
  const position = rand(POSITIONS.map((p) => p.key)) as PositionKey;

  // Tracing needs a generated mask; without one there is nothing to score
  // against, so fall through rather than showing a card that cannot be answered.
  if (roll < 0.3 && GLYPH_MASKS[`${letter.id}:${position}`]) {
    return { kind: 'letterTrace', letter, position };
  }
  if (roll < 0.72) {
    return { kind: 'letterForm', letter, position, options: POSITIONS.map((p) => p.key) };
  }
  const distractors = sample(LETTERS, DISTRACTORS, (l) => l.id === letter.id);
  return { kind: 'letterPick', letter, options: shuffle([letter, ...distractors]) };
}

/**
 * The same three forms `letterExercise` offers, chosen by position rather than
 * `Math.random()`.
 *
 * Two callers, added at different times for different reasons, both landing on
 * the same fix. Review needed it first: a due queue this app can genuinely hand
 * a learner right after they finish the alphabet unit is mostly letters, and a
 * run of random picks over three kinds streaks by chance — measured, five
 * consecutive `letterPick` in a row on an all-letters due queue.
 *
 * The letter-teaching lessons needed it for a different reason (URD-013): a
 * lesson generated at render time rather than fixed content means a learner who
 * leaves and comes back gets a different lesson, and every check that counts
 * exercise kinds over letter lessons reports a different number on every run —
 * measured, `letterPick` moved between 65 and 77 across consecutive runs of the
 * same check, before either caller existed. Position by index instead: the same
 * lesson, letter and turn always choose the same kind, so a learner returns to
 * what they left and a check gets an answer that holds still.
 *
 * `letterExercise` still exists and still calls `Math.random()`, for the one
 * caller left on it — weaving up to two due items into an unrelated lesson,
 * which is not "a letter lesson" in the sense either of the above cares about
 * and is deliberately out of scope for both.
 *
 * `turn` and `positionIndex` are separate parameters rather than one combined
 * index split by two different moduli. They were combined once, as `i`, with
 * `turn = i % 3` and `position = i % 4`; a caller trying to hold `turn` fixed
 * across several letters while still varying `position` per letter had to
 * construct `i` as `turn + 3 * idx`, and because 6 is a multiple of 3, that
 * construction silently repeated the same `i` — same turn *and* same position
 * — every three rounds, for reasons that took longer to find than to fix.
 * Two independent parameters make each caller's intent an argument rather
 * than an assumption about how they interact.
 */
function letterExerciseAt(letter: Letter, turn: number, positionIndex: number): Exercise {
  const position = POSITIONS[((positionIndex % POSITIONS.length) + POSITIONS.length) % POSITIONS.length]
    .key as PositionKey;
  const t = ((turn % 3) + 3) % 3;
  if (t === 0 && GLYPH_MASKS[`${letter.id}:${position}`]) {
    return { kind: 'letterTrace', letter, position };
  }
  if (t !== 2) {
    return { kind: 'letterForm', letter, position, options: POSITIONS.map((p) => p.key) };
  }
  const distractors = sample(LETTERS, DISTRACTORS, (l) => l.id === letter.id);
  return { kind: 'letterPick', letter, options: shuffle([letter, ...distractors]) };
}

/**
 * Pick three distractors.
 *
 * `distinctCue` — the options must all *look* different: a picture question is
 * unanswerable if two choices share an illustration or emoji.
 * `distinctMeaning` — the options must all *mean* different things: 28 pairs of
 * words in the vocabulary share an English gloss, and a question with two right
 * answers is worse than no question.
 */
/**
 * How many tiles a multiple-choice question shows, counting the answer.
 *
 * Four, because the tiles are laid out two to a row: four is a full 2×2 block
 * and five leaves an orphan sitting alone on a third row, which looks like a
 * mistake and pushes the last option toward the fold on a small screen.
 *
 * Five was tried for the lower guess rate — 20% against 25% — and the reasoning
 * was sound but aimed at the wrong problem. What actually made questions easy
 * was never the count: it was that the shuffle left the answer in the first
 * position 43.7% of the time, and that the placement test asked two-option
 * yes/no questions a coin could pass. Both of those are fixed, and with a
 * genuinely uniform shuffle a four-option question is an honest 25%.
 *
 * The floor is enforced: `check:answerable` fails on any question offering
 * fewer, which is what caught the placement test's coin flips.
 */
export const OPTIONS_PER_QUESTION = 4;
const DISTRACTORS = OPTIONS_PER_QUESTION - 1;

function distractorsFor(word: Word, pool: Word[], { distinctCue = false, distinctMeaning = false } = {}): Word[] {
  const chosen: Word[] = [];
  const usedCues = new Set<string>([cueOf(word)]);
  const usedMeanings = new Set<string>([word.meaning.toLowerCase()]);
  const consider = (candidates: Word[]) => {
    for (const c of shuffle(candidates)) {
      if (chosen.length >= DISTRACTORS) return;
      if (c.id === word.id || chosen.some((x) => x.id === c.id)) continue;
      if (distinctCue) {
        const cue = cueOf(c);
        if (usedCues.has(cue) || VERDICT_CUES.has(cue)) continue;
        usedCues.add(cue);
      }
      if (distinctMeaning) {
        const m = c.meaning.toLowerCase();
        if (usedMeanings.has(m)) continue;
        usedMeanings.add(m);
      }
      chosen.push(c);
    }
  };
  consider(pool); // prefer same-topic distractors
  if (chosen.length < DISTRACTORS) consider(WORDS); // widen if the topic is too uniform
  return chosen;
}

/**
 * How much the learner has to supply themselves.
 *
 *  meet     — recognise it: a set of choices, with a picture or the word in
 *             front of them. Right for a word they are seeing for the first
 *             time. See OPTIONS_PER_QUESTION for how many.
 *  recall   — retrieve it: given only the English, choose the Urdu.
 *  produce  — write it: given only the English, type it with nothing to pick
 *             from. Reserved for words already met, or review.
 */
type Demand = 'meet' | 'recall' | 'produce';

/** Typing a five-word honorific phrase is a spelling test, not a memory test. */
const isTypeable = (w: Word) => w.roman.replace(/[^a-z]/gi, '').length <= 12;

/**
 * How many tiles building this word would need — the same non-space split
 * `buildTilesFor` and `WordBuild` use, so the cap counts what the learner sees.
 * Counting `w.urdu.length` instead counts the space in a two word phrase as a
 * tile that is never rendered and never has to be placed.
 */
const buildableLetters = (w: Word) => Array.from(w.urdu).filter((c) => c.trim().length > 0).length;

/**
 * The longest word that can be built from letter tiles.
 *
 * Five was the original cap and it excluded 438 words the tray handles fine:
 * eight tiles plus the two decoys `buildTilesFor` adds is ten, which is the size
 * `sentenceBuild` already lays out. Raising it matters most on the script track,
 * where building is the only vocabulary exercise that makes a learner produce
 * Nastaliq rather than accept its transliteration.
 */
const MAX_BUILD_TILES = 8;

/**
 * How many times a letter is met inside the lesson that teaches it.
 *
 * The real letter groups run 4 to 7 letters (`lettersOfGroup` in letters.ts).
 * Six sightings puts the smallest group at 24 exercises (3.6 min) and the
 * largest at 42 (6.3 min), both comfortably inside the 3 to 8 minute band
 * without either end needing its own case. Chosen the same way
 * `SIGHTINGS_PER_WORD` was in units.ts: the smallest real group sets the floor,
 * not a round number picked first and checked after.
 */
const SIGHTINGS_PER_LETTER = 6;

/**
 * How many of a grammar concept's tagged sentences to draw into its
 * meet-recall-produce climb. At 3 exercises per sentence, 6 is 18 quiz
 * exercises; added to 1 teach and 1-3 drills, every concept whose tagged
 * pool reaches 6 lands at 20-22 total (3.0-3.3 min), comfortably inside
 * check:shape's 3-8 minute band with room to spare. Chosen the same way
 * `SIGHTINGS_PER_LETTER` was: it matches `G()`'s pre-existing default
 * `size` of 6, which nothing had ever made mean anything until now.
 */
const GRAMMAR_SENTENCE_TARGET = 6;

function wordExercise(
  word: Word,
  pool: Word[],
  track: LearnTrack,
  demand: Demand = 'meet',
  variant?: number
): Exercise {
  if (demand === 'produce' && isTypeable(word)) {
    return { kind: 'typeWord', word };
  }
  if (demand === 'recall' || demand === 'produce') {
    const opts = distractorsFor(word, pool, { distinctMeaning: true });
    return { kind: 'wordFromMeaning', word, options: shuffle([word, ...opts]) };
  }

  let v = variant ?? Math.floor(Math.random() * 3);
  // If we cannot build a visually distinct set, fall back to the text-based
  // "pick the meaning" question, which is always answerable.
  // Distinct pictures *and* distinct meanings. Only the picture used to be
  // required, which let ہاں and جی ہاں — both "yes" — sit in one question as two
  // correct answers. That was reachable all along and merely hidden, because one
  // of them spelled its register into its English ("yes (polite)") and so
  // compared unequal.
  const pictureOptions = distractorsFor(word, pool, { distinctCue: true, distinctMeaning: true });
  // A picture question needs a full set of visually distinct options; if the
  // vocabulary cannot supply them, fall back to the text question rather than
  // asking a narrower one.
  if (pictureOptions.length < DISTRACTORS && v !== 1) v = 1;

  // "What does it mean?" cannot be asked about a loanword on the Roman track:
  // the prompt is the transliteration and nothing else, so پنسل reads `pencil`
  // above an option reading "pencil". On the other tracks the script carries
  // the question and the exercise view withholds the Roman caption instead
  // (see romanRevealsMeaning in lib/giveaway). Here there is nothing left to
  // withhold, so the word gets asked about a different way.
  // Only when the vocabulary can supply a distinct picture set. Where it
  // cannot, the easy question stands: a loanword really is easy for someone
  // reading Roman, and swapping in an exercise that has too few options to be
  // answerable would trade a soft question for a broken one.
  if (
    v === 1 &&
    track === 'roman' &&
    pictureOptions.length >= DISTRACTORS &&
    romanRevealsMeaning(word.roman, word.meaning)
  ) {
    v = 0;
  }

  // A word whose picture is a tick or a cross cannot be asked about in
  // pictures, because the tile stops depicting the word and starts pointing at
  // the answer in the interface's own voice. Distractors cued that way are
  // already filtered out above; this is the other half, when the *answer* is
  // the one carrying the tick. It is asked about in words instead, which is
  // always available and never gives itself away.
  if (v !== 1 && VERDICT_CUES.has(cueOf(word))) v = 1;

  if (v === 1) {
    const opts = distractorsFor(word, pool, { distinctMeaning: true });
    return { kind: 'meaningPick', word, options: shuffle([word, ...opts]) };
  }
  if (v === 0) {
    return { kind: 'multipleChoice', word, options: shuffle([word, ...pictureOptions]) };
  }
  return { kind: 'listenTap', word, options: shuffle([word, ...pictureOptions]) };
}

/** Every letter that actually appears in the vocabulary — the distractor pool. */
const ALPHABET: string[] = Array.from(
  new Set(WORDS.flatMap((w) => Array.from(w.urdu)).filter((c) => c.trim().length > 0))
);

function buildTilesFor(word: Word): string[] {
  // Split into visual character units (grapheme-ish). Urdu combining marks are
  // rare in this vocab, so a code-point split is fine and keeps tiles legible.
  const chars = Array.from(word.urdu).filter((c) => c.trim().length > 0);
  // Two letters that do NOT belong. Without them the tray is the answer with
  // its order removed, and the exercise can be solved without reading anything.
  const decoys = shuffle(ALPHABET.filter((c) => !chars.includes(c))).slice(0, 2);
  return shuffle([...chars, ...decoys]);
}

/**
 * Tiles for a sentence: its own words plus a word or two that don't belong, for
 * the same reason. Decoys are drawn from other sentences at the same level so
 * they are plausible rather than obviously foreign.
 */
function sentenceTilesFor(sentence: Sentence): string[] {
  const own = new Set(sentence.words);
  const pool = SENTENCES.filter((s) => s.level === sentence.level && s.id !== sentence.id)
    .flatMap((s) => s.words)
    .filter((w) => !own.has(w));
  const decoys = shuffle(Array.from(new Set(pool))).slice(0, sentence.words.length > 5 ? 2 : 1);
  return shuffle([...sentence.words, ...decoys]);
}

/**
 * A sentence-building exercise, or nothing if it cannot be shown on this track.
 *
 * On the Roman track the tray has to be Roman, and a tray that is half
 * transliterated and half Nastaliq is worse than no exercise — so a sentence
 * whose tiles do not all resolve is skipped and the lesson draws another.
 * (Every sentence in the course currently resolves; this is what keeps that
 * true as sentences are added.)
 */
function sentenceExercise(sentence: Sentence, track: LearnTrack): Exercise | undefined {
  const tiles = sentenceTilesFor(sentence);
  if (track !== 'roman') return { kind: 'sentenceBuild', sentence, tiles };
  const romanTiles = romanAll(tiles);
  if (!romanTiles || !romanAll(sentence.words)) return undefined;
  return { kind: 'sentenceBuild', sentence, tiles, romanTiles };
}

/** The same, for a grammar drill: its options are inflected forms, and the
 *  Roman track needs all four of them transliterated or none. */
function grammarDrillExercise(concept: GrammarConcept, drill: GrammarDrill, track: LearnTrack): Exercise | undefined {
  if (track !== 'roman') return { kind: 'grammarDrill', concept, drill };
  const romanOptions = romanAll(drill.options);
  if (!romanOptions) return undefined;
  return { kind: 'grammarDrill', concept, drill, romanOptions };
}

/**
 * The word forms a learner has met by the time they reach a given lesson.
 *
 * Built from `taughtUpTo`, which is now a real record rather than an upper
 * bound, so this is genuinely "what is readable here" and not a guess.
 */
const readableFormsAt = (lessonId: string): Set<string> => {
  const taught = new Set(taughtUpTo(lessonId).words);
  const forms = new Set<string>();
  for (const w of WORDS) if (taught.has(w.id)) forms.add(w.urdu);
  return forms;
};

/**
 * Only show a sentence the learner can actually read.
 *
 * A sentence lesson used to take everything at its CEFR level, and a grammar
 * concept everything tagged with it, regardless of whether the vocabulary in
 * them had been taught yet. Measured after topics were spread across enough
 * lessons to cover them, 116 of 1,665 word forms in these lessons appeared
 * before the lesson that teaches them: "میز" is used by the beginner sentence
 * lesson at path position 58 and taught at 61.
 *
 * That was not caused by the split — before it, those same sentences drew on
 * words a learner had roughly a one in five chance of ever having been shown,
 * so the exposure was worse and simply unmeasurable. The split is what turned
 * it into a number, and a number is fixable.
 *
 * A word with no teaching position at all is left alone rather than treated as
 * unknown: proper nouns and inflected forms that no vocabulary entry owns would
 * otherwise disqualify most of the corpus.
 *
 * The unfiltered pool is the fallback, because a lesson with nothing in it is
 * worse than a lesson with one hard word. Measured across all 37 sentence and
 * grammar lessons on the path, the fallback is never reached — every one of
 * them has more fully readable sentences than it needs.
 */
function readableSentences(pool: Sentence[], lessonId: string): Sentence[] {
  const forms = readableFormsAt(lessonId);
  const taughtAnywhere = TAUGHT_FORMS;
  const ok = pool.filter((s) => (s.words ?? []).every((f: string) => !taughtAnywhere.has(f) || forms.has(f)));
  return ok.length ? ok : pool;
}

/** Every word form the course teaches anywhere, so an untaught-by-anyone form
 *  (a name, an inflection) is not mistaken for one the learner has not reached. */
const TAUGHT_FORMS = new Set(WORDS.map((w) => w.urdu));

/**
 * The third sighting: supply the word with nothing to pick from.
 *
 * Module scope because review needs it too. Review used to call
 * `wordExercise(..., 'produce')` directly, which silently degrades to
 * `wordFromMeaning` for anything untypeable — the same collision this function
 * exists to avoid, and it pushed four Roman review lessons past 40% one kind.
 */
function produceExercise(w: Word, pool: Word[], track: LearnTrack, teachesScript: boolean, i: number): Exercise {
  const canBuild = buildableLetters(w) <= MAX_BUILD_TILES && teachesScript;
  const canType = isTypeable(w);
  if (canBuild && (i % 2 === 0 || !canType)) {
    return { kind: 'wordBuild', word: w, tiles: buildTilesFor(w) };
  }
  if (canType) return { kind: 'typeWord', word: w };
  if (canBuild) return { kind: 'wordBuild', word: w, tiles: buildTilesFor(w) };
  /**
   * Neither typeable nor buildable — 82 words of the 2,281, and they bunch:
   * six of the ten in `v-hotel` are phrases like کمرے کی صفائی. These are the
   * hardest items in the corpus and they get the least demanding third
   * sighting, which is a real weakness and is recorded as such rather than
   * hidden. Nothing in the exercise set asks for production of a phrase this
   * long.
   *
   * It asks for the meaning rather than repeating the recall question, and
   * the difference is not cosmetic. Recall is `wordFromMeaning`, so a
   * fallback of `wordFromMeaning` made the second and third sightings the
   * same kind, and in a topic where most words fall back that produced eight
   * identical questions in a row — the run this pipeline exists to prevent,
   * reintroduced by its own fallback. `meaningPick` shows the word and asks
   * what it means, needs only the distinct-meaning distractors that
   * `wordFromMeaning` already needs, and goes through `wordExercise`'s
   * guards, so the Roman-loanword and verdict-cue cases stay handled.
   */
  return wordExercise(w, pool, track, 'meet', 1);
}

// ---- lesson composition --------------------------------------------------

export function buildLessonExercises(
  lesson: Lesson,
  reviewRefs: ItemRef[] = [],
  track: LearnTrack = 'both',
  /**
   * Every letter and word id the learner has ever actually been graded on —
   * `Object.keys(srs)` from the progress store. Used only by the review
   * fallback below, to keep a topic/lesson-order guess honest against what
   * was truly shown.
   */
  known: ReadonlySet<string> = new Set()
): Exercise[] {
  const exercises: Exercise[] = [];
  // On the Roman track the learner has said they are not learning the
  // alphabet. Letter lessons are already off their path, but review can still
  // surface a letter that was practised before the switch, and a vocabulary
  // lesson would otherwise close on a spell-it-in-Nastaliq exercise.
  const teachesScript = track !== 'roman';

  if (lesson.kind === 'letters' && lesson.letterIds && teachesScript) {
    const letters = lesson.letterIds.map(getLetter).filter(Boolean) as Letter[];
    /**
     * Every letter met `SIGHTINGS_PER_LETTER` times, in rounds: round 0 shows
     * every letter once, then round 1 shows every letter again, and so on.
     *
     * The first version of this got the loop backwards — letter-outer,
     * round-inner — so it pushed all six sightings of the first letter before
     * the second letter ever appeared. The doc comment on that version said
     * "in rounds rather than one letter drilled through all its forms before
     * the next begins", which was the intent and not what the code did; review
     * generated the real output and found six `daal` in a row, then six
     * `Daal`, on every letter lesson. Round-major, as below, is what the
     * comment described.
     *
     * `turn` (which of trace/form/pick) depends on both `round` and the
     * letter's own place in the group (`idx`), not on round alone.
     *
     * Round alone was tried first and rejected: it makes every letter in a
     * round share one kind, which does read as a clean pass over the
     * alphabet — and also means every letter in that round is `letterTrace`,
     * or every one is `letterPick`, back to back, group-size (4 to 7) times
     * running. Review generated the real output and ran `check:shape`: `l-3`
     * emitted 7 consecutive `letterPick`, and every one of the 9 lessons
     * failed the run rule the same way, on the identical axis that rule
     * exists to catch — the fix for one repetition problem became the
     * shape of the next one. `idx` breaks it: turn increments by one from
     * letter to letter within a round, so two letters next to each other
     * never share a kind, and a letter's own six sightings still cycle
     * through all three kinds because the increment wraps every three
     * letters, not every three rounds.
     *
     * `position` is offset the same way — by the letter's own place in the
     * group — so two letters in the same round are not both shown at
     * "isolated" either.
     *
     * `turnOffset`/`posOffset` exist for a second thing review found: two
     * lessons built from the same letter group (`l-1` "Meet the letters" and
     * `l-1-2` "Position practice" deliberately share their six letters)
     * produced the exact same exercises in the exact same order, because the
     * sequence depended only on the letter and its position in the array,
     * never on which lesson was asking.
     *
     * Two hash-based attempts at this were tried and both reproduced a
     * version of the bug they were meant to fix. One hash for both axes
     * collided outright — `l-1` and `l-1-2` came out byte-identical (1 in 3
     * odds, and it happened). Two independent hashes fixed `position` but
     * left `turn` on its own single hash, which collided *again* on the same
     * pair: `hashSeed('l-1') % 3 === hashSeed('l-1-2') % 3`, so every `kind`
     * in the two lessons matched even though enough `position`s differed to
     * pass a per-exercise diff count — the check counted the wrong thing.
     * Hashing an id can only ever change the odds of two lessons colliding,
     * never rule it out, and it kept finding the unlucky draw.
     *
     * So this is not a hash. `siblingIndex` is which lesson, in path order,
     * this is among every lesson built from this exact sequence of letters —
     * 0 for the first, 1 for the second. Two siblings always get different
     * indices by construction, not probably different ones, so `turnOffset`
     * and `posOffset` are guaranteed to differ between any two lessons that
     * share a letter group, for as many siblings as this course ever has.
     */
    const sameLetters = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);
    const siblingIndex = ALL_LESSONS.filter(
      (l) => l.kind === 'letters' && l.letterIds && sameLetters(l.letterIds, lesson.letterIds!)
    ).findIndex((l) => l.id === lesson.id);
    const turnOffset = siblingIndex;
    const posOffset = siblingIndex * 3; // a step size coprime with POSITIONS.length (4), so it still cycles
    for (let round = 0; round < SIGHTINGS_PER_LETTER; round++) {
      letters.forEach((l, idx) => {
        exercises.push(letterExerciseAt(l, round + idx + turnOffset, round + idx + posOffset));
      });
    }
    // one word that features these letters, for context
    const contextWords = letters
      .map((l) => WORDS.find((w) => w.roman.toLowerCase().includes(l.sound[0])))
      .filter(Boolean) as Word[];
    if (contextWords[0]) exercises.push(wordExercise(contextWords[0], WORDS, track, 'meet', 0));
  }

  if (lesson.kind === 'phrases') {
    /**
     * Phrases share one icon, so a picture question is unanswerable: every
     * option would show the same speech bubble, and `distinctCue` silently
     * folds any attempt at `multipleChoice` or `listenTap` back to
     * `meaningPick` anyway (see `wordExercise`'s `pictureOptions.length <
     * DISTRACTORS` guard). That left exactly one kind reachable, so the
     * lesson was `meaningPick`, every time — 100% one kind, 6 in a row,
     * both failures `check:shape`'s run and share rules exist to catch.
     *
     * Two more kinds are genuinely available without a picture: `recall`
     * (`wordFromMeaning`, show the English, pick the phrase) always works,
     * and `produce` (`typeWord`) works for whichever phrases are both short
     * enough to type and have a real answer to type — see `producible`
     * below.
     *
     * Assignment is computed as a target up front, not decided phrase by
     * phrase as the shuffle happens to present them. A first version did the
     * latter — greedily giving each phrase whichever eligible kind had the
     * fewest so far — and it reads as though it should bound every kind near
     * a third no matter the order, but it does not: fed `[T, T, T, F, F, F]`
     * (produce-eligible phrases clustered first) at this lesson's real size
     * of 6, it lands on 1 produce / 3 recall / 2 meet, 50% on one kind. The
     * greedy choice at each phrase only ever looks at counts so far, so a
     * clustered run at the front commits ahead of what the back of the list
     * will need. Computing `produceCount` from the whole pool first and
     * splitting everything else in half removes that order dependence: for
     * any order of the same 6 phrases with 2 or more of them typeable, it
     * lands 2 produce / 2 meet / 2 recall.
     *
     * "2 or more typeable" is doing real work in that sentence, and this is
     * the part with no clean fix *at this stage*. At this lesson's size,
     * only `produceCount === 2` clears the 40% floor at all — worked out by
     * hand and confirmed by brute force: 0 produced is 3/3 on meet/recall
     * (50%), 1 produced still forces an odd 3/2 split of the other five
     * (50%), and there is no fourth kind to absorb the slack. So once six
     * phrases have been drawn with fewer than two of them typeable, no
     * *reassignment* — greedy, target-based, or otherwise — can bring the
     * lesson under the floor. Computed exactly (hypergeometric, 14 of the 28
     * phrases typeable, 6 drawn without replacement): 8.24% of draws land
     * fewer than 2 typeable. The one lesson that actually ships draws 3
     * typeable (checked directly), clearing it with room, but that is this
     * draw's luck, not a property this function guarantees for a different
     * one — and `check:shape` is the backstop that would catch an unlucky
     * one before it shipped, not this comment.
     *
     * "No clean fix" is about reassignment specifically, and it is
     * narrower than the first version of this comment claimed: the pick
     * itself, two lines up, draws uniformly from all 28 phrases with no
     * floor on how many are typeable. Biasing that draw — guarantee at
     * least `produceCount` typeable phrases, fill the rest freely — would
     * remove the residual for every future draw rather than only this one,
     * and is the cheapest of the three ways to actually close this, not a
     * fourth kind or a bigger lesson. Queued as URD-023 with that option
     * named explicitly, after review found the first version of this
     * comment had quietly narrowed to the two costlier fixes. Three kinds
     * cannot split any lesson size under 40% each regardless — guarded in
     * `P()` (units.ts) so that half of this problem cannot recur silently.
     */
    const picks = seededShuffle(PHRASE_WORDS, lesson.id).slice(0, lesson.size);
    /**
     * Typeable, and not a fill-in-the-blank template. Two phrases in the
     * corpus ("My name is ...", "I am from ...") are literally templates —
     * `isTypeable` counted the letters around the `...` and called them
     * short enough, so the first version of this could hand a learner a
     * `typeWord` prompt reading "My name is ..." with no way to answer it
     * that `matchesWord`'s exact-skeleton comparison (`lib/roman.ts`) would
     * accept: typing your own name adds letters the target doesn't have, and
     * omitting the blank is not what the English asks for either. Neither
     * failure mode existed before this change, because `phrases` could never
     * reach `produce` at all.
     */
    const producible = (w: Word) => isTypeable(w) && !w.roman.includes('...') && !w.urdu.includes('...');
    const produceEligible = picks.filter(producible);
    const produceCount = Math.min(produceEligible.length, Math.ceil(picks.length / 3));
    const produceIds = new Set(produceEligible.slice(0, produceCount).map((w) => w.id));

    let meetTurn = 0;
    picks.forEach((w) => {
      if (produceIds.has(w.id)) {
        exercises.push({ kind: 'typeWord', word: w });
        return;
      }
      // Alternates by a counter of its own, not by position in `picks` — a
      // run of consecutive produce picks (removed above) would otherwise
      // desync a plain `i % 2` from what actually still needs assigning.
      const demand = meetTurn++ % 2 === 0 ? 'meet' : 'recall';
      exercises.push(wordExercise(w, PHRASE_WORDS, track, demand, 1));
    });
  } else if (lesson.kind === 'vocab' && lesson.topic) {
    /**
     * A vocabulary lesson climbs: meet each word with a picture, come back to
     * two of them from the English side, type one from memory, build one letter
     * by letter, then close on a matching board. Every word is seen at least
     * twice, and the second sighting always asks for more than the first.
     */
    const pool = wordsByTopic(lesson.topic);
    /**
     * The lesson says which words it teaches, and this teaches those.
     *
     * It used to decide for itself: `Math.max(3, size - 4 - woven)` words taken
     * from the topic at random. That number is the reason most of the corpus was
     * unreachable — three words of the thirty two in First words — and because
     * the choice lived here rather than in the path, nothing could see which
     * words a lesson was responsible for, so nothing could notice the rest were
     * never taught anywhere.
     *
     * `wordIds` comes from `coverTopics` in units.ts, which spreads each topic
     * across enough lessons to cover it. The fallback is for the synthetic
     * practice lessons, which have no fixed slice by design: a topic drill is
     * meant to range over the whole topic.
     */
    const picks = lesson.wordIds
      ? (lesson.wordIds.map(getWord).filter(Boolean) as Word[])
      : seededShuffle(pool, lesson.id).slice(0, Math.max(3, lesson.size - 4 - Math.min(2, reviewRefs.length)));
    /**
     * Every word three times, each time asking for more.
     *
     * The lesson used to meet each word once, come back to two of them, type
     * one and build one. That is about two sightings per word averaged out, and
     * it is why a lesson was 1.3 minutes: length was coming from the number of
     * words rather than from the work done on each.
     *
     * Neither benchmark builds a session that way. Duolingo introduces a handful
     * of new words in a ten minute lesson and meets each four to six times;
     * Drops repeats a word through several different micro games inside one five
     * minute session. So the climb is now per word rather than per lesson:
     *
     *   meet     recognise it, with a picture or the word in front of you
     *   recall   retrieve it from the English alone, from four options
     *   produce  supply it yourself: type it, or build it out of letter tiles
     *
     * ## Why this is a pipeline rather than three blocks
     *
     * The first version of this emitted the three passes as three whole-lesson
     * blocks: every word met, then every word recalled, then every word
     * produced. It read well and it was measurably wrong. A recall exercise is
     * always `wordFromMeaning`, so an eleven word lesson emitted eleven
     * identical questions in a row; review found a run of fourteen, and 199 of
     * the 233 vocabulary lessons had a run of nine or more. On the Roman track
     * the produce block was worse still — `wordBuild` is script-only, so the
     * whole block collapsed to `typeWord` and 162 of 233 Roman lessons ended in
     * nine to fourteen consecutive spelling prompts.
     *
     * So the passes run staggered, in groups of `GROUP` words. In one cycle the
     * learner meets group g, recalls group g-1 and produces group g-2, taken a
     * word at a time so the kinds alternate:
     *
     *   meet g[0]  recall g-1[0]  produce g-2[0]  meet g[1]  recall g-1[1]  ...
     *
     * Two consequences, and both are the point. Consecutive exercises are never
     * the same kind, on either track. And a word's second sighting lands about
     * `3 * GROUP` exercises after its first rather than immediately after the
     * block boundary, which is what a second sighting is for — massed repetition
     * inside ten seconds is not spacing.
     *
     * The three passes share one order rather than three shuffles. Shuffling
     * each pass independently would let a word be recalled in an early cycle and
     * met in a late one, which is `check:order`'s whole complaint applied inside
     * a single lesson.
     */
    const GROUP = 2;
    const groups: Word[][] = [];
    for (let i = 0; i < picks.length; i += GROUP) groups.push(picks.slice(i, i + GROUP));

    /**
     * The third pass asks the learner to produce the word with nothing to pick
     * from, and falls back rather than skipping.
     *
     * Typing suits a short word; building from letter tiles suits one of five
     * characters or fewer and belongs only to a learner reading the script. A
     * word that is neither — a five word honorific, a long compound — gets
     * another retrieval instead. Skipping it would quietly drop that word to two
     * sightings and put the lesson back under the floor for exactly the words
     * that are hardest.
     *
     * Building comes first for a learner reading the script, and that order is
     * a finding rather than a preference. Testing `isTypeable` first looks
     * harmless and silently killed the exercise: 1,621 of the 2,281 words are
     * five Urdu characters or fewer and every one of them is also typeable, so
     * the build branch was unreachable for the entire corpus. Measured,
     * `wordBuild` went 465 to 0 and WordBuild.tsx became dead code. It matters
     * because typing accepts Roman — `roman.ts` counts kitab, kitaab and کتاب
     * alike — so building letter tiles is the only vocabulary exercise that
     * makes a script learner produce Urdu characters at all.
     *
     * A Roman learner gets `typeWord` for nearly every word here, because there
     * is no Roman equivalent of building Nastaliq out of tiles and inventing one
     * is not this change. Stated plainly rather than hidden: the two tracks
     * agree on exercise *count* and deliberately differ on the mix, and
     * `check:shape` compares the mix precisely so that difference stays a choice
     * somebody made instead of a bug nobody could see.
     */

    const passes: ((w: Word, i: number) => Exercise)[] = [
      (w, i) => wordExercise(w, pool, track, 'meet', i % 3),
      (w) => wordExercise(w, pool, track, 'recall'),
      (w, i) => produceExercise(w, pool, track, teachesScript, i),
    ];

    for (let cycle = 0; cycle < groups.length + passes.length - 1; cycle++) {
      // Which group each pass is working on this cycle. Ordered by pass, so a
      // slot emits meet, then recall, then produce.
      const active = passes
        .map((make, stage) => ({ make, g: cycle - stage }))
        .filter(({ g }) => g >= 0 && g < groups.length);
      /**
       * Flip the order of the passes on alternate cycles.
       *
       * Measured, not decorative. Without it every cycle boundary puts `produce`
       * next to `produce`, and the drain cycle at the end — where only produce
       * is still running — closed 209 of the 233 Roman lessons with three
       * `typeWord` in a row, because produce is `typeWord` for nearly every word
       * on a track that cannot build Nastaliq. Flipping takes the script track
       * to a longest run of two with no lesson above it, and the Roman track to
       * three in 59 lessons: the residual is the two word drain at the very end,
       * and `MAX_RUN` in check:shape is set to hold exactly that and no worse.
       *
       * Keying the flip off the previous cycle's last pass instead — which reads
       * more principled — measured worse on both tracks (130 Roman lessons, and
       * 4 script lessons where parity has none), so parity it is.
       */
      if (cycle % 2 === 1) active.reverse();
      const width = Math.max(...active.map(({ g }) => groups[g].length));
      for (let slot = 0; slot < width; slot++) {
        for (const { make, g } of active) {
          const w = groups[g][slot];
          if (!w) continue;
          exercises.push(make(w, g * GROUP + slot));
        }
      }
    }

    // Close with a matching board (Drops-style); its four pictures must differ.
    // Short lessons introduce fewer than four words, so the board is topped up
    // from the rest of the topic rather than dropped.
    // A board pairs a picture with a caption, so both halves have to be
    // distinguishable: two tiles sharing a picture is unanswerable, and so is
    // two sharing a caption. The caption is the *displayed* gloss rather than
    // the raw meaning, because that is what the learner reads — "yes" and "yes
    // (polite)" are two tiles, باپ and والد are one.
    const board: Word[] = [];
    const boardCues = new Set<string>();
    const boardGlosses = new Set<string>();
    for (const w of [...picks, ...seededShuffle(pool, `${lesson.id}:board`)]) {
      if (board.length === 4) break;
      if (board.some((b) => b.id === w.id)) continue;
      const cue = cueOf(w);
      const gloss = glossOf(w).toLowerCase();
      if (boardCues.has(cue) || boardGlosses.has(gloss) || VERDICT_CUES.has(cue)) continue;
      boardCues.add(cue);
      boardGlosses.add(gloss);
      board.push(w);
    }
    if (board.length === 4) exercises.push({ kind: 'matching', words: board });
  }

  if (lesson.kind === 'grammar' && lesson.conceptId) {
    const c = getGrammar(lesson.conceptId);
    if (c) {
      // Teach it once, drill it once per hand-authored drill (there is no
      // larger pool to draw more of — each is a specific fill-in-the-blank,
      // not interchangeable content — so repeating one would show the exact
      // same question twice), then reinforce with the sentences already
      // tagged to this concept, in the same meet-recall-produce climb
      // `sentences` uses. Was: teach + drills(1-3) + 2 static sentences,
      // 2-6 exercises, 0.3-0.9 min — a concept had as many exercises as it
      // happened to have drills, not a designed sitting length.
      exercises.push({ kind: 'grammarTeach', concept: c });
      for (const d of c.drills) {
        const ex = grammarDrillExercise(c, d, track);
        if (ex) exercises.push(ex);
      }
      const related = readableSentences(
        SENTENCES.filter((x) => x.concept === c.id),
        lesson.id
      );
      const picks = seededShuffle(related, lesson.id).slice(0, GRAMMAR_SENTENCE_TARGET);
      // Below GRAMMAR_SENTENCE_TARGET *readable* sentences, the climb below
      // is still correct — `.slice` just returns what there is — but the
      // lesson comes up short of the 3-8 minute band. Three concepts land
      // there: g-pronouns and g-ability have only 5 tagged sentences each,
      // all 5 readable. g-plurals has 4 tagged but only 3 readable at its
      // lesson position — `readableSentences` above drops one for using a
      // word ("میز") not yet taught there — so "tagged" and "usable" are not
      // the same count and neither should be read off the other. Documented
      // rather than solved by repeating one of the too-few sentences a 4th
      // time, which would show the identical question twice in one sitting.
      // See URD-029, which also tracks whether g-plurals' gap is cheaper to
      // fix by repositioning or re-tagging than by treating it as pure
      // content scarcity.
      //
      // Distractors are drawn from every sentence at this concept's level,
      // not just the handful picked for this lesson — the same reason
      // `sentences` gives `wordExercise` the whole level's pool rather than
      // just its own picks: a small `picks` (as few as 4 for the thinnest
      // concepts) is not enough source material for four distinct options.
      const reinforcePool = SENTENCE_WORDS.filter((w) => w.level === c.level);
      for (let round = 0; round < 3; round++) {
        picks.forEach((sen, idx) => {
          const turn = (round + idx) % 3;
          const w = SENTENCE_WORDS.find((x) => x.id === sen.id);
          if (!w) return;
          if (turn === 2) {
            const ex = sentenceExercise(sen, track);
            if (ex) exercises.push(ex);
          } else {
            const ex = wordExercise(w, reinforcePool, track, turn === 0 ? 'meet' : 'recall', 1);
            exercises.push(ex);
          }
        });
      }
    }
  }

  if (lesson.kind === 'sentences') {
    const pool = lesson.level ? SENTENCES.filter((x) => x.level === lesson.level) : SENTENCES;
    const picks = seededShuffle(readableSentences(pool.length ? pool : SENTENCES, lesson.id), lesson.id).slice(
      0,
      lesson.size
    );
    /**
     * Every sentence met three times — recognise its meaning, retrieve it
     * from the meaning, then build it from tiles — the same meet-recall-
     * produce climb `vocab` uses, and for the same reason `sentenceBuild`
     * alone was: one exercise per sentence at the default size of 5 is 0.8
     * minutes, an interruption rather than a sitting.
     *
     * `sentenceExercise` (the `produce` sighting) was the *only* kind a
     * sentence could ever appear in, so simply asking for more sentences
     * could not fix the length without also fixing the shape: past six
     * exercises, a lesson built entirely from it is 100% one kind, exactly
     * what `check:shape`'s share rule exists to catch — the same trap
     * letters and phrases were both in before their own fixes. `meaningPick`
     * (show the sentence, ask its meaning) and `wordFromMeaning` (show the
     * meaning, ask for the sentence) are the two more kinds available
     * without new UI, the same move `PHRASE_WORDS` made for phrases: reshape
     * the content as a `Word` and let it flow through the exercises that
     * already exist for one.
     *
     * Round-major, offset by the sentence's own position — the same
     * structure letters landed on after shipping the wrong one first:
     * locking the kind to the round alone put every sentence in a round
     * through the identical kind, back to back, sentences-per-lesson times
     * running. `turn = (round + idx) % 3` instead means every sentence still
     * visits all three kinds across its three sightings (adding 0, 1, 2 to a
     * fixed `idx` mod 3 is a permutation of the three), it just starts at a
     * different one, so two CONSECUTIVE sentences within one round never
     * share a kind.
     *
     * That guarantee stops at the round boundary, on purpose rather than by
     * oversight: the last sentence of one round and the first of the next
     * can land on the same turn (measured: `idx` 7 of an 8-sentence lesson
     * closes round 0 on `recall`, and `idx` 0 opens round 1 on `recall`
     * too), so the real worst case is two in a row, not zero. Left as is —
     * two is under check:shape's MAX_RUN of 3 with room, and the fix for it
     * (offsetting the round itself, the same lesson-to-lesson trick used for
     * letters) buys uniformity the check does not ask for at the cost of
     * complexity that would need its own re-verification.
     */
    const sentencePool = SENTENCE_WORDS.filter((w) => !lesson.level || w.level === lesson.level);
    for (let round = 0; round < 3; round++) {
      picks.forEach((sen, idx) => {
        const turn = (round + idx) % 3;
        const w = SENTENCE_WORDS.find((x) => x.id === sen.id);
        if (!w) return;
        if (turn === 2) {
          const ex = sentenceExercise(sen, track);
          if (ex) exercises.push(ex);
        } else {
          const ex = wordExercise(w, sentencePool, track, turn === 0 ? 'meet' : 'recall', 1);
          exercises.push(ex);
        }
      });
    }
  }

  if (lesson.kind === 'dialogue') {
    const d = lesson.dialogueId ? getDialogue(lesson.dialogueId) : undefined;
    const chosen = d ?? seededShuffle(DIALOGUES, lesson.id)[0];
    if (chosen) exercises.push({ kind: 'dialogue', dialogue: chosen });
  }

  if (lesson.kind === 'reading') {
    const p = lesson.passageId ? getPassage(lesson.passageId) : undefined;
    const chosen = p ?? seededShuffle(PASSAGES, lesson.id)[0];
    if (chosen) exercises.push({ kind: 'reading', passage: chosen });
  }

  if (lesson.kind === 'review') {
    /**
     * Due first, then topped up to the lesson's size.
     *
     * It used to be one or the other: the due queue if there was one, the
     * taught-so-far pool if there was not. So a learner with a single item due
     * opened their unit review and got a one question lesson — the branch read
     * as "prefer real data", and what it actually did was let a short queue
     * truncate a sitting to nothing. `rev-first-faces` measured at 1 exercise
     * with a real queue against 9 with an empty one, which is backwards: the
     * learner with fewer items due needs *more* topping up, not less.
     *
     * Due items keep their place at the front, because they are the ones the
     * scheduler says are slipping. The top up is deduped against them so a word
     * that is both due and in the taught pool is not asked twice.
     *
     * `due` is filtered to refs that will actually render before it is capped
     * to size, and that filter is what the first version of this got wrong.
     * `srs` is global, not per track, so a real due queue can contain a letter
     * while the learner is on the Roman track, or an id a content rename has
     * left behind — both render nothing. Capping first and filtering after, as
     * the first version did, let those slots go to waste: a due queue of five
     * letters on the Roman track rendered 17 exercises against a floor of 22,
     * the exact truncation this comment says the top-up exists to prevent, just
     * reintroduced for the one queue shape nothing had checked. Filtering
     * before the cap means every slot in `refs` is a slot that renders, so the
     * lesson always reaches `lesson.size` when the combined pool can supply it.
     */
    const resolvable = (ref: ItemRef) =>
      ref.type === 'letter' ? teachesScript && !!getLetter(ref.id) : !!getAnyWord(ref.id);
    // Keyed on type and id together, not id alone. Letter ids and word ids do
    // not collide anywhere in the current data, but nothing enforces that they
    // never will, and an id-only key would silently drop a word the moment one
    // did — a due letter and an unrelated due word for the same string looking
    // like a duplicate of each other.
    const key = (r: ItemRef) => `${r.type}:${r.id}`;
    const due = reviewRefs.filter(resolvable);
    const seenIds = new Set(due.map(key));
    const filler = fallbackReviewRefs(lesson.size, teachesScript, lesson.id, known)
      .filter((r) => !seenIds.has(key(r)))
      .filter(resolvable);
    const refs = [...due, ...filler];

    /**
     * Letters can run out where words never do.
     *
     * `fallbackReviewRefs` always asks for half letters, half words, and early
     * in the course that half can be thinner than it looks: `l-1-2`
     * ("Position practice") deliberately re-teaches `l-1`'s six letters in
     * their joining forms rather than introducing new ones, so the earliest
     * review's entire letter pool really is those same six. A due queue that
     * already contains most of them leaves almost nothing left to draw for the
     * fallback split, and unlike a letter, a word is never in short supply — the
     * course has taught 54 of them by the same point. Measured directly: five
     * real due letters at this position produced 18 of 22 exercises even after
     * the filter-before-cap fix above, because the shortfall was never in what
     * got capped, it was in what existed to fill the gap.
     *
     * So the remainder is topped up from words alone, which is always possible
     * this early and is the same "more topping up, not less" principle the due
     * queue itself is built on.
     */
    if (refs.length < lesson.size) {
      const have = new Set(refs.map(key));
      const more = fallbackReviewRefs(lesson.size * 2, false, lesson.id, known)
        .filter((r) => !have.has(key(r)))
        .filter(resolvable);
      refs.push(...more.slice(0, lesson.size - refs.length));
    }
    refs.length = Math.min(refs.length, lesson.size);

    refs.forEach((ref, i) => {
      if (ref.type === 'letter') {
        const l = teachesScript ? getLetter(ref.id) : undefined;
        if (l) exercises.push(letterExerciseAt(l, i, i));
      } else {
        const w = getAnyWord(ref.id);
        // Review is where the harder demands belong: a word is only here
        // because it was met before, so asking to recognise it again teaches
        // little. Most reviews retrieve; every third one asks for it typed.
        //
        // Every third by position, not by a coin flip. `Math.random() < 0.35`
        // said the same thing in the comment and did something else: it made a
        // review lesson a different lesson each time it was opened, and made
        // every measurement over review lessons differ run to run.
        //
        // Three demands on rotation rather than two. Recall alone is
        // `wordFromMeaning` every time, and with letters off the Roman track a
        // review came out 73% one question — a screen of identical prompts
        // scrolling past. The middle turn hears the word instead, which is the
        // one modality a review of things you have already read does not
        // otherwise use.
        const turn = i % 3;
        if (w && turn === 2) exercises.push(produceExercise(w, poolFor(w), track, teachesScript, i));
        else if (w && turn === 1) exercises.push(wordExercise(w, poolFor(w), track, 'meet', 2));
        else if (w) exercises.push(wordExercise(w, poolFor(w), track, 'recall'));
      }
    });
  }

  // Weave up to two due review items in near the front of a normal lesson.
  //
  // Filtered to refs that will actually render before the `.slice(0, 2)`, the
  // same fix as the review branch above and for the same reason: an unfiltered
  // `.slice(0, 2)` can spend both slots on a due letter the Roman track cannot
  // show, weaving in nothing while the two real due items behind it are never
  // reached. Less severe here than in a review lesson — an ordinary lesson has
  // no floor keyed to this count — but it is the same unguarded assumption and
  // is fixed with it rather than left for whoever notices next.
  if (lesson.kind !== 'review' && reviewRefs.length) {
    const woven: Exercise[] = [];
    const weavable = (ref: ItemRef) =>
      ref.type === 'letter' ? teachesScript && !!getLetter(ref.id) : !!getAnyWord(ref.id);
    for (const ref of reviewRefs.filter(weavable).slice(0, 2)) {
      if (ref.type === 'letter') {
        const l = getLetter(ref.id) as Letter;
        woven.push(letterExercise(l));
      } else {
        const w = getAnyWord(ref.id) as Word;
        woven.push(wordExercise(w, poolFor(w), track, 'recall'));
      }
    }
    exercises.splice(1, 0, ...woven);
  }

  // A vocabulary lesson is composed to an exact shape — meet, recall, type,
  // build, match — so trimming it to `size` would cut the closing run, which is
  // the hardest and most valuable part. Every other kind is a flat list where
  // trimming is the right way to hit the intended length.
  //
  // Sentences joins vocab in the exemption for a different reason: `size`
  // means *sentences*, not exercises, since the meet-recall-produce climb
  // below meets each one three times. Trimming to `lesson.size` here cut a
  // 24-exercise lesson back down to the 8 that used to be the whole thing —
  // measured as the first version of this shipped: `size` was raised to
  // widen the lesson, and this line quietly put it back.
  //
  // Grammar joins for the same reason sentences did: `size` was never
  // wired to anything for a grammar lesson (every `G()` call site uses the
  // default, unmodified), and now it isn't wired to the emitted count
  // either — a concept's teach-plus-drills is fixed by its data, and the
  // sentence-reinforcement climb below is sized by `GRAMMAR_SENTENCE_TARGET`,
  // not `lesson.size`. Leaving grammar out of this exemption would silently
  // cut every concept's new climb back down to 6, the same bug caught here
  // twice already.
  const composed = lesson.kind === 'vocab' || lesson.kind === 'sentences' || lesson.kind === 'grammar';
  return composed ? exercises : exercises.slice(0, lesson.size);
}

/**
 * What the path has actually taught by the time a given lesson is reached.
 *
 * Walks the real lesson order and collects the letters and topics introduced
 * strictly before this lesson, plus this lesson's own unit-mates, so a review
 * draws only from units the learner has reached.
 *
 * This used to be an *upper bound* rather than a record, and said so: a vocab
 * lesson showed a random handful of its topic while this counted the whole
 * topic taught the moment any lesson touched it. Nineteen words claimed for a
 * lesson that had shown three.
 *
 * That is no longer a gap, because the gap it was describing is gone. A
 * vocabulary lesson now carries `wordIds` — exactly the words it introduces —
 * and the topics are spread across enough lessons to cover them, so this walks
 * the same list the learner actually saw. It is now what its name says.
 *
 * The fallback matters for the same reason it always did: a lesson without
 * `wordIds` is a synthetic practice drill, which ranges over a whole topic by
 * design, so for those the topic really is the honest answer.
 */
function taughtUpTo(lessonId: string): { letters: string[]; words: string[] } {
  const letters: string[] = [];
  const words: string[] = [];
  for (const l of ALL_LESSONS) {
    if (l.kind === 'letters' && l.letterIds) letters.push(...l.letterIds);
    if (l.kind === 'vocab' && l.topic) {
      words.push(...(l.wordIds ?? wordsByTopic(l.topic).map((w) => w.id)));
    }
    if (l.id === lessonId) break;
  }
  return { letters, words };
}

/**
 * When nothing is due yet, review still needs something to ask about.
 *
 * This used to take `WORDS.slice(0, 120)` and `LETTERS.slice(0, 20)` — the
 * first entries in *corpus* order, which has nothing to do with the order the
 * course teaches them. So a Unit 2 review happily asked about words from Unit
 * 3 and letters not yet introduced: material the learner had never seen, in a
 * lesson whose whole job is to bring back what they had.
 *
 * It was then drawn from `taughtUpTo`, which fixed the *unit* being wrong but
 * not the *word*: a vocab lesson only ever shows a handful of its topic's
 * words, while `taughtUpTo` counts the whole topic as taught the moment any
 * lesson touches it. A review reached before spaced repetition has scheduled
 * anything — which in practice means most early reviews, since a freshly
 * graded word is not due again for at least a day — fell all the way through
 * to this fallback and could pull any of a topic's words, including ones this
 * specific lesson never happened to pick.
 *
 * `known` closes that gap: it is `Object.keys(srs)` from the progress store,
 * so it is not a guess about the order content was authored in, it is every
 * id the learner has actually been graded on, in any lesson, in any order —
 * true regardless of whether they took the path in sequence or jumped ahead.
 * Intersecting the two keeps the unit-level guardrail from `taughtUpTo` and
 * replaces its topic-wide guess with the one thing that is not a guess.
 */
function fallbackReviewRefs(
  n: number,
  withLetters = true,
  lessonId?: string,
  known: ReadonlySet<string> = new Set()
): ItemRef[] {
  const taught = lessonId ? taughtUpTo(lessonId) : null;
  const seen = (ids: string[]) => ids.filter((id) => known.has(id));
  // No lesson context (practice review, say) falls back to the foundational
  // material, which is the old behaviour and correct there — practice review is
  // not positioned anywhere on the path. Within a real lesson, prefer words
  // actually known; only widen to the whole topic if the learner has somehow
  // graded none of it yet (e.g. the very first review reachable from a unit).
  const taughtWords = taught?.words ?? [];
  const knownWords = seen(taughtWords);
  const wordPool = knownWords.length
    ? knownWords
    : taughtWords.length
      ? taughtWords
      : WORDS.slice(0, 120).map((w) => w.id);
  const taughtLetters = taught?.letters ?? [];
  const knownLetters = seen(taughtLetters);
  const letterPool = knownLetters.length
    ? knownLetters
    : taughtLetters.length
      ? taughtLetters
      : LETTERS.slice(0, 20).map((l) => l.id);

  if (!withLetters) {
    return seededShuffle(wordPool, `${lessonId ?? 'review'}:words`)
      .slice(0, n)
      .map((id) => ({ id, type: 'word' as const }));
  }
  const letters: ItemRef[] = seededShuffle(letterPool, `${lessonId ?? 'review'}:letters`)
    .slice(0, Math.ceil(n / 2))
    .map((id) => ({ id, type: 'letter' as const }));
  const words: ItemRef[] = seededShuffle(wordPool, `${lessonId ?? 'review'}:words`)
    .slice(0, Math.floor(n / 2))
    .map((id) => ({ id, type: 'word' as const }));
  // Interleaved rather than shuffled together. Shuffling clustered them — four
  // consecutive letter exercises inside a mixed review — and did it differently
  // on every generation, so the review a learner reopened was a different
  // lesson and no measurement over review lessons held still.
  const mixed: ItemRef[] = [];
  for (let i = 0; i < Math.max(letters.length, words.length); i++) {
    if (letters[i]) mixed.push(letters[i]);
    if (words[i]) mixed.push(words[i]);
  }
  return mixed;
}

/** Map an exercise to the item(s) it exercises, for SRS grading. */
export function itemsOf(ex: Exercise): ItemRef[] {
  switch (ex.kind) {
    case 'letterForm':
    case 'letterPick':
    case 'letterTrace':
      return [{ id: ex.letter.id, type: 'letter' }];
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
      return [{ id: ex.word.id, type: 'word' }];
    case 'matching':
      return ex.words.map((w) => ({ id: w.id, type: 'word' as const }));
    default:
      // grammar, sentence-building and reading aren't tied to a single
      // vocabulary item, so they don't feed the spaced-repetition queue.
      return [];
  }
}
