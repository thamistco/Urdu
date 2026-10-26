import { describe, expect, it } from 'vitest';
import { distractorsFor, sensesOf } from './generator';
import { WORDS, wordsByTopic } from '../data/words';

describe('distractors share no sense with the answer', () => {
  it('splits a gloss into its senses, leaving asides out', () => {
    expect(sensesOf('reason / wisdom')).toEqual(['reason', 'wisdom']);
    expect(sensesOf('last, final')).toEqual(['last', 'final']);
    expect(sensesOf('previous (as in last week)')).toEqual(['previous']);
    expect(sensesOf('(polite)')).toEqual(['(polite)']);
  });

  it('never offers a word that also means the answer', () => {
    let built = 0;
    for (const word of WORDS) {
      const pool = wordsByTopic(word.topic);
      for (let k = 0; k < 5; k++) {
        const own = new Set(sensesOf(word.meaning));
        for (const d of distractorsFor(word, pool, { distinctMeaning: true })) {
          const shared = sensesOf(d.meaning).filter((m) => own.has(m));
          expect(shared, `${word.urdu} "${word.meaning}" offered ${d.urdu} "${d.meaning}"`).toEqual([]);
        }
        built++;
      }
    }
    expect(built).toBeGreaterThan(5000);
  });
});
