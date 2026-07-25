import { LETTERS, getLetter, Letter, PositionKey, POSITIONS } from '../data/letters';
import { WORDS, getWord, wordsByTopic, Word, PHRASES } from '../data/words';
import { Lesson } from '../data/units';
import { getGrammar } from '../data/grammar';
import { SENTENCES, PASSAGES, DIALOGUES, getPassage, getDialogue, type Sentence } from '../data/sentences';
import { WORD_ICON, NUMERALS, COLOURS } from '../components/Illustration';
import { GLYPH_MASKS } from '../data/glyphMasks';
import { Exercise, ItemRef } from './types';

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function sample<T>(pool: T[], n: number, exclude: (t: T) => boolean): T[] {
  return shuffle(pool.filter((t) => !exclude(t))).slice(0, n);
}

/** Phrases reshaped as word-like items so they flow through the same exercises. */
const PHRASE_WORDS: Word[] = PHRASES.map((p) => ({
  id: p.id,
  urdu: p.urdu,
  roman: p.roman,
  meaning: p.meaning,
  emoji: '💬',
  topic: 'phrases',
}));

const getAnyWord = (id: string): Word | undefined =>
  getWord(id) ?? PHRASE_WORDS.find((w) => w.id === id);

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
function distractorsFor(
  word: Word,
  pool: Word[],
  { distinctCue = false, distinctMeaning = false } = {}
): Word[] {
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
  consider(pool);            // prefer same-topic distractors
  if (chosen.length < 3) consider(WORDS); // widen if the topic is too uniform
  return chosen;
}

/** The visual cue a word shows: illustration, numeral, swatch, or its emoji. */
function cueOf(w: Word): string {
  if (NUMERALS[w.id]) return `num:${NUMERALS[w.id]}`;
  if (COLOURS[w.id]) return `col:${COLOURS[w.id].color}`;
  if (WORD_ICON[w.id]) return `ico:${WORD_ICON[w.id]}`;
  return `emo:${w.emoji}`;
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
  const pictureOptions = distractorsFor(word, pool, { distinctCue: true });
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

// ---- lesson composition --------------------------------------------------

export function buildLessonExercises(lesson: Lesson, reviewRefs: ItemRef[] = []): Exercise[] {
  const exercises: Exercise[] = [];

  if (lesson.kind === 'letters' && lesson.letterIds) {
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

    const buildable = picks.filter((w) => Array.from(w.urdu).length <= 5);
    if (buildable[0]) {
      exercises.push({ kind: 'wordBuild', word: buildable[0], tiles: buildTilesFor(buildable[0]) });
    }

    // Close with a matching board (Drops-style); its four pictures must differ.
    // Short lessons introduce fewer than four words, so the board is topped up
    // from the rest of the topic rather than dropped.
    const board: Word[] = [];
    const boardCues = new Set<string>();
    for (const w of [...picks, ...shuffle(pool)]) {
      if (board.length === 4) break;
      if (board.some((b) => b.id === w.id)) continue;
      const cue = cueOf(w);
      if (boardCues.has(cue)) continue;
      boardCues.add(cue);
      board.push(w);
    }
    if (board.length === 4) exercises.push({ kind: 'matching', words: board });
  }

  if (lesson.kind === 'grammar' && lesson.conceptId) {
    const c = getGrammar(lesson.conceptId);
    if (c) {
      // teach first, then drill it, then reinforce with matching sentences
      exercises.push({ kind: 'grammarTeach', concept: c });
      for (const d of c.drills) exercises.push({ kind: 'grammarDrill', concept: c, drill: d });
      const related = SENTENCES.filter((x) => x.concept === c.id);
      for (const sen of shuffle(related).slice(0, 2)) {
        exercises.push({ kind: 'sentenceBuild', sentence: sen, tiles: sentenceTilesFor(sen) });
      }
    }
  }

  if (lesson.kind === 'sentences') {
    const pool = lesson.level ? SENTENCES.filter((x) => x.level === lesson.level) : SENTENCES;
    for (const sen of shuffle(pool.length ? pool : SENTENCES).slice(0, lesson.size)) {
      exercises.push({ kind: 'sentenceBuild', sentence: sen, tiles: sentenceTilesFor(sen) });
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
    const refs = reviewRefs.length ? reviewRefs : fallbackReviewRefs(lesson.size);
    for (const ref of refs.slice(0, lesson.size)) {
      if (ref.type === 'letter') {
        const l = getLetter(ref.id);
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
        const l = getLetter(ref.id);
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

/** When nothing is due yet, review draws from the base content so the lesson still runs. */
function fallbackReviewRefs(n: number): ItemRef[] {
  // Drawn from the early, foundational material rather than the whole 2,000 —
  // a learner with nothing due yet has not met the advanced vocabulary — but
  // sampled, so a second empty review is not the same lesson again.
  const letters: ItemRef[] = shuffle(LETTERS.slice(0, 20)).slice(0, Math.ceil(n / 2))
    .map((l) => ({ id: l.id, type: 'letter' }));
  const words: ItemRef[] = shuffle(WORDS.slice(0, 120)).slice(0, Math.floor(n / 2))
    .map((w) => ({ id: w.id, type: 'word' }));
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
