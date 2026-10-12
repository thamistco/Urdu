/**
 * Teaching prose with the script taken out, for the Roman track.
 *
 * The grammar cards are written once, for every track, in the house style
 * `اردو (roman, gloss)`: the script, then its romanisation and any gloss in
 * brackets. A learner who chose Roman only asked not to be taught the script,
 * and a tester on that track met a paragraph of Nastaliq on every grammar card
 * (tester report, 2026-10-12). So each script run that carries its own
 * romanisation is replaced by it, and whatever else was in the brackets stays
 * in brackets: `تھا (tha, m. sing.)` becomes `tha (m. sing.)`.
 *
 * The romanisation ends at the comma that ends the Urdu. A run containing the
 * Urdu comma ، has a comma in its romanisation too, so the split is made after
 * as many commas as the script had, not at the first one:
 * `جو آدمی آیا، وہ میرا دوست ہے (jo aadmi aaya, wo mera dost hai)` keeps the
 * whole sentence rather than turning half of it into a gloss.
 *
 * The same goes for the shorter forms the prose uses where brackets would
 * nest: `لڑکا → laṛka`, `مگر / magar`, `پڑھی/paṛhi`, and `(پسند ہونا, pasand
 * hona)` inside a bracket that is already open. The script and its separator
 * go; the romanisation stays.
 *
 * A script run with no romanisation after it is left alone. Showing the script
 * is wrong on this track, but deleting it would leave a sentence with a hole in
 * it, which is worse; `scriptLeftIn` lets a test hold the content to having
 * none.
 */

const SCRIPT = '\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF';
/** A run of script, allowing the joiners the prose uses inside one: spaces,
 *  the hyphens of ‑تا, the ellipsis of جو…وہ, slashes between alternatives. */
const RUN = new RegExp(`[‑-]?[${SCRIPT}](?:[${SCRIPT}\\s‑…/-]*[${SCRIPT}])?[؟]?\\s*\\(([^()]*)\\)`, 'gu');
/** Script followed by → , or / and then the romanisation. */
const LEAD = new RegExp(`[‑-]?[${SCRIPT}](?:[${SCRIPT}\\s‑…-]*[${SCRIPT}])?\\s*(?:→|/|,)\\s*(?=[‑-]?[A-Za-z])`, 'gu');
const ANY_SCRIPT = new RegExp(`[${SCRIPT}]`, 'u');

export function romanProse(text: string): string {
  return bracketed(text).replace(LEAD, '');
}

function bracketed(text: string): string {
  return text.replace(RUN, (whole, inside: string) => {
    const script = whole.slice(0, whole.lastIndexOf('('));
    const commas = (script.match(/،/g) ?? []).length;
    const parts = inside.split(', ');
    const roman = parts.slice(0, commas + 1).join(', ');
    const rest = parts.slice(commas + 1).join(', ');
    // Brackets that held only English, like (m.) or (“I eat”), are a gloss on
    // script with no romanisation; leave the whole thing as it was.
    if (!roman.trim()) return whole;
    return rest ? `${roman} (${rest})` : roman;
  });
}

/** The script still showing after `romanProse`, for content tests. */
export function scriptLeftIn(text: string): boolean {
  return ANY_SCRIPT.test(romanProse(text));
}
