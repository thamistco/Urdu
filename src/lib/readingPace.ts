/**
 * Read faster: short rounds that build reading speed in the script.
 *
 * Knowing every letter is not the same as reading. Fluent reading in an
 * Arabic-derived script rests on recognising letters and words without
 * spelling them out, and research on Arabic readers ties comfortable
 * comprehension to automatic, fast word recognition. A heritage speaker
 * already understands most of what they can decode; speed is what turns the
 * alphabet into reading. Daily review 2026-10-06, proposal P-004.
 *
 * Only words the learner has already been taught are used, so a round tests
 * reading, never vocabulary. Nothing here is graded into the review schedule:
 * the learner marks their own reading, and a self-mark is not evidence the
 * schedule should act on.
 */

/** Words in one round. Ten is a minute or two, which fits a sitting. */
export const ROUND_SIZE = 10;

/** Fewer learned words than this and a round would repeat itself. */
export const MIN_WORDS_FOR_A_ROUND = ROUND_SIZE;

/** Longer than this and an item is a phrase to parse, not a word to read. */
const MAX_WORDS_PER_ITEM = 2;

type Readable = { id: string; urdu: string };

/**
 * The words a round can draw on: taught, and short enough to read at a glance.
 */
export function readableWords<W extends Readable>(learnedIds: readonly string[], words: readonly W[]): W[] {
  const learned = new Set(learnedIds);
  return words.filter((w) => learned.has(w.id) && w.urdu.trim().split(/\s+/).length <= MAX_WORDS_PER_ITEM);
}

/** Up to `size` distinct words, in a random order. */
export function pickRound<W>(pool: readonly W[], size = ROUND_SIZE, random: () => number = Math.random): W[] {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}

/** One word's outcome: how long it was on screen before "show me", and whether it was read. */
export type Attempt = { ms: number; read: boolean };

/**
 * Faster than this and the word was tapped through, not read: nobody reads a
 * Nastaliq word in under 0.4 s. Without this floor a single curious tap-through
 * set a best of about 240 a minute that no honest round could ever beat.
 */
export const MIN_READ_MS = 400;

/** A round sets a best only if at least this many of its words were read. */
export const MIN_READS_FOR_BEST = 8;

/** The attempts that count as reading: marked read, and not tapped through. */
const genuine = (attempts: readonly Attempt[]) => attempts.filter((a) => a.read && a.ms >= MIN_READ_MS);

/** How many words were genuinely read: the count the pace is made of. */
export function wordsRead(attempts: readonly Attempt[]): number {
  return genuine(attempts).length;
}

/** Whether a round is real enough to set a best. */
export function countsTowardBest(attempts: readonly Attempt[]): boolean {
  return genuine(attempts).length >= MIN_READS_FOR_BEST;
}

/**
 * Words recognised per minute, one word at a time: only the words the learner
 * says they read, over only the time spent on those words. A word they could
 * not read is left out of both, so skipping a hard one neither inflates nor
 * drags the pace, and so is one tapped through faster than MIN_READ_MS.
 *
 * This is a pace for single words including the tap, not prose reading speed,
 * and the screen says so.
 *
 * Returns 0 when nothing was read, rather than NaN or Infinity, because the
 * result is shown and stored.
 */
export function wordsPerMinute(attempts: readonly Attempt[]): number {
  const read = genuine(attempts);
  const ms = read.reduce((sum, a) => sum + a.ms, 0);
  if (!read.length || ms <= 0) return 0;
  return Math.round((read.length / ms) * 60_000);
}
