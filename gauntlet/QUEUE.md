# Gauntlet queue

Ordered. The top unclaimed item is what the next run picks up.

Every item carries a `verify` command that exits 0 or does not. An item without
one is a drift generator: it gets marked done on somebody's reasoning and stays
wrongly done. If you add an item and cannot name the command that proves it, the
item is not ready to be queued.

`verify` may name a script that does not exist yet — creating it is part of the
work. The item is done when that command exits 0, and not before.

Every item below came from measuring this repo, not from a list of things Urdu
apps generally need. The numbers in them were taken on 2026-08-07 at `5cbe0e6`,
and the ones URD-A02 attempt 1 moved were re-measured on 2026-08-09 at `d778928`
and say so where they changed. If a number no longer reproduces, say so in the
ledger and close the item rather than inventing work to justify it.

Items URD-009 to URD-013 came out of the critique of URD-A02 rather than a sweep,
which is the loop working as intended: the review of one item is the best source
of the next ones.

`npm run check:all` is the final gate for anything touching shipped code. It
reads its step list out of `.github/workflows/deploy-preview.yml`, so it cannot
drift from what CI runs.

`npm run check:shape` states the curriculum target in a form a machine can
settle. It failed on purpose for most of this file's life, deliberately kept
out of `check:all` until URD-A02 closed its last two problems; it passes now
and is wired into `.github/workflows/deploy-preview.yml`, so `check:all`
gates it like everything else.

Items are dispatched to critics before they can be recorded PASSED; see
gauntlet/ROLES.md. The measured targets the curriculum critic holds you to, and
where they came from, are in gauntlet/BENCHMARKS.md.

---

## URD-055 — LessonScreen's three call sites into the SRS-grading wiring are untested
attempts: 0
files: src/screens/LessonScreen.tsx, src/screens/useSessionGradeFlush.ts
definition of done: URD-044 gave `useSessionGradeFlush`'s own ref/effect
  timing a real, mutation-tested suite — but the hook is exercised there
  only through a synthetic `Harness` that always calls `record`/`flushNow`
  correctly by construction. The three real call sites inside
  `LessonScreen.tsx` have zero automated coverage: the `useSessionGradeFlush(
  exercises, applyGrade)` call itself, `recordItemGrade(it, grade)` inside
  `onGraded`, and the explicit `flushPendingGrades()` inside `advance()` (the
  one whose own comment explains it exists so closing the app from the
  results screen doesn't silently lose SRS grading while keeping the
  rewards). If a future edit drops that `flushPendingGrades()` call from
  `advance()`, or drops `recordItemGrade` from `onGraded`'s body, nothing in
  `check:all` catches it — the exact "app is lying about what it graded" bug
  class URD-044 exists to guard against, one file over from where it used
  to live. A full rendered-`LessonScreen` test would need react-navigation/
  store/native-module mocking disproportionate to this (and would cut
  against this project's own "two kinds of test, no overlap" rule — neither
  bucket is "render one screen component") — so this likely wants a narrow
  seam: e.g. exporting `LessonScreen`'s body logic (not its JSX) as a
  testable function, or a thin fake-hook-return spy asserting the three call
  sites are actually reached with the right arguments during a scripted
  `onGraded`/`advance()` sequence, without rendering real UI.
verify: a test that fails if `flushPendingGrades()` is deleted from
  `advance()`, or if `recordItemGrade` is deleted from `onGraded`'s body —
  reverting either one makes the new test fail with a concrete, matching
  shape.
notes: Found by THE CRITIC reviewing URD-044. Not blocking — the doc
  comments URD-044 added are honest about testing the extracted hook, not
  "LessonScreen end-to-end," so this isn't a dishonesty finding, just a real
  remaining gap the ledger should name plainly rather than let readers
  assume URD-044 closed in full.

## URD-056 — check:all can corrupt its own build if two runs overlap, and nothing stops it
attempts: 0
files: scripts/check-all.js
definition of done: `scripts/check-all.js` already carries a comment (near
  the top, by the `dist/` rebuild) recording that two concurrent runs
  corrupt each other's build — the project has known this long enough to
  write it down and has never guarded it. The failure mode is real and has
  fired repeatedly: a run started while another holds `dist/` dies on
  `ENOENT: no such file or directory, open 'dist/index.html'`, which reads
  like a regression in whatever the lead was working on rather than a
  collision, and has been misdiagnosed that way at least twice (URD-041,
  URD-042) before being correctly traced by inspecting the process tree.
  On URD-045 the lead killed a run by hand purely to dodge it, losing 3-5
  minutes and a discarded build. Take a lockfile before the `dist/`
  rebuild, exit with a message naming the holding PID if it is already
  held, and release it on normal exit and on signal.
verify: start two `check:all` runs and watch the second refuse by name
  rather than racing — a guard that has never been seen to fire is a
  hypothesis (non-negotiable 2), so the test must actually observe the
  refusal, not just assert the lockfile helper in isolation.
notes: Found by the OVERSEER reviewing URD-045. Not blocking — the lead can
  avoid it by remembering, and mostly does; that is exactly the argument
  for a guard, since "the lead remembers" is not a mechanism. Note the
  hazard is worse than plain lost time: a corrupted `dist/` makes the
  *next* check report a failure that has nothing to do with the code.

## URD-057 — a subagent's scratch file in src/ or scripts/ silently breaks the next gating run
attempts: 0
files: scripts/check-all.js, scripts/check-*.js (a new one, likely)
definition of done: `npm run lint` globs `src/**/*.{ts,tsx}` and
  `scripts/**/*.js`, and `format:check` globs the same, with no scratch
  exclusion in either `.gitignore` or `.prettierignore`. So any file a
  dispatched critic leaves in those directories becomes a gating failure
  for whoever runs next, attributed to their work rather than to the
  stray file. This has now happened on at least two separate items
  (URD-041's `verify041.js` broke `format:check`; URD-045 accumulated five
  — `scripts/critic-letterspot.js`, `scripts/debug-nav.js`,
  `scripts/debug-lesson0.js`, and two `src/exercises/__scratch_*.test.ts`).
  Fail loudly and by name: list untracked files under `src/` and
  `scripts/` and fail naming them, so the lead is told rather than having
  to hunt through a confusing lint error.
verify: create an untracked file under `src/`, run the check, and watch it
  fail naming that exact path; remove it and watch the check pass.
notes: Found by the OVERSEER reviewing URD-045, alongside a dispatch-prompt
  rule (now in ROLES.md) telling critics not to write there in the first
  place. Both are wanted: the rule reduces the incidence, this makes the
  residue legible. Deliberately do NOT fix this by adding ignore patterns
  to `.prettierignore`/`.gitignore` — a scratch file that silently passes
  the checks is worse than one that breaks them, because it can then sit
  in the tree indefinitely and get committed by an unrelated `git add -A`.

## URD-059 — the answer-position band's own stated justification does not survive arithmetic
attempts: 0
files: scripts/check-answerable.js
definition of done: the 40% relative band on answer position justifies itself
  with "the bias it replaced put the answer first 43.7% of the time against a
  fair 33.3% ... nothing that loose gets through a 40% band." 43.7/33.3 is a
  31% deviation, inside a 40% band — and with the residue split across the
  other two seats, no seat exceeds it either. The historical bug the band
  names as its reason for existing would have passed the band. Found by THE
  CRITIC reviewing URD-047, which copied both the band and the sentence into
  a new block before replacing its own copy with a z-test (see
  `SIGMA_LIMIT` in the same file for the shape that does scale). Replace the
  fixed relative band on the main histogram the same way, or restate the
  justification honestly if the band is kept for another reason.
verify: reconstruct the historical bias (answer first 43.7% of ~73,000
  three-option questions) as a mutation and watch the check fail on it — it
  currently would not, which is the whole finding.
notes: Pre-existing, and genuinely low-risk today: the real shuffle is
  uniform (measured 49.94/50.06 over 200,000 two-element draws). The defect
  is that the check is weaker than it claims, which CLAUDE.md non-negotiable 3
  treats as a first-class problem rather than a nit.

## URD-060 — six sightings cannot cover four joining forms once two are position-free
attempts: 0
files: src/exercises/generator.ts
definition of done: the four joining forms are this app's central thesis, but
  a letter's `SIGHTINGS_PER_LETTER` (6) sightings now include two that carry
  no position at all — URD-020's `letterSpot` and URD-047's `letterContrast`
  — and of the four that remain, roughly a third render as `letterPick`,
  which also has no position (it asks which glyph makes a sound, with no form
  to show). So the arithmetic does not close: measured after URD-047's
  `nextPos` fix, 4 of 46 letter-slots still never see their `final` form and
  36 of 46 miss at least one of the four. `nextPos` already stopped the
  position cycle SKIPPING a step, which took `final` from 25 of 46 to 4 —
  the residue needs the kind/position interaction changed, not the counter.
  Options: give `letterPick` a position (show the prompt glyph in a form
  rather than isolated), raise `SIGHTINGS_PER_LETTER`, or let the two
  position-free kinds displace a `letterPick` rather than a form-bearing
  sighting.
verify: a test asserting every letter in every real letter lesson is shown
  all four joining forms — the ceiling currently asserted in
  `generator.test.ts` ("`final` reaches all but a handful") tightened to zero.
notes: Found by CURRICULUM CRITIC reviewing URD-047, whose measurement of the
  regression that item caused (14 of 46 missing `final` before, 25 after) is
  what surfaced the older, larger gap underneath it. URD-047 fixed its own
  regression and improved on the pre-existing number; this is the rest.

## URD-061 — the discrimination skill is practised twice in one lesson and never again
attempts: 0
files: src/exercises/generator.ts, src/lib/review.ts
definition of done: `letterContrast` (URD-047) is emitted only by the
  `letters` branch. Measured across the whole course: 33 instances, all in
  `kind: 'letters'` lessons, zero anywhere else — and driving the first 20
  review lessons with all 40 letters due emits `letterForm` 152 /
  `letterPick` 150 / `letterTrace` 153 and `letterContrast` 0. So for a pair
  like ص/ض or ط/ظ — near-identical shapes, and for a beginner near-identical
  sounds — a learner is asked to tell them apart twice, about six exercises
  apart, on a single day, and the SRS never asks again. Every other skill in
  the app is spaced; this is the only kind that is not. Make `letterContrast`
  reachable from review, so the discrimination survives the lesson that
  taught it.
verify: a test asserting a review lesson with confusable letters due can emit
  `letterContrast`, and that across the course's reviews every letter with a
  confusable partner meets one at least once after its teaching lesson.
notes: Found by CURRICULUM CRITIC reviewing URD-047 and judged its most
  serious finding, against BENCHMARKS.md's "enough times, in enough different
  shapes, to survive until tomorrow" — this shape has no tomorrow. Not fixed
  in URD-047 because reaching review means `reviewLetterPool` has to know
  about buckets and about which letters are co-known, which is real design
  rather than a call-site change.

## URD-062 — a base letter's note names its own shape, not the mark that separates it from its variants
attempts: 0
files: src/data/letters.ts
definition of done: every confusable bucket is one base letter
  (`confusableWith` unset) plus its variants, and the curated notes were
  written to that shape: a variant's note contrasts it against its base
  ("Daal with one dot above", "Kaaf with a second stroke on top"), while a
  base's describes it standing alone ("A soft angled stroke...", "Three
  teeth..."). URD-047's contrast exercise reveals a note after answering, and
  for the 13 base letters that note does not name the distinguishing mark.
  Two are worse than unhelpful when read after a wrong answer: `kaaf`'s "The
  stroke on top is part of the letter, not an accent. Do not drop it." is
  read by a learner who just wrongly tapped `gaaf` — which is kaaf with a
  *second* stroke on top — as endorsing what they picked; `seen`'s "Three
  teeth" is equally true of `sheen`, the letter they confused it with. Give
  each base letter's note a clause naming what its variants add and it does
  not have.
verify: a test asserting every base letter in a multi-member bucket has a
  note whose first sentence names the distinguishing mark (a dot, a stroke, a
  madda) or explicitly its absence.
notes: Found by THE CRITIC and CURRICULUM CRITIC independently while
  reviewing URD-047. URD-047 mitigated the wrong-answer case in code without
  touching content — `contrastNotesFor` shows the tapped letter's line
  alongside the target's, and since a bucket holds exactly one base, any
  wrong answer necessarily involves a variant whose line IS contrastive. What
  that cannot reach is the base letter's own correct-answer panel, where "no
  dot" is precisely the thing worth saying and nothing says it. That needs
  content, which is why it is filed rather than fixed.

## URD-063 — soak.js cannot act on a letterSpot screen at all, which blocks every letter lesson
attempts: 0
files: scripts/soak.js, src/exercises/LetterSpot.tsx
definition of done: `scripts/soak.js` has no `NAMED_TAP_KIND` entry for
  `letterSpot` (URD-045) at all — it falls to the generic `'tap'` fallback,
  same gap URD-047's own `letterContrast` had until this item. But
  `letterSpot` fails harder than a mislabelled random guess: its tiles
  (`LetterSpot.tsx`, sized to a bare glyph plus `my-1` margin, no width
  class) measure under `candidateOptions`'s `b.width > 110` floor, so soak
  finds zero acted-on-able candidates on the screen and reports it
  unanswerable outright — not wrong-more-often, unplayable. Measured directly
  (`npm run soak -- --lessons 8 --require letterContrast`, this session): 8
  of 8 attempts failed on the exact same `letterSpot` screen ("Which tile is
  alif?"), 0 lessons completed, and the run never got far enough into a
  letter lesson to reach `letterContrast` either. `letterSpot` renders in
  every letter-teaching lesson (URD-045), so today `npm run soak` cannot
  finish a single one.
verify: a solver entry plus a tile width that clears the floor (mirror
  URD-047's own fix to `letterContrast`'s width — a percentage tuned to one
  viewport is not enough, verify at both soak's fixed 412px and check:sizes'
  320px floor); then `npm run soak -- --lessons 8 --require letterSpot`
  completing at least one letter lesson, where today it completes zero.
notes: Found while resolving THE CRITIC's URD-047 finding 4, which named
  this as "adjacent, not URD-047's fault" — confirmed by running soak for
  real rather than assuming the `letterContrast` fix alone was enough to
  verify against a live run. Filed rather than fixed: `letterSpot`'s tiles
  are sized around the word's own real glyph clusters (multi-character in
  places — see that component's own comment), not a fixed bucket size like
  `letterContrast`'s, so the width fix is a real layout decision, not a
  copy-paste of this item's.

## URD-064 — soak's --track flag accepts any string and writes it straight into storage
attempts: 0
files: scripts/soak.js
definition of done: `const TRACK = arg('track', 'both')` (`soak.js`) does no
  validation against the real `LearnTrack` enum (`'script' | 'roman' |
  'both'`, `useSettingsStore.ts`) — a typo like `--track roams` now writes
  `{track: 'roams'}` straight into `harf-settings` via URD-051's
  `trackSettingsFor`, and `generator.ts`'s own `track !== 'roman'` checks
  treat anything that isn't literally `'roman'` as script-teaching, with no
  error anywhere in the chain. Fail loudly at startup instead: reject an
  unrecognised `--track` value by name, before the browser ever opens.
verify: `npm run soak -- --track roams` exits non-zero with a message
  naming the bad value and the three it accepts, rather than silently
  running with a track the app itself doesn't recognise.
notes: Found by THE CRITIC reviewing URD-051 — the same "silently wrong,
  not caught" shape that item fixed, just one layer up (the CLI arg itself,
  rather than what `enterAsGuest` did with it once parsed). Pre-existing:
  the unchecked `arg()` call was already there before URD-051, which only
  gave the string somewhere real to land. Not blocking for URD-051 — every
  value `soak.js` itself ever passes is one of the three valid strings, and
  `check:soak-track` only exercises those three, so this is a hardening
  item for a human mistyping the flag, not a defect in generated content.

## URD-065 — check:theme's withAlpha rule cannot see a faded text colour reached through a variable
attempts: 0
files: scripts/check-theme.js
definition of done: URD-052 taught `check:theme` to catch
  `withAlpha(palette.paper, N)` written *inline* at a `color:`/
  `placeholderTextColor=` site, but `Button.tsx` — the exact file whose
  real regression motivated URD-052 — reaches its disabled-label colour
  through a variable instead: `const text = disabled ?
  withAlpha(palette.paper, 0.55) : TEXT[variant]`, then `style={{ color:
  text }}` several lines later. URD-052's rule only ever looks at the
  token immediately following `color:`/`placeholderTextColor=`, so it
  never sees the `withAlpha` call at all when it's one hop away through a
  local variable — the same idiom this file already uses for every other
  colour it computes (`fill`, `edge`, `border` are all built the same
  way). Catch this shape too, or say plainly in the check's own doc
  comment that it only covers the literal-inline case (already done, by
  THE CRITIC's finding, as of URD-052's own fix) and is not the general
  claim its name suggests.
verify: with `Button.tsx`'s `text` variable temporarily set back to `0.4`
  (the file's own documented worst-case value, 3.24:1 against `ink700`),
  `npm run check:theme` reports it as a legibility-floor violation. Today
  it reports clean.
notes: Found by THE CRITIC reviewing URD-052, live-reproduced against the
  real file (reverted after). Not blocking that item — no real content
  regresses today, `Button.tsx`'s own value is already `0.55` — this is a
  coverage gap in the check itself, the same "the comment claims more
  than the code checks" mistake URD-052 exists to fix, now found one
  layer deeper in the fix it made. Closing it needs either a small
  forward data-flow trace (a local `const NAME = ... withAlpha(...) ...`
  followed by `NAME` reaching a text-colour prop within the same
  function) or accepting that a regex-based check cannot see through
  indirection and saying so — this file is deliberately "cheap and
  slightly conservative," not an AST walk, per its own header comment.

## URD-066 — check:theme's withAlpha rule cannot see a faded text colour whose ternary wraps onto multiple lines
attempts: 0
files: scripts/check-theme.js
definition of done: URD-052's `WITH_ALPHA_PAPER` regex excludes newlines
  from the gap between `color:`/`placeholderTextColor=` and the
  `withAlpha` call (`[^\n{}]*?`), so a ternary Prettier wraps onto several
  lines — which it will do the moment the expression crosses this
  project's configured `printWidth` (120; the real
  `LetterLabScreen.tsx:159` line this item fixed sits at 108 characters,
  single-line only by margin) — evades the check entirely. Catch a
  wrapped ternary too, without reopening the false-positive risk a
  newline-permissive version was found to have (a `color:`/
  `placeholderTextColor=` key followed, across a comma, by an unrelated
  sibling property whose own value happens to be a `withAlpha
  (palette.paper, …)` call would be misattributed as the *first* prop's
  value if newlines and commas are simply allowed through).
verify: with the real `LetterLabScreen.tsx:159` line reformatted onto
  Prettier's own natural multi-line ternary shape (value temporarily set
  back to `0.4`), `npm run check:theme` reports it as a legibility-floor
  violation. Today it reports clean.
notes: Found by THE CRITIC reviewing URD-052, live-reproduced against the
  real file (reverted after). Not blocking that item for the same reason
  URD-065 isn't: no real content regresses today, every real site this
  fix touches is currently single-line. Genuinely harder than it looks —
  a naive fix (drop the `\n` exclusion) was checked directly and shown to
  risk misattributing a sibling property's value to the wrong key, which
  would be a new class of false positive worse than the false negative it
  closes. Likely needs the same real parsing URD-065 would need, or a
  bound smarter than "no newlines" (e.g. stop at the next `key:` pattern,
  not just the next brace) — worth solving both in one pass since they
  share a root cause (this file is regex-based, not an AST walk).

## URD-067 — choti-he and do-chashmi-he share a teaching group and a visual family but have no confusableWith link
attempts: 0
files: src/data/letters.ts
definition of done: `choti-he` (ہ) and `do-chashmi-he` (ھ) sit in the same
  teaching group (`group: 8`, the file's own comment literally reads "the
  h family") and are taught back to back, yet neither names the other via
  `confusableWith` — unlike `khe`, which does link to `baRi-he`
  (`confusableWith: 'baRi-he'`) despite being in a different group
  entirely. The two glyphs differ only by the two "eyes" (dots) `do
  chashmi he`'s name describes, the same kind of close visual pair
  `confusableWith` exists to keep apart within a lesson's rounds
  (`bucketKeyOf`/`letterContrast`, generator.ts) and drill directly
  against each other (URD-047). Decide, against the real rendered glyphs
  at the sizes the app actually draws them, whether this is a genuine
  visual confusable pair that belongs in the same bucket, or whether the
  two "eyes" are visually distinct enough at those sizes that no link is
  warranted — either way, say so on purpose rather than by omission.
verify: a test in the same shape as `src/data/letters.test.ts`'s existing
  `confusableWith`-bucket invariants (one base per bucket, etc.) covering
  whichever answer is chosen — either asserting `do-chashmi-he` and
  `choti-he` share a bucket the way `khe`/`baRi-he` do, or a comment on
  both entries stating why they deliberately don't, checked against a
  real rendered comparison (a design-harness screenshot at the app's own
  letter-lab size, per this project's established harness technique) not
  assumed from the glyphs' Unicode names alone.
notes: Found by CURRICULUM CRITIC reviewing URD-053, judging the
  `do-chashmi-he` sound-collision exclusion (correct — it's a genuinely
  distinct aspirate phoneme, not a second spelling of plain h) but noting
  this is a *different* axis of potential confusion (visual shape, not
  sound) that URD-053 never touched and that predates it. Not blocking
  URD-053 — that item's own scope is the same-sound disambiguation notes,
  and `do-chashmi-he`'s own note already correctly explains its real
  phonetic role independent of this gap.
