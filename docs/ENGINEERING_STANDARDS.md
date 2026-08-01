# Harf Engineering Standards

The constitution for anyone — human or AI — writing code in this repository.

**How to read this.** Every rule carries a tag saying who enforces it:

| Tag | Meaning |
| --- | --- |
| 🤖 | A machine enforces it. Breaking it fails CI. |
| 👁 | A reviewer enforces it. Judgement required. |
| 📐 | A principle. Shapes decisions; cannot be mechanically checked. |

That distinction is the point of the document. This project has repeatedly
proved that **an unenforced rule is a wish**: a comment promising 6:1 contrast
sat above code measuring 4.47:1; a config file promising to mirror the palette
had drifted through two re-themes; a comment claiming four constants "move with
the app palette" sat above four hard-coded copies of them. Each was written in
good faith and each was false for months. So where a rule can be automated, it
is, and the tag says so.

Run everything: `npm run check:all`.

---

## 1. Principles

1. 📐 **KISS.** Prefer the simple solution. The clever one costs you again every
   time someone reads it.
2. 📐 **YAGNI.** Don't build it until it is needed. Speculative generality is
   the most expensive kind of dead code, because it looks alive.
3. 📐 **DRY**, with judgement: duplication of *knowledge* is the problem, not
   duplication of *characters*. Two functions that look alike but change for
   different reasons should stay apart.
4. 📐 **Composition over inheritance.** There is no class hierarchy in this
   codebase and there should not be one.
5. 📐 **Readable before clever.** If explaining a line out loud makes you
   hesitate, rewrite the line.
6. 📐 **Make the invalid unrepresentable.** A type that cannot express a bad
   state beats a check that catches it.
7. 📐 **Errors should be loud.** A silent fallback hides the bug and ships it.
8. 📐 **Optimise for the reader who arrives in a year knowing nothing.** That
   reader is usually you.
9. 📐 **Fix causes, not symptoms.** If the same shape of bug recurs, the fix is
   at the level that makes the shape impossible.
10. 📐 **Delete rather than comment out.** Git remembers; the file should not.

### Single Responsibility (the S in SOLID, the one that earns its keep here)

11. 👁 One module, one reason to change. `src/lib/srs.ts` schedules; it does not
    render, store, or speak.
12. 👁 One function, one job. If the name needs "and", split it.
13. 🤖 Functions stay under ~40 lines where practical. Longer needs a reason in
    a comment.
14. 👁 One file, one subject. A file's name should predict its contents exactly.
15. 👁 Screens orchestrate; they do not compute. Logic belongs in `src/lib/`
    where it can be unit-tested without a renderer.

### The other SOLID letters, as they apply here

16. 👁 **Open/closed:** adding an exercise type should mean adding a file, not
    editing a switch in six places.
17. 👁 **Liskov:** a component accepting `ExerciseProps<T>` must behave for every
    `T` it claims to accept.
18. 👁 **Interface segregation:** don't make a component take a prop it ignores.
    Two components in this repo destructured `showRoman` and never read it.
19. 👁 **Dependency inversion:** `lib/` must not import from `screens/` or
    `components/`. Logic does not depend on presentation.

---

## 2. Architecture

20. 🤖 The folder layout in [CONTRIBUTING.md](../CONTRIBUTING.md#folders) is the
    layout. No `misc/`, no `helpers/`, no `utils/` catch-all.
    (`check:structure`)
21. 🤖 Nothing nests more than two directories deep under `src/`.
    (`check:structure`)
22. 👁 Dependencies point one way: `screens → components → lib → data`. Never
    back up the chain.
23. 👁 `src/data/` is content, not code. It holds no logic beyond simple derived
    lookups.
24. 🤖 `src/theme/` is the only place a colour is defined. (`check:theme`)
25. 👁 Cross-cutting helpers live in `src/lib/`; script helpers in
    `scripts/lib/`. A helper used twice belongs in one of them.
26. 📐 A shared module is created the *second* time something is needed, not the
    first. See rule 3.
27. 👁 State lives in a Zustand store only if more than one screen needs it.
    Otherwise `useState`.
28. 👁 Persisted stores must declare a `version` and a `migrate`. A changed
    default reaches nobody who already has the old value.
29. 👁 Side effects (audio, storage, network) go behind a module in `lib/`, never
    called inline from a component.
30. 🤖 Build configuration comes from the environment, never from rewriting a
    tracked file. (`app.config.js`)
31. 👁 One build command: `npm run build:web`. If a build needs different flags,
    those are environment variables, not a second command.

---

## 3. TypeScript

32. 🤖 `strict` is on and stays on.
33. 🤖 Code must typecheck with zero errors. (`npm run typecheck`)
34. 🤖 No unused variables, parameters, or imports. Prefix with `_` only when an
    unused parameter is required by a signature.
35. 👁 `any` is a last resort and needs a comment saying why. Prefer `unknown`
    plus narrowing.
36. 👁 Prefer `type` for unions and object shapes; `interface` only when
    declaration merging is genuinely wanted.
37. 👁 Derive types rather than restating them: `typeof LEAGUES[number]['id']`
    beats a hand-written union that can drift.
38. 👁 Use `as const` for literal tables so their types stay narrow.
39. 👁 Avoid type assertions (`as X`). If you need one, the type is wrong.
40. 👁 Never use non-null assertion (`!`) to silence a real possibility of null.
41. 👁 Exported functions have explicit return types. Local ones may infer.
42. 👁 Discriminated unions over optional-field soup.
43. 👁 Name types for what they mean (`LessonState`), not their shape
    (`StringOrNull`).
44. 👁 No `enum`; use `as const` objects and derived unions.
45. 👁 Prefer `readonly` arrays for data that must not be mutated.

---

## 4. React and React Native

46. 🤖 `react-hooks/rules-of-hooks` — error.
47. 🤖 `react-hooks/exhaustive-deps` — **error, not warning.** A stale dependency
    array once made every answer in a lesson get judged against exercise zero,
    so grammar lessons cost nothing to get wrong.
48. 👁 When the deps rule fires on code that is genuinely correct, restructure so
    it can see that — `useCallback` the closure. Do not disable the rule.
49. 👁 Components are function components. No classes.
50. 👁 One component per concept; extract when a component exceeds roughly a
    screenful.
51. 👁 Props are named for meaning, not for the value passed.
52. 👁 Derive during render rather than mirroring props into state.
53. 👁 `useMemo` and `useCallback` are for correctness (stable identities) and
    for measured cost — not sprinkled by default.
54. 👁 Keys in lists are stable ids, never array indices, wherever items can
    reorder.
55. 👁 Cleanup every subscription, timer, and listener in the effect's return.
56. 👁 Guard async work that outlives a screen. This app uses an epoch counter so
    stale audio never lands on the next question.
57. 👁 No inline object or array literals in props on hot paths where they cause
    re-renders that matter.
58. 👁 Styling is NativeWind classes for layout, `palette` for colour. Not raw
    hex, ever. (see rule 24)
59. 👁 Nothing in `components/` may import from `screens/`.
60. 👁 Platform differences are handled in one place, not sprinkled with
    `Platform.OS` checks. `lib/confirm.ts` is the pattern.
61. 👁 Text is always a `Txt`/`Bold`/`Display` component, never a bare RN `Text`,
    so typography stays consistent.

---

## 5. Naming

62. 🤖 Formatting and casing are enforced by Prettier and ESLint.
63. 👁 `camelCase` for values and functions.
64. 👁 `PascalCase` for components and types.
65. 👁 `SCREAMING_SNAKE_CASE` for module-level constants.
66. 👁 `kebab-case.js` for scripts, `PascalCase.tsx` for components,
    `camelCase.ts` for modules.
67. 👁 Names say what a thing *is*, never what type it has: `dueBudget`, not
    `numVal`.
68. 👁 Booleans read as assertions: `isTeaching`, `hasClip`, `shouldSpeak`.
69. 👁 Functions that do something are verbs; functions that answer something are
    questions or nouns.
70. 👁 No abbreviations that a newcomer would have to decode. `btn`, `ua`, `tmp`
    are out; established domain terms like `srs` and `xp` are in.
71. 🤖 No file named `final`, `temp`, `test2`, `copy`, `new`, or `old`.
    (`check:structure` — it caught `src/data/vocab/final.ts` on its first run)
72. 👁 A `check:*` script asserts; a `gen:*` script produces. The npm script name
    matches the file name.
73. 👁 Urdu content keeps its transliteration in the id (`w-khalu`), so a
    non-reader can still search for it.

---

## 6. Comments and documentation

74. 👁 Comments explain **why**, not what. The what is the code.
75. 👁 A comment must say something the line beneath it cannot.
76. 👁 When a decision rejected an obvious alternative, say which and why. That
    is the question the next reader actually has.
77. 👁 When a comment exists because something broke, keep the failure in it. A
    rule without its reason is the first thing dropped.
78. 🤖 No `TODO`, `FIXME`, or `XXX` in committed code. Open an issue. (`audit`)
79. 👁 Block headers separate long files: `// ---- section ----`.
80. 👁 Don't comment every line. Comment the parts that raise a question.
81. 👁 Every exported function in `lib/` has a doc comment.
82. 👁 Every `scripts/check-*.js` opens with what it checks and what went wrong
    that made it necessary.
83. 🤖 README claims that state a number must match the data. (`audit`)
84. 👁 Documentation is updated in the same commit as the change it describes.
85. 👁 `CONTRIBUTING.md` is for how to work here; this file is for what good
    looks like; `README.md` is for what the thing is.
86. 🤖 No emoji in interface chrome — the app has a drawn icon set. (`audit`)

---

## 7. Testing

87. 🤖 `npm test` must pass. Unit tests live beside their subject as
    `*.test.ts`. (vitest)
88. 👁 Pure logic in `src/lib/` gets unit tests. Rendering and content get
    `check:*` scripts. The two do not overlap.
89. 👁 **Test properties, not transcriptions.** `expect(xpForLevel(4)).toBe(360)`
    only proves the function still does what it does. `expect(curve to be
    monotonic)` proves something the design promises.
90. 👁 **Every new test must be seen to fail.** Break the thing it covers, watch
    it go red, put it back. A test that has never failed is a hypothesis.
91. 👁 A test that cannot fail in the environment it runs in is worse than no
    test. The DST test here passed with the guard deleted until the timezone was
    pinned, because CI runs in UTC and UTC has no DST.
92. 👁 Test the boundaries: month ends, year ends, leap days, empty lists, zero,
    the maximum, the off-by-one either side.
93. 👁 Every fixed bug gets a test that would have caught it, in the same commit.
94. 👁 Tests are named as sentences describing behaviour, not
    `test1`/`testFoo`.
95. 👁 No network, no clock, no filesystem in a unit test. Inject them.
96. 👁 Integration checks drive the real built artifact, not a mock of it.
97. 👁 A check that can silently skip must fail instead when `CI` is set. A skip
    in CI is a green tick over a check that never ran.
98. 👁 Checks that parse something must self-test: assert they still match a
    known-positive before trusting a clean result. An emoji sweep here once
    errored, exited 0, and reported "clean" while padlocks sat on every locked
    lesson.
99. 👁 Prefer one check that measures over three that assert.
100. 👁 **A check may not claim more than it observed.** Failing to read the
     thing and reading a thing that disagrees are different findings, and a
     check that reports them with one message will eventually accuse a
     healthy system. `check:deployed` announced that a perfectly good publish
     was broken because a sandboxed network could not reach the site at all.
101. 👁 Fixtures are minimal and inline. No fixture files nobody can find.

---

## 8. Accessibility

102. 👁 Every interactive element has an `accessibilityRole`.
103. 👁 Every icon-only control has an `accessibilityLabel` saying what it does,
     not what it looks like.
104. 🤖 Body text clears WCAG AA (4.5:1); decoration behind text clears 6:1.
     (`check:scenery`)
105. 👁 Touch targets are at least 44×44pt.
106. 👁 Colour is never the only signal. Correct/incorrect carry a mark and a
     word as well as a hue.
107. 👁 `reducedMotion` is honoured everywhere an animation runs.
108. 👁 Urdu text is marked so bidirectional layout resolves correctly — a
     leading neutral character otherwise jumps to the wrong end of the line.
109. 👁 Font sizes come from the type scale; nothing sets a raw `fontSize` for
     body copy.
110. 👁 Focus order follows reading order.
111. 👁 Nothing conveys meaning by sound alone; audio always has a visible
     counterpart.

---

## 9. Performance

112. 👁 Measure before optimising. "Feels slow" is a hypothesis.
113. 👁 Big content tables are module-level constants, built once, not rebuilt
     per render.
114. 👁 Filter and sort in `useMemo` when the input is large and the work is
     real.
115. 👁 Lists that can grow unbounded are virtualised.
116. 👁 Assets are generated at build time, not computed at runtime — glyph
     masks, sounds and voice clips are all pre-made.
117. 👁 Audio clips are cached after first load and replayed, not recreated.
118. 👁 No synchronous work over the whole vocabulary on a render path.
119. 👁 Images and SVGs are sized to their display size.
120. 👁 Avoid re-render cascades: subscribe to the narrowest store slice that
     works.
121. 👁 The web bundle is watched for size; a sudden jump gets explained before
     it ships.

---

## 10. Security

122. 🤖 **No credentials in the repository, ever** — not in code, not in a
     comment, not in a fixture. (`check:secrets`)
123. 👁 Secrets reach the app through environment variables and GitHub Actions
     secrets only.
124. 👁 A key that has ever been committed is compromised. Rotate it at the
     provider; deleting it from the tree does not remove it from history.
125. 🤖 The secret scanner self-tests against a canary, so it cannot silently
     stop matching.
126. 👁 `.gitignore` covers `.env`, local config, and generated audio.
127. 👁 Validate anything that crosses a trust boundary, including data read back
     out of local storage — a persisted blob from an older build is untrusted
     input.
128. 👁 Least privilege: the CI token gets only the permissions the job needs.
129. 👁 Dependencies are added deliberately and kept few. Every one is a supply
     chain.
130. 👁 No `eval`, no `Function` constructor, on any path that can see user
     input.
131. 👁 Features that ship only for testing must be compiled out of production
     builds by a build flag, not merely hidden. Anything in a web bundle is
     readable by anyone who opens dev tools.
132. 👁 A destructive action always confirms, and the confirmation says what will
     be lost and whether it can be undone.
133. 👁 Never log a secret, a token, or a full user record.

---

## 11. Git workflow

134. 👁 Never commit directly to the default branch.
135. 👁 Branch names describe the work: `feature-…`, `fix-…`, `experiment-…`.
136. 👁 One logical change per commit.
137. 👁 Subject line in plain words, imperative or descriptive, no ticket-speak.
138. 👁 The body says **why**, and names what broke if it is a fix.
139. 👁 Mechanical changes — formatting sweeps, renames — go in their own commit
     so they do not bury the reasoning in a real one.
140. 🤖 `npm run check:all` passes before pushing.
141. 👁 Never force-push a branch someone else may have pulled.
142. 👁 Delete branches once merged.
143. 👁 A merged pull request is finished; follow-up work starts a new branch
     from the updated default branch.
144. 👁 Generated artefacts are not committed unless they are what ships. Voice
     clips are; `dist/` is not.
145. 🤖 A file that ships must be tracked by git, not merely present on disk.
     One voice clip was generated locally and never added, and the deployed app
     spoke that word in the wrong language for a day. (`check:voice`)

---

## 12. CI and deployment

146. 🤖 Every claim the README makes has a script that fails when it stops being
     true.
147. 🤖 CI runs the checks *before* it builds and deploys, so a broken push fails
     loudly rather than publishing.
148. 🤖 `check:all` reads its step list from the workflow file rather than
     copying it, so the local and CI pipelines cannot drift.
149. 🤖 Local builds and CI builds are the same artifact, configured by the same
     environment variables.
150. 🤖 **A green pipeline is not a deploy.** The live URL is fetched and asserted
     to be serving the built commit. (`check:deployed`)
151. 👁 Never report something as live without having checked. "The workflow said
     success" has been wrong twice.
152. 👁 A check that fails must say what is wrong, where, and what to do — not
     just that something is wrong.
153. 👁 Error messages name the *cause* where they can distinguish it. "Could not
     find the background SVG" was the symptom of a bundle that never loaded.
154. 👁 CI steps are named for what they protect, not for the command they run.

---

## 13. Working with AI agents

155. 👁 The agent reads `CLAUDE.md`, which points here. Keep both current.
156. 👁 Give the agent the rule *and its reason*; a reason survives paraphrase,
     a rule alone does not.
157. 👁 An agent must run `npm run check:all` before claiming work is done.
158. 👁 An agent must not claim a deploy succeeded without reading the run status.
159. 👁 An agent that writes a check must break the thing on purpose and watch it
     fail before trusting it.
160. 👁 An agent must not silence a linter to make a build pass. Fix the code or
     say why the rule is wrong.
161. 👁 An agent must report what it did not do, and why, as plainly as what it
     did.
162. 👁 Generated code is held to every rule here. "The AI wrote it" is not a
     category of code.
163. 👁 When an agent is uncertain between two readings of a request, it says so
     and picks one, rather than silently narrowing scope.
164. 👁 Prefer many small verified steps to one large unverified one.

---

## 14. Code review

165. 👁 Review the diff against this document, not against taste.
166. 👁 Ask whether the change makes the *next* change easier.
167. 👁 A comment claiming a property is not evidence of the property. Look for
     the check.
168. 👁 New magic numbers, new raw hex, and new duplication are blocking.
169. 👁 A fix without a test that would have caught it is incomplete.
170. 👁 If the diff is unreviewable because a formatting sweep is mixed in, ask
     for it to be split.
171. 👁 Approve the change you would be willing to debug at 3am.

---

## 15. The reader test

172. 👁 Before calling anything done: would someone new, opening this file, know
     what it does and why it is shaped that way?
173. 👁 If explaining a piece out loud makes you hesitate, the code is the
     problem, not the explanation.
174. 👁 Read the diff once as a stranger before pushing.

---

## What is machine-enforced today

`npm run check:all` runs all of it, in the deploy's own order, against a
deploy-shaped build.

| Command | Rules |
| --- | --- |
| `check:secrets` | 122, 125 |
| `typecheck` | 32, 33 |
| `lint` | 13, 34, 46, 47 (13 on `lib/` and `scripts/`, where logic lives) |
| `format:check` | 62 |
| `check:structure` | 20, 21, 71 |
| `test` | 87 |
| `audit` | 78, 83, 86 |
| `check:roman`, `check:trace`, `check:answerable`, `check:srs` | 146 |
| `check:theme` | 24, 58 |
| `check:voice` | 145, 146 |
| `check:stability`, `check:scenery` | 96, 104 |
| `check:deployed` | 150 |

Everything else is a reviewer's job, and the honest count is that most of this
document is 👁. That is not a failure of the document — it is what it means to
say a rule needs judgement. But any 👁 rule that keeps getting broken is a
candidate to become 🤖, and that is how this file is meant to evolve.
