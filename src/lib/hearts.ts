import { UNITS } from '../data/units';

/**
 * The first unit costs no hearts.
 *
 * The hearts economy is built for a learner who has some gems: five hearts, a
 * heart back every thirty minutes, and a full refill for forty gems. A new
 * profile starts with twenty, and a lesson pays five at a beginner's accuracy.
 * So the first time anybody runs out — most likely in the alphabet, the
 * hardest content in the course, with almost nothing learned yet — the refill
 * costs twice what they hold, and the only remaining option is to put the
 * phone down for half an hour. That is not a difficulty curve, it is a new
 * learner's first session ending on the app's terms rather than theirs.
 *
 * A strong learner is past the price after two flawless lessons, so this is
 * not a claim about the whole unit — the test in hearts.test.ts says so, and
 * caught the first version of this comment claiming otherwise. It is a claim
 * about the lessons where the wall actually arrives.
 *
 * So hearts do not deplete until the learner is through Unit 1. By then the
 * gems are there and the wall is a real choice — wait, or pay — which is what
 * it was always supposed to be.
 *
 * Keyed on the unit's last lesson rather than a lesson count, so regrouping
 * the course cannot silently move the line. Skipped counts as done: a heritage
 * learner who skipped Unit 1 at onboarding is past it in every sense that
 * matters here.
 */
const FIRST_UNIT_ENDS_WITH = UNITS[0].lessons[UNITS[0].lessons.length - 1].id;

export function heartsAreFree(
  completedLessons: Record<string, unknown>,
  skippedLessons: Record<string, unknown>
): boolean {
  return !completedLessons[FIRST_UNIT_ENDS_WITH] && !skippedLessons[FIRST_UNIT_ENDS_WITH];
}

/** Exported for the test, which should fail if the course is regrouped and this
 *  stops naming a real lesson. */
export const GRACE_ENDS_AFTER = FIRST_UNIT_ENDS_WITH;
