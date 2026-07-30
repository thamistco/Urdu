import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the pure logic — the arithmetic the app runs on.
 *
 * The `check:*` scripts in `scripts/` cover whole-system properties: content
 * wiring, audio, rendered pixels, the live site. This covers the functions,
 * and the two do not overlap on purpose.
 *
 * ## Why the timezone is pinned
 *
 * `src/lib/date.ts` decides whether a learner keeps a streak, and its one
 * genuinely subtle line is the `Math.round` in `daysBetween`: across a
 * daylight-saving boundary a day is 23 or 25 hours, so dividing milliseconds
 * gives 0.958 or 1.042, and without the rounding a streak silently breaks
 * twice a year.
 *
 * The test for that was written first with no timezone pinned, and it passed
 * *with the rounding removed* — CI and this container both run in UTC, which
 * has no DST, so the case the test claimed to cover could not occur. A green
 * test asserting something it cannot exercise is worse than no test: it is a
 * false statement that nobody re-examines.
 *
 * Pinning to a zone that observes DST makes the test able to fail. Verified by
 * deleting the `Math.round` and watching four assertions break.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      TZ: 'Europe/London',
    },
  },
});
