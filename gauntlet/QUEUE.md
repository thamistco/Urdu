# Gauntlet queue

Ordered. The top unclaimed item is what the next run picks up.

Every item carries a `verify` command that exits 0 or does not. An item without
one is a drift generator: it gets marked done on somebody's reasoning and stays
wrongly done. If you add an item and cannot name the command that proves it, the
item is not ready to be queued.

`verify` may name a script that does not exist yet — creating it is part of the
work. The item is done when that command exits 0, and not before.

Every item below came from measuring this repo, not from a list of things Urdu
apps generally need. The numbers in them were taken on 2026-08-07 at `5cbe0e6`;
if one no longer reproduces, say so in the ledger and close the item rather than
inventing work to justify it.

`npm run check:all` is the final gate for anything touching shipped code. It
reads its step list out of `.github/workflows/deploy-preview.yml`, so it cannot
drift from what CI runs.

---

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

## URD-002 — The path screen must not mount 608 lessons
attempts: 0
files: src/screens/HomeScreen.tsx, scripts/check-path.js, package.json, .github/workflows/deploy-preview.yml
definition of done: The learn path renders without mounting every lesson row at
  once. `HomeScreen.tsx:566` maps every lesson of every unit inside a plain
  `ScrollView`, so all of them mount. That was 174 rows before topics were split
  across enough lessons to cover their vocabulary; it is 608 now. A check opens
  the built app at 412x900, counts mounted lesson rows, and fails if the number
  is not bounded well below the total.
verify: npm run check:path
notes: This is a regression the vocabulary coverage work caused, which is why it
  is near the top. Measure mounted nodes and time to interactive on the real
  built bundle, the way `check:sizes` and `check:scenery` already drive it. Do
  not "fix" it by shortening the course.

## URD-003 — Tell a returning learner why their progress moved
attempts: 0
files: src/store/useProgressStore.ts, src/screens/HomeScreen.tsx, src/lib/progress.test.ts
definition of done: Splitting topics across lessons kept the first part's id, so
  a learner who had finished "First words" still has that lesson ticked — but it
  is now 1 of 7, and their unit percentage fell without them doing anything
  wrong. On first launch after the change, the app says so once, plainly, and
  does not say it again. A test asserts the notice fires exactly once for a
  profile with pre-split completions and never for a fresh one.
verify: npm test -- src/lib/progress.test.ts
notes: Nothing was lost and the denominator became honest, but a learner cannot
  see that from inside the app. Silence here reads as lost progress, which is
  the single thing most likely to make someone stop using it.

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

## URD-008 — Mark synthesised audio as synthesised
attempts: 0
files: src/lib/voiceManifest.ts, src/components/, scripts/check-voice.js
definition of done: Every clip records whether it is a recording or synthesised,
  per clip rather than globally, so native recordings can replace TTS one at a
  time without a data migration. The UI says which it is wherever a learner is
  asked to imitate it. `check:voice` fails if any clip lacks the flag.
verify: npm run check:voice
notes: Urdu text to speech is not good enough to pass silently as a native
  speaker, and a learner copying a bad synthesis learns a bad pronunciation.

## URD-009 — Logical direction properties in Urdu-bearing components
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
