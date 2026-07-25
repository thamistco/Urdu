/**
 * Romanising a piece of Urdu the app is about to show.
 *
 * On the Roman track nothing is rendered in Nastaliq, so anything that would
 * have been shown as script needs a transliteration to show instead. Almost
 * everything already carries one — words, phrases, sentences, passage and
 * dialogue lines all have a `roman` field written alongside the script. What
 * does not are the loose Urdu strings inside grammar drills, and this resolves
 * those.
 *
 * Lookup is vocabulary first, then the grammatical-forms table, so a form that
 * is also a real word is romanised the way the course teaches it.
 *
 * Distinct from `roman.ts`, which goes the other way: that one decides whether
 * what a learner typed counts as a given word.
 */

import { WORDS, PHRASES } from '../data/words';
import { SENTENCES } from '../data/sentences';
import { GRAMMAR_TRANSLIT } from '../data/translit';

const TABLE: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const w of WORDS) if (!m.has(w.urdu)) m.set(w.urdu, w.roman);
  for (const p of PHRASES) if (!m.has(p.urdu)) m.set(p.urdu, p.roman);
  for (const [urdu, roman] of Object.entries(GRAMMAR_TRANSLIT)) if (!m.has(urdu)) m.set(urdu, roman);

  /**
   * Every sentence is written twice — once in script as an array of words,
   * once in Roman as a string — and the two line up word for word. That is a
   * transliteration for every word used in a sentence, already written and
   * already checked, so it is read off rather than duplicated by hand. (The
   * audit holds the alignment to exactly one Roman token per script word,
   * which is what makes this safe.)
   */
  for (const s of SENTENCES) {
    const tokens = s.roman.trim().split(/\s+/);
    if (tokens.length !== s.words.length) continue;
    s.words.forEach((w, i) => {
      if (!m.has(w)) m.set(w, tokens[i].replace(/[.,?;!]+$/, ''));
    });
  }
  return m;
})();

/** Urdu punctuation that should survive romanisation, in its Latin form. */
const PUNCT: Record<string, string> = { '۔': '.', '،': ',', '؟': '?', '؛': ';' };

/**
 * The Roman form of a single Urdu token, or `undefined` if we do not have one.
 *
 * Deliberately not a guess: there is no letter-by-letter fallback, because a
 * mechanical transliteration of Urdu is wrong more often than right — short
 * vowels are not written — and showing a learner a plausible-looking wrong
 * spelling is worse than not offering the exercise. Callers treat `undefined`
 * as "this item cannot be shown on the Roman track".
 */
export function romanOf(urdu: string): string | undefined {
  const trimmed = urdu.trim();
  if (!trimmed) return trimmed;

  const direct = TABLE.get(trimmed);
  if (direct) return direct;

  // strip trailing punctuation and try again, keeping the punctuation
  const m = trimmed.match(/^(.*?)([۔،؟؛?!.]+)$/);
  if (m) {
    const base = TABLE.get(m[1]);
    if (base) return base + [...m[2]].map((c) => PUNCT[c] ?? c).join('');
  }
  return undefined;
}

/** Romanise every token, or give up if any single one is unknown. */
export function romanAll(tokens: string[]): string[] | undefined {
  const out: string[] = [];
  for (const t of tokens) {
    const r = romanOf(t);
    if (r === undefined) return undefined;
    out.push(r);
  }
  return out;
}
