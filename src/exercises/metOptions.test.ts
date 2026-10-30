import { describe, expect, it } from 'vitest';
import { buildLessonExercises } from './generator';
import { ALL_LESSONS, UNITS, lessonOrderForTrack } from '../data/units';

/**
 * P-136: a graded word question offers as wrong answers only words the learner
 * has met, whenever at least three have been met. An unseen option can be
 * ruled out without knowing the answer, so the question tests less than it
 * seems to. Pretest questions are exempt: nothing is graded on them.
 */
describe('wrong options in graded word questions are words already met', () => {
  const byId = new Map(ALL_LESSONS.map((l) => [l.id, l]));
  const vocab = new Set(UNITS.slice(0, 3).flatMap((u) => u.lessons.filter((l) => l.kind === 'vocab').map((l) => l.id)));

  for (const track of ['both', 'roman'] as const) {
    it(`on the ${track} track, Units 1 to 3`, () => {
      const prior = new Set<string>();
      let asked = 0;
      for (const id of lessonOrderForTrack(track)) {
        const lesson = byId.get(id);
        if (!lesson) continue;
        if (vocab.has(id)) {
          for (let build = 0; build < 20; build++) {
            const seen = new Set(prior);
            for (const ex of buildLessonExercises(lesson, [], track)) {
              if (ex.kind === 'wordTeach') {
                seen.add(ex.word.id);
                continue;
              }
              if (!('options' in ex) || !('word' in ex) || ('pretest' in ex && ex.pretest)) continue;
              const answer = ex.word.id;
              const metOthers = [...seen].filter((w) => w !== answer).length;
              if (metOthers < 3) continue;
              const unseen = (ex.options as { id: string }[]).filter((o) => o.id !== answer && !seen.has(o.id));
              expect(
                unseen.map((o) => o.id),
                `${id} ${ex.kind} for ${answer}`
              ).toEqual([]);
              asked++;
            }
          }
        }
        for (const w of lesson.wordIds ?? []) prior.add(w);
        if ([...vocab].every((v) => (byId.get(v)?.wordIds ?? []).every((w) => prior.has(w)))) break;
      }
      expect(asked).toBeGreaterThan(1000);
    });
  }
});
