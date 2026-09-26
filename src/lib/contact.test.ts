import { describe, expect, it } from 'vitest';
import { isRealAddress } from './contact';

// The promise: the placeholder is never offered as a mail link, and a real
// address always is.
describe('isRealAddress', () => {
  it('refuses the placeholder and other non-addresses', () => {
    for (const s of ['{{SUPPORT_EMAIL}}', '', 'support', 'support@', '@harf.app', 'a b@harf.app', 'support@harf'])
      expect(isRealAddress(s), s).toBe(false);
  });
  it('accepts an ordinary address', () => {
    for (const s of ['support@harf.app', 'hello+urdu@example.co.uk']) expect(isRealAddress(s), s).toBe(true);
  });
});
