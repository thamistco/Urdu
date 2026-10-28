# 2026-10-28 · Tester, persona 5: a screen-reader user

The fifth run of `qaaf-tester` (32 tool calls, about 7 minutes, read-only), on
the dd991087 build. A new learner on Script first, using the keyboard only,
read through Playwright's accessibility tree and the live regions. This was
not NVDA, VoiceOver or TalkBack.

## Where they would most likely give up

**Unit 1, lesson 1, about step 12 of 42.** By then every question was missing
something they need:

- **Bare-glyph options** in "Which letter makes this sound?": `بـ` and `پـ`
  in a page with no `lang="ur"`. An English voice says "Arabic letter beh,
  tatweel", or nothing (Q-112).
- **Position questions** about a glyph in a plain DIV with no name.
- **Letter spotting** names its tiles "Tile 1 of 4" to "Tile 4 of 4", with
  nothing to tell them apart (Q-077, P-115). All 6 were answered by guessing.
- **Focus drops to the page body** after every Continue, Got it or skip, and
  the next question is never heard (Q-113).

Score: 14 of 31.

## Other problems, worst first

1. **High: hidden screens stayed in the keyboard order.** From Review, Tab
   walked into Home's controls, which are hidden from a screen reader and so
   silent. Forty Tabs never reached Daily review. **Fixed tonight:** probed at
   0 reachable hidden controls, where there were 87 from Review and 216 from
   Profile.
2. **High: focus goes to the page body on every route change**, and no
   heading takes focus (Q-113).
3. **Medium: Space does nothing on radio buttons.** Enter works. Arrow keys
   do not move the choice, and each radio is its own Tab stop (Q-131).
4. **Medium: 89 Tab presses from the top of Home to the tab bar.** There is
   no skip link and no landmark (Q-132).
5. **Low:** unnamed images (Q-133); tiles' "your answer" and "correct answer"
   hidden by their label; emoji and bare letters read aloud; buttons read
   twice in browse mode (Q-134).

**"Can't trace now"** was reachable by Tab, correctly named, and skipped with
Enter, 11 times.

## What went well

- Answers are announced, and focus moves to the verdict.
- Home's lesson buttons have full names.
- The onboarding radios explain each track.
- Settings is named and in a clean Tab order.
- No focus trap inside a lesson.

## What this is not evidence for

This was not a real screen reader or a blind learner. The run stopped before
a review session, and the Hear buttons were not tested. Next persona: 6, low
vision on a small phone.
