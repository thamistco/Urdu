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

## URD-A02 — Make a lesson a sitting
attempts: 1
files: src/data/units.ts, src/exercises/generator.ts, scripts/check-shape.js
definition of done: `npm run check:shape` exits 0, then is wired into
  .github/workflows/deploy-preview.yml so check:all picks it up. Drops caps a
  session at 5 minutes; Duolingo runs 5 to 10. See gauntlet/BENCHMARKS.md.
verify: npm run check:shape
notes: The trap is fixing this by raising the word count alone. Neither
  benchmark gets to five minutes with volume — Duolingo introduces a handful of
  new words in a ten minute lesson and repeats each four to six times. Harf
  repeats 1.8 times. Both dials move together or the lesson gets longer and
  teaches worse.

  Do NOT weaken check:coverage to get there. Every one of the 2,281 words stays
  taught by exactly one lesson; this is about how they are grouped, not how many
  survive. And expect this to move learner progress a second time, so it lands
  with URD-003 or immediately after it, never before.

  Dispatch the curriculum critic and THE CRITIC. This item is a rewrite of the
  decision made in 35fa67a, by the same hand that made it, which is exactly the
  situation the critics exist for.

  ATTEMPT 1 (2026-08-09, d778928 and before) did the vocabulary half and only
  that half. Vocabulary lessons went 493 to 233, 4.6 to 9.8 new words, 1.8 to
  3.07 sightings, 1.3 to 3.3-6.5 minutes; none is outside the band. The three
  passes were re-emitted as a staggered pipeline after review found runs of 14
  identical questions, and check:shape gained the run and single-kind-share
  rules that catch that, measured per track.

  WHAT IS LEFT, and it is the whole reason this is still here. URD-010
  closed the review row, URD-013 closed the letters row, URD-012 closed the
  phrases share/run problem, the sentences work (commit 0453fa7,
  claude/gauntlet-sentences-length) closed the sentences length row, and
  the grammar work (claude/gauntlet-grammar-length) closed the grammar
  length row — 22 of 25 grammar lessons went from teach-plus-drills-only
  (2-6 exercises, 0.3-0.9 min) to a meet-recall-produce climb over each
  concept's own tagged sentences (12-22 exercises, 1.8-3.3 min), and the
  g-to-be run/share violation (50% grammarDrill) closed as a side effect.
  Course-wide short-lesson count is now 4 of 319 (was 26): 1 pre-existing
  phrases residual and 3 grammar concepts too thin on tagged sentences to
  reach 3 minutes without repeating a question (URD-029). Every row of
  this item's original backlog has had its length half addressed:

    phrases    1   and 0.9 min, 6 exercises — length only; run/share is done
    grammar    3   g-plurals/g-pronouns/g-ability — tagged-sentence pool too thin (URD-029)

  None of review, letters, phrases, sentences or grammar is fully closed,
  only their length or run/share half is. Review still samples the wrong
  material (URD-016), never lets a letter share fall off after the
  alphabet (URD-017), and never asks for meaning in the reading direction
  (URD-018). Letters is 96.8% isolated-glyph recognition against
  reading-in-context (URD-020), its one context word touches at most 1 of
  a group's 4-7 letters (URD-021), and drills visually confusable letters
  (daal/Daal) with no separation (URD-022). Phrases can still fail its own
  run/share rule on an unlucky future draw — 8.24% of them, computed
  exactly — because the fix reassigns after a uniform draw rather than
  guaranteeing the draw itself has enough typeable phrases (URD-023).
  Sentences AND grammar's sentence-reinforcement climb both lean on
  whole-sentence recognition for 2 of their 3 reps rather than the
  sentence-building the app's own docs call its differentiator (URD-025,
  now scoped to both call sites), sentences draws grammar constructions
  two lessons haven't taught yet — now 3x amplified and, for the first
  time, SRS-scheduled (URD-026) — draws from only 32% of its sentence pool
  (URD-027), and has a check:coverage blind spot for its (and grammar's)
  new exercise kinds, currently closed only by coincidence for both
  (URD-028). Grammar's own climb additionally answers 73% of its questions
  by topic recognition rather than by parsing the construction being
  taught, because its distractor pool isn't concept-aware (URD-030). None
  of these is a length problem, so none blocks this item — but do not read
  "0 short lessons for review/letters/sentences/grammar" or "phrases
  run/share is clean" as any of them being finished.

  URD-013 also cost four rounds of critique before its length fix alone was
  right: two critics found three separate blocking defects across the
  first two commits, and fixing the second-round finding narrowly
  reproduced a different violation of the same rule it was fixing, twice.
  Read gauntlet/LEDGER.md's URD-013 entries before touching grammar or
  sentences next — the pattern (verify one property, ship, have review find
  a different property broke) is the thing to not repeat, not just the
  specific bugs.

  Plus 2 units over the 12 lesson ceiling: u27 has 13, u39 has 15.

  Each of those five needs a different answer and none of them is "add words".
  Do NOT reach for the thresholds. MIN_MINUTES is 3.0 against two products that
  sit at 5, and moving it is how this item gets marked done without a learner's
  experience changing.

## URD-026 — Sentences drill grammar the learner hasn't been taught yet, now 3x
attempts: 0
files: src/exercises/generator.ts (readableSentences), src/data/units.ts
definition of done: `readableSentences` filters a sentence pool on
  individual word forms only — it has no notion of whether the
  *grammatical construction* a sentence illustrates (future tense,
  ability, obligation, comparative...) has been taught by a `G()` lesson
  yet. Measured against the real path order: `s-intermediate` (units.ts,
  an elementary-unit lesson) draws sentences tagging g-future/g-ability/
  g-obligation/g-comparative in 6 of 8 picks, all taught 90-115
  lesson-positions later; `s-intermediate-2` draws 8 of 8 untaught. Give
  `readableSentences` (or `S()`) a concept-readiness filter mirroring how
  word-level readiness already works, or move the two offending lessons
  later in the path so their prerequisite concepts are already taught.
verify: a script cross-referencing each sentences lesson's drawn sentence
  ids against ALL_LESSONS grammar-teaching order reports 0 lessons with a
  drawn sentence whose tagged concept is taught later in the path.
notes: Found by CURRICULUM CRITIC reviewing 0453fa7. Pre-existing — the
  word-only filter and the two lessons' placement both predate this
  commit — but this commit is what first pipes that exposure into SRS
  (via meaningPick/wordFromMeaning's `gradeItem` calls) and triples how
  often an under-taught construction is shown in one sitting. Same shape
  as the letters SRS-defeat bug fixed generically this session
  (src/lib/sessionGrading.ts), applied to grammar readiness instead of
  scheduling — an existing gap this project has already been burned by
  once, now amplified by a length change rather than caused by one.

## URD-027 — 68% of the sentence pool is never drawn by any lesson
attempts: 0
files: src/exercises/generator.ts, src/data/sentences.ts, scripts/
definition of done: a coverage check (mirroring check:coverage's existing
  word-level guarantee) proves every sentence in SENTENCES is drawn by at
  least one sentences lesson at its level, or documents an explicit,
  deliberate exemption for the ones that are not. Measured today: 81 of
  256 sentences (31.6%) are ever drawn — beginner 22/67, elementary 16/69,
  intermediate 24/63, advanced 19/57 — because each lesson does an
  independent `seededShuffle(pool, lesson.id).slice(0, lesson.size)` with
  no allocation across lessons at the same level, the same shape of gap
  vocab had before wordIds replaced random topic sampling.
verify: a new check:sentence-coverage script (or an addition to
  check-coverage.js) exits 0 only when every sentence is reachable.
notes: Found by CURRICULUM CRITIC reviewing 0453fa7, who was explicitly
  asked to check whether this commit inherited vocab's coverage fix rather
  than assume it did — it did not. Predates this commit (the draw
  mechanism is unchanged; only `size` moved 5→8), but this is the same bug
  class gauntlet/ROLES.md names as the project's founding motivation
  ("a full playthrough... reached 608 of its 2,281 words"), now confirmed
  present for sentences too and previously unmeasured.

## URD-028 — check:coverage cannot see meaningPick/wordFromMeaning sentence-derived exercises
attempts: 0
files: scripts/check-coverage.js
definition of done: check-coverage.js point 5 (lines ~163-197) already
  scopes itself to `l.kind === 'sentences' || l.kind === 'grammar'`, but
  only inspects `ex.sentence && ex.sentence.words` — a field only
  sentenceBuild exercises carry. meaningPick/wordFromMeaning exercises
  drawn from SENTENCE_WORDS carry `.word` instead (topic 'sentences'), so
  2/3 of every sentences lesson's exercises AND 2/3 of every grammar
  lesson's sentence-reinforcement exercises (added by URD-024's grammar
  follow-up) are invisible to this check today. Extend it to also resolve
  `ex.word` back to its sentence's words when `ex.word.topic ===
  'sentences'` — one fix covers both lesson kinds, since both draw from
  the same `SENTENCE_WORDS` pool.
verify: re-run check:coverage after temporarily breaking a sentence's
  meaningPick/wordFromMeaning path (e.g. feeding it an unteachable word id)
  in both a sentences lesson and a grammar lesson, and confirm the check
  now fails both, where today it would stay green for either.
notes: Found by THE CRITIC reviewing 0453fa7 (sentences lessons). Reviewing
  URD-024's grammar follow-up, THE CRITIC confirmed the same gap now
  silently covers grammar lessons too — the file's scoping condition
  already named `grammar`, so no new code change was needed for the check
  to apply there, but the underlying defect it can't yet see now has twice
  the surface. Verified this causes no live false-pass today only by
  coincidence, for both lesson kinds: the round-robin structure guarantees
  every sentence a lesson draws also gets a sentenceBuild turn in the same
  lesson, and that turn happens to cover what the recognition turns don't.
  That coincidence itself rests on `sentenceExercise` never returning
  undefined on the roman track, which is true for all 256 sentences today
  but maintained by discipline, not enforced — the generator's own comment
  says as much. MAJOR, not BLOCKING: nothing is wrong today, but the check
  would not catch it if something broke, in either lesson kind.

## URD-029 — One grammar concept stays short because its tagged-sentence pool is thin
attempts: 0
files: src/data/sentences.ts, src/data/units.ts
definition of done: g-plurals (2.70 min, 3 of 4 tagged sentences readable
  at its lesson position) stays under check:shape's 3-minute floor.
  Originally three concepts (g-plurals, g-pronouns, g-ability) — URD-025's
  extra sentence-reinforcement round lengthened all three, and moved
  g-pronouns (2.70→4.2 min) and g-ability (2.55→4.05 min) into the band;
  only g-plurals remains short, its own gap also narrower now (1.80→2.70
  min) but not closed. Check the cheaper fix first: one of its 4 tagged
  sentences (`s-39`, "میز پر تین کتابیں ہیں") is dropped by
  `readableSentences` only because "میز" isn't taught yet at g-plurals'
  current path position — either move g-plurals a few positions later
  (past wherever "میز" is taught), or re-tag a different, already-readable
  sentence to `g-plurals`, before assuming new content authoring is
  required.
verify: npm run check:shape -- --kind=grammar reports 0 of 25 grammar
  lessons under 3 minutes.
notes: Found reviewing URD-024's grammar follow-up. Both THE CRITIC and
  CURRICULUM CRITIC independently confirmed the degradation is graceful —
  no crash, no repeated question, no truncation, just genuinely short —
  and that leaving it documented rather than forced (matching URD-023's
  precedent for phrases) is the right call for this item. CURRICULUM
  CRITIC specifically flagged that the original code comment attributed
  g-plurals' shortfall entirely to "4 tagged" sentences when the real
  count feeding the climb is 3 readable of 4 tagged — fixed in the comment
  as part of recording URD-024 passed, and folded into this item's DoD so
  the placement-vs-content-scarcity distinction isn't lost.

  UPDATED reviewing URD-025 (sentenceBuild ratio rebalance): THE CRITIC
  found URD-025's own verify command (`check:shape -- --kind=grammar`)
  still fails on this exact pre-existing residual (g-plurals only, now
  2.70 min) and flagged it BLOCKING for that item on the letter of its own
  verify line, even though URD-025 measurably improved the number and two
  of the three original concepts now clear the floor entirely. Resolved
  there by scope carve-out (this item's own files, `src/data/sentences.ts`
  and `src/data/units.ts`, are content, not `generator.ts` — the file
  URD-025 was scoped to) rather than by URD-025 attempting a generator-side
  workaround for a content gap. Re-measure this item's own numbers once
  attempted, since URD-025 already moved them once without anyone asking
  it to.

## URD-030 — The grammar climb's distractor pool doesn't know which concept it's reinforcing
attempts: 0
files: src/exercises/generator.ts
definition of done: `reinforcePool` in the grammar branch (feeding
  `meaningPick`/`wordFromMeaning` distractors) is every `SENTENCE_WORDS`
  entry at the concept's CEFR level, drawn with no concept-awareness at
  all — the same flat, unweighted draw `distractorsFor` already does for
  plain vocabulary. Measured across all 290 meaningPick/wordFromMeaning
  exercises the grammar climb currently emits: only 26.9% (78 of 290) have
  even one distractor tagged to the same grammar concept as the correct
  answer. The other 73.1% offer a correct sentence (e.g. a comparative)
  against three topically unrelated options (e.g. "I like listening to
  music" / "You should rest" / "The doctor gave medicine") — answerable by
  topic/vocabulary recognition alone, without parsing the comparative
  marker, passive auxiliary, or plural ending the lesson is actually
  about. Bias the distractor draw toward same-level, different-concept
  sentences that are near-misses in form, so a correct answer requires
  noticing the construction, not just the topic.
verify: a script measuring same-concept-distractor rate across all
  generated grammar-climb meaningPick/wordFromMeaning exercises reports it
  well above today's 26.9% (100% is not required — same-concept sentences
  may not exist for every draw at small pool sizes — but the flat,
  unweighted draw should no longer be the default).
notes: Found by CURRICULUM CRITIC reviewing URD-024's grammar follow-up.
  Distinct root cause from URD-025 (which is about the round ratio, not
  which pool feeds distractors) — do not fold into it. Not BLOCKING: every
  sampled exercise was still answerable, fluent, and free of exact-meaning
  giveaways, so nothing is wrong, but the climb's implicit claim to
  "reinforce this construction" is not backed by most of the questions it
  actually asks.

## URD-032 — The path's stage-open scroll is a bigger jump than it needs to be, and can go stale mid-session
attempts: 0
files: src/screens/HomeScreen.tsx
definition of done: Two related, non-blocking gaps in URD-002's accordion
  fix, both found in round-2 critique of commit `1344973`:
  (1) Opening a course stage resets scroll to the very top of the page
  (past the greeting, level card, continue card and today's-word card)
  rather than to the accordion itself. DESIGN CRITIC measured this costs
  a real but short scroll back down (~500px, not the ~8000px round trip
  the bug being fixed would have cost) — not disorienting, just not as
  tight as it could be. A middle ground (landing just above the
  accordion, skipping the fixed cards above it) would still guarantee a
  labeled, non-empty state — the collapsed stage list itself is fully
  labeled — while roughly halving the return scroll.
  (2) The mount-time auto-scroll-to-current-lesson (`didAutoScroll` ref,
  fires once per mount) does not re-fire when `currentLevel` advances
  mid-session (e.g. a learner finishes their last lesson in a stage while
  scrolled elsewhere). The accordion itself correctly re-opens the new
  current stage now (URD-002's round-2 fix), but nothing scrolls to reveal
  it if the learner isn't already looking at that part of the screen.
verify: a script driving the real built app confirms (a) opening a stage
  from a scrolled-down position lands within some tighter bound (e.g.
  under 1000px of scroll to reach the newly-open content) than the current
  full-reset, and (b) completing a stage's last lesson mid-session scrolls
  the now-current stage into view without requiring a manual scroll.
notes: Both found and measured (not just theorized) reviewing URD-002's
  round-2 fix — DESIGN CRITIC measured the ~500px vs ~8000px distinction
  directly; THE CRITIC found (2) while checking for effect-ordering risk
  between the accordion's new `currentLevel`-reset effect and the
  pre-existing mount-time auto-scroll. Neither blocked URD-002: the
  current behavior is always labeled and never traps a learner, matching
  the bar both critics graded against. Two precise-positioning approaches
  were already tried and measured wrong against the real react-native-web
  build while fixing URD-002 (documented in HomeScreen.tsx) — whoever
  picks this up should read that history before trying `measureLayout` or
  tracked-`onScroll`-offset again.

## URD-033 — The Scholar achievement's top tier is unreachable in a playthrough, the same bug URD-004 just fixed elsewhere
attempts: 0
files: src/data/achievements.ts
definition of done: `ACHIEVEMENTS`'s `scholar` entry (`src/data/achievements.ts:34-41`)
  gates its top tier at 10,000 total XP. The real course total (sum of
  every lesson's `.xp` across `ALL_LESSONS`) is ~7,220 XP — the top tier
  needs 38.5% more than a single honest playthrough provides, the identical
  bug class URD-004 fixed for `levelTitle`'s "Master" tier, in a sibling
  XP-gated system that item was never scoped to touch. Re-space
  `scholar`'s tiers (or the other achievements' tiers — `first-steps`,
  `wordsmith`, `calligrapher`, `flame-keeper`, `perfect-*` etc. were not
  individually re-checked when this was found; only `scholar` is confirmed
  broken) so every tier is reachable within the course's real totals for
  its metric, following URD-004's pattern: derive both numbers from real
  content in a test rather than hardcoding either, so this doesn't go
  stale the same way `levelTitle`'s thresholds did (twice).
verify: a test in src/lib or src/data asserting every achievement's top
  tier is reachable against the real course total for its metric
  (`totalXp` from `ALL_LESSONS[].xp`, `lessonsCompleted` from
  `ALL_LESSONS.length`, `wordsLearned` from `WORDS.length`, etc. — `streak`
  is not course-bound and may need its own reasoning, not a course-total
  comparison).
notes: Found by THE CRITIC reviewing URD-004 (commit b28856a), specifically
  while checking whether anything else in the app assumed level/XP
  thresholds that fix didn't touch. Not blocking that item — different
  file, different subsystem, URD-004 was narrowly scoped to `levelTitle`
  — but real: a badge nobody can earn on one playthrough, discovered by
  the exact question ("is the top tier reachable?") this project just
  learned to ask. THE CRITIC's own caveat: `finishLesson` grants XP on
  every replay (no once-only guard), so no tier is literally impossible,
  only unreachable in one honest playthrough — the right target to design
  against, matching how URD-004 itself was framed.

## URD-034 — The soak's generic answer-tap doesn't try to be correct
attempts: 0
files: scripts/soak.js
definition of done: `answer()`'s fallback for 7 of 15 exercise kinds
  (`tapNamedKind`, covering multipleChoice, meaningPick, listenTap,
  wordFromMeaning, letterForm, letterPick, grammarDrill) and `solveMatching`
  pick a uniformly random candidate with no attempt at correctness — the
  `wrongOnPurpose` flag `playLesson` computes (`rnd() < 0.25`, intended to
  mean "right 75% of the time, deliberately wrong 25%") is read by
  `typeWord`, `letterTrace` and the tile-tray solvers, but never by these
  two, which cover most of what a real lesson asks. Effective wrong-rate on
  a random-guess kind with N options is `1 - 1/N`, typically 65-75% against
  the documented 25% — measured indirectly but repeatedly this session: a
  real, non-diagnostic soak run never completed a single lesson (0 of over
  120 attempts, across a dozen seeds/`--start` positions), and the identical
  content played cleanly (10/10 clean completions) the moment a throwaway,
  unshipped patch made hearts irrelevant, isolating answer accuracy — not
  the app's hearts economy (URD-006) — as the actual bottleneck. Give the
  fallback a real correctness signal (reading the loaded lesson's known-
  correct option via the same `load()` mechanism other check scripts use,
  or an accessibility hint the app is willing to expose for testing) so it
  gets it right except when `wrongOnPurpose`, the way `typeWord` already
  does.
verify: a real (non-diagnostic, no hearts override) `npm run soak` run
  starting well into the vocabulary (e.g. `--start 90`) completes a
  clear majority of its lesson attempts, not zero.
notes: Found and root-caused while shipping URD-005. Two concrete
  consequences of leaving this open, both worth knowing about rather than
  rediscovering: (1) `matching` sits at the very end of every vocab lesson
  and needs the lesson to actually finish to ever be seen, so
  `--require matching` cannot pass against a real run today no matter the
  budget — the solver itself is correct (verified via the same throwaway
  patch: 8/8 matching boards solved cleanly once reachable), it simply
  never gets reached; (2) since no lesson kind ever completes, the "current
  lesson" a fresh attempt reopens never advances, so a single `--start`
  value locks a whole run to one lesson's exercise-kind family — a
  `--require` spanning two different lesson kinds (e.g. a vocab kind plus
  a grammar kind) cannot be jointly satisfied by one real run, only by two
  separate ones. Neither is a soak.js bug on its own; both are downstream
  of this one.

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
