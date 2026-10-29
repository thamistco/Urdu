# 2026-10-29 · Tester, route 3: testing out of Unit 2 by its review

Played by `qaaf-tester` (27 tool calls, about 11 minutes) on the b0cfed4d build, Both track. The learner's progress was seeded to match what a learner who finished Unit 1 really has: 9 lessons done, and 57 words and letters in their review schedule.

## Where they give up: they can never test out

Unit 2's review opens at "1 of 22", with no introduction. The first five questions were Unit 1 words.

**The generator's plan, with the same known set:**

- the same 22 questions;
- none of them on a Unit 2 word or letter.

**The cause:**

- Once a learner has been graded on anything, `reviewWordPool` and `reviewLetterPool` draw only from what they have been graded on. That is deliberate: `check:srs` holds it, so a review never asks about untaught material.
- So `unitEvidenceFrom` finds 0 of the unit's own items asked.
- `lessonsToSkip` needs at least 10.
- Every score, perfect or not, marks nothing known.

## Not fixed tonight

The fix is a design decision, not a one-line bug. A unit review opened ahead of its unit is a test-out and should ask the unit's own items. The same review reached in order is a review and should not.

Recorded as **P-137**, to build with a second check. It needs to settle three things:

- **Is it a test-out?** Telling one apart: is any of the unit's lessons unfinished?
- **Hearts:** whether a test-out costs them. Three wrong answers here cost three hearts on questions that could not count.
- **Coverage:** even with an empty schedule, a perfect run would mark only 4 of Unit 2's 5 lessons known. "More family part 2" is asked only 2 items, and needs 3.

## Other problems

- **Nothing on Home says the review is a test-out,** or what score passes. Recorded with P-137.
- **"Farewell" and "Goodbye" offered together for الوداع** (Q-148).

## What went well

- Home's jump-ahead reaches every Unit 2 node.
- Abandoning the review changed nothing.

## What this is not evidence for

- The driver stalled at question 5 on every run, cause not diagnosed. So the end screen, a near pass and a fail were never seen.
- The headline rests on the first five questions on screen matching the generator's 22-question plan.
- Not tested: the Roman track.
