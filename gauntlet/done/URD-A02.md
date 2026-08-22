## URD-A02 — Make a lesson a sitting
attempts: 2
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

  ATTEMPT 2 (2026-08-22): closed both remaining rows — the phrases lesson's
  length and the two oversized units — and, for the first time, got
  `check:shape` to 0 problems and wired it into
  `.github/workflows/deploy-preview.yml`, so `check:all` now gates it.

  The phrases lesson was 0.9 min (6 exercises). Two units exceeded the
  12-lesson ceiling: u27 (13 lessons) and u39 (15). Per this item's own
  warning against reaching for thresholds, both were fixed structurally,
  not numerically — and the first attempt at the phrases fix walked
  straight into that same trap anyway, caught by review rather than
  shipped:

  **Units**: u27 and u39 were each split by theme into two units, each with
  its own review, rather than shrinking either by cutting content. u27
  ("House & Field," tools/materials/appliances/containers/farm/cooking/a
  reading) became u27 "Materials & Machines" (tools/materials/appliances)
  and u28 "Field & Kitchen" (containers/farm/cooking/the reading). u39
  ("The Wider World," nature2/landscape/sky/environment/travel-more/
  lifeevents/formal/sentences) became u40 "Land & Sky"
  (nature2/landscape/sky/environment) and u41 "Journeys & Mastery"
  (travel-more/lifeevents/formal/sentences), keeping the original
  'rev-the-wider-world' review id and its "Grand review"/60xp/"Everything
  you know" framing since u41 is still the course's genuine last unit.
  Every unit from old u28 through u38 was renumbered up by one (id/title
  only) to make room. `coverTopics` sizes every review from its own unit's
  words, so splitting a unit's content in two also splits what its review
  can draw on — measured directly rather than assumed: rev-the-wider-world's
  real generated size dropped from 39 (117 words / 3) to 22
  (REVIEW_MIN — its half, 53 words, rounds to 18, under the floor). Not a
  regression: every other review in this course is already sized this way
  (see review.ts), and the curriculum critic's MAJOR finding that this
  review's 60xp/"Grand review" framing now overclaims its own floor-sized
  content was overruled with evidence, not dismissed — every other
  CEFR-boundary review in the course (rev-asking-and-opposites 40xp,
  rev-your-first-readings 40xp, rev-describing-people 45xp) already sits at
  this exact floor with its own elevated xp, an escalating milestone bonus
  that has nothing to do with a review's mechanical size and predates this
  item entirely.

  **Phrases**: the first fix simply raised the lesson's draw from 6 to 24
  distinct phrases, one exercise each — clearing check:shape's length floor
  on paper while walking straight into the exact trap this item's own notes
  name ("the trap is fixing this by raising the word count alone"), just
  applied to phrases instead of vocab. `check:shape`'s `MIN_SIGHTINGS` floor
  only scans `kind: 'vocab'` lessons, so a phrases lesson's sighting count
  was and is invisible to it — this got through the check clean and was
  caught by the curriculum critic instead: 24 of the app's 28 phrases moved
  from "seen once, ever" (nothing ever revisits a phrase after this one
  lesson) to "seen once, ever," just more of them at once.

  The real fix gives phrases the same climb vocab already has. The
  generator's phrases branch now runs vocab's own meet-recall-produce
  pipeline (same `GROUP`/staggered-cycle code, `produceExercise`'s existing
  untypeable-fallback reused via `teachesScript: false`) biased toward
  typeable phrases so the produce pass doesn't fold back into meet too
  often. `size` in `P()` (units.ts) now means distinct phrases drawn — the
  same role `wordIds.length` plays for a vocab lesson — not the exercise
  count that one-exercise-per-phrase conflated it with; the real exercise
  count is `3 * size`. The shipped lesson draws 12 phrases for 36 exercises
  (5.4 min), and every one of those 12 is sighted exactly 3 times — verified
  directly, not assumed: `min == max == 3` across all of them, max kind
  share 36.1%, longest run 3, both clear of check:shape's floors with room.
  `P()`'s own share guard was rewritten against the new formula (worst-case
  meet share as a function of size) and the safe range recomputed by hand
  and confirmed against real generated output at every size from 6 to 20:
  10 through 17 inclusive, below and above which the guard now throws.

  Two of my own bugs surfaced building this, caught by testing the real
  output rather than trusting tsc/lint being clean: `buildLessonExercises`'s
  `composed` exemption list (which stops a lesson's flat exercise list being
  trimmed back to `lesson.size`) didn't include `phrases`, so the new
  36-exercise climb was silently truncated to exactly 12 the first time it
  ran — the identical shape of bug this same exemption list's own comment
  already names twice for sentences and grammar. And copying vocab's
  varying meet-variant (`i % 3`, which gives vocab a mix of
  multipleChoice/listenTap/meaningPick) reintroduced a dead picture-question
  path for phrases specifically: every phrase shares one emoji, so
  `distractorsFor`'s own widen-if-too-uniform fallback (`if (chosen.length <
  DISTRACTORS) consider(WORDS)`) reached into the full 2,281-word
  vocabulary for "distinct" picture distractors, producing a
  multipleChoice/listenTap question that looks answerable (four distinct
  pictures) but isn't one — the correct phrase's own picture is still the
  generic speech bubble, the visibly odd one out among three real object
  pictures, solvable by elimination without knowing what the phrase means.
  Pinned that pass to variant 1 (meaningPick) instead, matching what the
  pre-fix code already did deliberately.

  The pre-existing URD-023 test suite (generator.test.ts) hardcoded its
  synthetic lesson at the old size 6 — now outside the new formula's safe
  range and failing for the identical reason a real 6-phrase lesson would
  today (44.4% meet share, measured). Retargeted to size 12 (the real,
  shipped size) and a new assertion added directly checking every drawn
  phrase gets exactly 3 sightings, not left to follow only from the share
  math.

  Dispatched THE CRITIC and the curriculum critic, as this item's own queue
  entry requires. THE CRITIC: no BLOCKING, 5 MINOR (an adjacent same-color
  unit pair this diff introduced, three stale-comment/undocumented-change
  findings, one internal id-naming mismatch), all four addressed except the
  id mismatch (overruled — renaming a live lesson id for internal tidiness
  would orphan real users' progress against a field nothing displays).
  Curriculum critic: the two MAJORs above (phrases sightings, Grand review
  framing), both resolved as described — one fixed for real, one overruled
  with cited counter-evidence. Two MINORs accepted as-is: the split routes
  all of each pair's non-vocab variety into one half rather than balancing
  it (not unprecedented — u29, untouched by this item, is also pure vocab
  at this size), and u41's "Journeys & Mastery" title covers a somewhat
  looser grouping than the other three new/split units' titles.

  Verified: `node scripts/check-shape.js` — 0 problems, 350 lessons (up
  from 348), 41 units (up from 39), mean 4.2 min/lesson, 24.3h course.
  `npx vitest run` — 178/178 (one pre-existing test, `review.test.ts`'s
  "scales to a unit with many vocabulary lessons," retargeted from
  rev-the-wider-world's pre-split 117-word count to rev-senses-and-seasons's
  real, current 96, the new largest single-unit pool). `npx tsc --noEmit`,
  `npm run lint`, `npm run format:check` all clean. `npm run check:all` —
  29/29 (30 after this item's own wiring), run three times across this
  item's revisions, confirmed clean on the final committed state.
