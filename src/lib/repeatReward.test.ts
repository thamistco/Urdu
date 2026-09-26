import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { repeatReward } from './repeatReward';
import { ALL_LESSONS } from '../data/units';
import { buildLessonExercises } from '../exercises/generator';
import { gemsForLesson, REFILL_COST } from './gamification';

/** The weekly XP that promotes a learner, restated from the progress store. */
const PROMOTE_XP = 150;

describe('finishing a lesson you have already finished', () => {
  const full = { xp: 30, gems: 10, exercises: 1 };

  it('changes nothing about a first completion', () => {
    expect(repeatReward(false, full)).toEqual({ xp: 30, gems: 10 });
  });

  it('caps a one-screen lesson by the one screen it was', () => {
    expect(repeatReward(true, full)).toEqual({ xp: 2, gems: 1 });
  });

  it('still pays a long lesson in full, because the work was real', () => {
    // Forty exercises at the practice rate is 80 XP, well past what the lesson
    // pays, so the cap does not bite. A repeat must never pay *more*.
    const long = { xp: 23, gems: 10, exercises: 40 };
    expect(repeatReward(true, long)).toEqual({ xp: 23, gems: 10 });
  });

  it('never pays more than the first completion did', () => {
    for (const exercises of [0, 1, 5, 20, 57]) {
      const earned = { xp: 25, gems: 10, exercises };
      const again = repeatReward(true, earned);
      expect(again.xp).toBeLessThanOrEqual(earned.xp);
      expect(again.gems).toBeLessThanOrEqual(earned.gems);
    }
  });

  /**
   * The measurement that made this worth doing, asserted from the real course
   * rather than from the numbers above: the cheapest lesson in the game, farmed
   * for a league win.
   */
  it('takes the cheapest lesson in the course out of reach of a league win', () => {
    const cheapest = ALL_LESSONS.map((l) => ({
      id: l.id,
      xp: l.xp,
      exercises: buildLessonExercises(l, [], 'both').length,
    }))
      .filter((l) => l.exercises > 0)
      .sort((a, b) => b.xp / b.exercises - a.xp / a.exercises)[0];

    // A handful of exercises, paid like a lesson: that is the shape of the
    // hole. It was one exercise when this was written; readings and
    // conversations gained a second question since, and the count is taken
    // from the course rather than assumed, so the rule is tested against the
    // lesson as it actually plays now.
    expect(cheapest.exercises).toBeLessThanOrEqual(2);

    const perfect = cheapest.xp + 5;
    const before = Math.ceil(PROMOTE_XP / perfect);
    const after = Math.ceil(
      PROMOTE_XP / repeatReward(true, { xp: perfect, gems: 10, exercises: cheapest.exercises }).xp
    );
    expect(before, `"${cheapest.id}" used to win a league week in ${before} replays`).toBeLessThanOrEqual(5);
    // Counted in answers given, not replays, against the bar this rule was
    // accepted at: ten times the replays it took before, when one replay was
    // one answer, so 50 answers. Readings and conversations have since gained
    // a second question, and a replay pays per answer, so farming one now
    // takes 38 replays of two answers: 76 answers, more grind than when the
    // rule shipped. Measured against a two-answer lesson with no rule at all
    // (10 answers) that is 7.6 times rather than ten, which is recorded here
    // rather than hidden. What must never happen is farming getting easier
    // than the level the rule was accepted at, and that is what this holds.
    const acceptedAt = before * 10;
    expect(after * cheapest.exercises, 'answers to farm a league win').toBeGreaterThanOrEqual(acceptedAt);
  });

  it('stops a heart refill being a handful of taps', () => {
    const gemsPerReplay = repeatReward(true, { xp: 30, gems: gemsForLesson(1, false), exercises: 1 }).gems;
    const replaysForARefill = Math.ceil(REFILL_COST / gemsPerReplay);
    expect(replaysForARefill).toBeGreaterThanOrEqual(REFILL_COST / 2);
  });

  /**
   * The rule is worth nothing if `finishLesson` stops asking. The store cannot
   * be imported here — `persist` drags AsyncStorage and react-native in, and
   * this suite has no DOM — so the call is checked the way hearts.test.ts and
   * lessonScreenWiring.test.ts check theirs: read the shipped source, with
   * comments blanked so a commented-out call cannot pass.
   */
  it('is actually consulted by finishLesson', () => {
    const source = fs
      .readFileSync(path.join(__dirname, '..', 'store', 'useProgressStore.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));

    // The implementation, not the type declaration above it: the interface
    // spells it `finishLesson: (args: {...})`, so anchoring on the shorter
    // prefix found the type and scanned a body made of field names.
    const start = source.indexOf('finishLesson: ({');
    expect(start, 'finishLesson should still exist in the progress store').toBeGreaterThan(-1);
    // Anchored on the arrow, not on the first brace: the first brace after the
    // name is the destructured parameter list, and scanning from there closes
    // on the pattern rather than the body — a body of six words that contains
    // no call at all, which is a test that cannot pass rather than one that
    // cannot fail, but is wrong in the same way.
    const arrow = source.indexOf('=> {', start);
    expect(arrow, 'finishLesson should still be an arrow function').toBeGreaterThan(-1);
    let depth = 0;
    let end = start;
    for (let i = source.indexOf('{', arrow); i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}' && --depth === 0) {
        end = i;
        break;
      }
    }
    const body = source.slice(start, end);
    expect(body).toContain('repeatReward(');
    // And that it is told whether this lesson was already finished, rather
    // than being handed a constant that makes the cap unreachable.
    expect(body).toMatch(/completedLessons\[lessonId\]/);
  });
});
