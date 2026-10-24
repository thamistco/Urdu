import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useProgressStore } from './useProgressStore';
import { DAILY_PRACTICE_ALLOWANCE, PRACTICE_XP_PER_RIGHT_ANSWER } from '../lib/repeatReward';

/**
 * Practice shares a daily allowance at full rate, then pays per right answer
 * (P-102). Driven through the real store, because the first attempt at this
 * rule was tested only as a function and nothing proved the store used it
 * (second check, 2026-10-20).
 */
const play = (lessonId: string, correct: number, total: number, xp: number) => {
  const before = useProgressStore.getState().totalXp;
  const r = useProgressStore.getState().finishLesson({ lessonId, correct, total, xp, isReview: true });
  return { paid: useProgressStore.getState().totalXp - before, capped: r.practiceCapped, repeat: r.repeatCapped };
};

describe('practice XP', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
    useProgressStore.setState({ todayXp: 0, todayPracticeXp: 0, completedLessons: {}, xpHistory: {} });
  });
  afterEach(() => vi.useRealTimers());

  it('stops a tapped-through review farm at the allowance plus its right answers', () => {
    let paid = 0;
    for (let i = 0; i < 12; i++) paid += play('practice-review', 2, 10, 20).paid;
    expect(paid).toBeLessThanOrEqual(DAILY_PRACTICE_ALLOWANCE + PRACTICE_XP_PER_RIGHT_ANSWER * 2 * 12);
  });

  it("pays a returner's first catch-up in full, however it went", () => {
    expect(play('practice-catchup', 4, 20, 30)).toEqual({ paid: 30, capped: false, repeat: false });
  });

  it('never caps a first time through a path lesson', () => {
    for (let i = 0; i < 4; i++) play('practice-review', 10, 10, 20);
    expect(play('v-first-words', 5, 40, 19).paid).toBe(19);
  });

  it('pays a first read of a new story or conversation in full, past the allowance too', () => {
    for (let i = 0; i < 4; i++) play('practice-review', 10, 10, 20);
    expect(play('practice-reading-r-1', 1, 1, 25).paid).toBe(30);
    expect(play('practice-reading-r-1', 1, 1, 25).paid).toBeLessThanOrEqual(2);
  });

  it('says so when it caps', () => {
    for (let i = 0; i < 3; i++) play('practice-review', 10, 10, 20);
    expect(play('practice-review', 3, 10, 20)).toEqual({ paid: 6, capped: true, repeat: false });
  });

  it('says so when a repeat pays for its exercises rather than in full', () => {
    play('practice-reading-r-1', 1, 1, 25);
    expect(play('practice-reading-r-1', 1, 1, 25)).toMatchObject({ paid: 2, repeat: true });
    expect(play('v-first-words', 10, 40, 19)).toMatchObject({ repeat: false });
  });

  it('starts again the next day', () => {
    for (let i = 0; i < 3; i++) play('practice-review', 10, 10, 20);
    vi.setSystemTime(new Date('2026-10-23T10:00:00Z'));
    expect(play('practice-review', 3, 10, 20).paid).toBe(20);
  });
});
