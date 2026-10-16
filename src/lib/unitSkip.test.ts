import { describe, expect, it } from 'vitest';
import { lessonsToSkip, unitEvidenceFrom, UNIT_SKIP_MIN_ASKED, type Tally } from './unitSkip';
import { taughtByLesson } from './review';
import { UNITS, type Lesson } from '../data/units';

const L = (id: string, kind: Lesson['kind'] = 'vocab') => ({ id, kind }) as Lesson;
const unit = [L('l-a', 'letters'), L('v-b'), L('v-c'), L('g-d', 'grammar'), L('rev-x', 'review')];
const none = () => false;
const ev = (asked: number, right: number, byLesson: Record<string, Tally> = {}) => ({ asked, right, byLesson });
const all = { 'l-a': { asked: 4, right: 4 }, 'v-b': { asked: 4, right: 4 }, 'v-c': { asked: 4, right: 4 } };

describe('lessonsToSkip', () => {
  it('skips nothing on a review that asked too few of the unit’s own items, however well it went', () => {
    // A learner who jumped ahead: the review asked about earlier units only.
    expect(lessonsToSkip(unit, 'rev-x', ev(0, 0), none, false)).toEqual([]);
    expect(lessonsToSkip(unit, 'rev-x', ev(UNIT_SKIP_MIN_ASKED - 1, 9, all), none, false)).toEqual([]);
    expect(lessonsToSkip(unit, 'rev-x', undefined, none, false)).toEqual([]);
  });
  it('skips nothing under 80% on the unit’s own items', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(12, 9, all), none, false)).toEqual([]);
  });
  it('skips the unfinished lessons it has evidence for, never the review or what is done', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(12, 12, all), (id) => id === 'v-b', false)).toEqual(['l-a', 'v-c']);
  });
  it('never marks known a lesson the review did not sample', () => {
    // The half-done learner: the review asked only about v-b, which they had
    // finished, so v-c has no evidence at all, and a lesson with one item
    // asked has too little.
    const half = { 'v-b': { asked: 12, right: 12 }, 'v-c': { asked: 1, right: 1 } };
    expect(lessonsToSkip(unit, 'rev-x', ev(13, 13, half), (id) => id === 'v-b', false)).toEqual([]);
  });
  it('holds each lesson to 80% on its own items, not only the unit', () => {
    const uneven = { 'v-b': { asked: 10, right: 10 }, 'v-c': { asked: 5, right: 3 } };
    expect(lessonsToSkip(unit, 'rev-x', ev(15, 13, uneven), none, false)).toEqual(['v-b']);
  });
  it('never marks known a lesson that introduces no words or letters', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(12, 12, all), none, false)).not.toContain('g-d');
  });
  it('leaves letter lessons alone on the Roman track', () => {
    expect(lessonsToSkip(unit, 'rev-x', ev(12, 12, all), none, true)).toEqual(['v-b', 'v-c']);
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
    for (const { u, review, first, rest } of cases) {
      const t = taughtByLesson(first);
      const firstTry = new Map([...t.words, ...t.letters].map((id) => [id, true]));
      const evidence = unitEvidenceFrom(review.id, firstTry);
      const skipped = lessonsToSkip(u.lessons, review.id, evidence, (id) => id === first.id, false);
      expect(skipped.filter((id) => rest.some((l) => l.id === id))).toEqual([]);
    }
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
