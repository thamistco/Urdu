import { describe, expect, it } from 'vitest';

import { pickOne, sample, shuffle } from './shuffle';

/**
 * The property that matters is *uniformity*, and it is the one a shuffle can
 * fail while looking completely fine. The implementation this replaced returned
 * a plausibly jumbled array every time; it was simply jumbled in the same
 * lopsided way, and no test that checked "the output is a permutation" would
 * ever have caught it.
 *
 * So these count. Enough trials that a real bias cannot hide, loose enough
 * bounds that a fair shuffle will not fail on a bad day — the tolerances below
 * are far wider than the sampling error at this N, and far narrower than the
 * bias that was actually shipping.
 */

const TRIALS = 60_000;

/** How often each starting index lands in each final position. */
function positionCounts(size: number, trials = TRIALS) {
  const counts = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  const input = Array.from({ length: size }, (_, i) => i);
  for (let t = 0; t < trials; t++) {
    const out = shuffle(input);
    out.forEach((value, position) => {
      counts[value][position]++;
    });
  }
  return counts;
}

describe('shuffle', () => {
  it('returns a permutation, not a subset or a copy with holes', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = 0; i < 200; i++) {
      expect([...shuffle(input)].sort((a, b) => a - b)).toEqual(input);
    }
  });

  it('does not modify the array it was given', () => {
    const input = ['a', 'b', 'c', 'd'];
    shuffle(input);
    expect(input).toEqual(['a', 'b', 'c', 'd']);
  });

  it('handles the empty and single-item cases', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['only'])).toEqual(['only']);
  });

  /**
   * The regression test. Multiple-choice options are built as
   * `[answer, ...distractors]`, so the answer always starts at index 0 — which
   * is exactly the index the old shuffle failed to move. At three options it
   * left the answer on top 43.7% of the time instead of 33.3%.
   */
  it.each([3, 4, 5, 6])('puts the first item in every position equally often (%i options)', (size) => {
    const expected = TRIALS / size;
    const tolerance = expected * 0.1; // ±10%: ~14x the standard error here
    const firstItem = positionCounts(size)[0];
    firstItem.forEach((count, position) => {
      expect(
        Math.abs(count - expected),
        `first item landed at position ${position} ${((count / TRIALS) * 100).toFixed(1)}% of the time, ` +
          `expected ~${((1 / size) * 100).toFixed(1)}%`
      ).toBeLessThan(tolerance);
    });
  });

  it('is uniform for every item, not just the first', () => {
    const size = 4;
    const expected = TRIALS / size;
    const tolerance = expected * 0.1;
    positionCounts(size).forEach((positions, item) => {
      positions.forEach((count, position) => {
        expect(Math.abs(count - expected), `item ${item} at position ${position}`).toBeLessThan(tolerance);
      });
    });
  });

  it('actually moves things — a shuffle that returns the input is not one', () => {
    const input = [0, 1, 2, 3, 4, 5, 6, 7];
    let unchanged = 0;
    for (let i = 0; i < 1000; i++) {
      if (shuffle(input).every((v, k) => v === k)) unchanged++;
    }
    // 1/8! is about 0.0025%, so more than a handful means it is not shuffling.
    expect(unchanged).toBeLessThan(5);
  });
});

describe('pickOne', () => {
  it('returns undefined for an empty list rather than reading past the end', () => {
    expect(pickOne([])).toBeUndefined();
  });

  it('only ever returns something from the list', () => {
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 500; i++) expect(items).toContain(pickOne(items));
  });

  it('reaches every item', () => {
    const items = [0, 1, 2, 3, 4];
    const seen = new Set<number | undefined>();
    for (let i = 0; i < 500; i++) seen.add(pickOne(items));
    expect(seen.size).toBe(items.length);
  });
});

describe('sample', () => {
  it('returns n distinct items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = 0; i < 200; i++) {
      const got = sample(items, 3);
      expect(got).toHaveLength(3);
      expect(new Set(got).size).toBe(3);
    }
  });

  it('never returns more than it was given', () => {
    expect(sample([1, 2], 10)).toHaveLength(2);
  });

  it('treats a negative count as none, rather than slicing from the end', () => {
    expect(sample([1, 2, 3], -2)).toEqual([]);
  });
});
