/**
 * The letters a word build asks for: its code points, without spaces and
 * without vowel marks.
 *
 * A mark the spelling carried became a required tile: the pesh of اُفق, the
 * shadda of پتّا and چلّانا, the tanween of فوراً, the kasra of every izafat
 * (QA, 2026-10-13, M9). Typing has always ignored them, and a mark on a tile
 * of its own is a near-empty square that tests nothing a learner can read.
 * The answer card still shows the word as written, marks and all.
 */
export const VOWEL_MARKS = /[ً-ٰٟ]/;

export function buildLetters(urdu: string): string[] {
  return Array.from(urdu).filter((c) => c.trim().length > 0 && !VOWEL_MARKS.test(c));
}
