# 2026-11-01 · Tester, persona 1: heritage speaker who cannot read

Played by `qaaf-tester` (40 tool calls, about 12 minutes) on the 3e4b7b98 build. Fresh store, 390x844, Script first track. This persona understands spoken Urdu but cannot read it.

## Where they would give up

**Unit 2's "test out" asked only letters they were never taught (Q-169).** At onboarding they said they speak Urdu, so every family-word lesson was already marked known, and the only one left in Unit 2 was "The jeem family". The opening asked "Already know this unit?", and they do know family words, so they started. All 4 questions were "Which letter makes this sound?" on letters never shown. Result: "0 of 4 · 0% · A tough one", next to +30 XP, "Goal met" and an achievement. The unit they know told them they had failed.

The opening's heading now names the one lesson when only one is left, and "about 1 minutes" is fixed. The rest is recorded.

## Other problems, worst first

1. **High: script is never tied to the sound of words they already know (Q-170).** "Which tile is pe?" shows باپ with "Father" under it, but no speaker and no Roman, so "that's baap!" never happens. This is the bridge this persona needs.
2. **High: "I already speak it" marks 50 of 81 Beginner lessons known (Q-171).** That is every First words, Greetings and Family lesson. For someone who cannot read, those are the easiest reading practice there is. The skip is right on the Roman track, and wrong for a non-reader on Script first. This is a design question for the learning review.
3. **Medium: the quick check can say "You already read some Urdu" after a lucky 4 of 4 by guessing (Q-172).** The app still asks before skipping the alphabet, and defaults to keeping it.
4. **Medium: lesson 1 is 42 steps and 5 re-asks for 6 letters,** with 10 traces and "which one is alif madda?" four times. This is the known length issue (Q-117, P-046).
5. **Low: onboarding wording.** "Nastaliq" is unexplained. The track screen recommends Both after the goal "Read & write it". The order the letters are taught does not match the card's list (Q-173).

## What went well

- The sign-in screen says "Speak Urdu? Now read it.", which speaks straight to this person.
- "Do you already know some Urdu?" is asked in plain words.
- The alphabet skip is offered, not forced.
- A half-finished lesson picks up where it was left.
- Wrong answers show the right one with a plain note.
- Hearts are free in Unit 1.

## What this run is not evidence for

- Only Script first, lesson 1 and the Unit 2 test-out were covered.
- Answers came from a script that taps the first option.
- The 4 of 4 was luck, not a measured rate.
- Nothing was heard.
- A script playing a persona is not a person.
