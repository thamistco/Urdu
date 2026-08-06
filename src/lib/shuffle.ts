/**
 * A shuffle that is actually a shuffle.
 *
 * The app had this, in two files:
 *
 *     [...arr].sort(() => Math.random() - 0.5)
 *
 * which is the most widely copied wrong answer in JavaScript. `sort` is not
 * defined for an inconsistent comparator — one that answers differently each
 * time it is asked about the same pair — so what comes out depends on the
 * engine's sorting algorithm, and V8's insertion sort for short arrays barely
 * moves the first element.
 *
 * Every multiple-choice question in this app is built as `[answer,
 * ...distractors]` and then shuffled, so the answer starts at index 0 and the
 * bias lands squarely on it. Measured over 200,000 shuffles:
 *
 *   3 options — answer first 43.7% of the time, middle 18.8%   (fair: 33.3%)
 *   4 options — answer first 35.8%, third 15.6%                (fair: 25.0%)
 *   5 options — answer first 32.1%, third 12.2%                (fair: 20.0%)
 *
 * A learner who noticed that — and one did — could beat a three-option question
 * more than 40% of the time by always tapping the top tile, without reading it.
 * That is not a cosmetic complaint about variety; it is the exercise not
 * working.
 *
 * Fisher–Yates is uniform: for each position from the end, swap with a
 * uniformly chosen index at or before it. `shuffle.test.ts` measures the
 * distribution rather than trusting this comment.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The same shuffle, but the same every time for a given key.
 *
 * There are two different jobs here that both looked like "shuffle" and were
 * both served by the random one above, which is right for exactly one of them.
 *
 *  - **Presentation** — the order of the options under a question. This must be
 *    random, and the note above is about how badly it goes when it is not.
 *  - **Content** — *which* words a lesson teaches. This must be fixed, and it
 *    was not: `shuffle(pool).slice(0, n)` reran on every visit, so a lesson
 *    showed a different handful each time it was opened. A learner who finished
 *    "First words" and came back found words they had never seen, in a lesson
 *    the app had already marked complete. The lesson was not teaching more, it
 *    was teaching *different*.
 *
 * So content selection goes through here instead, keyed on something stable
 * about the lesson. It is still Fisher-Yates and still uniform across keys; it
 * is simply drawn from a generator that starts in the same place every time.
 *
 * mulberry32, seeded with a 32 bit FNV-1a hash of the key. Both are chosen for
 * being short enough to read rather than for statistical strength: nothing here
 * needs to resist an adversary, it needs to give the same lesson twice.
 */
export function seededShuffle<T>(items: readonly T[], key: string): T[] {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** One item, uniformly. Returns undefined for an empty list rather than NaN. */
export function pickOne<T>(items: readonly T[]): T | undefined {
  if (!items.length) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/** `n` distinct items, uniformly, without replacement. */
export function sample<T>(items: readonly T[], n: number): T[] {
  return shuffle(items).slice(0, Math.max(0, n));
}
