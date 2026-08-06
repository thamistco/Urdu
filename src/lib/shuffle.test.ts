import { describe, expect, it } from 'vitest';

import { pickOne, sample, seededShuffle, shuffle } from './shuffle';

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

/**
 * The bug this exists to prevent: a lesson that shows different words each time
 * it is opened. `shuffle(pool).slice(0, n)` did exactly that, so a learner who
 * finished a lesson and came back met words they had never seen, in a lesson the
 * app had already marked complete.
 *
 * Note what is *not* asserted here: that a given key produces some particular
 * order. Pinning the output would make this a transcription of mulberry32 and
 * would fail the moment the generator was swapped for an equally good one. What
 * the app depends on is the property — same key, same order; different key,
 * different order — so that is what is measured.
 */
describe('seededShuffle', () => {
  const pool = Array.from({ length: 40 }, (_, i) => i);

  it('returns the same order every time for the same key', () => {
    const first = seededShuffle(pool, 'v-first-words');
    for (let i = 0; i < 50; i++) {
      expect(seededShuffle(pool, 'v-first-words')).toEqual(first);
    }
  });

  it('returns a different order for a different key', () => {
    // Across many distinct keys, essentially all should differ from each other.
    // Two colliding is a coincidence; a constant order would collide every time.
    const seen = new Set(Array.from({ length: 200 }, (_, i) => seededShuffle(pool, `v-topic-${i}`).join(',')));
    expect(seen.size).toBeGreaterThan(195);
  });

  it('is a permutation, not a subset or a resampling', () => {
    const got = seededShuffle(pool, 'anything');
    expect(got).toHaveLength(pool.length);
    expect([...got].sort((a, b) => a - b)).toEqual(pool);
  });

  it('does not leave the first item in place, which is the failure mode of a bad shuffle', () => {
    // The answer sits at index 0 in every multiple choice question, so a shuffle
    // that barely moves it is the one that matters. Over many keys, item 0 should
    // land near-uniformly rather than staying put.
    let stayed = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) if (seededShuffle(pool, `k${i}`)[0] === 0) stayed++;
    expect(stayed / N).toBeLessThan(0.06); // fair is 1/40 = 0.025
  });

  it('handles the degenerate inputs a real pool can be', () => {
    expect(seededShuffle([], 'k')).toEqual([]);
    expect(seededShuffle([7], 'k')).toEqual([7]);
    expect(seededShuffle(pool, '')).toHaveLength(pool.length);
  });
});
