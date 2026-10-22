# 2026-10-22 · Learning science (area 16): practice XP, and letter forms without longer lessons

Reviewed by `qaaf-learning` (29 tool calls, about 5 minutes, read-only).
Scratch tests outside the repository call the real `repeatReward`, the real
store and the real generator, 30 seeds each.

## Findings

1. **Every practice kind paid its full XP whatever the score:** review 20,
   catch-up 30, topic 18, grammar 16 (20 the first time); each Practice-tab
   story or conversation 25 the first time, for one exercise.
2. **The farm, modelled** with Unit 1's free hearts and chance accuracy: an
   hour of tapping paid about 1,974 XP (1,542 to 2,818 at 2 to 4 s an
   exercise), against 150 a week for promotion. Tapping speed is assumed.
3. **Unit 2's letter lesson asks each joining letter's four forms once, and half
   only by tracing:** in 9 of 20 cells the form is traced once and recognised
   0.1 times on average. One more ask per letter: 35 → 40 exercises, 1.20 →
   1.45 asks per cell. Four more: 35 → 55, still 19 of 20 cells under 3.

## P-102, second attempt: built, held once, shipped tonight

A daily allowance for practice: any practice lesson, or any lesson done again,
pays in full until the day's practice XP reaches 60, then 2 XP per right
answer, never more than in full; a first completion of anything new (a path
lesson, a Practice-tab story or conversation) is never practice. Modelled:

| Case                                                  | Before | Now  |
| ----------------------------------------------------- | ------ | ---- |
| Farmer, 1 hour at 3 s an exercise                     | 1,974  | ~516 |
| Steady day (path lesson + review)                     | 40     | 40   |
| Serious day (2 path lessons + review + topic)         | 76     | 76   |
| Finished course, Intense goal, practice only, 85%     | 106    | ~100 |
| Returner: catch-up at 4/20, catch-up at 10/20, lesson | 80     | 80   |

60 is twice the Steady goal and room for a catch-up and a review. The pay grows
with each right answer, so the 22 XP cliff the first attempt had is gone.
Lesson complete says when the allowance lowered the XP: "You've done a lot of
practice today, so until tomorrow practice gives 2 XP for each right answer.
New lessons on the path still give full XP."

The second check (`2026-10-22-agents.md`) held it once: the Practice tab's 29
stories and conversations, new reading, counted as practice, so a first,
perfect read paid 2 XP past the allowance instead of 25. Fixed, then SHIP.

**Against, and left as stated:** a farmer still banks 60 a day, enough for
promotion in about 20 minutes; a returner's third catch-up in a day at 4 of 20
pays 8 (exempting catch-ups would reopen the farm, since wrong answers keep
items due); a lesson that crosses the line part-way can pay more than 2 per
right answer, which the line does not explain. Gems are not under the
allowance (an hour of farming still pays about 500).

## P-105: more letter-form asks, without longer lessons

Raising asks inside the lesson lengthens it about as much as it helps, and
each added ask is massed in one sitting; spaced relearning does more for
retention than a higher first criterion
([Rawson and Dunlosky 2011](https://doi.org/10.1037/a0023956);
[Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354); carrying
word-pair studies over to letter forms is judgement). Cheaper, at no extra
length: in review sightings, ask recognition on the forms a lesson only traced
(P-105b). Tracing stays: writing helps letter recognition
([Longcamp et al. 2005](https://doi.org/10.1016/j.actpsy.2004.10.019)).

## What this is not evidence for

Real tapping speed or accuracy at chance, whether anyone farms, or retention.
The P-105 counts assume an empty review queue. The hearts wall after Unit 1
was not played.
