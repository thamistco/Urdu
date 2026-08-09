/**
 * Whether a sighting of an item should update its spaced-repetition state.
 *
 * A lesson can meet the same word or letter more than once — that is the
 * whole point of the staggered vocabulary pipeline and the letter pipeline
 * (`generator.ts`), which exist because meeting something once and moving on
 * teaches worse than meeting it several times in different shapes. But every
 * exercise component calls `onGraded` unconditionally (`LessonScreen.tsx`),
 * and until this existed, every one of those sightings independently called
 * `gradeItem`, which walks `SrsCard` through SM-2 (`src/lib/srs.ts`) as if it
 * were a separate day's review.
 *
 * Measured against the real curve: a letter met 6 times correctly in one
 * sitting — the number letters are now met, after the fix that made letter
 * lessons long enough to be a sitting — walks `reps` from 0 to 6 and the due
 * interval out to 98 days, from a single five-minute lesson with zero actual
 * time-spaced recall. Review, which exists specifically to bring material
 * back later (see URD-010), would not see that letter again for over three
 * months. The bug is not unique to letters — the vocabulary pipeline already
 * meets a new word three times a lesson — letters simply made it six times
 * worse and loud enough to be found.
 *
 * The fix is at the session boundary rather than in the scheduler: only the
 * first sighting of a given item in one lesson visit is real evidence for
 * spaced repetition, because it is the only one answered from a state where
 * the learner could still be wrong. Every sighting after that, in the same
 * sitting, is practice — worth the feedback, the hearts, the XP, but not a
 * second independent data point about whether this item will be remembered
 * tomorrow. So a lesson tracks which items it has already graded, and only
 * the first sighting of each is allowed through to `gradeItem`.
 */
export function shouldUpdateSrs(seenThisSession: Set<string>, item: { id: string; type: string }): boolean {
  const key = `${item.type}:${item.id}`;
  if (seenThisSession.has(key)) return false;
  seenThisSession.add(key);
  return true;
}
