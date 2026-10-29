# 2026-10-29 · Learning effectiveness (area 4): lesson length, alif madda, unseen options

Reviewed by `qaaf-learning` (23 tool calls, about 5 minutes, read-only). Its throwaway scripts drove the real `buildLessonExercises`.

## Measured

**Lesson length (Q-114, Q-117).** Units 1 to 3 run 3.3 to 7.8 minutes a lesson at check:shape's 9 seconds a step, all inside its 3-to-10 range.

| Lesson          | Steps | Minutes |
| --------------- | ----- | ------- |
| l-1             | 42    | 6.3     |
| v-first-words   | 45    | 6.8     |
| phrases         | 48    | 7.2     |
| rev-first-faces | 22    | 3.3     |

**Splitting l-1 in two fails.**

- Each half is 21 steps, just above the 3-minute floor.
- The first half knows too few letters for four-option picks, so "which position?" reaches 43%, past check:shape's 40%.

**Alif madda (Q-136).** In 200 builds of l-1, آ is asked "which position?" three times and "which letter?" never.

- آ looks the same alone and at the start, so the answer is always "Alone or start".
- The only wrong option is ـآ, which P-133 ruled out.
- l-1-2 traces the same آ three times.

**New: word questions offer words not yet shown.**

- In the first lesson of each topic, 66 to 82% of wrong options are words the learner has not yet met. In later parts it is 13 to 21%.
- This is the word-level version of P-123.

## Decided, not built tonight

- **Do not split or trim l-1.** Instead, keep grades at a "good place to stop" after round 2 (about step 21), built with Q-038.
  - The testers' pain was losing the lesson on leaving, not its length.
  - Evidence: relearning across sessions adds more than further repetition within one (Rawson and Dunlosky 2011; only the citation was confirmed).
  - Against: six sightings a letter is past that point. But the four-positions guarantee needs at least four.
- **P-135, alif madda never gets "which position?"** when the positions it is asked in share one shape. Fall back to a "which letter?" pick, then a contrast, then a letter-in-word.
  - Risk: last night a pick-for-position swap pushed six reviews past 40%. `check:shape` must confirm the new version.
- **P-136, graded word questions draw wrong options from words met so far,** same topic first, and fall back to the topic pool only below three. Pretest questions are unchanged.
  - Against: fewer plausible same-topic options early on, and repeated option sets.
  - For a heritage speaker an unseen word is no giveaway.

All three are research changes and need a second check.

## What this is not evidence for

- Simulated builds, not learners.
- The seconds per step are judgement.
- Retention.
