import { LETTERS, getLetter, Letter, PositionKey, POSITIONS } from '../data/letters';
import { WORDS, getWord, wordsByTopic, glossOf, Word, PHRASES } from '../data/words';
import { Lesson, ALL_LESSONS } from '../data/units';
import { getGrammar, type GrammarConcept, type GrammarDrill } from '../data/grammar';
import { romanAll } from '../lib/translit';
import type { LearnTrack } from '../store/useSettingsStore';
import { SENTENCES, PASSAGES, DIALOGUES, getPassage, getDialogue, type Sentence } from '../data/sentences';
import { cueOf } from '../data/art';
import { GLYPH_MASKS } from '../data/glyphMasks';
import { Exercise, ItemRef } from './types';

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function sample<T>(pool: T[], n: number, exclude: (t: T) => boolean): T[] {
  return shuffle(pool.filter((t) => !exclude(t))).slice(0, n);
}

/** Phrases reshaped as word-like items so they flow through the same exercises. */
const PHRASE_WORDS: Word[] = PHRASES.map((p) => ({
  id: p.id,
  urdu: p.urdu,
  roman: p.roman,
  meaning: p.meaning,
  emoji: '💬', // audit:emoji-ok — phrases have no picture of their own
  topic: 'phrases',
}));

const getAnyWord = (id: string): Word | undefined => getWord(id) ?? PHRASE_WORDS.find((w) => w.id === id);

/** Distractors for a review item. Phrases are not in WORDS, so `wordsByTopic`
 *  returns nothing for them and they would be offered against random nouns. */
const poolFor = (w: Word): Word[] => (w.topic === 'phrases' ? PHRASE_WORDS : wordsByTopic(w.topic));

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
  const distractors = sample(LETTERS, 3, (l) => l.id === letter.id);
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
function distractorsFor(word: Word, pool: Word[], { distinctCue = false, distinctMeaning = false } = {}): Word[] {
  const chosen: Word[] = [];
  const usedCues = new Set<string>([cueOf(word)]);
  const usedMeanings = new Set<string>([word.meaning.toLowerCase()]);
  const consider = (candidates: Word[]) => {
    for (const c of shuffle(candidates)) {
      if (chosen.length >= 3) return;
      if (c.id === word.id || chosen.some((x) => x.id === c.id)) continue;
      if (distinctCue) {
        const cue = cueOf(c);
        if (usedCues.has(cue)) continue;
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
  if (chosen.length < 3) consider(WORDS); // widen if the topic is too uniform
  return chosen;
}

/**
 * How much the learner has to supply themselves.
 *
 *  meet     — recognise it: four choices, with a picture or the word in front
 *             of them. Right for a word they are seeing for the first time.
 *  recall   — retrieve it: given only the English, choose the Urdu.
 *  produce  — write it: given only the English, type it with nothing to pick
 *             from. Reserved for words already met, or review.
 */
type Demand = 'meet' | 'recall' | 'produce';

/** Typing a five-word honorific phrase is a spelling test, not a memory test. */
const isTypeable = (w: Word) => w.roman.replace(/[^a-z]/gi, '').length <= 12;

function wordExercise(word: Word, pool: Word[], demand: Demand = 'meet', variant?: number): Exercise {
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
  if (pictureOptions.length < 3 && v !== 1) v = 1;

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

// ---- lesson composition --------------------------------------------------

export function buildLessonExercises(
  lesson: Lesson,
  reviewRefs: ItemRef[] = [],
  track: LearnTrack = 'both'
): Exercise[] {
  const exercises: Exercise[] = [];
  // On the Roman track the learner has said they are not learning the
  // alphabet. Letter lessons are already off their path, but review can still
  // surface a letter that was practised before the switch, and a vocabulary
  // lesson would otherwise close on a spell-it-in-Nastaliq exercise.
  const teachesScript = track !== 'roman';

  if (lesson.kind === 'letters' && lesson.letterIds && teachesScript) {
    const letters = lesson.letterIds.map(getLetter).filter(Boolean) as Letter[];
    for (const l of letters) exercises.push(letterExercise(l));
    // one word that features these letters, for context
    const contextWords = letters
      .map((l) => WORDS.find((w) => w.roman.toLowerCase().includes(l.sound[0])))
      .filter(Boolean) as Word[];
    if (contextWords[0]) exercises.push(wordExercise(contextWords[0], WORDS, 'meet', 0));
  }

  if (lesson.kind === 'phrases') {
    // Phrases share one icon, so picture/listen cues don't work — always show
    // the phrase and pick its meaning.
    const picks = shuffle(PHRASE_WORDS).slice(0, lesson.size);
    for (const w of picks) exercises.push(wordExercise(w, PHRASE_WORDS, 'meet', 1));
  } else if (lesson.kind === 'vocab' && lesson.topic) {
    /**
     * A vocabulary lesson climbs: meet each word with a picture, come back to
     * two of them from the English side, type one from memory, build one letter
     * by letter, then close on a matching board. Every word is seen at least
     * twice, and the second sighting always asks for more than the first.
     */
    const pool = wordsByTopic(lesson.topic);
    // Budget the lesson exactly: the four closing exercises and any woven-in
    // review both take slots, and a truncated lesson would lose the hardest
    // items — which are the ones at the end.
    const woven = Math.min(2, reviewRefs.length);
    const newWords = Math.max(3, lesson.size - 4 - woven);
    const picks = shuffle(pool).slice(0, newWords);
    picks.forEach((w, i) => exercises.push(wordExercise(w, pool, 'meet', i % 3)));

    for (const w of shuffle(picks).slice(0, 2)) {
      exercises.push(wordExercise(w, pool, 'recall'));
    }

    // Typing sits in the middle, not at the end: it is the hardest thing the
    // lesson asks for, and finishing on it makes a session feel like an exam.
    const typeable = picks.filter(isTypeable);
    if (typeable[0]) exercises.push({ kind: 'typeWord', word: rand(typeable) });

    // Building a word from letter tiles is a spelling exercise in Nastaliq, so
    // it belongs only to a learner who is reading it. The Roman track gets
    // another retrieval instead, rather than one exercise fewer.
    const buildable = picks.filter((w) => Array.from(w.urdu).length <= 5);
    if (buildable[0] && teachesScript) {
      exercises.push({ kind: 'wordBuild', word: buildable[0], tiles: buildTilesFor(buildable[0]) });
    } else if (buildable[0]) {
      exercises.push(wordExercise(buildable[0], pool, 'recall'));
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
    for (const w of [...picks, ...shuffle(pool)]) {
      if (board.length === 4) break;
      if (board.some((b) => b.id === w.id)) continue;
      const cue = cueOf(w);
      const gloss = glossOf(w).toLowerCase();
      if (boardCues.has(cue) || boardGlosses.has(gloss)) continue;
      boardCues.add(cue);
      boardGlosses.add(gloss);
      board.push(w);
    }
    if (board.length === 4) exercises.push({ kind: 'matching', words: board });
  }

  if (lesson.kind === 'grammar' && lesson.conceptId) {
    const c = getGrammar(lesson.conceptId);
    if (c) {
      // teach first, then drill it, then reinforce with matching sentences
      exercises.push({ kind: 'grammarTeach', concept: c });
      for (const d of c.drills) {
        const ex = grammarDrillExercise(c, d, track);
        if (ex) exercises.push(ex);
      }
      const related = SENTENCES.filter((x) => x.concept === c.id);
      for (const sen of shuffle(related).slice(0, 2)) {
        const ex = sentenceExercise(sen, track);
        if (ex) exercises.push(ex);
      }
    }
  }

  if (lesson.kind === 'sentences') {
    const pool = lesson.level ? SENTENCES.filter((x) => x.level === lesson.level) : SENTENCES;
    for (const sen of shuffle(pool.length ? pool : SENTENCES).slice(0, lesson.size)) {
      const ex = sentenceExercise(sen, track);
      if (ex) exercises.push(ex);
    }
  }

  if (lesson.kind === 'dialogue') {
    const d = lesson.dialogueId ? getDialogue(lesson.dialogueId) : undefined;
    const chosen = d ?? shuffle(DIALOGUES)[0];
    if (chosen) exercises.push({ kind: 'dialogue', dialogue: chosen });
  }

  if (lesson.kind === 'reading') {
    const p = lesson.passageId ? getPassage(lesson.passageId) : undefined;
    const chosen = p ?? shuffle(PASSAGES)[0];
    if (chosen) exercises.push({ kind: 'reading', passage: chosen });
  }

  if (lesson.kind === 'review') {
    const refs = reviewRefs.length ? reviewRefs : fallbackReviewRefs(lesson.size, teachesScript, lesson.id);
    for (const ref of refs.slice(0, lesson.size)) {
      if (ref.type === 'letter') {
        const l = teachesScript ? getLetter(ref.id) : undefined;
        if (l) exercises.push(letterExercise(l));
      } else {
        const w = getAnyWord(ref.id);
        // Review is where the harder demands belong: a word is only here
        // because it was met before, so asking to recognise it again teaches
        // little. Most reviews retrieve; every third one asks for it typed.
        if (w) exercises.push(wordExercise(w, poolFor(w), Math.random() < 0.35 ? 'produce' : 'recall'));
      }
    }
  }

  // Weave up to two due review items in near the front of a normal lesson.
  if (lesson.kind !== 'review' && reviewRefs.length) {
    const woven: Exercise[] = [];
    for (const ref of reviewRefs.slice(0, 2)) {
      if (ref.type === 'letter') {
        const l = teachesScript ? getLetter(ref.id) : undefined;
        if (l) woven.push(letterExercise(l));
      } else {
        const w = getAnyWord(ref.id);
        if (w) woven.push(wordExercise(w, poolFor(w), 'recall'));
      }
    }
    exercises.splice(1, 0, ...woven);
  }

  // A vocabulary lesson is composed to an exact shape — meet, recall, type,
  // build, match — so trimming it to `size` would cut the closing run, which is
  // the hardest and most valuable part. Every other kind is a flat list where
  // trimming is the right way to hit the intended length.
  return lesson.kind === 'vocab' ? exercises : exercises.slice(0, lesson.size);
}

/**
 * What the path has actually taught by the time a given lesson is reached.
 *
 * Walks the real lesson order and collects the letters and topics introduced
 * strictly before this lesson, plus this lesson's own unit-mates, so a review
 * can only ever ask about material the learner has already been shown.
 */
function taughtUpTo(lessonId: string): { letters: string[]; words: string[] } {
  const letters: string[] = [];
  const words: string[] = [];
  for (const l of ALL_LESSONS) {
    if (l.kind === 'letters' && l.letterIds) letters.push(...l.letterIds);
    if (l.kind === 'vocab' && l.topic) words.push(...wordsByTopic(l.topic).map((w) => w.id));
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
 * It is now drawn strictly from what the path has taught up to this lesson.
 */
function fallbackReviewRefs(n: number, withLetters = true, lessonId?: string): ItemRef[] {
  const taught = lessonId ? taughtUpTo(lessonId) : null;
  // No lesson context (practice review, say) falls back to the foundational
  // material, which is the old behaviour and correct there — practice review is
  // not positioned anywhere on the path.
  const wordPool = taught && taught.words.length ? taught.words : WORDS.slice(0, 120).map((w) => w.id);
  const letterPool = taught && taught.letters.length ? taught.letters : LETTERS.slice(0, 20).map((l) => l.id);

  if (!withLetters) {
    return shuffle(wordPool)
      .slice(0, n)
      .map((id) => ({ id, type: 'word' }));
  }
  const letters: ItemRef[] = shuffle(letterPool)
    .slice(0, Math.ceil(n / 2))
    .map((id) => ({ id, type: 'letter' }));
  const words: ItemRef[] = shuffle(wordPool)
    .slice(0, Math.floor(n / 2))
    .map((id) => ({ id, type: 'word' }));
  return shuffle([...letters, ...words]);
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
