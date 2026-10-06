# 2026-10-07 · Accessibility and visual design (areas 2 and 3)

First review of both areas. `qaaf-design` drove the deploy-shaped build at
390x844 and 320x568 and measured contrast by compositing each text's alpha
over a screenshot of its real background with the text hidden. Its
screenshots and raw audit are in the session scratchpad (`design-1007/`), not
the repository.

## Found and fixed tonight (bugs ship at once)

| What                                                                                                              | Measured                                                      | Fix                                                                                       | Commit  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------- |
| `hitSlop` does nothing on the web (react-native-web's Pressable ignores it), so buttons written to be 44 were not | Close lesson 20x32, play 30x30, Back 74x32, Say it back 24x24 | `src/lib/reach.ts`: padding plus a matching negative margin; `check:controls` measures it | 6a450bc |
| On switches drew Material teal #009688, the one colour outside the palette                                        | 1.59:1 on the gold track                                      | `activeThumbColor`                                                                        | 168dc5a |
| The voice picker showed the chosen voice by border alone                                                          | no `aria-pressed` in the DOM                                  | `aria-pressed`                                                                            | 168dc5a |
| Romanised Urdu under a word on parchment, the line learners lean on most                                          | 3.63:1 at 12px                                                | ink at 0.65: 4.88:1                                                                       | 5102ab6 |
| "Today's word" label                                                                                              | 3.15:1 at 11px                                                | 4.88:1                                                                                    | 5102ab6 |
| "Draw over the grey letter"                                                                                       | 2.41:1 at 12px                                                | 4.88:1                                                                                    | 5102ab6 |

## Found and not fixed tonight

Queued in `BACKLOG.md` with the evidence:

- **Large text breaks Home (Q-014).** At 1.5x root text the headline splits
  mid-word ("Spea / k") because the streak and gem pills sit beside it and
  squeeze it; at 2x it is one letter per line, and the Letter Lab tile renders
  empty. Fails WCAG 1.4.4. `check:text-scale` exists and did not catch it, so
  the check needs looking at as well as the screen.
- **Settings switches are 40x20 targets (Q-015)** and the row around them is
  not pressable. Making the row the control without nesting a switch inside a
  button needs care; not rushed tonight.
- **At 320 wide, a two-word prompt pushes three of four answers below the
  fold (Q-016),** and "Got it" on a new-letter card sits below it too.
- Smaller contrast misses: "all 40 letters" 3.7:1 at 10px, the Practice topics
  count 4.09:1, the disabled "Buy one" button 2.66:1 (exempt as disabled, but
  it carries the price). In Q-014's pass.

## Proposals, not built tonight

1. **Ticks and crosses on answer tiles, not only red and green borders.** For:
   deuteranopia reads the two borders as near the same. Against: the feedback
   sheet already says the answer in words, and 320-wide tiles are crowded.
   Needs a colour-blind simulation before it is more than a hunch.
2. **Emoji pictures on light tiles, or drawn icons.** Dark emoji such as 📞
   measure 1.31:1 on the dark tiles. Against: emoji differ by platform (only
   headless Linux Noto was seen), and drawing 2,279 pictures is a large cost.
   Light tiles alone may do.

## Checked and fine

Tab order follows the visual order with a visible focus ring; every control
has a name; tabs carry `aria-selected`; Letter Lab uses radios with
`aria-checked`; right and wrong answers are announced in words; no horizontal
scroll at 2x.

## Not evidence for

- No real screen reader or phone. Text size was simulated by raising the root
  font size, which is the browser's setting, not iOS Dynamic Type.
- The lesson-complete screen was never reached (the driver stalled on a
  matching exercise), so it is unaudited.
- The 44pt fix is measured by `check:controls` for the lesson's close and play
  buttons only; the other sites were changed the same way but are not
  measured by a check.
