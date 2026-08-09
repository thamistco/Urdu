/**
 * Telling a returning learner why their place on the path moved.
 *
 * Three times now the course has been rebuilt underneath people. Splitting each
 * topic across enough lessons to cover its vocabulary took it from 174 lessons
 * to 608; regrouping those into sittings took it from 608 to 348; and the work
 * still open on lesson length will move it again. Every time, a learner's unit
 * counts changed while they were asleep.
 *
 * Nothing was lost on any of those and the denominators got more honest, but
 * that is invisible from inside the app. What a learner sees is a number that
 * went down on its own, which reads as lost progress, which is the single thing
 * most likely to make somebody stop opening it.
 *
 * ## Detecting it by missing lesson ids does not work, and that is the finding
 *
 * The first version of this asked which of the learner's ticked lesson ids no
 * longer exist. It is the obvious question and it is blind to the exact learner
 * this exists for. `coverTopics` deliberately gives a topic's *first* part the
 * topic's original id, so someone who finished "First words" before the split
 * still has a live tick — and review measured it: of the 237 lesson ids in the
 * pre-split path, **zero** are absent from the path today. A learner who had
 * finished 55 of 55 beginner lessons now reads 55 of 81, and by the missing-id
 * test they had nothing to be told. Ten of their units fell and the app was
 * silent, while a unit test asserting the notice worked stayed green.
 *
 * So detection is by the *shape of the path*, not by absence. The profile
 * carries the size of the path the learner last saw; if it differs from the path
 * in front of them, it moved under them. A profile from before this was recorded
 * carries `null`, which is itself the evidence — it can only have been written
 * by a build whose path has since been replaced.
 *
 * That also re-arms it. Recording "told" alone made the notice single use, so
 * the next regroup would have re-incurred the same debt silently and depended on
 * somebody remembering to bump the persist version. The size is re-recorded when
 * the learner dismisses it, so the next move announces itself.
 *
 * ## Why this returns a yes or no and not a count
 *
 * It carried `gone` and `ticked` so the message could say "3 of the 5 lessons
 * you had finished are now part of larger ones". That sentence is only true of
 * the minority cohort whose ids died — it is exactly the cohort the missing-id
 * bug above was already over-fitted to — and at the commonest returning profile
 * of all it rendered "1 of the 1 you had finished are now part of other
 * lessons". A concrete number that is unavailable to most of its readers and
 * ungrammatical to the rest is not worth the second code path.
 */

export type PathNoticeInput = {
  /** `completedLessons` from the store — only its keys are read. */
  completed: Readonly<Record<string, unknown>>;
  /** `skippedLessons` from the store: pre-satisfied at onboarding, still ticks. */
  skipped: Readonly<Record<string, unknown>>;
  /** How many lessons the path currently holds, across both tracks. */
  pathSize: number;
  /** Whether this learner has already been told about this move. */
  seen: boolean;
  /**
   * How many lessons the path held when this learner last opened the app, or
   * `null` for a profile written before that was recorded — which is every
   * profile that predates this notice, and so exactly the profiles owed one.
   */
  lastPathSize: number | null;
};

/**
 * Does this learner need telling that their place on the path moved?
 *
 * Four ways to answer no, and each is a way a plausible version gets it wrong:
 *
 *   already told      the whole point is once per move. It is cleared by
 *                     re-recording the path size, not by a version bump.
 *   nothing ticked    a learner who has finished nothing has no place on the
 *                     path to have moved. This is what catches a fresh profile,
 *                     and it catches it by fact rather than by asking when the
 *                     profile was created, which nothing records. Unlike the
 *                     first version of this function, the branch is live: it is
 *                     now the only thing between a new learner and a notice
 *                     about a change they were not there for.
 *   path is the same  they were last here on this path. Nothing moved.
 *   path is empty     defensive: a caller handing over a zero-length path would
 *                     otherwise be told the whole course changed. That is a bug
 *                     in the caller, and inventing a notice out of it would hide
 *                     the bug behind a plausible screen.
 */
export function needsPathMoveNotice({ completed, skipped, pathSize, seen, lastPathSize }: PathNoticeInput): boolean {
  if (seen) return false;
  if (pathSize === 0) return false;
  if (lastPathSize === pathSize) return false;

  return Object.keys(completed).length > 0 || Object.keys(skipped).length > 0;
}
