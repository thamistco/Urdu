# 2026-10-09 · Learning science, second pass: the review schedule and the Roman (area 16)

`qaaf-learning` (35 tool calls) ran the real `buildLessonExercises`,
`dueQueue`, `dueBudget` and once-per-lesson grading on the "both" track, every
answer right (one run at 85%), lessons 8 minutes apart in an evening sitting.
`qaaf-critic` gave P-009 its second check from two other viewpoints: a heritage
learner who opens the app several times a day, and data integrity.

## What the simulation found

1. **At a normal pace, same-day jumps are rare,** and the 243 of 243 figure
   from 10-07 came from 90 lessons in one day. Same-day early promotions: 0 of
   749 gradings at one lesson a day, 5 of 1,069 at three, 43 of 1,191 at ten.
   With three lessons and three Daily Reviews a day it is 98 of 169 early
   promotions; fourteen words reached 3 days and nine reached 7 on the day they
   were taught. Matching grades every tile, so words that are not due get
   graded too.
2. **The review backlog never clears.** On the path alone at three lessons a
   day, 294 items are overdue on average the next day after 30 days (peak 580),
   and 357 of 654 items have only had their first review. With three Daily
   Reviews a day it is still 121. The schedule looks right on paper; the learner
   gets second meetings days late.
3. **"Show Roman Urdu" did nothing on the "both" track** (read from code). Fixed
   tonight, below.

## Research

Correct answers within one session add little; relearning across days lasts
(Rawson and Dunlosky 2011; Cepeda et al. 2006). Anki's rule for early reviews
is that they must not lower the interval: new interval = max(old, days elapsed
× ease). FSRS gives a same-day review a small, shrinking credit. Beginners look
at pinyin even when they do not need it (eye-tracking, n=10); no study found
pinyin lowering character recognition.

## Shipped tonight

**P-009, early answers (414a120).** A right answer before the due date grows
the interval only by the time that really passed, and leaves the card untouched
if that has not earned a longer gap.

- **Second check: HOLD, rightly.** The first draft moved the due date on from
  "now" on every early answer, so a word met in every short session was always
  due tomorrow and never came due: at three sessions a day it sat at 1 day for
  four weeks of right answers, and the Practice screen's "mastered" count would
  have stayed at 0. A word answered early to 5 days then on time came back in 3.
- **Reworked:** an early answer that has not earned more leaves the card
  untouched, and the 1- and 3-day steps are floors. Re-check: **SHIP**, with
  one minor applied before merging (an on-time answer must never earn less than
  an early one).
- **Measured,** the critic's simulation, 28 days, all right: 11 to 20 days
  whether a word is met 1, 2, 3 or 5 times a day; 17 when met only when due, as
  before. The old live rule, for a word graded every session, climbs without
  limit, to intervals of billions of days.
- Eight unit tests, each guard removed in turn to watch its test fail;
  `check:srs`'s recall-against-recognition case now answers each card when due,
  since stepping a day at a time had compared the early rule, not the grades.

**A miss is due at once (145417f).** A lesson that went badly ends with "the
ones that slipped are already queued", and Review straight afterwards said "All
caught up" (QA): a miss was scheduled a minute out, a minute that served
nothing, since grades are applied when a lesson ends. Played in the browser:
before, 0 of 11 graded words due and "All caught up"; after, "11 items due".

**The Roman toggle (a2f04f0).** With "Show Roman Urdu" off, the "both" track now
hides the Roman. Measured on the teaching card: before, the Roman showed either
way; after, none when off. A wrong answer is still always told how the word is
said.

## Not built

- **P-026, a backlog policy.** Limit new words while more than N are overdue (as
  Anki does), or let teaching lessons take more than four due items when the
  queue is long. Which one is judgement. Against: fewer new words makes lessons
  less fresh, and the simulation assumes path-only learners who never miss. Wants
  its own night and a second check; measured by `sim2.js`'s overdue count after
  30 days.
- **P-010 changes shape.** Not a silent fade: an opt-in "Fade Roman on words I
  know", offered once the alphabet is finished. A beginner keeps the help they
  were promised; a heritage speaker, who leans hardest on familiar Roman,
  probably needs fading most (judgement); the Roman track is unaffected.
  Against: the evidence that Roman hinders reading is thin.
- **Minor, queued:** an early "easy" (typed) answer does not raise ease, so a
  learner who never answers on time cannot win back ease lost to misses (Q-028);
  cards the old rule pushed out to absurd intervals are kept, not repaired
  (Q-029).

## Not evidence for

What real learners recall: every simulated answer is right, and there was no
browser run of the schedule itself.
