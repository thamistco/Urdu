# Gauntlet ledger

Append only. Newest entries at the bottom. Never rewrite history here.

The cloud runner clones this repo fresh on every run and remembers nothing
between them. This file is the entire memory of the loop: what was claimed, what
was proved, what failed and why. A run that does not commit its entry has not
happened as far as the next run is concerned, and the work will be done again.

Entry types: CLAIMED · PASSED · FAILED · BLOCKED · NO-WORK · DONE-FOR-NOW

Rules that keep this worth reading:

- Paste the real output of the verify command. Not a summary of it, and never a
  claim that it passed without the text that says so.
- An item is done when a command exits 0. Reasoning about why it ought to pass
  is not evidence and does not go in the PASSED entry.
- Record decisions taken alone. Nobody is going to answer a question mid-run, so
  the decision and its reason are the deliverable.
- Read this file before the diffs. It tells you whether the loop is thinking
  straight; the diffs only tell you what it typed.

---

## CLAIMED · URD-A01 · 2026-08-08T08:12Z
Give every topic a category.
verify: `npm run check:shape`
branch: claude/gauntlet-topic-categories
run: by hand from an interactive session, not the routine. The routine
(trig_01A1PR5M8aYv8f2dLyeDFHn5) is disabled: a routine fired session gets an
empty working directory because create_trigger has no way to name a repository.
Confirmed by probe session_01HJWQQgf9fVGsH91Bach9bZ, which reported
"empty /home/user, no git, no gauntlet/QUEUE.md". Two fires produced nothing.

## CRITIQUE · URD-A01 · 2026-08-08T08:35Z
Dispatched THE CRITIC (always) and the CURRICULUM CRITIC (the item touches
lessons and words). Not the design critic or the player: no screen changes and
no lesson behaviour changes, nothing consumes `category` yet.

### THE CRITIC — BLOCKING
1. The delivery commit 7db8465 was missing `festivals` and failed its own verify
   command. Cause, in the critic's words: "it committed a state it had not
   re-run the verify command against." True. The lead ran `git add -A` while a
   subagent was mid experiment on the working tree and committed its scratch
   state. CLAUDE.md non-negotiable #1. Fixed, and the lesson is process: never
   stage while a critic is running.
### THE CRITIC — MAJOR
2. The file claimed a topic missing from the map is "a TypeScript error at this
   map and a check:shape failure, in that order". False, and proven false:
   `npx tsc --noEmit` exits 0 with an entry deleted. `noUncheckedIndexedAccess`
   is not set, and `data/vocab/types.ts` declares a second `Topic` with no
   `category` field, so a pack author cannot reach a type error even in
   principle. Comment rewritten to say check:shape is the only guard.
3. That guard was not in CI and was camouflaged by five pre-existing failures.
   Accepted as accurate; still true, and deliberately so until URD-A02 makes
   check:shape pass. Recorded rather than fixed.
4. `work` and `travel` were junk drawers. "Free time" filed under work while the
   other games topic sat under home. Fixed, see below.
### THE CRITIC — MINOR
5, 6, 7. Stale comment, a branch that could never fire, no dead key detection.
   All three fixed. The two new guards were broken on purpose and watched to
   fail before being trusted.

### CURRICULUM CRITIC — BLOCKING
1. Same festivals finding, independently.
2. `culture` was 14 of 14 advanced, every topic first met in units 32 to 37 of
   39. It restated `level` and carried no information of its own. Its Urdu point
   is the sharper one: a learner who picks Urdu over Hindi often comes for the
   ghazal, for family or for faith, and the taxonomy gated 100% of that behind
   advanced.
### CURRICULUM CRITIC — MAJOR
3. `language` held three incompatible things. Register and set phrases moved to
   culture; twelve genuine word class packs remain.
4. The clinical cluster was severed: health, illness and medicine under work
   while body, organs and senses were under people. Reunited.
5. `sports` under work contradicted its own blurb, "Games, hobbies and free
   time". Fixed.
6. `emergency` filed beside hotels. Fixed.
7. The ledger did not say why the taxonomy changed. It does now, below.
8. Four categories are dead ends across levels. Recorded as URD-A03.

### What changed as a result
Nine categories became eleven. `everyday` carries the dealings of ordinary life
(money, bank, bazaar, phone, services, emergency) which were under travel, true
only for a tourist; Harf's likelier learner lives there. `leisure` carries sport,
play, music, poetry, literature and festivals. That is also the honest partial
answer to culture-equals-advanced: leisure spans elementary to advanced, so the
pleasure of the language is no longer entirely gated behind the last third.

### What was NOT fixed, and why
The residue of BLOCKING 2 is a content fact, not a taxonomy fact. `culture` is
still advanced-heavy because the course contains no beginner cultural material
to categorise. No arrangement of labels fixes that; writing a first festival, a
first couplet and the names of the months does. Queued as URD-A03 rather than
papered over. Finding recorded first, reason second, per ROLES.md.

## PASSED · URD-A01 · 2026-08-08T08:41Z
$ npm run check:shape
  check:shape — 608 lessons, 493 of them vocabulary.
  ... 5 problems  (lesson length, sightings x2, parts per topic, unit size)
  NO categorisation failure. That is this item's stated done condition; the
  remaining five belong to URD-A02.

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run after the final edit, not before it.

branch: claude/gauntlet-topic-categories

## BLOCKED · URD-A03 · 2026-08-08T08:50Z
Cannot be done by an agent session. The item needs new beginner cultural words;
`check:voice` requires a clip per speakable word in both voices, and generating
clips needs the Google TTS key, which this session does not hold and should not.

    scripts/check-voice.js:120
      `${id}: ${what} has no clip — the app would speak it with the device voice`

Moved to blocked/ on attempt 1 rather than 3, as a recorded lead decision: the
blocker is a missing credential, not something a retry resolves, and leaving it
at the top would stall every following run behind an identical failure.

Checked before claiming rather than after working, which is the only reason this
cost minutes instead of a whole run.

## CLAIMED · URD-A02 · 2026-08-08T08:52Z
Make a lesson a sitting.
verify: `npm run check:shape`
branch: claude/gauntlet-lesson-sitting, cut from claude/gauntlet-topic-categories
because check:shape's category rule landed there and this item needs it.

## CRITIQUE · URD-A02 · 2026-08-09T01:40Z
Dispatched THE CRITIC (always) and the CURRICULUM CRITIC (the item touches
lessons, words, order and the BENCHMARKS targets). Not the design critic: no
screen changed. The PLAYER was not dispatched either, and that is a gap rather
than a decision — this item changes what a lesson does, which is exactly the
PLAYER's trigger in ROLES.md. It is recorded here as skipped, not as unneeded.

The CURRICULUM CRITIC was dispatched and never returned a verdict; its session
hit a limit. So this item carries one verdict, not two, which is another reason
it is not eligible to be recorded PASSED.

### THE CRITIC — BLOCKING
B1. `npm run check:shape` exits 1. 86 of 319 timed lessons are under 3 minutes
    (review 39, grammar 25, sentences 12, letters 9, phrases 1, vocabulary 0),
    and u27 has 13 lessons and u39 has 15 against a ceiling of 12. It is also
    not wired into the workflow, which the item's definition of done requires.
    Accepted in full. The vocabulary half of the item is done and the rest is
    not; see the FAILED entry below.
B2. The three passes were emitted as three whole-lesson blocks, so recall — 
    always `wordFromMeaning` — asked the same question n times consecutively.
    Longest run 14; 199 of 233 vocabulary lessons had a run of 9 or more, on
    both tracks. Accepted. Fixed in d778928.
B3. The Roman track received none of the previous commit's fix. `canBuild` is
    `... && teachesScript`, always false on Roman, so produce was pure
    `typeWord`: 162 of 233 Roman lessons with 9+ consecutive typeWord, max 14,
    against 3 on the script track. The critic also noted the commit message
    named no track, which is how it went unnoticed. And that check:shape
    compared the tracks by exercise *count* only — identical for all 233
    lessons — so the check was structurally blind to it. All three accepted.
    Fixed in d778928, including the check.

### THE CRITIC — MAJOR, recorded as queue items rather than fixed
M1. Course XP fell 11,888 to 7,220 and the reachable maximum level 20 to 16.
    URD-004's "1.6 times the course" is now 2.49. → folded into URD-004.
M2. Daily goal labels understate by about half: 12.54 XP/min became 3.95, so
    "20 min a day" is really 30.4 minutes. → new URD-009.
M3. Gems roughly halve while HEARTS_MAX stays 5 against 43-exercise lessons.
    → folded into URD-006.
M4. 260 of the 608 old lesson ids evaporate, and this landed *before* URD-003,
    which the item's own notes forbid. Accepted as accurate and as a sequencing
    error by the lead. URD-003 moves to the top of the queue.
M5. `emitted()` passes `reviewRefs = []`, so the 39 review lessons among the 86
    length failures are measured only in their nothing-due fallback.
    → new URD-010.
M6. 82 duplicate (kind, word) pairs across 49 lessons, from the produce
    fallback repeating the recall question. Fixed as part of B2: the fallback
    now asks the meaning instead.

### THE CRITIC — MINOR
m1. `size` is wrong by exactly 3 on all 233 vocabulary lessons — `3n+4`
    budgeted against `3n+1` emitted. Harmless today because nothing reads it
    for vocabulary lessons, and check:shape deliberately generates rather than
    trusting it. → new URD-011.
m3. 5,070 `buildLessonExercises` calls per check:shape run, 2.5 to 3.4s.
    Memoising on lesson id would cut it to about 700. Not done; the check is
    not on the CI critical path. → new URD-011.

### Found by the new check rules, not by a critic
The run and share rules added in d778928 fail on data this item never touched,
which is the evidence that they are not hypotheses:
  - `phrases` lessons are 100% meaningPick, 6 in a row.
  - `rev-your-first-readings` emits 9 consecutive wordFromMeaning.
  - 20 script and 41 Roman lessons are over 40% a single kind.
→ new URD-012.

`letterExercise` also calls `Math.random()` per exercise, so letter lessons are
regenerated differently every time they are opened and every count over them is
flaky run to run. Pre-existing, not caused by this item. → new URD-013.

## FAILED · URD-A02 · 2026-08-09T01:55Z
attempt 1 of 3. The verify command does not exit 0, so the item is not done,
and the definition of done is not being rewritten to match what was achieved.

$ npm run check:shape
  check:shape — 348 lessons, 233 of them vocabulary.
    mean lesson 3.3 min · 9.8 new words · 22.1 exercises emitted
    whole course 19.3 hours
  check:shape — 6 problems
    86 of 319 timed lessons are under 3 minutes.
        shortest: g-continuous at 0.6 min (4 exercises)
    3 lessons emit more than 3 identical exercises in a row on the both track.
        worst: phrases — 6 consecutive meaningPick
    20 lessons are more than 40% one exercise kind on the both track.
        worst: phrases — 100% meaningPick
    29 lessons emit more than 3 identical exercises in a row on the roman track.
        worst: rev-your-first-readings — 9 consecutive wordFromMeaning
    41 lessons are more than 40% one exercise kind on the roman track.
        worst: phrases — 100% meaningPick
    2 of 39 units are outside 4 to 12 lessons.
        u27 — 13 lessons
        u39 — 15 lessons
  exit 1

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree. The previous run of this straddled two commits
  because two check:all runs overlapped and one deleted dist/index.html out
  from under the other; that result is void and this one replaces it.

### What was achieved, and it is most of the item
Vocabulary lessons: 493 → 233, 4.6 → 9.8 new words each, 1.8 → 3.07 sightings
per word, 1.3 → 3.3 to 6.5 minutes. Not one vocabulary lesson is outside the
3 to 8 minute band and not one is under the sightings floor. Every one of the
2,281 words is still taught by exactly one lesson; check:coverage, check:order
and check:answerable all pass untouched.

### What was not achieved
Everything that is not a vocabulary lesson. The 86 short lessons are review,
grammar, sentences, letters and phrases, and each needs a different answer:
review length depends on the due queue (M5), a grammar concept has as many
drills as it has, a sentence lesson is `lesson.size` sentences. Two units are
over the ceiling. None of that was attempted, and the item stays at the top of
the queue at attempt 1 with its scope split in the notes.

### Lead errors recorded against itself
- Sequencing: this landed before URD-003 when its own notes said never before.
- The PLAYER was not dispatched on an item that changes what a lesson does.
- The previous commit fixed one track and said so in neither its message nor
  its comment, which is what let B3 live.

## CLAIMED · URD-003 · 2026-08-09T04:20Z
Tell a returning learner why their progress moved.
verify: `npm test -- src/lib/progress.test.ts`
branch: claude/gauntlet-progress-moved, cut from claude/gauntlet-lesson-sitting.
Moved to the top of the queue by URD-A02's own critique, which found that item
had landed before this one when its notes said never before.

## CRITIQUE · URD-003 · 2026-08-09T05:05Z
Dispatched THE CRITIC (always) and the DESIGN CRITIC (it adds a card to the
Learn screen). Not the curriculum critic: no lesson, word or order changed. Not
the PLAYER: the soak drives lessons, and this is a launch-time notice a soak run
would dismiss without noticing, which is a limitation of the soak rather than a
judgement that the item is safe. Recorded as skipped, not as unneeded.

Both critics independently found the same first defect from opposite directions,
which is the strongest signal this loop has produced so far.

### THE CRITIC — BLOCKING
B1. The notice never fires for the learner the item is about. Detection was by
    missing lesson id, and `coverTopics` gives a topic's first part the topic's
    own id on purpose, so the ids survive. The critic dumped UNITS at 9792f8a
    and at HEAD: **0 of 237** pre-split ids are absent today. A pre-split learner
    with 60 lessons finished goes beginner 55/55 (100%) to 55/81 (68%), overall
    25.3% to 17.2%, ten units fall, and the app says nothing while
    `npm test -- src/lib/progress.test.ts` is 10/10 green. Accepted in full. This
    is the item's central design error and it was mine.
B2. The copy said "the percentages start lower". Measured over every triggering
    prefix profile (K=1..608, old path at 46dc8a3 against HEAD): overall
    percentage is the same or higher in **466 of 604** triggering states, and per
    unit rose 241, fell 295, unchanged 12,341. Two profiles driven in the browser
    were shown the false sentence while the screen behind the card contradicted
    it. Accepted: under the severity rule, the app lying is blocking.

### DESIGN CRITIC — BLOCKING
D1. The notice is rendered and never seen. `HomeScreen` auto-scrolls to the
    current lesson 500ms after mount whenever its pageY exceeds 420, which is
    always true once four cards sit above the path, and the notice is at the top
    of that same ScrollView. Measured landing offsets: the card sits 646 to
    **4,597 px** above the viewport, `fullyVisible: false` in all eight sampled
    profiles. Because dismissal is on tap and not on render, it is never
    dismissed either, so it re-renders unseen forever.

    It also caught the lead's own false claim, which is recorded here in full:
    the previous commit message said "verified against the real built app … is
    shown the notice". It is *rendered* at 412x900. It is not *shown*. The
    verification scrolled the card into view, which no learner does. That is
    CLAUDE.md non-negotiable #1, from the hand that wrote the rule down.

### All three fixed in 9136f1e, before STEP 4
Detection is now by the size of the path the learner last saw against the path
in front of them, with null meaning a profile written before that was recorded.
The direction claim and the count are both gone from the copy. The auto-scroll
waits until the notice is dismissed.

### THE CRITIC — MAJOR
M1. The verify command could not fail on the bug: the suite only exercised the
    pure function against hand-built profiles, and all ten stayed green while the
    named learner got silence. Fixed rather than queued, because it is the
    repo's non-negotiable #3. Reinstating the missing-id detection behind the new
    signature now fails 6 of 10, including that learner.
M2. "1 of the 1 you had finished are now part of other lessons" at gone === 1,
    which is the commonest returning profile there is, plus a missing noun. Fixed
    by removing the count entirely.
M3. `pathNoticeSeen` recorded "told", not "told about which move", so the notice
    was single use and the next regroup would silently re-incur the debt. Fixed:
    dismissal records the path size, so the next move re-arms it with no version
    bump. Verified live.

### DESIGN CRITIC — MAJOR
D2. At 320x568 the card was 297 px of a 568 px viewport, pushing Continue and
    Today's word below the fold. Partly fixed: the copy went from four sentences
    of 12px fine print to two at body size. It still fills the small phone.
    OVERRULED in part, finding first and reason second: on the one launch this
    appears, the notice *is* the screen's subject, and the auto-scroll fix means
    the learner lands on it rather than past it. Continue returns the moment it
    is dismissed, which is now a single tap away rather than a scroll up. A
    notice small enough to share the fold with the CTA is a notice that competes
    with the CTA and loses.
D3. The Got it button was the brightest thing on the screen — mean luminance
    0.623 against 0.044 for the Continue card, 10.38:1 against its own card —
    wearing the primary CTA costume for an action whose only job is to make a
    message go away. Fixed: ghost variant.
D4. 52 words of 12px caption type carrying the only message in the app a learner
    has to read. Fixed: 2 sentences at text-sm/leading-6.

### MINOR
m1 (CRITIC). A v0 or v1 profile is wiped by the older migration and then told
   nothing, because it has no ticks left. Pre-existing wipe; the new code passes
   straight through it. → new URD-014.
m2 (CRITIC). The notice was not announced to a screen reader. Fixed: `Card`
   takes an accessibility role and the notice is an alert with its body as label.
m3 (CRITIC). A 348-id Set rebuilt on every completion, on the screen URD-002
   exists to lighten. Fixed: module scope, and it is a count now rather than a
   Set.
m4 (DESIGN). 23 px of tap-through: the band under the finger becomes the
   Continue card the instant the notice is removed, with no exit transition.
   → new URD-015.

### What both critics checked and passed
Zustand's migrate/merge semantics read from node_modules rather than memory, and
confirmed live: a seeded v2 profile returns as v3 with the migrated value intact
and the initialiser's default not overriding it. `known` being the whole path
rather than the learner's track is right, so a Roman learner is not told their
traced letters vanished. `resetAll` cannot leave a stale notice. Onboarding
skips are drawn from the current path so a heritage learner is not falsely
notified. Body contrast measured from rendered pixels at 6.72:1, heading 11.99:1,
tap target 102x57. The claim that a fourth guard in progress.ts was dead code was
independently verified as accurate.

## PASSED · URD-003 · 2026-08-09T05:40Z
$ npm test -- src/lib/progress.test.ts
   Test Files  1 passed (1)
        Tests  10 passed (10)

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the last edit.

Induced failure, per the rule that a check which has never failed is a
hypothesis. Missing-id detection reinstated behind the new signature:
  × tells a learner whose lessons all still exist but whose path grew
  × tells a learner whose path changed size under them
  × says nothing to a learner who has finished nothing
  × counts a lesson skipped at onboarding as a place on the path
  × fires once — the second launch is silent
  × re-arms when the path moves again
   Tests  6 failed | 4 passed (10)

Driven in the built bundle at 412x900 and 320x568, with no scrolling:
  survivors-only (the cohort B1 missed)  rendered=true landed_in_view=true top=134
  survivors-only (small phone)           rendered=true landed_in_view=true top=170
  608-era, dead ids                      rendered=true landed_in_view=true top=134
  nothing finished (fresh)               rendered=false
  after dismiss / after reload           rendered=false
  persisted v3 pathNoticeSeen=true pathSize=348 ticks kept=40
  re-armed after another move            rendered=true

branch: claude/gauntlet-progress-moved

## CLAIMED · URD-010 · 2026-08-09T10:04Z
Measure a review lesson against a real due queue.
verify: `npm run check:shape` (unfiltered; the item is recorded against
`npm run check:shape -- --kind=review`, a scoping flag added this run — see
below for why that is not the same as weakening the check)
branch: claude/gauntlet-review-queue, cut from claude/gauntlet-lesson-sitting.
Blocks the review third of URD-A02: 39 of its 86 short-lesson failures are
review lessons measured with `reviewRefs = []`, the one state a review lesson
is almost never in.

## CRITIQUE · URD-010 · 2026-08-09T11:40Z
Dispatched THE CRITIC (always) and the CURRICULUM CRITIC (touches lesson
content and BENCHMARKS.md targets). Not the design critic: no screen changed.
Not the PLAYER: soak drives lessons and would dismiss a review without
noticing anything about its content, which is a limitation of the soak rather
than a judgement this item is safe. Recorded as skipped, not as unneeded.

Both dispatches were fired twice. The first pair died mid-run on a session
limit before returning anything — recorded here for the record, not as a
verdict, since they produced nothing to weigh. Retried after the limit reset
(confirmed by wall clock) as fresh runs, not continuations.

### THE CRITIC — BLOCKING
Verified independently rather than trusting the commit's own numbers, and
reproduced from a fresh process: the top-up capped `refs` to `lesson.size`
before generation, on the assumption every ref renders one exercise. `srs` is
not per track, so a due letter can sit in a learner's queue while they are on
the Roman track, where it renders nothing — a capped slot spent on nothing.
Five due letters on Roman rendered 17 of 22. A due id a content rename left
behind hit the same failure by a different door: 0 of 22. Both are exactly the
truncation class this item's own commit message said it had fixed, for the one
queue shape check:shape's three original due states never tried.
Also found: the run/share section (added in URD-A02's critique) never
exercised the due-queue variants at all, so a review whose due state produces
a bad run was invisible to the one section built to catch runs — a second,
narrower instance of the same "measured the state that passes" pattern.
Also found: the commit message quoted single-run numbers ("61 to 8") for a
metric that, on the script track, depends on `letterExercise`'s pre-existing
`Math.random()` (URD-013) and visibly flaps — four consecutive runs of
check:shape gave 8, 8, 6, 5 for the same unchanged code. The specific counts
cannot be treated as fact and are not repeated here as fixed deltas.
Accepted in full. Fixed in 6976e13: `due` and the fallback are filtered to
refs that will actually render before the cap, not after; the same fix
applied to the two-item weave for ordinary lessons; check:shape's due states
extended to an all-letters queue and a stale-id queue, deduped per lesson
rather than counted once per state.

Filtering surfaced a second, independent shortfall THE CRITIC's own repro
did not happen to hit: `rev-first-faces` still fell short, 18 of 22, because
its whole letter pool really is six letters (`l-1-2`, "Position practice",
deliberately re-teaches `l-1`'s six in their joining forms — confirmed at the
call site, not assumed, after an early draft of this entry wrongly called it a
content duplication bug), and a due queue containing most of them leaves the
fallback's fixed half-letters draw almost nothing to find. Fixed in the same
commit with a second top-up from words alone when the first runs short.

The new due states then found a third thing on their own: an all-letters due
queue streaked `letterExercise`'s random pick — 5 consecutive `letterPick`,
measured. Fixed with a deterministic positional rotation over the same three
letter forms, scoped to review; `letterExercise` itself is untouched, since it
also drives the letter-teaching lessons and that is the wider change already
queued as URD-013.

On the `--kind` flag specifically: confirmed `check:shape` is not named
anywhere in `.github/workflows/deploy-preview.yml`, and `check:all`'s step
list is parsed only from that file, so `--kind=review` cannot be wired into CI
by accident. It is honestly labelled at the console and disables only the
sections a review-scoped run has no business judging (categories, unit
count). Ruled legitimate as a working tool, not a weakened gate — with the
condition that the ledger not present a filtered pass as satisfying the
item's stated unfiltered verify line, which is why this entry does both.

### THE CRITIC — MINOR
Dedupe keyed on `r.id` alone, not `(id, type)` — not exploitable today (0
overlap between word, letter and phrase ids, confirmed), but one content edit
away from silently merging a due letter and an unrelated due word. Fixed in
daca650 rather than queued, since it was touching the exact lines already
open.

### CURRICULUM CRITIC — MAJOR
1. A review almost never reviews the unit it closes. `fallbackReviewRefs`
   draws uniformly from everything taught to that point, with no weighting
   toward the closing unit. Measured on real generated output, nothing due:
   rev-gender-and-number (u6) draws 0-5% of its words from u6; rev-the-wider-
   world (u39) draws 3-5% from u39; rev-your-first-readings closes a unit with
   zero vocabulary lessons and is 100% material from elsewhere. The size
   formula in units.ts governs the count; nothing governs the selection. →
   new URD-016.
2. Half of every script-track review is letter drills, at every unit through
   the end of the course, independent of how long ago the alphabet finished.
   Measured u10 through u39: 367 letter exercises against 360 word exercises,
   50.5%. A review at u30 spends half its questions re-tracing glyphs finished
   21 units earlier. → new URD-017.
3. 0.86% of review exercises (16 of 1,856 measured) ever show Urdu and ask
   for its meaning; the rest are English/audio-in, Urdu-out. Review — the
   lesson explicitly meant to consolidate what has been read — never asks the
   learner to read it. → new URD-018.
4. Same Roman-track truncation as THE CRITIC's BLOCKING finding, found
   independently from the curriculum side; fixed with it.

### CURRICULUM CRITIC — not blocking, and answered directly
Two-thirds of reviews (26 of 39) are governed purely by `REVIEW_MIN`, not by
the unit's actual size — the same shape of problem this item's commit set out
to fix, relocated from a flat 9 to a flat 22. THE CRITIC found the identical
fact independently. Recorded in URD-016's notes rather than as its own item,
because fixing "which words a review draws" and "how many it needs" are the
same piece of work: scoping selection to the closing unit changes how much
material exists to draw from, which is exactly what decides whether the floor
or the unit's size governs the count.
On fighting the SRS scheduler (curriculum critic's Q1): confirmed
`dueBudget('review', size)` already lets a review absorb up to `size` real
due items, so the larger size is a genuine win when a backlog exists — u27
and u39 clamp to 37 and 39, well past the old flat 9. The finding is about
what fills the *rest* of a review when nothing is due, which on a first,
on-pace pass is the entire lesson, since SM-2's first interval is about a day
and a review is usually met before then.
Course length: +86.5 minutes (19.3h to 20.7h), matching the 3.3-6.0 min per
review times 39. Not disputed as a number; whether it is well spent is exactly
finding 1 above — time spent resampling the wrong material.
check:order and check:coverage both still pass and were confirmed not to
cover any of this: both explicitly exclude review-lesson content from what
they walk, and by construction review only ever draws from taughtUpTo/known,
so nothing it shows is untaught. The problem is which already-taught material
gets shown, which is outside both checks' scope and squarely inside review's
job.

### CURRICULUM CRITIC — MINOR
Fixed-cadence letter/word alternation (was: shuffled together, clustering up
to four deep; now: strict letter-word-letter-word). Traded one predictable
pattern for a different, more mechanical one. Not fixed; flagged for whoever
takes URD-016 or URD-017, since both touch the same interleave.

## PASSED · URD-010 · 2026-08-09T12:15Z
$ npm run check:shape -- --kind=review
  check:shape — 348 lessons, 0 of them vocabulary.
    mean lesson 3.6 min · 0.0 new words · 23.8 exercises emitted
  scoped to --kind=review. This is a working tool, not the gate.
  Every lesson is a sitting, every word is drilled, every topic has a home.

Unfiltered `npm run check:shape`, for the record and not as this item's pass
condition — the item's own DoD verify line names the unfiltered command,
which cannot exit 0 while non-review kinds still fail, and that gap is why
the flag exists and why this run is quoted rather than claimed: all `review`
problems are gone; every remaining problem is `phrases` or unit-count, neither
touched by this item.

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, on the specific repro THE CRITIC gave: restoring the
cap-before-filter order reproduces 17 of 22 for five due letters on Roman
(matches the critic's own number); restoring the single half-letters top-up
without the second word-only pass reproduces 18 of 22 for the pool-exhaustion
case at rev-first-faces.

New queue items from the critique: URD-016 (review should mostly review its
own unit), URD-017 (letter share should decay past the alphabet), URD-018
(review should sometimes ask for meaning in the reading direction).

branch: claude/gauntlet-review-queue

## CLAIMED · URD-013 · 2026-08-09T12:40Z
A letter lesson must be the same lesson twice, folded with URD-A02's letters
row (9 lessons under the 3-8 minute band).
verify: `npm test -- src/lib/shuffle.test.ts`
branch: claude/gauntlet-shape-cleanup, cut from claude/gauntlet-review-queue.
Picked as a contained, well-scoped slice of URD-A02's remaining backlog
(grammar/sentences/letters/phrases) rather than attempting all five kinds
in one claim.

## CRITIQUE · URD-013 · 2026-08-09T15:50Z
Dispatched THE CRITIC (always) and the CURRICULUM CRITIC (touches how a
letter is taught). Not the design critic: no screen changed, only the
generator and the store. Not the PLAYER: no soak run was driven this item;
recorded as skipped, not as unneeded.

This item took four rounds — one initial commit and three critique-and-fix
cycles — because each fix, checked narrowly against the finding that
prompted it, reproduced a different property this pipeline is supposed to
hold. That pattern is itself the finding worth recording plainly: verifying
one property at a time, on a pipeline with several properties that interact,
is not enough. The full sequence is below so the pattern is visible rather
than only the final state.

### ROUND 1 — commit 0de9479
Every letter lesson went from one exercise per letter (under a minute) to
`SIGHTINGS_PER_LETTER` (6) per letter, landing all 9 in the 3-8 minute band.
Folded in URD-013's own fix: `letterExerciseAt`, positional rather than
`Math.random()`-based, reused from the review pipeline (URD-010).

### THE CRITIC — BLOCKING (round 1)
B1. The loop was letter-outer, round-inner — it pushed all 6 sightings of
    the first letter before the second ever appeared, contradicting the
    commit's own doc comment and message. `l-3` measured `daal×6, Daal×6,
    zaal×6, ...`. check:shape's run detector missed it because it measures
    identical *kind*, and kind still rotated within the block.
B2. `l-1` ("Meet the letters") and `l-1-2` ("Position practice") —
    differently-titled lessons that deliberately share their six letters —
    generated byte-identical content, because the sequence depended only on
    letter and array position, never on which lesson was asking.

### CURRICULUM CRITIC — BLOCKING (round 1)
B3. Every sighting independently called `gradeItem`, walking the real SM-2
    scheduler as an independent day's review. Simulated: 6 correct answers
    to one letter in one sitting pushed its interval from 1 day to 98 days,
    from a single 5-minute lesson. Not new to letters — the vocab pipeline
    already meets a word 3x a lesson — letters made it 6x worse and loud
    enough to find.

Also recorded, not fixed this round: recognition (96.8% of exercises)
overweighted against reading-in-context; no progression across the 6
sightings; the single context word reinforces only the group's first
letter; no confusability-aware ordering of visually similar letters
(daal/Daal, seen/sheen).

### ROUND 2 — commit 1b91818 (fixing B1, B2, B3)
B1: round-major loop, `turn` locked to round so every letter in a round
shares a kind. B2: two hashes (`hashSeed`, new, extracted from
`seededShuffle`) offsetting turn and position per lesson id. B3: new
`shouldUpdateSrs` (src/lib/sessionGrading.ts) gates `gradeItem` to the first
sighting of an item per lesson visit, wired generically into
`LessonScreen.tsx` so it also fixes the pre-existing vocab-pipeline version
of the same bug.

### THE CRITIC — re-review, BLOCKING (round 2)
B1 was not fixed, it moved. Locking `turn` to round meant every letter in a
round shared the identical exercise kind — `l-3` measured 7 consecutive
`letterPick`. `check:shape` — cheap, and explicitly the right tool — was not
run against this commit before it was pushed; it fails immediately and
obviously. Recorded against the lead: partial verification (checked the one
axis the prior review named, not the one check:shape's own run detector
measures) is the same class of mistake the loop exists to catch.
Also: the "1 in 12" collision claim for the two-hash offset does not hold
for a future third lesson sharing a group — `hashSeed` of a base id and that
id with a literal suffix are correlated, not independent (measured 33.55%
collision for one suffix vs 8.22% for unrelated ids). Not blocking; no
lesson today reaches it.

### CURRICULUM CRITIC — re-review (round 2)
B3 (SRS) downgraded BLOCKING to MAJOR by the same critic who raised it. The
defeated-scheduler bug is genuinely fixed — verified independently against
real `newCard`/`review`. But "first sighting decides the session's grade"
discards a teaching lesson's strongest signal: a learner who answers wrong,
then right five times running, leaves with identical SRS state to one who
answered wrong six times. Proposed alternative: grade on the *last* sighting
instead, still capped to one `gradeItem` call per item per visit. Recorded
as a queue item (URD-019) rather than fixed here, since it is a real
disagreement about policy, not a bug, and the lead's turn was already deep
in the scheduler fix's verification.
Confirmed unaddressed by round 2, unchanged from round 1: recognition still
96.8% (re-measured against the pre-fix commit for comparison, identical
proportion), context word still reinforces only the first letter,
confusability still unordered. Progression across sightings: partially
resolved as a side effect of interleaving — a letter's own six sightings now
show variety in kind rather than six identical exercises, though the
per-round structure is still mechanically identical for every letter.

### ROUND 3 — commit a4cef10 (fixing THE CRITIC's B1)
`turn` made to depend on the letter's own position in the group as well as
the round, so it increments letter-to-letter within a round rather than
staying fixed. Re-verified all properties together this time rather than
one at a time: 0 letter-lesson findings from `check:shape`, max same-letter
run 1, max same-kind run 1-2, `l-1`/`l-1-2` still differ, deterministic
within and across processes.

### THE CRITIC — third-pass re-review (round 3)
No BLOCKING. Properties 1, 2, 4, 5, 6 (no same-letter runs; check:shape
clean; determinism; no (turn,position) degenerate cycles; group-size
interaction) all verified independently and held.
One MAJOR: `l-1`/`l-1-2` still collided on the axis that matters most.
`hashSeed('l-1') % 3 === hashSeed('l-1-2') % 3` — `turnOffset` collided
again, so the two lessons' *kind sequences* were byte-identical across all
36 exercises, even though enough *positions* differed (24 of 36) to pass the
round-2 regression check, which counted per-exercise kind-or-position
divergence rather than the kind sequence on its own. The check measured the
wrong granularity and a real collision passed it twice running.
One MINOR: the `GLYPH_MASKS` fallthrough branch is unreachable-dead (mask
coverage is complete, 160/160), untested by anything that would notice a
future regression there.

### ROUND 4 — commit 2d6cc5a (fixing the recurring collision, by the lead's own initiative before re-dispatching)
Replaced both hashes with `siblingIndex`: which lesson, in path order, this
is among every lesson built from the exact same letter sequence. Two
siblings always get different indices by construction, not probably
different ones — this is not a smaller collision probability, it is no
collision, for as many siblings as this course ever defines. `hashSeed`
left exported from shuffle.ts as an unused-but-working general utility
rather than deleted.
Verified: `l-1`/`l-1-2` kind sequences differ completely (36 of 36).
Broken on purpose — `turnOffset` pinned back to a constant — and the
collision reproduced exactly, confirming the test has teeth. Re-ran the
(turn,position) degenerate-cycle check with the corrected key (the first
pass double-counted `letterPick`, which carries no `position` field, as a
collision when the underlying rotation values genuinely differed) and found
zero real collisions.

No further critique dispatched after round 4: the only MAJOR finding from
round 3 was fixed by a structurally different, deterministic mechanism
rather than another probabilistic patch, which is the kind of fix that ends
a cycle rather than continuing it, and every property named across all
three critique rounds was re-measured together and held.

## PASSED · URD-013 · 2026-08-09T16:10Z
$ npm test -- src/lib/shuffle.test.ts src/lib/sessionGrading.test.ts
   Test Files  2 passed (2)
        Tests  27 passed (27)

$ npm run check:shape
  0 letter-lesson findings (length, run, share, or otherwise).
  Remaining 38 short-lesson failures are grammar/sentences/phrases/units,
  none of them letters.

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failures, both confirmed to reproduce the exact defect they guard:
  - `letters.forEach((l) => letterExercise(l))` in place of the round-major
    loop: fails "is identical in kind across repeated generations" — no, it
    fails differently, it fails determinism entirely (Math.random reinstated).
  - `turnOffset` pinned to a constant: l-1/l-1-2 kind sequences collide
    fully again, confirmed by direct measurement.

Four new queue items from what stayed open across the critique rounds:
URD-019 (SRS: last-sighting-wins instead of first), URD-020 (letters:
recognition vastly overweighted against reading-in-context, 96.8%
measured), URD-021 (letters: context word reinforces only the group's
first letter), URD-022 (letters: no confusability-aware ordering for
visually similar letters).

branch: claude/gauntlet-shape-cleanup

## CLAIMED · URD-012 · 2026-08-09T16:40Z
A phrase lesson is not six of the same question, the smallest contained
slice of URD-A02's remaining backlog (grammar/sentences/phrases).
verify: `npm run check:shape -- --kind=phrases` (unfiltered check:shape
still fails on grammar, sentences and unit-count, all out of this item's
declared scope)
branch: claude/gauntlet-phrases-grammar, cut from claude/gauntlet-shape-cleanup.

## CRITIQUE · URD-012 · 2026-08-09T18:20Z
Dispatched THE CRITIC only, across three rounds. Not the curriculum critic:
nothing about which phrases are taught, their order, or session length
changed — only the mix of exercise kinds asking about the same fixed set.
Not the design critic: no screen changed. Not the PLAYER: no lesson behaviour
a soak run would notice changed either. Recorded as skipped, not as unneeded.

### ROUND 1 — commit 307365a
`phrases` was 100% meaningPick, 6 in a row, because phrases share one icon
and `wordExercise`'s own picture-availability guard silently folds any
attempt at multipleChoice/listenTap back to meaningPick. Fixed with a greedy
bucket-fill: each phrase assigned to whichever eligible kind (meet, recall,
or produce for typeable phrases) currently has the fewest, tie-broken toward
the scarcer kind. Verified against the real 6-phrase draw: 2/2/2, no run
over 1, both tracks.

### THE CRITIC — round 1
BLOCKING. Two phrases in the corpus ("My name is ...", "I am from ...") are
literal fill-in-the-blank templates. `isTypeable` counted the letters around
the `...` as short enough, so the new produce path could route either to
`typeWord` with no answer `matchesWord`'s exact-skeleton comparison would
accept — filling the blank with a real name adds letters the target
doesn't have. Not reachable before this item, since phrases could never
reach `produce` at all.
MAJOR. The greedy bucket-fill's doc comment claimed it "bounds every kind
close to a third regardless of how the shuffle happens to sort" typeable and
untypeable phrases. False: fed `[T,T,T,F,F,F]` (produce-eligible clustered
first) at the real size of 6, it lands 1/3/2, 50% on one kind — the greedy
choice at each phrase commits ahead of what the back of the list needs.
Also confirmed: check:answerable and check:voice passing was not evidence
the new typeWord-for-phrases path is answerable — check:answerable has zero
references to typeWord or matchesWord and structurally cannot see this.
Confirmed g-to-be's 50% grammarDrill share is genuinely a length problem
(0.9 min) rather than something this item's technique could fix — grammar's
exercise kinds are fixed by concept data and a hardcoded cap, not a free
per-item choice the way meet/recall/produce are for a phrase.

### ROUND 2 — commit 7d9d269
Both fixed. Template phrases excluded from `produce` eligibility by
checking for a literal `...` in either script. The greedy per-phrase choice
replaced with a target computed from the whole draw first —
`produceCount = min(eligible, ceil(size/3))` — which removes order
dependence for any draw with 2 or more typeable phrases.
That investigation surfaced a narrower, real residual: below 2 typeable
phrases in the draw, no reassignment can clear 40% at this size — worked
out by hand, confirmed by brute force. Documented rather than solved, and
queued (URD-023). A `P()` size guard added, rejecting sizes 4 and 7 —
`Math.ceil(size/3)/size` exceeds 0.4 there regardless of content.

### THE CRITIC — round 2
No BLOCKING. Both round-1 findings verified fixed independently: 35,000
synthetic draws with zero template-phrase-to-typeWord routings; the exact
adversarial ordering now lands 2/2/2. Confirmed the degenerate <2-typeable
case degrades gracefully (a complete, answerable, duplicate-free lesson
that just fails the share check, not a crash) across 22,000 stress-test
draws.
Two MINOR findings, both the same species as round 1's MAJOR — a comment
claiming more than the code delivers: `P()`'s hardcoded `size===4||size===7`
missed sizes 1 and 2, which the stated formula also fails (unreachable
today, only call site uses the default). And the "no clean fix, needs a
fourth kind or bigger lessons" framing overlooked a cheaper lever the
critic named directly: the uniform draw itself has no floor on how many
typeable phrases it contains, so biasing the draw would remove the residual
for every future draw rather than only documenting it. Also recomputed the
residual rate exactly (hypergeometric): 8.24%, against the round-2 comment's
sampled "about 7.6%".

### ROUND 3 — commit b98bda2
Both MINORs fixed immediately rather than only queued, since they were
cheap and directly in the code just written. `P()` now checks the
inequality directly instead of two hardcoded numbers. The residual-risk
comment corrected to the exact 8.24% and now names sampling-bias as the
first, cheapest fix option, not a narrowed list of two costlier ones.

## PASSED · URD-012 · 2026-08-09T18:45Z
$ npm run check:shape -- --kind=phrases
  0 run/share problems. (Length is out of scope for this item and stays
  open — the phrases lesson is 0.9 min, folding into URD-A02's remaining
  backlog alongside grammar and sentences.)

$ npm run check:answerable
  every generated exercise is answerable from what it puts on screen

$ npm run check:voice
  every clip is audible

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure: reverted to the single-meaningPick-variant version and
confirmed check:shape reports the original 6-consecutive/100% failure
again, before restoring.

New queue item: URD-023 (phrases: guarantee enough typeable phrases at
draw time, not just reassign after drawing — three options named, cheapest
first).

branch: claude/gauntlet-phrases-grammar

## CLAIMED · URD-024 · 2026-08-10T21:20Z
The sentences row of URD-A02's remaining backlog. Was one exercise per
sentence — `size` sentences, `size` exercises, 0.8-1.3 min, an
interruption rather than a sitting. Gave it the same meet-recall-produce
climb vocab and phrases already have: reshape each `Sentence` into a
`Word`-shaped object (`SENTENCE_WORDS`, the same move `PHRASE_WORDS` made)
so it flows through the existing `meaningPick`/`wordFromMeaning`
components, three round-major rounds (meet, recall, `sentenceBuild`) per
sentence.
verify: `npm run check:shape` (unfiltered — no `--kind=sentences` filter
exists yet; the run/share sections are shared machinery, only the
per-lesson-minutes section is what this item moves)
branch: claude/gauntlet-sentences-length, cut from
claude/gauntlet-phrases-grammar after URD-012 shipped.

## CRITIQUE · URD-024 · 2026-08-11T13:35Z
Dispatched all three: THE CRITIC (the exercise-kind and pool-plumbing
changes), CURRICULUM CRITIC (a sentence's climb is a pedagogy question
letters/phrases weren't — segmenting or not segmenting a sentence changes
what the exercise teaches), DESIGN CRITIC (the new `wordFromMeaning`
component now renders content up to 37 characters it was never built for
— screenshots required, not a description). Not PLAYER: no lesson
selection or session-length behavior a soak run would notice changed
beyond what check:shape already measures directly.

First dispatch of all three (commit 0453fa7) failed outright — hit the
account's weekly API limit mid-investigation, all three terminated with
no verdict. Re-dispatched fresh once the limit cleared; all three
completed against the same commit.

### THE CRITIC
PASS (conditional on recording MAJORs, not BLOCKING). Checked, not
assumed: zero id collisions across the vocab/PHRASE_WORDS/SENTENCE_WORDS
pools `getAnyWord` now falls through (exhaustive script, all ~2,565 ids).
The round-boundary "max run is 2, not 1" comment holds for all 12 lessons
x 2 tracks, and is a structural property of `turn=(round+idx)%3` for any
pool size, not a coincidence of size=8. `lesson.size` semantic drift
(sentences no longer truncated to it) has exactly one consumer outside
generator.ts — `dueBudget`, which ignores `size` for any non-review kind —
so the drift is inert; live-tested the due-review weave too (24→26
exercises, progress bar tracked correctly). Determinism: two `check:shape`
runs, byte-identical. `check:all`: 24/24, alone on a clean tree.
MAJOR: `check-coverage.js` point 5 only inspects `ex.sentence.words`
(sentenceBuild-only), so meaningPick/wordFromMeaning are structurally
invisible to it — masked today only because every sentence's round-robin
turn happens to include a sentenceBuild pass, which itself depends on
`sentenceExercise` never returning undefined on the roman track (true for
all 256 sentences, maintained by discipline per the generator's own
comment, not enforced). Queued: URD-028.
MAJOR: got the `WordFromMeaningExercise` screenshot the lead could not.
Confirmed the flagged risk: fixed 26px font, no length adaptation, wraps a
37-char option to 3-4 lines against 1-2 line siblings. Worse than
cosmetic — reproduced, three times with different distractor draws, the
feedback footer landing directly on top of unpicked option cards' Urdu
text on a *correct* answer at 375x812. Confirmed recoverable by a manual
~300px scroll (not a stuck state, no content permanently hidden) and
confirmed no existing check catches it (`check:sizes` never opens a
lesson).

### CURRICULUM CRITIC
Not BLOCKING, three MAJOR. Distractor quality checked directly across 4
sampled lessons (24 questions): same-level, similar-length, genuinely
distinct wrong options, no giveaways, no two-right-answers. SRS-defeat
safety checked, not assumed: `itemsOf` keys meaningPick/wordFromMeaning on
the sentence's own id, `shouldUpdateSrs` dedupes per lesson visit, so the
3x exposure cannot be gamed the way letters could before that fix — the
generic fix holds for a case it wasn't written for. Sitting length (3.6
min for 8 sentences) lands inside the 3-8 minute band, comparable to
vocab/letters.
MAJOR: meaningPick/wordFromMeaning show a sentence as one opaque string,
never segmented — 2 of 3 reps are whole-sentence recognition, only 1 of 3
(sentenceBuild) forces word-order parsing, inverted from what
sentences.ts's own header and gauntlet/BENCHMARKS.md call this content
type's job. Queued: URD-025.
MAJOR: `readableSentences` filters on word forms only, no grammar-concept
readiness check. Measured: `s-intermediate`/`s-intermediate-2` draw 6/8
and 8/8 sentences tagging concepts (future, ability, obligation,
comparative) not taught by any `G()` lesson until 90-115 positions later.
Pre-existing (word-only filter and lesson placement predate this commit)
but this commit triples the exposure and is the first time it enters SRS
at all. Queued: URD-026.
MAJOR: measured actual draw coverage across all 12 lessons — 81 of 256
sentences (31.6%) ever drawn, the rest dead content. Same bug class as the
vocab-coverage gap this project's gauntlet work started from, previously
unmeasured for sentences, not fixed by raising `size`. Queued: URD-027.

### DESIGN CRITIC
PASS, two MAJOR, independently converging on THE CRITIC's screenshot
finding rather than duplicating it blind. 14 real screenshots at 375px and
320px, driven against the real production build with `completedLessons`
seeded for all 346 preceding lessons (tester mode confirmed stripped from
`npm run build:web` output). Measured live DOM heights, not eyeballed: at
375px, two option rows in the same exercise measured 252px vs 192px for
the same fixed 26px font; at 320px, a 388px row against a 312px row.
`meaningPick` and `sentenceBuild` both pass cleanly at both widths with
real long-sentence content. Cohesion check: the two new kinds reuse
existing multiple-choice/tile-tray shapes already taught elsewhere in the
app, not a bolted-on third shape.
MAJOR: same root cause THE CRITIC found — `WordFromMeaningExercise` has no
length-adaptive sizing, unlike its sibling `MeaningPickExercise`
(`len > 16 ? 26 : len > 9 ? 36 : 56`). Queued alongside THE CRITIC's
matching finding.
MAJOR (honest caveat): arithmetic from measured heights suggests the
longest draws likely push the fourth option below the fold at 320px,
requiring a scroll before all options are visible. Could not get a live
screenshot of that exact case — content is drawn by unseeded
`Math.random()` per load, and a 20-attempt automated hunt for the worst
draw crashed on a transient navigation timeout. Flagged MAJOR rather than
BLOCKING because the exercise body sits inside a real `ScrollView` with
Continue anchored outside it — the same "scrollable, not clipped"
distinction `check:sizes` already treats as non-broken elsewhere, and
nothing directly observed was actually unreachable.
Minor, not queued: `sentenceBuild`'s wrong-answer footer prints "Answer:"
with nothing after it (`answerLabel()` has no `sentenceBuild` case) —
cosmetic, the correct order is already shown in the exercise body
separately, no information lost.

## FIX ROUND — commit (pending, see PASSED entry)
Two independent MAJORs (THE CRITIC + DESIGN CRITIC) converged on the same
fixable root cause, so fixed inline rather than only queued:
`WordFromMeaningExercise` now sizes all four options off the longest
option's length (`maxLen > 28 ? 14 : > 20 ? 17 : > 12 ? 20 : > 6 ? 24 :
26`), one shared size per exercise so the grid can't lurch row to row —
structurally guaranteed by construction, not by luck, and confirmed
against the real corpus: 192 wordFromMeaning exercises generated across
all 12 lessons x 2 tracks, longest option 37 chars, sizes correctly drop
to 14/17/20px for long content.
The footer-overlap finding (6a) has a distinct root cause independent of
font size: `LessonScreen.tsx`'s scroll-to-reveal-feedback only fired
`if (!result.correct)` — built for "the explanation is off-screen below
a short question," which stopped being the only tall-content case once a
question itself (the option grid) could be tall. Now fires unconditionally
on every grade, correct or not.
The remaining DESIGN CRITIC MAJOR (possible scroll-before-answering on the
longest draws) is mitigated by the same sizing fix — a 37-char option at
14px needs meaningfully less vertical room than at a fixed 26px — but not
re-verified live under the same time pressure that stopped the original
15-attempt/2-viewport screenshot harness from finishing (it exceeded a
280s budget without completing a single attempt; redesigning that harness
for speed was judged not worth the cost against a defect that, even
unresolved, was already graded MAJOR-not-BLOCKING and matches an existing,
accepted "scrollable, not clipped" pattern elsewhere in the app). Not
queued as new — folds into the existing sizing discussion, no separate
finding survives it.
The four MAJORs with no cheap, contained fix (climb ratio, grammar
readiness, pool coverage, check-coverage blind spot) are queued as
URD-025 through URD-028 rather than fixed here — each is either a design
call bigger than this item's scope (rebalancing the climb) or a
pre-existing gap this commit only amplified or exposed, matching how
URD-A02's other rows (review/letters/phrases) left their own non-length
defects queued rather than folded into the length fix.

## PASSED · URD-024 · 2026-08-11T14:05Z
$ npm run check:shape
  26 of 319 short lessons (was 38 before this item; the 12-lesson drop is
  exactly the sentences row closing). Remaining short lessons are grammar
  (25) and phrases (1) — both pre-existing, out of this item's scope.

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure: reverted the `composed` exemption to `lesson.kind ===
'vocab'` only (dropping `sentences`), confirmed check:shape reports the
original 38-of-319 failure again — the exact truncation bug this item
fixed, reproduced on demand — then restored and re-confirmed 26 of 319.

New queue items: URD-025 (climb should lean on sentenceBuild, not
recognition), URD-026 (sentences drill untaught grammar, now 3x
amplified and SRS-scheduled), URD-027 (68% of sentence pool never drawn),
URD-028 (check:coverage blind spot on the two new exercise kinds).

branch: claude/gauntlet-sentences-length
