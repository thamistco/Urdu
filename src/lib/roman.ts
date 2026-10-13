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
const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

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
    .replace(/[^a-z]/g, '') // ezafe hyphens, spaces, apostrophes
    .replace(/ee/g, 'i') // peeta / pita
    .replace(/oo/g, 'o') // hoon / hon
    .replace(/ei/g, 'ai') // mein / main
    // ai and e: Roman Urdu writes them interchangeably, and a final ay too:
    // hai / he, kaise / kaisay, joote / jootay, jahez / jehaiz (QA, 2026-10-13,
    // H3). ka / ke / ki stay apart: none of them is an ai.
    .replace(/ay$/, 'e')
    .replace(/ai/g, 'e')
    // ژ is zh, and ض is written dh by Arabic convention (kurra-e-ardh for
    // kurra-e-arz). Only a final dh: inside a word it is the aspirated د of
    // dhoop and dhobi.
    .replace(/zh/g, 'z')
    .replace(/dh$/, 'z')
    .replace(/(.)\1+/g, '$1') // kitaab → kitab
    .replace(/u/g, 'o') // hun / hoon, khush / khoosh
    .replace(/w/g, 'v') // wo / vo, waqt / vaqt
    .replace(/ck/g, 'k')
    .replace(/q/g, 'k') // qalam / kalam: ق is written k as often as q
    .replace(/y$/, 'i'); // achhy / achhi
}

/** The skeleton a romanisation reduces to, for building `nearMiss`'s list of taken spellings. */
export const romanSkeleton = (s: string) => skeleton(s);

/** Edit distance, stopping early once it passes `max`. */
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    if (Math.min(...row) > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
}

/**
 * A spelling one letter away from the word, and from no other word.
 *
 * The skeleton absorbs the disagreements romanisers have by convention, but
 * not the ones learners make by ear, and QA testers had about twenty natural
 * spellings refused (2026-10-12): garm for garam, chadhna for chaṛhna,
 * pattar for patthar, kharach for kharch, kanstar for kanastar. Each is one
 * letter off once the conventions are folded away.
 *
 * Accepted only where that cannot be a different word: the word's skeleton is
 * at least four letters (three-letter words sit a letter apart from each other
 * all over Urdu, ret and rat among them), and what was typed is not itself the
 * skeleton of any other word the course teaches (`taken`). zehen for zaheen
 * stays wrong: zehn is a word, and three letters away.
 */
export function nearMiss(input: string, roman: string, taken: ReadonlySet<string>): boolean {
  const typed = skeleton(input.trim());
  if (typed.length < 3 || taken.has(typed)) return false;
  return spellings(roman).some((variant) => {
    const target = skeleton(variant);
    // Two slips allowed in a long word, one in a shorter one. A word of three
    // letters is in reach too now (reet for ret): what keeps rat from
    // passing for ret is that rat is itself a word, which `taken` knows.
    return target.length >= 3 && within(typed, target, target.length >= 8 ? 2 : 1);
  });
}

/** Urdu text with the marks and spacing that don't change the reading removed. */
function urduSkeleton(s: string): string {
  return s
    .replace(/[‎‏؜]/g, '') // bidi marks
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
  return spellings(roman).some((variant) => skeleton(variant) === target);
}

/**
 * The stored spellings, plus each with ṛ written d. The flap ڑ is written d
 * as often as r (laṛka, ladka; chaṛhna, chadhna), and the skeleton only knew
 * it as r, so ladka was a near miss at best and chadhna for chaṛhna was the
 * report's first example (QA report v3, H3).
 */
function spellings(roman: string): string[] {
  return roman.split('/').flatMap((v) => (/ṛ/i.test(v) ? [v, v.replace(/ṛ/g, 'd').replace(/Ṛ/g, 'D')] : [v]));
}

/** True when the learner typed Urdu letters rather than the Latin alphabet. */
export const looksLikeUrdu = (s: string) => /[؀-ۿ]/.test(s);
