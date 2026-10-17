# 2026-10-16 · Learning science (area 16)

Reviewed by `qaaf-learning` (24 tool calls, about 12 minutes, read-only). It
measured with a scratch vitest file outside the repo using the real
`buildLessonExercises` and `itemsOf`, Both track, no due items.

## Findings

1. **The unit test-out certified lessons it never sampled. Fixed tonight.**
   A learner who finished the first half of each unit and opened its review
   was asked 865 of the units' own items and none from the unfinished lessons,
   because a review draws only on what has been graded. A pass then marked
   those lessons known, and their 797 items never became cards. With only the
   first lesson done, 20 of 40 units reach the 10-item floor on words learned
   minutes earlier. A mastery test certifies what it sampled (Millman 1973,
   cited from memory; [CRESST 1980](https://cresst.org/publication/determining-test-length-to-control-for-false-positive-and-false-negative-error-rates-on-criterion-referenced-tests/));
   the 80% criterion is defensible ([Slavin 1987](https://Www.Gwern.net/doc/psychology/1987-slavin.pdf)),
   ten items none of them from the skipped lessons is not. Arithmetic: a
   learner right 60% of the time passes 8 of 10 with probability 0.17.

   The fix: a lesson is marked known only on at least 3 of its own words or
   letters asked and 80% right first time, on top of the unit's floor. A
   lesson that introduces none is never marked known by a review. Six of the
   new tests fail with the per-lesson filter removed; one runs every real unit
   with the first lesson done and a perfect review, and none of the rest is
   marked known. Under today's review generator a jumper's pass now mostly
   skips nothing; Q-065 (a review that samples the unfinished lessons) is the
   cure, and is now the next step for M2.

2. **Lesson length.** 350 lessons, 12,101 exercises, median 37: 29 lessons of
   15 or fewer (all two-step readings and dialogues), 32 of 16 to 25, 76 of 26
   to 35, 179 of 36 to 45, 34 over 45. By kind, vocabulary median 41,
   sentences 50, grammar 32, reviews 22.

3. **P-051 confirmed.** All 12 sentence lessons open with meaningPick,
   meaningPick, sentenceBuild, graded, with nothing explained first; all 25
   grammar lessons open with a teach card. Numerals and readings not measured.

4. **A miss is never re-asked in the session.** It is graded `again` and due
   now, but the session ends with it unrecalled.

## Proposals (first check)

- **P-085, re-ask each missed item once at the end of a lesson, in a
  different exercise shape**, graded on the first miss, never on the re-ask.
  For: feedback after an error raises week-later retention
  ([Pashler et al. 2005](https://www.yorku.ca/ncepeda/publications/PCWR2005.pdf));
  successive relearning asks for one correct recall per session (Rawson and
  Dunlosky 2011, cited from memory). Beginner: the session ends on a right
  answer. Roman track: unchanged. **Against:** longer sessions, against P-046;
  grading on the re-ask would inflate the schedule.
- **P-051 before P-046**: a teach card at the head of each sentence lesson is
  a content change with no ids moved and no migration; then split vocabulary
  and sentence lessons to 15 to 25. **Against:** wrong guesses before teaching
  can help ([St. Hilaire et al. 2024](https://featuredcontent.psychonomic.org/test-first-learn-later-the-power-of-pretesting-to-enhance-learning/)),
  though that is a pretest followed by study, not graded building; the tester
  asked for shortness first.

## What this is not evidence for

Learner recall, minutes per lesson, completion. The Roman track was not
measured. Millman 1973 and Rawson and Dunlosky 2011 are cited from memory;
Kulik 1990 from secondary summaries.
