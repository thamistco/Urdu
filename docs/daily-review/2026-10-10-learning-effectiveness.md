# 2026-10-10 · Learning effectiveness: the review pile (area 4)

`qaaf-learning` turned last night's finding (the review backlog never clears,
P-026) into a measured recommendation, re-running its simulation on the
schedule as it now is (P-009 and "a miss is due at once" shipped on 10-09).
23 tool calls, read-only, no browser. The simulation runs the real
`buildLessonExercises`, `dueQueue` and `dueBudget` on the "both" track,
grading once per item per lesson; every answer right (some runs at 85%).

## What it found

1. **A bug: a new lesson wove in two due items, not the four the schedule
   asked for.** `dueBudget` gives an ordinary lesson four; the generator took
   the first two. At three lessons a day, 156 of 553 due items asked for were
   never shown. Fixed tonight (d97e9a0).
2. **The backlog grows all month.** Overdue the next day after day 30, at 1,
   3 and 5 lessons a day: **220, 580, 1,012**. Of the words taught by day 24,
   117 of 206, 286 of 583 and 440 of 930 were never met again on a later day.
   Only 2%, 12% and 12% got their second meeting within two days, where the
   schedule says one.
3. **More due items in each lesson is not enough.** Eight a lesson: 184, 416,
   700 overdue, and the longest lessons pass `check:shape`'s 8 minutes.
4. **A cap on new lessons works.** When more than 30 items are due, the next
   sitting is a 20-item review; due items come back most fragile first.

| 1 / 3 / 5 lessons a day, 30 days | Today         | Review first past 30, 20 items, fragile first |
| -------------------------------- | ------------- | --------------------------------------------- |
| Overdue at day 30                | 220/580/1,012 | **11/26/22**                                  |
| New items a day                  | 8.5/21.8/36.7 | 4.4/13.5/21.3 (52 to 62% of today)            |
| Second meeting within 2 days     | 2%/12%/12%    | 74%/100%/100% (median 1 day)                  |
| Never met again                  | 117/286/440   | 0/0/0                                         |
| Minutes a sitting (mean)         | 5.6 to 6.3    | 4.5 to 4.9                                    |

Research: Anki's 2021 scheduler pauses new cards when reviews back up and can
order reviews by interval; forgetting is steepest soon after learning (Murre
and Dros 2015, replicating Ebbinghaus); spaced relearning lasts (Cepeda et al.
2006).

## Shipped tonight

- **P-026, review first (7ed6438).** While more than 30 items the learner's
  track can show are due, Home's main card offers a 20-item catch-up review in
  place of the next lesson; the path stays open. Due items come back shortest
  interval first.
  - **Second check, `qaaf-critic`:** a beginner and a heritage speaker meeting
    it on Home, and engineering. **HOLD**, rightly: on the Roman track a
    learner's old due letters, which that track cannot show, made the card
    permanent and its review a white screen. That bug already existed behind
    the small "Due for review" card; it is fixed for both (ca6b8d6). It also
    measured that the result depends on learners taking the review: 26 overdue
    if they always do, 53 half the time, 426 a fifth of the time, 607 never.
    The comment and the commit say so. Re-check: **SHIP**.
  - `check:srs` builds the catch-up the way the lesson screen does, with due
    letters and words, and counts questions about the due items: 20 on both
    tracks, 0 on the Roman track with the filter removed.
- **The due weave (d97e9a0)** and **a one-year ceiling on review gaps
  (ec75d64)**, for cards the old schedule had sent out of reach (Q-029).

## Not done

- Curriculum order and script mastery beyond the weave bug.
- Long-interval words wait longer under fragile-first (the oldest overdue
  item 2.9 days late instead of 1.0, full compliance). Accepted; a 30-day run
  cannot show what happens near the ceiling.

## Not evidence for

Real recall: answers are all right, or randomly 85% right. Learners following
the offered button. Anything past 30 days, sittings spread across a day, or how
a gate feels. Sitting minutes are estimated at 9 seconds an exercise.
