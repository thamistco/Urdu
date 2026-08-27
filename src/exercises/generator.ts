import { LETTERS, getLetter, Letter, PositionKey, POSITIONS } from '../data/letters';
import { WORDS, getWord, wordsByTopic, glossOf, levelOfWord, Word, PHRASES } from '../data/words';
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
import {
  reviewWordPool,
  reviewLetterPool,
  taughtUpTo,
  taughtInUnit,
  taughtConceptsUpTo,
  conceptsInUnit,
  reviewLetterShare,
} from '../lib/review';
import { Exercise, ItemRef } from './types';

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

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
  concept: s.concept, // URD-030: lets distractorsFor bias toward same-concept sentences
}));

const getAnyWord = (id: string): Word | undefined =>
  getWord(id) ?? PHRASE_WORDS.find((w) => w.id === id) ?? SENTENCE_WORDS.find((w) => w.id === id);

/** Distractors for a review item. Phrases and sentences are not in WORDS, so
 *  `wordsByTopic` returns nothing for them and they would be offered against
 *  random nouns. */
const poolFor = (w: Word): Word[] =>
  w.topic === 'phrases' ? PHRASE_WORDS : w.topic === 'sentences' ? SENTENCE_WORDS : wordsByTopic(w.topic);

const LEVEL_RANK: Record<string, number> = { beginner: 0, elementary: 1, intermediate: 2, advanced: 3 };

/**
 * A real vocabulary word containing this letter's own glyph, for the
 * letters lesson's context sighting (URD-020).
 *
 * Real, not synthetic — a first draft of this invented a new 40-word corpus
 * from `LETTERS[i].word` (each letter's own curated example, e.g. الف →
 * انار "pomegranate", already shown on `LetterLabScreen` but never before
 * used by a teaching lesson). THE CRITIC found that BLOCKING: those ids
 * existed nowhere in `voiceManifest.ts`, so a `listenTap` review question
 * built from one — reachable in real play, once such a word is SRS-graded
 * and comes due — asked the learner to identify a word from audio that does
 * not exist, unanswerable except by guessing. Every entry in `WORDS`
 * already has a real clip (`check:voice` already requires it), so drawing
 * from there instead needs nothing new recorded.
 *
 * Matched against the word's actual Urdu text, not its roman transliteration
 * — the old design's bug (URD-021): `letters.ts` stores every letter as one
 * base codepoint, reshaped only by the script engine for position, so a
 * plain substring check against `forms.isolated` finds the letter
 * regardless of where in the word it sits, unlike the old `WORDS.find(w =>
 * w.roman.toLowerCase().includes(l.sound[0]))`, which matched a
 * transliteration substring that had nothing to do with whether the word
 * actually contained the letter. Measured directly: every one of the 40
 * letters has at least one real match (two are thin — `zhe` has exactly
 * one, `hamza` three — but none has zero).
 *
 * Among the matches, the lowest CEFR level wins: a beginner meeting their
 * first letters should read the simplest word available that shows one,
 * not whichever happens to sit first in corpus order.
 *
 * Distinct within a teaching group (`Letter.group`, one group per lesson)
 * wherever a distinct match exists: a word like پانی contains both alif and
 * pe, and picking each letter's match independently, blind to what the
 * others in its own lesson already picked, can hand two different letters
 * in the same sitting the identical word — one fewer piece of real
 * vocabulary shown, for no benefit. Groups are walked in `LETTERS`' own
 * order and each letter takes the best match not already claimed by an
 * earlier letter in the same group, falling back to a repeat only when a
 * letter has no other match at all (rare — `zhe` has exactly one candidate
 * in the whole corpus).
 *
 * A match immediately followed by `do-chashmi-he` (ھ) is avoided wherever a
 * clean one exists: CURRICULUM CRITIC found `gaaf`'s best-by-level match,
 * گھر ("ghar", house), puts گ directly before ھ — the aspirated "gh"
 * digraph `do-chashmi-he`'s own note already names as a distinct sound,
 * the same b→bh/k→kh pattern applying to g→gh here — so the word
 * demonstrates a different sound than the letter being taught. This
 * reproduces for any letter whose most common word happens to precede an
 * aspirating combination, not just gaaf, so the guard is general rather
 * than a one-letter special case.
 */
export const LETTER_CONTEXT_WORD: Map<string, Word> = (() => {
  const map = new Map<string, Word>();
  const usedByGroup = new Map<number, Set<string>>();
  const ASPIRATE = 'ھ';
  for (const l of LETTERS) {
    const isDigraph = (w: Word) => l.id !== 'do-chashmi-he' && w.urdu.includes(l.forms.isolated + ASPIRATE);
    const matches = WORDS.filter((w) => w.urdu.includes(l.forms.isolated)).sort((a, b) => {
      const digraphDiff = Number(isDigraph(a)) - Number(isDigraph(b));
      if (digraphDiff !== 0) return digraphDiff;
      return LEVEL_RANK[levelOfWord(a)] - LEVEL_RANK[levelOfWord(b)];
    });
    if (!matches.length) continue;
    const used = usedByGroup.get(l.group) ?? new Set<string>();
    usedByGroup.set(l.group, used);
    const best = matches.find((w) => !used.has(w.id)) ?? matches[0];
    map.set(l.id, best);
    used.add(best.id);
  }
  return map;
})();

/**
 * URD-045: `LETTER_CONTEXT_WORD`'s sighting used to go through `wordExercise`
 * like any ordinary vocabulary word — `multipleChoice`/`meaningPick`/
 * `listenTap`, picture or meaning matching — which a learner answers without
 * ever looking at the word's script closely enough to find the letter inside
 * it. This asks directly: tap which tile of the word is the letter just
 * taught.
 *
 * CURRICULUM CRITIC, first draft: tiles rendered each character in its bare
 * `forms.isolated` glyph, the exact same shape `letterForm`/`letterPick`
 * already drill in isolation — `connector`/`nonConnector` (`data/letters.ts`)
 * show *why* that's wrong: a base codepoint with no neighbouring character
 * renders isolated by construction, so a row of lone codepoints could never
 * show the letter's true joined shape, and a learner could solve the
 * question by isolated-glyph matching alone, never reading the word above
 * it at all — reopening, in a new shape, the exact hole URD-045 was filed to
 * close.
 *
 * Fixed by giving every real tile its true neighbouring character(s), taken
 * directly from the word's own text (`raw`, `positions` below) rather than
 * synthesized: two real, adjacent codepoints rendered as one uninterrupted
 * text run get shaped by the OS's own Arabic/Nastaliq engine exactly as they
 * shape in the word itself — the same reason `WordBuild.tsx`'s own assembled
 * row reads the placed tiles as one run instead of isolated glyphs. This
 * needs no shaping logic of its own: it is the same real substring of the
 * same real word, so it renders identically to how that letter actually
 * looks there. A letter at the edge of its own word (or, for the two
 * multi-word entries in `LETTER_CONTEXT_WORD`, at the edge of its own word
 * *within* the phrase, on the far side of a space) correctly gets no
 * synthetic neighbour and renders in its true edge shape instead.
 *
 * CURRICULUM CRITIC, second finding: three of `LETTER_CONTEXT_WORD`'s
 * shortest assignments (`khe`/`daal`/`toe`/`laam`, all 2-tile words) gave a
 * 50% guess floor — worse than every other recognise-tier letter exercise,
 * which fixes `OPTIONS_PER_QUESTION` (4) options regardless of content.
 * Fixed by padding any word shorter than that floor with decoy tiles drawn
 * from the 40 taught letters' own isolated glyphs (see the floor-padding
 * code below for why not `ALPHABET`, `buildTilesFor`'s own decoy pool) and
 * excluded from the word's own characters, so a decoy can never
 * accidentally look like a second right answer. Decoys are spliced into
 * random gaps rather than replacing anything, so they never disturb the
 * real tiles' own relative reading order — `fromWord` marks which tiles are
 * real, `correct` marks which are the right answer, both decided here
 * rather than left for the component to re-derive from the (now possibly
 * multi-character) display strings.
 */
export function letterSpotTiles(
  letter: Letter,
  word: Word
): { tiles: string[]; fromWord: boolean[]; correct: boolean[]; wordBreakAfter: boolean[] } {
  const raw = Array.from(word.urdu);
  const isReal = (i: number) => i >= 0 && i < raw.length && raw[i].trim().length > 0;

  const tiles: string[] = [];
  const fromWord: boolean[] = [];
  const correct: boolean[] = [];
  const wordBreakAfter: boolean[] = [];
  const realChars = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    if (!isReal(i)) continue;
    const left = isReal(i - 1) ? raw[i - 1] : '';
    const right = isReal(i + 1) ? raw[i + 1] : '';
    const cluster = left + raw[i] + right;
    const isCorrect = raw[i] === letter.forms.isolated;
    // DESIGN CRITIC: `LETTER_CONTEXT_WORD` includes two genuine multi-word
    // phrases (`baRi-he`'s خدا حافظ, `hamza`'s ان شاء اللہ) — the prompt
    // above shows their real spaces, but the old tile row silently dropped
    // them, flattening two or three words into one undifferentiated run of
    // tiles with no seam where the prompt plainly has one. Recorded here
    // per real tile (not per decoy — decoys never represent a position in
    // the word at all) and rendered as a wider gap in `LetterSpot.tsx`, so
    // the tile row's grouping matches what the prompt actually reads.
    const breaksAfter = i + 1 < raw.length && raw[i + 1].trim().length === 0;
    realChars.add(raw[i]);
    /**
     * DESIGN CRITIC (lead's own pass, screenshotting the real component):
     * exactly two real characters — the whole real reason `khe`/`daal`/
     * `toe`/`laam` need decoy padding at all — means both positions' full
     * left+own+right context IS the whole word, so both clusters render as
     * the identical string ("دل" for both `daal` and `laam`), leaving two
     * tiles a learner cannot visually tell apart, only one of which grades
     * correct. A longer real word never collides this way (each position's
     * cluster differs from its neighbours' as soon as a third character
     * exists to break the symmetry), so this only ever fires for that one
     * two-letter shape. Merging them into a single tile — correct if either
     * position was — keeps every character's true joined shape on screen
     * (nothing here is isolated) while removing the ambiguous duplicate
     * rather than resolving it by guesswork.
     */
    if (tiles.length > 0 && tiles[tiles.length - 1] === cluster) {
      correct[correct.length - 1] = correct[correct.length - 1] || isCorrect;
      wordBreakAfter[wordBreakAfter.length - 1] = wordBreakAfter[wordBreakAfter.length - 1] || breaksAfter;
      continue;
    }
    tiles.push(cluster);
    fromWord.push(true);
    correct.push(isCorrect);
    wordBreakAfter.push(breaksAfter);
  }

  // A minimum multiple-choice floor, matching every other recognise-tier
  // letter exercise's fixed option count (`OPTIONS_PER_QUESTION`) rather
  // than inheriting whatever length the assigned vocabulary word happens
  // to have. Decoys are drawn from the 40 taught letters' own isolated
  // glyphs, not `ALPHABET` (every character appearing anywhere in the
  // vocabulary corpus, `buildTilesFor`'s own pool) — checked directly with
  // a real screenshot: `ALPHABET` includes bare combining marks (kasra,
  // damma) and hamza-carrier variants that exist in real words but were
  // never any letter's own taught glyph, and one landed as a decoy tile
  // rendering as a barely-visible floating mark next to full letter-sized
  // tiles either side of it — plausible enough as vocabulary-corpus noise
  // for `wordBuild`'s tray (already-placed tiles, never themselves tap
  // targets standing in for "a letter"), wrong for a tile whose entire job
  // is to look like a real letter this task is about spotting.
  const LETTER_GLYPHS: string[] = LETTERS.map((l) => l.forms.isolated);
  const floor = OPTIONS_PER_QUESTION;
  const shortfall = Math.max(0, floor - tiles.length);
  if (shortfall > 0) {
    const decoyPool = shuffle(LETTER_GLYPHS.filter((c) => !realChars.has(c)));
    for (const decoy of decoyPool.slice(0, shortfall)) {
      const at = Math.floor(Math.random() * (tiles.length + 1));
      tiles.splice(at, 0, decoy);
      fromWord.splice(at, 0, false);
      correct.splice(at, 0, false);
      wordBreakAfter.splice(at, 0, false);
    }
  }
  return { tiles, fromWord, correct, wordBreakAfter };
}

/**
 * Every letter that shares a `confusableWith` bucket with this one, drawn
 * only from the letters a given lesson actually teaches.
 *
 * Measured across the real corpus: 29 of 40 letters have at least one bucket
 * partner, and every one of those partners is taught in the *same* lesson as
 * the letter itself — zero exceptions across all 9 real letter lessons. So a
 * contrast question never has to show a letter the learner has not met, and
 * this returns empty rather than reaching outside the lesson when it somehow
 * would (a singleton bucket, or a group that ever stops co-teaching a pair).
 */
function confusableMatesIn(letter: Letter, lessonLetters: Letter[]): Letter[] {
  const key = letter.confusableWith ?? letter.id;
  return lessonLetters.filter((l) => l.id !== letter.id && (l.confusableWith ?? l.id) === key);
}

/**
 * URD-047: URD-022 spreads a lesson's visually confusable letters apart in
 * time so they are rarely drilled back to back, and URD-046 varies which pair
 * collides when one adjacency is mathematically forced. Both reduce
 * interference in the moment; neither ever asks the learner to tell the two
 * apart, which is the skill URD-022's own definition of done named ("risks
 * teaching the confusion rather than resolving it") and did not deliver. This
 * confronts the pair directly, once per letter that has a partner.
 *
 * Prompted by NAME, not by sound. Sound is shown as a secondary line but
 * cannot carry the question: measured across all 13 real multi-member
 * buckets, exactly one pair collides on sound — `alif` ("a / aa") and
 * `alif-madda` ("aa") share the token `aa` — so a sound-prompted contrast
 * would be a question with two right answers for that one bucket, the exact
 * defect `check:answerable`'s own `soundsOverlap` rule exists to catch in
 * `letterPick` (URD-007). Names never collide, so the name leads.
 *
 * `options` is the bucket and nothing else — 2, 3, or 4 letters — and is
 * deliberately NOT padded up to `OPTIONS_PER_QUESTION`. That floor exists
 * (see its own doc comment, and `check:answerable`'s `OPTION_FLOOR`) because
 * a two-option question is a coin flip a learner can be promoted by guessing
 * through, and it is right for every question that draws its distractors from
 * the whole vocabulary. It is wrong here, and adopting it anyway would make
 * this question measure stricter while testing less: a learner who cannot
 * tell ز from ذ but can rule out ب and ک still faces the identical 50/50 on
 * the only distinction being asked about. Padding would move the *reported*
 * guess rate from 50% to 25% without moving the real one at all — a check
 * that looks more rigorous and sees less, which is the shape of thing this
 * project's own history says to distrust. The genuine guess risk is instead
 * carried where the codebase already carries it: this is one sighting of six,
 * and URD-019's last-two-sightings-must-agree rule (`sessionGrading.ts`)
 * means a single lucky guess here does not by itself move the schedule.
 */
function letterContrastExercise(letter: Letter, mates: Letter[]): Exercise {
  return { kind: 'letterContrast', letter, options: shuffle([letter, ...mates]) };
}

function letterSpotExercise(letter: Letter, word: Word): Exercise {
  const { tiles, fromWord, correct, wordBreakAfter } = letterSpotTiles(letter, word);
  return { kind: 'letterSpot', letter, word, tiles, fromWord, correct, wordBreakAfter };
}

// ---- per-item exercise builders -----------------------------------------

/**
 * Every distinct reading `letter.sound` claims, lowercased and stripped of
 * parenthetical asides — most letters have one ("z"), some have several
 * ("a / aa" for alif, one short and one long).
 *
 * A first version of this returned the whole normalized string as one
 * token, so it matched "z" against "z" but missed that "a / aa" (alif) and
 * "aa" (alif-madda) are different *strings* that share a *reading* — the
 * CURRICULUM CRITIC found alif and alif-madda co-occurring in 2,902 of
 * 3,000 sampled `letterPick` generations despite that version's own claim
 * to be generic. Splitting on "/" and comparing token sets (below) catches
 * that, and also correctly leaves alif-madda ("aa" only) free to appear
 * alongside ain ("a / ‘ (silent)"): they share no token, because nothing
 * about ain sounds like alif-madda's long aa specifically.
 *
 * Exported so `check-answerable.js` can import this exact function (it loads
 * this module the same way it already loads `buildLessonExercises`) rather
 * than keeping its own copy — a second, hand-synced definition of "sounds
 * the same" is exactly the kind of drift this item exists to prevent, one
 * file up.
 */
export const soundTokens = (l: Letter): string[] =>
  l.sound
    .replace(/\s*\(.*?\)/g, '')
    .toLowerCase()
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);

/** Do these two letters share even one reading? */
export const soundsOverlap = (a: Letter, b: Letter): boolean => {
  const bTokens = soundTokens(b);
  return soundTokens(a).some((t) => bTokens.includes(t));
};

/**
 * URD-007: ذ ز ض ظ are four different letters for one sound — Urdu speakers
 * hear no difference between zaal, ze, zwaad and zoe, so `letterPick`
 * ("which letter makes this sound?") offering two of them has two right
 * answers, answerable only by luck. The same is true, less famously, of
 * te/toe ("t"), se/seen/swaad ("s"), the three ه letters
 * (baRi-he/choti-he/do-chashmi-he, all "h"), and alif/alif-madda/ain's
 * overlapping "a"/"aa" readings — computed from `sound` rather than a
 * hand-picked list so a new homophone letter can't slip back through
 * unnoticed the way this one did (see `soundTokens`'s own history for a
 * homophone group this file's first attempt still missed). These letters
 * are still taught and still drilled — `letterForm` and `letterTrace` test
 * the glyph itself, which does distinguish them, and their word-context
 * card shows the spelling. Only the audio-only "which letter?" question is
 * exempted from offering a same-sound rival, per this item's own choice of
 * "not generated" over "tested by spelling context" — these letters don't
 * share enough of a lesson position to build a spelling-context question
 * around without a content change well past this item's scope.
 *
 * Picks distractors one at a time rather than filtering `LETTERS` once and
 * slicing, because the collision is not only ever with the target: two
 * *distractors* that are strangers to the target but homophones of each
 * other (e.g. choti-he and do-chashmi-he both drawn against a target with
 * neither's sound) are exactly as unanswerable, and a single-pass filter
 * keyed only on the target misses that. Tracking every reading already
 * claimed — by the target, or by a distractor already chosen — as each new
 * distractor is picked rules out both cases, and (unlike a global
 * equivalence-class grouping would) still correctly allows two letters that
 * merely share a *third* letter's reading, not each other's, to co-occur:
 * alif overlaps both alif-madda ("aa") and ain ("a"), but alif-madda and
 * ain do not overlap each other, and can still appear together.
 */
export function distractLetters(letter: Letter, n: number): Letter[] {
  const usedTokens = new Set(soundTokens(letter));
  const picked: Letter[] = [];
  for (const candidate of shuffle(LETTERS)) {
    if (picked.length >= n) break;
    if (candidate.id === letter.id) continue;
    const tokens = soundTokens(candidate);
    if (tokens.some((t) => usedTokens.has(t))) continue;
    tokens.forEach((t) => usedTokens.add(t));
    picked.push(candidate);
  }
  return picked;
}

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
  const distractors = distractLetters(letter, DISTRACTORS);
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
  const distractors = distractLetters(letter, DISTRACTORS);
  return { kind: 'letterPick', letter, options: shuffle([letter, ...distractors]) };
}

/**
 * URD-022: reorder a lesson's letters so visually confusable ones never sit
 * next to each other in the round-major sequence below. `l-3` teaches
 * `daal`/`Daal`/`zaal` and `re`/`Re`/`ze`/`zhe` — two families distinguished
 * only by a dot or a diacritic — and drilling `daal, Daal, zaal, re, Re, ze,
 * zhe` in that order puts every same-family pair back to back, which risks
 * teaching the confusion rather than resolving it.
 *
 * Letters are bucketed by `confusableWith ?? id` (a base letter and all its
 * variants share one bucket), then buckets are placed largest-first into
 * target positions taken in the order [0, 2, 4, …, 1, 3, 5, …] — even
 * indices before odd. Filling evens first is what keeps the largest bucket
 * safe: consecutive members of one bucket land `positions.length` apart
 * until the evens run out, never adjacent *within* the returned order.
 * A naive round-robin merge (alternate between buckets in insertion order)
 * was tried and rejected: hand-traced on `l-3`'s real 4-vs-3 split it
 * produces `[daal, re, Daal, Re, zaal, ze, zhe]`, which still lands `ze`
 * immediately before `zhe` once the smaller bucket runs out — the
 * every-other pattern breaks exactly where the buckets are unequal, which
 * is the real case this exists for.
 *
 * The round-major loop below reuses this exact order every round, so the
 * full exercise sequence is this order repeated back to back — meaning the
 * *last* letter of one round sits next to the *first* letter of the next,
 * a wrap-around adjacency this function cannot see from a single pass, and
 * because every round repeats the identical order, whatever happens at
 * that wrap happens at *every* round transition, not just once.
 *
 * For every real group but one, the wrap lands on two different buckets —
 * fine, verified directly. `l-3` cannot be made fine: its largest bucket
 * (`re`'s family, 4 letters) is exactly half of the group's 7 rounded up,
 * and whenever a bucket's size equals `ceil(n/2)` there is exactly *one*
 * linear arrangement with zero *internal* adjacency, and in it the two
 * ends of the array are forced to both belong to that bucket — a bucket
 * that large has no other way to avoid sitting next to itself somewhere in
 * a line of 7. (Proof sketch: the largest independent set of positions in
 * a path of `n` nodes with no two chosen positions adjacent has size
 * `ceil(n/2)`, and for `n=7` that unique set is `{0,2,4,6}` — both
 * endpoints. A different arrangement that didn't use both endpoints for
 * this bucket would have fewer than 4 non-adjacent slots available to it,
 * which isn't enough room for 4 letters.) So `l-3`'s wrap always pairs two
 * `re`-family letters — measured directly on the real 42-exercise output
 * (re-measured for URD-046, not assumed from an older count: URD-043's
 * later letter-major tail restructuring changed how many of the lesson's
 * passes are actually round-major, so a stale figure here would be exactly
 * the kind of assumption this file's own history warns against): 4
 * occurrences, every one `zhe` then `re`, at the three transitions between
 * this function's own round-major passes (rounds 0→1, 1→2, 2→3) plus one
 * more where the round-major portion hands off to the separate letter-major
 * tail pass — still a large improvement on the pre-fix baseline (raw
 * `letterIds` order put 5 pairs of confusable letters back to back *within
 * a single round*, so 30 across `l-3`'s 6 rounds).
 *
 * URD-046: the three round-major transitions above showed the *identical*
 * pair every time — reinforcing `zhe`/`re` specifically, three times over,
 * is a worse version of the risk this function exists to reduce than
 * hitting three different pairs once each would be. `rotation` (default 0,
 * so every existing caller is unaffected) rotates each bucket's own member
 * order (by `rotation % (bucket.length - 1)`, not `% bucket.length` — see
 * the rotation code below for why that one-shorter period is what actually
 * spreads the wrap across different pairs rather than alternating between
 * two) before slotting members into that bucket's positions — still the
 * *same fixed position-set* per bucket (`{0,2,4,6}` for the largest,
 * `{1,3,5}` for the next, and so on), so the "zero internal adjacency"
 * property above is untouched: those positions are mutually non-adjacent
 * regardless of which specific member fills each. Only *which letter* ends
 * up at the array's two endpoints (and so, which letter's exercise is
 * adjacent to the next round's first) changes.
 *
 * This does NOT touch `turn`/`position` stability. Those are computed from
 * a letter's *identity* index — its position in the round-0 call, looked
 * up once via a fixed id→index map built from that single call — never
 * from where a rotated call happens to place it. A letter's own sighting
 * count and kind-cycle stay exactly as before; only the *visiting order*
 * within a round varies, which is all a wrap-adjacency depends on. An
 * earlier version of this comment rejected varying the order at all,
 * reasoning that any reordering would need to double as the identity index
 * and so reopen the kind-repetition/sibling-collision bugs the two
 * functions below this one already fought through several rounds to fix —
 * true only because that version conflated "which order are letters
 * emitted in this round" with "what is this letter's permanent id," which
 * do not have to be the same call.
 *
 * Letters with no `confusableWith` and no variant pointing at them sort into
 * their own singleton bucket, so rotation is a no-op for them (nothing to
 * rotate) — this only changes order among letters that actually share a
 * bucket.
 */
function separateConfusables(letters: Letter[], rotation = 0): Letter[] {
  const buckets = new Map<string, Letter[]>();
  for (const l of letters) {
    const key = l.confusableWith ?? l.id;
    const bucket = buckets.get(key) ?? [];
    bucket.push(l);
    buckets.set(key, bucket);
  }
  const ordered = [...buckets.values()].sort((a, b) => b.length - a.length);
  const n = letters.length;
  const positions: number[] = [];
  for (let i = 0; i < n; i += 2) positions.push(i);
  for (let i = 1; i < n; i += 2) positions.push(i);
  const result: Letter[] = new Array(n);
  let pos = 0;
  for (const bucket of ordered) {
    /**
     * Rotating by `rotation % bucket.length` directly was tried first and
     * measured, not assumed correct: on `l-3`'s real 4-member `re`-family
     * bucket it did stop the wrap from showing the identical pair every
     * time, but only ever alternated between two pairs (`{zhe,Re}` and
     * `{re,ze}`), each still twice over the lesson's four wrap transitions
     * — because comparing round `r`'s *last* slot to round `r+1`'s *first*
     * slot is always a distance of exactly two rotation-steps apart, and
     * for an even-sized bucket, two consecutive rotations differing by any
     * step coprime with the bucket size still lands on a bucket-index
     * distance that is even, which for a 4-member bucket has only two
     * possible edges to land on. Rotating by `rotation % (bucket.length -
     * 1)` instead — a period one shorter than the bucket itself — breaks
     * that resonance: checked directly against `l-3`'s real output, all
     * four wrap transitions now land on four different specific pairs —
     * `{Re,zhe}`, `{re,ze}`, `{Re,re}`, `{re,zhe}` — see
     * generator.test.ts's own URD-046 assertion, which re-measures this
     * directly rather than hardcoding it, so it can't go stale the way an
     * illustrative example in a comment can.
     * `Math.max(1, ...)` guards `bucket.length <= 2` (a singleton bucket
     * needs no rotation at all; a two-member bucket has only one other
     * arrangement, so a period of 1 just never rotates it — no real letter
     * lesson has a forced-adjacency bucket that small today, and this
     * doesn't regress the ones that do have one).
     */
    const period = Math.max(1, bucket.length - 1);
    // No trailing `% bucket.length` here: `period` is already at most
    // `bucket.length`, so this expression is already in `[0, period - 1]`,
    // a subset of `[0, bucket.length - 1]` — THE CRITIC, URD-046, caught an
    // earlier draft's redundant extra modulo, which read as if it guarded
    // `period > bucket.length`, a case that can't structurally happen.
    const offset = ((rotation % period) + period) % period;
    const spun = [...bucket.slice(offset), ...bucket.slice(0, offset)];
    for (const l of spun) {
      result[positions[pos]] = l;
      pos++;
    }
  }
  return result;
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

export function distractorsFor(
  word: Word,
  pool: Word[],
  { distinctCue = false, distinctMeaning = false, preferred = [] as Word[] } = {}
): Word[] {
  const chosen: Word[] = [];
  const usedCues = new Set<string>([cueOf(word)]);
  const usedMeanings = new Set<string>([word.meaning.toLowerCase()]);
  // URD-049: two distinct vocabulary entries can be genuine Urdu homographs
  // (identical spelling, different meaning — 40 such pairs exist, e.g.
  // w-chashma/w-chashma2, چشمہ meaning both "glasses" and "spring"). Neither
  // the id check below nor `distinctMeaning` catches this — they're
  // different words by both those measures — but `meaningPick`/
  // `wordFromMeaning`'s options show this same `.urdu` spelling on screen,
  // so two homographs together is two options a learner cannot tell apart
  // by what's written, exactly the failure `check:answerable`'s own
  // "two options are the same word" rule exists to catch. Unconditional,
  // like the `.id` check above it, not gated behind `distinctCue`/
  // `distinctMeaning`: showing the identical spelling twice is never
  // answerable, regardless of which other axis a caller cares about.
  const usedUrdu = new Set<string>([word.urdu]);
  const consider = (candidates: Word[], cap: number = DISTRACTORS) => {
    for (const c of shuffle(candidates)) {
      if (chosen.length >= DISTRACTORS || chosen.length >= cap) return;
      if (c.id === word.id || chosen.some((x) => x.id === c.id)) continue;
      if (usedUrdu.has(c.urdu)) continue;
      usedUrdu.add(c.urdu);
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
  // URD-030: tried first, so a caller with a same-concept "near-miss" pool
  // (another sentence illustrating the exact construction being reinforced)
  // gets first claim on the option set — a wrong answer that still requires
  // noticing the construction, not just the topic. Empty by default, so
  // every existing caller draws exactly as before.
  //
  // CURRICULUM CRITIC, reviewing this item: an uncapped `consider(preferred)`
  // saturates every slot whenever a concept has enough near-misses (measured:
  // 580 of 584 grammar-climb `wordFromMeaning` exercises ended up with ALL
  // three distractors same-concept, not "at least one") — a recall question
  // that has collapsed into "tell these four near-identical sentences apart"
  // with no option left that just *looks* different. Capped at
  // `DISTRACTORS - 1`, and `pool` below has `preferred`'s own members
  // excluded (not just left to chance) — `pool` is typically a superset
  // `preferred` was filtered from, so without the exclusion a big enough
  // `preferred` pool would likely refill the reserved slot from itself
  // anyway, undoing the cap. A near-miss pool that size or larger still
  // gets a real bias (most of the option set), just never the whole thing.
  const preferredIds = new Set(preferred.map((p) => p.id));
  consider(preferred, DISTRACTORS - 1);
  consider(pool.filter((p) => !preferredIds.has(p.id))); // prefer same-topic distractors
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
  variant?: number,
  preferred?: Word[]
): Exercise {
  if (demand === 'produce' && isTypeable(word)) {
    return { kind: 'typeWord', word };
  }
  if (demand === 'recall' || demand === 'produce') {
    const opts = distractorsFor(word, pool, { distinctMeaning: true, preferred });
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
  const pictureOptions = distractorsFor(word, pool, { distinctCue: true, distinctMeaning: true, preferred });
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
    // THE CRITIC, URD-018: needs `distinctCue` too, the same guard
    // `pictureOptions` above already requests. Without it, a verdict-cue word
    // (`VERDICT_CUES`, e.g. "yes"/"no"/"approved") can be offered as a
    // *distractor* here, and `MeaningPickExercise` renders every option's own
    // ✅/❌ art regardless of whether it is the answer — a wrong option
    // glowing correct, the interface lying about its own question. Harmless
    // in `wordFromMeaning` (the same gap exists there too, but its options
    // render as plain text, no icon) — this is the one branch that renders
    // the icon, and this fix took it from a fraction of a percent of review
    // content to roughly a sixth, turning a near-unreachable gap into a
    // routine one. Measured before this fix: 689 of 19,170 sampled instances
    // (~3.6%) leaked a verdict icon onto a wrong option.
    const opts = distractorsFor(word, pool, { distinctCue: true, distinctMeaning: true, preferred });
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

/**
 * URD-025: the meet-recall-produce climb shared by `sentences` lessons and
 * `grammar`'s sentence-reinforcement tail — factored into one function so
 * the two call sites cannot drift back out of sync the way they already
 * had once (found as a line-for-line copy of the same structure, discovered
 * when reviewing this item).
 *
 * A sentence is judged and graded as one opaque string — `sentenceBuild`
 * (`produce`, tiles assembled into the sentence) is the only kind that
 * makes the learner place its words in order; `meaningPick`/`wordFromMeaning`
 * (`meet`/`recall`) both test whole-sentence recognition, never
 * segmentation. `sentences.ts`'s own header and gauntlet/BENCHMARKS.md both
 * name sentence-building as the exercise this app's word-order teaching
 * depends on — the reason to choose Harf over a recognition-only app — so a
 * climb giving it 1 of 3 reps per sentence handed the two recognition kinds,
 * combined, 2 of 3 (66.7%) against production's 33.3%.
 *
 * `produce`, `meet`, and `recall` at 2:1:2 over 5 turns (40% / 20% / 40%)
 * is what this function gives instead — not the 2:1:1-over-4 "produce is
 * the outright majority" shape the item's own text names as one option.
 * That shape was tried first and rejected here on a fact this file's own
 * `check:shape` disagreement caught immediately: `MAX_SHARE` (check-shape.js)
 * caps *every* exercise kind, including `produce`, at 40% of the lesson —
 * so no ratio can put any one kind at or above 50% without check:shape's
 * own share rule failing, which the item's own verify command runs. Worked
 * out directly (not assumed): making `produce` strictly outnumber *each* of
 * `meet` and `recall` individually, while every kind stays ≤40%, needs at
 * least 10 turns per sentence (4 produce / 3 meet / 3 recall is the cheapest
 * integer split satisfying both) — more than triple today's 3, which pushes
 * every real sentences and grammar lesson well past the 8 minute ceiling
 * (measured: an 8-sentence lesson at 10 turns each is 12 minutes). 2:1:2 is
 * the best achievable shift within that hard ceiling: `produce` moves from
 * tied-for-least to *tied for the single most frequent kind* (with
 * `recall`, both at the 40% ceiling itself), and the combined-recognition
 * share falls from 66.7% to 60% — `meet`, the purely passive recognition
 * kind, is the one that gives up a turn, since `recall` (retrieval from
 * meaning) is already a step closer to production than plain recognition
 * and is kept level with `produce` rather than cut.
 *
 * `turn = (round + idx) % 5` cycles meet → produce → recall → produce →
 * recall as `idx` increases by one, so the two `produce` turns (1 and 3)
 * are never adjacent within a round — always separated by a `recall` in
 * the cycle — the same reasoning the 3-turn version relied on for its own
 * no-adjacent-repeat guarantee, re-verified for this cycle length directly
 * against real generated output. The round-boundary caveat the 3-turn
 * version documented — the last turn of one round and the first of the
 * next can coincide — is unchanged in kind, just re-measured at this cycle
 * length (see `generator.test.ts`'s URD-025 tests).
 */
function sentenceReinforceClimb(picks: Sentence[], pool: Word[], track: LearnTrack, exercises: Exercise[]): void {
  const ROUNDS = 5;
  for (let round = 0; round < ROUNDS; round++) {
    picks.forEach((sen, idx) => {
      const turn = (round + idx) % ROUNDS;
      const w = SENTENCE_WORDS.find((x) => x.id === sen.id);
      if (!w) return;
      if (turn === 1 || turn === 3) {
        const ex = sentenceExercise(sen, track);
        if (ex) exercises.push(ex);
      } else {
        // URD-030: when this sentence illustrates a grammar concept, other
        // sentences illustrating the *same* concept (from `pool`, so already
        // level-matched) are near-misses in form — a wrong option that still
        // requires noticing the construction, not just the topic. Measured
        // before this fix: only 26.9% (78 of 290) of the grammar climb's
        // meaningPick/wordFromMeaning exercises had even one same-concept
        // distractor, since `pool` was drawn with no concept-awareness at
        // all. Undefined (not merely empty) when `sen` has no concept — most
        // `sentences`-kind lesson picks won't have one — so `distractorsFor`
        // falls back to its plain, unweighted draw exactly as before.
        //
        // THE CRITIC, reviewing this item: this function is shared by both
        // call sites (the `grammar` branch's tail and the plain `sentences`
        // branch below), and a `sentences`-kind lesson's picks CAN carry a
        // `.concept` — `sentencesForLesson`'s own concept-priority slotting
        // (URD-027) means they sometimes do. The item's own scope was
        // written around "the grammar climb" alone, and this side effect on
        // `sentences`-kind lessons went unmeasured and undisclosed here at
        // first. Measured once flagged: 380 of 576 (66.0%) of `sentences`-
        // kind lessons' own concept-tagged meaningPick/wordFromMeaning
        // exercises now have a same-concept distractor too (up from a
        // chance-level 21.5% before), the identical pattern as the grammar
        // branch (0% of `meaningPick`, capped at `DISTRACTORS - 1` of
        // `wordFromMeaning`) — the same mechanism, working identically,
        // because it is the same shared function. Left in rather than
        // special-cased away: the reasoning that makes a near-miss
        // distractor better for a grammar lesson applies exactly as well to
        // a sentences lesson reinforcing the same tagged construction, and
        // splitting this function back into two branch-specific copies to
        // avoid an unscoped-but-beneficial side effect is the exact
        // drift this function was unified to prevent (see this function's
        // own header comment).
        const preferred = sen.concept ? pool.filter((p) => p.concept === sen.concept && p.id !== sen.id) : undefined;
        const ex = wordExercise(w, pool, track, turn === 0 ? 'meet' : 'recall', 1, preferred);
        exercises.push(ex);
      }
    });
  }
}

/**
 * The same, for a grammar drill: its options are inflected forms, and the
 * Roman track needs all four of them transliterated or none.
 *
 * URD-035: computed on every track now, not only `'roman'`. `showRoman` (the
 * caption `GrammarDrillExercise` shows once an answer is picked) defaults on
 * for `script`/`both` too, not just `'roman'` — the component was calling
 * into this data on every track already, it just wasn't there yet. Only the
 * Roman track drops the drill entirely when a translit set can't be built
 * (`romanAll` returning `undefined`), because there the transliteration
 * *is* the exercise; script/`both` keep the drill either way, same as
 * before this change — `GrammarDrillExercise` itself degrades the caption
 * gracefully when this is missing rather than assuming it never is.
 */
function grammarDrillExercise(concept: GrammarConcept, drill: GrammarDrill, track: LearnTrack): Exercise | undefined {
  const romanOptions = romanAll(drill.options);
  if (track === 'roman' && !romanOptions) return undefined;
  return { kind: 'grammarDrill', concept, drill, romanOptions: romanOptions ?? undefined };
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
 * Only show a sentence the learner can actually read, and only one whose
 * grammar the learner has actually been taught.
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
 * URD-026: word-level readiness has no notion of the *construction* a
 * sentence illustrates — a sentence can pass every word through and still be
 * built entirely around a tense or case never taught. Measured against the
 * real path order: `s-intermediate` (an elementary-unit lesson) drew
 * sentences tagging g-future/g-ability/g-obligation/g-comparative in 6 of 8
 * picks, every one of those concepts taught 90-115 lesson-positions later;
 * `s-intermediate-2` drew 8 of 8 untaught. Not merely unread — since URD-025
 * piped this exposure into SRS via `meaningPick`/`wordFromMeaning`'s
 * `gradeItem` calls, a learner could be graded, and see the construction come
 * due for review, before the lesson that teaches it. Fixed the same way word
 * readiness was: a sentence tagged to a concept (`taughtConceptsUpTo`,
 * `lib/review.ts`) not yet taught by the time this lesson is reached is
 * dropped, the same all-or-nothing rule as the word filter — a sentence with
 * no `concept` at all is left alone, exactly as an untaught-by-anyone word
 * form is.
 *
 * The unfiltered pool is the fallback, because a lesson with nothing in it is
 * worse than a lesson with one hard word or one under-taught construction.
 * Measured across all 37 sentence and grammar lessons on the path with both
 * filters applied, the fallback is never reached — every one of them still
 * has more fully-readable, fully-taught sentences than it needs.
 */
function readableSentences(pool: Sentence[], lessonId: string): Sentence[] {
  const forms = readableFormsAt(lessonId);
  const taughtAnywhere = TAUGHT_FORMS;
  const concepts = taughtConceptsUpTo(lessonId);
  const ok = pool.filter(
    (s) =>
      (s.words ?? []).every((f: string) => !taughtAnywhere.has(f) || forms.has(f)) &&
      (!s.concept || concepts.has(s.concept))
  );
  return ok.length ? ok : pool;
}

/**
 * URD-027: which sentences a "sentences" lesson draws — coverage-aware,
 * where the previous version was not.
 *
 * Every `sentences`-kind lesson used to draw independently:
 * `seededShuffle(pool, lesson.id).slice(0, lesson.size)`, each lesson its
 * own uniform sample of its whole level's pool with no notion of what a
 * sibling lesson at the same level had already drawn. Measured: only 81 of
 * 256 sentences (31.6%) were ever reachable by any lesson course-wide —
 * beginner's 3 lessons, drawing independently, still overlapped enough to
 * cover only 22 of a possible 24 distinct sentences (its 3 lessons' combined
 * capacity, `size` 8 each).
 *
 * This walks a level's `sentences`-kind lessons in path order and has each
 * one exclude whatever an *earlier* sibling has already drawn, so within one
 * level, no sentence is drawn twice while any undrawn one remains. `siblings`
 * is small (2-4 lessons per level today) and each call is cheap, so this
 * recomputes earlier siblings' picks on every call rather than caching them
 * — the same call-site-driven-cost tradeoff URD-011 measured before adding
 * `check:shape`'s own memoisation, not assumed here without a slow run to
 * justify it.
 *
 * This raises reachable coverage to each level's real ceiling — the sum of
 * its `sentences`-lessons' sizes — not to 100%: a level's total lesson
 * capacity (24-32 sentences today) is well under its pool (57-69), so most
 * of a level's pool is still never drawn by design, not oversight. Closing
 * that gap needs more lesson capacity (bigger lessons or more of them), which
 * is a curriculum decision this item's own file scope (`generator.ts`,
 * `sentences.ts`, `scripts/`) does not include — `check:sentence-coverage`
 * (`scripts/`) states the real ceiling explicitly rather than claiming a
 * false 100%, the same "document the deliberate exemption" escape hatch
 * this item's own definition of done offers.
 *
 * Never reuses a sentence an earlier sibling already claimed, even if that
 * leaves a lesson short of its own `size` — URD-048 (raising `sentences`-
 * lesson size to close more of the reachability gap) found a real case
 * where two adjacent siblings at the same level (`s-intermediate`,
 * `s-intermediate-2`) share a readable-at-position pool too thin (16) to
 * supply both their combined slots (20) distinctly. An earlier version of
 * this function fell back to reusing a claimed sentence there — silently
 * reintroducing the exact "a sibling repeats what another already showed"
 * defect this whole function exists to prevent, discovered only because
 * `check:sentence-coverage` measured the real union size rather than
 * trusting the naive lesson-size-sum as an assumed ceiling. A lesson a
 * little short of its designed length is a known, honest tradeoff;
 * silently repeating a sibling's sentence is the bug this file's own
 * history (URD-027) was written to close.
 *
 * CURRICULUM CRITIC, reviewing this item: raising the aggregate ceiling
 * says nothing about *which* sentences fill it, and a uniform random draw
 * left two real grammar concepts (g-future, g-compound) at literally zero
 * sentences shown outside their own one-shot `grammar` lesson — measured,
 * not assumed: a concept taught late in a level (only 1 of that level's
 * `sentences`-lessons comes after it, against 3-4 for an early concept)
 * gets exactly as many lottery tickets in the random draw as any other
 * concept, so being taught late is a real, structural disadvantage, not
 * noise. So each lesson's draw is no longer pure random fill: it first
 * gives one slot each to every concept tagged in the readable-and-unclaimed
 * pool that no *earlier* sibling at this level has represented yet
 * (deterministically ordered, so which concept wins a contested lesson's
 * limited slots is still stable across runs), then fills whatever is left
 * the same way as before. A concept whose only eligible lesson already has
 * more competing never-yet-shown concepts than it has slots can still miss
 * out — this does not guarantee every concept a sighting, it removes the
 * "uniform random draw structurally favours early concepts" bias, which is
 * the actual defect found.
 */
function sentencesForLesson(lesson: Lesson): Sentence[] {
  const levelPool = lesson.level ? SENTENCES.filter((x) => x.level === lesson.level) : SENTENCES;
  const readable = readableSentences(levelPool.length ? levelPool : SENTENCES, lesson.id);

  const siblings = ALL_LESSONS.filter((l) => l.kind === 'sentences' && l.level === lesson.level);
  const idx = siblings.findIndex((l) => l.id === lesson.id);
  const claimed = new Set<string>();
  const represented = new Set<string>();
  for (let i = 0; i < idx; i++) {
    for (const s of sentencesForLesson(siblings[i])) {
      claimed.add(s.id);
      if (s.concept) represented.add(s.concept);
    }
  }

  const unclaimed = readable.filter((s) => !claimed.has(s.id));

  const byUnrepresentedConcept = new Map<string, Sentence[]>();
  for (const s of unclaimed) {
    if (!s.concept || represented.has(s.concept)) continue;
    if (!byUnrepresentedConcept.has(s.concept)) byUnrepresentedConcept.set(s.concept, []);
    byUnrepresentedConcept.get(s.concept)!.push(s);
  }
  const picks: Sentence[] = [];
  const pickedIds = new Set<string>();
  for (const concept of seededShuffle([...byUnrepresentedConcept.keys()], `${lesson.id}:concepts`)) {
    if (picks.length >= lesson.size) break;
    const chosen = seededShuffle(byUnrepresentedConcept.get(concept)!, `${lesson.id}:${concept}`)[0];
    picks.push(chosen);
    pickedIds.add(chosen.id);
  }

  const rest = unclaimed.filter((s) => !pickedIds.has(s.id));
  const need = lesson.size - picks.length;
  return [...picks, ...seededShuffle(rest, lesson.id).slice(0, need)];
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
  known: ReadonlySet<string> = new Set(),
  /**
   * URD-039: how many times this exact lesson has already been completed —
   * `completedLessons[lesson.id]?.done` in the progress store, `0` before a
   * learner has ever finished it once. Used only to rotate the review
   * fallback's shuffle seed (see `fallbackReviewRefs`/`reviewWordPool`) so a
   * unit whose every word is already known doesn't slice off the same fixed
   * subset on every single replay.
   */
  visit = 0
): Exercise[] {
  const exercises: Exercise[] = [];
  // On the Roman track the learner has said they are not learning the
  // alphabet. Letter lessons are already off their path, but review can still
  // surface a letter that was practised before the switch, and a vocabulary
  // lesson would otherwise close on a spell-it-in-Nastaliq exercise.
  const teachesScript = track !== 'roman';

  if (lesson.kind === 'letters' && lesson.letterIds && teachesScript) {
    // URD-022: reordered so visually confusable letters (daal/Daal/zaal,
    // re/Re/ze/zhe, and every other `confusableWith` group in letters.ts)
    // are almost never adjacent in the round-major sequence below — see
    // `separateConfusables`'s own doc comment for the one group (`l-3`)
    // where "almost" is doing real work. `siblingIndex`/`turnOffset`/
    // `posOffset` below key off `lesson.letterIds` directly, not this
    // reordered array, so they are unaffected by the reorder.
    const groupLetters = lesson.letterIds.map(getLetter).filter(Boolean) as Letter[];
    const letters = separateConfusables(groupLetters);
    // URD-046: a letter's permanent identity index — used for `turn`/
    // `position` math, which must stay round-invariant — looked up from
    // this single, unrotated call, never from a per-round rotated one
    // below. See `separateConfusables`'s own doc comment.
    const idxOf = new Map(letters.map((l, i) => [l.id, i]));
    /**
     * How many position-bearing sightings this letter has already had.
     *
     * The four joining forms are this app's whole thesis, and `positionIndex`
     * used to be derived from the ROUND number — which silently stops
     * covering the later positions the moment a round can be spent on
     * something that carries no position. Two now can: URD-020's `letterSpot`
     * and URD-047's `letterContrast`. Measured across all 9 real letter
     * lessons, on the `final` form specifically (last in `POSITIONS`, so the
     * first to fall off the end when rounds are skipped): 14 of 46
     * letter-slots never saw it before URD-047, and 25 of 46 did not after —
     * a real regression this item caused, found by the CURRICULUM CRITIC.
     *
     * Counting the position-bearing sightings themselves, rather than the
     * round they happen to fall on, closes the skip: `seq + idx + posOffset`
     * advances once per exercise that actually takes a position, so the cycle
     * cannot lose a step to a round spent elsewhere. `idx`/`posOffset` still
     * rotate WHICH form a letter starts on, so two letters in a round are
     * still not shown the same form and two sibling lessons still differ.
     *
     * This does not reach full coverage, and cannot: `letterPick` carries no
     * position at all (it asks which glyph makes a sound, with no form to
     * show), so of a letter's four position-bearing sightings roughly a third
     * render no form. Six sightings minus two position-free kinds cannot
     * cover four forms once a third of the remainder is also position-free.
     * Closing that needs the kind/position interaction redesigned rather than
     * the counter fixed — filed as URD-060.
     */
    const posSeq = new Map<string, number>();
    const nextPos = (id: string, idx: number) => {
      const seq = posSeq.get(id) ?? 0;
      posSeq.set(id, seq + 1);
      return seq + idx + posOffset;
    };
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
    /**
     * URD-020: a learner meeting a completely new script used to spend
     * 96.8% of their first hours on isolated glyphs — `letterTrace`/
     * `letterForm`/`letterPick` never show a letter inside a real word, and
     * the old design added exactly one context-word exercise for the whole
     * lesson, regardless of how many letters it taught (measured: 276 of
     * 285 exercises across all 9 letter lessons were isolated-glyph).
     *
     * One of each letter's `SIGHTINGS_PER_LETTER` sightings now shows it
     * inside a real vocabulary word (`LETTER_CONTEXT_WORD`) instead of
     * alone — replacing an isolated sighting rather than adding a new one,
     * so total lesson length is unchanged (if anything, one exercise
     * shorter than before, since the old single shared context word is
     * gone). `contextRound` is offset by `idx` and `turnOffset` the same
     * way `turn`/`position` are, for the same reason `posOffset` exists:
     * two sibling lessons sharing a letter group (`l-1`/`l-1-2`) don't land
     * every letter's context sighting on the identical round. THE CRITIC:
     * this does NOT guarantee two letters in the same lesson never share a
     * round — only 5 rounds are available (round 0 is reserved, see below),
     * so any group past 5 letters (`l-1`, `l-1-2` at 6; `l-3` at 7) forces
     * at least one round to carry two context words by pigeonhole. Still
     * exactly one sighting per letter, never adjacent to itself, just not
     * evenly spread once a group outgrows the round count.
     *
     * Never round 0: CURRICULUM CRITIC found that `(idx + turnOffset) %
     * SIGHTINGS_PER_LETTER` puts the first letter's (`idx === 0`)
     * context word at round 0 whenever `turnOffset` is 0 — true for every
     * lesson except a later sibling — making a *whole word in a script the
     * learner has never seen* the very first exercise of 8 of the 9 real
     * letter lessons, including the first lesson in the entire course. A
     * context sighting is supposed to reinforce a letter already met, not
     * introduce it; mapping into rounds 1 through 4 instead guarantees
     * every letter's round-0 sighting is always the isolated introduction
     * before its context word ever appears.
     *
     * URD-043: also never the final round (`SIGHTINGS_PER_LETTER - 1`) —
     * see the comment on `tailRound` and the final sighting below for why. Narrows
     * where a
     * context sighting can land from 5 rounds (1-5) to 4 (1-4), which
     * pushes the pigeonhole collision `contextRound`'s own comment already
     * names (a letter group bigger than the round capacity forces two
     * letters' context words onto the same round) from "bigger than 5" to
     * "5 or bigger" — measured: `l-2`/`l-7`/`l-8` (5 letters each) join
     * `l-1`/`l-1-2`/`l-3` (6-7 letters) in hitting it, six of nine real
     * letter lessons now instead of three. Still exactly one context
     * sighting per letter, never adjacent to itself, just less evenly
     * spread — the same tradeoff this comment already accepted, at a
     * lower threshold.
     */
    const contextRound = (idx: number) => 1 + ((idx + turnOffset) % (SIGHTINGS_PER_LETTER - 2));
    /**
     * URD-047: the round that becomes a `letterContrast` for any letter that
     * has a confusable partner in this lesson, replacing one isolated-glyph
     * sighting rather than adding a seventh — the same "replace, don't add"
     * rule URD-020's context sighting already follows, so lesson length is
     * unchanged.
     *
     * Offset by exactly 2 from `contextRound` over the same modulus, which
     * makes the two provably never coincide (`x % 4` and `(x + 2) % 4` differ
     * for every `x`) rather than merely rarely coinciding — a letter can
     * never lose both its context sighting and a drill to the same round, and
     * neither ever lands on round 0 (the isolated introduction, which must
     * stay the learner's first look at the letter) or on the final round (which
     * URD-043 reserves for `letterTrace`, so a letter's last sighting is
     * always its hardest).
     */
    const contrastRound = (idx: number) => 1 + ((idx + turnOffset + 2) % (SIGHTINGS_PER_LETTER - 2));
    /**
     * URD-043: vocabulary's own staggered climb ends on `produce`
     * (`typeWord`/`wordBuild`) for every one of 2,281 words, on both
     * tracks, 100% of the time — the property URD-019 grades an item's
     * SRS state against ("the last of its sightings this lesson visit is
     * the hardest, most diagnostic one"). Letters never had that property:
     * `turn = round + idx + turnOffset` ties which kind lands last to
     * `idx`, which shifts per letter and per lesson largely arbitrarily,
     * unlike vocabulary's fixed ascending climb. Measured directly across
     * all 9 real letter lessons: a letter's final round landed on a
     * recognise-tier kind (`letterForm`/`letterPick`) 67.4% of the time (31
     * of 46 letters sampled) — worse evidence of real recall than a
     * confirmed produce-tier pair would be, even with URD-019's own
     * last-two-sightings-agree guard already cutting the practical risk of
     * a single lucky guess.
     *
     * `tailRound` (the second-to-last round) and the final round (the last)
     * are handled letter-major, not round-major, immediately below — a
     * first version forced `turn = 0` round-major on the final round alone,
     * which correctly made every letter's true last sighting `letterTrace`
     * but grouped every letter's forced-trace exercise into one contiguous
     * block (round-major visits every letter within a round before moving
     * on), producing a run of `letters.length` (4-7) identical
     * `letterTrace` exercises in a row — the exact repetition problem this
     * file's own comment above already rejected once for "round alone,"
     * just reintroduced by forcing one round's *kind* rather than its
     * *content*. Measured: 9 of 9 real letter lessons exceeded
     * `check:shape`'s 3-in-a-row ceiling, worst `l-3` at 7 straight.
     *
     * Pairing each letter's own `tailRound` and final-round exercises back
     * to back — letter by letter — instead fixes both problems at once:
     * `tailRound` is restricted to `letterForm`/`letterPick` only (never
     * `t === 0`), so the sequence for consecutive letters alternates
     * non-trace, trace, non-trace, trace, ... and no two `letterTrace`
     * exercises are ever adjacent, while each letter's own two-exercise
     * pair still ends its personal sequence on the forced `letterTrace`.
     * `letterExerciseAt`'s own `t === 0` branch needs a glyph mask to
     * actually choose `letterTrace` rather than falling through to
     * `letterForm` — every real letter×position combination has one
     * (confirmed directly, 160 of 160), so this never silently downgrades
     * to the softer kind it exists to avoid.
     *
     * CURRICULUM CRITIC, two findings on this pairing, both real:
     *
     * 1. An earlier version of this comment justified clustering a
     *    letter's last two sightings by claiming it "mirrors how
     *    vocabulary already sequences recall→produce close together" —
     *    checked against the vocab lesson's own staggered-pass design
     *    (the `meet g[0] recall g-1[0] produce g-2[0] ...` comment
     *    further down this file) and real generated timing, this is
     *    false: a vocabulary word's successive sightings land 3-7
     *    exercises apart specifically *because* "massed repetition inside
     *    ten seconds is not spacing" (that comment's own words). The
     *    real justification is structural, not precedent: round-major
     *    can't give every letter a true-final `letterTrace` without either
     *    the multi-letter run or the share-ceiling problem measured above,
     *    so letter-major pairing for just these two rounds is what closes
     *    both, not an appeal to how vocabulary already works.
     *
     *    Whether the adjacency itself still costs something is a separate,
     *    real question, and the answer here is that `letterTrace`
     *    (`TraceExercise.tsx`) names the letter and position outright
     *    ("{letter.name} · {position}") and asks the learner to draw it —
     *    a motor-formation check on a letter the exercise already
     *    identifies, not a blind-recall check the way vocabulary's
     *    `typeWord`/`wordBuild` are (prompted only by a meaning, naming
     *    nothing). A recognise-tier answer glimpsed one exercise earlier
     *    doesn't hand the learner anything `letterTrace` wasn't already
     *    handing them by naming the letter. Vocabulary's spacing rule
     *    protects a different kind of exercise than this one.
     *
     * 2. `contextRound`'s range (1 through `tailRound`) means the context
     *    sighting can land on `tailRound` itself — measured directly:
     *    exactly one letter per lesson, 9 of 9 real lessons, has its
     *    `tailRound` slot be the context word rather than
     *    `letterForm`/`letterPick`. Real, and not what the paragraph above
     *    described. Left as is rather than narrowing `contextRound` further
     *    to exclude it: the context exercise shows the letter's glyph
     *    embedded in a whole word, at whatever position that word actually
     *    uses (checked directly: `l-1`'s `te`/`w-dost` pairing shows `te`
     *    in `دوست`'s word-final position, then traces it in `isolated` —
     *    a different position, not the identical glyph the recognise-tier
     *    alternative would show), and asks about the word's *meaning*, not
     *    the letter directly — a weaker, more indirect exposure of the
     *    glyph than the recognise-tier drill it occasionally replaces,
     *    not a stronger one. Narrowing further would only worsen the
     *    pigeonhole collision this file already accepts (a group bigger
     *    than the round capacity forces two letters onto one context
     *    round) for a modality-adjacency risk measured to be milder than
     *    the alternative it would replace it with.
     */
    const tailRound = SIGHTINGS_PER_LETTER - 2;
    for (let round = 0; round < tailRound; round++) {
      // URD-046: visited in THIS round's own rotated order (varies which
      // letter sits at the round's two ends, so a forced confusable-bucket
      // wrap pairs a different two letters at each transition) — but every
      // letter's `idx` still comes from `idxOf`, the single unrotated call,
      // so `turn`/`position` are exactly as round-invariant as before.
      const roundOrder = separateConfusables(groupLetters, round);
      roundOrder.forEach((l) => {
        const idx = idxOf.get(l.id)!;
        if (round === contextRound(idx)) {
          const w = LETTER_CONTEXT_WORD.get(l.id);
          if (w) {
            exercises.push(letterSpotExercise(l, w));
            return;
          }
        }
        if (round === contrastRound(idx)) {
          const mates = confusableMatesIn(l, groupLetters);
          if (mates.length) {
            exercises.push(letterContrastExercise(l, mates));
            return;
          }
        }
        exercises.push(letterExerciseAt(l, round + idx + turnOffset, nextPos(l.id, idx)));
      });
    }
    letters.forEach((l, idx) => {
      let pushedTail = false;
      if (tailRound === contextRound(idx)) {
        const w = LETTER_CONTEXT_WORD.get(l.id);
        if (w) {
          exercises.push(letterSpotExercise(l, w));
          pushedTail = true;
        }
      } else if (tailRound === contrastRound(idx)) {
        // Recognise-tier like the `letterForm`/`letterPick` it replaces, so
        // this keeps `tailRound`'s own "never `letterTrace` here" property
        // (see the comment above) — the letter-major pair still reads
        // non-trace then trace, and no two traces end up adjacent.
        const mates = confusableMatesIn(l, groupLetters);
        if (mates.length) {
          exercises.push(letterContrastExercise(l, mates));
          pushedTail = true;
        }
      }
      if (!pushedTail) {
        const turn = 1 + ((tailRound + idx + turnOffset) % 2); // never letterTrace here
        exercises.push(letterExerciseAt(l, turn, nextPos(l.id, idx)));
      }
      exercises.push(letterExerciseAt(l, 0, nextPos(l.id, idx))); // always letterTrace
    });
  }

  if (lesson.kind === 'phrases') {
    /**
     * URD-A02: this used to draw `lesson.size` *distinct* phrases and give
     * each exactly one exercise — so raising the size from 6 to 24 to clear
     * `check:shape`'s length floor (the original fix) moved 24 of the app's
     * 28 phrases from "seen once, ever" to "seen once, ever," just more of
     * them at once. Nothing revisits a phrase after this lesson — no review
     * pool, no second phrases lesson — so one sighting is also its lifetime
     * total. That is the exact trap this file's own vocab pipeline exists to
     * avoid (see the doc comment on the vocab branch below, and URD-A02's
     * own queue note: "the trap is fixing this by raising the count alone").
     * Caught by the curriculum critic reviewing that first fix, not by
     * `check:shape` — its `MIN_SIGHTINGS` floor only scans `kind: 'vocab'`
     * lessons, so a phrases lesson's sighting count was invisible to it
     * before and after.
     *
     * The fix is the same one vocab already uses: fewer distinct items,
     * each met more than once, rather than more items met once. `lesson.size`
     * is now how many *distinct phrases* this lesson draws — the same role
     * `wordIds.length` plays for a vocab lesson — not the exercise count
     * that drawing-with-one-exercise-each conflated it with; the real
     * exercise count here is `3 * size` (every phrase goes through all
     * three passes below), and `check:shape` measures that real count, not
     * this number, exactly as it does for every other kind.
     *
     * Phrases share one icon, so a picture question is unanswerable — every
     * option would show the same speech bubble, and `distinctCue` folds any
     * attempt at `multipleChoice`/`listenTap` back to `meaningPick` anyway
     * (`wordExercise`'s `pictureOptions.length < DISTRACTORS` guard). That
     * leaves the same three kinds available as before: `meet` (folds to
     * `meaningPick`), `recall` (`wordFromMeaning`), `produce` (`typeWord`,
     * where typeable). `produceExercise` already has exactly the fallback
     * this needs for the untypeable remainder — see its own doc comment —
     * so passing `teachesScript: false` (phrases are sentence-length; tile
     * building was never one of this kind's three reachable kinds) reduces
     * it to "type it if typeable, otherwise ask what it means again" rather
     * than skipping a third sighting outright. Reusing `buildLessonExercises`
     * vocab pipeline's own `GROUP`/staggered-cycle machinery below (same
     * `passes` shape, same code) means phrases inherit the same
     * measured-safe run/share behaviour vocab already has, rather than
     * re-deriving it by hand for a second lesson kind.
     */
    const producible = (w: Word) => isTypeable(w) && !w.roman.includes('...') && !w.urdu.includes('...');
    /**
     * Biased the same way the previous fix biased its draw (URD-023): a
     * uniform draw across all 28 phrases risks too few typeable ones to
     * keep `produce`'s fallback-to-`meet` share under 40% (worked out by
     * hand and confirmed against a real run: an even split of typeable and
     * untypeable picks pushes `meaningPick` to ~39-43% of the lesson,
     * depending on how many of the untypeable third sighting falls back).
     * Guaranteeing most of the draw is typeable keeps `produce` doing its
     * own share of the work instead of folding back into `meet` — `size - 2`
     * typeable, 2 untypeable, measured directly (below) to land under 40%
     * with room, while still giving a couple of the corpus's untypeable
     * phrases their first real repetition instead of leaving all 14 at zero.
     */
    const typeableDraw = Math.min(PHRASE_WORDS.filter(producible).length, Math.max(0, lesson.size - 2));
    const eligiblePool = PHRASE_WORDS.filter(producible);
    const produceDraw = seededShuffle(eligiblePool, `${lesson.id}:produce`).slice(0, typeableDraw);
    const produceIds = new Set(produceDraw.map((w) => w.id));
    const restPool = PHRASE_WORDS.filter((w) => !produceIds.has(w.id));
    const restDraw = seededShuffle(restPool, lesson.id).slice(0, Math.max(0, lesson.size - produceDraw.length));
    const picks = seededShuffle([...produceDraw, ...restDraw], `${lesson.id}:order`);

    const GROUP = 2;
    const groups: Word[][] = [];
    for (let i = 0; i < picks.length; i += GROUP) groups.push(picks.slice(i, i + GROUP));

    const passes: ((w: Word, i: number) => Exercise)[] = [
      // Fixed at variant 1 (`meaningPick`), not vocab's varying `i % 3`.
      // Every phrase shares one emoji (`💬`), so `distractorsFor`'s
      // `distinctCue` pass can never find three more of the same cue inside
      // `PHRASE_WORDS` — its own widen-if-too-uniform fallback
      // (`if (chosen.length < DISTRACTORS) consider(WORDS)`) then reaches
      // into the full 2,281-word vocabulary for picture distractors, which
      // *looks* like a working `multipleChoice`/`listenTap` (four distinct
      // pictures) but is not one: the correct option's own picture is still
      // the generic bubble, so it is the visibly odd one out among three
      // real object pictures, answerable by elimination without knowing
      // what the phrase means. Confirmed live: the varying-variant version
      // of this pass produced exactly that (`multipleChoice`/`listenTap`
      // both appearing) before this fix pinned it to 1.
      (w) => wordExercise(w, PHRASE_WORDS, track, 'meet', 1),
      (w) => wordExercise(w, PHRASE_WORDS, track, 'recall'),
      (w, i) => produceExercise(w, PHRASE_WORDS, track, false, i),
    ];

    for (let cycle = 0; cycle < groups.length + passes.length - 1; cycle++) {
      const active = passes
        .map((make, stage) => ({ make, g: cycle - stage }))
        .filter(({ g }) => g >= 0 && g < groups.length);
      // Same measured reason as the vocab pipeline below: without this, every
      // cycle boundary puts `produce` next to `produce`.
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
      // lesson comes up short of the 3-8 minute band unless enough of a
      // concept's tagged sentences are actually readable at its lesson
      // position — "tagged" and "usable" are not the same count and neither
      // should be read off the other. Three concepts landed short of the
      // band before URD-025: g-pronouns and g-ability had only 5 tagged
      // sentences each, all 5 readable; g-plurals had 4 tagged but only 3
      // readable (`s-39` was dropped by `readableSentences` above for using
      // "پر", a postposition not yet taught at that position — a stale
      // version of this comment once blamed "میز", which is actually taught
      // well before this lesson). URD-025's extra `sentenceReinforceClimb`
      // round happened to lengthen these three enough to move two of them
      // into the band — g-pronouns (2.7→4.2 min) and g-ability (2.55→4.05
      // min) — but g-plurals (1.8→2.7 min) still fell short at 3 readable
      // sentences, since no ratio of a fixed-size climb can add exercises
      // beyond what's needed to keep each kind under check:shape's own 40%
      // share ceiling. Not a climb-ratio problem — URD-025 correctly left it
      // to URD-029, which closed it by re-tagging `s-77` ("میرے تین دوست
      // ہیں", already readable there) from g-possess to g-plurals rather
      // than touching this file: g-plurals now draws 4 readable sentences
      // and clears the floor at 3.45 minutes.
      //
      // Distractors are drawn from every sentence at this concept's level,
      // not just the handful picked for this lesson — the same reason
      // `sentences` gives `wordExercise` the whole level's pool rather than
      // just its own picks: a small `picks` (as few as 3 for the thinnest
      // concept) is not enough source material for four distinct options.
      //
      // Same climb, same ratio as `sentences` — not a lighter one, even
      // though `grammarDrill` above already tests this concept's inflected
      // forms directly. The two are complementary, not redundant: a drill's
      // options are already-correct forms, so choosing among them tests
      // which form is right; `sentenceBuild`'s tiles are also already
      // correctly inflected, and what it tests is word ORDER — a skill
      // `grammarDrill` never touches. Doubling `sentenceBuild` here doesn't
      // re-drill what the drills already covered; it drills something nothing
      // else in this lesson does. (CURRICULUM CRITIC asked this be said
      // explicitly rather than left as a silent default — done here.)
      const reinforcePool = SENTENCE_WORDS.filter((w) => w.level === c.level);
      sentenceReinforceClimb(picks, reinforcePool, track, exercises);
    }
  }

  if (lesson.kind === 'sentences') {
    const picks = sentencesForLesson(lesson);
    /**
     * Every sentence met five times through `sentenceReinforceClimb` (see its
     * own doc comment for the full reasoning, including why 2:1:2 rather
     * than a naive "give produce the majority" split): recognise its
     * meaning once, retrieve it from the meaning twice, build it from tiles
     * twice — `produce` tied for the single most frequent kind (URD-025)
     * rather than tied for least, on the same climb `vocab` uses for its
     * own three kinds.
     *
     * This call site and `grammar`'s sentence-reinforcement tail used to
     * carry this logic twice, line for line — URD-025 factored it into one
     * function specifically so the two cannot drift back out of sync the
     * way they already had once.
     */
    const sentencePool = SENTENCE_WORDS.filter((w) => !lesson.level || w.level === lesson.level);
    sentenceReinforceClimb(picks, sentencePool, track, exercises);
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
    /**
     * URD-041/URD-042: which review lesson, in path order, this is among
     * every review lesson — the same "not a hash" technique `turnOffset`/
     * `posOffset` above use for letter-teaching lessons, for the identical
     * reason: a hash can only change collision odds, never rule them out,
     * and this file has already been burned by one that collided on the
     * unlucky pair. `-1` for a lesson not placed on the path at all
     * (`practice-review`, the synthetic Daily Review screen), floored at 0.
     * Computed once, up here, so both `fallbackReviewRefs` below (URD-042's
     * letter *coverage*) and `letterExerciseAt` further down (URD-041's
     * letter *kind*) key off the identical value rather than two
     * independently-derived ones that could drift apart.
     */
    const reviewIndex = Math.max(
      0,
      ALL_LESSONS.filter((l) => l.kind === 'review').findIndex((l) => l.id === lesson.id)
    );
    /**
     * URD-040: grammar concept(s) this review's own unit taught, if any —
     * see `conceptsInUnit`'s doc comment.
     *
     * THE CRITIC (BLOCKING): a first version reserved this budget by
     * shrinking the pool `due` itself was capped against —
     * `refs.length = Math.min(refs.length, lesson.size - conceptBudget)`
     * truncates `due ++ filler` from the end, and `due` sits at the front
     * only by construction, not by protection. Whenever the due queue
     * alone already reached `lesson.size` — the *ordinary* state
     * `dueBudget`'s own contract produces, not a rare overfull edge case —
     * that cap silently dropped the last `conceptBudget` due items:
     * genuinely overdue, scheduler-flagged material, to make room for a
     * grammar drill that isn't even SRS-gradable. Reproduced live:
     * rev-saying-who-you-are fed a full 22-item due queue dropped
     * w-maan and w-baap — the exact "the words you got wrong come back
     * first" guarantee `check:srs` exists to hold, contradicted by this
     * function's own comment on `due` two screens up.
     *
     * `refCap` never falls below `due.length` now — the concept budget
     * only ever eats into the *filler* pool's target, and even then only
     * whatever room is left after `due`. A fully-saturated due queue gets
     * no grammar concept exercise that visit rather than bumping a real
     * due item out (see `conceptRoom` below) — an honest trade, not an
     * unconditional guarantee, but the item's own definition of done never
     * asked for one, and dropping scheduler-flagged content to make room
     * for decorative grammar practice is worse than occasionally skipping
     * the practice.
     */
    const unitConcepts = conceptsInUnit(lesson.id);
    const conceptBudget = unitConcepts.length;
    // THE CRITIC (re-review): capped defensively at `lesson.size`, not just
    // trusted from the caller. Today's one real caller (`LessonScreen.tsx`)
    // never asks for more due items than a review has slots
    // (`dueBudget('review', size) === size`), so this never fires — but
    // without it, a caller that ever did would set `refCap` to `due.length`
    // above `lesson.size`, and the trailing `exercises.slice(0, lesson.size)`
    // far below (review isn't in the `composed` exemption) would silently
    // truncate real due items off the end — the exact class of bug this
    // whole block exists to close, just via oversized input instead of a
    // saturated queue.
    const due = reviewRefs.filter(resolvable).slice(0, lesson.size);
    const refCap = Math.max(due.length, lesson.size - conceptBudget);
    const seenIds = new Set(due.map(key));
    const filler = fallbackReviewRefs(refCap, teachesScript, lesson.id, known, visit, reviewIndex)
      .filter((r) => !seenIds.has(key(r)))
      .filter(resolvable);
    const refs = [...due, ...filler];

    /**
     * Letters can run out where words never do.
     *
     * `fallbackReviewRefs` reserves a letter share of its slots (see
     * `reviewLetterShare`), and early in the course that share can be thinner
     * than it looks: `l-1-2` ("Position practice") deliberately re-teaches
     * `l-1`'s six letters in their joining forms rather than introducing new
     * ones, so the earliest review's entire letter pool really is those same
     * six. A due queue that already contains most of them leaves almost
     * nothing left to draw for the fallback split, and unlike a letter, a word
     * is never in short supply — the course has taught 54 of them by the same
     * point. Measured directly: five real due letters at this position
     * produced 18 of 22 exercises even after the filter-before-cap fix above,
     * because the shortfall was never in what got capped, it was in what
     * existed to fill the gap.
     *
     * So the remainder is topped up from words alone, which is always possible
     * this early and is the same "more topping up, not less" principle the due
     * queue itself is built on.
     */
    if (refs.length < refCap) {
      const have = new Set(refs.map(key));
      const more = fallbackReviewRefs(refCap * 2, false, lesson.id, known, visit, reviewIndex)
        .filter((r) => !have.has(key(r)))
        .filter(resolvable);
      refs.push(...more.slice(0, refCap - refs.length));
    }
    refs.length = Math.min(refs.length, refCap);

    // Counts words only, separately from `i` (which also counts letters).
    // THE CRITIC, URD-018: the turn used to be `i % 4` directly, and
    // `fallbackReviewRefs`'s interleave alternates letter/word 1:1 whenever
    // both are present — a step of 2 through `refs`. Stepping by 2 through a
    // mod-4 space only ever visits 2 of the 4 residues (this file already
    // knows this hazard elsewhere — see `posOffset`'s "a step size coprime
    // with POSITIONS.length" comment above — but the review ladder wasn't
    // checked against it). Reproduced live: a review with due letters
    // interleaved 1:1 with due words locked every word into alternating
    // between only two of the four turns, never reaching the other two —
    // one measured case (10 due letters, 6 due words) produced zero
    // `wordFromMeaning` and zero `meaningPick` in a 16-exercise review, a
    // complete reversion to pre-fix behaviour. A dedicated counter that
    // increments once per word, independent of how letters are interleaved
    // around them, has no step-size/modulus relationship to break.
    /**
     * URD-041: `letterExerciseAt(l, i, i)` alone ties a review's letter kind
     * to `i`, the item's raw position within `refs` — and `fallbackReviewRefs`'s
     * own interleave always places its first letter at index 0 of the mixed
     * array (letter before word at every step). Once URD-017 shrank the
     * typical review letter count to ~1 (true from about u14 on), that one
     * slot lands at `i=0` every time, and `letterExerciseAt`'s `t === 0`
     * branch is `letterTrace` whenever a glyph mask exists — true for every
     * glyph sampled. Measured directly: u14 through u39, 26 straight
     * reviews with nothing due, all drew `letterTrace` and only
     * `letterTrace` for their one letter question — never `letterForm`, the
     * joining-position drill the app is specifically built around.
     *
     * `reviewIndex` (computed once, above) combined with `visit` (URD-039's
     * per-completion counter) so the kind varies both across different real
     * reviews *and* across repeat visits to the identical one, rather than
     * collapsing to whatever a fixed loop index happens to produce.
     */
    const letterTurnOffset = reviewIndex + visit;
    const letterPosOffset = letterTurnOffset * 3; // coprime step, same technique as posOffset above

    let wordTurn = 0;
    refs.forEach((ref, i) => {
      if (ref.type === 'letter') {
        const l = teachesScript ? getLetter(ref.id) : undefined;
        if (l) exercises.push(letterExerciseAt(l, i + letterTurnOffset, i + letterPosOffset));
      } else {
        const w = getAnyWord(ref.id);
        // Review is where the harder demands belong: a word is only here
        // because it was met before, so asking to recognise it again teaches
        // little. Most reviews retrieve; every third one asks for it typed —
        // recall and produce keep the same 1-in-3 shares they always had.
        //
        // By position, not by a coin flip. `Math.random() < 0.35` said the
        // same thing in an earlier comment and did something else: it made a
        // review lesson a different lesson each time it was opened, and made
        // every measurement over review lessons differ run to run.
        //
        // The middle third — recognising the word met before, not recalling
        // or producing it — used to go one way every time: `listenTap`,
        // hearing the word rather than reading it, the one modality a review
        // of things already read did not otherwise use. That still left
        // every review turn going the same direction overall: shown English
        // (or heard audio), produce or pick the Urdu form. Measured across
        // all 39 reviews, 1,856 exercises: `meaningPick` — read the Urdu, say
        // what it means — appeared 16 times, 0.86%, only ever as
        // `produceExercise`'s own fallback for the 82 words neither typeable
        // nor buildable. Review is the lesson meant to consolidate what has
        // been read, and it never actually asked a learner to read something
        // and say what it means (URD-018).
        //
        // CURRICULUM CRITIC: a first fix added a flat fourth turn instead,
        // funding it by cutting recall *and* produce — this file's own
        // comment two lines up calls those "the harder demands [that] belong"
        // in review — by a quarter each, nearly doubling review's share of
        // first-teaching-tier ("meet") demand from ~34.5% to ~52%. Splitting
        // the *existing* middle third between `listenTap` and `meaningPick`
        // instead — six turns, not four — leaves recall and produce exactly
        // where they were (1 in 3 each) and gives the read direction a real,
        // non-trivial share (about 1 in 6) without diluting the demands this
        // file already says a review should keep hard.
        const turn = wordTurn % 6;
        wordTurn++;
        if (w && (turn === 2 || turn === 5)) exercises.push(produceExercise(w, poolFor(w), track, teachesScript, i));
        else if (w && turn === 4) exercises.push(wordExercise(w, poolFor(w), track, 'meet', 1));
        else if (w && turn === 1)
          // THE CRITIC, reviewing URD-050: `turn === 1` forces variant 2
          // (`listenTap`) unconditionally, and a due review item can be a
          // previously-graded sentence just as easily as a real word
          // (`itemsOf` tags a sentence answered via meaningPick/
          // wordFromMeaning/listenTap the same `{type: 'word'}` way, and
          // `dueQueue` surfaces it back untouched). Before URD-050,
          // `distractorsFor`'s `distinctCue` pass on a sentence answer's
          // pool (`SENTENCE_WORDS`) always failed — every sentence shared
          // one emoji — so it fell through to `consider(WORDS)` and filled
          // `listenTap`'s options with real, visually-distinct vocabulary.
          // URD-050 gave sentences a cue unique per id specifically so
          // `meaningPick`/`wordFromMeaning` could draw same-concept
          // *sentence* distractors instead of that fallback — but the same
          // `distractorsFor` call backs this `listenTap` branch too, and
          // once sentences satisfy `distinctCue` against each other
          // directly, the widen-to-`WORDS` fallback never triggers here
          // either: `listenTap` then renders four *other sentences*,
          // every one showing the identical literal '📝' `WordArt` icon
          // (that icon reads `word.emoji` directly, never `cueOf` — see
          // that function's own comment in `data/art.ts`), silently
          // defeating `check-answerable.js`'s own `distinct(options.map
          // (cueOf))` guard against exactly this. Measured directly before
          // this fix: 2,028 of 122,304 sampled review exercises were a
          // sentence-answered `listenTap`, all 2,028 with all 4 options
          // sentences. `sentenceReinforceClimb`'s own `meet` turn already
          // never uses variant 2 for a sentence for this reason — this is
          // the one other call site that could still reach it, since a
          // review's due queue mixes words and sentences the same way.
          exercises.push(wordExercise(w, poolFor(w), track, 'meet', w.topic === 'sentences' ? 1 : 2));
        else if (w) exercises.push(wordExercise(w, poolFor(w), track, 'recall'));
      }
    });

    /**
     * URD-040: one exercise per grammar concept this review's own unit
     * taught (see `unitConcepts` above) — the fix itself, not just budget
     * for it.
     *
     * CURRICULUM CRITIC: a first version always asked for `c.drills[0]`
     * (falling back through the rest only if it failed to render) — every
     * replay of the same review showing the identical prompt, blank and
     * correct answer, forever. Exactly the staleness URD-039 (the item just
     * before this one, chained onto the same `visit` counter) exists to
     * kill for the word/letter side; a concept with more than one drill
     * (`g-to-be` has 3) would let a learner stop reasoning about the
     * concept and start recalling "the answer to this exact screen is
     * ہوں". Rotating the start point by `visit` — still falling back
     * through the rest of `c.drills` in rotated order, since a concept can
     * have a drill that only renders on some tracks (`grammarDrillExercise`
     * returns `undefined` on Roman for a drill whose options don't fully
     * transliterate, URD-035) — cycles through every real drill across
     * replays instead of pinning one forever, the same fix in spirit as
     * `prioritizedPool`'s per-visit seed.
     */
    // THE CRITIC (BLOCKING): `refCap` above can equal `due.length` rather
    // than `lesson.size - conceptBudget` whenever the due queue alone
    // already fills the review, which leaves no guaranteed room here.
    // `conceptRoom` — not `unitConcepts.length` — is what actually gets
    // spent, so a fully-saturated due queue skips the concept exercise(s)
    // that don't fit rather than pushing `exercises` past `lesson.size`,
    // where the trailing `exercises.slice(0, lesson.size)` two functions
    // down would cut them off the end anyway, or (worse) forcing them in
    // by shrinking `refs` and dropping a real due item after all.
    const conceptRoom = Math.max(0, lesson.size - exercises.length);
    for (const conceptId of unitConcepts.slice(0, conceptRoom)) {
      const c = getGrammar(conceptId);
      if (!c) continue;
      const start = c.drills.length ? visit % c.drills.length : 0;
      const rotated = [...c.drills.slice(start), ...c.drills.slice(0, start)];
      const ex = rotated.map((d) => grammarDrillExercise(c, d, track)).find((e): e is Exercise => !!e);
      if (ex) exercises.push(ex);
    }
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
  //
  // Phrases joins for the identical reason to sentences (URD-A02): `size`
  // means *phrases drawn*, not exercises, since the meet-recall-produce
  // climb this branch now runs (mirroring vocab's own) meets each one three
  // times. Missing this exemption when that climb first shipped silently
  // truncated every phrases lesson back down to `size` exercises — caught
  // live, not in review: a 12-phrase, 36-exercise lesson measured at
  // exactly 12 exercises and 6 distinct phrases the first time this was
  // run, the exact shape of the two bugs this comment already names above.
  const composed =
    lesson.kind === 'vocab' || lesson.kind === 'sentences' || lesson.kind === 'grammar' || lesson.kind === 'phrases';
  return composed ? exercises : exercises.slice(0, lesson.size);
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
 * It was then drawn from `taughtUpTo`, which fixed *that* but not the scope:
 * `taughtUpTo` is everything the course has taught by this point, course-wide
 * — not the unit this review actually closes. URD-016 measured that gap
 * directly: a review drew 0-5% of its words from its own unit, because the
 * unit's own dozen-or-so words were a rounding error against the hundreds
 * taught before it. `reviewWordPool`/`reviewLetterPool` (`lib/review.ts`)
 * prefer the closing unit's own material first, falling back to the wider
 * course only for whatever the unit itself cannot supply — which genuinely
 * happens: `rev-your-first-readings` closes a unit of reading, sentence and
 * dialogue lessons with no vocabulary of its own.
 *
 * `known` — `Object.keys(srs)` from the progress store, every id the learner
 * has actually been graded on, in any lesson, in any order — still prefers
 * graded material within whichever pool (unit or course) is being drawn from,
 * for the reason it always did: a review reached before spaced repetition has
 * scheduled anything (most early reviews) would otherwise pull any of a
 * topic's words, including ones this specific lesson never happened to pick.
 *
 * The letter/word split used to be `Math.ceil(n / 2)` / `Math.floor(n / 2)`,
 * unconditionally — the same near-50/50 ratio at a review right after the
 * alphabet finished and one thirty units later, even though no unit past u9
 * teaches a letter at all. `reviewLetterShare` (`lib/review.ts`) ties the
 * split to how much of the course-wide pool is actually letters at this
 * point instead, so it decays toward zero on its own as the course moves on.
 */
function fallbackReviewRefs(
  n: number,
  withLetters = true,
  lessonId?: string,
  known: ReadonlySet<string> = new Set(),
  /** URD-039: see `reviewWordPool`'s `visit` parameter. */
  visit = 0,
  /** URD-042: see `reviewLetterPool`'s `reviewIndex` parameter. */
  reviewIndex = 0
): ItemRef[] {
  const taught = lessonId ? taughtUpTo(lessonId) : null;
  // No lesson context (practice review, say) falls back to the foundational
  // material, which is the old behaviour and correct there — practice review
  // is not positioned anywhere on the path.
  //
  // Both course-wide arrays are always passed to both pools, `withLetters`
  // notwithstanding: the word pool's own "has anything been graded" decision
  // has to see the letter side too, or a learner known on words alone but
  // zero letters gets an unrestricted, never-taught-material letter pool the
  // moment `withLetters` is true again (see `reviewLetterPool`'s comment).
  const courseWords = taught?.words ?? [];
  const courseLetters = taught?.letters ?? [];
  const wordPool = reviewWordPool(
    lessonId,
    known,
    courseWords,
    courseLetters,
    WORDS.slice(0, 120).map((w) => w.id),
    visit
  );

  if (!withLetters) {
    return wordPool.slice(0, n).map((id) => ({ id, type: 'word' as const }));
  }
  const letterPool = reviewLetterPool(
    lessonId,
    known,
    courseWords,
    courseLetters,
    LETTERS.slice(0, 20).map((l) => l.id),
    visit,
    reviewIndex
  );
  // THE CRITIC, URD-017: a lesson id `taughtUpTo` cannot place on the path —
  // `practice-review`, the synthetic Daily Review screen, is the one that
  // matters — never satisfies its `break`, so `courseWords`/`courseLetters`
  // above are silently the *entire* course rather than "what this learner
  // has reached". Feeding those straight to `reviewLetterShare` pinned the
  // letter share at its end-of-course value (≈2%) from the very first time
  // a learner ever opened the screen, deep in the alphabet or not.
  // Reproduced live: a learner who had just finished the first letters
  // lesson and first vocab lesson still got 0 of 10 letter exercises on
  // Daily Review — identical to one who had finished the whole course.
  //
  // For a lesson actually placed on the path, course position is the right
  // measure. For one that is not, the learner's own graded progress is —
  // restricting both arrays to `known` asks "of everything reachable, how
  // much has this learner actually seen so far", the same question
  // `anythingKnown` already asks for pool selection. Nothing graded yet at
  // all (day one, before any grading) leaves both arrays empty, which
  // `reviewLetterShare` already treats as its 0.5 case — matching the old
  // fixed split for exactly the population it protected.
  // THE CRITIC, URD-017: a lesson id `taughtUpTo` cannot place on the path —
  // `practice-review`, the synthetic Daily Review screen, is the one that
  // matters — never satisfies its `break`, so `courseWords`/`courseLetters`
  // above are silently the *entire* course rather than "what this learner
  // has reached". Feeding those straight to `reviewLetterShare` pinned the
  // letter share at its end-of-course value (≈2%) from the very first time
  // a learner ever opened the screen, deep in the alphabet or not.
  // Reproduced live: a learner who had just finished the first letters
  // lesson and first vocab lesson still got 0 of 10 letter exercises on
  // Daily Review — identical to one who had finished the whole course.
  //
  // For a lesson actually placed on the path, course position is the right
  // measure. For one that is not, the learner's own graded progress is —
  // restricting both arrays to `known` asks "of everything reachable, how
  // much has this learner actually seen so far", the same question
  // `anythingKnown` already asks for pool selection. Nothing graded yet at
  // all (day one, before any grading) leaves both arrays empty, which
  // `reviewLetterShare` already treats as its 0.5 case — matching the old
  // fixed split for exactly the population it protected.
  const onPath = !!lessonId && taughtInUnit(lessonId) !== null;
  const letterShare = onPath
    ? reviewLetterShare(courseWords, courseLetters)
    : reviewLetterShare(
        courseWords.filter((id) => known.has(id)),
        courseLetters.filter((id) => known.has(id))
      );
  // CURRICULUM CRITIC, URD-017: `Math.round` alone stays >= 1 today only
  // because every real review is large enough (`coverTopics` floors review
  // size at 22) — a coincidence of current content sizes, not a guarantee.
  // At the lowest measured share (1.98%, rev-the-wider-world) a review as
  // small as 22 already rounds to 0. Floor it at 1 whenever this context
  // has any letters to ask about at all, so "near zero" never silently
  // becomes "none, if content changes under it".
  // CURRICULUM CRITIC, URD-017: `Math.round` alone stays >= 1 today only
  // because every real review is large enough (`coverTopics` floors review
  // size at 22) — a coincidence of current content sizes, not a guarantee.
  // At the lowest measured share (1.98%, rev-the-wider-world) a review as
  // small as 22 already rounds to 0. Floor it at 1 whenever this context
  // has any letters to ask about at all, so "near zero" never silently
  // becomes "none, if content changes under it".
  const letterCount = courseLetters.length > 0 ? Math.max(1, Math.round(n * letterShare)) : 0;
  const wordCount = n - letterCount;
  const letters: ItemRef[] = letterPool.slice(0, letterCount).map((id) => ({ id, type: 'letter' as const }));
  const words: ItemRef[] = wordPool.slice(0, wordCount).map((id) => ({ id, type: 'word' as const }));
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
    case 'letterSpot':
    case 'letterContrast':
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
