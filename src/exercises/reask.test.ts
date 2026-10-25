import { describe, expect, it } from 'vitest';
import { buildLessonExercises, itemsOf, reaskExercises, REASK_CAP, type Miss } from './generator';
import type { Exercise } from './types';
import { LETTERS } from '../data/letters';
import { ALL_LESSONS, findLesson, lessonOrderForTrack, type Lesson } from '../data/units';
import type { LearnTrack } from '../store/useSettingsStore';

/** Every lesson a learner can be graded in, on each track it is on. */
const SITTINGS: Array<{ lesson: Lesson; track: LearnTrack; exercises: Exercise[] }> = (
  ['both', 'roman'] as const
).flatMap((track) =>
  lessonOrderForTrack(track)
    .map((id) => findLesson(id)!)
    .filter((l) => l && l.kind !== 'review')
    .map((lesson) => ({ lesson, track, exercises: buildLessonExercises(lesson, [], track, new Set()) }))
);

const positionOf = (ex: Exercise) => ('position' in ex ? ex.position : undefined);
const key = (ex: Exercise) =>
  itemsOf(ex)
    .map((i) => `${i.type}:${i.id}`)
    .join(',');

/** Letter ids for each script character, from the letters' own forms. */
const LETTER_OF = new Map<string, string>();
for (const l of LETTERS)
  for (const g of Object.values(l.forms)) for (const c of g.replace(/ـ/g, '')) LETTER_OF.set(c, l.id);

describe('P-085: re-asking a missed item', () => {
  it('asks the same item in a different kind, keeping a letter’s position', () => {
    let asked = 0;
    for (const { lesson, track, exercises } of SITTINGS) {
      exercises.forEach((ex) => {
        const [again] = reaskExercises([{ ex, at: 0 }], lesson, track, 10);
        if (!again) return;
        asked++;
        expect(key(again), `${lesson.id} ${ex.kind}`).toBe(key(ex));
        expect(again.kind, `${lesson.id} ${ex.kind}`).not.toBe(ex.kind);
        if (positionOf(ex) && again.kind === 'letterPick') expect(again.position).toBe(positionOf(ex));
      });
    }
    expect(asked).toBeGreaterThan(1000);
  });

  it('never re-asks a matching board, a sentence, grammar or a number', () => {
    for (const { lesson, track, exercises } of SITTINGS) {
      for (const ex of exercises) {
        if (itemsOf(ex).length === 1) continue;
        expect(reaskExercises([{ ex, at: 0 }], lesson, track, 10), `${lesson.id} ${ex.kind}`).toEqual([]);
      }
    }
  });

  it('builds a typed word from tiles only on a script track, and only from letters already taught', () => {
    for (const { lesson, track, exercises } of SITTINGS) {
      const order = lessonOrderForTrack(track);
      const taught = new Set(
        order.slice(0, order.indexOf(lesson.id) + 1).flatMap((id) => findLesson(id)?.letterIds ?? [])
      );
      for (const ex of exercises.filter((e) => e.kind === 'typeWord')) {
        const [again] = reaskExercises([{ ex, at: 0 }], lesson, track, 10);
        if (again?.kind !== 'wordBuild') continue;
        expect(track, lesson.id).not.toBe('roman');
        const untaught = Array.from(again.word.urdu).filter((c) => LETTER_OF.has(c) && !taught.has(LETTER_OF.get(c)!));
        expect(untaught, `${lesson.id} ${again.word.urdu}`).toEqual([]);
      }
    }
  });

  it('asks the oldest misses first, at most five, and not a miss from the last steps', () => {
    const { lesson, track, exercises } = SITTINGS.find((s) => s.lesson.kind === 'vocab' && s.track === 'both')!;
    const words = exercises.filter((e) => e.kind === 'wordFromMeaning' || e.kind === 'meaningPick');
    const total = 30;
    const misses: Miss[] = words.slice(0, 8).map((ex, i) => ({ ex, at: total - 1 - i * 3 }));
    const asked = reaskExercises(misses, lesson, track, total);
    expect(asked.length).toBe(REASK_CAP);
    const oldestFirst = [...misses].sort((a, b) => a.at - b.at);
    expect(asked.map(key)).toEqual(oldestFirst.slice(0, REASK_CAP).map((m) => key(m.ex)));

    const last = reaskExercises([{ ex: words[0], at: total - 1 }], lesson, track, total);
    expect(last).toEqual([]);
  });

  it('asks nothing again in a review', () => {
    const review = ALL_LESSONS.find((l) => l.kind === 'review')!;
    const ex = SITTINGS.flatMap((s) => s.exercises).find((e) => e.kind === 'wordFromMeaning')!;
    expect(reaskExercises([{ ex, at: 0 }], review, 'both', 10)).toEqual([]);
  });
});
