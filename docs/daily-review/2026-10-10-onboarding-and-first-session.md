# 2026-10-10 · Onboarding and the first session (area 6)

Two views. `qaaf-design` walked the first five minutes as three strangers (a
beginner on "both", a heritage speaker, someone choosing the Roman track),
40 tool calls, 15.5 minutes. `qaaf-learner-voice` gathered what learners say
about first sessions and first weeks of other apps, 28 tool calls.

## What the walk found

1. **Bug: the heritage result said "you showed you know" after four wrong
   answers.** The skipped lessons come from answering "I already speak or
   understand it", not from the score. Fixed (7bf4535): it now says what the
   learner said.
2. **Bug: the Roman track was promised the script.** Just after choosing "No
   alphabet", the next screen offered to "get you to the script faster" and
   the speaker's option read "I can't read the script". Fixed (7bf4535).
3. **Bug: the speaker's quick check is in the script** a speaker has just said
   they cannot read: س, پانی and کتاب in Nastaliq, and only "ghar" answerable.
   Not fixed tonight: it needs the questions rewritten for audio or Roman
   (Q-032).
4. **Accessibility:** the letter-spotting tiles are labelled "Tile 1 of 6" and
   say nothing else. Naming the glyph would give the answer away to a screen
   reader; the exercise is visual by nature. Queued with a note (Q-033).
5. **Many taps before the first question:** a beginner meets two welcome
   screens, five choices and "You're all set", then lands on Home, not a
   lesson: 12 taps, 11 to 12 seconds for a bot that clicks at once. "Start
   learning" promises a lesson and opens Home.
6. **The first lesson is long for a first win:** six letters and their traces,
   45 screens and over two minutes (inflated by wrong answers).
7. **320x568:** choosing the Roman track expands its card and pushes Continue
   below the fold; on the goal screen Continue is half cut.

The walk never reached a lesson-complete screen, so it says nothing about the
reason to come back tomorrow beyond the copy: "Come back tomorrow. We'll bring
back what you missed first."

## What learners say about first sessions

- **Doing something early brings people back on day 2:** moving Duolingo's
  sign-up after the first lesson reportedly raised next-day retention 20%
  (vendor blog, no primary source).
- **Too easy at the start makes people quit:** about four sources ("they were
  all too easy", requests to test out of a unit).
- **Script apps sell a fast first read** (Dr. Moku's hiragana "in less than one
  hour"; reviewers say about two). **Going too fast is the other risk:**
  Duolingo Arabic "moves through the writing system too quickly".
- **LingoDeer's kana with stroke order** is praised; one newcomer found the
  first lesson an "information dump".
- No first-session account by a heritage learner was found.

## Proposals

- **P-029, "Start learning" opens the first lesson,** not Home, and the two
  welcome screens become one. For: it keeps the button's promise and removes
  two taps. Against: Home shows the streak and goal, context for a second day;
  the second welcome carries the Roman-track note.
- **P-030, a shorter first letter lesson** (three letters), so the first win
  comes sooner; pair with P-006 for heritage speakers. Against: it changes
  pacing other checks rely on.
- **P-031, read a real word in the first session:** lesson 1 ends with the
  learner decoding a word they already know aloud, such as امی. For: the fast
  win script apps sell. Against: the evidence is mostly marketing; check first
  whether lesson 1 already does it.
- **Test out of a vocabulary unit** (not script units): recorded, not
  proposed; Qaaf already skips basic vocabulary for speakers.

## Not evidence for

No real people. Times are a bot's, so a floor. Wrong-answer rates come from
the probe's picks. Learner research is search summaries, not review counts.
