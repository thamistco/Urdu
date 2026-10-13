import { UNITS } from '../data/units';

/**
 * The first unit costs no hearts.
 *
 * Five hearts, a heart back every thirty minutes, and a full refill for ten
 * gems: no more than one lesson pays (the owner's rule, 2026-10-13; it was
 * forty, then twenty-five). When the refill cost forty, the first wall,
 * most likely in the alphabet, cost twice what a new profile held, and the
 * only option was to put the phone down for half an hour. That was the first
 * reason for this grace.
 *
 * At ten gems the price no longer needs it. The grace stays because the
 * alphabet is where mistakes are densest and nothing has explained hearts
 * yet: a learner finishes Unit 1, is told once that hearts are on
 * (LessonComplete), and only then can lose one.
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
