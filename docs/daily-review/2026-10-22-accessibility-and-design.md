# 2026-10-22 · Accessibility (area 2) and visual design (area 3)

Reviewed by `qaaf-design` (32 tool calls, about 7 minutes of its own time,
read-only) in Chromium on the 7ea0386 build, with learner voice on what
learners say about large text and screen readers (area 15, below in
`2026-10-22-feedback-and-learners.md`). "200%" is a 32px root font.

**Not reached:** Lesson complete and the track chooser at any size: the
scripted walker answered wrongly, each wrong answer came back, and it was at
18 of 49 after 110 steps.

## Fixed tonight

- **A clipped answer in the banner said nothing about scrolling** (Q-082, from
  the 21 October landscape fix): at 200% in landscape the answer's word and
  meaning sat 131px below its visible top. The banner's answer now carries the
  "More below" pill, without its dark fade. `check:stability` fails with the
  answer clipped and no cue (131px against the old build).

## Findings

1. **Letter spotting is unanswerable by screen reader (Q-077), confirmed.** On
   "Which tile is alif?" (l-1, step 13, پانی) the tiles are named "Tile 1 of
   4" to "Tile 4 of 4", and the label replaces the glyph. Sighted learners get
   little from colour either: the orange letter against its paper neighbours
   is 2.04:1, under the 3:1 needed to tell things apart by colour alone
   (against the tile it is 5.88:1).
2. **Swapping the exercise "when a screen reader is on" cannot work on the
   web:** react-native-web's `isScreenReaderEnabled()` always returns true.
3. **P-101 is smaller than recorded.** Home's row title and the track chooser's
   labels already have a size. At 200% the only unsized bold left on Home,
   Settings, Profile and the banner is the verdict ("Not quite, but that's
   okay"); at 28px it wraps to two lines and the banner grows 59px, Continue
   still on screen for a one-word answer. Lesson complete was not measured.
4. **Profile at 320:** "DAY STREAK" and "TOTAL XP" wrap to two lines and "GEMS"
   does not, so the labels sit on different baselines; a new learner's "This
   week" card is about 160px tall around one sentence.

## Proposals

- **Q-077: name each tile by where it sits in the word,** e.g. "Tile 2 of 4:
  letters 1 to 3 of paani"; decoys "a letter not in paani". A blind learner
  answers by sound and spelling (alif is the "aa"). **Against:** it no longer
  tests recognising the shape, which is the point; shape descriptions would
  give the answer away. Needs a second check before building.
- **P-101: `text-sm` as Bold's default,** once Lesson complete is measured.
- **Profile stat labels:** a fixed two-line height, or "STREAK" and "XP".
  Against: "DAY STREAK" names the unit (Q-085).

## What this is not evidence for

Chromium only; root font size, not OS text scaling; no real screen reader
(Q-077 is read from the page's labels); answers longer than one word; Lesson
complete and the track chooser.
