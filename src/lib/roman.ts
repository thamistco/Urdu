/**
 * Matching what a learner types against a word.
 *
 * Typing is the only exercise that asks for free recall, which makes it the
 * most valuable one — and the easiest to make infuriating. Urdu has no settled
 * romanisation: کتاب is written kitaab, kitab or kitāb; ہوں is hoon or hun;
 * وہ is wo or vo. Marking any of those wrong teaches the learner nothing except
 * to distrust the app.
 *
 * So both sides are reduced to a skeleton before comparing, and anything that
 * survives is accepted. The reduction is deliberately lossy: it can let a near
 * miss through (کام "work" and کم "less" both reduce to "kam"), which is the
 * right trade when the alternative is rejecting a learner who knew the answer.
 * We are testing recall of the word, not of one spelling convention.
 *
 * Typing the Urdu script itself is always accepted too, and is checked first.
 */

/** Strip the marks Urdu romanisation uses for retroflex and long vowels. */
const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Drop everything romanisers disagree about: vowel length, hyphens, spaces,
 * and the o/u and ee/i choices.
 *
 * `e` and `i` are folded only in the doubled form (`ee` → `i`, so peeta and
 * pita agree). A blanket e↔i fold would collapse کے, کی and کا into one, and
 * telling those apart is a whole grammar lesson.
 */
function skeleton(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z]/g, '')      // ezafe hyphens, spaces, apostrophes
    .replace(/ee/g, 'i')         // peeta / pita
    .replace(/oo/g, 'o')         // hoon / hon
    .replace(/ei/g, 'ai')        // mein / main
    .replace(/(.)\1+/g, '$1')    // kitaab → kitab
    .replace(/u/g, 'o')          // hun / hoon, khush / khoosh
    .replace(/w/g, 'v')          // wo / vo, waqt / vaqt
    .replace(/ck/g, 'k')
    .replace(/y$/, 'i');         // achhy / achhi
}

/** Urdu text with the marks and spacing that don't change the reading removed. */
function urduSkeleton(s: string): string {
  return s
    .replace(/[‎‏؜]/g, '')  // bidi marks
    .replace(/[ً-ْٰ]/g, '') // harakat, if anyone types them
    .replace(/\s+/g, '');
}

/**
 * Does `input` name this word? Accepts the Urdu script or any reasonable
 * romanisation. `roman` may hold several spellings separated by `/`.
 */
export function matchesWord(input: string, urdu: string, roman: string): boolean {
  const typed = input.trim();
  if (!typed) return false;

  if (urduSkeleton(typed) === urduSkeleton(urdu)) return true;

  const target = skeleton(typed);
  if (!target) return false;
  return roman.split('/').some((variant) => skeleton(variant) === target);
}

/** True when the learner typed Urdu letters rather than the Latin alphabet. */
export const looksLikeUrdu = (s: string) => /[؀-ۿ]/.test(s);
