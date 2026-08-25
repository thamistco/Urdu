import { useCallback, useEffect, useRef } from 'react';
import { recordSighting, flushSessionGrades, type PendingGrades } from '../lib/sessionGrading';
import type { SrsGrade } from '../lib/srs';
import type { Exercise, ItemRef } from '../exercises/types';

export type ApplyGrade = (id: string, type: string, grade: SrsGrade) => void;

/**
 * The ref/effect wiring `LessonScreen` uses to defer every graded item's SRS
 * update to the end of a lesson visit, rather than applying each sighting the
 * instant it's answered — extracted (URD-044) so the wiring itself, not just
 * `sessionGrading.ts`'s pure functions (already covered in isolation by
 * `sessionGrading.test.ts`), has a test that can actually fail if the
 * ref/effect plumbing regresses, not only the arithmetic underneath it. The
 * bug URD-019 fixed (the wrong sighting winning) lived in exactly this
 * integration, which had zero automated coverage anywhere in `check:all`
 * before this.
 *
 * A new `Map` is created per visit (keyed on `exercises`/`applyGrade`
 * identity), closed over by that effect's own cleanup — so the cleanup
 * always flushes exactly the visit it belongs to, never one a later reset
 * has already replaced `pendingGrades.current` with. The cleanup fires both
 * on a visit change (a new lesson, or the same lesson reopened) and on
 * unmount, so nothing pending is ever silently dropped by a route this
 * component didn't anticipate.
 *
 * `flushNow` is exposed for the one place besides unmount that needs an
 * explicit flush: `LessonScreen`'s `advance()`, which persists XP/streak/gems
 * immediately on finishing a lesson and renders `LessonComplete` in the same
 * mounted screen — so grading can't wait for unmount alone, or closing the
 * app from the results screen would keep the rewards but lose the SRS
 * grading. Calling `flushNow` and then letting the unmount cleanup fire
 * later is safe: `flushSessionGrades` clears `pending` after applying, so the
 * second call is a harmless no-op, never a duplicate SRS review for the same
 * sighting.
 */
export function useSessionGradeFlush(exercises: readonly Exercise[], applyGrade: ApplyGrade) {
  const pendingGrades = useRef<PendingGrades>(new Map());
  useEffect(() => {
    const thisVisit: PendingGrades = new Map();
    pendingGrades.current = thisVisit;
    return () => flushSessionGrades(thisVisit, applyGrade);
  }, [exercises, applyGrade]);

  /**
   * Both returned callbacks are memoized so their identity stays stable
   * across renders that don't actually change what they close over —
   * `pendingGrades` is a ref (stable for the component's whole lifetime by
   * construction), so `record` needs no dependency at all and `flushNow`
   * needs only `applyGrade`. Without this, every caller that puts one of
   * these in its own `useCallback`/`useEffect` dependency array (as
   * `LessonScreen`'s `onGraded` does) would be forced to either omit it
   * (an exhaustive-deps lint violation) or recreate its own callback on
   * every render regardless of whether anything it actually depends on
   * changed — the exact "callback rebuilt every render" class of bug this
   * file's own `onGraded` doc comment already names as a real one it was
   * bitten by once (a missing dependency judged every answer against
   * exercise 0 for the rest of the lesson).
   */
  const record = useCallback(
    (item: ItemRef, grade: SrsGrade) => recordSighting(pendingGrades.current, item, grade),
    []
  );
  const flushNow = useCallback(() => flushSessionGrades(pendingGrades.current, applyGrade), [applyGrade]);

  return { record, flushNow };
}
