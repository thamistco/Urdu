# 2026-10-19 · Accessibility (area 2) and visual design (area 3): the answer banner

Reviewed by `qaaf-design` (25 tool calls, about 18 minutes, read-only) in
Chromium on the d87d7f6 build. "200%" is a 32px root font, standing in for
large text. The night's first task was the measurement P-020 has waited for
since 17 October: how much room the answer banner has for a "Report" control.

## The banner, measured (v-first-words, first question, 320x568)

| Answer | Text | Banner     | Verdict row free width | Continue bottom        |
| ------ | ---- | ---------- | ---------------------- | ---------------------- |
| Wrong  | 100% | 256 to 568 | 38px                   | 548, 20px clear        |
| Wrong  | 200% | 96 to 605  | 13px (verdict wraps)   | 569: page scrolls 37px |
| Right  | 100% | no card    | 140px                  | 548                    |
| Right  | 200% | no card    | 92px                   | 532                    |

On a wrong answer the answer card runs 323 to 483 at 100%, with 158px free
beside "THE ANSWER". The banner is pinned to the bottom, so anything added
grows it upward.

Four places for "Report", measured for width and height cost:

- **(a) the eyebrow row:** fails; 16px free at 200%, and a 44px control adds
  32px of height at 100%.
- **(b) the answer card's top-right corner:** fits at both sizes and covers no
  text, but at 200% has 0px clearance from "THE ANSWER", and at 100% its
  bottom sits 5px into the line a full-width sentence answer would use.
- **(c) the lesson header:** fits everywhere with no added height, and on a
  right answer too, but takes the progress bar from 93 to about 49px and
  squeezes the hearts label, already cut to "Fre…" at 200%.
- **(d) the verdict row:** fails on a wrong answer (needs 52px); fits on a
  right one.

The designer's recommendation: (b) on a wrong answer and (d) on a right one,
so it always sits at the banner's right edge. Against: it moves between two
places, has no clearance at 320/200%, and would collide with a long sentence
answer at 100%. Learner voice tonight argued for words ("Something wrong?")
over a bare flag, which needs more width than either (b) or (d) has. P-020 was
not rebuilt tonight; the next attempt starts from this table
(`2026-10-19-agents.md`).

## Fixed tonight

1. **The verdict was never announced** (high). The banner had no live region,
   react-native-web's `announceForAccessibility` does nothing, and answering
   by keyboard disabled the focused tile, so focus fell to the page. A
   screen-reader user heard nothing; a keyboard user's next Tab started from
   the top. Now an always-mounted polite region says the verdict and the
   answer, and focus moves to the banner when it was lost. `check:stability`
   answers by Enter and requires both; against the old build it reports both.

## Found and left for later (backlog)

- **The wrong-answer banner at 200% on 320x568** runs 37px past the screen and
  hides the whole exercise (Q-070). Anything added to it pushes Continue
  further off; this is the real constraint on P-020.
- **`<Bold>` with no size stays 14px at any text size** (P-101): 18 places,
  among them the verdict, Lesson complete's card titles (the 16 October open
  item), TrackChooser and Home. At 200% the verdict is 14px beside a 22px
  eyebrow. A rem default would fix all of them and needs a 200% sweep, since
  tight rows change at once.
- **The answer word stays 26px at 200%** while its gloss grows to 28px (Q-071).
- **The hearts label shows "Fre…" at 200%** (needs 265px, gets 96 at 320 and
  166 at 390); screen readers still hear it all (Q-072).
- **Onboarding's "More below" pill** stays 13px at 200%, and at 200% the track
  screen opens with no option visible; at 100% the pill covers "with the most
  help." (Q-073).
- A choice tile's spoken name has a stray space before ", your answer" (Q-074,
  minor).

## Measured and fine

Verdict 6.26:1; eyebrow (11px) 5.25:1; "New word" (12px) 6.27:1; hearts label
7.76:1; the "More below" pill 11.99:1. Radios expose aria-checked. Close is
44x56.

## What this is not evidence for

Chromium only; large text by root font size, not OS text scaling. No real
screen reader: the verdict finding is read from the DOM and where focus lands,
and the fix is proven the same way. One question and one word (paani) were
measured; sentence answers were not.
