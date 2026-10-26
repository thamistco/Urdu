# 2026-10-26 · Accessibility (area 2) and visual design (area 3): can a screen-reader user finish Unit 1?

Reviewed by `qaaf-design` (30 tool calls, about 14 minutes, read-only) on the
ead9a94 build, walking Unit 1 by what a screen reader gets (names, roles, live
regions, focus) at 390x844 and 320x568, for launch-bar row R4. QA (40 calls)
added large-text findings.

## Findings

1. **Tracing blocks Unit 1 outright, before letter spotting does.** At l-1
   step 2 the tree holds only Close, Clear (off) and Check (off); the drawing
   area has a name and no role, and Check stays off until there is a stroke.
   About 8 traces each in l-1 and l-1-2. R4 named letter spotting as the
   blocker; this comes first.
2. **Letter spotting** (Q-077, confirmed): tiles named "Tile 1 of 4" to "Tile
   4 of 4"; 5 or 6 a letter lesson. Guessable in Unit 1, where hearts are free,
   but not answerable.
3. **Letter-pick and look-alike options are named by the bare glyph**
   (Q-112): a voice that names Arabic letters hands over the answer; one that
   does not reads nothing. Not tested with a real screen reader.
4. **Results are announced:** every answer reaches the polite region and focus
   moves to the verdict; "Lesson saved…" is spoken when the re-asks start.
   On a new question focus falls back to the page body (Q-113).
5. **The re-asks' header at 200% on 320x568** ended at 252px, 44% of the
   screen, and put the question below the fold; the counter read "Once m…".
6. **Home at 200% on 320x568** (QA): the Start here card squeezed to one
   letter a line, 1,596px tall, its tap point off the screen.
7. **Lesson complete at 200%** (QA): no button on screen, no "More below"
   (Q-111).

## Fixed tonight

- **"Can't trace now"** under every lesson trace (P-122, built from the
  review's proposal, second-checked: see the agents report): moves on and
  grades nothing, shown to everyone since react-native-web always reports a
  screen reader as on.
- **The re-asks' header:** the saved line on the first re-ask only, and the
  counter "1 of 5".
- **Home's card** wraps and keeps its longest word: 466px, its centre on
  screen.

## Proposed

- **P-115, letter spotting by shape:** name each tile by the shape of its
  tinted letter ("a bowl with one dot below"), the same words on the teach
  cards, rather than by position ("letters 1 to 3 of paani"), which tests
  sound-to-spelling and whose decoys give themselves away. About 160
  descriptions to write and check; needs its own second check.

## What this is not evidence for

No real screen reader (the tree and live-region text only), Chromium only,
root font size rather than the system's text size. The walker stalled on
matching in four vocab lessons, so their re-asks were not reached.
