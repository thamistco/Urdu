import { UNITS, type Lesson } from '../data/units';
import { taughtByLesson } from './review';

/** How many of a unit's own words and letters a review must have asked. */
export const UNIT_SKIP_MIN_ASKED = 10;
/** And how many of those it must have had right first time. */
export const UNIT_SKIP_MIN_SHARE = 0.8;
/** How many of a lesson's own words or letters must have been asked to mark that lesson known. */
export const UNIT_SKIP_MIN_PER_LESSON = 3;

export type Tally = { asked: number; right: number };
/** The unit as a whole, and each of its lessons on the items that lesson introduces. */
export type UnitEvidence = Tally & { byLesson: Readonly<Record<string, Tally>> };

const passes = (t: Tally | undefined, min: number) => !!t && t.asked >= min && t.right / t.asked >= UNIT_SKIP_MIN_SHARE;

/**
 * Which of a unit's lessons a passed unit review marks as already known.
 *
 * It used to be every unfinished lesson whenever the review's whole score was
 * 80% or more (QA list M2, 2026-10-13). But a review draws on what the
 * learner has already been graded on, so for a learner who jumped ahead it
 * asked about none of the unit's own words: measured, 0 of them in Units 2 to
 * 41. The pass then marked a unit "already known" on no evidence, and its
 * words never reached the review queue (second check, 2026-10-13: HOLD).
 *
 * Counting only the unit's own items was not enough either. A learner who had
 * finished half a unit was asked about that half and nothing else, and a pass
 * marked the other half known: measured on every unit, 865 own items asked and
 * none from the unfinished lessons, whose 797 items were then never asked
 * (learning review, 2026-10-16). A mastery test certifies only what it
 * sampled, so each lesson now needs its own evidence: at least
 * `UNIT_SKIP_MIN_PER_LESSON` of the words or letters it introduces asked, and
 * `UNIT_SKIP_MIN_SHARE` of them right first time, on top of the unit's floor.
 * A lesson that introduces none (grammar, sentences, readings) is never
 * marked known by a review. Letter lessons are left alone on the Roman track,
 * which never shows them.
 */
export function lessonsToSkip(
  unitLessons: readonly Lesson[],
  reviewId: string,
  evidence: UnitEvidence | undefined,
  done: (id: string) => boolean,
  romanTrack: boolean
): string[] {
  if (!evidence || !passes(evidence, UNIT_SKIP_MIN_ASKED)) return [];
  return unitLessons
    .filter((l) => l.id !== reviewId && !done(l.id) && !(romanTrack && l.kind === 'letters'))
    .filter((l) => passes(evidence.byLesson[l.id], UNIT_SKIP_MIN_PER_LESSON))
    .map((l) => l.id);
}

const tally = (ids: Iterable<string>, firstTry: ReadonlyMap<string, boolean>): Tally => {
  const own = new Set(ids);
  const asked = [...firstTry].filter(([id]) => own.has(id));
  return { asked: asked.length, right: asked.filter(([, ok]) => ok).length };
};

/**
 * A unit review's answers on its own unit's words and letters, from each
 * item's right-first-time-on-every-sighting record, as a whole and lesson by
 * lesson. Undefined for a review placed in no unit (the Daily Review and
 * Catch-up).
 */
export function unitEvidenceFrom(lessonId: string, firstTry: ReadonlyMap<string, boolean>): UnitEvidence | undefined {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unit) return undefined;
  const byLesson: Record<string, Tally> = {};
  const all: string[] = [];
  for (const l of unit.lessons) {
    const { words, letters } = taughtByLesson(l);
    byLesson[l.id] = tally([...words, ...letters], firstTry);
    all.push(...words, ...letters);
  }
  return { ...tally(all, firstTry), byLesson };
}

/**
 * The unit reviews left with nothing to review once `skipped` is passed over.
 *
 * A speaker who skips the basics and the alphabet at onboarding is told those
 * lessons are done, and then Home's Continue opened Unit 1's review: 22
 * questions on the letters and words just skipped, with hearts on after it,
 * then Unit 2's, then Unit 3's (tester, reader route, 2026-10-27). A review
 * reviews its unit's lessons, so when every one of them is skipped there is
 * nothing for it to do. A unit with any lesson still to take keeps its review.
 * On the Roman track letter lessons are never shown, so they do not count.
 */
export function reviewsWithNothingLeft(skipped: ReadonlySet<string>, romanTrack: boolean, units = UNITS): string[] {
  return units.flatMap((u) => {
    const taught = u.lessons.filter((l) => l.kind !== 'review' && !(romanTrack && l.kind === 'letters'));
    if (!taught.length || !taught.every((l) => skipped.has(l.id))) return [];
    return u.lessons.filter((l) => l.kind === 'review').map((l) => l.id);
  });
}
