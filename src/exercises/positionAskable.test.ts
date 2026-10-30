import { describe, expect, it } from 'vitest';
import { buildLessonExercises, positionAskable } from './generator';
import { ALL_LESSONS } from '../data/units';
import { LETTERS } from '../data/letters';

/**
 * P-135: "which position?" is never asked of a letter whose asked positions
 * share one shape. Alif madda's were all آ, so the answer was always "Alone or
 * start": a free right answer, scheduled as if recalled.
 */
describe('a position question always asks something', () => {
  it('knows which letters it cannot ask about', () => {
    expect(LETTERS.filter((l) => !positionAskable(l)).map((l) => l.id)).toEqual(['alif-madda']);
  });

  it('never asks it of them, in any letter lesson', () => {
    const letterLessons = ALL_LESSONS.filter((l) => l.kind === 'letters');
    let asked = 0;
    for (const lesson of letterLessons) {
      for (let build = 0; build < 40; build++) {
        for (const ex of buildLessonExercises(lesson, [], 'both')) {
          if (ex.kind !== 'letterForm') continue;
          expect(positionAskable(ex.letter), `${lesson.id}: "which position?" of ${ex.letter.id}`).toBe(true);
          asked++;
        }
      }
    }
    expect(asked).toBeGreaterThan(500);
  });
});
