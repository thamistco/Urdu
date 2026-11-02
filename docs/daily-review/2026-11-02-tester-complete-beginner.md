# 2026-11-02 · Tester, persona 2: complete beginner

Played by `qaaf-tester` (38 tool calls, about 17 minutes) on efd39717, 390x844. Covered onboarding, all of lesson 1, all of lesson 2, and a mistaken tap on a locked review.

## Where they would give up

**"Which tile is alif?" in lesson 1, step 13 of 42 (Q-180).**

- Nothing explains that the tiles are the word cut into pieces, or that the orange part is the letter.
- At 390px the tiles wrap into a 2x2 grid, and the answer then says "the third tile from the right", which matches nothing on screen. It means the bottom right: the tiles run right to left and wrap.
- Lesson 1 asks this four times, and the script got three wrong.

## Other problems, worst first

1. **Medium–high: hearts are never explained (Q-181).** The only words are a badge saying "Free until Unit 1 is done". That can read as the app being free until Unit 1, a paywall to come. Tapping it does nothing, and the test-out's "No hearts" assumes the word is known.
2. **Medium: te and Te differ only by a capital letter (Q-182).** "ṭ (hard)" is not explained.
3. **Medium: lessons 1 and 2 are 42 and 49 steps,** each with a re-ask round, against an 8-minute daily goal. This is the known length issue (Q-117, P-046).
4. **Low–medium: onboarding uses words before explaining them.** "Nastaliq" is unexplained, and "Roman" is explained only on the next card (with Q-173).
5. **Low: near-synonym guesses, and emoji on some options and not others,** on lesson 2's guess-first questions (Q-183).
6. **Low: the test-out's lesson count looked wrong.** "6 lessons" while 7 looked unfinished. A test-out counts only lessons that teach words or letters on this track, so the phrases lesson is not counted. That is correct, but it is unexplained (Q-178).
7. **Low: a lesson left on a typing question reopened one step later (Q-184).** If its answer had been checked, this is correct, but it was not confirmed. The Start-over dialog leaves the buttons behind it in the accessibility tree.

## What went well

- A mistaken tap on a locked review is easy to undo: "Not now" returns Home with nothing changed.
- Wrong answers are kind and show the answer.
- Typing accepts forgiving spellings.
- Lessons pick up where they were left.
- Every trace has "Can't trace now".

## What this run is not evidence for

- A script tapped the first option.
- Traces were straight lines.
- Lesson 2 ran across three sittings.
- No audio was heard, and no real time on task was measured.
- 320px and the Roman track were not tried.
- A script is not a beginner.
