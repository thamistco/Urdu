# 2026-10-29 · Accessibility (area 2) and visual design (area 3): the R4 fixes

Reviewed by `qaaf-design` (28 tool calls, about 5 minutes, read-only) on the b0cfed4d build in Chromium, at 390x844 and 320x568. Persona 6, low vision on a small phone, played the same build; see its own report.

## Findings, ranked by how much each moves R4

R4 is "a screen-reader user can complete Unit 1".

1. **Q-113: focus fell to the page on every step.**
   - Walking l-1 by keyboard, every Got it, Continue and "Can't trace now" left focus on the body: 12 of 12 transitions.
   - The lesson had no headings and no landmarks. Answering did move focus to the answer banner.
2. **Q-112: answer tiles are named only by a glyph** (`‏ا`, `‏تـ`), with no `lang`.
   - Naming a tile by its letter would give the answer away.
   - The proposal is a per-letter shape description ("bowl, three dots below") written as content, with a "Can't see this" skip for position questions.
3. **Q-131: onboarding radios.**
   - Space does nothing, and arrow keys do not move between choices.
   - The cause is react-native-web 0.19.13, which accepts Space only on buttons.
   - The proposal is a shared `useRadioGroup` with a roving tabindex. In Settings, arrows should move focus only, since choices there apply at once.
4. **Q-132: 88 Tab presses on Home to reach the tab bar.**
   - There is no `main` landmark and no skip link.
   - Against: Unit 1's Start card is already about the third Tab stop.
5. **Letter-pick glyphs are tiny.**
   - At 32px, be's start form is 8x21px of ink in a 168x122 tile, and its dots are about 4px.
   - The proposal is 56px, after checking the widest form fits a 136px tile at 320 wide.
6. **Contrast passed everywhere measured.**
   - The lowest was locked lesson titles at 4.66:1.
   - These were read from screenshot pixels, so they are approximate.

## Built and shipped tonight

**Q-113, each step puts focus on its question** (bug fix).

- Questions and the teaching cards' titles are now headings.
- `useStepFocus` moves focus to the step's heading when focus has been lost, falling back to the "12 of 42" counter.
- Measured with the same keyboard walk:

  | Build        | Step changes | Focus left on the page | Focus on the step's heading |
  | ------------ | ------------ | ---------------------- | --------------------------- |
  | Last night's | 19           | 19                     | 0                           |
  | Tonight's    | 19           | 0                      | 19                          |

- The first build also took focus from the answer banner after an answer. `keepFocus` ran a late frame after it had been stopped; it now does nothing once stopped. All 11 answers in the walk then focused the banner.

**The trace guide at 3:1** (persona 6, bug fix).

- The letter to trace measured 1.33:1 on parchment. It is now 3.15:1, the minimum for a graphic the task needs.
- The learner's own stroke still stands out from it at 4.26:1. Both were computed from the palette.

**Every onboarding screen opens at its top, with "More below"** (persona 6, bug fix).

- At 320x568 with text at 200%, three screens opened scrolled 734 to 1,364px down, and four had no cue.
- Tonight all seven, on a beginner's route, open at 0 and show the cue. The quick check, on a speaker's route, was checked by `check:controls`.

## Not built tonight, and why

- **Q-112:** needs about 40 shape descriptions written and checked by `qaaf-content`.
- **Q-131:** a shared hook across eight radio groups, and Settings needs focus-only arrows. It needs a night of its own and a second check.
- **Q-132:** worth doing, but it barely moves R4.
- **Glyph size:** needs the 320px fit measured first.

## What this is not evidence for

- No real screen reader was used, so whether the heading is read out on focus is unverified.
- Not covered: the review session, Hear buttons and the 320 lesson.
- Chromium only.
