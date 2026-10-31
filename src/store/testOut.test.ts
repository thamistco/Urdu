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

  it('passes the review over once every lesson of the unit is marked known, as onboarding does', () => {
    // Unit 2: every lesson teaches words or letters, so a perfect test-out
    // leaves nothing of it to take.
    const rev = UNITS[1].lessons.find((l) => l.kind === 'review')!;
    const ahead = testOutLessons(rev.id, () => false, false);
    const refs = testOutRefs(ahead, false);
    const r = useProgressStore.getState().finishLesson({
      lessonId: rev.id,
      correct: refs.length,
      total: refs.length,
      xp: rev.xp,
      isReview: true,
      unitEvidence: unitEvidenceFrom(rev.id, new Map(refs.map((x) => [x.id, true]))),
      testOut: true,
    });
    const s = useProgressStore.getState();
    expect(r.skippedIds.length).toBe(ahead.length);
    expect(s.completedLessons[rev.id]).toBeUndefined();
    expect(s.skippedLessons[rev.id]).toBe(true);
  });

  it('keeps Unit 1’s review to take after a perfect test-out, since its phrases lesson cannot be tested out of', () => {
    finish(true);
    const s = useProgressStore.getState();
    expect(s.skippedLessons[review.id]).toBeUndefined();
    expect(s.completedLessons[review.id]).toBeUndefined();
  });

  it('never ticks off a review it stood in for: one lesson left, passed, the review stays to take', () => {
    // Unit 2: every lesson but the last done, then a test-out of that one.
    const unit2 = UNITS[1];
    const rev = unit2.lessons.find((l) => l.kind === 'review')!;
    const lessons = unit2.lessons.filter((l) => l.kind !== 'review');
    const last = lessons[lessons.length - 1];
    useProgressStore.setState({
      completedLessons: Object.fromEntries(lessons.slice(0, -1).map((l) => [l.id, { best: 9, done: 1 }])),
    });
    const ahead = testOutLessons(rev.id, (id) => !!useProgressStore.getState().completedLessons[id], false);
    expect(ahead.map((l) => l.id)).toEqual([last.id]);
    const refs = testOutRefs(ahead, false);
    useProgressStore.getState().finishLesson({
      lessonId: rev.id,
      correct: refs.length,
      total: refs.length,
      xp: rev.xp,
      isReview: true,
      unitEvidence: unitEvidenceFrom(rev.id, new Map(refs.map((x) => [x.id, true]))),
      testOut: true,
    });
    const s = useProgressStore.getState();
    expect(s.skippedLessons[last.id]).toBe(true);
    expect(s.completedLessons[rev.id]).toBeUndefined();
    expect(s.skippedLessons[rev.id]).toBeUndefined();
  });

  it('pays as practice, so tapping through test-outs is not a way to farm XP', () => {
    let paid = 0;
    for (let i = 0; i < 10; i++) paid += finish(false).xpGained;
    expect(paid).toBeLessThan(review.xp * 3);
  });
});
