# Working on Harf

The conventions this project actually follows, and the reasons behind them.
Most of them exist because something went wrong once — those reasons are kept,
because a rule without its reason is the first thing dropped when it becomes
inconvenient.

Adapted from [Coding Etiquette & Best
Practices](https://exploringcswithemmarobescu.blog/2025/04/01/coding-etiquette-best-practices/),
whose framing this file follows section by section.

---

## The one command

```bash
npm run check:all
```

Runs the entire deploy pipeline locally: every check, in the workflow's order,
against a bundle built exactly the way the deploy builds it. **Run it before
pushing.** The step list is read out of `.github/workflows/deploy-preview.yml`
rather than copied, so it cannot drift from what CI does.

Individual checks are listed in [README.md](README.md#verification).

---

## Naming

- **camelCase** for variables and functions, **PascalCase** for React
  components and types, **SCREAMING_SNAKE** for module-level constants.
  TypeScript convention; used consistently.
- Names say what the thing *is*, not what shape it has. `dueBudget` not `n`,
  `speakable` not `arr`, `lessonState` not `getState2`.
- Files are named for their subject: `check-scenery.js`, `useSettingsStore.ts`,
  `LatticeBackground.tsx`. Never `final`, `temp`, `test2`, or `copy`.
- Scripts are `check-*.js` when they assert something and `gen-*.js` when they
  produce something. The npm script matches: `check:scenery`, `gen:voice`.

## Folders

```
src/
  art/          drawn SVG icon set
  components/   shared UI, no screen-specific logic
  data/         course content — words, letters, grammar, sentences, units
  exercises/    one file per exercise type
  lib/          pure logic: srs, gamification, speech, transliteration
  navigation/   route types and the navigator
  screens/      one file per screen
  store/        zustand stores
  theme/        colours and typography — the only place colour is defined
scripts/        checks and generators, run by npm and by CI
  lib/          shared helpers for those scripts
assets/         fonts, images, generated audio
docs/           store listing, content notes
```

No `misc`, no `utils` dumping ground, nothing nested more than two deep.

## Comments

Comments explain **why**, because *what* is already in the code. The bar: a
comment should tell you something you could not get by reading the line under
it.

```ts
// Recomputed from `store.srs` rather than called as an action, so the card
// appears and clears as answers land instead of only on a remount.
const dueNow = useMemo(() => dueCount(store.srs), [store.srs]);
```

When a decision was made *against* an obvious alternative, the comment says
which and why — that is the question the next reader will actually have.

Sections get block headers so a long file can be scanned:

```js
// ---- gamification tokens -------------------------------------------------
```

Don't comment every line. Comment the parts that would otherwise raise a
question.

## Don't repeat yourself

The two worst bugs in this project's history were both duplication:

- `tailwind.config.js` is a hand-maintained copy of `src/theme/colors.ts`. It
  drifted across two re-themes, so `className` colours showed the old theme
  while inline `palette.x` showed the new one. **`npm run check:theme` now
  compares them token by token.**
- `check-stability.js` diagnosed and fixed a static-server bug in its own
  private copy of the server. `check-scenery.js` was written later with a fresh
  copy and hit the identical bug, blocking two deploys. **The server lives in
  `scripts/lib/serve-dist.js` now and both import it.**

So: when the same logic appears twice, move it to `lib/`. When a value could
change, name it — no magic numbers, no hard-coded hex, no repeated string
literal.

## Configuration lives in the environment

`app.config.js` is the single source of build config. The deploy subpath and
the commit stamp arrive as environment variables (`HARF_BASE_URL`,
`HARF_BUILD_SHA`).

**Nothing may rewrite a tracked file to configure a build.** CI used to inject
the base path by rewriting `app.json` mid-job, which meant local builds and CI
builds were different artifacts — the direct cause of four failed deploys, a
dirty working tree after any interrupted run, and two concurrent local runs
corrupting each other.

## Commits

One logical change per commit. The subject line says what changed in plain
words; the body says **why**, and names what broke if the commit is a fix.

```
Good:  Fix stale word-audio race on fast advance
Bad:   updated stuff
```

If a change is mechanical and large — a formatting sweep, a rename — it goes in
its own commit so it does not bury the reasoning in a real one.

## Branches

Work happens on `claude/language-learning-android-app-yu2gzz`, never directly
on the default branch. Feature branches read as `feature-…`, `fix-…`,
`experiment-…`. Delete them once merged.

## Style

Enforced by tooling, not by intention:

```bash
npm run format        # Prettier: rewrite
npm run format:check  # Prettier: verify (this is what CI runs)
npm run lint          # ESLint
```

Two-space indent, single quotes, semicolons, 120-column lines, same-line
braces. Configured in `.prettierrc.json`; don't argue with it, run it.

`react-hooks/exhaustive-deps` is an **error**, not a warning. A stale
dependency array once caused every answer in a lesson to be judged against the
first exercise, which meant grammar lessons cost nothing to get wrong. If the
rule fires and the code is genuinely fine, restructure so the rule can see that
— `useCallback` the closure rather than silencing the rule.

`src/data/vocab/` and the generated manifests are in `.prettierignore`: they are
hand-aligned tables where reflowing would turn a one-word fix into a
two-hundred-line diff.

## Security

No credentials in the repository, ever — not in code, not in a comment, not in
a test fixture. Keys are passed through the environment and, for CI, through
GitHub Actions secrets.

`npm run check:secrets` scans every tracked file for credential *shapes* and
self-tests against a canary so it cannot silently stop matching. It runs first
in CI, before anything else.

If it ever fires on something already pushed, **rotate the key at the
provider**. Deleting it from the working tree does not remove it from history.

## The reader test

Before calling anything done: if someone opened this file knowing nothing,
would they understand it? If explaining a piece of it out loud makes you
hesitate, the naming or the structure is the problem, not the explanation.

And the one this project keeps relearning: **a green pipeline is not a deploy.**
`npm run check:deployed` fetches the live site and asserts it is serving the
commit under test. "The workflow said success" has been wrong twice.
