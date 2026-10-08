import type { SrsCard } from './srs';

/**
 * Word ids taken out of the course, and the word that teaches each one now.
 *
 * Three words were taught twice, once in the core list and once in their
 * topic, and one of the pair was spelled wrong (content review, 2026-10-08):
 * تبلہ for طبلہ, and اڈا beside اڈہ, سور beside سؤر. The core-list copies are
 * gone. A learner who already met one keeps its progress, moved onto the
 * word that remains, rather than a review card for a word that no longer
 * exists: one that would count as due on Home and never be shown.
 */
export const RETIRED_WORD_IDS: Readonly<Record<string, string>> = {
  'w-tabla2': 'w-tabla',
  'w-adda2': 'w-adda',
  'w-suar2': 'w-suar',
};

type Ids = { srs: Record<string, SrsCard>; srsType: Record<string, string>; learnedWords: string[] };

/**
 * Move a learner's progress off retired ids. A twin the learner already has
 * keeps its own card; the retired one is then dropped. Returns null when there
 * is nothing to change, so saved progress is not rewritten for nothing.
 */
export function retireWordIds<T extends Ids>(s: T, retired = RETIRED_WORD_IDS): Pick<T, keyof Ids> | null {
  const old = Object.keys(retired).filter((id) => id in s.srs || id in s.srsType || s.learnedWords.includes(id));
  if (!old.length) return null;
  const srs = { ...s.srs };
  const srsType = { ...s.srsType };
  for (const id of old) {
    const twin = retired[id];
    // The card carries its own id, so it is renamed as well as moved.
    if (id in srs && !(twin in srs)) srs[twin] = { ...srs[id], id: twin };
    if (id in srsType && !(twin in srsType)) srsType[twin] = srsType[id];
    delete srs[id];
    delete srsType[id];
  }
  const learnedWords = [...new Set(s.learnedWords.map((id) => retired[id] ?? id))];
  return { srs, srsType, learnedWords } as Pick<T, keyof Ids>;
}
