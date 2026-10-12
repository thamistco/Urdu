import { describe, it, expect } from 'vitest';
import { romanProse, scriptLeftIn } from './romanProse';
import { GRAMMAR } from '../data/grammar';

describe('romanProse', () => {
  it('replaces script with the romanisation bracketed after it', () => {
    expect(romanProse('The past is تھا (tha).')).toBe('The past is tha.');
  });

  it('keeps the rest of the bracket as a gloss', () => {
    expect(romanProse('تھا (tha, m. sing.), تھی (thi, f.)')).toBe('tha (m. sing.), thi (f.)');
  });

  /** The split that a naive "first comma" rule gets wrong. */
  it('keeps a romanised clause whole when the Urdu has its own comma', () => {
    expect(romanProse('جو آدمی آیا، وہ میرا دوست ہے (jo aadmi aaya, wo mera dost hai): “which man came”')).toBe(
      'jo aadmi aaya, wo mera dost hai: “which man came”'
    );
  });

  it('drops script joined to its romanisation by an arrow, slash or comma', () => {
    expect(romanProse('لڑکا → laṛka → laṛke')).toBe('laṛka → laṛke');
    expect(romanProse('cousin مگر / magar')).toBe('cousin magar');
    expect(romanProse('(پڑھی/paṛhi is feminine)')).toBe('(paṛhi is feminine)');
    expect(romanProse('liking (پسند ہونا, pasand hona)')).toBe('liking (pasand hona)');
    expect(romanProse('the (‑نا, ‑na form)')).toBe('the (‑na form)');
  });

  it('leaves English-only brackets and unromanised script alone', () => {
    expect(romanProse('a man (not a boy)')).toBe('a man (not a boy)');
    expect(scriptLeftIn('just like ‑تا did')).toBe(true);
  });
});

/**
 * The content half: every paragraph of every grammar card has to come out of
 * romanProse with no script in it, or the Roman track shows Nastaliq again the
 * first time somebody writes a new card without a romanisation beside the
 * script. Fails today if `(‑ta)` is taken back out of g-continuous.
 */
describe('grammar prose on the Roman track', () => {
  it('leaves no script in any paragraph', () => {
    const left = GRAMMAR.flatMap((c) => c.explain.filter(scriptLeftIn).map((p) => `${c.id}: ${p}`));
    expect(left).toEqual([]);
  });
});
