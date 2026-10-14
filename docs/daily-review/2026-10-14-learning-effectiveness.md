# 2026-10-14 · Learning effectiveness: grammar order (area 4)

`qaaf-learning`, 22 tool calls, 4.9 minutes, read-only. One task: the first
check of P-062, grammar used before it is taught (QA, 2026-10-12, H2).

## Measured

The real `buildLessonExercises` over every non-review lesson in course order
(Both track, empty progress), text of two or more words, answer options and
tiles left out, matched on word-level markers for each concept. "Tested"
means a sentence build, word-from-meaning or drill turn.

| Concept                     | Taught                   | First used                 | Strings before taught | Tested turns before |
| --------------------------- | ------------------------ | -------------------------- | --------------------- | ------------------- |
| Simple past (آیا، گیا، کہا) | no lesson; g-perfect u37 | u12 `s-intermediate`       | 88                    | 170                 |
| g-imperative                | u31                      | u1 phrases; u16 g-negation | 21                    | 39                  |
| نے (taught in g-perfect)    | u37                      | u15 g-postpositions drill  | 32                    | 53                  |
| g-future                    | u24                      | u1 "phir mileñ ge"         | 9                     | 15                  |
| g-dative                    | u21                      | u1 "mujhe pyaas lagi hai"  | 10                    | 20                  |
| g-oblique                   | u17                      | u1, u5 vocab; u14          | 18                    | 40                  |
| g-past (تھا)                | u22                      | u16 g-negation             | 7                     | 11                  |

QA's "نے from Unit 10" was Unit 15 on this track (the Roman track was not
measured). The worst gap is one QA did not name: the simple past had no
lesson anywhere. g-past (u22) explained only تھا while drawing simple-past
sentences, the u15 drill "main ne laṛke ___ kitaab di" uses نے and the
oblique two units early, and s-67 "darwaaza mat kholo" teaches مت before
imperatives.

## Research

- Meeting forms as unanalysed chunks first is normal and useful: classroom
  learners store chunks and analyse them later (Myles, Hooper and Mitchell
  1998, [doi](https://doi.org/10.1111/0023-8333.00045)); a store of set phrases
  belongs beside rules (Ellis 2005). So "phir mileñ ge" in Unit 1 is fine.
- None of that supports _testing_ a learner on a rule never taught; gains
  come when chunks are noticed with explicit help (Boers and Lindstromberg
  2012, [ARAL](https://www.cambridge.org/core/journals/annual-review-of-applied-linguistics/article/experimental-and-intervention-studies-on-formulaic-sequences-in-a-second-language/A2ACDF54604CFAC4443240748360C403)).
  "Do not test untaught rules" is judgement from there.
- **Against:** teachability (Pienemann 1984) says teaching a rule early may
  not speed acquiring it.
- Heritage speakers of Hindi show eroded ergative and dative marking (Montrul,
  Bhatt and Bhatia 2012, [LAB](https://www.jbe-platform.com/content/journals/10.1075/lab.2.2.02mon)):
  they need نے taught, not met 32 times untaught.

## Built tonight: P-062 part 1, "teach the past where it is used"

g-perfect moves from Unit 37 to Unit 22, after g-past; g-past gains one line
on the simple past; the one نے sentence g-past drew (s-227) moves to
g-perfect. Moving s-211 and s-212 too took g-past under its 3-minute floor,
so g-past now teaches them instead. Measured after: نے and the simple past
are both taught in Unit 22. No lesson id changes.

**Second check** (`qaaf-critic`, learners already in the course, knock-on
effects, Urdu accuracy): HOLD twice, then SHIP.

- g-perfect kept level "advanced", so in Unit 22 18 of its 72 option sentences
  were untaught advanced forms (passive, causative). Now intermediate: 0.
- Learners past Unit 22 are sent back to it once, and the regrouped-lessons
  notice did not fire because it compared only the lesson count. Home now
  records a fingerprint of the lesson order; then the critic found the notice
  could never fire for any real profile (the "seen" flag is set on every
  profile and was checked first). Fixed; it now reaches every learner with
  progress, once.
- The g-past line now says نے is needed with a verb that can take an object
  even when none is said, and glosses کھانا "to eat".

Merged and live: 576b2b6.

## Proposed, not built

- **P-062 part 2:** rewrite the eight sentences and one drill that test نے
  or the simple past before Unit 22 into the present habitual (s-58, s-63,
  s-74, s-114, s-187, s-190, s-195, s-199). Needs a native speaker for
  every rewrite. Readings and dialogues stay as heard input.
- **P-062 part 3:** imperatives from Unit 31 to Unit 16, before g-negation,
  since مت depends on them. Against: Unit 16 may lack readable sentences to
  fill the lesson.
- `s-intermediate` and `s-intermediate-2` sit in elementary Units 12 and 13,
  the root of the Unit 12 hit; noted, not proposed.

## What this is not evidence for

The markers are approximate; compound, passive and causative were not
measured; the Roman-track order was not measured; nothing here measures what
learners recall.
