# 2026-10-09 · Accessibility and visual design, second pass (areas 2 and 3)

`qaaf-design` drove the deploy-shaped build with playwright-core (39 tool
calls), measuring contrast by hiding the text, taking the most common ground
pixel and compositing the text's alpha and its ancestors' opacity over it.
QA's bug hunt found the large-text problems below.

## Did the 2026-10-07 fixes hold? Yes, on the built site

- No control on Home under 44 in either dimension at 390; on Settings only the
  five switches (Q-015).
- Switch on: gold track, cream thumb, teal gone; thumb on track 2.04:1 (was
  1.59), track on card 5.88:1.
- Contrast as claimed: "zindagi" 4.88:1 at 12px, "Today's word" 4.88:1 at 11px,
  "XP to level" 4.76:1.
- Large text (Q-014) fixed at 1.5x and 2x on Home.

## Fixed tonight

| What                                                                                          | Before                                               | After                                       | Commit  |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- | ------- |
| New-letter card's "Got it" below the fold (Q-016, part)                                       | 247px below at 320x568, 175 at 360x640               | On screen at 360x640; 61px below at 320x568 | 8a17201 |
| "all 40 letters" on the Letter Lab tile                                                       | 4.03:1 at 10px                                       | 5.12:1 on the same measured ground          | e332bcf |
| Profile stat tiles at large text: "0/40" ran into "0/2279", labels spilled                    | Collided                                             | One wrapping grid: three, two or one a row  | 9a12ec7 |
| Practice at large text: topic names cut to "Firs…", tabs ran together, "37 sets" off the edge | Cut or off-screen 483 times across the three screens | 0                                           | 9a12ec7 |
| The Recommended badge ran off the screen over "Both together"                                 | Off-screen at 2x                                     | Drops under the title, sentence case        | 9a12ec7 |

The letter card packs tighter under 700px tall: a smaller letter with its name
and speaker on one line, the example word on one row, and alif's four-line
"Middle" hint cut to its fact, since the note below says why. The large-text
count covers Profile, Practice and Settings at 320 and 390 wide and 16, 24 and
32px text; it cannot see one label overlapping another, so Profile was checked
by screenshot. A side effect: 42 topic names cut off at 320 wide at normal size
now take two lines instead.

## Still open, worst first

1. **Q-016, the rest.** A two-word prompt at 320x568 (خوش آمدید) puts three of
   four answers below the fold: 9 characters gets the 56px size and wraps to two
   lines. Proposal: size by width, or step down when the prompt has a space, and
   cap the prompt card under 600px tall; measure that 36px fits one line first.
   The letter card is still 61px over at 320x568.
2. **Q-023,** Home's level card at 2x: "0 / 60 XP to level 2" in a 53px column,
   one word a line; the daily bar shrinks to nothing.
3. **Q-015,** Settings switches are 40x20 and their rows are not pressable;
   tapping "Reduced motion" does nothing (measured).
4. **Colour-blind simulation** (Machado 2009, severity 1): under deuteranopia
   the right and wrong tile borders are 1.08:1 apart, two beige outlines; under
   protanopia 1.94:1. The sheet still says right or wrong in words and icons,
   and names the answer, so the result survives; which tile was yours does not.
   That is P-013, ticks and crosses on the tiles.
5. **New, from tonight's fixes:** at 320 wide and 2x the badge overhangs its
   card, which Settings nests to 158px wide (Q-027); Home's lesson subtitles end
   in an ellipsis at 1.5x (Q-026), and lifting their one-line limit would weaken
   `check:row-fit`.

## Not evidence for

No real device, no screen reader, no iOS Dynamic Type: 2x means a 32px root
font. The colour simulation is a model, not a colour-blind viewer.
