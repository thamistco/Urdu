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

  WHAT IS LEFT, and it is the whole reason this is still here. 86 of 319 timed
  lessons are under 3 minutes and not one of them is a vocabulary lesson:

    review    39   length depends on the due queue; see URD-010, which has to
                   land first or this is measuring the wrong thing
    grammar   25   a concept has as many drills as it has
    sentences 12   `lesson.size` sentences and no repetition pass
    letters    9   and non-deterministic, see URD-013
    phrases    1   and 100% meaningPick, see URD-012

  Plus 2 units over the 12 lesson ceiling: u27 has 13, u39 has 15.

  Each of those five needs a different answer and none of them is "add words".
  Do NOT reach for the thresholds. MIN_MINUTES is 3.0 against two products that
  sit at 5, and moving it is how this item gets marked done without a learner's
  experience changing.

## URD-001 — Lint clean at zero warnings
attempts: 0
files: src/components/Reveal.tsx, src/exercises/index.tsx, src/lib/sync.ts, src/screens/ProfileScreen.tsx
definition of done: `eslint` passes with `--max-warnings 0`. There are 20
  `no-explicit-any` warnings across exactly those four files. Give each one a
  real type. Where a type genuinely cannot be known, `unknown` plus a narrowing
  check, never a disable comment without a sentence saying why the rule is wrong
  at that line.
verify: npx eslint . --max-warnings 0
notes: Smallest item in the queue and it is first on purpose: it proves the loop
  can claim, branch, work, verify, commit, push and open a PR before anything
  harder is trusted to it. If this one does not go green end to end, fix the
  loop, not the queue.

## URD-002 — The path screen must not mount every lesson
attempts: 0
files: src/screens/HomeScreen.tsx, scripts/check-path.js, package.json, .github/workflows/deploy-preview.yml
definition of done: The learn path renders without mounting every lesson row at
  once. `HomeScreen.tsx:566` maps every lesson of every unit inside a plain
  `ScrollView`, so all of them mount. That was 174 rows before topics were split
  across enough lessons to cover their vocabulary, 608 after, and 348 since
  URD-A02 attempt 1 regrouped them. A check opens the built app at 412x900,
  counts mounted lesson rows, and fails if the number is not bounded well below
  the total.
verify: npm run check:path
notes: This is a regression the vocabulary coverage work caused, which is why it
  is near the top. Measure mounted nodes and time to interactive on the real
  built bundle, the way `check:sizes` and `check:scenery` already drive it. Do
  not "fix" it by shortening the course.

## URD-004 — Make the top level titles reachable
attempts: 0
files: src/lib/gamification.ts, src/lib/gamification.test.ts
definition of done: Either the curve or the titles change so the highest title
  is attainable by finishing the course. Measured now: the whole path is roughly
  11,552 XP, which is level 20 on `xpForLevel(n) = 30(n-1)n`. "Master" is level
  25 and needs 18,000, so it takes 1.6 times the entire course. A test asserts
  the top title threshold is at or below the XP a complete playthrough yields,
  computing both from the real data rather than hardcoding either.
verify: npm test -- src/lib/gamification.test.ts
notes: Deriving the course total in the test is the point — it keeps this true
  the next time the path grows or shrinks, which it has done twice.


  RE-MEASURED after URD-A02 attempt 1: the course is 7,220 XP, not 11,552, and
  the reachable maximum is level 16, not 20. "Master" at 18,000 is now 2.49
  times the whole course rather than 1.6. The item got worse, not stale — which
  is exactly why the test derives the total instead of hardcoding it.

## URD-005 — The soak must reach every exercise kind
attempts: 0
files: scripts/soak.js
definition of done: `npm run soak` can be told which exercise kinds a run must
  have exercised, and fails if it finishes without them. Today a run only ever
  reports `tap` and `letterTrace`, because it starts at lesson one and the first
  units are alphabet lessons: `typeWord`, `wordBuild`, `matching`,
  `sentenceBuild`, `grammarDrill`, `dialogue` and `reading` are never reached.
  Seed the guest profile's `completedLessons` so a run can start anywhere on the
  path, and add a flag that asserts the kinds seen.
verify: npm run soak -- --lessons 30 --seed 7 --require typeWord,wordBuild,matching,sentenceBuild
notes: The soak is only worth its runtime if it visits the parts of the app the
  static checks cannot reason about. Right now it is exercising the two kinds
  that are already best covered.

## URD-006 — A new learner cannot be locked out with no way back
attempts: 0
files: src/lib/gamification.ts, src/screens/LessonScreen.tsx, src/lib/gamification.test.ts
definition of done: Either the first refill is affordable, or the lockout screen
  says plainly how long the wait is and how many gems short you are. A profile
  starts with 20 gems, a refill costs 40 (`LessonScreen.tsx:262`), and a lesson
  pays 5 to 10. So a learner who loses five hearts in their first two lessons
  faces a disabled button and a 30 minute wait per heart with no explanation of
  either. A test asserts a fresh profile can always either refill or be told the
  wait.
verify: npm test -- src/lib/gamification.test.ts
notes: The button is correctly `disabled={gems < 40}`; the problem is that it
  does not look disabled and says nothing about the wait. Found by the soak,
  which sat tapping it until its step budget ran out.


  RE-MEASURED after URD-A02 attempt 1: gems earned across the course roughly
  halve, while HEARTS_MAX stays 5 and a vocabulary lesson is now up to 43
  exercises. Five hearts against 43 questions is a tighter constraint than five
  against 9, and the refill is now further out of reach, so this is worse than
  when it was first measured.

## URD-007 — Teach ذ ز ض ظ by spelling context, not by sound
attempts: 0
files: src/data/letters.ts, src/exercises/generator.ts, scripts/check-answerable.js
definition of done: These four letters are pronounced identically by most Urdu
  speakers, so a listening exercise offering two of them has two correct answers
  and is unanswerable from what it puts on screen. Either such an exercise is
  not generated, or the four are taught and tested by spelling context. Extend
  `check:answerable` to fail on any audio prompt whose options contain more than
  one of the set.
verify: npm run check:answerable
notes: Exactly the shape of the verdict-cue bug already fixed there: a question
  that cannot be answered from what is visible. Extend that check rather than
  writing a new one.

## URD-008 — Logical direction properties in Urdu-bearing components
attempts: 0
files: src/components/, src/screens/, src/exercises/
definition of done: The 8 remaining physical direction properties (`ml-`, `mr-`,
  `pl-`, `pr-`, `marginLeft`, `paddingRight` and friends) in components that can
  render Urdu become logical equivalents. A source scan fails on any physical
  property reintroduced there.
verify: npm run check:all
notes: Small and already mostly done — `writingDirection` is handled in
  `Text.tsx`, `HomeScreen.tsx` and `PracticeScreen.tsx`. Write the guard in the
  style of `check:theme`, which already does this shape of source scan for
  colour. Last in the queue because it is the least likely to be felt.

## URD-009 — Say how long the daily goal really takes
attempts: 0
files: src/lib/achievements.ts, src/screens/SettingsScreen.tsx, src/lib/achievements.test.ts
definition of done: The daily goal labels are derived from the course's actual
  XP-per-minute rather than a constant that no longer holds. `achievements.ts:69`
  and `SettingsScreen.tsx:400` label the goals with minute figures computed at
  12.54 XP/min. After URD-A02 attempt 1 the course yields 3.95 XP/min, so the
  "20 min a day" goal is really 30.4 minutes. A test computes the rate from the
  real path and asserts each label is within a minute of it.
verify: npm test -- src/lib/achievements.test.ts
notes: Found by THE CRITIC on URD-A02, which is the pattern worth noticing: a
  curriculum change moved a number three files away and nothing connected them.
  Deriving the rate is what stops that happening the next time the path moves.

## URD-010 — Measure a review lesson against a real due queue
attempts: 0
files: scripts/check-shape.js
definition of done: `emitted()` in check-shape.js passes `reviewRefs = []`, so
  every review lesson is measured in its nothing-due fallback — which is the one
  state a review lesson is almost never in. 39 of the 86 lessons failing the
  length rule are review lessons measured that way. `rev-first-faces` returns 1
  exercise empty and a full lesson with a due queue. Build a representative queue
  from the path and measure against it. The check must still be deterministic.
verify: npm run check:shape
notes: Blocks the review third of URD-A02: until this lands, that work would be
  aimed at a number that does not describe anything a learner sees. Found by
  THE CRITIC on URD-A02.

## URD-011 — Stop check:shape recomputing the same lesson
attempts: 0
files: scripts/check-shape.js, src/data/units.ts
definition of done: `buildLessonExercises` is called 5,070 times per run of
  check:shape, taking 2.5 to 3.4 seconds; memoised on lesson id and track it is
  about 700. Also `lesson.size` is wrong by exactly 3 on all 233 vocabulary
  lessons — `coverTopics` budgets `3n+4` and the generator emits `3n+1`. Nothing
  reads it for vocabulary lessons today, which is the only reason it is minor.
  Fix the arithmetic and memoise, with check:shape still exiting the same way.
verify: npm run check:shape
notes: Both found by THE CRITIC on URD-A02 as MINOR. Paired because they are the
  same file and the same sitting. Do not memoise across tracks by accident — the
  tracks emit different exercises for the same lesson and that difference is
  what the run and share rules exist to see.

## URD-012 — A phrase lesson is not six of the same question
attempts: 0
files: src/exercises/generator.ts, scripts/check-shape.js
definition of done: The run and single-kind-share rules in check:shape pass for
  lessons that are not vocabulary. Today `phrases` is 100% meaningPick with 6 in
  a row (phrases share one icon, so picture and listen cues do not work, which is
  why it was written that way), `rev-your-first-readings` emits 9 consecutive
  wordFromMeaning, and 20 script and 41 Roman lessons are over 40% one kind. The
  vocabulary pipeline in `buildLessonExercises` already solves this shape; the
  work is applying it where the cue constraints differ.
verify: npm run check:shape
notes: Found by the rules added in d778928 failing on data that item never
  touched, which is how those rules earned their keep. A phrase is typically too
  long to build from tiles, so the alternation available here is between asking
  the meaning and asking for the phrase from the meaning; that is two kinds, and
  two is enough to break a run of six.

## URD-013 — A letter lesson must be the same lesson twice
attempts: 0
files: src/exercises/generator.ts, src/lib/shuffle.ts
definition of done: `letterExercise` calls `Math.random()` per exercise, so a
  letter lesson is regenerated differently every time it is opened and every
  count taken over letter lessons differs run to run — measured, letterPick
  moved between 65 and 77 across consecutive runs of the same check. Seed it the
  way the vocabulary selection was seeded in `seededShuffle`, keyed on the lesson
  and letter id. Option order must stay random; it is the *choice of exercise*
  that must be stable. A test asserts two generations of the same letter lesson
  are identical in kind sequence and differ in option order.
verify: npm test -- src/lib/shuffle.test.ts
notes: Pre-existing, not caused by URD-A02, found while measuring it. It is the
  same bug class as the vocabulary sampling fixed in 35fa67a: content chosen at
  render time cannot be reasoned about by any check, and a learner who leaves a
  lesson and comes back is somewhere else.

## URD-014 — A wiped profile deserves a different sentence
attempts: 0
files: src/store/useProgressStore.ts, src/lib/progress.ts, src/lib/progress.test.ts
definition of done: A profile persisted at version 0 or 1 has its
  `completedLessons` and `skippedLessons` emptied by the v1 to v2 migration,
  because positional lesson ids could not be translated. That learner genuinely
  did lose their ticks, and the path-moved notice says nothing to them, because
  the migration has already removed the evidence that they had any. Either the
  migration records what it dropped, or a second notice covers the case. A test
  asserts a v1 profile with completions is told something.
verify: npm test -- src/lib/progress.test.ts
notes: Found by THE CRITIC on URD-003 as MINOR. The wipe is pre-existing and
  correct — the old ids really do not say which lesson they meant — but "we threw
  your ticks away and said nothing" is a worse silence than the one URD-003 just
  fixed, not a better one.

## URD-015 — Nothing should change under a finger that is already moving
attempts: 0
files: src/screens/HomeScreen.tsx, src/components/Reveal.tsx
definition of done: Dismissing the path-moved notice removes 275 px of content
  instantly, so the 23 px band at y 294 to 317 changes from "dismiss" to "start a
  lesson" between the press and the release. Give the card an exit, or hold the
  layout until the touch is over. A check drives the built app, taps Got it, and
  asserts nothing tappable occupies the released point within the tap window.
verify: npm run check:stability
notes: Found by the DESIGN CRITIC on URD-003, measured at +120ms and +1s: the
  card simply vanishes. Extend `check:stability`, which already owns the property
  that answering a question does not move it, rather than writing a new check.

