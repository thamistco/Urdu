import type { Exercise } from './types';

type SpotEx = Extract<Exercise, { kind: 'letterSpot' }>;

/**
 * Whether tapping tile `tappedIndex` of a `letterSpot` exercise is the right
 * answer — pulled out of `LetterSpot.tsx` into its own dependency-free
 * module specifically so it can be unit-tested directly.
 *
 * THE CRITIC, URD-045: mutated `LetterSpot.tsx`'s inline `const correct =
 * tiles[i] === letter.forms.isolated;` to `const correct = true;` and found
 * nothing anywhere — not `generator.test.ts`, not `check-answerable.js`, not
 * `check-shape.js` — would catch a learner being told "correct" no matter
 * what they tapped. Confirmed directly (not assumed) that a real component
 * test isn't a cheap fix for that gap: importing anything from
 * `LetterSpot.tsx` pulls in real `react-native` view primitives, whose
 * source is Flow syntax vitest's bundler cannot parse at all — every attempt
 * to import the component under vitest fails at parse time, before any test
 * can even run. `useSessionGradeFlush` (URD-044) was kept free of
 * `react-native` imports for exactly this reason; this is the same fix
 * applied to the one line of `LetterSpot.tsx` that decides right from wrong,
 * rather than forcing new component-rendering infrastructure this project
 * has never needed before to close one gap.
 */
export function isCorrectTap(exercise: SpotEx, tappedIndex: number): boolean {
  return exercise.correct[tappedIndex] ?? false;
}
