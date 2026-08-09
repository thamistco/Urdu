import { describe, expect, it } from 'vitest';

import { shouldUpdateSrs } from './sessionGrading';

/**
 * The property this exists to hold: SRS advances once per item per lesson
 * visit, no matter how many times the lesson meets it. Broken, this is a
 * letter met 6 times correctly walking its review interval to 98 days from
 * one 5 minute sitting — see the doc comment on `shouldUpdateSrs` for the
 * measurement.
 */
describe('shouldUpdateSrs', () => {
  it('lets the first sighting of an item through', () => {
    expect(shouldUpdateSrs(new Set(), { id: 'alif', type: 'letter' })).toBe(true);
  });

  it('blocks every sighting after the first, in the same session', () => {
    const seen = new Set<string>();
    expect(shouldUpdateSrs(seen, { id: 'alif', type: 'letter' })).toBe(true);
    for (let i = 0; i < 5; i++) {
      expect(shouldUpdateSrs(seen, { id: 'alif', type: 'letter' })).toBe(false);
    }
  });

  it('tracks items independently — one item repeating does not block another', () => {
    const seen = new Set<string>();
    expect(shouldUpdateSrs(seen, { id: 'alif', type: 'letter' })).toBe(true);
    expect(shouldUpdateSrs(seen, { id: 'be', type: 'letter' })).toBe(true);
    expect(shouldUpdateSrs(seen, { id: 'alif', type: 'letter' })).toBe(false);
    expect(shouldUpdateSrs(seen, { id: 'be', type: 'letter' })).toBe(false);
  });

  it('treats the same id in different types as different items', () => {
    // Not reachable today — word ids, letter ids and phrase ids never
    // collide, confirmed during URD-010's review — but the key is compound
    // for the same reason the review dedupe's key is: an id collision should
    // not silently merge two unrelated items' SRS state.
    const seen = new Set<string>();
    expect(shouldUpdateSrs(seen, { id: 'x', type: 'letter' })).toBe(true);
    expect(shouldUpdateSrs(seen, { id: 'x', type: 'word' })).toBe(true);
  });

  it('a fresh Set per lesson means a new lesson visit is graded again', () => {
    // This is the contract LessonScreen relies on: `seenThisSession` is reset
    // whenever `exercises` changes, i.e. on every new lesson visit, so an
    // item is never permanently exempted from SRS — only exempted within one
    // sitting.
    const first = new Set<string>();
    expect(shouldUpdateSrs(first, { id: 'alif', type: 'letter' })).toBe(true);
    const second = new Set<string>();
    expect(shouldUpdateSrs(second, { id: 'alif', type: 'letter' })).toBe(true);
  });
});
