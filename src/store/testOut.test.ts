import { describe, it, expect, beforeEach } from 'vitest';

import { useProgressStore } from './useProgressStore';
import { UNITS } from '../data/units';
import { heartsAreFree } from '../lib/hearts';
import { testOutLessons, testOutRefs, unitEvidenceFrom } from '../lib/unitSkip';

/**
 * How a test-out finishes (P-137), through the real store: a failed one must
 * leave the path as it was, since recorded as the review it showed the unit's
 * review done and ended Unit 1's free hearts (second check, 2026-10-31).
 */
const unit1 = UNITS[0];
const review = unit1.lessons.find((l) => l.kind === 'review')!;
const finish = (right: boolean) => {
  const ahead = testOutLessons(review.id, () => false, false);
  const refs = testOutRefs(ahead, false);
  return useProgressStore.getState().finishLesson({
    lessonId: review.id,
    correct: right ? refs.length : 0,
    total: refs.length,
    xp: review.xp,
    isReview: true,
    unitEvidence: unitEvidenceFrom(review.id, new Map(refs.map((x) => [x.id, right]))),
    testOut: true,
  });
};

describe('a test-out, finished', () => {
  beforeEach(() =>
    useProgressStore.setState({
      completedLessons: {},
      skippedLessons: {},
      todayXp: 0,
      todayPracticeXp: 0,
      xpHistory: {},
    })
  );

  it('leaves the path as it was when it fails: the review not done, Unit 1’s hearts still free', () => {
    const r = finish(false);
    const s = useProgressStore.getState();
    expect(s.completedLessons[review.id]).toBeUndefined();
    expect(r.skippedIds).toEqual([]);
    expect(heartsAreFree(s.completedLessons, s.skippedLessons)).toBe(true);
  });

  it('records the review once every lesson of the unit is marked known', () => {
    const r = finish(true);
    const s = useProgressStore.getState();
    expect(r.skippedIds.length).toBe(testOutLessons(review.id, () => false, false).length);
    expect(s.completedLessons[review.id]).toBeDefined();
  });

  it('pays as practice, so tapping through test-outs is not a way to farm XP', () => {
    let paid = 0;
    for (let i = 0; i < 10; i++) paid += finish(false).xpGained;
    expect(paid).toBeLessThan(review.xp * 3);
  });
});
