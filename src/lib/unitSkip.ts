import { UNITS, type Lesson } from '../data/units';
import { taughtByLesson } from './review';
import { seededShuffle } from './shuffle';
import type { ItemRef } from '../exercises/types';

/**
 * How many of a lesson's own words or letters a test-out asks, and all must be
 * right first time to mark that lesson known; fewer when the lesson teaches
 * fewer (P-137).
 */
export const TEST_OUT_PER_LESSON = 4;

export type Tally = { asked: number; right: number };
/** One lesson's tally, and how many words and letters it introduces. */
export type LessonTally = Tally & { of: number };
/** The unit as a whole, and each of its lessons on the items that lesson introduces. */
export type UnitEvidence = Tally & { byLesson: Readonly<Record<string, LessonTally>> };

/** A lesson's own items asked, `TEST_OUT_PER_LESSON` of them or all it has, and every one right. */
const passes = (t: LessonTally | undefined) =>
  !!t && t.of > 0 && t.asked >= Math.min(TEST_OUT_PER_LESSON, t.of) && t.right === t.asked;

/**
 * A lesson a unit review could mark known: it introduces words or letters this
 * track shows. Kept per lesson and track, since Home asks it of every review
 * on each render.
 */
const testableKnown = new Map<string, boolean>();
const testable = (l: Lesson, romanTrack: boolean) => {
  const key = `${l.id}:${romanTrack}`;
  const known = testableKnown.get(key);
  if (known !== undefined) return known;
  let ok = false;
  if (l.kind !== 'review' && !(romanTrack && l.kind === 'letters')) {
    const t = taughtByLesson(l);
    ok = t.words.length + (romanTrack ? 0 : t.letters.length) > 0;
  }
  testableKnown.set(key, ok);
  return ok;
};

/**
 * The lessons a unit review opened now would test out of: those of its unit
 * that introduce words or letters on this track and are neither done nor
 * skipped. None means it is an ordinary review, reached in order (P-137).
 */
export function testOutLessons(
  reviewId: string,
  done: (id: string) => boolean,
  romanTrack: boolean,
  units = UNITS
): Lesson[] {
  const unit = units.find((u) => u.lessons.some((l) => l.id === reviewId && l.kind === 'review'));
  return unit ? unit.lessons.filter((l) => testable(l, romanTrack) && !done(l.id)) : [];
}

/**
 * What a test-out asks: `TEST_OUT_PER_LESSON` of each lesson's own words and
 * letters, a different draw on each visit so a retake is not the same quiz.
 */
export function testOutRefs(lessons: readonly Lesson[], romanTrack: boolean, visit = 0): ItemRef[] {
  return lessons.flatMap((l) => {
    const t = taughtByLesson(l);
    const own: ItemRef[] = [
      ...t.words.map((id) => ({ id, type: 'word' as const })),
      ...(romanTrack ? [] : t.letters.map((id) => ({ id, type: 'letter' as const }))),
    ];
    return seededShuffle(own, `test-out:${l.id}:${visit}`).slice(0, TEST_OUT_PER_LESSON);
  });
}

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
 * sampled, so each lesson needs its own evidence.
 *
 * Even so, nobody could test out: once a learner had been graded on anything,
 * a review asked only about what they had been graded on, so a jump ahead
 * still met none of the unit's items, and only 7 of 242 lessons could ever be
 * marked known, all in Unit 1 (tester, 2026-10-29; learning review,
 * 2026-10-31). A review opened ahead of its unit is now a test-out
 * (`testOutLessons`) that asks `TEST_OUT_PER_LESSON` of each unfinished
 * lesson's own items, and a lesson passes on all of them right first time.
 * Each lesson stands alone: the unit-wide 80% gate is gone, so knowing three
 * lessons of four marks those three, as placement tests with partial credit
 * do. Four questions of four options passes a learner who knows half the
 * lesson about one time in seven (measured, binomial), which a lesson left
 * open to try anyway can bear.
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
  if (!evidence) return [];
  return unitLessons
    .filter((l) => l.id !== reviewId && !done(l.id) && !(romanTrack && l.kind === 'letters'))
    .filter((l) => passes(evidence.byLesson[l.id]))
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
  const byLesson: Record<string, LessonTally> = {};
  const all: string[] = [];
  for (const l of unit.lessons) {
    const { words, letters } = taughtByLesson(l);
    byLesson[l.id] = { ...tally([...words, ...letters], firstTry), of: words.length + letters.length };
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
