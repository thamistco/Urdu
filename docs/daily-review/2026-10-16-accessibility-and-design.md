# 2026-10-16 · Accessibility (area 2) and visual design (area 3)

Reviewed by `qaaf-design` (38 tool calls, about 19 minutes, read-only) in
Chromium on the 3999175 build, and by `qaaf-qa` for headings and tap sizes.
"t32" is a 32px root font at 390x844, standing in for 200% text.

## Fixed tonight

1. **An exercise opened scrolled down, with its top above the screen.** The
   lesson body is one scroll view and every answer scrolls it to the end, so
   the next exercise opened where the last finished: at 320x568 the alif-madda
   card opened 261px down with the letter, its name and its sound button above
   the screen; in landscape, 225px; at 360x740, 110px. Each exercise now opens
   at its top. Measuring it found a second cause: the answer's own glide to the
   end starts 120ms after the answer, so a quick Continue let it land on the
   next exercise (5 to 34px); that timer is now cancelled and the top set again
   a frame later. `check:stability` walks g-past at 320x568 and reads the scroll
   position each time the step moves; with the fix removed it reports 106 to
   116px. Its first version passed on the broken build, because a letter card
   is followed by a tracing exercise that fits the screen; it was rebuilt
   around g-past before it was trusted.
2. **Headings on the screens used most.** Home, Practice, Read faster, the last
   onboarding screen and every screen with a top-bar title (Settings, Privacy,
   Terms, Achievements, League, Credits, Licences) now announce their titles as
   headings (Q-066). `check:controls` fails if Home or Settings has none; on the
   previous build it reported both.
3. **Lesson complete at large text.** "ACCURACY" and "+60" ran out of their
   87px tiles at t32. The row now wraps, each tile at least 5rem, so three still
   fit on a 320px phone at normal size (264 of 280px).
4. **Tap sizes (QA):** Settings' switches were 40x20 with nothing around them;
   a row's words now toggle it too, and the switch stays the one control a
   screen reader or keyboard reaches. Letter Lab's Previous and Next were 20px
   tall; now 44. A Roman word placed in a sentence was 41px; now 48.

## Measured and fine

- Tick and cross marks: cross on its tile 4.49:1, ink cross on rose 5.75:1;
  tick 5.67:1 (token against sampled tile), ink tick on jade 7.66:1; both 6px
  inside the tile.
- The Hearts badge at 280px reads "Free", 7.79:1.
- The lowest text measured: "Unit 1" on Home, 12px, 4.58:1 (passes AA).
- Nothing runs off the side at 280, 320 or 390.
- There is one, dark, theme; no light mode to measure.

## P-076, "More below": built, second-checked and shipped tonight

Overflow of the letter card, measured (the scroll area is 48px shorter than
the window):

| Size    | Letter | Content / visible (px) | "Got it" bottom below the fold |
| ------- | ------ | ---------------------- | ------------------------------ |
| 320x568 | alif   | 745 / 520              | 193px                          |
| 320x568 | pe     | 701 / 520              | 129px                          |
| 360x740 | alif   | 821 / 692              | 97px                           |
| 360x740 | pe     | 737 / 692              | 13px                           |
| 844x390 | alif   | 595 / 342              | 221px                          |

Nothing said the card scrolled: the scrollbar is 0px wide, and at 320 the fold
lands under the forms grid, so the card looks finished. The spec: on a
teaching card more than 24px past the visible area, a 40px fade and a 44px
"More below" pill (a button, "Show the rest of the card"); a tap scrolls 80%
of the view; it goes once less than 24px is left and does not return for that
card. Built on `claude/proposal-076-more-below`; measured on the build, one tap
reaches the end at 320x568, 360x740 and 844x390, and at 412x900 there is no
cue. Against: one more control on the first screen; the cut-off sentence at
360 already hints; the pill overlaps the bottom of the forms grid until tapped.
The second check held it once (the cue never appeared after a lesson's first
card, and the check could not see that), then said SHIP; see
`2026-10-16-agents.md`.

## Proposals left open

- Card titles on Lesson complete stay 14px while body text beside them grows
  to 24px at t32 (finding 3, second half). Not reproduced in the source, which
  sizes them in rem; wants a look on the next design night.

## What this is not evidence for

No screen reader, no phone, Chromium only; text size by root font size, not
Dynamic Type. Not reached: the "Start again on this device" page, the "lessons
marked as known" card on screen (its colours computed from tokens: 9.58 to
13.31:1 titles, 5.64 to 7.27:1 small text), Lesson complete at 390 and 320.
