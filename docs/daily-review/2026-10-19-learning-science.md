# 2026-10-19 · Learning science (area 16): re-asking missed items, and what a review should pay

Reviewed by `qaaf-learning` (25 tool calls, about 13 minutes, read-only). The
numbers below come from a scratch simulation outside the repository: it calls
the real `buildLessonExercises` and `itemsOf` on the Both track with empty
progress, for the 309 lessons that are not reviews (median 37 exercises), 20
runs each, with every answer right at a fixed probability, independently.
Pretest misses and first-listen misses are left out.

## Findings

1. **How many items a lesson would re-ask (P-085):**

   | Accuracy | Items missed (mean / p90) | Still wrong at last sighting (mean / p90) | Lessons with any | Added length, capped at 5 |
   | -------- | ------------------------- | ----------------------------------------- | ---------------- | ------------------------- |
   | 60%      | 5.9 / 9                   | 3.3 / 7                                   | 87%              | +7%                       |
   | 75%      | 4.2 / 7                   | 2.1 / 5                                   | 76%              | +5%                       |
   | 90%      | 1.9 / 4                   | 0.8 / 2                                   | 45%              | +2%                       |

   Re-asking every missed item instead would add 15%, 11% and 5%. Most misses
   are word-from-meaning, then typing and word building. A matching miss
   reports all four words (`src/exercises/Matching.tsx`), so these counts run
   slightly high.

2. **Hearts and grading already behave.** An item is never charged a heart
   twice, and under `finalGradeOf` (`src/lib/sessionGrading.ts`) an item wrong
   at its last sighting ends `again` whether or not a re-ask is recorded. A
   re-ask of every missed item would break that: wrong, right, then right on
   the re-ask turns `again` into `good`.

3. **Rewards ignore how it went.** XP is flat, plus 5 for a perfect lesson.
   Gems are 8 for a review and 5 for a lesson, plus 2 at 80% and 5 at 100%
   (`src/lib/gamification.ts`). The accuracy behind that counts teaching cards
   as right.

## P-085, specified (not built)

- **Which items:** those still wrong at their last sighting, at most 5, the
  most recent miss first. Misses with no item (sentences, grammar drills,
  numerals) are not re-asked yet.
- **Shape:** typing becomes word building; word building becomes
  word-from-meaning with fresh distractors; word-from-meaning becomes
  listen-and-tap (meaning-pick without audio); a recognise miss becomes
  word-from-meaning; tracing becomes letter-pick; any other letter exercise
  becomes letter-contrast.
- **Where:** after the last exercise, before the lesson finishes, with no
  extra card. The count stays fixed and the bar full; the label reads "Once
  more · 1 of 3".
- **Hearts and grading:** no heart, not graded, not counted in the lesson's
  accuracy.
- **Verify:** a unit test that the grades flushed are the same with and
  without the re-asks, run once with the filter broken so it fails.

For: feedback after an error helps a week later
([Pashler et al. 2005](https://www.yorku.ca/ncepeda/publications/PCWR2005.pdf));
getting each item right once in a session and relearning it later is cheap
and durable ([Rawson and Dunlosky 2011](https://www.kent.edu/psychology/comprehension-memory-lab/rawsons-comprehension-memory-lab-publications),
design from a secondary summary). The lesson ends on a right answer. The
Roman track needs a Roman word-building exercise, not checked. **Against:** up
to 7% longer lessons, against P-046's push for shorter ones; and a re-ask 0 to
2 minutes after the answer was shown is close to copying
([Pyc and Rawson 2009](https://doi.org/10.1016/j.jml.2009.01.004)). Reviews
are left out: a 10-item review at 60% with a cap of 3 would grow by 30%.

## P-091, built, second-checked and shipped tonight

Recommendation: keep XP flat; keep a review's 8 gems, but only for a review
really attempted, at least 25% right (chance on four options); below that pay
a lesson's 5. Built as exactly that (`gemsForLesson`, with a test that fails
under the old rule). Working accuracy out without teaching cards is left as
**P-100**, since it also changes the percentage Lesson complete shows and the
perfect bonus.

Research: completion-contingent rewards lower free-choice motivation (d =
−0.36) where positive feedback raises it (+0.33)
([Deci, Koestner and Ryan 1999](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf));
paying for inputs did better than paying for outputs in Fryer's field trials
([NBER w15898](https://ideas.repec.org/a/oup/qjecon/v126y2011i4p1755-1798.html);
the published abstract reports roughly no effect); effort praise over ability
praise is disputed
([Li and Bates 2019](https://westminsterresearch.westminster.ac.uk/item/v62v1/you-can-t-change-your-basic-ability-but-you-work-at-things-and-that-s-how-we-get-hard-things-done-testing-the-role-of-growth-mindset-on-response-to-setbacks-educational-attainment-and-cognitive)).
Duolingo publishes no formula; a fan wiki lists a flat 20 XP a lesson.

Viewpoints: a heritage learner back after weeks at 10% loses no XP and still
earns a lesson's gems; a teacher sees a failed retrieval as productive
([Kornell, Hays and Bjork 2009](https://pubmed.ncbi.nlm.nih.gov/19586265/)).
**Against:** any cut tied to accuracy shows forgetting as failure, and the 3
gems are trivial.

The second check said SHIP (`2026-10-19-agents.md`). It found the 25% line's
stated reason wrong: one word turn in three in a review is typed or built, so
random tapping lands about a sixth, and in whole answers the line is 3 of 10.
The comment now says so. Profile's "more for reviews" became "more for a
review you work through". The XP half of what QA reported is untouched: a
tapped-through Daily Review still pays 20 XP and is always open, so it is
logged as P-102 rather than P-091 being called done.

## What this is not evidence for

Recall, minutes per lesson, or motivation. Real misses cluster on hard words,
which the independent model ignores. The Roman track, review lessons and
dialogues were not simulated. Rawson and Dunlosky's design is cited from a
secondary summary.
