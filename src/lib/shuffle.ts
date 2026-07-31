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

/** One item, uniformly. Returns undefined for an empty list rather than NaN. */
export function pickOne<T>(items: readonly T[]): T | undefined {
  if (!items.length) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/** `n` distinct items, uniformly, without replacement. */
export function sample<T>(items: readonly T[], n: number): T[] {
  return shuffle(items).slice(0, Math.max(0, n));
}
