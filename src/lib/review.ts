/**
 * Which words and letters a review lesson should draw on, and in what order
 * of preference.
 *
 * `fallbackReviewRefs` (`src/exercises/generator.ts`) used to draw uniformly
 * from every word and letter taught anywhere up to the review — the right
 * question for "has this learner seen this at all", and the wrong one for "is
 * this review mostly about the unit it closes". Measured on real generated
 * output with nothing due: rev-gender-and-number (u6) drew 0-5% of its words
 * from u6 itself, and rev-the-wider-world (u39) drew 3-5% from u39. A unit's
 * own dozen-or-so words are a rounding error against the hundreds taught
 * before it, so a flat course-wide pool all but guarantees a review is mostly
 * about everything except the unit whose name it carries.
 *
 * The fix is scope, not randomness: prefer the closing unit's own words and
 * letters, and fall back to the wider course only for whatever the unit
 * itself cannot supply — which genuinely happens. `rev-your-first-readings`
 * closes a unit of reading, sentence and dialogue lessons with no vocabulary
 * lesson of its own, and needs the fallback for all of it.
 */

import { UNITS, type Lesson } from '../data/units';
import { wordsByTopic } from '../data/words';
import { seededShuffle } from './shuffle';

export type TaughtPool = { readonly letters: readonly string[]; readonly words: readonly string[] };

function taughtByLessons(lessons: readonly Lesson[]): TaughtPool {
  const letters: string[] = [];
  const words: string[] = [];
  for (const l of lessons) {
    if (l.kind === 'letters' && l.letterIds) letters.push(...l.letterIds);
    if (l.kind === 'vocab' && l.topic) {
      words.push(...(l.wordIds ?? wordsByTopic(l.topic).map((w) => w.id)));
    }
  }
  return { letters, words };
}

/**
 * Words/letters taught by lessons in the same unit as `lessonId` — not the
 * whole course up to that point.
 *
 * `null` for a lesson id that isn't placed in any unit at all (a synthetic
 * practice review, say, which isn't positioned on the path).
 */
export function taughtInUnit(lessonId: string): TaughtPool | null {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  return unit ? taughtByLessons(unit.lessons) : null;
}

/**
 * Concatenates pools in priority order, deduping against everything already
 * chosen — and shuffling *within* each tier independently, rather than
 * shuffling the whole concatenation together.
 *
 * That distinction is the actual fix, not a style choice: shuffling
 * everything as one list lets a huge low-priority tier dilute a tiny
 * high-priority one purely by chance, which is exactly how a flat,
 * course-wide pool drowned out a unit's own dozen words in the bug this
 * exists to close. Shuffling per tier and appending in order means the
 * highest-priority tier is exhausted, in a random order, before the next
 * tier contributes anything — so whichever ids the caller slices off the
 * front come from the highest-priority tier that could supply them.
 */
export function prioritizedPool(tiers: readonly (readonly string[])[], seedBase: string): string[] {
  const chosen: string[] = [];
  const have = new Set<string>();
  tiers.forEach((tier, i) => {
    const fresh = tier.filter((id) => !have.has(id));
    for (const id of seededShuffle(fresh, `${seedBase}:${i}`)) {
      chosen.push(id);
      have.add(id);
    }
  });
  return chosen;
}

/**
 * The word pool a review should draw from, in priority order: words from its
 * own unit the learner has already been graded on, then the rest of the
 * unit's words, then the same two tiers course-wide, then a fixed corpus
 * slice as a last resort for a lesson with no unit context at all.
 *
 * `courseWide` is `taughtUpTo`'s result (see `generator.ts`) — passed in
 * rather than recomputed here so there is exactly one place that walks the
 * whole course, not two that could drift apart.
 *
 * Whether `known` restricts the pool at all is an all-or-nothing decision,
 * not a per-tier preference — and getting that wrong is a real regression
 * this project already has a check for (`check-srs.js`, "a review with
 * nothing due never asks about a word outside what the learner has been
 * graded on"). A first draft of this treated "known within the unit" and
 * "taught course-wide, ungraded" as two tiers in the same list, so once the
 * unit's own known words ran out, the pool quietly widened to *anything*
 * taught anywhere — including material the learner had never been graded
 * on, which is exactly what that check exists to catch, and did.
 *
 * THE CRITIC, URD-016: that all-or-nothing decision has to be joint across
 * *both* words and letters, not decided separately per type — this
 * function used to look only at `known ∩ courseWideWords`. `known` is a
 * single flat set of every id the learner has been graded on regardless of
 * type (`Object.keys(srs)`, `LessonScreen.tsx`), and a learner who has
 * graded many words but zero letters is not synthetic: a long stretch on
 * the Roman track (which drops letter lessons from the path entirely,
 * `unitsForTrack` in `data/units.ts`) followed by switching to Script or
 * Both reaches exactly this state on the very next review. Deciding the
 * letter side alone found `known ∩ courseWideLetters` empty and widened to
 * every letter taught anywhere — reproduced live: 12 of 16 exercises were
 * letters the learner had never once been shown. Both pools now key off
 * whether *anything*, of either type, has been graded — so a learner known
 * on words alone gets a correctly-empty, never-taught-material letter pool
 * (topped up from more words elsewhere in the generator) rather than a
 * flooded one.
 */
export function reviewWordPool(
  lessonId: string | undefined,
  known: ReadonlySet<string>,
  courseWideWords: readonly string[],
  courseWideLetters: readonly string[],
  corpus: readonly string[]
): string[] {
  const unit = lessonId ? taughtInUnit(lessonId) : null;
  const seen = (ids: readonly string[]) => ids.filter((id) => known.has(id));
  const seedBase = `${lessonId ?? 'review'}:words`;
  if (anythingKnown(known, courseWideWords, courseWideLetters)) {
    return prioritizedPool([seen(unit?.words ?? []), seen(courseWideWords)], seedBase);
  }
  return prioritizedPool([unit?.words ?? [], courseWideWords, corpus], seedBase);
}

/** The letter-side equivalent of `reviewWordPool`. See its comment. */
export function reviewLetterPool(
  lessonId: string | undefined,
  known: ReadonlySet<string>,
  courseWideWords: readonly string[],
  courseWideLetters: readonly string[],
  corpus: readonly string[]
): string[] {
  const unit = lessonId ? taughtInUnit(lessonId) : null;
  const seen = (ids: readonly string[]) => ids.filter((id) => known.has(id));
  const seedBase = `${lessonId ?? 'review'}:letters`;
  if (anythingKnown(known, courseWideWords, courseWideLetters)) {
    return prioritizedPool([seen(unit?.letters ?? []), seen(courseWideLetters)], seedBase);
  }
  return prioritizedPool([unit?.letters ?? [], courseWideLetters, corpus], seedBase);
}

/** Has the learner been graded on anything at all reachable from this review — of either type? */
function anythingKnown(
  known: ReadonlySet<string>,
  courseWideWords: readonly string[],
  courseWideLetters: readonly string[]
): boolean {
  return courseWideWords.some((id) => known.has(id)) || courseWideLetters.some((id) => known.has(id));
}
