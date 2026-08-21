import { describe, expect, it } from 'vitest';

import { recordSighting, flushSessionGrades, type PendingGrades } from './sessionGrading';
import type { SrsGrade } from './srs';

/** A `gradeItem` double that just records what it was called with, in order. */
function fakeGradeItem() {
  const calls: { id: string; type: string; grade: SrsGrade }[] = [];
  const gradeItem = (id: string, type: string, grade: SrsGrade) => calls.push({ id, type, grade });
  return { gradeItem, calls };
}

/** Runs a sequence of grades through `recordSighting` for one item and returns
 *  what `flushSessionGrades` actually applied for it (or `undefined` if it
 *  was never sighted). */
function flushed(grades: SrsGrade[]): SrsGrade | undefined {
  const pending: PendingGrades = new Map();
  for (const g of grades) recordSighting(pending, { id: 'alif', type: 'letter' }, g);
  const { gradeItem, calls } = fakeGradeItem();
  flushSessionGrades(pending, gradeItem);
  return calls[0]?.grade;
}

/**
 * The property this exists to hold: SRS advances once per item per lesson
 * visit, no matter how many times the lesson meets it — on the grade its
 * last two sightings actually agree on, not on whichever one happened first,
 * and not on a single sighting nothing else confirms.
 *
 * Broken the first way, this is a letter met 6 times correctly walking its
 * review interval to 98 days from one 5 minute sitting. Broken the second
 * way (URD-019), a learner who answers wrong, then right five times running,
 * left with identical SRS state to one who answered wrong six times — the
 * first grade recorded was the one that stuck. Broken the third way
 * (CURRICULUM CRITIC reviewing this item), a single lucky final guess on a
 * 4-option question — a 25% chance — could flip a mostly-wrong performance
 * to "known" with nothing to check it. See the doc comment on
 * `finalGradeOf` for the reasoning and the real numbers behind all three.
 */
describe('recordSighting / flushSessionGrades', () => {
  it('applies a single sighting on flush — nothing to confirm it against, so it is trusted as-is', () => {
    expect(flushed(['good'])).toBe('good');
  });

  it('calls gradeItem exactly once per item, no matter how many times it was sighted', () => {
    const pending: PendingGrades = new Map();
    const { gradeItem, calls } = fakeGradeItem();
    for (let i = 0; i < 6; i++) recordSighting(pending, { id: 'alif', type: 'letter' }, 'good');
    flushSessionGrades(pending, gradeItem);
    expect(calls).toHaveLength(1);
  });

  it('URD-019: a wrong-then-five-right sequence and an all-wrong sequence produce different SRS states', () => {
    // The item's own acceptance criterion, stated directly.
    expect(flushed(['again', 'good', 'good', 'good', 'good', 'good'])).toBe('good');
    expect(flushed(['again', 'again', 'again', 'again', 'again', 'again'])).toBe('again');
  });

  describe('CURRICULUM CRITIC: the last two sightings must agree, or the result is "again"', () => {
    it('two sightings that agree the item is known: trusts the last one, tier and all', () => {
      expect(flushed(['good', 'good'])).toBe('good');
      expect(flushed(['good', 'easy'])).toBe('easy');
      expect(flushed(['easy', 'good'])).toBe('good');
    });

    it('two sightings that agree the item is not known: "again"', () => {
      expect(flushed(['again', 'again'])).toBe('again');
    });

    it('a single correct sighting right after a miss is not enough on its own — the guess-through case', () => {
      // The exact risk this exists to close: every multiple-choice question
      // is a 1-in-4 guess. One lucky correct answer immediately after a real
      // miss must not schedule as solid recall.
      expect(flushed(['again', 'good'])).toBe('again');
      expect(flushed(['again', 'easy'])).toBe('again');
    });

    it('a miss right after a correct answer is also not enough — forgetting within the session', () => {
      // The mirror case: a learner right, right, then wrong at the very end
      // forgot this item within the sitting and should not be scheduled as
      // mastered just because most of the session went well.
      expect(flushed(['good', 'good', 'again'])).toBe('again');
    });

    it('only the last two sightings matter — an early run is not enough to overrule a late disagreement', () => {
      expect(flushed(['good', 'good', 'good', 'good', 'again'])).toBe('again');
    });
  });

  it('tracks items independently — one item repeating does not affect another', () => {
    const pending: PendingGrades = new Map();
    recordSighting(pending, { id: 'alif', type: 'letter' }, 'again');
    recordSighting(pending, { id: 'be', type: 'letter' }, 'good');
    recordSighting(pending, { id: 'alif', type: 'letter' }, 'good');
    recordSighting(pending, { id: 'alif', type: 'letter' }, 'good');
    recordSighting(pending, { id: 'be', type: 'letter' }, 'good');
    const { gradeItem, calls } = fakeGradeItem();
    flushSessionGrades(pending, gradeItem);
    expect(calls.sort((x, y) => x.id.localeCompare(y.id))).toEqual([
      { id: 'alif', type: 'letter', grade: 'good' },
      { id: 'be', type: 'letter', grade: 'good' },
    ]);
  });

  it('treats the same id in different types as different items', () => {
    // Not reachable today — word ids, letter ids and phrase ids never
    // collide, confirmed during URD-010's review — but the key is compound
    // for the same reason the review dedupe's key is: an id collision should
    // not silently merge two unrelated items' SRS state.
    const pending: PendingGrades = new Map();
    recordSighting(pending, { id: 'x', type: 'letter' }, 'again');
    recordSighting(pending, { id: 'x', type: 'word' }, 'good');
    recordSighting(pending, { id: 'x', type: 'word' }, 'good');
    const { gradeItem, calls } = fakeGradeItem();
    flushSessionGrades(pending, gradeItem);
    expect(calls.sort((a, b) => a.type.localeCompare(b.type))).toEqual([
      { id: 'x', type: 'letter', grade: 'again' },
      { id: 'x', type: 'word', grade: 'good' },
    ]);
  });

  it('clears pending after flushing, so a second flush applies nothing', () => {
    // The contract `LessonScreen` relies on: an explicit flush at lesson
    // completion and a safety-net flush on unmount can both fire for the
    // same visit without double-applying its grades.
    const pending: PendingGrades = new Map();
    recordSighting(pending, { id: 'alif', type: 'letter' }, 'good');
    const first = fakeGradeItem();
    flushSessionGrades(pending, first.gradeItem);
    expect(first.calls).toHaveLength(1);

    const second = fakeGradeItem();
    flushSessionGrades(pending, second.gradeItem);
    expect(second.calls).toHaveLength(0);
  });
});
