# 2026-10-14 · Ease of use, onboarding and the first session (areas 5 and 6)

`qaaf-design`, 44 tool calls (4 over its 40), 12.2 minutes, read-only, on the
deploy-shaped build. Every run started cold at the welcome screen, without
the test helper that skips setup.

## The first five minutes, measured

A bot that taps at once, so these are floors.

| Learner          | Taps / screens to Home               | First correct answer         | First finished lesson                     |
| ---------------- | ------------------------------------ | ---------------------------- | ----------------------------------------- |
| Script beginner  | 12 / 9                               | tap 16, screen 12, 25 s      | tap 102, 88 screens, 113–116 s (42 items) |
| Heritage speaker | 16 (adds the 4-question quick check) | tap 20, 31.6 s               | the same lesson 1                         |
| Roman track      | 12 / 9                               | tap 14 at 390; tap 25 at 320 | not measured: the probe cannot type       |

Home adds one tap ("Start here"). Lesson 1 is now five letters, down from six.

## Bugs

| Found                                                                                                       | Outcome                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| After a wrong first Check on a word build at 320x568, "Try again" sat 149 px below the screen               | Fixed (36b3b95): the retry asks the lesson to scroll to its foot. Measured after: 497–514 px on a 568 px screen (was 651–671)                                |
| The grammar-teach card seemed to open with its top cut off                                                  | Not reproduced: opened cold at 390 and 320, the card starts at the top (scroll 0). The probe had most likely tapped the reveal, which scrolls down by design |
| Lesson complete at 320: Continue 18 px below the fold                                                       | The screen scrolls since 9cf941d; left as is                                                                                                                 |
| Still open from 10-10: at 320 the goal and track screens' Continue is below the fold (31 px and 125–149 px) | Proposal P-077 below                                                                                                                                         |

## Q-063, measured again

"Got it" on a letter-teach card is still 193 px below the fold at 320x568,
with nothing to say the screen scrolls. Word-teach and grammar-teach cards
fit.

## Other friction

- On the Roman track the first graded screen is a guess over four unseen
  words; at 320 the bot's guess was wrong, so the first answer in the app was
  "Not quite". It is labelled "take a guess, it costs nothing".
- At 320 the out-of-hearts refill button wraps to two lines, and "Hearts come
  back on their own after a while" does not say when.

## Proposals (checked once)

- **P-076** Pin the main button of teaching cards to the bottom, the footer
  the answer screens already use (Q-063). For: the next step is always on
  screen; one footer for every card. Against: about 89 px of a 568 px screen,
  so the letter forms scroll under it, and a learner can tap through without
  looking. Smaller alternative: four 64 px tiles in one row saves about 130 px
  but leaves "Got it" about 60 px under.
- **P-077** Pin Continue on the goal and track onboarding screens under 600 px
  tall. For: it closes 10-10's #7 with the same pattern. Against: the expanded
  track card's text scrolls under it.
- **P-078** On the Roman track's first lesson only, teach a word before the
  first guess. For: the first answer is more likely a win (with P-029 and
  P-030). For keeping it: guess-first is deliberate and labelled free.
  Against: nothing measures that a wrong first guess makes anyone quit.

## What this is not evidence for

Headless Chromium only: no real people, screen reader or phone. The heritage
quick check was answered with the first option each time; the Roman lesson
was never finished; the hearts wall was reached by seeding progress.
