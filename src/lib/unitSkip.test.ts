import { describe, expect, it } from 'vitest';
import {
  lessonsToSkip,
  reviewsWithNothingLeft,
  testOutLessons,
  testOutRefs,
  unitEvidenceFrom,
  TEST_OUT_PER_LESSON,
  type LessonTally,
} from './unitSkip';
import { taughtByLesson } from './review';
import { UNITS, type Lesson } from '../data/units';

const L = (id: string, kind: Lesson['kind'] = 'vocab') => ({ id, kind }) as Lesson;
const unit = [L('l-a', 'letters'), L('v-b'), L('v-c'), L('g-d', 'grammar'), L('rev-x', 'review')];
const none = () => false;
const ev = (byLesson: Record<string, LessonTally> = {}) => {
  const t = Object.values(byLesson);
  return { asked: t.reduce((n, x) => n + x.asked, 0), right: t.reduce((n, x) => n + x.right, 0), byLesson };
};
const T = (asked: number, right: number, of = 8): LessonTally => ({ asked, right, of });
/** Lessons that re-teach another lesson's items: l-1-2, l-1's letters in their joining forms. */
const OVERLAP_PIN = 1;
const all = { 'l-a': T(4, 4), 'v-b': T(4, 4), 'v-c': T(4, 4), 'g-d': T(0, 0, 0) };

describe('lessonsToSkip', () => {
  it('skips nothing without evidence, or with too few of a lesson’s own items asked', () => {
    // A learner who jumped ahead: the review asked about earlier units only.
    expect(lessonsToSkip(unit, 'rev-x', undefined, none, false)).toEqual([]);
    expect(lessonsToSkip(unit, 'rev-x', ev(), none, false)).toEqual([]);
    const short = { 'v-b': T(TEST_OUT_PER_LESSON - 1, TEST_OUT_PER_LESSON - 1) };
    expect(lessonsToSkip(unit, 'rev-x', ev(short), none, false)).toEqual([]);
  });
  it('marks a lesson known on all of its asked items right first time, and not on one fewer (P-137)', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev({ 'v-b': T(4, 4) }), none, false)).toEqual(['v-b']);
    expect(lessonsToSkip(unit, 'rev-x', ev({ 'v-b': T(4, 3) }), none, false)).toEqual([]);
    expect(lessonsToSkip(unit, 'rev-x', ev({ 'v-b': T(6, 5) }), none, false)).toEqual([]);
  });
  it('holds each lesson to its own evidence: knowing one lesson marks that one, whatever the rest', () => {
    // No unit-wide gate: partial credit, lesson by lesson.
    const uneven = { 'v-b': T(4, 4), 'v-c': T(4, 1) };
    expect(lessonsToSkip(unit, 'rev-x', ev(uneven), none, false)).toEqual(['v-b']);
  });
  it('asks of a lesson that teaches fewer than four only what it has', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev({ 'v-b': T(2, 2, 2) }), none, false)).toEqual(['v-b']);
    expect(lessonsToSkip(unit, 'rev-x', ev({ 'v-b': T(1, 1, 2) }), none, false)).toEqual([]);
  });
  it('skips the unfinished lessons it has evidence for, never the review or what is done', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(all), (id) => id === 'v-b', false)).toEqual(['l-a', 'v-c']);
  });
  it('never marks known a lesson the review did not sample', () => {
    const half = { 'v-b': T(12, 12), 'v-c': T(1, 1) };
    expect(lessonsToSkip(unit, 'rev-x', ev(half), (id) => id === 'v-b', false)).toEqual([]);
  });
  it('never marks known a lesson that introduces no words or letters', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(all), none, false)).not.toContain('g-d');
  });
  it('leaves letter lessons alone on the Roman track', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(all), none, true)).toEqual(['v-b', 'v-c']);
  });
});

describe('a unit review opened ahead of its unit tests out of it (P-137)', () => {
  const reviews = UNITS.flatMap((u) => u.lessons.filter((l) => l.kind === 'review').map((r) => ({ u, r })));

  it('is an ordinary review once every lesson of its unit is done', () => {
    for (const { u, r } of reviews) {
      const done = new Set(u.lessons.map((l) => l.id));
      expect(
        testOutLessons(r.id, (id) => done.has(id), false),
        r.id
      ).toEqual([]);
    }
  });

  it('a perfect test-out marks every unfinished lesson that teaches words or letters known, on both tracks', () => {
    // Every such lesson in the course, which today a review reached only 7 of.
    let lessons = 0;
    for (const romanTrack of [false, true]) {
      for (const { u, r } of reviews) {
        const ahead = testOutLessons(r.id, none, romanTrack);
        const refs = testOutRefs(ahead, romanTrack, 3);
        const evidence = unitEvidenceFrom(r.id, new Map(refs.map((x) => [x.id, true])));
        const skipped = lessonsToSkip(u.lessons, r.id, evidence, none, romanTrack);
        expect(skipped, r.id).toEqual(expect.arrayContaining(ahead.map((l) => l.id)));
        lessons += ahead.length;
      }
    }
    expect(lessons).toBeGreaterThan(400);
  });

  it('asks four of each lesson’s own items, or all it has, and no letter on the Roman track', () => {
    for (const romanTrack of [false, true]) {
      for (const { r } of reviews) {
        for (const l of testOutLessons(r.id, none, romanTrack)) {
          const t = taughtByLesson(l);
          const own = new Set([...t.words, ...(romanTrack ? [] : t.letters)]);
          const refs = testOutRefs([l], romanTrack);
          expect(refs.length, l.id).toBe(Math.min(TEST_OUT_PER_LESSON, own.size));
          expect(refs.every((x) => own.has(x.id))).toBe(true);
        }
      }
    }
  });

  it('draws a different four on a retake, where a lesson has more to draw from', () => {
    const l = testOutLessons(reviews[1].r.id, none, false).find((x) => taughtByLesson(x).words.length > 6)!;
    const draws = new Set([0, 1, 2, 3].map((v) => JSON.stringify(testOutRefs([l], false, v))));
    expect(draws.size).toBeGreaterThan(1);
  });

  it('one wrong answer in a lesson leaves that lesson to take, and only that one', () => {
    // An item no other lesson of the unit teaches: a shared item missed fails both.
    const itemsOf = (l: Lesson) => [...taughtByLesson(l).words, ...taughtByLesson(l).letters];
    const pick = reviews
      .map(({ u, r }) => ({ u, r, ahead: testOutLessons(r.id, none, false) }))
      .filter((c) => c.ahead.length >= 2)
      .map((c) => {
        const others = new Set(c.ahead.slice(1).flatMap(itemsOf));
        return { ...c, missed: testOutRefs([c.ahead[0]], false).find((x) => !others.has(x.id))?.id };
      })
      .find((c) => c.missed)!;
    const { u, r, ahead, missed } = pick;
    const refs = testOutRefs(ahead, false);
    const evidence = unitEvidenceFrom(r.id, new Map(refs.map((x) => [x.id, x.id !== missed])));
    const skipped = lessonsToSkip(u.lessons, r.id, evidence, none, false);
    expect(skipped).not.toContain(ahead[0].id);
    expect(skipped).toEqual(expect.arrayContaining(ahead.slice(1).map((l) => l.id)));
  });
});

describe('unitEvidenceFrom, on the real course', () => {
  // Every unit with a review and two lessons that introduce items: a learner
  // who finished the first and answered every one of its items right.
  const cases = UNITS.flatMap((u) => {
    const review = u.lessons.find((l) => l.kind === 'review');
    const teaching = u.lessons.filter((l) => {
      const t = taughtByLesson(l);
      return t.words.length + t.letters.length > 0;
    });
    return review && teaching.length >= 2 ? [{ u, review, first: teaching[0], rest: teaching.slice(1) }] : [];
  });

  it('finds units to test', () => {
    expect(cases.length).toBeGreaterThan(10);
  });

  it('a perfect review of the finished half marks none of the unfinished half known', () => {
    // Apart from a lesson that re-teaches the finished one's own items, as
    // l-1-2 does l-1's letters in their joining forms: there the answers are
    // its evidence too.
    let overlapping = 0;
    for (const { u, review, first, rest } of cases) {
      const t = taughtByLesson(first);
      const own = new Set([...t.words, ...t.letters]);
      const firstTry = new Map([...own].map((id) => [id, true]));
      const evidence = unitEvidenceFrom(review.id, firstTry);
      const skipped = lessonsToSkip(u.lessons, review.id, evidence, (id) => id === first.id, false);
      const apart = rest.filter((l) => {
        const r = taughtByLesson(l);
        return ![...r.words, ...r.letters].some((id) => own.has(id));
      });
      overlapping += rest.length - apart.length;
      expect(skipped.filter((id) => apart.some((l) => l.id === id))).toEqual([]);
    }
    expect(overlapping).toBe(OVERLAP_PIN);
  });

  it('a perfect review of every lesson’s items marks the unfinished ones known', () => {
    const { u, review, first, rest } = cases.find((c) =>
      c.rest.every((l) => {
        const t = taughtByLesson(l);
        return t.words.length + t.letters.length >= 3;
      })
    )!;
    const ids = [first, ...rest].flatMap((l) => {
      const t = taughtByLesson(l);
      return [...t.words, ...t.letters];
    });
    const evidence = unitEvidenceFrom(review.id, new Map(ids.map((id) => [id, true])));
    const skipped = lessonsToSkip(u.lessons, review.id, evidence, (id) => id === first.id, false);
    expect(skipped).toEqual(expect.arrayContaining(rest.map((l) => l.id)));
  });

  it('is undefined for a review placed in no unit', () => {
    expect(unitEvidenceFrom('practice-review', new Map())).toBeUndefined();
  });
});

describe('reviewsWithNothingLeft', () => {
  const beginner = UNITS.filter((u) => u.level === 'beginner');
  const basics = beginner.flatMap((u) => u.lessons).filter((l) => l.kind === 'vocab' || l.kind === 'phrases');
  const letters = beginner.flatMap((u) => u.lessons).filter((l) => l.kind === 'letters');
  const reviewOf = (n: number) => UNITS[n].lessons.filter((l) => l.kind === 'review').map((l) => l.id);

  it('passes over Unit 1’s review for a speaker who skipped the basics and the alphabet', () => {
    const skipped = new Set([...basics, ...letters].map((l) => l.id));
    expect(reviewsWithNothingLeft(skipped, false)).toEqual(expect.arrayContaining(reviewOf(0)));
  });

  it('keeps a review while any lesson of its unit is still to take', () => {
    const skipped = new Set([...basics, ...letters].map((l) => l.id));
    for (const id of reviewsWithNothingLeft(skipped, false)) {
      const unit = UNITS.find((u) => u.lessons.some((l) => l.id === id))!;
      expect(unit.lessons.filter((l) => l.kind !== 'review').every((l) => skipped.has(l.id))).toBe(true);
    }
    // The alphabet kept: Unit 1 still teaches letters, so its review stays.
    expect(reviewsWithNothingLeft(new Set(basics.map((l) => l.id)), false)).not.toEqual(
      expect.arrayContaining(reviewOf(0))
    );
  });

  it('does not count letter lessons on the Roman track, which never shows them', () => {
    expect(reviewsWithNothingLeft(new Set(basics.map((l) => l.id)), true)).toEqual(expect.arrayContaining(reviewOf(0)));
  });

  it('passes over nothing when nothing is skipped', () => {
    expect(reviewsWithNothingLeft(new Set(), false)).toEqual([]);
  });
});
