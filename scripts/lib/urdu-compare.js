/**
 * Comparing what a voice was asked to say with what it actually said.
 *
 * Split out of `check-pronunciation.js` because it is the only part of that
 * script that can be exercised without a network call and an API key, and
 * because every judgement the check makes rests on it. A speech-to-text
 * transcript never comes back character-identical to the text that was
 * synthesised, even when the audio is perfect, so a raw string comparison
 * would report the whole corpus as broken and be switched off within a day.
 *
 * What gets folded away, and why each one is safe to fold *for comparison*
 * (none of this touches the corpus or the audio — only the two strings being
 * held against each other):
 *
 *  - **Short vowels and other harakat** (U+064B–U+0652, U+0670). Urdu is
 *    written without them; the corpus adds them in `pronounce` precisely to
 *    steer the engine, and no recogniser emits them. Keeping them would flag
 *    every single word that has a `pronounce`.
 *  - **Tatweel and the zero-width joiners.** Presentation-level, never
 *    pronounced. `letters.ts` builds its position forms out of tatweel, so a
 *    letter clip would otherwise never match.
 *  - **Alef, yeh and heh variants.** A recogniser picks whichever codepoint
 *    its own lexicon prefers — ي vs ی, ه vs ہ, أ/إ/آ vs ا. These are real
 *    distinctions in writing and this is not the check that polices them
 *    (`check:roman` and the corpus's own tests do); folding them here stops
 *    a spelling-convention difference being reported as a mispronunciation.
 *  - **Punctuation and whitespace runs.** Not spoken.
 *
 * What is deliberately *not* folded: `ھ` is kept distinct from `ہ`. They are
 * different letters that the course spends a whole lesson separating (URD-067,
 * URD-071), and the aspirate is audible — کھانا and کہانا are different words.
 * Folding them would blind this check to the exact confusion the curriculum
 * cares most about.
 */

/** Harakat, tatweel, and the zero-width joiners — written, never spoken. */
const SILENT_MARKS = /[\u064B-\u0652\u0670\u0640\u200C-\u200F]/g;
/** Punctuation the corpus or a recogniser might emit, in either script. */
const PUNCTUATION = /[.,!?;:"'()[\]{}\u060C\u061B\u061F\u06D4\u2010-\u201F]/g;

/**
 * Fold a string to the form both sides can be compared in. Applied to the
 * synthesised text and the transcript alike, so any asymmetry is a real
 * difference rather than an artefact of one side's spelling conventions.
 */
function normalise(s) {
  return (s || '')
    .normalize('NFC')
    .replace(SILENT_MARKS, '')
    .replace(PUNCTUATION, ' ')
    .replace(/[أإآٱ]/g, 'ا') // alef variants → bare alef
    .replace(/[يیےې]/g, 'ی') // yeh variants → farsi yeh
    .replace(/ه/g, 'ہ') // arabic heh → urdu heh (ھ deliberately untouched)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance, iterative with a single row — these strings are short. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * How close a transcript is to the text that was spoken, 1 = identical.
 *
 * Character-level rather than word-level on purpose: most of this corpus is
 * single words and bare letters, where a word-level score can only ever be
 * 0 or 1 and tells you nothing about *how* wrong a miss is. The whole value
 * of this number is ranking near-misses below real ones.
 */
function similarity(said, heard) {
  const a = normalise(said);
  const b = normalise(heard);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

module.exports = { normalise, similarity, editDistance };
