import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the pure logic — the arithmetic the app runs on.
 *
 * The `check:*` scripts in `scripts/` cover whole-system properties: content
 * wiring, audio, rendered pixels, the live site. This covers the functions,
 * and the two do not overlap on purpose.
 *
 * ## Why `react-test-renderer` shows up here at all
 *
 * URD-044: `sessionGrading.test.ts` covered `recordSighting`/
 * `flushSessionGrades` in isolation, but the actual bug URD-019 fixed lived
 * in `LessonScreen.tsx`'s ref/effect *wiring* around those functions — code
 * with zero automated coverage anywhere in `check:all`. Testing that wiring
 * needs to run real React hooks (`useRef`/`useEffect`), which needs a real
 * React renderer — but not a DOM: `useSessionGradeFlush` (`screens/`) is
 * plain React, no `react-native` view primitives, no navigation, no native
 * modules, so `react-test-renderer` — the renderer React Native's own test
 * suite uses, no jsdom/happy-dom, no `@testing-library/*` — is enough.
 * `useSessionGradeFlush.test.ts` builds its tiny harness component with
 * `React.createElement` rather than JSX, specifically so this file's
 * `include` glob and this project's `tsconfig.json` (`jsx: "react-native"`,
 * a classic-transform value not all tooling agrees on) never have to agree
 * on a JSX pipeline for one test file to stay plain `.test.ts`. This stays
 * "pure logic" in spirit: one hook's real effect timing, not a rendered
 * screen — nothing about a full component render (`react-navigation`,
 * `react-native-reanimated`, Expo modules) is being taken on here.
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
