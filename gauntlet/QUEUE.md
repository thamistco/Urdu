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

## URD-047 — A confusable letter pair is only ever kept apart, never asked to be told apart
attempts: 0
files: src/exercises/types.ts, src/exercises/generator.ts, src/exercises/*.tsx
definition of done: URD-022 spreads a lesson's visually confusable letters
  (`daal`/`Daal`/`zaal`, `re`/`Re`/`ze`/`zhe`, and every other
  `confusableWith` pair in `letters.ts`) apart in time so they are rarely
  drilled back to back, which prevents momentary interference but never
  actually tests whether a learner can tell the two apart — the specific
  skill this item's own definition of done names ("risks teaching the
  confusion rather than resolving it"). Add a discrimination exercise kind
  that poses a `confusableWith` pair directly against each other (e.g.
  "here are ز and ذ — which one is ze?") for at least one of a lesson's
  sightings of each letter that has a `confusableWith` partner, so the pair
  is confronted directly at least once, not only ever kept apart.
verify: a test asserting every letter with a `confusableWith` partner gets
  at least one exercise, somewhere in its teaching lesson, that poses it
  directly against that partner.
notes: Found by CURRICULUM CRITIC reviewing URD-022, who judged pure
  temporal separation addresses interference-in-the-moment but not the
  longer-term discrimination skill a learner needs for two letters they
  will keep encountering. Checked for duplicates in QUEUE.md and done/ —
  none found. Not blocking — URD-022's own definition of done offered
  separation as one legitimate, complete option and the fix satisfies it;
  this is a complementary, not corrective, addition.

## URD-050 — meaningPick can never offer another sentence as a distractor, at all
attempts: 0
files: src/exercises/generator.ts, src/data/art.ts
definition of done: URD-030 made the grammar climb's distractor pool
  concept-aware, but measured directly (not assumed): its fix only ever
  reaches `wordFromMeaning` exercises. `meaningPick`'s call to
  `distractorsFor` sets `distinctCue: true`, and `cueOf` (`data/art.ts`)
  falls through to `emo:${word.emoji}` for any sentence-derived `Word` —
  every sentence in the course shares the identical literal `'📝'` emoji,
  with no per-sentence override the way real vocabulary gets `NUMERALS`/
  `COLOURS`/`WORD_ICON`. `distinctCue`'s `usedCues` set is seeded with the
  *correct answer's own* cue before any candidate is even considered, so
  when the answer is itself a sentence, every other sentence — same
  concept or not, `preferred` pool or plain — collides with that seed and
  is rejected outright. Measured: 0 of 292 grammar-climb `meaningPick`
  exercises offer a same-concept distractor, both before and after
  URD-030's fix — not because the pool isn't concept-aware (it now is,
  identically to `wordFromMeaning`'s pool), but because `meaningPick`
  structurally cannot offer *any* sentence as a distractor for a
  sentence-answer, regardless of pool. Give sentences some way to be
  cue-distinct from one another (e.g. keying `cueOf` for a `topic ===
  'sentences'` word off something more specific than the shared emoji —
  its own `id`, say, the same way `NUMERALS`/`WORD_ICON` key off a word's
  `id` today for the words that need it) without breaking whatever
  `distinctCue` protects against for real vocabulary (a picture-based
  question showing two options with the same picture).
verify: a script or test measuring the same-concept-distractor rate
  specifically among `meaningPick` exercises (as `check:grammar-
  distractors.js`, added by URD-030, already separates by kind) reports
  it above 0%, without `check:answerable`'s own picture-distinctness
  rules regressing for real vocabulary.
notes: Found while verifying URD-030's own fix landed where the item's
  verify command expected. Not a defect in URD-030 — its fix does exactly
  what its own definition of done asked ("the pool ... no longer the
  default") and raised the *overall* same-concept rate from 19.6% to
  66.7% by fully saturating `wordFromMeaning` (0/292→100% is impossible;
  292/292 achieved everywhere `wordFromMeaning`'s own preferred pool has
  ≥1 usable candidate). This is a distinct, deeper architectural
  limitation `meaningPick` alone has, worth its own item rather than
  folding into URD-030's (whose own files/scope are the distractor *pool*,
  not the cue system `meaningPick`'s picture-question design depends on).
  Not BLOCKING for URD-030: every `meaningPick` exercise sampled remains
  fully answerable and honest, exactly as before — nothing broke, a
  ceiling on how far the improvement can reach was found, not a bug.

## URD-051 — soak's --track flag never actually sets the app's learning track
attempts: 0
files: scripts/soak.js, scripts/lib/serve-dist.js
definition of done: `npm run soak -- --track roman` actually plays the Roman
  track — `enterAsGuest`'s injected `harf-settings` carries `track: 'roman'`,
  not the guest default (`'both'`), verified by reading the real app's
  `localStorage` back after entry, not by trusting the CLI flag's own name.
verify: a script (or an assertion added to soak.js itself, gated behind a
  flag so it isn't paid on every real run) that enters as a guest with
  `--track roman`, reads back `localStorage['harf-settings']` in the page,
  and confirms `state.track === 'roman'` reports true. Today it reports
  `'both'`.
notes: Found by THE CRITIC reviewing URD-035's fix, which cited `npm run
  soak -- --start 200 --track roman --seed 55 --lessons 3` as one of three
  independent reproductions of that item's crash. Verified directly: soak's
  `--track roman` branch calls `enterAsGuest(page, url, { goal: 'speak' })`
  (`scripts/soak.js`'s `TRACK === 'roman'` spread), and `enterAsGuest`
  (`scripts/lib/serve-dist.js`) unconditionally writes `harf-settings` with
  only `soundEnabled`/`hapticsEnabled`/`reducedMotion` — `goal` feeds an
  unrelated onboarding field, never `track`. Reading `localStorage` back
  after entry confirms `track` stays at the guest default, `'both'`, no
  matter what `--track` says. Every soak run this session that passed
  `--track roman` (including this item's own "roman-track" reproduction,
  and whichever earlier items believed they were exercising the Roman
  track specifically) was actually driving the `both` track under a
  misleading label — the exact "the workflow said success and it was
  wrong" pattern this project's own CLAUDE.md names as its first
  non-negotiable, now found inside shared test infrastructure rather than
  CI itself. Does not invalidate URD-035's fix (independently re-verified
  live and via a passing/reverting unit test, both against the real
  `both` track), but any future item that means to test Roman-track-
  specific behavior via `npm run soak -- --track roman` is not testing
  what its own invocation claims until this is fixed.

## URD-052 — check:theme's legibility floor only sees Tailwind classNames, not inline withAlpha()
attempts: 0
files: scripts/check-theme.js
definition of done: `check:theme`'s `PAPER_FLOOR` rule also catches a
  faded-text colour built with `withAlpha(palette.paper, N)` (or any other
  token) directly in a component's `style` prop, not only a `text-paper/N`
  Tailwind className — both are the same colour on screen, and only one of
  them is currently checked.
verify: with a real component temporarily reading
  `withAlpha(palette.paper, 0.4)` for label text (a real value this repo
  has actually shipped, not a synthetic worst case), `npm run check:theme`
  reports it as a legibility-floor violation. Today it reports clean.
notes: Found by THE CRITIC reviewing URD-036's disabled-button fix
  (src/components/Button.tsx). That fix's first version read
  `withAlpha(palette.paper, 0.4)` for a disabled button's label — composited
  against `palette.ink700`, 3.24:1, exactly the documented worst-case value
  `check:theme`'s own comment cites as the reason `PAPER_FLOOR` (55%) exists
  at all ("57 strings below it... every one of them illegible"). It passed
  `check:theme` anyway, because that check's floor rule pattern-matches the
  Tailwind spelling `text-paper/(\d+)` in file text, and `withAlpha()` is a
  different spelling of the identical colour. Fixed at the call site for
  this one instance (raised to 55%, matching the floor directly rather than
  leaning on WCAG's disabled-control exemption to justify a number this
  project has already measured and rejected once) — but the check itself
  is still blind to the next person who writes the same call differently.
  A green `check:theme` on a file using `withAlpha` for text colour is not
  evidence of anything; this is the same "the comment claims more than the
  code checks" mistake this file's own generator-side sibling elsewhere in
  this repo was written to stop making, now found in a different check.

## URD-053 — se/seen/swaad, baRi-he/choti-he/do-chashmi-he and te/toe have the same undisambiguated-collision gap URD-038 fixed for ذ ز ض ظ
attempts: 0
files: src/data/letters.ts
definition of done: every letter in these three same-sound groups gets the
  same real disambiguation cue URD-038 gave the four z-sound letters — which
  one is the everyday/native default (if one is), and for the rest, an
  anchor to the word `LETTER_CONTEXT_WORD` (generator.ts) actually shows
  during that letter's own lesson, not the letter's own decorative `word`
  field.
verify: a test extending (or mirroring) `src/data/letters.test.ts`'s own
  pattern for every letter in these three groups — each note names the real
  pattern (not just "another of the N ways Urdu spells X") and, where the
  note cites an anchor word, that word matches `LETTER_CONTEXT_WORD.get(id)`
  exactly, the same two properties URD-038's test checks for the z-group.
notes: Found by CURRICULUM CRITIC reviewing URD-038, which explicitly
  scoped itself to "at least the ذ ز ض ظ group" per its own queue entry —
  left open there on purpose, not overlooked, but nothing tracked the rest
  until now. Today: `se` ("In Urdu it sounds exactly like seen, one of
  three letters spelling the same s") and `baRi-he` ("In Urdu it sounds the
  same as choṭī he, an ordinary h") name the collision with zero cue.
  `swaad` ("the spelling is inherited from Arabic") and `toe`/`te` ("In
  Urdu it sounds like te"/"the soft dental t") gesture at the real pattern
  but don't commit to an anchor word the way URD-038's fixed notes now do.
  Whether "everyday vs Arabic-loanword" holds for these groups the same way
  it measurably does for ذ ز ض ظ (verified directly there, not assumed) is
  itself unverified — check it against the real word corpus the way
  URD-038 did before writing anything, rather than assuming the same split
  applies.

## URD-054 — letterForm asks a learner to tell apart two glyphs that are pixel-identical for non-connecting letters
attempts: 0
files: src/exercises/LetterExercises.tsx, src/data/letters.ts, src/exercises/generator.ts
definition of done: `LetterFormExercise` shows only the bare glyph
  `letter.forms[position]` and asks "which position is this?", graded
  strictly against the one `position` value generated. For the letters
  where `connects: false` (13 of 40 — `alif`, `re`, `Re`, `baRi-ye`, `daal`
  and others), `letter.forms.isolated === letter.forms.initial` and
  `letter.forms.medial === letter.forms.final` as literal identical
  strings (e.g. `alif`: isolated and initial are both "ا") — a
  non-connecting letter has only two visually distinct shapes, not four,
  because it never joins to what follows. A learner shown the `initial`
  glyph for `alif` sees something pixel-identical to the `isolated` glyph,
  with no other context to disambiguate, and answering `isolated` is
  marked flatly wrong. Either accept either visually-identical answer for
  a non-connector, or stop generating the ambiguous position pairs
  (isolated vs initial, medial vs final) for a letter whose `connects` is
  false, asking only the one real distinction (joined vs unjoined) it
  actually has.
verify: a test asserting that for every letter with `connects: false`,
  `letterForm` never generates a question whose correct answer and at
  least one *other* option in `POSITIONS` are visually identical glyphs
  for that letter — or, if the chosen fix is "accept either", a test that
  grading a non-connector's ambiguous pair either way scores correct.
notes: Found by CURRICULUM CRITIC reviewing URD-041. Pre-existing —
  confirmed live already in letter-teaching lessons too (e.g. `l-1-2`,
  "Position practice", built specifically to drill positions, draws
  `alif` at `final` and `medial`, the identical pair) — not introduced by
  URD-041, but newly *reachable in review* by that fix: before it, review's
  one letter slot could never draw `letterForm` at all (see URD-041's own
  history), so review had zero exposure to this ambiguity; after it, the
  ambiguous pairing hit 4 of 10 real `letterForm` draws sampled across
  late-course reviews — roughly the ~32.5% share `connects: false` letters
  hold of the alphabet. Not blocking URD-041, whose own scope (vary the
  kind) is otherwise sound and doesn't touch `letters.ts`'s form data.

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
