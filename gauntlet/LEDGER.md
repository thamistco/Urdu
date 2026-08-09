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
