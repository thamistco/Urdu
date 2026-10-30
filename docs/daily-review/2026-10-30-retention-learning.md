# 2026-10-30 · Retention and habit (area 7), from the learning side

Reviewed by `qaaf-learning` (23 tool calls, about 4 minutes, read-only). Its scripts drove the real `srs.ts`, `buildLessonExercises` and `dueQueue` with a simulated clock (`scratchpad/learn-1030/sim.js`).

## Measured: lesson 1 on day 1, then back on days 2, 4 and 8

- **"Due" is exact to the hour.** A learner who returns on day 2 at or before the hour of yesterday's lesson sees 0 due, and Home says all caught up on the most fragile day. Two hours later, all 6 letters (Both track) or 11 words (Roman) are due. The daily review still re-asks day-1 items through its fallback.
- **Day-1 letters come back late on the Both track.**
  - On days 4 and 8 the daily review asked 10 of 10 words and no letters, with 13 and 27 due.
  - Shortest interval first puts new words ahead of 3-day letters.
  - The letters returned only by being woven into l-1-2, 3 days overdue.
- **The pile grows.**
  - 27 to 31 due by day 8 after four lessons: each lesson adds 10 to 11, and a review clears 10.
  - On the Roman track with one miss in five, it passes 30, so Home offers a catch-up instead of a new lesson.

## Decided

**P-135, built and shipped.** Alif madda is never asked "which position?": both positions it is asked in are آ, so the answer was free.

- In l-1, three position questions became contrasts with alif (4 contrasts in all, with its existing one).
- l-1-2's one position question also became a contrast.
- Both lessons stay 42 steps, and no kind exceeds 26.2%.
- The fallback order is contrast first, because picks first would put the all-letters review past check:shape's 40% limit.

Second check (`qaaf-critic`: the checks and the case against, engineering, a beginner): **HOLD, then SHIP.**

- One major: a narrowed test was looser for nine other letters than its comment said. It was fixed and re-checked with mutations.
- The case against stands: alif and alif madda are paired five times in l-1. Capping fallback contrasts at one a lesson is **P-135b**.

**P-136, built and shipped** (found by the 29 October review). Wrong options in graded word questions are words already met.

- Units 1 to 3, 50 builds a lesson: unseen wrong options fell from 42% to 1.0%. The remainder is the first lesson's opening questions, before three words are met.
- Every question kept four options.
- Variety fell from 15.7 to 13.7 distinct wrong options per lesson.

Second check (assessment design and the case against, engineering, a heritage speaker): **SHIP.** Its minor findings:

- When a topic has three or fewer met words, about 10% of questions offer off-topic wrong options, a narrower shortcut than the one removed.
- An off-by-one leaves two same-topic options plus one other when three same-topic words exist.
- A slightly stronger "pick the new word" cue: 10.9% before, 12.7% after.
- Re-asks still draw from the whole topic: 24% of their wrong options are unseen. Recorded as **P-142**.

**P-138, built.** A broken streak of one or two days gets the welcome back, without its number.

- Evidence:
  - a log showing a broken streak lowers later engagement, more so under self-blame (Silverman and Barasch 2023, read from abstracts);
  - one missed day barely affects habit forming (Lally 2010, cited from memory).
- Against: nudges to recover failed in the same research. The card asks nothing; it says what was learned.
- Second check: see the agents report.

**P-139, dropped.** Gain-framed wording on day 2 has no basis: framing effects average r = .01 (O'Keefe 2011, health messages). "Keep your 1-day streak" is the same hollow praise P-011 rejected, and is recorded with Q-151.

## Recorded, not built

- **P-141: due by the day.** A card with an interval of a day or more becomes due from 4 a.m. local time on its due day, as Anki does.
  - For: a learner back on day 2 sees their review.
  - Against: it changes `isDue`, and needs `check:srs` and the DST test.
- **Letters in the Both-track daily review.** Whether some slots should be kept for letters (0 asked on days 4 and 8).

## What this is not evidence for

- One simulated learner with deterministic misses; no real learner data.
- Papers read from abstracts and summaries only.
