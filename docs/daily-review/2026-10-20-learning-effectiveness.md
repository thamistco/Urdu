# 2026-10-20 · Learning effectiveness (area 4): how P-085 gets built, letter forms, review XP

Reviewed by `qaaf-learning` (25 tool calls, about 12 minutes, read-only).
Scratch tests outside the repository call the real generator and the real
session grading, 30 runs each.

## Findings

1. **There is no Roman word building.** `produceExercise` offers `wordBuild`
   only when a lesson teaches the script, and its tiles are Urdu only. A
   Roman-track miss on typing should be re-asked as word-from-meaning with
   fresh distractors. A Roman syllable-tile exercise just for this is not
   worth building (judgement).
2. **The test written into P-085's spec on 19 October could not fail.** In 99
   simulated lessons, recording the re-asks as ordinary answers changed the
   grades flushed in none, though it changed the pending entries in 96: an
   item wrong at its last sighting ends `again` whatever follows, and the
   first-try and heart guards are already spent on a missed item. Only the
   lesson's right-answer count would show a leak.
3. **Where the re-asks go:** not appended to the lesson's exercises, whose
   identity starts the grade flush, but run as a separate phase after the
   lesson's grades are flushed and `finishLesson` has run, with the answer
   handler returning before any grading, heart or count. `LessonComplete`
   follows the last re-ask.
4. **Letter forms in Units 1–3 are asked about rarely.** Units 1–3 teach 18 of
   the 40 letters. Unit 1's six, taught in two sittings, get 2.1 to 3.3 asks
   per positional form; Unit 2's (se, jeem, che, baRi-he, khe) about 1.1;
   Unit 3's non-joining letters about 2.2 per shape. 68 of 72 letter-form
   cells are asked fewer than 3 times; none is never asked. Letter shape is
   part of how Arabic-script readers code a word
   ([Friedmann and Haddad-Hanna 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC5294257/)).
5. **A Daily Review always paid 20 XP,** even as a repeat: a repeat pays the
   smaller of its XP and 2 per exercise, which for ten exercises is still 20.

## What was tried tonight

- **P-102 built, second-checked and held, then dropped for tonight:** a review
  under the attempted line (3 of 10) earned 2 XP per right answer instead of
  its full XP. The check found it moves the farming rather than stopping it
  (Topic practice pays 18 XP for 9 taps, open to everyone, free of hearts in
  Unit 1), and fines exactly the learner it meant to spare: a returner at 4 of
  20 on the catch-up Home pushes first earns 8 XP instead of 30 and misses a
  Steady day. A fix needs a different rule, a daily cap on practice XP or one
  rule for every practice kind with the catch-up exempt, so nothing was
  shipped. See `2026-10-20-agents.md`.

## Proposals (backlog)

- **P-085** gains its wiring and a test that can fail: drive the grade flush
  with a spy, and require each item graded once before the re-asks start,
  nothing applied after, and the right-answer count unchanged; break the guard
  and watch it fail. Ask the oldest misses first, to make the gap longest.
  **Against:** up to 7% longer lessons; a re-ask within 2 minutes is close to
  copying ([Pyc and Rawson 2009](https://doi.org/10.1016/j.jml.2009.01.004)).
- **P-105 (new):** a second sitting for the letter lessons of Units 2 and 3,
  as Unit 1 has, until every joining letter's forms are asked at least 3
  times. **Against:** naming a position is labelling, not reading, which comes
  from letters in words (letter-spotting, Read faster); and it lengthens the
  path, against P-046. The threshold of 3 is from Rawson and Dunlosky's
  criterion work and could not be confirmed from the abstract.

## What this is not evidence for

Recall, automatic reading, or motivation. The letter counts assume an empty
review queue; the upper bound assumes only letters fall due. Which form
letter-spotting shows was not counted. The Roman re-ask chain was not played.
