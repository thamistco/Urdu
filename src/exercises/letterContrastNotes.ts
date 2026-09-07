import type { Letter } from '../data/letters';

/**
 * The lines a `letterContrast` shows after it has been answered.
 *
 * THE CRITIC, URD-047: the first version showed `letter.note` alone, and
 * justified it with examples like "Daal with one dot above" — which are real,
 * but are all *variant* notes. Every confusable bucket in `letters.ts` is one
 * base letter (`confusableWith` unset) plus its variants, and the notes were
 * written to that shape: a variant's note describes it **against its base**,
 * while a base's note describes it standing alone. So for the 13 base letters
 * the panel appeared, looked like an explanation, and explained nothing:
 * `daal`'s note is "A soft angled stroke..." with no mention of the dot that
 * separates it from `zaal`. `kaaf`'s was worse than useless — "The stroke on
 * top is part of the letter, not an accent. Do not drop it." is read by a
 * learner who has just wrongly tapped `gaaf`, which is precisely kaaf with a
 * *second* stroke on top, as endorsing the answer they got wrong.
 *
 * Fixed without writing new content, because the contrast is already there:
 * on a wrong answer the tapped letter's line is shown alongside the target's.
 * That gives a guarantee rather than a hope — a bucket holds exactly one base,
 * so any wrong answer has target ≠ tapped with both in the bucket, and at
 * least one of the two must therefore be a variant, whose line is contrastive
 * by construction. `letterContrastNotes.test.ts` asserts exactly that over
 * every real bucket and every possible wrong tap.
 */
export type ContrastLine = { letter: Letter; text: string };

/**
 * The contrastive opening of a letter's note.
 *
 * Four of the variant notes carry a long second half about which Arabic and
 * Persian loanwords use which "z" spelling — `ze`'s runs to 356 characters —
 * which is the right thing to have written down and the wrong register for a
 * two-second "which one has the dot" moment. Checked against all 29 letters
 * that can appear here: taking the first sentence yields exactly the contrast
 * for every variant ("Daal with one dot above.", "Seen with three dots above
 * the teeth.", "Kaaf with a second stroke on top, the tell for a hard g.")
 * and loses nothing a learner needs at this instant. The rest of the note is
 * not deleted, only deferred — it is still the letter's note everywhere else.
 */
export function contrastLine(letter: Letter): string {
  const [first] = letter.note.split(/(?<=\.)\s+/);
  return (first ?? letter.note).trim();
}

/**
 * What to show once `picked` has been tapped. The target always appears; the
 * tapped letter appears too when it was the wrong one, which is the case that
 * needs explaining and the case the guarantee above covers.
 */
export function contrastNotesFor(target: Letter, picked: Letter): ContrastLine[] {
  const lines: ContrastLine[] = [{ letter: target, text: contrastLine(target) }];
  if (picked.id !== target.id) lines.unshift({ letter: picked, text: contrastLine(picked) });
  return lines;
}
