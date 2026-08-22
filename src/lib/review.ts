/**
 * Which words and letters a review lesson should draw on, and in what order
 * of preference.
 *
 * `fallbackReviewRefs` (`src/exercises/generator.ts`) used to draw uniformly
 * from every word and letter taught anywhere up to the review — the right
 * question for "has this learner seen this at all", and the wrong one for "is
 * this review mostly about the unit it closes". Measured on real generated
 * output with nothing due: rev-gender-and-number (u6) drew 0-5% of its words
 * from u6 itself, and rev-the-wider-world (then a single, larger u39; split
 * by URD-A02 into u40/u41) drew 3-5% from its own unit. A unit's
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

import { UNITS, ALL_LESSONS, type Lesson } from '../data/units';
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
 * What the path has actually taught by the time a given lesson is reached —
 * every letter and word introduced strictly before it, course-wide.
 *
 * This used to be an *upper bound* rather than a record: a vocab lesson
 * showed a random handful of its topic while this counted the whole topic
 * taught the moment any lesson touched it. Nineteen words claimed for a
 * lesson that had shown three. That gap is gone — a vocabulary lesson now
 * carries `wordIds`, exactly the words it introduces, so this walks the same
 * list the learner actually saw. The fallback to a lesson's whole topic
 * remains for the case that still needs it: a lesson without `wordIds` is a
 * synthetic practice drill, which ranges over a whole topic by design.
 *
 * A lesson id placed nowhere on the path (a synthetic practice review, say)
 * never satisfies the `break` and so returns everything the course teaches,
 * end to end — the honest answer for "what has this learner seen" when the
 * lesson itself carries no position to stop at.
 */
export function taughtUpTo(lessonId: string): TaughtPool {
  const letters: string[] = [];
  const words: string[] = [];
  for (const l of ALL_LESSONS) {
    if (l.kind === 'letters' && l.letterIds) letters.push(...l.letterIds);
    if (l.kind === 'vocab' && l.topic) {
      words.push(...(l.wordIds ?? wordsByTopic(l.topic).map((w) => w.id)));
    }
    if (l.id === lessonId) break;
  }
  return { letters, words };
}

/**
 * URD-026: which grammar concepts a `G()` lesson has already taught by the
 * time a learner reaches `lessonId` — the same walk-the-path-and-break
 * pattern `taughtUpTo` uses for letters and words, applied to grammar
 * concepts instead, since nothing tracked concept readiness at all before
 * this. Word-level readiness already existed (`readableFormsAt`,
 * `generator.ts`) and caught a real bug (a sentence using a word before its
 * teaching lesson) — this is the same guarantee for the grammatical
 * *construction* a sentence illustrates, which the word-level filter cannot
 * see: a sentence can pass every word through `readableFormsAt` while still
 * being built entirely around a tense or case the learner has never met.
 *
 * A lesson id placed nowhere on the path returns every concept the course
 * ever teaches, end to end — the same honest fallback `taughtUpTo` gives for
 * letters/words, for the same reason (a synthetic practice lesson has no
 * position to stop at).
 */
export function taughtConceptsUpTo(lessonId: string): ReadonlySet<string> {
  const concepts = new Set<string>();
  for (const l of ALL_LESSONS) {
    if (l.kind === 'grammar' && l.conceptId) concepts.add(l.conceptId);
    if (l.id === lessonId) break;
  }
  return concepts;
}

/**
 * What share of a review's fallback questions should be letters rather than
 * words, given how much of each the course has taught by that point.
 *
 * `fallbackReviewRefs` (`generator.ts`) used to split every review's
 * fallback content `Math.ceil(n / 2)` letters, `Math.floor(n / 2)` words,
 * unconditionally — the same fixed ratio at a review two units after the
 * alphabet finished and one thirty-two units after. Every `L(...)` lesson
 * lives in units 1-9 (`grep "L([0-9]" src/data/units.ts`), so a review that
 * far out has nothing new to say about letters, yet spent half its questions
 * on them anyway. Measured on real course data: cumulative letters-vs-words
 * taught gives a letter share of 18.2% at rev-first-faces (u1) — already
 * below the old fixed 50%, because most units teach several words alongside
 * a letter group — falling to 2.0% by rev-the-wider-world (u41, the
 * course's last unit after URD-A02 split its old, larger u39 in two),
 * monotonically, as word teaching keeps going long after the last letter
 * lesson does.
 *
 * The fix ties the split to that same measure instead of a constant: a
 * review's letter share is exactly the letters' share of everything taught
 * course-wide by that point. No unit past u9 teaches a letter at all, so
 * this decays toward zero on its own as the course moves on — nothing here
 * needs to know where the alphabet units end.
 *
 * `0.5` only when nothing at all has been taught yet (both counts zero) —
 * preserves the old 50/50 behaviour for a hypothetical lesson with no
 * course history behind it, rather than dividing by zero.
 */
export function reviewLetterShare(courseWideWords: readonly string[], courseWideLetters: readonly string[]): number {
  const total = courseWideWords.length + courseWideLetters.length;
  return total === 0 ? 0.5 : courseWideLetters.length / total;
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
