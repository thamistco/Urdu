import { findLesson } from '../data/units';
import type { Word } from '../data/words';
import { readableWords } from '../lib/readingPace';
import { lettersAllTaught } from './generator';

type Progress = {
  learnedWords: readonly string[];
  learnedLetters: readonly string[];
  skippedLessons: Record<string, boolean>;
  completedLessons: Record<string, unknown>;
};

/**
 * Words a learner knows without having practised them here: the words of the
 * word lessons they skipped, as a speaker at onboarding or by passing a unit
 * review (Q-093).
 *
 * A speaker who said they understand Urdu has 50 beginner word lessons marked
 * "Skipped as already known", 501 words, and every count read only the words
 * practised in a lesson, so the app said they knew none: 0 of 21 on each
 * topic, and Read faster "opens once you know 10 words; you know 0". These
 * are known by ear, not by sight, so they get no review card (a card would
 * show script they cannot read yet, and a miss would be graded as a forgotten
 * word when it was reading), and achievements stay on practised words.
 * Worked out from `skippedLessons` when read, so nothing new is stored.
 */
export function wordsKnownByEar(skipped: Record<string, boolean>): Set<string> {
  const ids = new Set<string>();
  for (const [id, on] of Object.entries(skipped)) {
    if (!on) continue;
    const lesson = findLesson(id);
    if (lesson?.kind === 'vocab' || lesson?.kind === 'phrases') lesson.wordIds?.forEach((w) => ids.add(w));
  }
  return ids;
}

/** Practised words and words known by ear together, for counts. */
export function knownWordIds(p: Pick<Progress, 'learnedWords' | 'skippedLessons'>): Set<string> {
  return new Set([...p.learnedWords, ...wordsKnownByEar(p.skippedLessons)]);
}

/** The letters this learner has met: practised, or in a letter lesson done or skipped. */
function lettersMet(p: Progress): Set<string> {
  const met = new Set(p.learnedLetters);
  for (const id of [...Object.keys(p.completedLessons), ...Object.keys(p.skippedLessons)]) {
    const lesson = findLesson(id);
    if (lesson?.kind === 'letters') lesson.letterIds?.forEach((l) => met.add(l));
  }
  return met;
}

/**
 * What Read faster can show: practised words as before, and a word known by
 * ear only once every letter in it has been met, since reading a word you know
 * by ear is the practice this learner came for, and asking it before its
 * letters are taught is testing before teaching. After l-1's six letters a
 * speaker has 3 such words; after Unit 2's lesson, about 22 (learning review,
 * 2026-10-26).
 */
export function readingPool(p: Progress, words: readonly Word[]): Word[] {
  const learned = new Set(p.learnedWords);
  const met = lettersMet(p);
  const byEar = [...wordsKnownByEar(p.skippedLessons)].filter((id) => !learned.has(id));
  const fromEar = new Set(
    readableWords(byEar, words)
      .filter((w) => lettersAllTaught(w, met))
      .map((w) => w.id)
  );
  return readableWords([...learned, ...fromEar], words);
}
