# Harf — instructions for AI coding agents

Harf is an Urdu learning app: Expo SDK 52 / React Native, deployed to GitHub
Pages at https://thamistco.github.io/Urdu/.

**Read [`docs/ENGINEERING_STANDARDS.md`](docs/ENGINEERING_STANDARDS.md) before
writing code here.** It is the constitution — ~170 rules across architecture,
TypeScript, React, testing, accessibility, performance, security, git, CI and
review. [`CONTRIBUTING.md`](CONTRIBUTING.md) covers day-to-day conventions.

---

## The one command

```bash
npm run check:all
```

Runs the entire CI pipeline locally, in the workflow's order, against a bundle
built the way the deploy builds it. **Nothing is done until this passes.**

It reads its step list out of `.github/workflows/deploy-preview.yml`, so it
cannot drift from what CI runs.

## Non-negotiables

These are the ones this project has been burned by. Each cost a real bug.

1. **Verify, do not assume.** Never report a deploy as live without reading the
   run status. "The workflow said success" has been wrong twice, and both times
   someone was told the site had changed when it had not.
2. **Break a new check on purpose and watch it fail.** A check that has never
   failed is a hypothesis. An emoji sweep here reported "clean" while padlock
   emoji sat on every locked lesson, because the command errored and exited 0.
3. **A test that cannot fail in its environment is worse than no test.** The DST
   test in `src/lib/date.test.ts` passed with the guard deleted until the
   timezone was pinned, because CI runs in UTC and UTC has no DST.
4. **Measure rather than estimate.** A comment promised 6:1 contrast above code
   that measured 4.47:1. Alpha compositing, contrast ratios and file sizes get
   measured.
5. **Fix the cause.** The same deploy broke four times because CI rewrote a
   tracked file to configure the build, so CI and local produced different
   artifacts. The fix was the build, not the fourth symptom.
6. **Never silence a linter to go green.** Fix the code, or disable at the site
   with a comment saying why the rule is wrong there.
7. **No secrets, anywhere.** Not in code, comments, or fixtures. `check:secrets`
   runs first in CI.
8. **Say what you did not do.** Report skipped or blocked work as plainly as
   finished work.

## Where things live

```
src/art/         drawn SVG icon set          src/lib/        pure logic + unit tests
src/components/  shared UI                   src/navigation/ routes
src/data/        course content              src/screens/    one file per screen
src/exercises/   one file per exercise type  src/store/      zustand stores
                                             src/theme/      the only source of colour
scripts/         checks and generators       scripts/lib/    shared script helpers
```

## Two kinds of test, no overlap

- **Unit tests** (`src/**/*.test.ts`, vitest) cover pure logic. Test properties
  the design promises, not transcriptions of the implementation.
- **Check scripts** (`scripts/check-*.js`) cover whole-system properties:
  content wiring, audio, rendered pixels, the live site. They drive the real
  built artifact, never a mock.

## Colour

Every colour comes from `src/theme/colors.ts`. `tailwind.config.js` mirrors it
and `check:theme` proves they agree — they silently drifted across two re-themes
once, so `className` colours showed the old theme while inline styles showed the
new one.

Depicted colour is the exception: a red vocabulary word must stay red through a
re-theme. Mark those `check:theme-ok` on the line, or wrap a region in
`check:theme-off` … `check:theme-on`.

## Git

Work on `claude/language-learning-android-app-yu2gzz`, never the default branch.
One logical change per commit; the body says *why*, and names what broke if it
is a fix. Mechanical changes — formatting, renames — go in their own commit.
