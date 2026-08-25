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
import { LETTERS } from '../data/letters';
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
 * Grammar concept ids taught by a `G(...)` lesson in the same unit as
 * `lessonId` — the grammar-side equivalent of `taughtInUnit`'s letters and
 * words.
 *
 * URD-040: a review only ever drew on `taughtInUnit`'s vocabulary, never on
 * the grammar concept(s) its own unit's grammar lesson(s) taught — even
 * though a review exists to consolidate everything the unit covered.
 * rev-saying-who-you-are (u4, "Saying Who You Are") drew its entire review
 * from `V('rooms')`/`V('adjectives')` and never once touched `g-pronouns`
 * or `g-to-be`, the two concepts the unit is organized around and named
 * for.
 *
 * `[]`, not an error, for a unit with no grammar lesson of its own — the
 * common case, since grammar teaching clusters early in the course the same
 * way letters do (measured: at most 2 concepts in any one unit, most units
 * past the first several have 0). Also `[]` for a lesson id placed in no
 * unit at all, matching `taughtInUnit`'s own `null`-for-letters-and-words
 * rule applied to a plain array instead.
 */
export function conceptsInUnit(lessonId: string): readonly string[] {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unit) return [];
  const concepts = new Set<string>();
  for (const l of unit.lessons) {
    if (l.kind === 'grammar' && l.conceptId) concepts.add(l.conceptId);
  }
  return [...concepts];
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
 * URD-042: rotates one fixed shuffle of `candidates` by `reviewIndex`,
 * rather than reshuffling independently per review the way `prioritizedPool`
 * does — the actual fix, not a style choice.
 *
 * An independent per-review shuffle of the same small, closed letter pool
 * leaves real gaps purely by chance: each review only samples the *top* of
 * its own draw, with no memory of what any other review already surfaced.
 * Measured directly on real course content before this fix: 19 of 40
 * letters, including `be`/`pe` — the very first pair taught, in `l-1` — and
 * three of the four Urdu "z"-sound letters, never appeared in a single
 * `letterForm`/`letterPick`/`letterTrace` exercise across 30 real reviews
 * with nothing due.
 *
 * Rotating one shared permutation instead means consecutive reviews (in
 * path order) walk consecutive starting points through the identical
 * ordering — so every candidate is guaranteed to surface within one lap
 * (`candidates.length` reviews), the guarantee independent reshuffling never
 * made no matter how many reviews accumulate. The shuffle itself is fixed
 * (keyed on a constant, not on `lessonId` or `reviewIndex`) precisely so
 * that rotating it is meaningful — rotating a *different* shuffle every
 * time would be back to independent sampling with extra steps.
 */
export function rotatingCoverageOrder(candidates: readonly string[], reviewIndex: number): string[] {
  if (candidates.length === 0) return [];
  const order = seededShuffle(candidates, 'review-letter-coverage');
  const offset = ((reviewIndex % order.length) + order.length) % order.length;
  return [...order.slice(offset), ...order.slice(0, offset)];
}

/**
 * The letter-side equivalent of `prioritizedPool`, rotating each tier via
 * `rotatingCoverageOrder` instead of reshuffling it fresh per call. See that
 * function's own comment for why: words (2,281 of them) have no realistic
 * coverage pressure across ~41 reviews drawing a handful each, but letters
 * (40, drawing as few as one per review from about u14 on, URD-017) do.
 */
function prioritizedLetterPool(tiers: readonly (readonly string[])[], reviewIndex: number): string[] {
  const chosen: string[] = [];
  const have = new Set<string>();
  for (const tier of tiers) {
    const fresh = tier.filter((id) => !have.has(id));
    for (const id of rotatingCoverageOrder(fresh, reviewIndex)) {
      chosen.push(id);
      have.add(id);
    }
  }
  return chosen;
}

/**
 * Which review lesson (by id) is responsible for guaranteeing each letter's
 * first review appearance — computed once for the whole course, not per
 * call.
 *
 * `rotatingCoverageOrder` alone still can't guarantee full coverage: the
 * candidate set it rotates (`courseWideLetters`) is itself cumulative, so
 * it *grows* across the first several reviews rather than staying fixed.
 * Rotating a growing set isn't walking one stable permutation — a review's
 * `reviewIndex` offset can land on a letter that review's own position
 * hasn't taught yet, and that offset's one shot at ever being "first" for
 * that letter is gone, not deferred. Measured directly: rotation alone
 * (no assignment) still missed 6 of 40 letters across all 41 real reviews,
 * even though total letter-question capacity across all reviews (58,
 * measured directly) comfortably exceeds the alphabet (40).
 *
 * This walks every review lesson in path order once, treating a single
 * fixed shuffle of all 40 letters (the same shuffle `rotatingCoverageOrder`
 * itself rotates, so the two mechanisms agree on one canonical ordering
 * rather than drifting apart) as a claim queue: each review claims the
 * earliest still-unclaimed letter in that queue already taught by its own
 * position (`taughtUpTo`). Since every letter is taught by the time the
 * course's last review is reached, and total capacity exceeds the
 * alphabet, every letter is guaranteed a claiming review before the
 * course ends — a review lesson not on the path (`practice-review`) is
 * never in `reviews` here and so never claims one, which is correct: it
 * isn't positioned anywhere for "taught by this point" to mean anything.
 */
function computeLetterCoverageAssignment(): ReadonlyMap<string, string> {
  const reviews = ALL_LESSONS.filter((l) => l.kind === 'review');
  const queue = seededShuffle(
    LETTERS.map((l) => l.id),
    'review-letter-coverage'
  );
  const unclaimed = new Set(queue);
  const assignment = new Map<string, string>();
  for (const review of reviews) {
    if (unclaimed.size === 0) break;
    const eligible = new Set(taughtUpTo(review.id).letters);
    const claim = queue.find((id) => unclaimed.has(id) && eligible.has(id));
    if (claim) {
      assignment.set(review.id, claim);
      unclaimed.delete(claim);
    }
  }
  return assignment;
}

// `ALL_LESSONS` (and so this assignment) is fixed at build time — computed
// once, lazily, the first time it's actually needed, rather than on every
// module load or every call.
let coverageAssignmentCache: ReadonlyMap<string, string> | null = null;
function letterCoverageAssignment(): ReadonlyMap<string, string> {
  if (!coverageAssignmentCache) coverageAssignmentCache = computeLetterCoverageAssignment();
  return coverageAssignmentCache;
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
  corpus: readonly string[],
  /**
   * URD-039: how many times this review has already been completed —
   * `completedLessons[lessonId]?.done` in the progress store, `0` for a
   * lesson id nothing has been graded on yet. Folded into the shuffle seed
   * so the fallback slice rotates as a learner replays the same review,
   * rather than reproducing byte-identically forever. See `prioritizedPool`'s
   * doc comment for why *which* tier this affects at all is limited: once a
   * learner has graded a unit's whole word list, `seen(unit?.words ?? [])`
   * is the entire unit in one tier, and a fixed seed always sliced off the
   * same subset of it — measured directly on rev-gender-and-number (u6, 20
   * words all known): the same 4 words on every single call, the other 16
   * never once surfacing this way.
   */
  visit = 0
): string[] {
  const unit = lessonId ? taughtInUnit(lessonId) : null;
  const seen = (ids: readonly string[]) => ids.filter((id) => known.has(id));
  const seedBase = `${lessonId ?? 'review'}:words:${visit}`;
  if (anythingKnown(known, courseWideWords, courseWideLetters)) {
    return prioritizedPool([seen(unit?.words ?? []), seen(courseWideWords)], seedBase);
  }
  return prioritizedPool([unit?.words ?? [], courseWideWords, corpus], seedBase);
}

/**
 * The letter-side equivalent of `reviewWordPool` — except tiers are ordered
 * by `prioritizedLetterPool`'s rotation, not `prioritizedPool`'s independent
 * per-call shuffle. See `rotatingCoverageOrder`'s comment for why letters
 * specifically need this and words (2,281 of them, no realistic coverage
 * pressure) don't.
 */
export function reviewLetterPool(
  lessonId: string | undefined,
  known: ReadonlySet<string>,
  courseWideWords: readonly string[],
  courseWideLetters: readonly string[],
  corpus: readonly string[],
  /** URD-039: see `reviewWordPool`'s `visit` parameter. */
  visit = 0,
  /**
   * URD-042: which review lesson, in path order, this is among every
   * review lesson (`0` for a lesson not placed on the path at all, like
   * `practice-review` — see `generator.ts`'s own `reviewIndex`). Combined
   * additively with `visit` into a single rotation offset: `reviewIndex`
   * alone varies coverage across *different* reviews (this item's own
   * fix), `visit` alone still varies the same review's own pick across
   * *repeat* visits (URD-039, unaffected by this change — a lesson id
   * omitted or not on the path always contributes `reviewIndex = 0`, so
   * `visit` is the only axis that moves there, exactly as before).
   */
  reviewIndex = 0
): string[] {
  const unit = lessonId ? taughtInUnit(lessonId) : null;
  const seen = (ids: readonly string[]) => ids.filter((id) => known.has(id));
  const rotation = reviewIndex + visit;
  const pool = anythingKnown(known, courseWideWords, courseWideLetters)
    ? prioritizedLetterPool([seen(unit?.letters ?? []), seen(courseWideLetters)], rotation)
    : prioritizedLetterPool([unit?.letters ?? [], courseWideLetters, corpus], rotation);
  /**
   * URD-042: force this review's assigned coverage letter (if it has one)
   * to the very front on its first visit — the actual full-coverage
   * guarantee, `rotatingCoverageOrder` alone only improves the odds. Only
   * if it's already a legitimate candidate for *this specific call*
   * (present in `pool`, which already reflects whatever `known`-restriction
   * applies): a learner who hasn't actually been graded on their assigned
   * letter yet doesn't get it forced on them — `check:srs`'s "never
   * surface material outside what the learner has been graded on" still
   * holds. That review simply doesn't fulfill its assignment for *that*
   * learner's state, which is a real, honest gap for an individual
   * mid-course, not the whole-course sweep this item's own verify text
   * checks.
   *
   * CURRICULUM CRITIC: `visit === 0` only — a first version forced the
   * assignment on every visit unconditionally, which silently reintroduced
   * URD-039's own bug on the letter axis: with `letterCount === 1` (the
   * norm from about u14 on, URD-017), `fallbackReviewRefs` takes exactly
   * `pool[0]`, so forcing the assigned letter every time froze 40 of 41
   * reviews to one single letter forever, for every replay, for every
   * learner — reproduced live, `rev-together` drew `daal` and only `daal`
   * across 6 sampled visits. The whole-course coverage guarantee only
   * needs each review's *first* visit to surface its assignment — a
   * learner playing the course straight through meets every letter once,
   * same as before — while every visit after that returns to the same
   * `rotation`-driven variety URD-039 already established, undoing none
   * of it.
   */
  const assigned = visit === 0 && lessonId ? letterCoverageAssignment().get(lessonId) : undefined;
  if (assigned && pool.includes(assigned)) {
    return [assigned, ...pool.filter((id) => id !== assigned)];
  }
  return pool;
}

/** Has the learner been graded on anything at all reachable from this review — of either type? */
function anythingKnown(
  known: ReadonlySet<string>,
  courseWideWords: readonly string[],
  courseWideLetters: readonly string[]
): boolean {
  return courseWideWords.some((id) => known.has(id)) || courseWideLetters.some((id) => known.has(id));
}
