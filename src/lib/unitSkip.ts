import type { Lesson } from '../data/units';
import { taughtInUnit } from './review';

/** How many of a unit's own words and letters a review must have asked. */
export const UNIT_SKIP_MIN_ASKED = 10;
/** And how many of those it must have had right first time. */
export const UNIT_SKIP_MIN_SHARE = 0.8;

export type UnitEvidence = { asked: number; right: number };

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
 * Now only the review's answers on the unit's own items count: at least
 * `UNIT_SKIP_MIN_ASKED` of them asked, and `UNIT_SKIP_MIN_SHARE` right first
 * time. Letter lessons are left alone on the Roman track, which never shows
 * them.
 */
export function lessonsToSkip(
  unitLessons: readonly Lesson[],
  reviewId: string,
  evidence: UnitEvidence | undefined,
  done: (id: string) => boolean,
  romanTrack: boolean
): string[] {
  if (!evidence || evidence.asked < UNIT_SKIP_MIN_ASKED) return [];
  if (evidence.right / evidence.asked < UNIT_SKIP_MIN_SHARE) return [];
  return unitLessons
    .filter((l) => l.id !== reviewId && !done(l.id) && !(romanTrack && l.kind === 'letters'))
    .map((l) => l.id);
}

/**
 * A unit review's answers on its own unit's words and letters, from each
 * item's right-first-time-on-every-sighting record. Undefined for a review
 * placed in no unit (the Daily Review and Catch-up).
 */
export function unitEvidenceFrom(lessonId: string, firstTry: ReadonlyMap<string, boolean>): UnitEvidence | undefined {
  const own = taughtInUnit(lessonId);
  if (!own) return undefined;
  const ids = new Set([...own.words, ...own.letters]);
  const asked = [...firstTry].filter(([id]) => ids.has(id));
  return { asked: asked.length, right: asked.filter(([, ok]) => ok).length };
}
