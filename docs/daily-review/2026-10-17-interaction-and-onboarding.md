# 2026-10-17 · Interaction and ease of use (area 5), onboarding and first session (area 6)

Reviewed by `qaaf-design` (28 tool calls, about 19 minutes, read-only) on the
a6ce4a1 build from a cold start, and by `qaaf-qa` for last night's changes.
The design bot taps at once, so its times are floors.

## The first five minutes

| Run         | Sign-in to Home | First correct answer            | Lesson 1 finished                                      |
| ----------- | --------------- | ------------------------------- | ------------------------------------------------------ |
| 390, Script | 11 taps, 13.0 s | tap 15, 20.1 s (a letter trace) | 102 taps, 140 s, 42 items                              |
| 390, Roman  | 11 taps, 12.6 s | tap 13, 16.2 s (guess, "Water") | 119 taps, 146 s, 45 items: first Roman lesson finished |
| 320, Script | 11 taps, 11.8 s | tap 15, 18.1 s                  | reached 47/47 (the bot's matching solver stopped)      |
| 320, Roman  | 11 taps, 11.5 s | tap 13, 14.8 s                  | reached 45/45                                          |

Home is one tap closer than on 14 October (11, was 12). In the 320 lessons
no Continue, Finish or Got it sat below the fold.

## P-077, measured: the track screen hides Continue

Bottom of the main button against the screen's height:

- **320x568, choosing a track: Continue is 151px below the fold** (171 with
  "Script first" open, 125 with Roman). Every scroll view hides its
  scrollbar, so nothing says the screen scrolls; the only hint is the cut-off
  "Both together" card.
- 320x568, the goal screen after a pick: 31px below (as on 14 October). Every
  other onboarding screen fits.
- 360x640, the track screen: 16px below (0 with Script open, 44 with Roman).

Narrowed proposal: pin Continue on the track screen when the window is under
700px tall, a 57px button on a footer of the background colour. Against: on
568px the footer takes about 13% of the height and an open card's text
scrolls under it. Smaller: collapse the unselected cards' feature lists,
about 120px. Or reuse last night's "More below" cue (judgement: cheapest,
and it already passed a second check on cards).

## Errors

1. **Offline, a reload shows the browser's "No internet" page.** A lesson
   already open keeps working. Anyone who installs the site and opens it on a
   train sees a browser error, not Qaaf. This is P-016 (a service worker);
   against: cache bugs ship stale builds and need their own check.
2. **A clip that fails to load fails silently**; only the console says so
   (P-028).
3. **Full storage is described as blocked storage.** Both read "This browser
   is blocking storage…"; the advice is the same either way. P-088: name the
   cause from the error.

## Last night's changes, checked by QA

- "More below" showed on every card that runs past the screen in l-1, l-2
  and g-past at 320x568 and 360x740, never on one that fits, went at the
  end and did not return, and never covered a button. Every exercise opened
  at its top.
- The World Urdu Day line showed on 7, 9 and 12 November at 375x667 and
  412x900, and not on 6 November at 23:59 or on 13 November.
- Settings: tapping each row's words flips its switch; Tab gives one stop per
  control.
- Hearts: the first wrong answer on a taught word costs a heart; at 0 the
  "Out of hearts" wall offers a 10-gem refill and "Leave for now". Its
  message gives no time ("Hearts come back on their own after a while").
- Daily Review ran 6 of 6 with right and wrong answers marked.

## What this is not evidence for

Headless Chromium only; no people, screen reader or phone. The bot is a
solver, so "first answer correct" says nothing about a stranger (P-078 still
stands). The "Both together" track and the heritage path were not run; nor
were the Daily Review's end screen and the hearts wall's two buttons.
