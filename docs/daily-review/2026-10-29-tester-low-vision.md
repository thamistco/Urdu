# 2026-10-29 · Tester, persona 6: low vision on a small phone

Played by `qaaf-tester` (33 tool calls, about 9 minutes) on the b0cfed4d build. It used a 320x568 viewport with the root font at 32px, the `check:text-scale` method. This is a script playing a persona, not a person with low vision.

## Where this person gives up

**At lesson 1's first trace, step 2 of 42.**

- The grey letter to trace measured 1.33:1 on the cream canvas.
- The instruction sits over it.
- The only way past, "Can't trace now", is visible to screen readers only (P-122, kept by the owner for accessibility).

So a sighted person who cannot see the guide has no visible way on.

**Fixed tonight:** the guide is now 3.15:1. The hidden skip stays as the owner decided. A visible guide gives this learner a way through.

## Other problems, worst first

| Problem                                                                                                     | Severity | Tonight                                       |
| ----------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| Three onboarding screens opened scrolled to the bottom: the question off the top, a greyed Continue in view | High     | Fixed: all seven open at the top              |
| No "More below" on the voice screen (2000px), Profile (4355px) or Review (37,824px)                         | High     | Voice screen fixed. Profile and Review: Q-146 |
| A wrong answer's feedback sheet leaves 193px, hiding the question                                           | Medium   | Q-147                                         |
| The welcome's stats "40 / 2,275 / 350" overlap at 200%                                                      | Medium   | Q-147                                         |
| Settings switches are 40x20px, and their descriptions break mid-word in an 85px column                      | Medium   | Q-147                                         |
| The sign-in screen cannot scroll; Privacy and Terms sit below the fold                                      | Low      | Q-147                                         |
| Text cut off: "20 gems", lesson subtitles, Review titles                                                    | Low      | Q-147                                         |

## What went well

- Nothing scrolls sideways.
- Main buttons are 240x104 or larger, and the tabs are 91x92.
- Answer options are 115x252.
- Feedback is gentle.

## What this is not evidence for

- It reached lesson 1, step 11 of 42.
- Every trace was skipped with a script click a real user could not make.
- Not tested: real tracing, audio, a real phone's text-size setting, and browser zoom.
