import { LETTERS, getLetter, Letter, PositionKey, POSITIONS } from '../data/letters';
import { WORDS, getWord, wordsByTopic, Word, PHRASES } from '../data/words';
import { Lesson } from '../data/units';
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

// ---- per-item exercise builders -----------------------------------------

function letterExercise(letter: Letter): Exercise {
  // Alternate between "name the position of this glyph" and "pick the glyph".
  if (Math.random() < 0.6) {
    const position = rand(POSITIONS.map((p) => p.key)) as PositionKey;
    return {
      kind: 'letterForm',
      letter,
      position,
      options: POSITIONS.map((p) => p.key),
    };
  }
  const distractors = sample(LETTERS, 3, (l) => l.id === letter.id);
  return {
    kind: 'letterPick',
    letter,
    options: shuffle([letter, ...distractors]),
  };
}

function wordExercise(word: Word, pool: Word[], variant?: number): Exercise {
  const v = variant ?? Math.floor(Math.random() * 3);
  const distractors = () => {
    const same = sample(pool, 3, (w) => w.id === word.id);
    if (same.length >= 3) return same;
    const fill = sample(WORDS, 3 - same.length, (w) => w.id === word.id || same.some((s) => s.id === w.id));
    return [...same, ...fill];
  };
  if (v === 0) {
    return { kind: 'multipleChoice', word, options: shuffle([word, ...distractors()]) };
  }
  if (v === 1) {
    return { kind: 'meaningPick', word, options: shuffle([word, ...distractors()]) };
  }
  return { kind: 'listenTap', word, options: shuffle([word, ...distractors()]) };
}

function buildTilesFor(word: Word): string[] {
  // Split into visual character units (grapheme-ish). Urdu combining marks are
  // rare in this vocab, so a code-point split is fine and keeps tiles legible.
  const chars = Array.from(word.urdu).filter((c) => c.trim().length > 0);
  return shuffle(chars);
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
    if (contextWords[0]) exercises.push(wordExercise(contextWords[0], WORDS, 0));
  }

  if ((lesson.kind === 'vocab' && lesson.topic) || lesson.kind === 'phrases') {
    const pool = lesson.kind === 'phrases' ? PHRASE_WORDS : wordsByTopic(lesson.topic!);
    const picks = shuffle(pool).slice(0, Math.max(4, lesson.size - 1));
    picks.forEach((w, i) => exercises.push(wordExercise(w, pool, i % 3)));
    // a couple of word-build tiles for kinesthetic reinforcement
    const buildable = picks.filter((w) => Array.from(w.urdu).length <= 5).slice(0, 2);
    for (const w of buildable) exercises.push({ kind: 'wordBuild', word: w, tiles: buildTilesFor(w) });
    // close with a matching board (Drops-style)
    if (picks.length >= 4) exercises.push({ kind: 'matching', words: picks.slice(0, 4) });
  }

  if (lesson.kind === 'review') {
    const refs = reviewRefs.length ? reviewRefs : fallbackReviewRefs(lesson.size);
    for (const ref of refs.slice(0, lesson.size)) {
      if (ref.type === 'letter') {
        const l = getLetter(ref.id);
        if (l) exercises.push(letterExercise(l));
      } else {
        const w = getAnyWord(ref.id);
        if (w) exercises.push(wordExercise(w, wordsByTopic(w.topic)));
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
        if (w) woven.push(wordExercise(w, wordsByTopic(w.topic)));
      }
    }
    exercises.splice(1, 0, ...woven);
  }

  return exercises.slice(0, lesson.size);
}

/** When nothing is due yet, review draws from the base content so the lesson still runs. */
function fallbackReviewRefs(n: number): ItemRef[] {
  const letters: ItemRef[] = LETTERS.slice(0, Math.ceil(n / 2)).map((l) => ({ id: l.id, type: 'letter' }));
  const words: ItemRef[] = WORDS.slice(0, Math.floor(n / 2)).map((w) => ({ id: w.id, type: 'word' }));
  return shuffle([...letters, ...words]);
}

/** Map an exercise to the item(s) it exercises, for SRS grading. */
export function itemsOf(ex: Exercise): ItemRef[] {
  switch (ex.kind) {
    case 'letterForm':
    case 'letterPick':
      return [{ id: ex.letter.id, type: 'letter' }];
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
      return [{ id: ex.word.id, type: 'word' }];
    case 'matching':
      return ex.words.map((w) => ({ id: w.id, type: 'word' as const }));
  }
}
