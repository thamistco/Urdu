# 2026-10-13 · Accessibility and design: today's new screens (areas 2 and 3)

`qaaf-design`, 43 tool calls (3 over its 40), 11 minutes, read-only, on the
deploy-shaped build. It looked only at screens added today, which no design
review had seen: the out-of-hearts screen at lesson start, the "Hearts are on
from here" card, the crash screen, the Roman-track letter message, the
lesson-not-found page and the storage-blocked banner. 180x400 stood in for
200% text on a 360px phone; "t32" is a 32px root font at 390x844.

## Bugs, all fixed tonight

| Found                                                                                                                                                                                                             | Fix                                                                                                             | Commit  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------- |
| Six gate screens could not scroll. At 180x400 the crash screen's "Start again on this device", the one way out of a crash loop, sat at 405–507 px in a 400 px window; the Roman-track message's heading at −74 px | `Screen` gains `fill`: scrolls, and still centres when short. The four lesson gates and the crash screen use it | 08b9be7 |
| On lesson complete, the pinned footnote drew over the cards: at 320x568 it met the streak card, at t32 "A tough one"                                                                                              | The screen scrolls, the footer follows the cards, and the footnote is dropped when "A tough one" says it        | 9cf941d |
| Sign-in said "Your progress is saved on this device" under a banner saying it won't be kept                                                                                                                       | The line says progress lasts until the page closes when storage is refused                                      | f03df32 |
| Decorative pictures announced as bare, unnamed "image"                                                                                                                                                            | `Illustration` is aria-hidden; each sits beside words that say what it means                                    | f0b4419 |
| "Hearts are on from here" always said "You have 5" (from the code)                                                                                                                                                | It says the hearts held                                                                                         | 8cbfc3d |

Not reached: the build retry state ("Not quite. One more try."); the driver
met no build question in two lessons. QA reached it on sentence builds.

## Measured and fine

Every text on these screens is at least 4.76:1 (the disabled Refill; body
6.27:1, buttons 7.59:1). Every target is at least 51 px tall. The crash
screen and the storage banner have role=alert. Nothing runs off the side at
320 or 390.

## P-013, second check: SHIP

The tick and cross on marked answer tiles (built tonight from the 10-07 and
10-09 first checks) went to `qaaf-critic`, from a low-vision learner at 200%
and 320 px and from every place a tile is marked: SHIP, no blocking or major
findings. It verified the badge never covers Urdu or a gloss, never enters the
spoken name, and appears only on 'correct' and 'wrong'. Its two minors, the
tick hiding under the header once the board scrolls and touching the next
tile at 200%, were one fix: the badge now sits 4 px inside the corner
(a1fc10c). Its fourth minor stands: nothing automated pins the badge.

## Proposals (checked once)

- **P-072** Give `Heading` the heading role, so a screen reader can jump by
  heading. For: the fastest way to learn where you are; one line for the
  whole app. Against: decorative headings become stops; every use needs an
  audit, and checks reading the accessibility tree change.
- **P-073** At 0 hearts with too few gems, replace the disabled "Refill · 10
  gems" with text and one "Leave for now". For: a disabled orange button
  reads as a paywall; one less control that does nothing. Against: the price
  tells the learner a refill exists and what it costs, and the paragraph
  already gives the gap and the wait. Leave unless testers stumble on it.
- The opaque pinned footer it proposed is superseded by the scrolling fix.

## What this is not evidence for

Chromium only; no screen reader or phone. Text size was simulated by page
size and root font, not iOS Dynamic Type. The hearts-count bug was read from
the code, not seen.
