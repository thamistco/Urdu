import { describe, expect, it } from 'vitest';
import { ALL_LESSONS } from '../data/units';
import { WORDS } from '../data/words';
import { LETTERS } from '../data/letters';
import { buildLessonExercises } from '../exercises/generator';
import {
  keepSnapshot,
  restoreSnapshot,
  SNAPSHOT_DAYS,
  SNAPSHOTS_KEPT,
  takeSnapshot,
  type LessonSnapshot,
} from './lessonResume';

const live = (exercises: ReturnType<typeof buildLessonExercises>, at = 5) => ({
  exercises,
  at,
  correct: 3,
  skipped: 1,
  charged: new Set(['w-paani']),
  firstTry: new Map([['w-paani', false] as [string, boolean]]),
  misses: new Map([['w-paani', { ex: exercises[0], at: 0 }]]),
  pretested: new Set(['w-ghar']),
});

/** Every object reachable from `v` that is one of the course's words or letters. */
function courseObjects(v: unknown, out: unknown[] = []): unknown[] {
  if (Array.isArray(v)) v.forEach((x) => courseObjects(x, out));
  else if (v && typeof v === 'object') {
    if ((WORDS as unknown[]).includes(v) || (LETTERS as unknown[]).includes(v)) out.push(v);
    else Object.values(v).forEach((x) => courseObjects(x, out));
  }
  return out;
}

describe('a lesson left partway can be picked up where it was left (Q-038)', () => {
  it('brings back exactly the questions it kept, on every lesson, words and letters as the course’s own', () => {
    let lessons = 0;
    for (const lesson of ALL_LESSONS) {
      for (const track of ['both', 'roman'] as const) {
        const exercises = buildLessonExercises(lesson, [], track);
        if (exercises.length < 2) continue;
        const snap = JSON.parse(JSON.stringify(takeSnapshot(lesson.id, track, '2026-10-30', live(exercises, 1))));
        const back = restoreSnapshot(snap, lesson.id, track, '2026-10-30');
        expect(back, lesson.id).not.toBeNull();
        expect(back!.exercises, `${lesson.id} ${track}`).toEqual(exercises);
        // Not copies: the same objects, so a corrected gloss shows and nothing
        // that compares by identity is fooled.
        const before = courseObjects(exercises);
        const after = courseObjects(back!.exercises);
        expect(after.length).toBe(before.length);
        after.forEach((o, i) => expect(o).toBe(before[i]));
        lessons++;
      }
    }
    expect(lessons).toBeGreaterThan(300);
  });

  it('brings back the lesson’s own tallies', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'v-first-words')!;
    const exercises = buildLessonExercises(lesson, [], 'both');
    const back = restoreSnapshot(
      JSON.parse(JSON.stringify(takeSnapshot(lesson.id, 'both', '2026-10-30', live(exercises, 7)))),
      lesson.id,
      'both',
      '2026-10-30'
    )!;
    expect([back.at, back.correct, back.skipped]).toEqual([7, 3, 1]);
    expect([...back.charged]).toEqual(['w-paani']);
    expect([...back.firstTry]).toEqual([['w-paani', false]]);
    expect([...back.pretested]).toEqual(['w-ghar']);
    expect(back.misses.get('w-paani')!.ex).toEqual(exercises[0]);
  });

  it('offers nothing for another lesson, another track, a stale copy, or a word the course dropped', () => {
    const lesson = ALL_LESSONS.find((l) => l.id === 'v-first-words')!;
    const exercises = buildLessonExercises(lesson, [], 'both');
    const snap: LessonSnapshot = JSON.parse(
      JSON.stringify(takeSnapshot(lesson.id, 'both', '2026-10-30', live(exercises)))
    );
    expect(restoreSnapshot(snap, 'l-1', 'both', '2026-10-30')).toBeNull();
    expect(restoreSnapshot(snap, lesson.id, 'roman', '2026-10-30')).toBeNull();
    expect(restoreSnapshot(snap, lesson.id, 'both', '2026-11-06')).not.toBeNull();
    expect(SNAPSHOT_DAYS).toBe(7);
    expect(restoreSnapshot(snap, lesson.id, 'both', '2026-11-07')).toBeNull();
    const dropped = JSON.parse(JSON.stringify(snap).replace(/"\$w":"w-[^"]+"/, '"$w":"w-no-such-word"'));
    expect(restoreSnapshot(dropped, lesson.id, 'both', '2026-10-30')).toBeNull();
    expect(restoreSnapshot({ ...snap, at: 0 }, lesson.id, 'both', '2026-10-30')).toBeNull();
    expect(restoreSnapshot({ ...snap, at: exercises.length }, lesson.id, 'both', '2026-10-30')).toBeNull();
  });

  it('holds a few lessons at once, the latest first, one copy each', () => {
    const mk = (id: string) => ({ lessonId: id, track: 'both' }) as LessonSnapshot;
    let held: LessonSnapshot[] = [];
    for (const id of ['a', 'b', 'c', 'd', 'b']) held = keepSnapshot(held, mk(id));
    expect(held.map((s) => s.lessonId)).toEqual(['b', 'd', 'c']);
    expect(SNAPSHOTS_KEPT).toBe(3);
  });
});
