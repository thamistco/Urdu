# 2026-10-27 · Learning effectiveness (area 4): the first lessons' wrong options

Reviewed by `qaaf-learning` (20 tool calls, about 3 minutes, read-only), on
Q-095 from the heritage tester (2026-10-23) and Q-102 from the beginner tester
(2026-10-24, where they gave up).

## What was measured

The real `buildLessonExercises`, each lesson built 30 times on the Both track.
l-1 and l-1-2 both teach alif, alif madda, be, pe, te and Te.

|                                                   | l-1                       | l-1-2            |
| ------------------------------------------------- | ------------------------- | ---------------- |
| "Which letter makes this sound?" questions        | 210                       | 150              |
| Wrong options that are untaught letters           | 549 of 630 (87%)          | 398 of 450 (88%) |
| Questions with at least one untaught wrong option | 100%                      | 100%             |
| Hamza offered as a wrong option                   | 18 (2 as the bare mark ٔ) | 9 (1)            |

The cause: `distractLetters` drew from the whole alphabet. Word-build already
kept to taught letters; letter questions never did.

## Decided and built (P-123, from Q-095)

Wrong options come from the letters taught up to this lesson on the track's
path, or in a practice lesson the letters the learner has been graded on, then
the letters coming next in course order if too few survive the existing
filters. Hamza is never a wrong option. A lesson off the path keeps the whole
alphabet. Simulated over every letter lesson on Both and Script, 37,600 draws:
all had four options.

Evidence: a wrong option nobody would pick tells nothing (Haladyna, Downing and
Rodriguez 2002); options that compete with the answer make multiple choice a
real act of recall (Little, Bjork, Bjork and Angello 2012); wrong options can
be remembered as true (Roediger and Marsh 2005), so unseen letters are risk
with no use; three options do as well as four (Rodriguez 2005).

Against: l-1 gets harder, its options now differing by dots alone (be, pe, te,
Te), and fewer letters are seen in passing. The trade is "harder because it is
the skill" for "easier because it is a giveaway".

Second check (`qaaf-critic`, engineering, a beginner with six letters, the case
against): **SHIP**, one major fixed the same night (re-asks in topic practice
still drew from the whole alphabet: 869 re-asks over 300 builds offered 35
untaught letters). Measured by the critic: te and Te together in 40.5% of l-1
sound questions (4.8% before), and all four options from be, pe, te and Te in
6.1% (0%). The question shows "ṭ (hard)" and the letter's name and plays no
sound before the answer, so it is a test by sight, not by ear.

## Recorded, not built

- **Alif madda's joined forms** are drilled in every first lesson (its middle
  form in all 30 builds of l-1, "Which position?" on its end form in all 30). Joined
  آ is rare in Urdu (Arabic loans such as مآخذ). Allow only alone and start
  for it: Q-095, still open for this part.
- **A short pool fills in fixed order**: in a practice review with alif, be
  and pe known, alif's options were always alif, be, pe, te. Shuffle the fill
  among the next few (critic minor).
- **Watch first-lesson mistakes** once this is live, by letter pair, te and Te
  first. No measure exists yet (Q-005).

## What this is not evidence for

Simulated builds, not learners: whether l-1 is now too hard, or whether fewer
people give up there, needs real first lessons.
