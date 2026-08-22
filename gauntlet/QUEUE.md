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

`npm run check:shape` is the exception: it fails today, on purpose, and is
deliberately not in check:all. It states the curriculum target in a form a
machine can settle. Wire it into the workflow on the commit that makes it pass.

Items are dispatched to critics before they can be recorded PASSED; see
gauntlet/ROLES.md. The measured targets the curriculum critic holds you to, and
where they came from, are in gauntlet/BENCHMARKS.md.

---

## URD-035 — A grammar teaching card can crash to a blank screen
attempts: 0
files: src/exercises/GrammarExercises.tsx
definition of done: `GrammarTeachExercise` throws an uncaught
  `TypeError: Cannot read properties of undefined (reading 'N')` (N varies:
  observed 0, 1, 2, 3 across runs) partway through its reveal-a-stage flow
  ("Show the pattern" → "Show examples" → "Got it"), reproduced on two
  independent grammar concepts and seeds. The error is not caught by any
  boundary — the screen goes blank (empty `document.body.innerText`) and
  the app does not recover on its own. A test or a driver run should never
  see this; a real learner tapping through a teaching card at ordinary
  speed could.
verify: npm run soak -- --start 29 --lessons 3 --seed 7 --require grammarTeach
  reports 0 failures (today it reports an uncaught error and a blank
  "unanswerable" screen every attempt).
notes: Found chasing down THE CRITIC's BLOCKING finding on URD-005 (that
  `reading`/`dialogue`/`grammarTeach` couldn't be named by `--require`,
  which turned out to be hiding this — those screens use `<Button>`, not
  `<Choice>`, so they were never actually being exercised at all before
  this session, by `--require` or otherwise). Confirmed real and
  reproducible: identical crash shape on `g-pronouns` (seed 7, `--start 29`)
  and `g-gender` (seed 11, `--start 45`); ruled out a driver-timing race
  first (added a 200ms settle wait after each reveal tap — no change).
  Screenshots in `.soak/` from the reproducing runs show the blank result
  directly. Root cause not diagnosed past this point — likely an array
  index into `concept.table` or `concept.examples` going out of bounds
  during the stage-reveal sequence, but that needs someone reading
  `GrammarExercises.tsx`'s `stages`/`shown` logic against real `GRAMMAR`
  concept data, not more soak driving.

  Third independent reproduction found while shipping URD-034 (`--start
  200 --track roman --seed 55`): same alternating "unanswerable
  screen"/`TypeError: Cannot read properties of undefined (reading 'N')`
  shape on `grammarTeach`, confirmed independent of URD-034's own driver
  changes by re-running with its new grammarDrill solver forced back off
  — identical failure either way.

## URD-036 — A disabled button should look disabled, not just say why it is
attempts: 0
files: src/components/Button.tsx
definition of done: `Button`'s disabled state is `opacity: disabled ? 0.4 :
  1` on an otherwise-unchanged fill, border and label — for the `primary`
  variant (warm gold) this stays a shaped, coloured, clearly-tappable-looking
  pill at 40% opacity, not a control that reads as unavailable at a glance.
  Give disabled buttons a visual treatment (desaturating toward a neutral
  tone, a different fill entirely, or similar) that a learner recognizes as
  "will not respond" before they read anything next to it.
verify: DESIGN CRITIC screenshots the same control enabled vs. disabled and
  confirms the disabled state reads as unavailable at a glance, without
  needing the surrounding copy to explain it.
notes: Found by DESIGN CRITIC reviewing URD-006's lockout-screen fix,
  comparing the refill button enabled (gems ≥ 40) against disabled
  (gems < 40) at the same seed: "the only disabled cue is `opacity: disabled
  ? 0.4 : 1` on the whole Pressable — fill, border and label text all dim
  together to a muted orange, still shaped and sized exactly like a live
  CTA... at a glance, before reading, a warm 40%-opacity gold pill still
  reads as 'a button,' just a slightly duller one." URD-006's own fix (a
  subtitle explaining *why* the button won't respond) closes the
  explanation gap but not this one — flagged there as real but out of that
  item's scope, since `Button` is shared across the whole app and changing
  its disabled treatment needs its own review, not a decision folded into
  an unrelated screen's copy fix.

## URD-037 — check:path has no floor, so a real regression could read as a pass
attempts: 0
files: scripts/check-path.js
definition of done: `check:path` asserts only an upper bound (`n` mounted
  rows over `BOUND` fails); nothing asserts a *lower* bound, so a scenario
  that mounts zero rows — the accordion silently failing to render anything
  — passes exactly as cleanly as one mounting the expected 81 or 94. Add a
  floor per scenario (e.g. "fresh guest" should mount at least the lessons
  in an open level's own unit, not zero) so a genuine render failure fails
  loudly instead of reading as an excellent bound.
verify: temporarily force the accordion's `isOpen(lvl)` gate to always
  `false` (mounting nothing) and confirm check:path now fails; today it
  would report "0 lesson rows mounted (bound: 114)" and exit 0.
notes: Found incidentally verifying URD-006 — `npm run check:all`, run
  twice back to back, reported a different scenario mounting 0 rows each
  time ("learner deep into the course: 0" once, "fresh guest: 0" the other),
  while `npm run check:path` run alone, three times in a row, reported the
  normal 81/94/94 every time. So this is a real flake under check:all's
  full-sequence load (not reproduced standalone, not investigated further
  here — a timing race between the build and the check, or system load from
  running 25 steps back to back, is the likely cause) that the check's own
  bound cannot catch either way, since "0" is a legal reading. Unrelated to
  URD-006's own change (no file this item touched is anywhere near
  `check-path.js` or `HomeScreen.tsx`'s accordion).

## URD-038 — ذ ز ض ظ are avoided in listening questions, never actually taught apart
attempts: 0
files: src/data/letters.ts
definition of done: URD-007 stopped `letterPick` from ever pairing two
  same-sound letters (ذ ز ض ظ, and the te/toe, se/seen/swaad and
  baRi-he/choti-he/do-chashmi-he groups) as options, which closes the
  unanswerable-question bug — but none of these letters' `note` fields in
  `letters.ts` teach a learner *which* letter a real word uses. Each note
  only names the collision: zaal's says "another of the 'z' family", zoe's
  says "another of the four ways Urdu spells 'z'". A learner who writes
  Nastaliq directly, or hits a `wordBuild` tray whose randomly-drawn decoy
  happens to be a same-sound rival, has no rule to reach for. Give at least
  the ذ ز ض ظ group a real disambiguation cue — e.g. "ز is native Urdu
  vocabulary, ذ ض ظ are almost always Arabic/Persian loanwords" if that
  holds up, a short high-frequency-word anchor per letter, or similar —
  either in the `note` field or a dedicated teaching moment.
verify: a test or check asserting each of the four ز-sound letters' `note`
  (or an added field) contains a disambiguation cue distinct from merely
  naming the other three letters in the group, plus a manual read of the
  four notes confirming the cue is actually true and usable.
notes: Found by CURRICULUM CRITIC reviewing URD-007. Explicitly not
  BLOCKING that item — URD-007's own definition of done named "not
  generated" as a valid alternative to "taught by spelling context", and
  the lead took that branch — but real: 204 of 2,281 words (8.9%) contain
  one of these four letters. The gap is muted today because
  `TypeWordExercise` matches Roman input (`skeleton()` in
  `src/lib/roman.ts`), so a learner who types the Roman spelling never has
  to choose the correct Urdu letter — but not eliminated, and not something
  to rely on staying true if the Roman-matching logic ever tightens.

## URD-039 — A review's fallback content for a mastered unit never rotates, ever
attempts: 0
files: src/lib/review.ts
definition of done: `prioritizedPool`'s per-tier shuffle seed
  (`` `${lessonId}:words:${i}` `` / `` `${lessonId}:letters:${i}` ``) has no
  source of variation across replays of the same review by the same learner
  — same lesson, same `known` set, byte-identical output, every time. Once a
  learner has graded every word in a unit (the common case for a unit small
  enough that a fresh review of it is even reachable), the fallback always
  slices off the same fixed subset of that unit's words and never surfaces
  the rest. Give repeated reviews of the same unit some source of variation
  once the learner already knows everything in scope — a rotation keyed on
  something that actually changes between visits (visit count, a stored
  per-review cursor, or similar), not a a value fixed by `lessonId` alone.
verify: a test seeding a review's `known` set to the closing unit's full
  word list, calling the pool-selection twice with state representing two
  different real visits (however "visit" ends up being modeled), and
  asserting the two calls' chosen words differ when the unit has more words
  than the review's word-slot count.
notes: Found independently by both THE CRITIC and CURRICULUM CRITIC
  reviewing URD-016. Measured on rev-gender-and-number (u6, 20 words) with
  the whole unit known: the same 4 words
  (w-surkh, w-gulaabi, w-pyaazi, w-neela) are offered on every single call,
  and the other 16 never appear via this fallback under any circumstance.
  On rev-the-wider-world (u39, 117 words) only 19 (16%) can ever surface
  this way. Pre-existing behavior (seeded, not random, content selection is
  this project's deliberate convention — see `lib/shuffle.ts`'s own
  docstring) made newly visible, not newly broken, by URD-016 shrinking the
  pool a fallback draws from down to a single unit's dozen-to-hundred words,
  where a shuffle quirk that barely mattered against a course-wide pool of
  thousands now determines the entire fallback's content. Not blocking.

## URD-040 — Review lessons never touch the grammar concepts or sentences that name their own unit
attempts: 0
files: src/lib/review.ts, src/exercises/generator.ts
definition of done: `taughtByLessons` (`lib/review.ts`) only counts
  `kind: 'letters'` and `kind: 'vocab'` lessons; `itemsOf` (`generator.ts`)
  returns `[]` for grammar, sentence, reading and dialogue exercises by
  design, since none of those are SRS-gradable. Concretely,
  rev-saying-who-you-are (u4, "Saying Who You Are") draws its entire review
  from `V('rooms')`/`V('adjectives')` and never once touches `g-pronouns` or
  `g-to-be` — the two grammar concepts the unit is named for and organized
  around. Give a unit review some way to touch the grammar concepts (and
  ideally the sentence-building practice) its own lessons taught, not only
  its vocabulary.
verify: a test asserting a review whose unit includes a grammar lesson
  (e.g. rev-saying-who-you-are) generates at least one exercise referencing
  that unit's own `conceptId`, once a mechanism for it exists.
notes: Found by CURRICULUM CRITIC reviewing URD-016, as a bonus while
  checking whether review content matches "what the unit was actually
  about." Pre-existing — grammar/sentence content has never fed the
  SRS/review system, unrelated to URD-016's own change — but a real gap
  worth its own item rather than folding into a scoping fix that was never
  about which *kinds* of lesson a review can draw from.

## URD-041 — A review's one letter slot always lands on the same position, and so always the same exercise kind
attempts: 0
files: src/exercises/generator.ts
definition of done: `letterExerciseAt(letter, turn, positionIndex)` picks
  `letterTrace` whenever `turn % 3 === 0` and a glyph mask exists — true for
  every glyph sampled. `buildLessonExercises`'s review branch calls
  `letterExerciseAt(l, i, i)` where `i` is the item's index within `refs`
  (due items first, then the interleaved fallback); the fallback's own
  interleave (`fallbackReviewRefs`) always places its first letter at index
  0 of the mixed array. So whenever a review has no letters due (the common
  case from about u14 on, now that URD-017 usually reserves exactly one
  letter slot) that slot lands at `i=0` and is `letterTrace`, every time,
  never `letterForm` or `letterPick`. Measured directly on real generated
  reviews with nothing due: u14 through u39 (26 straight reviews) all draw
  `letterTrace` and only `letterTrace` for their one letter question.
  `letterForm` — the joining-position drill the app is specifically built
  around — never appears in that entire stretch. Vary the position (and so
  the kind) a lone review letter lands on, rather than letting it be
  whatever a fixed loop index happens to produce.
verify: a test that builds several real late-course reviews (u14+) with
  nothing due and asserts the letter exercise kinds drawn are not identical
  across all of them.
notes: Found independently from two angles reviewing URD-017: THE CRITIC
  (MINOR) — "the sole letter exercise lands in the same relative position
  every time, once letterCount is 1" — and CURRICULUM CRITIC (MAJOR,
  curriculum severity) — "the one letter slot late-course is spent entirely
  on tracing, never on the app's own core position-form skill." Same root
  cause (turn/positionIndex tied to a loop index that stopped varying once
  URD-017 shrank the typical letter count to ~1), described from two
  different angles — filed as one item rather than two. Pre-existing
  selection logic (`letterExerciseAt`), made into the dominant outcome
  rather than one of several by URD-017 lowering the letter count that
  used to cycle through positions 0, 2, 4... and so through all three
  kinds. Not blocking — nothing crashes or answers incorrectly, and
  `letterTrace` is itself a legitimate exercise kind, just no longer one of
  three.

## URD-042 — Half the alphabet gets no review exposure across the back two-thirds of the course
attempts: 0
files: src/lib/review.ts, src/exercises/generator.ts
definition of done: with only one letter slot per review from roughly u14
  on (URD-017), and `reviewLetterPool`'s per-review pool shuffled with a
  seed keyed on `lessonId` alone, each review effectively draws one letter
  from an independent shuffle of the full 46-letter course-wide pool.
  Measured directly: tallying every letter that appears in a
  `letterForm`/`letterPick`/`letterTrace` exercise across all reviews u10
  through u39 (30 reviews) with nothing due, only 21 of 40 letters (52.5%)
  are ever touched; 19 never appear, including `be`/`pe` — the very first
  letter pair taught, in `l-1` — and three of the four Urdu "z"-sound
  letters (`zaal`, `ze`, `zhe`). Since the shuffle is seeded (deterministic,
  not per-play), this is the fixed, reproducible content of the course
  today, not sampling noise that might average out. Give letter selection
  across reviews some notion of coverage — round-robin, a stored
  last-reviewed-letter cursor, or similar — so a learner who studies the
  whole course actually meets every letter again somewhere in it, not just
  the ones an independent per-review shuffle happened to surface first.
verify: a test simulating every review lesson in course order and asserting
  every letter in `LETTERS` is drawn by at least one of them.
notes: Found by CURRICULUM CRITIC reviewing URD-017. A structural
  consequence of two independently-reasonable pre-existing designs
  (per-review independent shuffle; one letter slot per late review) meeting
  for the first time once URD-017 made "one letter slot" the norm rather
  than "four or five." Not blocking, and not something URD-017 itself
  promised to fix — its own acceptance bar ("reaching near zero") is what
  makes one slot the norm in the first place — but a real coverage gap
  worth its own item, since fixing it well means changing how letters are
  *selected* across reviews, not just how many are asked per review.

## URD-043 — A letter's last sighting in its lesson is usually the easy kind, not the hard one
attempts: 0
files: src/exercises/generator.ts
definition of done: URD-019 grades an item's SRS state on the last of its
  sightings this lesson visit (with a same/last-two-sightings-agree guard).
  That is provably the hardest, most diagnostic demand for vocabulary — every
  one of the 2,281 words' staggered climb ends on `produce` (`typeWord` or
  `wordBuild`), 100% of the time, both tracks — but not for letters. Measured
  directly across all 9 letter lessons: `letterExerciseAt`'s turn rotation
  (`t = (round + idx + turnOffset) % 3`, cycling `letterTrace`(produce) →
  `letterForm`(recognise) → `letterPick`(recognise)) lands a letter's *final*
  round on a recognise-tier kind 67.4% of the time (31 of 46 letters
  sampled), because `idx`/`turnOffset` shift which phase falls last largely
  arbitrarily, unlike vocabulary's fixed ascending climb. Give the letter
  pipeline the same property vocabulary already has: its last sighting is
  reliably its hardest one.
verify: a test building every real letter lesson and asserting each letter's
  final sighting is `letterTrace` (produce), not `letterForm`/`letterPick`.
notes: Found by CURRICULUM CRITIC reviewing URD-019. Not blocking — nothing
  crashes, and URD-019's own last-two-sightings-agree guard (added during
  this same critique) already cuts the practical risk of a single lucky
  final guess from ~1-in-4 to ~1-in-16 regardless of which demand tier that
  guess happens to be on — but the deeper mismatch this finding names is
  real and separate: even a *confirmed* recognise-tier pair of sightings is
  weaker evidence of recall than a confirmed produce-tier pair would be, and
  today only vocabulary's pipeline is designed to guarantee the stronger
  kind. Fixing this well means reordering the letter pipeline's turn
  selection, which touches the same lessons URD-020/021/022 (letter-lesson
  content composition) already have queued work against — check those for
  overlap before starting, since a turn-ordering fix and a content-mix fix
  could plausibly land as one change.

## URD-044 — Nothing exercises the LessonScreen↔SRS-grading wiring end-to-end
attempts: 0
files: src/screens/LessonScreen.tsx, src/lib/sessionGrading.ts
definition of done: `sessionGrading.test.ts` covers `recordSighting`/
  `flushSessionGrades` in complete isolation from React, and `check-srs.js`
  covers `srs.ts`'s SM-2 primitives in isolation from `sessionGrading.ts` —
  grepping both for `sessionGrading|recordSighting|flushSessionGrades`
  returns nothing. The actual bug URD-019 fixed (the wrong sighting winning)
  lived entirely in the `LessonScreen`↔`sessionGrading` integration — the
  ref/effect wiring that decides when a visit's pending grades get flushed —
  and that integration has zero automated coverage anywhere in `npm run
  check:all`. A future edit that "simplifies" the double-flush (the explicit
  flush in `advance()` plus the unmount-safety-net effect) or reintroduces a
  stale-closure bug in the `useEffect` dependency wiring would pass every
  existing check. Add a test that plays a real lesson through `LessonScreen`
  (or the smallest harness that exercises the same effect/ref wiring without
  a full render) with a wrong-then-right sequence for one item, and asserts
  the persisted `useProgressStore` SRS state afterward matches the last
  sighting, not the first.
verify: the new test passes, and reverting the double-flush or the
  per-visit-Map wiring in `LessonScreen.tsx` back to the old single-gate
  design makes it fail.
notes: Found by THE CRITIC reviewing URD-019. Not blocking — traced every
  claimed flush path in `LessonScreen.tsx` against the actual code (not just
  its doc comments) and found all of them correct today — but there is
  currently no component-level or integration test setup anywhere in this
  project (no React Testing Library, no jsdom/happy-dom vitest environment;
  `vitest.config.ts` runs pure-logic tests only, see its own doc comment).
  Adding this properly means deciding on and wiring up that test
  infrastructure, not just adding one more `.test.ts` file next to the
  others — scope it as that rather than underestimating it as "one more
  test."

## URD-045 — A letter's context sighting never asks the learner to find the letter in the word
attempts: 0
files: src/exercises/types.ts, src/exercises/generator.ts, src/exercises/*.tsx
definition of done: URD-020 gave every letter a real-word context sighting,
  but the exercise kinds it can produce (`multipleChoice`/`meaningPick`/
  `listenTap`) are the same whole-word recognition questions used for
  ordinary vocabulary everywhere else in the app — none of them highlight
  or ask about the specific taught letter inside the word. A learner
  answers correctly by picture/meaning matching without ever needing to
  find or name the letter's shape within it, so the sighting shows a letter
  in context without testing that the learner can actually read it there.
  Build a dedicated exercise kind that asks the learner to identify the
  taught letter's position/occurrence inside its context word (e.g. tap
  which tile/segment of the written word is the letter just taught), and
  give it one of the context-sighting slots `LETTER_CONTEXT_WORD`
  (`generator.ts`) already assigns.
verify: a test asserting a letter lesson's context-sighting exercise
  requires identifying the letter's position within the shown word, not
  just its whole-word meaning.
notes: Found by CURRICULUM CRITIC reviewing URD-020. Not blocking — URD-020
  itself offered two designs ("more than one context word per lesson, or a
  dedicated 'spot the letter' exercise kind") and correctly scoped its own
  fix to the first, cheaper one, entirely within `generator.ts`. This is the
  second, bigger design the item named but did not attempt — a new exercise
  kind touches new UI (`src/exercises/*.tsx`), new answerability rules
  (`check-answerable.js`), and `check:coverage`'s exercise-kind audit, not
  just content-generation logic, so it is real, separate work rather than a
  gap in URD-020's own delivery.

## URD-046 — A letter lesson's one unavoidable confusable pair always collides identically, every round
attempts: 0
files: src/exercises/generator.ts
definition of done: `separateConfusables` (URD-022) spreads visually
  confusable letters apart within a lesson's rounds, but the round-major
  loop reuses one fixed order every round, so wherever a bucket forces one
  residual adjacency (only `l-3`'s 4-letter `re` family — a bucket exactly
  `ceil(groupSize/2)` — real corpus today), it is the identical pair,
  `zhe` then `re`, at all 5 of the lesson's round transitions, not a
  varied one. Reinforcing the exact same two letters back to back five
  times is a worse version of the risk this item names ("teaching the
  confusion") than hitting five different pairs once each would be. Vary
  which specific bucket member sits at each end of the round across
  rounds — without changing which letter has which stable index, since
  `turn`/`position` below are computed from a letter's own index plus the
  round number and only cycle correctly if that index never moves (see
  `separateConfusables`'s own doc comment, and the multi-round history two
  functions below it, for what breaks if a letter's index depends on the
  round) — so a learner who does see the forced collision sees a different
  pair of the family each time, not one pair five times over.
verify: a test asserting that across a lesson's round transitions, no two
  round-boundary confusable-pair occurrences involve the identical two
  specific letters twice, for every real letter lesson where a forced
  adjacency exists.
notes: Found designing URD-022's fix. Not blocking — URD-022 itself already
  reduced `l-3`'s confusable-adjacent count from 30 (5 pairs internal to
  every one of 6 rounds, under the pre-fix raw ordering) to 5 (the same one
  pair, once per round transition), a real, measured improvement; this is
  a further refinement to *which* pair recurs, not whether one does.

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
