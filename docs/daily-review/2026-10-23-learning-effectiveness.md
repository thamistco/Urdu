# 2026-10-23 · Learning effectiveness (area 4): letter forms in review, and whether P-085 is ready

Reviewed by `qaaf-learning` (24 tool calls, about 5 minutes, read-only).
Scratch tests outside the repository call the real generator, 30 runs each;
the "after" figures in its report came from rewriting the generator's output
in the test, before anything was built.

## Findings

1. **Unit 2 has 8 forms its lesson asks only by tracing.** l-2 (35 exercises,
   the same every run) never asks se medial or final, jeem isolated or final,
   che initial, baRi-he initial or final, or khe isolated by picking or naming
   them.
2. **Review did not fill them, on this measure.** Seven review sittings with
   all five letters due left 4 of the 8 never recognised (the second check
   found ten varied sittings leave 1, below): review picks a form by index and never
   looks at what the lesson asked.
3. **The same gap is in every letter lesson:** 33 letters across the nine have
   at least one such form; Unit 1 still has two after both sittings.

## P-105b, built tonight and dropped on its second check

Built: review, and letters woven into other lessons, asked a letter's
untraced forms by recognition on two turns in three, naming then picking; the
third turn as before, tracing included. A version with no tracing in review
took a letters-only review to 52% "which position", past `check:shape`'s
40%, so one turn in three stayed as it was. Its own test showed ten sittings
asking every one of Unit 2's untraced forms.

**Dropped** on the second check (`2026-10-23-agents.md`), which measured
both choosers on the same ten sittings:

- the old chooser already recognised 17 of Unit 2's 20 letter-form cells, not
  the four-short this report's finding 2 suggested (that came from seven
  sittings with all five letters due, and did not reproduce on ten); the new
  one recognised 8, only the gaps, and would for good, since the gaps are
  fixed by the lessons;
- a letter with three gaps got one of them while the due order held still
  (the position step was a multiple of 3);
- a letter with one gap had a fixed answer to "Which position?", so the
  letter gave the answer away.

What it would take: steering to a form only until it has been asked, which
needs a record of what each learner was asked. That is P-085's machinery, so
P-105b is folded into P-085. The patch is kept at
`held/P-105b-dropped-2026-10-23.patch`.

## P-085 (re-ask missed items): not ready

Still undecided: the order (19 October said most recent miss first, 20
October oldest first); the fallback for a letter with no confusable mate, and
for letter-spotting misses; the shape for a script-track typing miss whose
letters are not all taught; matching boards reporting all four words as
missed, which would fill the cap with innocent words; which lessons
(reviews, practice, woven items); what closing mid re-ask does; and the
generator function it would need. Recorded against P-085.

## What this is not evidence for

Retention, reading speed, or whether recognising a form helps reading. The
review queues were assumed, not taken from a learner's schedule. Nothing was
played.
