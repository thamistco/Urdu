import { describe, it, expect, beforeEach } from 'vitest';

import { useProgressStore } from './useProgressStore';
import type { LessonSnapshot } from '../lib/lessonResume';

/**
 * A lesson left partway is held until it is finished (Q-038), through the
 * real store: a copy that outlived its lesson would reopen a finished lesson
 * at step 30 the next time it was practised.
 */
const held = () => useProgressStore.getState().lessonsInProgress.map((l) => l.lessonId);
const snap = (lessonId: string) => ({ lessonId, track: 'both', at: 3 }) as LessonSnapshot;

describe('lessons in progress', () => {
  beforeEach(() => useProgressStore.setState({ lessonsInProgress: [], completedLessons: {} }));

  it('drops a lesson’s copy when that lesson is finished, and only that one', () => {
    useProgressStore.getState().holdLesson(snap('l-1'));
    useProgressStore.getState().holdLesson(snap('v-first-words'));
    useProgressStore.getState().finishLesson({ lessonId: 'l-1', correct: 10, total: 12, xp: 15, isReview: false });
    expect(held()).toEqual(['v-first-words']);
  });

  it('starts empty after a reset of all progress', () => {
    useProgressStore.getState().holdLesson(snap('l-1'));
    useProgressStore.getState().resetAll();
    expect(held()).toEqual([]);
  });
});
