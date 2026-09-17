/**
 * Counted nouns, agreeing with their number.
 *
 * The app writes about language, so a line reading "1 days in a row" costs
 * more here than it would elsewhere — and that one was the first celebration
 * every single learner saw, on the first lesson they ever finished.
 *
 * Nine other counted nouns in the app are guarded inline and correct. The
 * reason they had never been caught out is not care, it is arithmetic: their
 * counts have content floors that keep them at two or more (a lesson has at
 * least four lines, eleven words, twenty-three sets). The streak is the one
 * that can genuinely be 1, so it is the one that was wrong.
 *
 * Kept deliberately small. English has no general rule, so anything the "+s"
 * default gets wrong passes its own plural instead.
 */
export function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
