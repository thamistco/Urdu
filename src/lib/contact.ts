/**
 * Where a reader of the Privacy Policy or Terms can write to.
 *
 * One constant rather than a string in each screen, because the address has to
 * be the same on both and changing it should be one edit.
 *
 * Still the placeholder: the owner has not chosen the address yet, and a
 * guessed one on a public legal page would be worse than an obvious gap. Both
 * app stores require a working support contact, so this must be a real
 * address before a store release. `isRealAddress` keeps the placeholder from
 * ever being offered as a mail link.
 */
export const SUPPORT_EMAIL = '{{SUPPORT_EMAIL}}';

/** A string a mail app can actually open, as opposed to the placeholder. */
export const isRealAddress = (s: string) => /^[^\s@{}]+@[^\s@{}]+\.[^\s@{}]+$/.test(s);
