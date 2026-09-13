# Briefing a playtester

`npm run playtest` produces `.playtest/journal.json`: every screen a beginner
saw, in order, with what was asked, what was on offer, what they picked, whether
it was right, and — the column everything else hangs off — whether the app had
ever taught them the thing it was asking about.

That file is evidence, not feedback. The report beside it counts the things that
are countable. This document is the other half: what to hand a person or an
agent so they can say what it was *like*, which is the part no script can
measure.

## The brief

> You are learning Urdu. You have never seen the script before and you do not
> speak any related language. You have just finished a sitting with this app,
> and `.playtest/journal.json` is a record of it: every question you were asked,
> in order, what was on the screen, what you chose, and whether it was right.
>
> Read it start to finish and tell the people who made the app what that hour
> was actually like.
>
> Say what confused you, and be specific about where — the lesson and the
> question, not "the grammar section". Say where you felt you were guessing
> rather than learning, and where something finally landed. Say which wording
> sounded like a machine wrote it: the app is trying to sound like a patient
> teacher, and you are the person who can tell when it doesn't. Say what you
> would change, and what you would have needed in order to learn it better.
>
> Two things you must not do. Do not invent anything that is not in the journal
> — if you want to complain about a screen, it has to be a screen you were
> shown. And keep what happened separate from how it felt: "I was asked for
> پانی four questions after being shown it once" is a fact in the file, and "by
> then I had no idea" is your experience of it. Both are worth having. Run
> together they stop being checkable.

## Reading the journal

Each entry is one screen.

| field | what it means |
| --- | --- |
| `prompt`, `optionText` | what was asked, and what was on offer |
| `picked`, `correct` | what the learner did, and the app's verdict |
| `couldHaveKnown` | whether the app had ever shown them this |
| `how` | `recalled`, `forgot` (shown before, gone now) or `guessed` (never shown) |
| `reveal` | what the app showed after a wrong answer, if anything |
| `gapSteps` | how many questions since this was last seen |

`type: 'ungraded'` entries are not answers. They are screens the driver acted on
and the app did not judge — a harness limitation, recorded so it cannot hide.
Ignore them as feedback; a large count means the run itself is suspect.

## Why the two halves are kept apart

The first full run reported **121 wrong answers where the app revealed nothing**,
which would have been the most serious finding in it. None of the 121 were
answers. The driver was writing down screens the app had never graded, and an
agent handed that journal would have written a confident, detailed, entirely
false account of a course failing to teach.

So: the mechanical half counts only what it can defend, and says plainly when it
has dropped something. The subjective half is asked for opinions and told not to
manufacture facts to support them. A number in the report is checkable and an
opinion is not, and mixing them makes the checkable half worth nothing.

`npm run playtest:selftest` holds the driver's bookkeeping to its contracts. It
is not in `check:all` — playtest is a tool, not a gate — but a journal produced
while that is failing should not be read.
