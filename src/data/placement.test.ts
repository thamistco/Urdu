import { describe, it, expect } from 'vitest';
import { placementFor } from './placement';

/**
 * The promise the onboarding makes one screen earlier: you said which writing
 * system you read, so the quick check uses it. Script and Both were handed the
 * Roman "ghar" as their fourth question until 2026-10-12.
 */
describe('placementFor', () => {
  it.each([
    ['script', 'script'],
    ['both', 'script'],
    ['roman', 'roman'],
  ] as const)('asks the %s track four questions, all in %s', (track, kind) => {
    const qs = placementFor(track);
    expect(qs).toHaveLength(4);
    expect(qs.map((q) => q.kind)).toEqual([kind, kind, kind, kind]);
  });
});
