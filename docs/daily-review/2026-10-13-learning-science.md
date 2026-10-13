# 2026-10-13 · Learning science: shorter lessons, and today's changes (area 16)

`qaaf-learning`, 36 tool calls, 3.8 minutes, read-only. One task: the first
check of P-046 (shorter lessons), the change the tester ranked first.

## Lesson lengths, measured

`buildLessonExercises` over all 350 lessons on the Both track, no review items
woven in: 12,106 exercises, mean 34.6, median 37, range 2 to 57. 289 lessons
are over 25.

| Kind              | Lessons | Exercises (median, range) |
| ----------------- | ------- | ------------------------- |
| vocab             | 233     | 41 (29–57)                |
| sentences         | 12      | 50                        |
| phrases           | 1       | 48                        |
| letters           | 9       | 28–49                     |
| grammar           | 25      | 32                        |
| review            | 41      | 22–31                     |
| reading, dialogue | 29      | 2                         |

A real lesson adds up to 4 due items. `check:shape` assumes 9 seconds an
exercise, and nobody has timed one, so minutes per lesson are not known.

Halving every vocab lesson's words takes it to 21.3 exercises, and the gap
between two sightings of the same word drops only from 4.6 exercises to 3.8
(median 4 either way): the within-lesson spacing barely changes.

## Research

- Spreading practice over sittings beats one long sitting: three 10-minute
  sittings retained about 35% more at four days than one 30-minute sitting
  (Bloom and Shuell 1981, [PDF](https://www.gwern.net/doc/psychology/spaced-repetition/1981-bloom.pdf)).
- **The case against:** one big flashcard stack beat four small ones, because
  it spaces repeats further apart (Kornell 2009, [CiNii](https://cir.nii.ac.jp/crid/1361699994055985152));
  Nakata finds spacing, not set size, is what matters (summary only). Finding
  2 above says Qaaf's spacing barely moves, so this objection is weak here.
- The average phone app session is under a minute (Böhmer et al. 2011,
  [DOI](https://www.doi.org/10.1145/2037373.2037383)). Duolingo lessons are
  about 15 exercises, by a fan-run site, not Duolingo.

## P-046, first check

Split by items, never by touches; target 15 to 25 exercises.

- Vocab 5 to 7 words a lesson (about 21 exercises); sentences 5 a lesson (25),
  keeping every sentence's five-rung climb whole; reviews capped near 20;
  grammar left alone (judgement). `check:shape` moves with it.
- **Saved progress:** each id keeps the first half, the second becomes
  `<id>-b`, and a store migration marks `-b` done or skipped wherever the old
  id was. Without it, Home's `lessonState` would show `-b` as current and lock
  everything after it for existing learners.
- **Perspectives.** Beginner: about 3 minutes fits phone use. Heritage
  speaker: less drilling of words known by ear. Teacher: two sittings space
  better than one. **Against:** more lesson starts and screens, about 600
  lessons where 493 once read as padding, half the XP per lesson, and a
  migration that could go wrong.
- **With it:** save grades when a learner leaves partway (Q-038). The
  retrieval has happened; only its record is thrown away.

Not built tonight: it is the largest change on the list and needs its own
night, the migration test first. Stays in "Checked once" with this first
check.

## Today's changes, against the evidence

- **One retry on builds: a bug, fixed tonight** (3c1dd45). The retry itself
  is supported, but a word built wrong then right reached the schedule as
  `easy`, the best grade, so a failed recall pushed its next review out. It
  now reaches the schedule as `again`; the lesson still counts it right.
- **A lesson opening on the out-of-hearts screen at 0 hearts:** not against
  the evidence; better than starting a lesson that cannot be finished.
- **Unit reviews take at most 30% due items:** fine for the unit's own words,
  but it slows clearing the overdue backlog (294 items on 10-09).
- **Passing a unit review at 80% skips the unit's unfinished lessons:** only
  851 of 2,276 unit words (37%) appear in their own unit's review, so a pass
  marks lessons done whose words were never shown, and those words never
  enter the review queue. Second check below.

## Second check of the unit-review skip: HOLD, reworked tonight

`qaaf-critic` (heritage learner placing out, data integrity, the case for
keeping it; 19 tool calls, 2.4 minutes). Two blocking findings:

- A review draws on what the learner has already been graded on, so for a
  learner who jumped ahead it asked about none of the unit's own words.
  Measured with the real generator, learner graded on everything before the
  unit and nothing in it: 18 of 2,276 unit words, all in Unit 1; **0 in Units
  2 to 41.** The pass then marked the unit "already known" on no evidence.
- Words in skipped lessons never come back on their own: cards are only made
  by playing a lesson, and later reviews draw only on graded words.

It also confirmed the 37% figure (851 of 2,276) for the honest path.

**Reworked (1356947):** only the review's answers on the unit's own words and
letters count, at least 10 asked and 80% right first time; letter lessons
are left alone on the Roman track; the lesson-complete screen says how many
lessons were marked as known and that they stay on the path. `lessonsToSkip`
is pure and tested, the jump-ahead case first. Following the critic, unseen
words are **not** queued as cards (that would mark them learned and could
push Home into a catch-up review); the learner is pointed at the lessons
instead. Not done: a review that works as a placement test for a learner
graded on little of the unit (Q-065).

## What this is not evidence for

Minutes per lesson, completion rates, or what learners recall. No browser run.
