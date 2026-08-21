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

## CLAIMED · URD-031 · 2026-08-11T14:35Z
The last unaddressed row of URD-A02's remaining backlog: grammar. A
grammar lesson taught its concept, drilled it once per hand-authored
drill (1-3, fixed by content), showed up to 2 static sentences, and
stopped — 2-6 exercises, 0.3-0.9 min, and `g-to-be` specifically was 50%
grammarDrill (a check:shape run/share violation). Reuses the exact
meet-recall-produce climb URD-024 built for sentences-kind lessons,
applied to each concept's own tagged sentences.
verify: `npm run check:shape -- --kind=grammar`
branch: claude/gauntlet-grammar-length, cut from
claude/gauntlet-sentences-length after URD-024 shipped.

## CRITIQUE · URD-031 · 2026-08-11T15:10Z
Dispatched THE CRITIC and CURRICULUM CRITIC. Not DESIGN CRITIC: no new
screen or component, the same reused exercise shapes DESIGN CRITIC
already screened reviewing URD-024. Not PLAYER: no session-length or
lesson-selection behavior beyond what check:shape/order/coverage measure
directly.

### THE CRITIC
PASS, one MAJOR, one MINOR. Checked, not assumed, across all 25 grammar
lessons x 2 tracks: zero duplicate drill ids, zero duplicate (sentence,
kind) pairs, no run over MAX_RUN=3. `lesson.size` semantic drift (grammar
joins the `composed` exemption) has the same single, inert consumer
already verified for `sentences` (`dueBudget` ignores `size` for any
non-review kind). Distractor pool sampled for the three thinnest concepts
(g-plurals, g-pronouns, g-ability): always exactly 4 distinct, non-leaking
options — `reinforcePool` (every SENTENCE_WORDS entry at the concept's
level, 68-73 sentences) is far bigger than DISTRACTORS=3 needs. The three
residual short lessons (g-plurals 1.80min/12ex, g-ability 2.55min/17ex,
g-pronouns 2.70min/18ex) degrade gracefully — no crash, no repeat, no
truncation. Determinism: two `check:shape` runs, byte-identical.
`check:all`: 24/24, alone on a clean tree.
MAJOR: `check-coverage.js`'s existing blind spot (URD-028, filed against
sentences-kind lessons) now silently covers grammar lessons too — the
file's scoping condition already named `grammar`, so no code change
introduced this, but the surface doubled. Confirmed the same mitigating
coincidence holds here (every picked sentence gets one sentenceBuild turn
per lesson, which the check does see).
MINOR: the code comment attributed g-plurals' shortfall to "4 tagged"
sentences; actual count feeding the climb is 3 readable of 4 (one dropped
by `readableSentences` for using an untaught word, "میز"). Fixed in this
round.

### CURRICULUM CRITIC
Not BLOCKING, two new MAJOR. Teach-then-drill-then-reinforce order judged
sound. SRS interaction checked directly (not assumed): `shouldUpdateSrs`'s
per-lesson dedupe holds at this new call site for the same structural
reason verified for `sentences`. Grammar lessons now average 2.99 min
(range 1.80-3.30) against vocab's 4.56 and sentences' flat 3.60 — judged a
reasonable floor for this content type specifically, not a shortfall to
chase further; BENCHMARKS.md's comparison products have no equivalent
content type to measure against.
MAJOR: the sentence-reinforcement climb is a line-for-line copy of the
`sentences` branch's `turn=(round+idx)%3` structure — same 2-of-3-reps
whole-sentence-recognition ratio URD-025 already named for `sentences`,
reproduced verbatim here rather than being a new defect. Recommended
broadening URD-025 to cover both call sites rather than opening a
duplicate; done.
MAJOR (new root cause, not URD-025): measured across all 290
meaningPick/wordFromMeaning exercises the climb emits — only 26.9% (78 of
290) have even one distractor sharing the correct answer's grammar
concept. The other 73.1% are answerable by topic/vocabulary recognition
alone, without parsing the construction being taught. Filed as URD-030,
kept separate from URD-025 since it's about which pool feeds distractors,
not the round ratio.
Also flagged the same g-plurals comment imprecision THE CRITIC found
independently, plus a housekeeping note: the working diff referenced
"URD-029" in a comment before that item existed in QUEUE.md — created
before recording this PASSED, per ROLES.md's rule that a lead may not
record PASSED with a referenced-but-missing queue item.

## FIX ROUND — commit (pending, see PASSED entry)
Comment corrected to say "3 readable of 4 tagged" for g-plurals rather
than implying all 4 feed the climb, and to note the placement-vs-content
distinction CURRICULUM CRITIC raised. URD-025 broadened (title, file
scope, DoD, verify command) to cover both the `sentences` and `grammar`
call sites rather than leaving a duplicate gap. URD-028's description
text sharpened to say explicitly that grammar lessons carry the same
blind spot, not just sentences lessons — its file scope already covered
both. Two new queue items created: URD-029 (the three residual short
grammar lessons, including the g-plurals placement-fixable nuance) and
URD-030 (the grammar climb's distractor pool isn't concept-aware, 73.1%
of questions answerable by topic recognition alone).

## PASSED · URD-031 · 2026-08-11T15:35Z
$ npm run check:shape -- --kind=grammar
  3 of 25 short lessons (was 25 before this item). g-plurals, g-pronouns,
  g-ability remain short — thin tagged-sentence pools, documented as
  URD-029, not solved by repetition.

$ npm run check:shape (unfiltered)
  4 of 319 short lessons course-wide (was 26 before this item — 22 of the
  25 grammar lessons closed). The g-to-be run/share violation (50%
  grammarDrill) is gone as a side effect: no run/share problems reported
  for any grammar lesson.

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure: reverted the `composed` exemption to drop `grammar`,
confirmed check:shape --kind=grammar reports the original 25-of-25
failure again, then restored and re-confirmed 3 of 25.

New queue items: URD-029 (three grammar concepts stay short, thin
tagged-sentence pools), URD-030 (grammar climb's distractor pool isn't
concept-aware, 73.1% answerable by topic alone). URD-025 broadened to
cover both sentence-derived climb call sites. URD-028's scope text
sharpened to name grammar explicitly.

branch: claude/gauntlet-grammar-length

## CLAIMED · URD-001 · 2026-08-11T16:07Z
Top unclaimed item once the length dimension closed across URD-A02's
whole backlog. 20 `@typescript-eslint/no-explicit-any` warnings across 4
files, exactly as the spec named: `src/components/Reveal.tsx` (1),
`src/exercises/index.tsx` (15), `src/lib/sync.ts` (3),
`src/screens/ProfileScreen.tsx` (1).
verify: `npx eslint . --max-warnings 0`
branch: claude/gauntlet-lint-any, cut from claude/gauntlet-grammar-length
after URD-031 shipped.

## CRITIQUE · URD-001 · 2026-08-11T16:16Z
Dispatched THE CRITIC (mandatory) and PLAYER — not for a behavior change
(none was intended; this is a type-safety refactor), but because the
highest-risk change, `exercises/index.tsx`'s switch-to-lookup-table
rewrite, touches every exercise kind's rendering dispatch, and a
transcription error swapping two entries would typecheck cleanly while
being a real, silent, learner-facing bug. Not CURRICULUM CRITIC (no
content changed) or DESIGN CRITIC (no new screen).

### THE CRITIC
PASS, two MINOR, no BLOCKING/MAJOR. Reproduced everything independently
rather than trusting the commit message. Diffed the 15-entry
`EXERCISE_COMPONENTS` table against the original switch key-by-key: exact
1:1 match. Went further than asked and empirically tested the type
system's actual guarantee — edited the real file to swap `meaningPick`/
`wordFromMeaning` (deliberately the hardest case: same-shaped payloads,
not just a signature change), ran `tsc --noEmit`, watched it fail with a
real `TS2322`, reverted. Found the commit UNDERCLAIMED its own safety (it
said "change a signature," but a same-shaped swap fails too, via
`strictFunctionTypes`'s contravariant check on the discriminant-bearing
prop) — corrected the record rather than letting an inaccurate but
favorable claim stand.
Tested `isSyncPayload` against a battery of malformed inputs (string,
`{progress:5}`, `null`, `{progress:{}}`, number, boolean, nested-array
`.settings`, and more) — correct on all but one: `[]`/`[1,2,3]` pass,
because `typeof [] === 'object'` and an array's absent `.progress`/
`.settings` satisfy the permissive check vacuously. Not learner-facing
(`applyRemote` only acts on truthy fields, so an accepted array is inert)
but contradicts round 1's "falls through to reseeding" claim for that
specific shape. MINOR — fixed same day (round 2, commit `fba6647`).
Built a standalone `tsc --strict` probe with `@ts-expect-error` assertions
to confirm `NoParamScreen` resolves to exactly the 7 `undefined`-params
screens, no more, no less — including the non-obvious case that
`LetterLab: {letterId?} | undefined` is correctly excluded (the
conditional isn't distributive over the indexed-access type).
Ran the real app: built a tester-mode bundle, jumped to one lesson of
each of 6 families (letters, vocab, grammar, sentences, reading,
dialogue), screenshotted each, confirmed the right component rendered
with `pageerror`/console-error listeners armed throughout — zero errors.
Reproduced `eslint`, `tsc`, `vitest` (78/78) and `check:all` (24/24)
independently, fresh, on a clean tree.

### PLAYER
No BLOCKING/MAJOR — corroborated THE CRITIC via a different method
(reading the real shipping source of the two highest-risk components
directly, rather than only screenshotting them) and surfaced one useful,
out-of-scope side-finding.
Diffed the same 15-entry table independently and confirmed the 1:1
match. Read `MeaningPickExercise` and `WordFromMeaningExercise`'s actual
render logic and confirmed neither is reversed (the first shows Urdu and
asks "What does it mean?"; the second shows English and asks "How do you
say it?" with Urdu options) — the specific swap risk this dispatch was
about, ruled out by source, not just by screenshot.
Attempted `npm run soak` for additional live coverage of the other 12
kinds; found and reported plainly, rather than hiding, that it could not
get there: `soak.js`'s own "34 lessons, 220 exercises, 0 failures"
summary is misleading on this exact HEAD — replaying the identical seed
with every screen's text logged showed the run never left lesson one
(the `lessonsPlayed` counter increments per retry attempt, not per
completion), reproduced on two independent seeds. Correctly identified
this as a pre-existing gap already named by URD-005 (soak can't reach
most kinds) colliding with URD-006 (hearts lockout), not a defect this
commit introduced — and found a previously-undocumented detail (the
counter's own dishonesty) worth folding into URD-005 rather than treating
as a blocker here.
Only organically exercised 3 of 15 kinds live (`letterForm`/`letterPick`/
`letterTrace`, ~100+ answers, zero crashes) before the hearts lockout
stalled further progress — reported the shortfall plainly rather than
papering over it, and relied on direct source-reading (converging with
THE CRITIC's independent, stronger compile-time proof) for the other 12.

## PASSED · URD-001 · 2026-08-11T16:20Z
$ npx eslint . --max-warnings 0
  (no output — clean)

$ npx tsc --noEmit
  (no output — clean)

$ npx vitest run
  6 files, 78/78 tests passed

$ npm run check:all
  check:all — all 24 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure: reverted `Reveal.tsx`'s `style?: StyleProp<ViewStyle>`
back to `style?: any`, confirmed eslint reports the warning again (plus
two now-unused-import errors), then restored and re-confirmed clean.

New queue item: none. Appended a reproduction note to URD-005 (the
misleading `lessonsPlayed` counter, found by PLAYER on this exact HEAD,
two seeds) rather than opening a duplicate — URD-005 and URD-006 already
covered the root cause exactly.

branch: claude/gauntlet-lint-any

## CLAIMED · URD-002 · 2026-08-11T16:35Z
Top unclaimed item below URD-A02 in QUEUE.md: the learn path was
described as a flat ScrollView mounting all 348 lesson rows.
verify: `npm run check:path`
branch: claude/gauntlet-path-mount, cut from claude/gauntlet-lint-any
after URD-001 shipped.

## INVESTIGATION · URD-002 · 2026-08-11T16:50Z
Measured first rather than assumed. `HomeScreen.tsx` already had a
pre-existing `isOpen(lvl) &&` gate collapsing every course stage except
the learner's current one (introduced well before this session, commit
7e05231) — a fresh guest mounted 87 buttons total, not 348. What the item
actually lacked was the check it calls for: `scripts/check-path.js` did
not exist. Wrote it (three scenarios: fresh guest, learner 70% through
the course, and — added after a live test found independent per-level
toggles could still reach 354 mounted buttons by tapping every header —
clicking every level open in turn). That third scenario surfaced a real,
reachable gap the default-state check alone would have missed: levels
were independent toggles (`openLevels: Partial<Record<Level,boolean>>`),
so a learner curious enough to open all four reached the exact 348-row
state the screen exists to avoid. Fixed at the root: replaced with a
single `openLevel` value — an accordion, so opening one closes whichever
was open, making the multi-open state unrepresentable rather than merely
detectable.

## CRITIQUE · URD-002 · round 1, 2026-08-11T17:15Z
Dispatched THE CRITIC and DESIGN CRITIC — the accordion is a real
interaction-behavior change on the Home screen, not just a new check.

### THE CRITIC — round 1
PASS, no BLOCKING. Confirmed the "already mitigated" claim two ways: code
inspection (plain `&&`-gated `.map()`, no display:none trick) and
measurement (mounted counts land exactly on each open level's real
total). Confirmed `lesson.size`-style semantic drift doesn't apply here
(nothing reads a lesson count off this screen). Sampled distractor... n/a
(not a content item). Four MAJOR findings:
1. `check:path`'s `BOUND` (`maxLevelLessons + 20`) had no ceiling against
   `ALL_LESSONS.length` — if a future regroup ever concentrated the
   course into fewer, bigger levels, the bound could climb toward the
   whole course and the check would quietly stop being able to fail.
2. The accordion pin (`openLevel`) persisted for the rest of the session
   once a learner touched *any* header, not just the one that would later
   become current — `HomeScreen` never remounts between lessons — silently
   defeating both "open my current stage" and the mount-time
   auto-scroll-to-current-lesson for the remainder of the visit.
3. `check:path`'s third scenario used `page.getByRole('button', {name:
   /Expand/}).first()`, which always grabs the topmost DOM match — verified
   live it only ever oscillated between Beginner and Elementary, never
   reaching Intermediate (94, the real largest level).
4. Recorded that this item could not close on THE CRITIC's verdict alone
   per ROLES.md, since DESIGN CRITIC's screenshot review was still
   outstanding — and (live evidence in the same checkout) already turning
   up a further real bug.
Also flagged a MINOR (content-coupled lesson-row-suffix heuristic, unlikely
to misfire) not requiring action.

### DESIGN CRITIC — round 1
**BLOCK.** Real repro, not hypothetical: default state (Beginner open,
~8000px), scroll down to Elementary's collapsed header, tap it. Measured
the actual scroll container: `scrollTop` unchanged (8420) both 50ms and
900ms after the tap, while `scrollHeight` shrank (Beginner collapsing).
Since the same raw pixel offset that used to sit exactly at "Elementary's
collapsed header" now lands deep inside Elementary's own freshly-opened
list, the resulting screen showed six-plus anonymous lesson rows with
zero visible stage header — reachable by the single most natural next
action from the default screen (scroll past stage one, open stage two),
which every fresh learner starts in exactly the state to trigger.
Also flagged a MAJOR (pre-existing missing `aria-expanded`, made costlier
by the accordion silently changing a header a screen-reader user wasn't
touching) and confirmed the collapse-to-none state reads as intentional,
not broken.

## FIX ROUND — round 2, commit 1344973
All four of THE CRITIC's findings and DESIGN CRITIC's BLOCKING finding
addressed in one round:
- BOUND capped at `Math.min(maxLevelLessons + 20, Math.ceil(ALL_LESSONS.length
  / 2))`, with the cap itself reported as a problem if it ever engages
  (not silently widened to allow a future regression through).
- `useEffect(() => setOpenLevel(undefined), [currentLevel])` added — the
  pin now clears when the learner's actual progress advances to a new
  stage, not just on remount.
- check:path's third scenario rewritten to target each level by its own
  title (`^${title}\.`), visiting all four instead of oscillating between
  two.
- The scroll bug: two precise-positioning approaches were tried and both
  measured wrong against the real react-native-web build (documented
  in-code as a record for whoever touches this next) — `measureLayout`
  against the ScrollView returned 0 regardless of the header's real
  position; tracking `onScroll` offset raced a real browser behavior
  (the browser clamps `scrollTop` synchronously when a tall stage
  collapses, ahead of the throttled event that would report it). Landed
  on resetting to `y: 0` instead: no measurement, so nothing to race,
  and "no header in sight" becomes impossible by construction (the app
  header and today's-word card are always there) rather than a careful
  arithmetic guarantee that kept failing in practice.

## CRITIQUE · URD-002 · round 2, 2026-08-11T18:05Z

### DESIGN CRITIC — round 2
**PASS.** Reproduced the exact round-1 repro at both 375px and 320px:
`scrollTop === 0` after the tap settles in both cases, sampled the
animation at 25ms resolution (eased, ~700ms, no hard cut), and confirmed
the landing screen is always the app header / stats / continue card /
today's-word card — never a wall of anonymous rows. Round-1-passing
behaviors re-confirmed unregressed (collapse-to-none, default view).
Measured the trade-off rather than assuming it: because opening a stage
collapses whichever was open, the newly-open content is reachable with
~500px of scroll from the top, not a symmetric ~8000px round trip — this
meaningfully weakens the "disorienting" concern. One MINOR, not gating: a
tighter landing (just above the accordion) would still guarantee a
labeled state while roughly halving that 500px — filed as URD-032.

### THE CRITIC — round 2
**PASS.** Verified all four fixes independently, not by re-reading the
diff. BOUND: reproduced the exact 81/94/94/bound-114 numbers, hand-checked
the cap's arithmetic and confirmed (by simulating larger `maxLevelLessons`
values) it actually reports a problem when it engages, and noted the
existing 50%-of-total check independently backstops it regardless of
where the cap is set. `currentLevel`-reset effect: confirmed the
dependency array, live-tested the "browsing ahead without currentLevel
changing" case (opened and held for 3 seconds, no spring-back), checked
for effect-ordering/loop risk against the pre-existing auto-scroll effect
(none found) — did not drive a real lesson to completion in-browser to
observe the reverse case (`currentLevel` actually advancing), and said so
plainly rather than asserting it. check:path scenario 3: instrumented and
confirmed live that Intermediate (94, the real largest level) is genuinely
reached, not just Beginner/Elementary again. Scroll fix: reproduced
DESIGN CRITIC's exact repro independently at both widths, and additionally
measured the same ~500px-not-~8000px trade-off DESIGN CRITIC found.
Confirmed collapsing the open level still triggers no scroll. Two MINOR
findings: unescaped regex metacharacters in check:path's level-title
matcher (fixed same round) and an FYI that the once-per-mount auto-scroll
doesn't re-fire when `currentLevel` advances mid-session while the learner
is scrolled elsewhere (folded into URD-032 alongside DESIGN CRITIC's
finding).

## PASSED · URD-002 · 2026-08-11T18:25Z
$ npm run check:path
  3/3 scenarios pass: 81 / 94 / 94 lesson rows mounted, bound 114 (largest
  single level 94 of 348 total).

$ npm run check:all
  check:all — all 25 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure: reverted the `isOpen(lvl) &&` gate to `true &&`,
confirmed all three check:path scenarios report 348-of-348 mounted
(exceeding the bound and the 50%-of-total floor), then restored and
re-confirmed 81/94/94.

New queue item: URD-032 (the stage-open scroll resets further than it
needs to, and the mount-time auto-scroll doesn't re-fire when
`currentLevel` advances mid-session — both measured, neither blocking).

branch: claude/gauntlet-path-mount

## CLAIMED · URD-004 · 2026-08-11T20:10Z
Top unclaimed item below URD-A02. "Master," the top level title, sits at
level 25 (18,000 XP); a complete playthrough (sum of every lesson's `.xp`
across `ALL_LESSONS`) pays out ~7,220 XP — 2.49x the whole course,
structurally unreachable. Already re-measured worse once (11,552/level 20
when first filed, 7,220/level 16 after URD-A02 attempt 1 regrouped
lessons), which is why the item's own notes insist the fix derive both
numbers rather than hardcode either.
verify: `npm test -- src/lib/gamification.test.ts`
branch: claude/gauntlet-top-title, cut from claude/gauntlet-path-mount
after URD-002 shipped.

## CRITIQUE · URD-004 · 2026-08-11T20:55Z
Dispatched THE CRITIC only. Not CURRICULUM CRITIC (no lesson/word/order
content changed), not DESIGN CRITIC (no screen changed — titles render
through the same existing UI at different XP amounts), not PLAYER (no
exercise/lesson behavior changed).

### THE CRITIC
PASS. Reproduced the core numbers independently rather than trusting the
commit: summed `ALL_LESSONS[].xp` directly (7,220, matching exactly),
recomputed `xpForLevel(14)=5,460` (24.38% margin) and `xpForLevel(16)=7,200`
(0.28% margin, confirming the "razor-thin at the ceiling" reasoning for
not putting Master at the literal max). Checked the lower-tier spacing by
converting to course-completion fractions rather than raw level gaps
(3%/8%/18%/30%/46%/76%) and found it reasonably even despite constant
level-gaps, not bunched.
MAJOR (fixed same round): deliberately broke the fix three ways per the
brief. Reverting the threshold and trying an intermediate wrong value
both failed with clear, correct messages. Renaming the top tier's string
(simulating a future refactor) caused the test's own lookup loop —
`while (levelTitle(topTitleLevel) !== topTitle) topTitleLevel++` — to
hang indefinitely, past what vitest's timeout could interrupt since it
depends on the same event loop the loop was blocking. Real, demonstrated
failure mode, not hypothetical. Capped the loop with a fail-loudly
throw instead of a silent hang.
MAJOR (queued, not fixed here — different file/subsystem this item was
never scoped to touch): grepped for other level/XP-threshold assumptions
and found `achievements.ts`'s "Scholar" achievement gates its top tier at
10,000 total XP — 38.5% more than the same 7,220 XP course total provides,
the identical bug class in a sibling system. Filed as URD-033.
MINOR: the six lower tiers' spacing was chosen "by feel," not by a stated
formula — added a code comment recording the fractions THE CRITIC
computed, so the next re-space has something to check against besides
eyeballing again.

## PASSED · URD-004 · 2026-08-11T21:05Z
$ npx vitest run
  6 files, 79/79 tests passed (was 78 — one new test).

$ npm run check:all
  check:all — all 25 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure (three ways, per THE CRITIC's brief): reverted the
threshold to level 25 — test failed with "expected 18000 to be less than
or equal to 7220." Tried level 20 — failed with "expected 11400 to be
less than or equal to 7220." Renamed the top tier's string to simulate a
future refactor — confirmed the capped loop now throws a clear error
("no level up to 1000 carries the title...") instead of hanging, closing
THE CRITIC's MAJOR finding. All three restored and re-confirmed 79/79.

New queue item: URD-033 (achievements.ts's Scholar tier is unreachable
against the real course total, the same bug class this item fixed for
level titles, in a system this item never touched).

branch: claude/gauntlet-top-title

## CLAIMED · URD-005 · 2026-08-11T21:10Z
Top unclaimed item below URD-004. `npm run soak` reports only `tap` and
`letterTrace` from a default run, because it starts at lesson one and the
alphabet units never reach most exercise kinds. Add `--start`/`--require`
so a run can begin anywhere on the path and assert which kinds it saw.
verify: npm run soak -- --lessons 30 --seed 7 --require typeWord,wordBuild,matching,sentenceBuild
branch: claude/gauntlet-soak-coverage, cut from claude/gauntlet-top-title
after URD-004 shipped.

## CRITIQUE · URD-005 · 2026-08-12T00:20Z
Dispatched THE CRITIC and PLAYER (this item rewrites `scripts/soak.js`
itself — PLAYER's own instrument — and its correctness needs an
adversarial read, not curriculum or screen review; no lesson content or
UI changed, so CURRICULUM CRITIC and DESIGN CRITIC were not dispatched).

### PLAYER
No BLOCKING/MAJOR authority, clean report. Independently completed a real
run (`--start 90 --lessons 20 --seed 7 --require wordBuild`, own numbers:
141 exercises, `wordBuild 3`, exit 0) after tracking down an environment
issue (a worktree file reversion, and port contention with a concurrent
verification run on the hardcoded PORT=8311 — both process notes, not
code findings). Verified by direct source comparison, not just trusting
the code comments, that `solveMatching`'s `:not([aria-disabled="true"])`
filter genuinely excludes only already-matched tiles (`Matching.tsx`'s
per-tile `disabled` prop), and that the Finish-button and Home-screen
completion regexes match their exact source lines.
MINOR: `--require reading`/`--require dialogue` could never pass —
both kinds use dynamic `<Question>` text with no fixed marker, so they
fell through to `'tap'` and could never be named (independently found;
see THE CRITIC's B1 below, same defect from a different angle).
MINOR: same-seed replay is approximate, not exact — two runs of the
identical seed/flags landed on the same kind mix and pass/fail shape but
different exercise counts (130 vs 141), evidently perturbed by real
browser/network timing the RNG doesn't control. Worth a doc caveat.

### THE CRITIC
Verdict: FAIL, 1 BLOCKING.

B1 (BLOCKING): `--require` can never recognize `reading`, `dialogue` or
`grammarTeach` by name — all three fall through to the literal string
`'tap'` (`reading`/`dialogue` have dynamic `<Question>` text drawn from
the passage/exchange; `grammarTeach` has no `<Question>` at all). So
`npm run soak -- --require dialogue` reports "required kind never seen"
even on a run that genuinely visited and correctly answered dozens of
them — and `reportRequired`'s own failure-hint text explicitly names
`dialogue` and `reading` as things to try, actively steering a user into
a permanently-broken invocation. THE CRITIC: "a real, demonstrable lie
the tool can tell about itself... the same class of bug this project has
been burned by twice before." Verified independently: both of the lead's
claimed-passing runs (`--start 90 --require wordBuild`,
`--start 97 --require sentenceBuild`) re-ran clean; `check:all` re-ran
clean; a live induced-failure test (reverting the matching-board y-bound,
the `aria-disabled` filter and the mouse-coordinate click back to their
broken originals, in a throwaway copy) reproduced the exact `dead end`
failure the diff's own commentary predicted, confirming that fix is real
and load-bearing, not cosmetic.
M1 (MAJOR, folded into the fix below rather than queued separately):
`solveMatching` never attempts a deliberately wrong pair — it has no
`wrongOnPurpose` parameter at all, unlike every other solver — so the
module's own doc-comment claim ("answers deliberately wrongly some of
the time... so the wrong path is exercised") was unfulfilled for an 8th
kind, not the 7 originally scoped.
M2 (MAJOR, queued): `--start N --track roman` undercounts skip depth by
up to 13 lessons, because `START_COMPLETED` is always built from the
script-track's `ALL_LESSONS` order, which still contains the 13 letter
lessons the roman track's own order (`unitsForTrack('roman')`) drops.
Neither shipped verify combines `--track roman` with `--start`, so this
does not affect what got recorded PASSED here — queued as part of
URD-034 rather than a fourth item, since it is a smaller instance of the
same "soak's simplifying assumptions don't hold once you look" pattern.

## FIX ROUND — URD-005, commit (pending)
B1 fixed, and fixing it exactly as scoped immediately surfaced two more
real, previously-unknown bugs that made the fix's own verification fail
until they were fixed too — documented here in the order they were found,
each with the real run that caught it.

1. **Naming.** Added `Reading · ` / `Conversation · ` (both exercises'
   own `Eyebrow` caption, present on every stage) and a bare `Grammar`
   eyebrow to the kind-detection tables, matched case-insensitively — the
   eyebrows render uppercase via CSS `text-transform`, so `innerText`
   reports `READING · MY FAMILY`, not the source's mixed-case string; a
   first attempt without the `i` flag still failed on that exact text,
   caught by re-running rather than trusting the diff.

2. **Reachability, not just naming.** Labeling alone did not make
   `reading`/`dialogue`/`grammarTeach` answerable: THE CRITIC's B1 fix
   pointed at real content these screens had likely never been exercised
   in at all. Confirmed live: `<Button>` (`src/components/Button.tsx`,
   backing "I've read it," "Got it," "Show examples") never sets
   `accessibilityRole="button"`, unlike `<Choice>` — walked its DOM
   ancestry six levels up, no `role` attribute anywhere. `tapNamedKind`'s
   `[role="button"]` query is structurally blind to it, so a run through
   any of these screens hit `unanswerable screen` and stalled — this was
   not a labeling bug alone, it was an unreachable-content bug the
   labeling work exposed. Fixed with an explicit text-based tap
   (`text=/read it/i`, `text=/^(Show the pattern|Show examples|Got it)$/i`)
   for the intro/reveal stage of each, falling through to the ordinary
   `role="button"` search only for the `<Choice>`-built answer stage that
   follows.

3. **Off-screen content.** A longer dialogue (5 speaker turns) pushed
   both the "I've read it" button and, on the next stage, the Question
   and its Choice options below the fixed 900px viewport — `tap`'s
   bounding-box check correctly reported them as not on screen, since it
   never scrolls. Fixed with `scrollIntoViewIfNeeded()` for the single
   intro button; for the answer stage, `page.mouse.wheel()` was tried
   first and visibly did nothing (identical failure screenshot before and
   after — it dispatches at the mouse's last position, not necessarily
   over RN-web's actual `overflow: auto` scroll container), so replaced
   with a `page.evaluate()` that scrolls every scrollable container on
   the page to its bottom directly.

4. **Recovery.** A separate, pre-existing gap this now reaches: `why ===
   'ran out'` (a lesson that hits its 90-step budget) was never given the
   same `page.goto(url)` recovery `why === 'stuck'` gets, so a timed-out
   lesson could leave the browser on a mid-lesson screen (observed: an
   affordable-refill "Out of hearts" prompt) and the *next* attempt's
   `openNextLesson` then failed against that stale screen, cascading into
   a second, unrelated `no lesson to open` failure. Fixed by extending the
   reset to both outcomes.

5. **A real, separate app bug, left unfixed and queued as URD-035.**
   Fixing 1-4 let a run reach far enough into `GrammarTeachExercise` to
   trigger an uncaught `TypeError: Cannot read properties of undefined
   (reading 'N')` partway through its reveal-a-stage flow, blanking the
   screen — reproduced on two independent concepts and seeds
   (`g-pronouns`/seed 7/`--start 29`; `g-gender`/seed 11/`--start 45`).
   Ruled out a driver-timing race first (the card's own `setTimeout(120)`
   reveal delay was a plausible cause): added a 200ms settle wait after
   each reveal tap, reran, identical crash. This is app code
   (`src/exercises/GrammarExercises.tsx`), not `scripts/soak.js`, and out
   of scope to fix here — filed as URD-035 with full repro rather than
   silently working around it or leaving it undocumented.

## PASSED · URD-005 · 2026-08-12T04:05Z
$ node -c scripts/soak.js && npx eslint scripts/soak.js && npx prettier --check scripts/soak.js
  syntax OK, 0 lint errors, formatted.

$ npm run check:all
  check:all — all 25 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Real (non-diagnostic, real hearts economy, no code hacks) verify runs,
each independently re-run after the B1 fix round and confirmed clean:

  npm run soak -- --start 90 --lessons 20 --seed 7 --require wordBuild
    → 0 lessons completed (expected — see URD-034), wordBuild seen,
      required kinds all seen, Nothing broke. Seed 7.
  npm run soak -- --start 97 --lessons 15 --seed 7 --require sentenceBuild
    → same shape, sentenceBuild seen, Nothing broke.
  npm run soak -- --start 74 --lessons 2 --seed 7 --require reading
    → 2/2 lessons completed, reading seen twice, Nothing broke.
  npm run soak -- --start 77 --lessons 3 --seed 7 --require dialogue
    → 3/3 lessons completed, dialogue seen twice, Nothing broke.

Induced failure, per THE CRITIC's own live method: reverted the matching
board's `y > 80` bound to the original `150`, the `:not([aria-disabled=
"true"])` filter, and the mouse-coordinate click, each back to their
broken originals in a throwaway copy — reproduced the exact `dead end`
("the screen did not change across 4 attempts") the fix was written
against, twice. Restored and re-confirmed all four real runs above.

`--require matching` and the item's own originally literal verify
(`--lessons 30 --seed 7 --require typeWord,wordBuild,matching,
sentenceBuild`, no `--start`) still do not pass against a real run —
not a defect in what shipped here, but a real, separately-diagnosed
downstream effect (see URD-034: the generic answer-tap doesn't try to be
correct, so no real soak run has completed a single lesson this entire
session, independent of `--start`; `matching` sits behind full-lesson
completion and so is currently unreachable regardless of budget). The
solver itself is verified correct: a throwaway, unshipped patch
(`hearts: 999` in the guest-seed call, never committed) that removes the
hearts economy as a confound let 10 of 10 real attempts complete cleanly
in one run, all four required kinds seen together, `matching` solved 8/8
— proof the code is right even though today's real hearts economy and
answer accuracy keep it out of reach. Recorded here rather than claimed
as a passing shipped verify, per the project's own rule against
reporting a check green on reasoning instead of a real run.

Counter honesty (this item's other half): `attempts`/`lessonsCompleted`
are genuinely separate counters now; `--lessons` still bounds the loop on
`attempts`, deliberately — self-corrected mid-implementation after
measuring that gating on completions instead made a real run's length
unbounded (see the code comment at the loop site), which is itself
information about URD-006, not a redefinition this item's own
instruction called for.

New queue items: URD-034 (the generic answer-tap doesn't try to be
correct, the root cause behind every 0-completion real run this
session, MAJOR from THE CRITIC plus the lead's own measurement),
URD-035 (a real, reproducible uncaught error blanking a grammar teaching
card, found chasing THE CRITIC's B1 fix, app code not soak.js).

branch: claude/gauntlet-soak-coverage

## CLAIMED · URD-006 · 2026-08-12T04:20Z
Top unclaimed item below URD-A02. The "Out of hearts" lockout screen's
refill button is correctly `disabled={gems < 40}`, but a fresh profile
starts at 20 gems against a 40-gem refill and pays 5-8 gems a lesson —
close to every new learner's first lockout is unaffordable, and the
screen says nothing about why or what to do instead.
verify: npm test -- src/lib/gamification.test.ts
branch: claude/gauntlet-lockout-screen, cut from claude/gauntlet-soak-coverage
after URD-005 shipped.

## CRITIQUE · URD-006 · 2026-08-12T07:35Z
Dispatched THE CRITIC (mandatory) and DESIGN CRITIC (this item changes the
lockout screen's rendered text and disabled-state wiring). Not CURRICULUM
CRITIC (no lesson content). PLAYER not dispatched — the change is a small,
self-contained text/logic fix with direct unit-test coverage, and DESIGN
CRITIC was already going to drive the real screen in a browser, covering
much of the same ground a soak run would; noted here rather than silently
skipped, per ROLES.md.

### THE CRITIC
First dispatch hung indefinitely: it tried to `git diff`/`EnterWorktree`
the shared checkout to see this item's still-uncommitted change from its
own isolated worktree (whose git history predates the change), and
`EnterWorktree` never returned — killed after ~3 hours with zero file
activity or running processes in its worktree, confirmed dead rather than
slow. Redispatched with explicit instructions to read the changed files
directly from `/home/user/Urdu` by absolute path instead of git-diffing a
worktree that can't see uncommitted work. Second dispatch completed
normally.

Verdict: PASS. No BLOCKING.
MAJOR (fixed same round): `gamification.test.ts`'s "fresh profile" test
asserted `minutesUntilNextHeart(Date.now())` `toBeGreaterThanOrEqual(0)`
— structurally true against any implementation, since the function is
clamped to `[0, HEART_REGEN_MINUTES]` regardless of its inner arithmetic.
THE CRITIC: "I mentally deleted the clamp's inner arithmetic... and this
assertion still passes" — citing `docs/ENGINEERING_STANDARDS.md` rules
90-91 ("every new test must be seen to fail" / "a test that cannot fail
is worse than no test"), the same class of bug the DST test was burned by
once already. Fixed to assert the actual expected value (a heart just
lost, zero elapsed, must wait the full cycle: `toBe(HEART_REGEN_MINUTES)`).
MINOR (fixed same round): the doc comment above `minutesUntilNextHeart`
claimed `LessonScreen.tsx` "clears `outOfHearts` as soon as `hearts > 0`"
— false as a description of the code; grepped every reference and found
`outOfHearts` clears only on a successful refill or "Leave for now,"
never on a heart regenerating on its own. Not a learner-facing defect
(the real escape hatch, "Leave for now," is unconditional and unaffected;
`HomeScreen.tsx` never gates starting a lesson on hearts either) but a
false claim about the mechanism a future engineer could reason from
wrongly. Rewrote the comment to describe what actually happens.
Verified independently: `npx vitest run src/lib/gamification.test.ts`
(22/22), `npx tsc --noEmit` (clean), `npm run check:all` (all 25 steps,
watched the real process to its own exit rather than trusting a
premature signal). Hand-traced `heartsUpdatedAt`'s semantics against
`regenHearts`/`loseHeart`/`refillHearts` in `useProgressStore.ts` and the
boundary cases (gems exactly 40, elapsed exactly 30/0/negative minutes,
singular/plural wording) — all correct as read.

### DESIGN CRITIC
Built (`npx expo export` after `build:web` hit a stale cross-worktree
metro cache — an environment issue, not this item) and screenshotted the
real lockout screen at four gem/wait combinations via Playwright/chromium,
390×844 @2x. Not blocking.
Glance: both required copy combinations ("1 gem short / 1 minute", "39
gems short / 29 minutes") wrap to exactly 2 lines inside the unchanged
`max-w-[280px]` box, singular grammar correct at both boundaries, screen
rhythm (button position) identical to the unchanged `canAfford` branch.
MINOR: measured contrast (WCAG relative luminance, sampled pixels, not
guessed) at the same screen position old vs. new copy — old ≈4.66:1/
4.99:1, new (39-gems scenario) ≈4.64:1/4.13:1 — both near the 4.5:1 AA
floor already (this text-over-`DuskScene`-illustration treatment was
already marginal), but the new copy's second line measured a real, if
small, dip below AA in this one sample. Not caused by this diff's logic
(CSS/opacity token unchanged; different string simply samples different
pixels of a non-flat background) — worth a follow-up measurement pass on
`text-paper/60` over `DuskScene` generally, not blocking this fix.
Flagged, not fixed (explicitly out of this item's scope, filed
separately): the disabled `primary`-variant button is still only
`opacity: 0.4` on an otherwise-unchanged gold pill — "at a glance, before
reading, a warm 40%-opacity gold pill still reads as 'a button,' just a
slightly duller one." The new copy closes the *explanation* gap (a
learner who reads understands why it won't respond) but not the *visual
affordance* gap (before reading, it doesn't obviously look disabled).
Matches the item's own original note; DESIGN CRITIC correctly declined to
recommend changing `Button`'s shared disabled styling inline, since that
touches every disabled button in the app and needs its own review — filed
as URD-036.
Verdict vs. previous behaviour: clear improvement, no regression across
all four screenshotted scenarios; the unaffordable branch (the common
case for a fresh profile) now states a real number instead of a
one-size-fits-all sentence a learner in this situation could never act on.

## PASSED · URD-006 · 2026-08-12T07:40Z
$ npx vitest run src/lib/gamification.test.ts
  22/22 pass.

$ npx tsc --noEmit
  clean.

$ npm run check:all
  check:all — all 25 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, per THE CRITIC's own finding: reverted
`minutesUntilNextHeart`'s return to a hardcoded `0`, confirmed the fixed
test now catches it (2 of 22 tests fail: the corrected "fresh profile"
assertion and the pre-existing "counts down" property test both flag it,
where before the fix neither would have), restored and re-confirmed
22/22.

New queue items: URD-036 (Button's disabled state doesn't look disabled
at a glance, from DESIGN CRITIC, deliberately not fixed here since it's
shared across the whole app), URD-037 (check:path asserts no lower bound
on mounted rows, so a real render failure could read as "0 ≤ bound" —
found incidentally as a flake under check:all's full sequence, not
reproduced standalone, unrelated to this item's own files).

branch: claude/gauntlet-lockout-screen

## CLAIMED · URD-007 · 2026-08-12T12:22Z
Top unclaimed item below URD-A02. ذ ز ض ظ (zaal/ze/zwaad/zoe) are four
different letters all pronounced "z" — `letterPick` ("which letter makes
this sound?") drew distractors uniformly from all 38 letters with no
awareness of sound, so offering two of the four (or two of any other
same-sound group) makes a question with two right answers, answerable
only by luck.
verify: npm run check:answerable
branch: claude/gauntlet-similar-letters, cut from claude/gauntlet-lockout-screen
after URD-006 shipped.

## CRITIQUE · URD-007 · 2026-08-12T12:45Z
Dispatched THE CRITIC (mandatory) and CURRICULUM CRITIC (this changes how a
homophone letter group is taught/tested, not just engineering correctness).
Not DESIGN CRITIC (no screen changed — only `letterPick`'s distractor pool
and a check script). Not PLAYER — `check:answerable` already drives every
generated exercise across both tracks × 6 passes (107,610 exercises), which
is more exhaustive for this specific property than a soak run would be;
noted here rather than silently skipped, per ROLES.md.

### THE CRITIC
Verdict: PASS. No BLOCKING, no MAJOR.
Independently re-derived the fix rather than trusting it: read
`distractLetters`/`bareSound` (as they stood at review time) by hand against
all 40 letters (32 distinct bare sounds then), confirmed the exclusion was
genuinely pairwise (distractor-vs-distractor, not just vs-target), and
reproduced *both* induced-failure states the lead claimed — the naive
target-only exclusion (142 failures) and an intermediate single-pass,
target-sound-only variant that still let two unrelated distractors collide
with each other (reproduced the exact gap: "alif (\"a / aa\") among ze,
zaal, alif, zhe" — two distractors colliding, not the target).
MINOR (all fixed same round): (1) two stray untracked scratch scripts
(`_tmp_sample.js`, `_tmp_sample2.js`) left in the shared checkout by THE
CRITIC's own probing — exactly the accident URD-A01's ledger entry already
warned about, deleted; (2) `bareSound` was duplicated (not shared) between
`generator.ts` and `check-answerable.js`, risking silent drift between the
two definitions of "sounds the same" — fixed by exporting it from
`generator.ts` and having `check-answerable.js` import it the same way it
already imports `buildLessonExercises`, rather than keeping a hand-synced
copy; (3) no dedicated unit test for the new pure logic, against this
project's own stated test-philosophy split — fixed by adding
`src/exercises/generator.test.ts`.

### CURRICULUM CRITIC
Verdict: passes this item's own definition of done. One MAJOR (fixed same
round, see below) and one MAJOR left open as a new queue item.
Found, empirically, that the lead's own doc comment overclaimed: a first
version of the sound-equality check normalized each letter to one string
("z", "h", …), so it matched "z" against "z" but missed that alif ("a /
aa") and alif-madda ("aa") are different *strings* sharing a *reading* —
sampled 2,902 of 3,000 real `letterPick` generations offering both
together, disproving the comment's claim that the fix was generic enough to
catch "a new homophone letter" automatically. FIXED same round: rewrote
`bareSound` into `soundTokens`/`soundsOverlap` (splits a multi-reading
`sound` field like "a / aa" on "/" and checks for token overlap rather than
string equality), re-verified empirically — 0/5,100 sampled `letterPick`
exercises across 20 passes now show any sound collision, 0 alif/alif-madda
pairs — and re-ran the full induced-failure cycle against the corrected
version (see PASSED below).
Also found, not fixed here (explicitly out of this item's "not generated"
branch, filed as URD-038): none of the four ذ ز ض ظ letters' `note` fields
in `letters.ts` teach a rule for *which* letter a word actually uses — they
only name the collision ("another of the four ways Urdu spells 'z'"). The
gap is real but muted today because `TypeWordExercise` matches Roman input
(`skeleton()` in `src/lib/roman.ts`), so a learner who types "zaroorat"
never has to choose the correct z-letter — but 204 of 2,281 words (8.9%)
contain one of these four, and anyone writing Nastaliq directly, or drawing
a `wordBuild` tray whose random decoy happens to be a same-sound rival, has
no taught rule to fall back on.
Confirmed not a regression, not filed: 64.0% of the four letters'
`letterPick` questions offer no phonetically-adjacent distractor at all
(sampled 184,000 generations) — true before this diff too, since
`distractLetters` draws uniformly from the whole alphabet with no
similarity-weighting beyond the same-sound exclusion this item adds; not
scoped to this item.
Confirmed not a regression, not filed (cosmetic, pre-existing): `te`'s
`name` is `'te'` and `Te`'s is `'Te'`, differing only by case, unlike the
other two retroflex pairs which get a real diacritic in the name
(daal/Ḍaal, re/Ṛe) — `LetterPickExercise`'s secondary label cue is weaker
for this one pair.
Confirmed no interaction with URD-020/021/022 (isolated-glyph share,
context-word coverage, visual-confusability weighting) — none of those
mechanisms were touched by this diff.

## PASSED · URD-007 · 2026-08-12T12:47Z
$ npm run check:answerable
  107,610 exercises generated across 2 tracks × 6 passes.
  "every generated exercise is answerable from what it puts on screen"

$ npx vitest run src/exercises/generator.test.ts
  10/10 pass.

$ npx tsc --noEmit
  clean.

$ npm run lint
  clean.

$ npm run check:all
  check:all — all 25 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, twice: (1) reverted `distractLetters` to a naive
target-only exclusion — `check:answerable` failed immediately (142
occurrences), restored and reconfirmed clean. (2) after the
CURRICULUM-CRITIC-driven rewrite to `soundTokens`/`soundsOverlap`, reverted
`distractLetters` again to a naive `filter(id !== target)` — both
`check:answerable` (195 occurrences, specifically reproducing
"alif-madda (\"aa\"): alif vs alif-madda") and the new unit test
("never offers a distractor that sounds like the target, or like another
distractor") failed together; restored and reconfirmed both clean. Also
independently sampled 5,100 real `letterPick` exercises across 20 passes
outside the check script: 0 sound collisions, 0 alif/alif-madda pairs.

New queue item: URD-038 (none of ذ ز ض ظ's `note` fields teach a rule for
which letter a word actually uses — the "not generated" branch this item
took avoids the unanswerable-question bug but leaves the underlying
spelling ambiguity untaught for anyone writing Nastaliq directly, MAJOR
from CURRICULUM CRITIC).

branch: claude/gauntlet-similar-letters

## CLAIMED · URD-008 · 2026-08-12T13:11Z
Top unclaimed item below URD-A02. `ml-`/`mr-`/`pl-`/`pr-` and inline
`marginLeft`/`paddingRight`/`borderLeftWidth` etc. in components that can
render Urdu pin spacing to a screen side rather than a position in reading
order — pinned to a side happens to render identically today (nothing in
the app ever sets an RTL container direction), but stays that way only
because nobody has tried, not by construction.
verify: npm run check:all
branch: claude/gauntlet-logical-direction, cut from
claude/gauntlet-similar-letters after URD-007 shipped.

## CRITIQUE · URD-008 · 2026-08-18T22:53Z
Dispatched THE CRITIC (mandatory) and DESIGN CRITIC (this touches rendered
UI in 9 files, even though the change is reasoned to be a visual no-op —
ROLES.md: "anything that changes a screen needs the design critic"). Not
CURRICULUM CRITIC (no lesson content or pedagogy touched). Not PLAYER — the
change has no behavioral/interaction surface a soak run would exercise
differently than `check:stability` already does (same tap-through machinery,
same screens), and `check:sizes`/`check:scenery` already render every
touched screen across 8 sizes with real contrast measurement.

### THE CRITIC
Verdict: PASS. No BLOCKING. One MAJOR (fixed same round).
Independently reproduced the lead's induced-failure claim (reverted
`Card.tsx:32`, confirmed `check:direction` fails at the right line,
restored). Traced all 22 conversions by hand across all 9 touched files —
every Left→Start / Right→End rename correct, no swapped conditional values,
confirmed a live count of 22 matching the claim. Specifically traced
`DialogueExercise.tsx`'s `borderTopStartRadius`/`borderTopEndRadius` (the
one change where a mechanical substitution could plausibly have been
backwards) against `isA`'s `items-start`/`items-end` alignment a few lines
above — correct, no flip. Ran `check:all` independently: all 26 steps pass.
Confirmed `LeaderboardScreen.tsx` (included despite rendering no Urdu
script itself) and both "deliberately out of scope" exclusions (position
offsets, `textAlign`) are honestly reasoned, not cop-outs — agreed with the
lead's calls on both, explicitly not filing either as a finding.

MAJOR (fixed same round): `check-direction.js`'s `STYLE_PHYSICAL` regex
only matched `name\s*:` — missing object-shorthand syntax (`{ marginLeft }`,
no colon at all), a live idiom already used in this exact codebase for a
different prop (`{ color }` in `src/components/Stats.tsx:25`,
`src/screens/LessonComplete.tsx:22`). Reproduced live: added
`{ marginLeft }` shorthand to `Card.tsx` using that precedent's own shape,
`check:direction` reported clean — a real physical property silently
missed, directly contradicting this item's own DoD ("fails on any physical
property reintroduced there"). Also flagged, same gap: a quoted key
(`{ 'marginLeft': 4 }`) and a computed key built from a quoted string.
Fixed by rewriting `STYLE_PHYSICAL` into three alternatives — explicit
`name:`, quoted `'name':`, and bare shorthand `name` bounded by `,`/`}` —
covering all three shapes without double-matching (verified: the regex
alternation resolves to exactly one branch per match, confirmed by
`matchAll` producing no duplicates on the existing 22-occurrence tree).
Re-verified via induced failure: reproduced THE CRITIC's exact shorthand
repro (caught), plus a quoted-key variant (caught), both restored and
`check:direction` reconfirmed clean on the real tree afterward. Full
`check:all` re-run clean (26/26) after the fix.

### DESIGN CRITIC
Two dispatches, both terminated mid-review by the same account-level error
("You've hit your monthly spend limit") — an infrastructure interruption,
not a finding about the work. Not retried a third time against a
known-exhausted resource. Recorded here rather than silently treated as a
pass, per this project's own rule against reporting a check green (or, here,
skipped) without saying so plainly.

In its place, the lead ran a direct supplementary check rather than closing
this out on THE CRITIC's verdict alone: built the app for web, drove it with
Playwright/chromium exactly as `check:stability` does (`enterAsGuest` +
real taps, no mocking), and screenshotted the two highest-risk sites both
critics would have prioritized — the accent-stripe pattern, where a typo'd
`borderStartColor` without its paired width, or a wrong side, would be
immediately visible:
  - `LetterLabScreen.tsx`'s note card (`border-s-2` + `borderStartColor:
    palette.jade`, converted from `border-l-2`/`borderLeftColor`): reached
    via Home → "LETTER LAB" → alif. Screenshot shows a solid jade-green
    stripe on the card's left edge (start = left, this app is always LTR),
    same visual treatment as before the property rename.
  - `LeaderboardScreen.tsx`'s per-row promote/demote accent
    (`borderStartWidth`/`borderStartColor`, converted from
    `borderLeftWidth`/`borderLeftColor`): reached via Profile → League.
    Screenshot shows every row's colored zone stripe on the left edge,
    rendering identically to the pre-conversion property.
Both confirm the "visually a complete no-op" claim for the two sites most
likely to show a real regression if the rename had gone wrong anywhere.
Not a substitute for a full DESIGN CRITIC pass — `GrammarExercises.tsx`,
`DialogueExercise.tsx`'s bubble-corner mapping, `LoginScreen.tsx`'s
conditional note card, and the plain-spacing sites (`HomeScreen.tsx`,
`PracticeScreen.tsx`, `SettingsScreen.tsx`, `SentenceReading.tsx`) were not
independently screenshotted here — those rest on THE CRITIC's by-hand trace
of the source (confirmed correct, including the one bubble-corner site
specifically) plus `check:sizes`/`check:stability`/`check:scenery` all
passing clean against the real built app across every touched screen.

## PASSED · URD-008 · 2026-08-18T23:05Z
$ node scripts/check-direction.js
  no physical margin/padding/border-left/right property in
  src/components, src/screens or src/exercises.

$ npx tsc --noEmit
  clean.

$ npm run lint
  clean.

$ npm run format:check
  clean.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build (was 25;
  check:direction is now wired in, right after check:theme).
  Run alone on a still tree, after the final edit.

Induced failure, three times: (1) reverted `Card.tsx`'s
`borderStartWidth`/`borderStartColor` to physical — `check:direction` failed
at the right line, restored, reconfirmed clean. (2) After THE CRITIC's
regex fix, reproduced the exact object-shorthand gap it found
(`{ marginLeft }` added to `Card.tsx`) — caught, restored, reconfirmed
clean. (3) Reproduced a quoted-key variant (`{ 'marginLeft': 4 }`) — caught,
restored, reconfirmed clean.

New queue items: none. THE CRITIC's one MAJOR was fixed same round;
DESIGN CRITIC's incompletion is an infrastructure gap, not a finding, and
is recorded above rather than filed as follow-up work.

branch: claude/gauntlet-logical-direction

## CLAIMED · URD-009 · 2026-08-18T23:31Z
Top unclaimed item below URD-A02. `DAILY_GOALS`' minute labels ("20 min a
day") were hand-set once at 12.54 XP/min; the course has moved twice since
(3.95 XP/min after URD-A02 attempt 1, 4.77 XP/min measured just now) and
nothing connects the label to the real pace.
verify: npm test -- src/lib/achievements.test.ts
branch: claude/gauntlet-daily-goal-rate, cut from
claude/gauntlet-logical-direction after URD-008 shipped.

## CRITIQUE · URD-009 · 2026-08-18T23:50Z
Dispatched THE CRITIC only (mandatory). Not DESIGN CRITIC — no screen code
changed; the only rendered difference is digits inside an already-existing,
unchanged-layout string, and `check:sizes` already renders both display
screens clean. Not CURRICULUM CRITIC — no lesson content, word order or
exercise design touched, this is a pacing-label accuracy fix. Not PLAYER —
a soak run exercises interaction/completion, not a static label's
arithmetic. THE CRITIC agreed with all three calls after confirming, via
`git status`, that only `src/data/achievements.ts` and the two new
`src/lib/achievements.*` files changed.

### THE CRITIC
Verdict: PASS. No BLOCKING, no MAJOR. Three MINOR.
Independently recomputed `courseXpPerMinute()` from scratch (own standalone
probe): 4.768197335095254 XP/min, matching the reported 4.77; reran three
fresh processes to confirm the memoised value is stable and not leaking
`Math.random()` noise from the generator's content-selection logic into
exercise *counts*. Reproduced the induced-failure test independently
(reverted `calm`'s tier to the stale 3-minute label, confirmed the "within
a minute" assertion fails at 1.19 min over, restored, reconfirmed green).
Traced the numerator-exclusion question by hand: `useProgressStore.ts`
credits `todayXp`/`totalXp` for every lesson kind including reading/dialogue,
so `courseXpPerMinute()`'s exclusion of those kinds is local to its own
rate *denominator* only, not a leak into real progress tracking — and
computed the rate *with* them included (5.28 XP/min) to show why excluding
them is the more honest choice: 17 reading lessons model to only 153 total
seconds under the 9-sec/exercise assumption, wildly underestimating real
reading time. Ran `check:all` independently to completion: 26/26.

MINOR 1 (verification-claim correction, no code change): the dispatch
description claimed `OnboardingScreen.tsx` reads `DAILY_GOALS` at two
render sites; THE CRITIC found only one does (`step === 'daily'`, ~line
702) — the other site the claim pointed at (~line 440) maps a different,
unrelated `GOALS` array (the motivation picker: "Speak with family" /
"Read & write it" / etc.). No functional bug — THE CRITIC confirmed no
stray duplicate of the stale numbers exists anywhere — but the claim
itself was wrong and is corrected here rather than left standing: the real
count is two render sites total across the app (`SettingsScreen.tsx:400`,
`OnboardingScreen.tsx`'s daily-goal step), not three.

MINOR 2 (comment fixed same round): `achievements.ts`'s header claimed the
hand-set-plus-test design "matches `levelTitle`'s own precedent for this
exact shape of problem" — THE CRITIC pointed out `levelTitle` gates on
`level`, itself from a fixed internal formula that cannot drift with course
content, a materially different risk profile than a rate that has already
moved twice in this project's own history. Also noted
`docs/ENGINEERING_STANDARDS.md` principle 6 ("make the invalid
unrepresentable") argues for live computation over "hand-set + a test that
catches it after the fact," and that this repo has an unmentioned codegen
precedent (`scripts/generate-glyph-masks.js` etc.) for this shape of
problem — while still judging this MINOR rather than MAJOR, since `npm
test` genuinely gates `deploy-preview.yml` and a drift is loud, not silent.
Fixed by rewriting the comment to state the real tradeoff honestly (a
softer, not identical, guarantee to `levelTitle`'s) rather than overclaim
an equivalent precedent.

MINOR 3 (paperwork — resolved by this same closing round): the ledger and
queue had not yet been closed out at review time (only CLAIMED existed) —
expected mid-review, not a defect; this CRITIQUE/PASSED pair and the
QUEUE.md/done/ update close it.

## PASSED · URD-009 · 2026-08-18T23:55Z
$ npx vitest run src/lib/achievements.test.ts
  4/4 pass.

$ npx tsc --noEmit
  clean.

$ npm run lint / npm run format:check
  clean.

$ npm test
  97/97 pass across 8 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, twice (once by the lead, reproduced independently by THE
CRITIC): reverted `DAILY_GOALS`'s stale `minutes`/`desc` values (3/7/12/20),
confirmed the "within a minute" test assertion fails (calm's real ~4.19 min
vs the reverted 3, a 1.19 min gap), restored, reconfirmed 4/4 pass both
times.

New queue items: none. THE CRITIC's three MINORs were fixed or corrected
same round (a wrong verification claim corrected in this entry, an
overclaimed precedent rewritten in `achievements.ts`'s own comment, the
paperwork gap closed by this entry itself).

branch: claude/gauntlet-daily-goal-rate

## CLAIMED · URD-011 · 2026-08-19T00:12Z
Top unclaimed item below URD-A02. `buildLessonExercises` runs 5,070+ times
per `check:shape` run (measured just now: 5,839 requests) because several
independent call sites each regenerate the same (lesson, refs, track)
tuple; unmemoised. Separately, `coverTopics`' vocabulary-lesson `size`
budget (`3n + 4`) has never matched what the generator actually emits
(`3n + 1`) — `CLOSING_EXERCISES = 4` counted the closing matching board as
four exercises when it is one array entry holding four word-pairs.
verify: npm run check:shape
branch: claude/gauntlet-shape-perf, cut from claude/gauntlet-daily-goal-rate
after URD-009 shipped.

## CRITIQUE · URD-011 · 2026-08-19T00:29Z
Dispatched THE CRITIC only (mandatory). Not DESIGN CRITIC — no screen or UI
code touched. Not CURRICULUM CRITIC — no taught content, word order, or
exercise design changed; the real generator output for every vocabulary
lesson is bit-for-bit identical before and after, only a previously-wrong
bookkeeping field is corrected to match what was already true. Not
PLAYER — a soak run would see literally identical exercise sequences,
confirmed by a 233/233 real-vs-recorded match across every vocabulary
lesson. THE CRITIC agreed with all three calls after independently
confirming the diff's whole blast radius is two files with no other reader
of the changed values anywhere in the app.

### THE CRITIC
Verdict: PASS. No BLOCKING, no MAJOR. One MINOR.
Independently reproduced every claim from scratch rather than trusting the
report: confirmed the cache key (`` `${lesson.id}:${track}:${refs...}` ``)
is collision-free by grepping every real id in the corpus for `:`/`,`;
called `buildLessonExercises` directly for a real lesson on both tracks and
confirmed the cache holds genuinely distinct entries (same length, 9
positions differing in kind) rather than accidentally collapsing tracks
together; confirmed no other call site in the file relies on drawing
independent random samples of the same tuple (the redundancy the item
targets IS the whole duplication, not a deliberate statistical-coverage
pattern like `check-answerable.js`'s `PASSES=6`); independently grepped
every `.size` occurrence in `src/` and `scripts/` and traced each one,
confirming nothing reads a real vocabulary lesson's `size` at runtime
(`generator.ts`'s trim exemption explicitly excludes `'vocab'`; `dueBudget`
returns a flat 4 for any non-review kind; `check-srs.js` hardcodes its own
vocab assertion size rather than reading the field). Reran `check:shape`
independently: byte-identical output. Reran the 233-lesson arithmetic
verification independently: 233/233 exact matches. Instrumented the cache
itself and reran: confirmed 5,839→999, matching exactly. Ran `check:all`
to completion independently (in two passes — flagged as an open caveat in
its first report, then closed out in a follow-up once its own background
run finished): 26/26 pass.

MINOR (fixed same round): `CLOSING_EXERCISES = 1` assumes the closing
matching board always renders — `generator.ts` only pushes it when four
distinct-cue, distinct-gloss words can be found, topping up from the wider
topic pool. True for all 233 real lessons today (smallest topic has 11
words) but not structurally guaranteed; a future topic too small or
homogeneous to fill the board would make the constant wrong by one again —
the same shape of bug this item exists to fix, just smaller. Zero runtime
impact either way (confirmed above), so not gating — fixed by extending the
constant's own comment to state the assumption plainly rather than leaving
it implicit, so the next person touching topic sizing sees the risk at the
site rather than rediscovering it.

## PASSED · URD-011 · 2026-08-19T00:31Z
$ npm run check:shape
  same 2 pre-existing, unrelated problems as before this change (4 short
  lessons, 2 units outside the 4-12 band — both already-known URD-A02
  remainder rows, not touched here); byte-identical summary stats
  (3.9 min · 9.8 new words · 26.2 exercises emitted). Confirmed via
  `git stash`/`git stash pop` A/B comparison: this item's own requirement
  ("check:shape still exiting the same way") holds exactly, not just
  approximately.

  Real generation calls: 5,839 total requests → 999 unique generations
  (measured directly, instrumented cache counters) — the shape of
  reduction this item names, on today's larger course (the item's own
  5,070→~700 figures were measured on an earlier, smaller version of the
  path).

  Vocabulary lesson `size` accuracy: 233 of 233 real vocabulary lessons'
  recorded `size` now exactly equals what the generator actually emits
  (was 0 of 233, off by exactly 3 on every one, before the fix).

$ npx tsc --noEmit / npm run lint / npm run format:check
  clean.

$ npm test
  97/97 pass across 8 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure: reverted `CLOSING_EXERCISES` to `4`, reran the 233-lesson
verification — 0/233 exact matches, all off by exactly 3, restored,
reconfirmed 233/233. Memoisation's own correctness verified by A/B
comparison (stash/pop) rather than induced failure, since there is no
pass/fail assertion to break — the property under test is "identical
output, fewer calls," and both halves were measured directly.

New queue items: none.

branch: claude/gauntlet-shape-perf

## CLAIMED · URD-014 · 2026-08-19T00:54Z
Top unclaimed item below URD-A02. A profile persisted at v0/v1 has
`completedLessons`/`skippedLessons` emptied by the migration to content-
derived lesson ids, because a positional id genuinely cannot say which
lesson it meant once the path has been rebuilt. That is correct — but it
also deletes the only evidence `needsPathMoveNotice` (URD-003) reads, so
the learner who lost the most is told the least: their now-empty
`completed`/`skipped` maps make `needsPathMoveNotice` correctly, and
silently, find nothing to report.
verify: npm test -- src/lib/progress.test.ts
branch: claude/gauntlet-migration-notice, cut from claude/gauntlet-shape-perf
after URD-011 shipped.

## CRITIQUE · URD-014 · 2026-08-19T20:59Z
Dispatched THE CRITIC (mandatory) and DESIGN CRITIC (a new screen notice
was added to Home). Not CURRICULUM CRITIC (no lesson content or pedagogy
touched). Not PLAYER (no interaction/completion surface changes a soak
run would exercise differently — this is a one-time migration notice, not
a lesson mechanic).

### THE CRITIC (round 1)
Verdict: BLOCKING. One BLOCKING, one MAJOR, two MINOR.

BLOCKING: `HomeScreen.tsx`'s mount-time auto-scroll effect (scrolls to the
current lesson) only guarded on `pathNotice`, not the new
`ticksWipedByMigration`. Reproduced live: the new notice rendered
correctly at first paint, then was auto-scrolled off-screen within ~1.5s —
for exactly the population it exists to reach, since a wiped profile
always starts at the very first lesson, and the header plus the ~330px
notice card together reliably clear the scroll-trigger threshold. "The
learner who lost the most, told the least" reopened by an unrelated
feature this diff never checked against.

MAJOR: the new notice and the pre-existing "Lessons were regrouped"
path-moved notice could stack — reachable sequence traced and reasoned
through: wipe happens, learner leaves the new notice up, does a few
lessons, the path (already reshaped three times per `progress.ts`'s own
header) regroups again before they dismiss — both `ticksWipedByMigration`
and `needsPathMoveNotice(...)` become true at once, nothing coordinates
the two dismiss-once alert cards.

MINOR (fixed same round): title/body said "finished lessons," but
`hadTicks` correctly also counts a skip-only wipe (onboarding-skipped
lessons, never attempted) — a heritage learner with only lost skips saw a
notice overclaiming something "finished."

MINOR: an untracked scratch file was reported left behind, contradicting
a "deleted" claim — investigated, did not reproduce (file did not exist
in the shared checkout; the round-2 pass confirmed this independently via
`git status --untracked-files=all --ignored=matching`, all clean) —
likely THE CRITIC's own leftover scratch artifact, misattributed.

Fixed same round: (1) added `store.ticksWipedByMigration` to the
auto-scroll guard and its dependency array. (2) Split `pathNotice`
(gated, used for render) from `rawPathNotice` (the raw
`needsPathMoveNotice` result) — `pathNotice = !ticksWipedByMigration &&
rawPathNotice` so the two notices queue strictly one at a time. Caught a
second bug in this fix's own first draft, via live testing rather than
code review: the `notePathSize` auto-record effect originally read the
gated `pathNotice`, which silently recorded a stale `pathSize` as "seen"
the moment the wipe notice merely appeared — permanently erasing the
path-moved notice's own evidence before the learner was ever shown it,
the identical class of silent loss this whole item exists to close, one
layer up. Fixed by pointing that effect at `rawPathNotice` instead. (3)
Retitled the notice "Your lesson progress wasn't carried over" (was
"Your finished lessons weren't carried over") and reworded the body to
"your lesson history" rather than "which lessons you'd finished."

Verified via disposable Playwright scripts (not committed, matching this
project's established no-permanent-scratch-tooling practice): the notice
survives past 2.5s with no auto-scroll; a dual-trigger seed (wipe +
stale pathSize) renders only one card; dismissing it correctly reveals
the second notice on its own next render, with `pathSize` proven
undisturbed by the wipe-notice dismissal.

### THE CRITIC (round 2, re-review of the fixes)
Verdict: PASS. No BLOCKING, no MAJOR. One soft MINOR.
Independently reproduced every claim from round 1's fix rather than
trusting the summary: rebuilt fresh, reproduced the exact BLOCKING
scenario (notice stays in-viewport past 3.2s this time); traced the
`rawPathNotice`/`notePathSize` counter-scenario by hand and confirmed the
claimed bug class would occur if reverted; specifically hunted for a
third bug (a race between the auto-scroll effect and `notePathSize` via
`didAutoScroll.current`) by seeding a profile that clears the scroll
threshold while the wipe notice is up, and confirmed `scrollTop` stays 0
until dismissal, then fires once, correctly, afterward; reproduced the
dual-trigger no-stacking-then-sequenced-reveal scenario independently;
confirmed the never-wiped path is provably unaffected
(`pathNotice === rawPathNotice` by construction when
`ticksWipedByMigration` is false, plus the pre-existing, unchanged
`needsPathMoveNotice` test suite still green); ran the full pipeline
independently, all 26 `check:all` steps read from real output, not a
summary; confirmed the untracked-file claim (none exist).

MINOR (fixed same round): "your lesson checkmarks were reset" still
mildly overclaims for a skip-only wipe — skipped lessons never rendered a
checkmark (`LessonNode` shows a dashed circle + a skip badge for
`state === 'skipped'`, not the same glyph as `done`). Softer than the
first round's finding (title already accurate, "checkmarks" plausibly
reads as a colloquial stand-in) and explicitly judged not blocking, but
fixed anyway since it was one word: "your lesson checkmarks" → "your
lesson progress," matching the title's own already-accurate phrasing.

### DESIGN CRITIC
Not blocking (never blocks, per ROLES.md). One MINOR, one MAJOR-flagged-
but-unverified-by-DESIGN-CRITIC-itself (the same stacking issue THE
CRITIC independently found and blocked on, and which is now fixed and
empirically re-verified above — recorded here rather than opened as a
second finding, since it is the identical root cause).
Measured directly rather than eyeballed: body-text contrast 7.45:1
(WCAG relative luminance on live computed styles), heading contrast
11.99:1 — both clear AA and AAA, matching or exceeding the sibling
"Lessons were regrouped" notice's own measured contrast (URD-003
ledger). Tap target 100×51px, comfortably over the 44×44/48×48 floors.
Dismiss reflow clean, no lingering gap. MINOR: at 320×568 (the tightest
phone this project tests) the card is 353px/568px, 62% of the viewport —
slightly more than the sibling notice's own previously-accepted 52%
footprint, covered by the same precedent DESIGN CRITIC already overruled
for that sibling ("on the one launch this appears, the notice *is* the
screen's subject") — not re-litigated here, noted as a boundary this
precedent should not be stretched further without review.

## PASSED · URD-014 · 2026-08-19T21:05Z
$ npx vitest run src/lib/progress.test.ts
  17/17 pass (10 pre-existing + 7 new).

$ npx tsc --noEmit / npm run lint / npm run format:check / npm run check:writing
  clean.

$ npm test
  104/104 pass across 8 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, on the core migration logic: reverted `migrateProgress`
to the pre-fix shape (no `ticksWipedByMigration` at all) — 4 of 17 tests
failed, including the item's own literal acceptance test ("a v1 profile
with completions is told something"), restored, reconfirmed 17/17. Both
BLOCKING and MAJOR findings from THE CRITIC's first round were verified
as real via live reproduction (not just code reading) before being fixed,
and the fixes were independently re-verified via a second, harsher THE
CRITIC pass before this was recorded.

New queue items: none.

branch: claude/gauntlet-migration-notice

## CLAIMED · URD-015 · 2026-08-19T21:10Z
Top unclaimed item below URD-A02. Dismissing either HomeScreen notice card
removes ~275px of content in the same instant as the tap that dismissed
it, so a finger still settling from that tap can land on whatever
snapped into its place — measured by the DESIGN CRITIC on URD-003 at
+120ms and +1s. Give the card an exit, or hold the layout until the
touch is over; extend `check:stability` (already owns "the screen
doesn't move under an answered question") rather than write a new
check.
verify: npm run check:stability
branch: claude/gauntlet-notice-exit, cut from claude/gauntlet-migration-notice
after URD-014 shipped.

## CRITIQUE · URD-015 · 2026-08-19T23:40Z
Dispatched THE CRITIC (mandatory) and DESIGN CRITIC (the fix changes what
a learner sees and how it moves on a real screen). Not CURRICULUM CRITIC
(no lesson content or pedagogy touched). Not PLAYER (a narrow, already
adversarially-tested interaction-timing fix, not a broad content/play-
through surface `npm run soak` would add anything to).

### Before either critic ran
Building `checkNoticeExit` itself surfaced two false passes in the check,
found by deliberately reverting the real fix and watching the check not
notice (this project's own non-negotiable #2):

1. First draft detected the tappable control at the release point via
   `[role="button"]`. This app's `Button` never sets an explicit
   `accessibilityRole`, so react-native-web renders it as a bare `<div
   tabindex="0">` — confirmed by dumping the live DOM at the exact point.
   `[role="button"]` matched nothing, ever, so the check passed
   regardless of what was actually on screen. Fixed: detect via
   `closest('[tabindex]')` instead.
2. Second draft's seed for the ticks-wiped scenario left `pathNoticeSeen`
   at its default `false`, which also satisfies the sibling path-moved
   notice's own condition. Dismissing the ticks-wiped card — correctly,
   by URD-014's own stacking design — revealed that second, real notice
   queued right behind it, and its "Got it" button happened to land close
   enough to the just-dismissed one that the check mistook the new card
   for the old one still fading: another false pass. Found by dumping the
   post-click page and seeing the *other* notice's title where "nothing
   tappable" was expected. Fixed: seed `pathNoticeSeen: true` for that
   scenario so only the one notice under test can possibly show.

With both fixed, reverting `Reveal.tsx`/`HomeScreen.tsx` to the pre-fix
shape made `check:stability` fail with a correct, specific message for
*both* notices ("a different control snapped in under the finger before
the dismissed card finished leaving"), and restoring the fix made it
pass clean — the induced-failure bar this project holds every check to.

### THE CRITIC
Verdict: BLOCKING. One BLOCKING, one MAJOR.

BLOCKING: `Reveal.tsx`'s reduced-motion exit path is not resilient to a
second re-render during the 300ms exit window, and permanently strands a
dismissed notice on screen — reintroducing the exact "two notices visible
on Home at once" shape of bug URD-014 exists to prevent, just via a new
mechanism. Root cause: the exit effect's dependency array included
`onExited` (a fresh arrow function on every `HomeScreen` render — the
callers never memoise it) and `reduced`. Any unrelated re-render during
the exit window reran the effect; React tears down the previous run's
cleanup first, cancelling the pending reduced-motion `setTimeout` — and
the `wasVisible` guard, whose job is to stop an exit from *restarting*,
also stops it from ever being *rescheduled*, since it had already
flipped to `false` when the timer first started. Two real, reachable
triggers: (1) a rapid double-tap on the same "Got it" button — literally
the "finger still moving" case this item exists for, just relocated from
a mis-tapped target to a dropped callback, since `dismissTicksWipedNotice`/
`dismissPathNotice` call `set()` unconditionally and `HomeScreen` reads
the whole store with no selector; (2) the URD-014 stacking hand-off
itself — dismissing the first notice while a second is genuinely queued
fires `setShowPathNotice(true)` on the very next render, handing the
still-fading first card a fresh `onExited`. Empirically confirmed, not
just reasoned: standalone repros against the real built app showed a
single tap clearing correctly within 1s, a double tap (60ms apart)
leaving the card on screen past 4s, and the stacking scenario leaving
both cards on screen past 5s — all under `reducedMotion: true`, which is
what every one of this file's own seeded profiles already used; a
control run of the same stacking scenario with `reducedMotion: false`
(the real app default) cleared correctly, isolating the bug to the
reduced-motion branch specifically. Reachable by anyone using the app's
own Reduce Motion accessibility setting.

MAJOR: `check:stability`'s new checks exercised only the reduced-motion
branch (every seed hardcodes `reducedMotion: true`) and never attempted a
second tap or the stacking sequence — the one branch where the bug lived,
via the one interaction that triggers it, and the check still missed it,
because it only ever asked "is anything wrong to tap right now," never
"does the card ever actually leave."

Fixed: `Reveal.tsx`'s exit effect now reads `onExited` and `reduced`
through a ref kept current by a separate, dependency-free effect, so its
own dependency array is just `[visible, exit]` — only a genuine
`visible` transition can start or cancel an exit; an unrelated parent
re-render for any other reason can't touch it. Added
`checkNoticeSurvivesDoubleTap` to `check-stability.js`: taps the dismiss
button twice in quick succession and asserts the card is actually gone
1.5s later, for both notices. Verified via the same induced-failure
discipline as above: reverted `Reveal.tsx` to the pre-fix dependency
array, rebuilt, and the new check failed for both notices with "a
double-tap on 'Got it' left the card on screen well past its exit
window"; restored the fix, rebuilt, and it passed. The stacking trigger
specifically (not covered by an automated check, since the double-tap
check already exercises the identical root-cause mechanism — an
unrelated re-render mid-exit — more cheaply and deterministically) was
re-verified by hand against the restored fix: single tap on the
ticks-wiped card, 1.5s wait, and the path-moved notice it hands off to
appears cleanly with exactly one "Got it" on screen, no stuck or
duplicate control.

### DESIGN CRITIC
Not blocking (never blocks, per ROLES.md). No blocking findings, two
MINOR/informational.

Measured directly against the live built app at 412×900, with an
in-page HUD burning true elapsed-ms and live `getComputedStyle` opacity
into every screenshot (screenshot I/O itself was skewing nominal
`waitForTimeout` intervals by 100-150ms). Card boxes: path-notice
372×281px, ticks-wiped 372×257px — ~297px/~273px of held space, matching
the item's own "~275px" claim. Gap to the next card measured two ways
(a baseline profile that never shows a notice; 700ms after a real
dismissal) both landed at 16px, identical — no leftover empty space, no
double margin. Tap targets: "Got it" is a 100×51px hit box (not the
58×17px text glyph), due-review card 372×105px, continue-lesson card
372×94px, all clear of the 44×44/48×48 floors with no overlap.

MINOR: the exit's 300ms ease-in opacity-only fade is a different motion
shape than the app's 380ms ease-out-with-rise entrance — a deliberate,
justified asymmetry (can't translate away without either overflow or the
exact jump this item exists to prevent) but the two no longer share a
signature. MINOR: opacity trace shows roughly a 30-40ms window mid-fade
(opacity ≈0.4-0.6) where the text's effective contrast against the card's
own darkening self-composite dips just under the 4.5:1 AA floor (down to
~4.22:1 at opacity 0.5) before the text is itself already close to
invisible — an inherent property of any pure-opacity fade over a dark
ground, not something specific to this implementation, and the learner
who triggered the dismissal is not still reading it by then. 300ms
judged a reasonable exit duration against the app's own motion
vocabulary (380ms entrance, 350ms progress-bar fill) — shorter than the
entrance, which is conventional for exits, and comfortably inside a real
gesture's press-to-release time.

## PASSED · URD-015 · 2026-08-19T23:45Z
$ npm run check:stability
  checked 28 answered questions and notice dismissals across path and
  practice lessons, both tracks (24 base + 2 exit-safety + 2 double-tap).
  the question and its options stay put when answered.

$ npx tsc --noEmit / npm run lint / npm run format:check
  clean.

$ npm test
  104/104 pass across 8 files (no new unit-testable pure logic — this
  item is UI/interaction timing, covered by the extended check above).

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, twice over: (1) reverted `Reveal.tsx`/`HomeScreen.tsx`
to their pre-URD-015 shape entirely — both new `checkNoticeExit` checks
failed with the exact real-world regression message ("a different
control snapped in under the finger"), restored, reconfirmed clean.
(2) After THE CRITIC's BLOCKING finding was fixed, reverted only
`Reveal.tsx`'s exit-effect dependency array to the pre-fix shape (the
rest of the URD-015 diff intact) — the new `checkNoticeSurvivesDoubleTap`
check failed for both notices ("left the card on screen well past its
exit window"), restored, reconfirmed clean. THE CRITIC's BLOCKING and
MAJOR findings were both fixed and independently re-verified via live
reproduction against the real built app, not just code reading.

New queue items: none — both critic findings were fixed inline this
round rather than filed forward.

branch: claude/gauntlet-notice-exit

## CLAIMED · URD-016 · 2026-08-20T12:22Z
Top unclaimed item below URD-A02. `fallbackReviewRefs` in generator.ts
draws uniformly from every word and letter taught up to the review, with
no weighting toward the unit it closes. Measured on real generated
output with nothing due: rev-gender-and-number (u6) draws 0-5% of its
words from u6; rev-the-wider-world (u39) draws 3-5% from u39. Scope the
fallback to the closing unit first, falling back to the wider course
only when the unit cannot fill it — rev-your-first-readings closes a
unit with zero vocabulary lessons and needs the fallback for all of it.
verify: npm test -- src/lib/review.test.ts
branch: claude/gauntlet-review-scope, cut from claude/gauntlet-notice-exit
after URD-015 shipped.

## CRITIQUE · URD-016 · 2026-08-20T13:10Z
Dispatched THE CRITIC (mandatory) and CURRICULUM CRITIC (this rescopes
what a review lesson actually teaches — squarely a curriculum question).
Not DESIGN CRITIC (no screen or rendering touched — this is pure
content-generation logic). Not PLAYER (a narrow, already
adversarially-tested generation-logic fix, not a broad
content/play-through surface `npm run soak` would add anything to).

### Implementation
New `src/lib/review.ts`: `taughtInUnit(lessonId)` (words/letters taught
by lessons in the SAME unit as a lesson, via `UNITS`, not the whole
course), `prioritizedPool(tiers, seedBase)` (concatenates pools in
priority order, deduping, shuffling *within* each tier independently —
the actual fix, since shuffling a concatenation together lets a huge
low-priority tier dilute a tiny high-priority one by chance), and
`reviewWordPool`/`reviewLetterPool` (the full tiered logic).
`generator.ts`'s `fallbackReviewRefs` now calls these instead of
building one flat course-wide pool. Measured directly on real generated
output before either critic ran: rev-gender-and-number and
rev-the-wider-world now draw 100% of their words from their own unit
(up from the reported 0% and ~5%); rev-your-first-readings (zero
vocabulary lessons) correctly still falls through to course-wide, 0%,
exactly as the item's own note describes.

Before either critic ran, building `reviewWordPool`/`reviewLetterPool`
itself surfaced a real regression in the fix's own first draft, found by
running the full check suite (not just the new test) and seeing
`check-srs.js` fail: treating "known within the unit" and "taught
course-wide, ungraded" as two tiers in the same priority list meant that
once the unit's own known words ran out, the pool quietly widened to
*any* taught material — reintroducing the exact thing
"a review with nothing due never asks about a word outside what the
learner has been graded on" exists to catch. Fixed: whether `known`
restricts the pool at all is an all-or-nothing decision — if the learner
has graded anything reachable from this review, the whole pool stays
restricted to graded ids, unit-known ones ordered first; only when
nothing anywhere is graded yet does it widen to the full taught pool.
Verified via induced failure: reverted just that restriction to the
broken shape, confirmed both `check-srs.js` and the new `review.test.ts`
fail with the exact leaked-word list, restored, reconfirmed clean.

### THE CRITIC
Verdict: BLOCKING. One BLOCKING, one MAJOR.

BLOCKING: the "is anything known" decision above was still per-type —
`reviewWordPool` looked only at `known ∩ courseWideWords`,
`reviewLetterPool` only at `known ∩ courseWideLetters`. `known` is a
single flat set of every id graded regardless of type
(`Object.keys(srs)`, `LessonScreen.tsx`), and a learner graded on many
words but zero letters is not synthetic: studying the Roman track (which
drops letter lessons from the path entirely) for a stretch, then
switching to Script or Both, reaches exactly this state on the very next
review. Deciding the letter side alone found `known ∩ courseWideLetters`
empty and widened to *every letter ever taught* — reproduced live
against the real built generator: 12 of 16 exercises were letters the
learner had never once been shown. Fixed: both pools now key off whether
*anything*, of either type, has been graded (`anythingKnown`, checking
both course-wide arrays), so a learner known on words alone gets a
correctly empty, never-taught-material letter pool — topped up from more
words by the generator's own existing shortfall logic — rather than a
flooded one. Added two regression tests exercising both directions
(words-only known must not unlock every letter; letters-only known must
not unlock every word). Verified via induced failure: reverted to the
per-type decision, confirmed both the new tests and the real
`rev-food-and-nature` reproduction fail exactly as THE CRITIC described,
restored, reconfirmed clean.

MAJOR (filed forward, not fixed inline — see below): `prioritizedPool`'s
per-tier shuffle seed is keyed on `lessonId` alone, so once a learner has
graded every word in a small, fully-known unit, the fallback always
slices off the identical subset of that unit's words, forever, and the
rest never surfaces via this path. Real numbers:
rev-gender-and-number offers the same 4 of its 20 words on every single
replay; rev-the-wider-world can only ever reach 19 of its 117. Not a
regression from this diff — `seededShuffle`'s fixed-not-random content
selection is this project's own deliberate, pre-existing convention (see
`lib/shuffle.ts`'s docstring) — but shrinking the pool from a course-wide
list of thousands down to one unit's dozen-to-hundred words is exactly
what this item does, and it is what turns a shuffle quirk that barely
mattered against the old pool into a first-order coverage gap against
the new one. → new URD-039 (renumbered from a duplicate draft; see
CURRICULUM CRITIC below, same finding, independently).

Also verified correct, not just claimed: `taughtInUnit` checked against
5 additional real review ids beyond the 3 in the test file, all
resolving to the correct unit with no crash for an unplaced id; the
overlap/ghost-id scenarios (a known id in both unit and course-wide
tiers; a known id absent from every real pool) neither leak nor
spuriously trigger restriction; full check suite (review.test.ts 16/16
at the time, check:srs 19/19, check:answerable, check:order,
check:coverage, full `npx vitest run` 120/120) all clean; the two
explicitly-out-of-scope notes (review *sizing* left untouched; the
rigid letter/word cadence MINOR) independently agreed to be legitimately
out of scope, not silently dropped.

### CURRICULUM CRITIC
Not blocking (never blocks, per ROLES.md). Two MAJOR, confirming the
fix does what it claims for words specifically while surfacing that the
*whole lesson* a learner experiences is a different, larger story.

Measured across all 39 reviews, track 'both' (the default), nothing
due: word-side scoping holds exactly as claimed — 100% in-unit for
every unit that teaches any vocabulary, 0% (correct fallback) for the
one that doesn't. But *overall* in-unit share (words and letters
together, what a learner actually experiences) averages only 53.5% and
is ≤50% for 30 of 39 reviews — traced to `fallbackReviewRefs`'s
pre-existing, unconditional 50/50 letter/word split colliding with the
fact every letter lesson sits in units 1-9: every review from u10
onward has zero letters of its own, so the letter half permanently
falls back to pre-alphabet material regardless of how well-supplied the
unit's own vocabulary is (u39 teaches 117 words and still can't push
past 48.7% overall). Confirmed by the same 39 reviews scoring 96.0%
in-unit on the Roman track, which never reserves letter slots at all —
isolating the cause to the split, not to this fix's own scoping logic.
This is the exact problem URD-017 (already queued, "A review's letter
share should decay once the alphabet is behind it") describes, found
independently and from a sharper angle here — folded into URD-017's own
notes rather than filed as a duplicate.

Second MAJOR: the same deterministic per-lesson seed THE CRITIC flagged
above, found independently — measured as permanently excluding 45-84%
of a mastered unit's own vocabulary depending on unit size (11/52, 21%,
for rev-hooks-and-throats; 19/117, 16%, for rev-the-wider-world). → new
URD-039 (see above).

Also: due-vs-fallback division of labor confirmed sound (due items are
untouched by this change and are placed first; the fallback only widens
past the unit for the rare "nothing anywhere graded, unit supplies
nothing" case). Landing scoping now while leaving review *size*
untouched judged acceptable — sizing already meets `BENCHMARKS.md`'s
3-8 minute band regardless. Rigid letter/word cadence restated as
MINOR, unchanged by this diff. Bonus finding, filed as new URD-040:
review never touches the grammar concepts or sentences that give a
unit its name (`rev-saying-who-you-are` never touches `g-pronouns` or
`g-to-be`) — pre-existing (grammar/sentences have never fed SRS/review),
not a regression, worth its own item.

## PASSED · URD-016 · 2026-08-20T13:15Z
$ npx vitest run src/lib/review.test.ts
  18/18 pass.

$ npm run check:srs
  19/19 pass, including "a review with nothing due never asks about a
  word outside what the learner has been graded on."

$ npx tsc --noEmit / npm run lint / npm run format:check / npm run check:writing
  clean.

$ npm run check:answerable / npm run check:order / npm run check:coverage
  clean — every generated exercise answerable, every position-ordering
  and coverage invariant holds with the new review pool wiring.

$ npm test
  122/122 pass across 9 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, three times over: (1) reverted the whole unit-scoping
approach in `generator.ts` — real generated output for
rev-gender-and-number and rev-the-wider-world reproduced the item's own
reported 0% and ~5.3% in-unit share exactly, restored, reconfirmed
100%/100%/0% (the last correctly the no-vocabulary unit). (2) reverted
just the known-restriction to the "two tiers in one list" shape THE
CRITIC's first-round-equivalent bug — both `check-srs.js` and
`review.test.ts` failed with a concrete leaked-word list, restored,
reconfirmed clean. (3) reverted just the cross-type joint-known check
(THE CRITIC's BLOCKING finding) to per-type — the two new regression
tests and the real `rev-food-and-nature` reproduction (12 of 16
exercises were never-taught letters) failed exactly as reported,
restored, reconfirmed clean. Both THE CRITIC's BLOCKING finding and both
critics' MAJOR findings were addressed: the BLOCKING fixed inline and
re-verified; the MAJORs filed forward as URD-039 (folded into existing
URD-017) and URD-040, with reasoning recorded rather than silently
dropped.

New queue items: URD-039 (renumbered — the letter-share-decay MAJOR was
a duplicate of already-queued URD-017 and was folded into its notes
instead), URD-040 (review never touches its own unit's grammar/sentence
content).

branch: claude/gauntlet-review-scope

## CLAIMED · URD-017 · 2026-08-20T13:22Z
Top unclaimed item, chained off claude/gauntlet-review-scope after
URD-016 shipped. `fallbackReviewRefs` splits every review's fallback
`Math.ceil(n/2)` letters / `Math.floor(n/2)` words, unconditionally,
independent of how many units separate the review from the alphabet.
Measured u10 through u39 (script track): 367 letter exercises against
360 word exercises, 50.5% letters — a review 30 units after the
alphabet finished still spends half its questions re-tracing glyphs.
The letter share should fall as the course moves further from the
alphabet units, reaching near zero by the units this measurement
covers.
verify: npm test -- src/lib/review.test.ts
branch: claude/gauntlet-review-letter-decay, cut from
claude/gauntlet-review-scope after URD-016 shipped.

## CRITIQUE · URD-017 · 2026-08-20T13:45Z
Dispatched THE CRITIC (mandatory) and CURRICULUM CRITIC (this is
squarely a curriculum-pacing question — how many of a review's
questions should be about the alphabet — the same pairing used for
URD-016). Not DESIGN CRITIC (no screen or rendering touched). Not
PLAYER (a narrow generation-logic fix, not a play-through surface
`npm run soak` would add anything to).

Implementation before critique: added `reviewLetterShare(courseWideWords,
courseWideLetters)` to `lib/review.ts` — the letter share is exactly the
letters' share of everything the course has taught by that point, so it
decays toward zero on its own as word-teaching continues long after the
last letter lesson (no unit past u9 teaches a letter at all — confirmed
`grep "L([0-9]" src/data/units.ts`). Moved `taughtUpTo` out of
`generator.ts` (private) into `lib/review.ts` (exported), alongside
`taughtInUnit` it now sits next to architecturally, updating both of
generator.ts's call sites. Re-measured on real generated output: u10
through u39 now sums to 34 letter exercises against 693 words (4.7%,
down from the item's own reported 50.5%), and the share falls
monotonically course-wide from 18.2% at u1 (rev-first-faces) to 2.6% at
u39 (rev-the-wider-world).

THE CRITIC found MAJOR: `taughtUpTo('practice-review')` — the synthetic
Daily Review screen, not placed anywhere on the path — never satisfies
its own `break` and so returns the *entire* course (2,281 words, 46
letters), pinning that screen's letter share at its end-of-course value
(≈2%) from the very first time it is ever opened, regardless of whether
the learner is on day one or has finished the course. Reproduced live: a
learner who had just finished the first letters lesson and first vocab
lesson still got 0 of 10 letter exercises on Daily Review — identical to
one who had finished the whole course; before this diff the same call
used the old fixed split and reliably gave 5 of 10. Fixed inline: for a
lesson id `taughtInUnit` cannot place on the path, the letter share is
computed from `known` (what this learner has actually been graded on)
restricted to the reachable pool, instead of the raw course-wide totals
— the same "where is this learner, really" question `anythingKnown`
already asks for pool selection. Nothing graded yet at all (day one)
leaves both restricted arrays empty, which `reviewLetterShare` already
treats as its 0.5 case, matching the pre-fix split for exactly the
population it protected. Also MINOR (noted, not fixed — see below): the
sole letter exercise lands in the same relative position every time
letterCount is 1.

CURRICULUM CRITIC confirmed the decay's math is sound and directionally
right (independently re-derived the same 18.2%→1.98% numbers), but found
two MAJORs (curriculum severity, does not block) in what fills the
now-mostly-empty letter side: (1) with only one letter slot from ~u14 on,
`letterExerciseAt(l, i, i)` is always called with `i=0` (the letter
always lands first in the interleaved mix), and `turn=0` always resolves
to `letterTrace` when a glyph mask exists — measured, u14 through u39
(26 straight reviews) draw `letterTrace` and *only* `letterTrace`;
`letterForm`, the app's own core joining-position drill, never appears
in that entire stretch. (2) with each review's one letter drawn from an
independent per-lesson shuffle of the full 46-letter pool, only 21 of 40
letters (52.5%) are ever touched across all of u10-u39, including
`be`/`pe` from the very first letters lesson never appearing again. Both
are structural consequences of shrinking the typical letter count to
~1 — a direct effect of this fix, correctly not something its own
"decay toward near zero" acceptance bar could have avoided — and both
require real design work (how a lone letter's exercise kind is chosen;
how letter selection tracks coverage across reviews) rather than a cheap
inline change, so filed forward rather than fixed here: URD-041 (kind
and position always the same, folding THE CRITIC's MINOR and the
curriculum critic's MAJOR together, same root cause from two angles),
URD-042 (half the alphabet untouched, back two-thirds of the course).
Also flagged (MINOR, fixed inline): `Math.round` alone stays >= 1 only
because every real review is large enough today (`coverTopics` floors
review size at 22) — a coincidence of current content sizes, not a
guarantee; at the lowest measured share a review as small as 22 already
rounds to 0. Floored `letterCount` at 1 whenever the context has any
letters to ask about at all. Two observations, no action needed: pacing
(total exercises per review) is untouched by this change, only the
ratio; and the freed slots go entirely to more unit-scoped vocabulary,
which the curriculum critic ties to already-queued URD-040 (review never
touches grammar/sentences) and URD-039 (fallback pool never rotates) as
reasoning for sequencing, not a defect of this item.

## PASSED · URD-017 · 2026-08-20T13:44Z
$ npx vitest run src/lib/review.test.ts src/exercises/generator.test.ts
  21/21 and 15/15 pass, including the item's own acceptance test (letter
  share at rev-first-faces > rev-the-wider-world, and < 5% by u39) and
  new regression tests for both critique fixes (Daily Review's letter
  share reflects `known` rather than the whole course; every real review
  asks about at least one letter, including at a size real content
  doesn't currently produce).

$ npm run check:srs
  19/19 pass, unaffected — review letter/word ratio is orthogonal to
  due-queue behaviour.

$ npx tsc --noEmit
  clean.

$ npm test
  130/130 pass across 9 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, three times over: (1) reverted `reviewLetterShare` to
the old fixed `0.5` — the three new `reviewLetterShare` tests in
`review.test.ts` failed exactly as expected (0.5 not > 0.5; 0.5 not
< 0.05; 0.5 not close to 0.25). (2) reverted the practice-review known-
restriction fix to the raw course-wide arrays — both new Daily-Review
regression tests failed with exactly 0 letters, reproducing THE CRITIC's
finding precisely. (3) reverted the `Math.max(1, ...)` floor — the new
size-22 floor test failed with exactly 0 letters, reproducing the
curriculum critic's predicted case precisely. All three restored and
reconfirmed clean.

New queue items: URD-041 (a review's one letter slot always lands on
the same position and kind), URD-042 (half the alphabet gets no review
exposure across the back two-thirds of the course).

branch: claude/gauntlet-review-letter-decay

## CLAIMED · URD-018 · 2026-08-20T14:00Z
Top unclaimed item, chained off claude/gauntlet-review-letter-decay
after URD-017 shipped. Across all 39 review lessons on both tracks
(1,856 exercises measured), `meaningPick` — the only exercise that
shows Urdu and asks what it means — appears 16 times, 0.86%, only as
the produce fallback for words that are neither typeable nor
buildable. Every other review exercise is English-or-audio-in,
Urdu-out. Review is the lesson explicitly meant to consolidate what has
been read, and it never asks the learner to read something and say
what it means.
verify: npm test -- src/lib/review.test.ts
branch: claude/gauntlet-review-meaning-direction, cut from
claude/gauntlet-review-letter-decay after URD-017 shipped.

## CRITIQUE · URD-018 · 2026-08-20T15:00Z
Dispatched THE CRITIC (mandatory) and CURRICULUM CRITIC (this is a
curriculum-pacing/exercise-direction question — how much of review
should ask for meaning rather than form — the same pairing used for
URD-016/URD-017). Not DESIGN CRITIC (no screen changed, only which
existing exercise kinds a review's turn ladder reaches). Not PLAYER (a
narrow generation-logic fix, not a play-through surface `npm run soak`
would add anything to).

Implementation before critique: the fix's own logic actually lives
where the item's `files:` says (`src/exercises/generator.ts`), not in
`lib/review.ts` — the item's `verify:` command names `review.test.ts`
by analogy with URD-016/017, but the turn-ladder logic this item
targets was never moved there. Ran the named command anyway (passes,
unaffected) and put the real acceptance tests in `generator.test.ts`,
next to the code they test — noted here rather than silently
substituted. First draft: added a flat fourth turn to the existing
3-way ladder (`turn = i % 4`), using `wordExercise(w, pool, track,
'meet', 1)` — the same call the sentence and grammar climbs already
use for "show the word, ask its meaning" — for the new turn. Measured:
`meaningPick` share rose from 0.86% to ~23% across all 39 reviews.

THE CRITIC found BLOCKING, twice over. (1) `meaningPick`'s own
distractor call omitted `distinctCue`, the guard `pictureOptions` two
lines above it already requests — so a verdict-cue word (yes/no/
correct/wrong/good/bad/approved/rejected) could be offered as a
*wrong* option, and `MeaningPickExercise` renders every option's own
✅/❌ regardless of correctness. Measured: 689 of 19,170 sampled
instances (~3.6%) leaked a verdict icon onto a wrong option, across 45
of 117 lesson×track combinations, including the very first and very
last review in the course. Pre-existing gap in `wordExercise` itself
(harmless in `wordFromMeaning`, which renders no icon), but this fix
took `meaningPick` from a fraction of a percent of review content to
routine, turning a near-unreachable latent bug into a common one.
Fixed: added `distinctCue: true` to that branch's `distractorsFor`
call. (2) the new turn was computed as `i % 4` from the shared
due/fallback index, and `fallbackReviewRefs`'s interleave alternates
letter/word 1:1 whenever both are present — a step of 2 through a
mod-4 space only ever visits 2 of the 4 residues (this file already
knows this exact hazard elsewhere, for `POSITIONS.length`, but the new
review ladder wasn't checked against it). Reproduced live: a
constructed due queue of 10 letters and 6 words, interleaved, locked
every word into alternating between only `listenTap` and `typeWord`,
never once reaching `wordFromMeaning` or `meaningPick` — a complete
reversion to pre-fix behaviour that the lead's own tests (which only
ever passed an empty due queue) could not see. Fixed: a dedicated
counter incrementing once per word, independent of `i` and of how
letters are interleaved around them, replacing the shared-index turn
computation. THE CRITIC also found MAJOR (addressed as part of the
redesign below, not filed separately): before this fix the longest run
of identical exercise kinds anywhere in review was 1 (measured by
rebuilding the pre-fix ladder against identical content); the flat
fourth-turn design let 21 of 117 lesson/track pairs reach a run of 2,
and one — rev-the-wider-world/roman — reach a run of 3, sitting
exactly at (not over) `check:shape`'s own MAX_RUN.

CURRICULUM CRITIC found MAJOR (design-level, addressed by a redesign
rather than a patch): the flat fourth turn funded `meaningPick` by
cutting recall *and* produce equally by a quarter each — the two
demands this same file's own comment, two lines above the turn logic,
calls "the harder demands [that] belong" in review — nearly doubling
review's overall share of first-teaching-tier ("meet") demand from
~34.5% to ~52%. Recommended (and the lead adopted): split the
*existing* middle third between `listenTap` and `meaningPick` instead
of adding a new quarter, so recall and produce keep exactly the shares
they had before this item, and the read direction gets a real,
non-trivial share without diluting review's demand level. Also raised,
addressed as an observation rather than a change: on the `both` track
(default) `Lexeme` shows the Roman transliteration alongside the Urdu
prompt — checked directly (`Lexeme.tsx`, `WordChoiceExercises.tsx`):
this is the `both` track's own pre-existing, global, by-design
behaviour for every exercise that shows Urdu (not something this fix
introduced or could fix in scope), and for ordinary vocabulary the
Roman caption reveals pronunciation, not meaning — the specific case
where it *would* reveal meaning (a loanword whose transliteration is
the English word) is already routed away from `meaningPick` by the
pre-existing `romanRevealsMeaning` guard. Recorded here as a
curriculum-critic finding correctly not requiring a code change, not
silently dropped.

Redesign (addressing both critics together): the turn ladder is now
`wordTurn % 6` on a counter dedicated to words (fixing THE CRITIC's
BLOCKING #2 at its root — no shared-index/interleave-step coupling to
break), splitting into recall (2/6), produce (2/6, unchanged shares
from before this item), and the former single "listen" third now split
into `listenTap` (1/6) and `meaningPick` (1/6) — directly addressing
CURRICULUM CRITIC's finding. Re-measured: recall 34.7%, produce 31.0%,
listenTap 18.1%, meaningPick 16.2% (close to the theoretical even
1/6 split; real content shapes account for the rest) — recall+produce
at 65.7%, within a point of the old 66.7%. Longest run anywhere in
review dropped from the flat-fourth-turn design's 3 back down to 2
(residual 2-runs, 12 of them, come from pre-existing independent
fallback guards — the VERDICT_CUES override, the Roman track's
produce-fallback — occasionally landing beside the new deterministic
read turn; not eliminated, comfortably under MAX_RUN=3, and a MINOR
worth a note rather than a block).

## PASSED · URD-018 · 2026-08-20T15:18Z
$ npx vitest run src/lib/review.test.ts src/exercises/generator.test.ts
  21/21 and 21/21 pass — the item's own named verify command
  (unaffected, since this item's logic lives in generator.ts) plus the
  real acceptance and regression tests: every review lesson on every
  track asks at least one meaning-direction question; a review of
  typeable words does too; meaningPick's real share (>10%, measured at
  15.5%); no meaningPick option carries an undeserved verdict icon
  (THE CRITIC regression); a due queue with letters and words
  interleaved 1:1 still reaches meaningPick (THE CRITIC regression);
  no real review generates a run of 3+ identical kinds (CURRICULUM
  CRITIC regression).

$ npm run check:srs
  19/19 pass, unaffected.

$ npx tsc --noEmit
  clean.

$ npm run check:answerable
  107,610 exercises generated across 2 tracks × 6 passes — every
  generated exercise is answerable from what it puts on screen;
  answer position 0:24.7% 1:24.9% 2:25.0% 3:25.4% (even would be 25%).

$ npm run check:coverage
  all 2,281 words taught by exactly one of 233 vocabulary lessons,
  unaffected.

$ npm test
  136/136 pass across 9 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  (First run caught a real prettier formatting issue in the new test
  file — fixed with `prettier --write`, reconfirmed clean on rerun.)

Induced failure, four times over: (1) reverted the `distinctCue: true`
fix on `meaningPick`'s distractor call — the new verdict-icon
regression test failed, reproducing THE CRITIC's exact finding (a
"truth"/w-sach distractor glowing ✅ on a wrong option). (2) reverted
the per-word counter back to the shared, interleave-coupled index — the
due-queue regression test failed exactly as THE CRITIC described
(3 kinds reachable, but `meaningPick` specifically absent); this also
caught that the test's first draft (`wordKinds.size > 2`) was too weak
to notice the specific missing kind and needed strengthening to assert
`meaningPick`'s presence directly, which was done before re-confirming.
(3) reverted to the flat four-turn design — the new no-long-run test
failed at the exact lesson/track/position (rev-the-wider-world/roman
@36) THE CRITIC's measurement named. All three restored and
reconfirmed clean; the fourth induced failure (the original flat
4-turn design vs. THE CRITIC's due-queue reproduction) was how BLOCKING
#2 was originally found and is folded into (2) above.

No new queue items — every finding from both critics was fixed inline
in this same redesign rather than filed forward.

branch: claude/gauntlet-review-meaning-direction

## CLAIMED · URD-019 · 2026-08-20T23:35Z
Top unclaimed item, chained off claude/gauntlet-review-meaning-direction
after URD-018 shipped. `shouldUpdateSrs` caps SRS advancement to the
first sighting of an item per lesson visit, which fixed a real bug (six
correct sightings walking a letter's interval to 98 days) but chose the
wrong sighting to trust: a learner who answers wrong, then right five
times running in the same sitting, leaves with identical SRS state to
one who answered wrong six times, because the first grade is the one
that sticks.
verify: npm test -- src/lib/sessionGrading.test.ts
branch: claude/gauntlet-session-grading-last-sighting, cut from
claude/gauntlet-review-meaning-direction after URD-018 shipped.

## CRITIQUE · URD-019 · 2026-08-21T00:00Z
Dispatched THE CRITIC (mandatory) and CURRICULUM CRITIC (this item was
itself found by a curriculum critic reviewing URD-013 — squarely a
pedagogy-scheduling question, which sighting's evidence a teaching
lesson should trust). Not DESIGN CRITIC (no visual/rendering change —
same screen, same UI, only internal grading timing). Not PLAYER (a
narrow scheduler-correctness fix with a direct pure-logic test and a
real-app `check:stability` pass already covering the touched screen;
not a broad play-through surface).

Implementation before critique: `sessionGrading.ts` rewritten from a
gate-and-skip boolean (`shouldUpdateSrs`) to overwrite-and-defer
(`recordSighting` always overwrites an item's pending grade;
`flushSessionGrades` applies each item's grade exactly once).
`LessonScreen.tsx`'s `onGraded` now records every sighting instead of
gating; a `pendingGrades` ref holds the current visit's Map, flushed
via a `useEffect` cleanup keyed on `[exercises, applyGrade]` (fires on
a new lesson visit or unmount, covering the ✕ button, running out of
hearts and leaving, and eventual navigation home) plus an explicit
flush in `advance()`'s completion branch (belt-and-suspenders: `
finishLesson` persists XP/streak/gems synchronously while
`LessonComplete` renders in the same still-mounted screen, so relying
on unmount alone would risk losing SRS grading if the app were closed
from the results screen before pressing "home").

THE CRITIC found no BLOCKING or MAJOR defect in the mechanism itself —
traced React's effect-cleanup-then-setup ordering, the double-flush
safety, every quit route (✕, out-of-hearts, normal completion), the
heart-refill retry-same-exercise flow, and the `string`→`ItemType`
cast, all against the actual code rather than the doc comments' claims,
and confirmed each correct. One MAJOR: no test anywhere exercises the
real `LessonScreen`↔`sessionGrading` wiring end-to-end — every existing
test either drives `sessionGrading.ts` in isolation from React or
drives `srs.ts` in isolation from `sessionGrading.ts`; the actual bug
this item fixes lived in the ref/effect integration between them, which
has zero coverage. Filed forward as URD-044 rather than fixed inline:
properly closing it means deciding on and wiring up component-level
test infrastructure (no React Testing Library or jsdom/happy-dom
environment exists in this project today — confirmed by reading
`vitest.config.ts`), not adding one more `.test.ts` file.

CURRICULUM CRITIC found the mechanism's premise incomplete: "grade on
the last sighting" is provably correct for vocabulary (100% of 2,281
words' staggered climb ends on the hardest, `produce` demand, both
tracks, measured directly) but not for letters, where the turn
rotation lands the *last* round on an easier recognise-tier kind 67.4%
of the time (31 of 46 sampled) because the letter pipeline rotates
turns rather than climbing meet→recall→produce the way vocabulary
does. More directly actionable: no guard existed anywhere against a
single lucky final guess — every multiple-choice question is a 4-
option, 25%-guess exercise, so a learner wrong on every real attempt
could still be scheduled as "known" off one lucky final tap. Fixed
inline (cheap, and squarely strengthens this item's own stated goal
rather than widening its scope): `finalGradeOf` now requires the last
TWO sightings to agree — both correct (in either order, `good`/`easy`)
or both `again` — before trusting the result; a disagreement resolves
to `again`, cutting the guess-through risk from ~1-in-4 to ~1-in-16.
Majority-vote across all sightings was considered and rejected (per the
curriculum critic's own reasoning, adopted): it discards recency, which
is exactly what makes trusting a recent sighting correct in the first
place — a learner right, right, right, then wrong, wrong at the very
end forgot the item within the session and should not schedule as
mastered. The deeper letter-vs-vocabulary demand-tier mismatch is a
separate, real gap the two-sighting guard mitigates in practice but
does not fully close — filed forward as URD-043 (checked against
URD-020/021/022, the already-queued letter-pipeline content items, for
overlap; none found — this is about turn *diagnosticity*, those are
about content composition).

## PASSED · URD-019 · 2026-08-21T00:15Z
$ npx vitest run src/lib/sessionGrading.test.ts
  11/11 pass — the item's own acceptance criterion (wrong-then-five-
  right differs from all-wrong) plus THE CRITIC's and CURRICULUM
  CRITIC's regression tests (single-sighting trust, two-agree, the
  guess-through case, the forgetting-within-session case, only-last-
  two-matter).

$ npm run check:srs
  19/19 pass, unaffected — SM-2 scheduling itself untouched.

$ npx tsc --noEmit
  clean.

$ npm run check:stability
  28 answered questions and notice dismissals checked across path and
  practice lessons, both tracks, plus Profile/Achievements/League —
  clean; drives the real LessonScreen this item's wiring lives in.

$ npm test
  142/142 pass across 9 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  Run alone on a still tree, after the final edit.

Induced failure, twice over: (1) reverted `recordSighting` to gate-
and-skip (first sighting wins) — the acceptance test and the "tracks
items independently" test both failed exactly as the pre-fix bug
predicts (first grade sticks, not the last). (2) reverted
`finalGradeOf` to trust the bare last sighting with no confirmation
check — exactly one test failed (the guess-through case,
`['again','good'] → 'again'`), correctly isolating that this is the
one scenario the confirmation guard changes versus bare-last-sighting;
every other test passed either way, confirming they weren't
accidentally validating the new behavior by coincidence. Also
separately verified the double-flush (`advance()` + unmount) is safe
via the existing `flushSessionGrades` clear-then-no-op test, and
confirmed (by reading, not assuming) that `gradeItem`'s reference is
stable across renders (a zustand action closed over once in `create()`)
so `applyGrade`'s `useCallback` never produces a stale flush target.
Both restored and reconfirmed clean.

New queue items: URD-043 (a letter's last sighting is usually the easy
kind, not the hard one), URD-044 (nothing exercises the
LessonScreen↔SRS-grading wiring end-to-end).

branch: claude/gauntlet-session-grading-last-sighting

## CLAIMED · URD-020 · 2026-08-21T00:52Z
Top unclaimed item, chained off claude/gauntlet-session-grading-last-
sighting after URD-019 shipped. Across all 9 letter lessons,
`letterTrace`/`letterForm`/`letterPick` account for 276 of 285
exercises (96.8%); the remaining 9 are one shared context-word exercise
per lesson, regardless of how many letters it taught. A learner meeting
a completely new script spends nearly all their first hours on
isolated glyphs and almost none reading them inside real words.
verify: npm run check:shape -- --kind=letters
branch: claude/gauntlet-letters-in-context, cut from
claude/gauntlet-session-grading-last-sighting after URD-019 shipped.

## CRITIQUE · URD-020 · 2026-08-21T01:05Z
Dispatched THE CRITIC (mandatory, twice — once on the first design, once
again after a full redesign in response to its own BLOCKING finding) and
CURRICULUM CRITIC (a curriculum-composition question — how a learner
meets a new script — the same pairing used for URD-016 through URD-019).
Not DESIGN CRITIC (no new UI — every exercise kind used already existed
and renders unchanged). Not PLAYER (a content-generation fix already
covered by `check:answerable`'s real-exercise sweep and `check:shape`'s
scoped verify command).

First implementation: every `Letter` already carries its own curated
example word (`word`/`roman`/`meaning`/`emoji`) that the generator had
never used — reshaped it into a synthetic 40-word corpus
(`LETTER_CONTEXT_WORDS`) and gave every letter its own context-word
sighting, one of its 6, replacing an isolated sighting rather than
adding one. Measured: isolated share fell from 96.8% to 83.3%, context
rose from 3.2% to 16.7%, total exercise count essentially unchanged.

THE CRITIC found this BLOCKING: the synthetic ids existed nowhere in
`voiceManifest.ts`. A `listenTap` review question built from one of
these — reachable once such a word is SRS-graded and comes due —
showed only a "tap to hear" prompt with no fallback text, asking the
learner to identify a word from audio that did not exist. Reproduced
live via a constructed due-queue scenario. No existing check could see
it: `check-voice.js`'s speakable list never knew the new pool existed,
`check-answerable.js` never builds a due queue at all, `check-shape.js`
builds its due queues only from real lesson word/letter ids.

Rebuilt entirely rather than patched: `LETTER_CONTEXT_WORD` now matches
each letter's own glyph (`forms.isolated`) as a literal substring
against the real `WORDS` corpus — every entry therefore a real,
already-voice-covered vocabulary word, nothing invented. Preferring the
lowest CEFR level, and distinct within a teaching group wherever a
distinct match exists (a first pass of this let two different letters
in one lesson land the identical word — پانی contains both alif and
pe — halving the intended variety; fixed by tracking per-group used
ids). Also added a guard against a word that puts the taught letter
immediately before `do-chashmi-he` (an aspirating digraph, gh/bh/kh) —
CURRICULUM CRITIC found `gaaf`'s naive best match, گھر ("ghar"), did
exactly this, demonstrating a different sound than gaaf's own.

CURRICULUM CRITIC also found MAJOR: `contextRound`'s original formula
put the first letter's context sighting at round 0 whenever a lesson
wasn't a later sibling — true for 8 of the 9 real lessons, including
the first lesson in the entire course — making a whole unfamiliar word
the learner's literal first exercise, before the taught letter had
been isolated-introduced even once. Fixed: `contextRound` now always
maps into rounds 1 through 5, never round 0, guaranteeing every
letter's first sighting is always the isolated introduction. Verified
directly on all 9 real lessons: every one now opens on an isolated
kind. Also found `baRi-ye`'s pre-existing curated example word (میز,
"table") does not contain baRi-ye's own glyph at all — a data bug
predating this item, newly reachable (LetterLabScreen already showed
it; a generator search over `Letter.word` would have promoted it into
a graded exercise). Fixed in `letters.ts`, twice: the first replacement
(چائے, "tea") turned out to already be `hamza`'s own curated word —
caught by `npm run audit`'s example-word-collision rule, not by any
review round — replaced again with جوتے ("shoes"), which contains
neither collision.

A second THE CRITIC pass, after the redesign, confirmed the BLOCKING
finding fully closed (every one of the ~40 `LETTER_CONTEXT_WORD`
entries checked exhaustively against `getWord` and the voice manifest,
not sampled) and found no new BLOCKING. It found three MINOR gaps,
addressed: (1) nothing locked in that two letters in one lesson never
share an identical assigned word — added a direct regression test;
(2) a doc comment overclaimed two letters "never" share a context
round — corrected to state the real, harmless pigeonhole exception for
groups over 5 letters; (3) `check-shape.js`'s per-letter rule would
silently skip a hypothetical letter with zero real matches — noted as
already independently caught by the vitest suite's count-based test,
not hardened further (redundant, not a live gap). It also re-flagged
the `baRi-ye` data bug as still live — read from the file before the
lead's fix for it had landed in the same window; already resolved by
the time of this ledger entry.

CURRICULUM CRITIC's remaining MAJOR — none of the three possible
exercise kinds (`multipleChoice`/`meaningPick`/`listenTap`) ask the
learner to find or identify the taught letter's shape *within* the
word; a learner answers by picture/meaning matching without ever
parsing the letter in context — was not fixed inline: it is exactly
the item's own second, bigger design option ("a dedicated 'spot the
letter' exercise kind"), correctly out of scope for a fix confined to
`generator.ts`. Filed forward as new URD-045.

URD-020's fix also fully resolves already-queued URD-021 ("a letter
group's context word should touch more than its first letter") — every
letter now gets its own, matched against its real glyph rather than a
transliteration substring — confirmed by CURRICULUM CRITIC and by this
item's own tests. Closed as resolved rather than left stale.

## PASSED · URD-020 · 2026-08-21T01:15Z
$ npx vitest run src/exercises/generator.test.ts
  27/27 pass — per-letter exact context-sighting count (not just an
  aggregate total), never opens a lesson on a context word, every
  context word is a real `WORDS` entry, every context word contains its
  letter's own glyph, no two letters in one lesson share a word.

$ npm run check:shape -- --kind=letters
  exits 0 — both the aggregate in-context-share floor (10%, real output
  16.7%) and the per-letter exact-assignment rule (every taught letter's
  own `LETTER_CONTEXT_WORD` actually appears in its lesson's real
  output, matched by word id, not loose glyph presence).

$ npm run audit
  no problems found — confirms no two letters share an example word,
  the exact rule that caught the baRi-ye/hamza چائے collision.

$ node scripts/check-voice.js
  2720/2720 speakable items covered, unchanged — no new content
  introduced that needs a clip nobody has recorded.

$ node scripts/check-answerable.js
  107,556 exercises generated across 2 tracks × 6 passes, every one
  answerable from what it puts on screen.

$ node scripts/check-coverage.js
  all 2,281 words taught by exactly one lesson, unaffected.

$ npx tsc --noEmit / npm run lint / npm run format:check
  clean.

$ npm test
  148/148 pass across 9 files.

$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.
  (First run caught the real حچائے/hamza example-word collision via
  `npm run audit`, one of check:all's own 26 steps — fixed, rerun
  clean.)

Induced failure, four times over: (1) reverted `contextRound` to allow
round 0 — the "never opens on a context word" test failed on real
lessons exactly as the pre-fix bug predicts. (2) reverted the group-
distinctness guard (`matches[0]` instead of `matches.find(w =>
!used.has(w.id))`) — the new "no two letters share a word" test failed,
l-1 collapsing from 6 distinct words to 4. (3) dropped the whole
context-round mechanism (`contextRound = () => -1`) — the new
`check-shape.js` letter-context-share rule failed exactly as designed,
reporting all 9 lessons under the 10% floor. (4) dropped one specific
letter's assignment directly at the insertion site — the FIRST attempt
at this induced failure produced a false negative (the check-shape.js
per-letter rule I had just written passed regardless), which is what
surfaced the pooled-word false-positive described above; fixed the
rule to match by word id rather than loose glyph presence, then
re-ran the same induced failure and confirmed it now correctly fails.
All four restored and reconfirmed clean.

New queue items: URD-045 (a letter's context sighting never asks the
learner to find the letter in the word — the item's own second,
bigger design option, correctly left out of this fix's scope).
URD-021 resolved as a side effect, moved to done/ rather than left
open.

branch: claude/gauntlet-letters-in-context

## CLAIMED · URD-022 · 2026-08-21T05:38Z
Top unclaimed item, chained off claude/gauntlet-letters-in-context after
URD-020/021 shipped. `l-3` teaches `daal`/`Daal`/`zaal` and
`re`/`Re`/`ze`/`zhe` — dot-pairs distinguished only by a diacritic — with
no ordering or weighting anywhere in the pipeline that references visual
similarity. Drilling visually confusable letters back to back with
identical weight risks teaching the confusion rather than resolving it.
verify: npm run check:shape -- --kind=letters
branch: claude/gauntlet-letter-confusability, cut from
claude/gauntlet-letters-in-context after URD-020/021 shipped.

## CRITIQUE · URD-022 · 2026-08-21T06:02Z
Dispatched THE CRITIC (mandatory) and CURRICULUM CRITIC (a curriculum-
composition question, same pairing used for every letter-pipeline item
this session). Not DESIGN CRITIC (no new UI). Not PLAYER (content-
generation logic already covered by check:answerable's real-exercise
sweep and check:shape's scoped verify command).

First implementation: added `confusableWith?: string` to `Letter`
(letters.ts), populated on 13 letters derived from each letter's own
curated `note` field describing a shared shape with a same-group base
letter ("same bowl as", "X with N dots", "X with the retroflex mark").
`separateConfusables` (generator.ts) buckets a lesson's letters by
`confusableWith ?? id` and places buckets largest-first into positions
taken evens-then-odds — the largest bucket's own members land
`positions.length` apart, never adjacent within a single pass. Applied to
reorder the letters branch's array before its existing round-major loop.
A new check-shape.js rule and two generator.test.ts tests asserted no
same-bucket letters land adjacent, with one documented exception: `l-3`'s
`re` family (4 of 7 letters) forces exactly one wrap adjacency by a cited
circular-arrangement bound, `2*4-7=1`, claimed as the sole occurrence.

CURRICULUM CRITIC found a real gap between that claim and what actually
shipped, by running the real generator output directly rather than
trusting the reasoning: the new check-shape.js rule and both new tests
looped `i < n - 1` where `n` was the lesson's *letter count* (7 for
l-3), not its *exercise count* (42) — so they only ever scanned round 0
and compared one fixed pair for the "wrap," never the other 4 round
transitions. Both passed "clean" while the real generated `l-3` actually
drilled `zhe` immediately before `re` five times — once at every round
transition, since the round-major loop reuses one identical order every
round — not the one instance claimed. Verified directly (not taken on
trust): re-ran the real generator, confirmed 5 occurrences at exercise
indices 6, 13, 20, 27, 34, all `zhe` then `re`. Reasoned through why —
the largest bucket in a group where it equals `ceil(n/2)` is forced to
occupy both endpoints of the one arrangement with zero internal
adjacency, so replaying that identical arrangement every round recreates
the same wrap collision every single transition, not once. This is the
same "check that cannot fail" shape CLAUDE.md's non-negotiable #2 names.

CURRICULUM CRITIC and THE CRITIC also independently converged on real
gaps in `confusableWith` coverage, checked directly against each
candidate's own `note` text: `alif-madda` ("Alif wearing a wavy hat")
and `noon-ghunna` ("A dotless noon at the end of a word") both name
their own same-group base letter the identical way every marked pair
does, and had no `confusableWith` field. CURRICULUM CRITIC additionally
argued for `baRi-ye`→`choti-ye` (shared "baṛī"/"choṭī" naming, and their
`initial` glyphs are literally identical strings) and for `Te`→`te`;
THE CRITIC specifically re-checked `Te` and concluded it does NOT meet
the stated derivation rule — its own note compares its mark's shape to
`to'e` (a different group), not to `te` itself. Followed THE CRITIC on
`Te` (not added — the note doesn't support it under the rule as written)
and CURRICULUM CRITIC on `baRi-ye` (added — the naming-convention and
shared-glyph argument is real even though the note doesn't use the
"X with N dots" phrasing the other 13 use). Did not add the two weaker
MINOR suggestions (a merged jeem/baRi-he/khe family; fe/qaaf) — both
critics themselves rated these low-confidence or textually unsupported.

Fixed: check-shape.js's rule now scans every adjacent pair in the full
generated sequence and asserts an *exact* computed count (bucket size
forcing `max(0, 2*largest-n)` adjacencies per round transition, times
`rounds-1` transitions) rather than a loose presence check — too few
would mean the rule regressed, too many would mean the generator did.
The two buggy tests were replaced with one correct test using the same
formula. `letters.ts` gained 3 more `confusableWith` entries
(`alif-madda`→`alif`, `noon-ghunna`→`noon`, `baRi-ye`→`choti-ye`).
`separateConfusables`'s doc comment was rewritten to state the true,
proven count (5 recurring identical-pair wrap adjacencies for l-3, not
1) with the endpoint-pigeonhole proof, and to honestly compare against
the measured pre-fix baseline (30 — 5 confusable pairs internal to every
one of l-3's 6 rounds under raw `letterIds` order) rather than
overclaiming perfect elimination.

THE CRITIC's other finding (a doc comment said "five other pairs" where
the real count was eight, now eleven after this fix's additions) was
corrected to not name a number that goes stale. Its noted latent risk
(`letterIdOfExercise`'s fallback could misattribute a context word if
two same-group letters were ever assigned an identical one) is real but
not currently live — confirmed no such collision exists in the real
data — and is the same invariant URD-020's own "no two letters share a
context word" test already guards, so left as documented rather than
duplicated.

CURRICULUM CRITIC additionally judged that pure temporal separation
addresses interference-in-the-moment but not the longer-term
discrimination skill the item's own definition of done gestures at
("resolving" the confusion, not just avoiding it) — filed forward as
URD-047, checked against QUEUE.md/done/ for duplicates first (none
found). Also filed forward URD-046 (found while designing the fix
itself): the one forced adjacency always recurs as the identical pair,
`zhe` then `re`, all 5 times, when varying which specific bucket member
collides each round would spread the exposure — not attempted here
because it requires decoupling per-round letter order from the stable
per-letter index `turn`/`position` depend on, risking the exact
kind-repetition and sibling-collision bugs the round-major loop's own
extensive prior history (URD-013) took several rounds to fix.

Verified via induced failure, twice: (1) bypassed `separateConfusables`
entirely (raw `letterIds` order) — the corrected check-shape.js rule and
test both failed, reporting the true magnitude (108 confusable-adjacent
pairs across the whole corpus, not the single instance the pre-fix
buggy versions would have shown) — confirming the fix now catches a
regression at its real size, not just its existence. (2) restored,
reconfirmed both clean. Full corpus measurement after all fixes: every
real letter lesson has zero confusable-adjacent exercises in its
complete generated sequence except `l-3`, which has exactly 5 — the
proven, computed minimum, not a residual bug.

$ npx vitest run src/exercises/generator.test.ts
  28/28 pass (27 pre-existing + 1 corrected, replacing 2 buggy ones).

$ npm run check:shape -- --kind=letters
  exits 0 — no confusable-adjacent pairs beyond the proven minimum.

$ npm run check:shape (unfiltered)
  2 problems, both pre-existing and unrelated (a phrases lesson under 3
  minutes; 2 units outside the 4-12 lesson band) — zero confusable-
  adjacency findings across the full corpus.

$ npx tsc --noEmit / npx eslint / npx prettier --check
  clean.

## PASSED · URD-022 · 2026-08-21T06:10Z
$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build. No
  failures anywhere in the run (checked the full log, not just the
  summary line).

New queue items: URD-046 (spread which specific pair collides at l-3's
one forced wrap, instead of the identical zhe/re pair five times over),
URD-047 (CURRICULUM CRITIC's own suggestion — a discrimination exercise
that poses a confusable pair directly against each other, which
temporal separation alone does not provide). Both checked against
QUEUE.md and done/ for duplicates first — none found.

branch: claude/gauntlet-letter-confusability

## CLAIMED · URD-023 · 2026-08-21T07:15Z
files: src/exercises/generator.ts (+ src/exercises/generator.test.ts)
branch: claude/gauntlet-phrases-typeable-floor

## CRITIQUE · URD-023
THE CRITIC: no BLOCKING. Verified the share-floor guarantee holds at
every lesson size P() (units.ts) accepts, by hand and by script;
confirmed no arithmetic underflow/duplication; confirmed determinism
against seededShuffle's real implementation; independently recomputed
the 8.24% hypergeometric figure. Flagged (non-blocking) that biasing
the draw changes which 6 of 28 phrases the one shipped lesson teaches
(measured: 1 of 6 survives), for curriculum judgment.

CURRICULUM CRITIC: reviewed that flag, no MAJOR/MINOR. No project
convention promises lesson-content stability across a code change for
any lesson kind; check:coverage doesn't cover phrases; every other
lesson kind already reshuffles under a content/algorithm edit the same
way. Considered and declined a "keep old draw when it already clears
the floor" refinement — real but low-value given one real lesson and
no tracked progress-preservation concern.

## PASSED · URD-023 · 2026-08-21T07:40Z
$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build. No
  failures anywhere in the run (checked the full log).

$ npx vitest run src/exercises/generator.test.ts
  31 passed (31) — 3 new URD-023 tests: share floor over 500 synthetic
  draws, ≥2 typeable phrases over 500 synthetic draws, the real shipped
  lesson directly.

$ node -e "... 2000 synthetic phrases lessons at size 6 ..."
  0 draws with fewer than 2 typeable phrases, 0 single-kind shares over
  40%, out of 2000 — measured, not assumed.

Induced failure: reverted to the old single-draw-then-reassign logic,
both new tests failed exactly as predicted (a draw landing 1 typeable
phrase, 50% share) — restored and reconfirmed clean.

No new queue items filed (both critics' observations were judged not
to clear the bar for a new item — see done/URD-023.md).

branch: claude/gauntlet-phrases-typeable-floor

## CLAIMED · URD-025 · 2026-08-21T13:40Z
files: src/exercises/generator.ts (+ src/data/achievements.ts,
  src/exercises/generator.test.ts, gauntlet/QUEUE.md's URD-029 entry)
branch: claude/gauntlet-sentence-build-ratio

## CRITIQUE · URD-025
THE CRITIC: BLOCKING — the item's literal verify command
(check:shape --kind=grammar) still exits 1 on g-plurals (2.7 min, pre-
existing content gap, URD-029). Confirmed pre-existing and worse before
this item (3 lessons short, not 1). Resolved by explicit scope carve-
out (this item's files are generator.ts, not sentence content) — see
done/URD-025.md for full resolution. Also independently verified: the
"10 turns minimum" arithmetic (brute-forced), every real lesson's
share/run/ratio on both tracks, round-boundary adjacency at the new
cycle length, and the achievements.ts companion fix. Two MINOR findings
(no length-band unit test; g-plurals gap only in source comments, not
the ledger) both addressed.

CURRICULUM CRITIC: MAJOR (same verify-command gap, independently
found) — addressed the same way. MINOR: the "say so explicitly" ask
from the original finding (grammar's climb ratio vs grammarDrill's own
construction test) wasn't answered in the first draft — added an
explicit division-of-labor rationale to the grammar call site's own
comment. Confirmed no regression for g-pronouns/g-ability (both now
clear the 3-minute floor as a side effect); recommended URD-029's
queue text be updated to reflect the narrower remaining gap — done.

## PASSED · URD-025 · 2026-08-21T14:20Z
$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build.

$ npm run check:shape -- --kind=sentences
  0 problems.
$ npm run check:shape -- --kind=grammar
  1 problem (g-plurals, 2.7 min — pre-existing, tracked separately as
  URD-029, not this item's files to fix; see done/URD-025.md).

$ npx vitest run src/exercises/generator.test.ts
  35 passed (35) — 4 new URD-025 tests: sentences ratio, grammar ratio,
  40% share ceiling, and the 3-8 minute band with g-plurals' known
  exception named explicitly.

Induced failure: reverted sentenceReinforceClimb to the old 3-round
1:1:1 logic, both new ratio tests failed exactly as predicted — restored
and reconfirmed clean.

branch: claude/gauntlet-sentence-build-ratio

## CLAIMED · URD-026 · 2026-08-21T14:35Z
files: src/lib/review.ts, src/exercises/generator.ts (readableSentences),
  scripts/check-order.js, src/lib/review.test.ts
branch: claude/gauntlet-grammar-readiness

## CRITIQUE · URD-026
THE CRITIC: no BLOCKING. Confirmed inclusive-self semantics on
taughtConceptsUpTo are load-bearing (exclusive would empty all 25
concepts' own pools, triggering the unfiltered-pool fallback). Confirmed
0 fallback hits on real data, 0 id-namespace collisions in check-order.js's
sentence recovery, and reproduced exactly 41 induced-failure violations
matching the implementation's own claim. Confirmed units.ts correctly
left untouched (check:shape identical with fix reverted or applied).

CURRICULUM CRITIC: no MAJOR/MINOR blocking. Independently reproduced the
same 41-violation count via a from-scratch reimplementation. Measured
pool sizes post-filter (17-69 candidates vs 8 drawn, no repetition risk).
Pushed back on the item's framing that repositioning two lessons was
ever a real alternative given 9 of 12 lessons violated, not 2 — recorded
in done/URD-026.md. Flagged URD-027 needs a re-measure footnote (the
reachable sentence set churned by 41 members even though its aggregate
size, 81/256, is unchanged) — added to URD-027's queue entry.

## PASSED · URD-026 · 2026-08-21T15:05Z
$ npm run check:all
  check:all — all 26 steps pass against a deploy-shaped build (check:order
  now includes the new grammar-concept-ordering section, 0 findings).

$ npm run check:order
  0 concept-ordering findings across 348 lessons.

$ npx vitest run
  160 passed (160) — 4 new URD-026 tests in review.test.ts covering
  taughtConceptsUpTo's pure logic.

Induced failure: reverted readableSentences' concept-filter clause,
check:order reported exactly 41 real violations (matching both critics'
independent counts) — restored and reconfirmed clean.

branch: claude/gauntlet-grammar-readiness
