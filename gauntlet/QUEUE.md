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

## URD-016 — A review should mostly review the unit it closes
attempts: 0
files: src/exercises/generator.ts, src/data/units.ts
definition of done: `fallbackReviewRefs` in generator.ts draws uniformly from
  every word and letter taught up to the review, with no weighting toward the
  unit it is attached to. Measured on real generated output with nothing due:
  rev-gender-and-number (u6) draws 0-5% of its words from u6; rev-the-wider-
  world (u39) draws 3-5% from u39. A review should draw mostly from its own
  unit, falling back to the wider course only when the unit cannot fill it —
  which happens: rev-your-first-readings closes a unit with zero vocabulary
  lessons and needs the fallback for all of it. A test asserts a review whose
  unit has enough taught words draws at least half of them from that unit.
verify: npm test -- src/lib/review.test.ts
notes: Found by the CURRICULUM CRITIC on URD-010, independently confirmed by
  THE CRITIC from a different angle: two-thirds of reviews (26 of 39) are
  governed purely by REVIEW_MIN rather than by the unit's actual size, because
  most units don't teach 66 words. That is the same problem URD-010's commit
  set out to fix — a flat number wherever the review sits — relocated from a
  flat 9 to a flat 22. Scoping selection to the closing unit and sizing the
  review off what the unit can actually supply are the same piece of work;
  do not fix one without the other. Also carries the curriculum critic's
  MINOR finding that letter/word alternation is now a rigid fixed cadence,
  worth a second look while this is open.

## URD-017 — A review's letter share should decay once the alphabet is behind it
attempts: 0
files: src/exercises/generator.ts
definition of done: `fallbackReviewRefs` splits every review's fallback
  ceil(n/2) letters, floor(n/2) words, unconditionally, independent of how
  many units separate the review from the alphabet. Measured u10 through u39
  (script track): 367 letter exercises against 360 word exercises, 50.5%
  letters. A review at u30, thirty units after the alphabet finished, spends
  half its questions re-tracing glyphs. The letter share should fall as the
  course moves further from the alphabet units, reaching near zero by the
  units this measurement covers. A test asserts the letter share at a review
  early in the course is higher than the letter share at one late in it.
verify: npm test -- src/lib/review.test.ts
notes: Found by the CURRICULUM CRITIC on URD-010. Right near unit 2, wrong by
  unit 30 — the code applies the identical ratio at both positions with no
  decay. Shares a file and a home with URD-016; consider one item if the fix
  turns out to be the same change.

## URD-018 — Review should sometimes ask for a word's meaning, not just its form
attempts: 0
files: src/exercises/generator.ts
definition of done: Across all 39 review lessons on both tracks (1,856
  exercises measured), `meaningPick` — the only exercise that shows Urdu and
  asks what it means — appears 16 times, 0.86%, only as the produce
  fallback for words that are neither typeable nor buildable. Every other
  review exercise is English-or-audio-in, Urdu-out. Review is the lesson
  explicitly meant to consolidate what has been read, and it never asks the
  learner to read something and say what it means. Give the middle turn (or
  another turn) a real chance at `meaningPick` rather than reserving it for
  the produce-demand's edge case. A test asserts a review of typeable words
  still contains at least one meaning-direction question.
verify: npm test -- src/lib/review.test.ts
notes: Found by the CURRICULUM CRITIC on URD-010. The three-demand ladder
  (recall, listen, produce) is defensible as retrieval-first, but all three
  read the same direction; this is the one missing rung, not a reason to
  rebuild the ladder.

## URD-019 — Grade a lesson's own improvement, not just its first guess
attempts: 0
files: src/lib/sessionGrading.ts, src/lib/sessionGrading.test.ts, src/screens/LessonScreen.tsx
definition of done: `shouldUpdateSrs` caps SRS advancement to the first
  sighting of an item per lesson visit, which fixed a real bug (six correct
  sightings walking a letter's interval to 98 days) but chose the wrong
  sighting to trust: a learner who answers wrong, then right five times
  running in the same sitting, leaves with identical SRS state to one who
  answered wrong six times, because the first grade is the one that sticks.
  Grade on the *last* sighting of an item in the session instead, still
  capped to one `gradeItem` call per item per visit. A test asserts a
  wrong-then-five-right sequence and an all-wrong sequence produce different
  SRS states for the same item.
verify: npm test -- src/lib/sessionGrading.test.ts
notes: Found by the CURRICULUM CRITIC reviewing URD-013, who also gave the
  fix: overwrite-and-defer rather than gate-and-skip, so the value stored is
  always the most recent grade and `gradeItem` still fires once, after the
  lesson's last sighting of that item rather than its first. Not blocking
  when found — the scheduler-defeating bug is fixed, this is a policy
  disagreement, not a broken promise — but it discards the strongest signal
  a teaching lesson produces.

## URD-020 — Letter lessons are almost entirely isolated-glyph recognition
attempts: 0
files: src/exercises/generator.ts
definition of done: Across all 9 letter lessons, `letterTrace` + `letterForm`
  + `letterPick` account for 276 of 285 exercises (96.8%); the remaining 9
  are one context word per lesson. A learner meeting a completely new script
  spends nearly all of their first hours on isolated glyphs and almost none
  reading them inside real words. Raise the share of exercises that show a
  letter inside an actual word — more than one context word per lesson, or a
  dedicated "spot the letter in this word" exercise kind — without raising
  total lesson length past the 3-8 minute band check:shape already holds
  letter lessons to.
verify: npm run check:shape -- --kind=letters
notes: Found by the CURRICULUM CRITIC across two review rounds of URD-013,
  confirmed unchanged by every fix in that item (the ratio was identical
  before and after, since none of the three critique rounds touched exercise
  *kind* composition, only ordering and scheduling). The interleaving fix
  made the same lopsided material better *spread*, not less lopsided.

## URD-021 — A letter group's context word should touch more than its first letter
attempts: 0
files: src/exercises/generator.ts
definition of done: `contextWords[0]` in the letters-teaching branch keeps
  only the first hit from mapping every letter in the group to a candidate
  word, so a 7-letter lesson's one context word reinforces exactly 1 of the
  7 letters just taught — verified for all 9 lessons, e.g. `l-3`'s context
  word ("dil") only touches `daal`. The match itself is also weak: a single
  character (`letter.sound[0]`) tested with `.includes`, so the word is
  chosen for containing a letter somewhere, not for demonstrating its sound.
  Either show one context word per letter (budget permitting) or pick a
  single word that covers more of the group, with a real match rather than a
  one-character substring test.
verify: npm run check:shape -- --kind=letters
notes: Found by the CURRICULUM CRITIC and independently by THE CRITIC while
  reviewing URD-013; neither round of that item's fixes touched it, since
  both were scoped to ordering, duplication and scheduling.

## URD-022 — Letters that look alike should not be drilled as if they don't
attempts: 0
files: src/exercises/generator.ts, src/data/letters.ts
definition of done: `l-3` teaches `daal`/`Daal` and `re`/`Re`/`ze`/`zhe` —
  dot-pairs distinguished only by a diacritic — with no ordering or
  weighting that references visual similarity anywhere in the pipeline
  (confirmed: no reference to confusability in letters.ts, units.ts or
  generator.ts). Drilling visually confusable letters back to back with
  identical weight risks teaching the confusion rather than resolving it.
  Either separate confusable pairs within a lesson's rounds, or give them
  extra sightings relative to visually distinctive letters in the same
  group.
verify: npm run check:shape -- --kind=letters
notes: Found by the CURRICULUM CRITIC reviewing URD-013. Recommended over
  URD-021 as the higher-priority pick if only one of the two is taken next,
  because it actively works against the letters just taught rather than
  merely under-using them.

## URD-023 — Guarantee a phrases lesson has enough typeable phrases, not just reassign after drawing
attempts: 0
files: src/exercises/generator.ts
definition of done: The phrases branch draws 6 phrases uniformly from all 28
  with no floor on how many are typeable, then assigns exercise kinds among
  whatever it drew. When fewer than 2 of the 6 are typeable — 8.24% of draws,
  computed exactly (hypergeometric, 14 of 28 typeable, 6 drawn) — no
  reassignment can keep any kind under check:shape's 40% share, which is a
  fact about dividing six things three ways with two producible, not
  something the assignment logic can fix after the fact. The lesson that
  ships today draws 3 typeable and clears it, but that is this draw's luck.
  Fix it at the draw, not the reassignment: bias `seededShuffle`'s pick so at
  least `produceCount` of the drawn phrases are typeable, then fill the rest
  freely. A test asserts every one of many synthetic lesson ids at size 6
  clears the 40% share floor, not just the one that ships.
verify: npm run check:shape -- --kind=phrases
notes: Found by THE CRITIC reviewing URD-012, across two review rounds. The
  first round's fix (target-based reassignment instead of greedy) closed the
  ordering-dependence half of the problem; this is the other half, and
  cheaper than the two alternatives named when it was first found — a fourth
  exercise kind that doesn't depend on typeability, or growing the lesson
  size so the law of large numbers does the work. check:shape does not catch
  this today only because the one real lesson happens not to trigger it;
  it would catch a future one before it shipped, which is why this is MAJOR
  and not BLOCKING.

## URD-025 — A sentence-derived climb should lean on sentenceBuild, not recognition
attempts: 0
files: src/exercises/generator.ts
definition of done: two call sites now share the identical `turn =
  (round + idx) % 3` climb over `SENTENCE_WORDS` — the `sentences` branch,
  and (as of URD-024's grammar follow-up) the `grammar` branch's
  sentence-reinforcement climb. Both give a sentence one `meaningPick`
  turn, one `wordFromMeaning` turn, one `sentenceBuild` turn — 2 of 3 reps
  spent on whole-sentence recognition (see `SENTENCE_WORDS`: a sentence is
  shown and judged as one opaque string, never segmented) and only 1 of 3
  forcing the learner to place its words in order. `sentences.ts`'s own
  header and gauntlet/BENCHMARKS.md both name sentence-building
  specifically as what makes this app teach word order "far better than
  any explanation" and as the reason to choose Harf over Duolingo/Drops —
  the current ratio gives the weaker exercise the majority of the reps at
  both call sites. Rebalance so sentenceBuild is not the minority turn —
  either two sentenceBuild passes to one recognition pass, or a fourth
  round, whichever keeps the sitting inside check:shape's 3-8 minute band
  — fixed once, ideally by factoring the shared climb into one function
  both branches call, so the two cannot drift out of sync again.
verify: npm run check:shape -- --kind=sentences && npm run check:shape -- --kind=grammar
notes: Found by CURRICULUM CRITIC reviewing commit 0453fa7 (URD-A02's
  sentences row). Not BLOCKING — nothing shown is wrong, and every
  distractor sampled was a fair, plausible near-miss — but the commit's own
  message admits this ratio was a reuse-of-existing-exercises move, not a
  pedagogy-first choice, and the critic's read is that it inverts what this
  content type is supposed to practice. Reviewing URD-024's grammar
  follow-up, CURRICULUM CRITIC found the identical ratio reproduced
  verbatim at the grammar call site (line-for-line copy of the same
  structure) and recommended broadening this item to cover both rather
  than opening a duplicate — done here. That review also noted a
  mitigating half-truth specific to grammar: the concept's own
  `grammarDrill` exercises already force picking the correct inflected
  form among minimal-pair near-misses, a sharper construction-test than
  the climb offers — so the climb's job there may only be
  recognition/consolidation, not first exposure to the construction. If
  that's the intended division of labor, say so explicitly when this is
  fixed rather than rebalancing grammar's ratio to match sentences' by
  default.

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

## URD-029 — Three grammar concepts stay short because their tagged-sentence pools are thin
attempts: 0
files: src/data/sentences.ts, src/data/units.ts
definition of done: g-plurals (1.80 min, 3 of 4 tagged sentences readable
  at its lesson position), g-pronouns (2.70 min, 5 of 5 tagged) and
  g-ability (2.55 min, 5 of 5 tagged) stay under check:shape's 3-minute
  floor after URD-024's grammar climb, because their `SENTENCES`-tagged
  pool is too thin for the climb to reach `GRAMMAR_SENTENCE_TARGET`
  without repeating an identical question. For g-pronouns and g-ability
  this is genuine content scarcity — tag more sentences to those concepts,
  or author new ones. For g-plurals specifically, check the cheaper fix
  first: one of its 4 tagged sentences (`s-39`, "میز پر تین کتابیں ہیں")
  is dropped by `readableSentences` only because "میز" isn't taught yet at
  g-plurals' current path position — either move g-plurals a few positions
  later (past wherever "میز" is taught), or re-tag a different,
  already-readable sentence to `g-plurals`, before assuming new content
  authoring is required.
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
