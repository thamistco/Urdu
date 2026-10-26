import { describe, expect, it } from 'vitest';
import { knownWordIds, readingPool, wordsKnownByEar } from './knownWords';
import { lettersAllTaught } from './generator';
import { UNITS, findLesson, lessonOrderForTrack } from '../data/units';
import { WORDS, wordsByTopic } from '../data/words';

/** What onboarding skips for "I already speak or understand it". */
const SPEAKER_SKIPS = UNITS.filter((u) => u.level === 'beginner')
  .flatMap((u) => u.lessons)
  .filter((l) => l.kind === 'vocab' || l.kind === 'phrases')
  .map((l) => l.id);
const skipped = Object.fromEntries(SPEAKER_SKIPS.map((id) => [id, true]));

/** A speaker on the script track who has finished the letter lessons up to and including `upTo`. */
function speakerThrough(upTo: string | null) {
  const order = lessonOrderForTrack('both');
  const letters = upTo
    ? order.slice(0, order.indexOf(upTo) + 1).filter((id) => findLesson(id)?.kind === 'letters')
    : [];
  return {
    learnedWords: [],
    learnedLetters: [],
    skippedLessons: skipped,
    completedLessons: Object.fromEntries(letters.map((id) => [id, { done: 1 }])),
  };
}

const letterLessons = lessonOrderForTrack('both').filter((id) => findLesson(id)?.kind === 'letters');

describe('Q-093: words a speaker knows by ear', () => {
  it('counts every word of every skipped word lesson as known', () => {
    const byEar = wordsKnownByEar(skipped);
    for (const id of SPEAKER_SKIPS) for (const w of findLesson(id)?.wordIds ?? []) expect(byEar.has(w), w).toBe(true);
    expect(byEar.size).toBeGreaterThan(400);
  });

  it('shows a speaker every word of a beginner topic as known', () => {
    const known = knownWordIds({ learnedWords: [], skippedLessons: skipped });
    const first = findLesson(SPEAKER_SKIPS[0])!;
    const topic = wordsByTopic(first.topic!);
    const lessonsOnTopic = SPEAKER_SKIPS.map(findLesson).filter((l) => l?.topic === first.topic);
    const taughtOnTopic = new Set(lessonsOnTopic.flatMap((l) => l?.wordIds ?? []));
    expect(topic.filter((w) => taughtOnTopic.has(w.id)).every((w) => known.has(w.id))).toBe(true);
  });

  it('knows nothing by ear for a learner who skipped nothing', () => {
    expect(wordsKnownByEar({}).size).toBe(0);
    expect(knownWordIds({ learnedWords: ['w-paani'], skippedLessons: {} })).toEqual(new Set(['w-paani']));
  });

  it('offers Read faster only words whose letters the learner has met', () => {
    for (const upTo of [null, ...letterLessons]) {
      const p = speakerThrough(upTo);
      const met = new Set(Object.keys(p.completedLessons).flatMap((id) => findLesson(id)?.letterIds ?? []));
      for (const w of readingPool(p, WORDS)) expect(lettersAllTaught(w, met), `${upTo}: ${w.urdu}`).toBe(true);
    }
  });

  it('opens Read faster for a speaker after a few letter lessons, not before the first', () => {
    expect(readingPool(speakerThrough(null), WORDS).length).toBe(0);
    const after = letterLessons.map((id) => readingPool(speakerThrough(id), WORDS).length);
    // More letters, more words they can read: 3 after l-1, under a round's
    // worth until l-3 (the fourth letter lesson, 22 words), then nearly all.
    for (let i = 1; i < after.length; i++) expect(after[i]).toBeGreaterThanOrEqual(after[i - 1]);
    expect(after[0]).toBeLessThan(10);
    expect(after[letterLessons.indexOf('l-3')]).toBeGreaterThanOrEqual(10);
  });
});
