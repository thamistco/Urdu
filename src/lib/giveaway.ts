/**
 * Does spelling this word out in Roman letters also hand over its English
 * meaning?
 *
 * For most of the vocabulary it does not: چاند reads `chaand`, which tells a
 * learner how to say it and nothing about the moon. But Urdu has taken a large
 * number of loanwords, and for those the transliteration *is* the answer —
 * اردو reads `urdu` above an option list containing "Urdu", پنسل reads
 * `pencil`, ٹرین reads `train`. 79 words in the course are like this.
 *
 * That matters only where the English is what is being asked for. Showing the
 * Roman under the script is otherwise a decoding aid, and removing it
 * everywhere would take a real support away from the hard words to fix the easy
 * ones.
 *
 * Compared after stripping the diacritics the scheme uses for retroflex and
 * long vowels, since `ṭrain` and "train" differ only in those. One edit of
 * slack covers the vowel the two spellings disagree about — `sweaṭar` against
 * "sweater", `baig` against "bag" — without pulling in words that merely share
 * a few letters.
 */

const bare = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    // combining marks: the ṭ/ḍ/ṛ dots and the ñ tilde
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');

/** Levenshtein distance, small strings only. */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return rows[a.length][b.length];
}

/**
 * True when `roman` is close enough to any gloss in `meaning` that a learner
 * could answer from the transliteration alone.
 *
 * `meaning` may be a slash-separated list ("leopard / cheetah"); matching any
 * one of them is enough, because any one of them is a correct answer.
 */
export function romanRevealsMeaning(roman: string | undefined, meaning: string): boolean {
  if (!roman) return false;
  const r = bare(roman);
  if (!r) return false;
  return meaning
    .split('/')
    .map(bare)
    .filter(Boolean)
    .some((gloss) => {
      const d = distance(r, gloss);
      // one edit outright, or a quarter of the longer word for longer ones
      return d <= 1 || d / Math.max(r.length, gloss.length) <= 0.25;
    });
}
