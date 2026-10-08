import { describe, expect, it } from 'vitest';
import { retireWordIds, RETIRED_WORD_IDS } from './retiredIds';
import { WORDS } from '../data/words';
import { newCard } from './srs';

describe('retiring a word id', () => {
  const card = (id: string, n: number) => ({ ...newCard(id, 0), reps: n });

  it('only retires ids the course no longer teaches, onto ids it does', () => {
    const live = new Set(WORDS.map((w) => w.id));
    for (const [old, twin] of Object.entries(RETIRED_WORD_IDS)) {
      expect(live.has(old), old).toBe(false);
      expect(live.has(twin), twin).toBe(true);
    }
  });

  it('moves a retired card onto its twin when the learner has none', () => {
    const out = retireWordIds({
      srs: { 'w-tabla2': card('w-tabla2', 3) },
      srsType: { 'w-tabla2': 'word' },
      learnedWords: ['w-tabla2'],
    });
    expect(out).toEqual({
      srs: { 'w-tabla': card('w-tabla', 3) },
      srsType: { 'w-tabla': 'word' },
      learnedWords: ['w-tabla'],
    });
  });

  it('keeps the twin a learner already has, and drops the retired copy', () => {
    const out = retireWordIds({
      srs: { 'w-adda2': card('w-adda2', 1), 'w-adda': card('w-adda', 5) },
      srsType: { 'w-adda2': 'word', 'w-adda': 'word' },
      learnedWords: ['w-adda2', 'w-adda'],
    });
    expect(out).toEqual({
      srs: { 'w-adda': card('w-adda', 5) },
      srsType: { 'w-adda': 'word' },
      learnedWords: ['w-adda'],
    });
  });

  it('changes nothing for a learner who never met a retired word', () => {
    expect(
      retireWordIds({
        srs: { 'w-paani': card('w-paani', 2) },
        srsType: { 'w-paani': 'word' },
        learnedWords: ['w-paani'],
      })
    ).toBeNull();
  });
});
