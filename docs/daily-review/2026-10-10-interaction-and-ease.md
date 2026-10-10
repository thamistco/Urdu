# 2026-10-10 · Interaction and ease of use (area 5)

`qaaf-design` drove the deploy-shaped build at 390x844 and 320x568 (40 tool
calls, 11 minutes).

## Speed

A returning guest is one tap from the first question of the next lesson
(2.0 s at 390, 3.0 s at 320, from navigation, including boot). Daily Review is
one tap from Home's due card, two through the Review tab. The Letter Lab's
back button is 74x44.

## Findings and what happened to them

| Finding                                                                                                  | Outcome                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Closing a lesson lost it, with no warning,** and reopening started at 0                                | Fixed (fa0e6fd): once anything is answered, ✕ asks "Leave this lesson?"; a check proves it                                       |
| **Q-016:** خوش آمدید (9 characters) took the 56px size, needed 230px of 228, and wrapped                 | Fixed (986b421): a space or 9+ characters takes 36px (148px, one line). The fourth answer is still 2px below the fold at 320x568 |
| Offline, a voice clip fails silently: no sound, no message                                               | Proposal P-028                                                                                                                   |
| Home's scroll on reopening hides the cards above the path                                                | Noted; the scroll is deliberate (it reveals the current lesson). A welcome back now stops it (P-011)                             |
| Learning track is buried: 4 taps and 2 scrolls via Profile → Settings                                    | Queued Q-030                                                                                                                     |
| At 320, wrong-answer feedback scrolls the prompt under the header; a typed answer shows the answer twice | Queued Q-031                                                                                                                     |
| The typing input is 246x29 inside a box that looks 280x54                                                | Queued with Q-031                                                                                                                |
| The pretest ("Which word means this?" over unseen words) does not say it is a guess                      | Queued with Q-031                                                                                                                |

## Proposals

- **P-028, say when sound fails.** An inline note with a live region ("No
  connection, so sound is off for now") when a clip fails, and a listening
  question that can be skipped at no cost. Against: offline is rare for a
  website, and the device-voice fallback was removed on purpose for quality.
- **Two-by-two answers under 600px tall**, to win the missing 76px on the
  smallest phones (with Q-016). Against: crowds 134px-wide tiles.

## Not evidence for

Headless Chromium only: no real device, no screen reader, no slow network;
timings from a local server, not the Pages CDN. The hearts wall was read in
code, not reached (hearts are free in unit 1 by design).
