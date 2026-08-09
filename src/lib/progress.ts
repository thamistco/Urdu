/**
 * Telling a returning learner why their progress moved.
 *
 * Twice now the path has been rebuilt underneath people. Splitting each topic
 * across enough lessons to cover its vocabulary took the course from 174 lessons
 * to 608, and regrouping those into sittings took it from 608 to 348. Both times
 * the first part of a topic kept its id, so "First words" stayed ticked — but it
 * became 1 of 7, and then 1 of 3, and a learner's unit percentage fell while they
 * were asleep.
 *
 * Nothing was lost either time and the denominator became more honest, but that
 * is invisible from inside the app. What a learner sees is a number that went
 * down on its own, which reads as lost progress, which is the single thing most
 * likely to make somebody stop opening it.
 *
 * So the app says so, once, plainly. This module is the decision — kept pure and
 * away from the store and the screen, because "exactly once, and never to a new
 * learner" is a rule with edges and those edges are what the test is for.
 */

/**
 * What to tell the learner, or `null` for say nothing.
 *
 * `gone` is how many of their ticked lessons no longer exist under that id, and
 * `ticked` is how many they had. Both go in the message: "9 of your 24 finished
 * lessons were regrouped" is a sentence somebody can believe, where "your
 * progress has changed" is the kind of notice people learn to dismiss unread.
 */
export type PathNotice = { gone: number; ticked: number } | null;

export type PathNoticeInput = {
  /** `completedLessons` from the store — only its keys are read. */
  completed: Readonly<Record<string, unknown>>;
  /** `skippedLessons` from the store: pre-satisfied at onboarding, still ticks. */
  skipped: Readonly<Record<string, unknown>>;
  /** Every lesson id the path currently contains. */
  known: ReadonlySet<string>;
  /** Whether this learner has already been told. */
  seen: boolean;
};

/**
 * Decide whether to tell this learner their progress moved.
 *
 * Three ways to answer no, and each one is a way the naive version gets it wrong:
 *
 *   already told      the whole point is once. The flag is set on dismissal, not
 *                     on render, so a notice shown during a crash is still owed.
 *   nothing missing   they finished lessons and every one of them still exists,
 *                     so nothing moved for them even though the path changed
 *                     around them. Telling this learner would be a lie about
 *                     their own account. This is also what catches a *fresh*
 *                     profile: nothing ticked means nothing can be missing. It
 *                     catches it by fact rather than by asking when the profile
 *                     was created, which nothing records.
 *   path is empty     defensive: a caller that hands over an empty `known` set
 *                     would otherwise be told every lesson vanished. That is a
 *                     bug in the caller, and inventing a notice out of it would
 *                     hide the bug behind a plausible screen.
 *
 * There was a fourth, an early return on nothing ticked. It was deleted after
 * being deliberately broken to see the test fail and the test did not: the
 * "nothing missing" branch already returns null for an empty profile, so the
 * guard could never fire and could never be wrong. A branch that cannot fail
 * reads as protection and is only cost.
 */
export function pathMoveNotice({ completed, skipped, known, seen }: PathNoticeInput): PathNotice {
  if (seen) return null;
  if (known.size === 0) return null;

  const ticked = new Set([...Object.keys(completed), ...Object.keys(skipped)]);
  let gone = 0;
  for (const id of ticked) if (!known.has(id)) gone++;
  if (gone === 0) return null;

  return { gone, ticked: ticked.size };
}
