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
   * The owner's rule for the economy (2026-10-13, QA C1): a refill costs no
   * more than one lesson pays, so a wall is never more than a lesson's worth
   * of gems away.
   *
   * This test used to hold the opposite, the reason the grace period first
   * existed: with refills at 40, and then 25, a fresh profile could not pay
   * its first wall. At 10 it can, from its starting 20, so the grace no longer
   * rests on price. It stays for the other reason the QA reports gave: the
   * alphabet is where mistakes are densest, and a learner should know the
   * rule before it bites (the one-time note when hearts switch on).
   */
  it('prices a refill at no more than one lesson pays', () => {
    expect(REFILL_COST).toBeLessThanOrEqual(gemsForLesson(1, false));
    // The very first wall is affordable from the starting balance.
    expect(20).toBeGreaterThanOrEqual(REFILL_COST);
    // And the grace still covers the alphabet unit.
    expect(UNITS[0].lessons.length).toBeGreaterThan(4);
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
