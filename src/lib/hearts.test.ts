import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { heartsAreFree, GRACE_ENDS_AFTER } from './hearts';
import { UNITS, ALL_LESSONS } from '../data/units';
import { REFILL_COST, gemsForLesson } from './gamification';

describe('the first unit costs no hearts', () => {
  it('names a lesson that is really in the course', () => {
    // The rule is keyed on a lesson id so that regrouping the course cannot
    // silently move the line. That only helps if a regroup that removes the
    // lesson is loud, which is this.
    expect(ALL_LESSONS.some((l) => l.id === GRACE_ENDS_AFTER)).toBe(true);
    expect(GRACE_ENDS_AFTER).toBe(UNITS[0].lessons[UNITS[0].lessons.length - 1].id);
  });

  it('is free for a learner who has done nothing', () => {
    expect(heartsAreFree({}, {})).toBe(true);
  });

  it('is still free part-way through the first unit', () => {
    const partway = Object.fromEntries(UNITS[0].lessons.slice(0, -1).map((l) => [l.id, { best: 1, done: 1 }]));
    expect(heartsAreFree(partway, {})).toBe(true);
  });

  it('ends once the first unit is finished', () => {
    expect(heartsAreFree({ [GRACE_ENDS_AFTER]: { best: 1, done: 1 } }, {})).toBe(false);
  });

  it('ends for a learner who skipped the first unit at onboarding', () => {
    // A heritage learner who already speaks Urdu never plays these lessons,
    // and is past them in every sense that matters here.
    expect(heartsAreFree({}, { [GRACE_ENDS_AFTER]: true })).toBe(false);
  });

  /**
   * The reason the grace period exists, taken from the economy rather than
   * asserted in prose.
   *
   * The first draft of this test claimed a refill is unreachable for the whole
   * of Unit 1, and the test said otherwise: a flawless learner is past the
   * price after two lessons. The true claim is narrower and is the one that
   * matters — at the moment the wall is actually most likely to arrive, in the
   * alphabet, with almost nothing learned, a learner cannot pay it.
   *
   * 0.39 is not a guess: it is what the project's own playtester scores over
   * eighteen lessons knowing nothing at the start, and a beginner meeting the
   * alphabet is not doing better than their own average.
   */
  it('covers the lessons where the wall arrives and cannot be paid', () => {
    const START_GEMS = 20;
    const perLesson = gemsForLesson(0.39, false);
    expect(START_GEMS, 'a fresh profile cannot afford a refill').toBeLessThan(REFILL_COST);
    expect(START_GEMS + perLesson * 2, 'nor after two lessons at a beginner score').toBeLessThan(REFILL_COST);
    // And the grace period is long enough to reach the other side of that.
    expect(UNITS[0].lessons.length, 'Unit 1 should outlast the unaffordable stretch').toBeGreaterThan(4);
  });

  /**
   * A correct predicate nothing calls is worth nothing, and the store cannot
   * be imported here — it pulls AsyncStorage and react-native in behind
   * `persist`, and this suite deliberately has no DOM (see vitest.config.ts).
   *
   * So the wiring is checked the way `screens/lessonScreenWiring.test.ts`
   * checks its own: read the shipped source and confirm the call is inside the
   * function body that has to make it, not merely somewhere in the file, which
   * a doc comment naming it in prose would satisfy after the real call is
   * deleted. Comments are blanked first, keeping every character position, so
   * a call commented out rather than removed does not pass either.
   */
  it('is actually consulted by loseHeart', () => {
    const source = fs
      .readFileSync(path.join(__dirname, '..', 'store', 'useProgressStore.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));

    const start = source.indexOf('loseHeart: () => {');
    expect(start, 'loseHeart should still exist in the progress store').toBeGreaterThan(-1);

    let depth = 0;
    let end = start;
    for (let i = source.indexOf('{', start); i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}' && --depth === 0) {
        end = i;
        break;
      }
    }
    expect(source.slice(start, end)).toContain('heartsAreFree(');
  });
});
