import type { Letter, PositionKey } from '../data/letters';

/**
 * Is `picked` a correct answer to "which position is this letter showing?"
 * when the exercise actually generated `position`?
 *
 * Pulled out of `LetterFormExercise` (`LetterExercises.tsx`) the same way
 * `isCorrectTap` was pulled out of `LetterSpot` (URD-045) — a full component
 * render is disproportionate for one grading decision, and a mutation to
 * this one line (e.g. back to `picked === position`) would otherwise pass
 * every existing check silently.
 *
 * URD-054: comparing glyphs rather than position *names* is the fix. A
 * non-connecting letter (`connects: false` — 13 letters total, `alif`,
 * `daal`, `re` and 10 others) only ever joins from the right, so
 * `letter.forms.isolated === letter.forms.initial` and `letter.forms.medial
 * === letter.forms.final` as literal identical strings (see
 * `nonConnector()` in `data/letters.ts`).
 * Grading strictly by name used to mark a learner wrong for a glyph they
 * read correctly: shown the `initial` shape for `alif`, answering
 * `isolated` sees the exact same pixels and was told no. For every
 * `connects: true` letter all four forms are pairwise distinct strings
 * (see `connector()`'s own definition), so this changes nothing about how
 * those letters are graded — `picked === position` and "same glyph as
 * position" agree on every connecting letter, by construction.
 */
export function isCorrectPosition(letter: Letter, position: PositionKey, picked: PositionKey): boolean {
  return letter.forms[picked] === letter.forms[position];
}
