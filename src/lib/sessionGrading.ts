import type { SrsGrade } from './srs';

/** The shape `gradeItem` (`useProgressStore.ts`) actually needs, kept loose
 *  and untyped-to-a-store here so this stays pure logic with no dependency
 *  on where it is called from. */
type ItemRef = { id: string; type: string };
/** `priorGrade` is the sighting immediately before the most recent one — see
 *  `finalGradeOf`'s doc comment for why one sighting of lookback is kept. */
type PendingGrade = ItemRef & { grade: SrsGrade; priorGrade?: SrsGrade };
export type PendingGrades = Map<string, PendingGrade>;

/**
 * Which items this lesson visit has sighted, and enough of each one's recent
 * grades to decide what to apply — not yet applied to SRS. Call
 * `recordSighting` on every graded exercise, `flushSessionGrades` once the
 * session is done with them.
 *
 * A lesson can meet the same word or letter more than once — that is the
 * whole point of the staggered vocabulary pipeline and the letter pipeline
 * (`generator.ts`), which exist because meeting something once and moving on
 * teaches worse than meeting it several times in different shapes. But every
 * exercise component calls `onGraded` unconditionally (`LessonScreen.tsx`),
 * and originally every one of those sightings independently called
 * `gradeItem`, which walks `SrsCard` through SM-2 (`src/lib/srs.ts`) as if it
 * were a separate day's review.
 *
 * Measured against the real curve: a letter met 6 times correctly in one
 * sitting — the number letters are now met, after the fix that made letter
 * lessons long enough to be a sitting — walked `reps` from 0 to 6 and the due
 * interval out to 98 days, from a single five-minute lesson with zero actual
 * time-spaced recall. Review, which exists specifically to bring material
 * back later (see URD-010), would not see that letter again for over three
 * months. The bug was not unique to letters — the vocabulary pipeline already
 * meets a new word three times a lesson — letters simply made it six times
 * worse and loud enough to be found.
 *
 * The first fix capped this to the *first* sighting per item per visit,
 * which closed the 98-day bug but chose the wrong sighting to trust: a
 * learner who answers wrong, then right five times running in the same
 * sitting, left with identical SRS state to one who answered wrong six
 * times, because the first grade was the one that stuck — discarding the
 * strongest signal a teaching lesson produces (URD-019, found by the
 * CURRICULUM CRITIC reviewing URD-013).
 *
 * This is overwrite-and-defer instead of gate-and-skip: every sighting of an
 * item overwrites what the *previous* sighting recorded, so the value held
 * when the session is done with an item is always its most recent grade —
 * and `gradeItem` is still called exactly once per item, deferred until
 * then, not fired eagerly on the first sighting.
 */
export function recordSighting(pending: PendingGrades, item: ItemRef, grade: SrsGrade): void {
  const key = `${item.type}:${item.id}`;
  pending.set(key, { ...item, grade, priorGrade: pending.get(key)?.grade });
}

/**
 * The grade `flushSessionGrades` actually applies for one item: the last
 * sighting, but only once the sighting immediately before it agrees this
 * item is genuinely known or genuinely not — not a raw "trust whatever came
 * last."
 *
 * CURRICULUM CRITIC, URD-019: grading on the bare last sighting has no guard
 * against a single lucky final guess. Every multiple-choice exercise in the
 * course offers `OPTIONS_PER_QUESTION = 4` options — a 25% guess rate — and
 * measured directly, roughly two thirds of letters (15 of 46 sampled) end
 * their six sightings on a recognise-tier kind (`letterForm`/`letterPick`),
 * not the harder `letterTrace`, because the letter pipeline rotates turns
 * rather than climbing meet→recall→produce the way vocabulary does. A
 * learner wrong on every real attempt who then guesses right on that last,
 * easy sighting would otherwise walk away scheduled exactly like one who
 * actually knew it.
 *
 * Requiring the last two sightings to *agree* — both correct (`good` or
 * `easy`, in either order) or both `again` — cuts that guess-through risk
 * from roughly 1-in-4 to roughly 1-in-16, at the cost of nothing: sightings
 * are already cheap (3-6 per item) and this only withholds trust from a
 * result the two most recent attempts actually contradict.
 *
 * Disagreement resolves to `'again'`, not to some blend: a flip either
 * direction — wrong then right, or right then wrong — means the learner's
 * most recent performance on this item was inconsistent, which is itself
 * real information and the conservative reading of it. A single sighting
 * (no `priorGrade` at all — the item was only met once this visit, as every
 * item in a review lesson is, see `generator.ts`'s dedupe-by-key `refs`)
 * has nothing to confirm against and is trusted as-is, exactly as before
 * this function existed.
 *
 * Majority-vote across every sighting was considered and rejected: it
 * throws away recency, which is the thing that makes trusting a recent
 * sighting correct in the first place. A learner right, right, right, then
 * wrong, wrong at the very end of a lesson forgot this item within the
 * session — majority-vote would still schedule that as mastered; this does
 * not.
 */
function finalGradeOf({ grade, priorGrade }: PendingGrade): SrsGrade {
  if (priorGrade === undefined) return grade;
  const agrees = (grade === 'again') === (priorGrade === 'again');
  return agrees ? grade : 'again';
}

/**
 * Applies every item's grade (see `finalGradeOf`), exactly once each, then
 * clears `pending` — so a later call (a safety-net unmount flush after an
 * already-completed lesson already flushed explicitly, say) finds nothing
 * left to apply and is a harmless no-op rather than a second SRS review for
 * the same sighting.
 */
export function flushSessionGrades(
  pending: PendingGrades,
  gradeItem: (id: string, type: string, grade: SrsGrade) => void
): void {
  for (const entry of pending.values()) gradeItem(entry.id, entry.type, finalGradeOf(entry));
  pending.clear();
}
