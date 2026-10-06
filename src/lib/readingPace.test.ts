import { describe, expect, it } from 'vitest';
import { readableWords, pickRound, wordsPerMinute, countsTowardBest, ROUND_SIZE, MIN_READ_MS } from './readingPace';
import { WORDS } from '../data/words';

describe('readableWords', () => {
  it('only offers words the learner has been taught', () => {
    const taught = WORDS.slice(0, 30).map((w) => w.id);
    const pool = readableWords(taught, WORDS);
    expect(pool.length).toBeGreaterThan(0);
    for (const w of pool) expect(taught).toContain(w.id);
  });

  it('leaves out long phrases, which are parsing practice rather than reading at a glance', () => {
    const long = { id: 'x', urdu: 'یہ ایک لمبا جملہ ہے' };
    const short = { id: 'y', urdu: 'کتاب' };
    expect(readableWords(['x', 'y'], [long, short])).toEqual([short]);
  });

  it('offers nothing to someone who has learned nothing', () => {
    expect(readableWords([], WORDS)).toEqual([]);
  });
});

describe('pickRound', () => {
  it('never repeats a word within a round', () => {
    const pool = WORDS.slice(0, 50);
    for (let seed = 0; seed < 20; seed++) {
      const round = pickRound(pool, ROUND_SIZE, mulberry(seed));
      expect(round).toHaveLength(ROUND_SIZE);
      expect(new Set(round.map((w) => w.id)).size).toBe(ROUND_SIZE);
    }
  });

  it('gives back what there is when the pool is smaller than a round', () => {
    expect(pickRound(WORDS.slice(0, 4))).toHaveLength(4);
  });
});

describe('wordsPerMinute', () => {
  it('counts the words read over the time spent on them', () => {
    // Ten words read in two seconds each is twenty seconds, thirty a minute.
    expect(wordsPerMinute(Array.from({ length: 10 }, () => ({ ms: 2000, read: true })))).toBe(30);
  });

  it('leaves a word the learner could not read out of the count and the clock', () => {
    const withMiss = [
      { ms: 2000, read: true },
      { ms: 30_000, read: false },
      { ms: 2000, read: true },
    ];
    expect(wordsPerMinute(withMiss)).toBe(30);
  });

  it('does not count a word tapped through faster than anyone can read it', () => {
    // One curious tap-through used to set a best no honest round could beat.
    const tappedThrough = Array.from({ length: 10 }, () => ({ ms: 250, read: true }));
    expect(wordsPerMinute(tappedThrough)).toBe(0);
    expect(MIN_READ_MS).toBeGreaterThan(250);
  });

  it('is 0, not NaN or Infinity, when nothing was read', () => {
    expect(wordsPerMinute([])).toBe(0);
    expect(wordsPerMinute([{ ms: 1000, read: false }])).toBe(0);
    expect(wordsPerMinute([{ ms: 0, read: true }])).toBe(0);
  });
});

describe('countsTowardBest', () => {
  it('needs most of the round genuinely read', () => {
    const read = (n: number) => [
      ...Array.from({ length: n }, () => ({ ms: 1500, read: true })),
      ...Array.from({ length: 10 - n }, () => ({ ms: 1500, read: false })),
    ];
    expect(countsTowardBest(read(8))).toBe(true);
    expect(countsTowardBest(read(7))).toBe(false);
  });

  it('ignores tap-throughs when deciding', () => {
    expect(countsTowardBest(Array.from({ length: 10 }, () => ({ ms: 200, read: true })))).toBe(false);
  });
});

/** A small seeded generator, so a failing draw can be replayed. */
function mulberry(seed: number) {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
