/**
 * English spellings accepted when typing a word Urdu took from English.
 *
 * وہیل is whale and ڈاکٹر is doctor, said almost as in English. A learner who
 * types the English spelling has recalled the word, and was refused (QA,
 * 2026-10-13, H3). Listed by hand, not guessed: a guess would also let
 * through an English gloss of a word that is not a loan at all.
 */
export const LOANWORD_SPELLINGS: Record<string, string[]> = {
  'w-whale': ['whale'],
  'w-x-ray': ['x-ray', 'xray'],
  'w-doctor': ['doctor'],
  'w-motor': ['motor'],
};

const flat = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Whether `typed` is an accepted English spelling of this word. */
export function isLoanSpelling(wordId: string, typed: string): boolean {
  const t = flat(typed);
  return !!t && (LOANWORD_SPELLINGS[wordId] ?? []).some((s) => flat(s) === t);
}
