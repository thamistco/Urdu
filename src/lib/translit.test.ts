import { describe, it, expect } from 'vitest';
import { romanOf } from './translit';
import { GRAMMAR } from '../data/grammar';
import { getWord } from '../data/words';

/**
 * A context-free token reads as the word a learner is meant to see. The
 * g-relative drill offered جو as "jau", the barley entry (QA report v3, M20).
 */
describe('romanOf', () => {
  it('reads the relative جو as jo and the verb کرتا as karta', () => {
    expect(romanOf('جو')).toBe('jo');
    expect(romanOf('کرتا')).toBe('karta');
  });

  it('leaves the vocabulary entries their own Roman', () => {
    expect(getWord('w-jau')?.roman).toBe('jau');
  });

  it('gives every relative-clause drill option its relative reading', () => {
    const rel = GRAMMAR.find((g) => g.id === 'g-relative')!;
    const options = rel.drills.flatMap((d) => d.options).filter((o) => o === 'جو');
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) expect(romanOf(o)).toBe('jo');
  });
});
