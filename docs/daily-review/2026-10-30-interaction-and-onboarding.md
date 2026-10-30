# 2026-10-30 · Interaction (area 5) and onboarding (area 6)

Reviewed by `qaaf-design` (27 tool calls, about 9 minutes, read-only) on the b2501068 build in Chromium, at 390x844 and 320x568.

## Measured

| Route    | Taps to first answered question | Screens                   | Words of instruction before it  | Taps to Session complete |
| -------- | ------------------------------- | ------------------------- | ------------------------------- | ------------------------ |
| Beginner | 15                              | 12 (8 of them onboarding) | 398 (the track step alone: 104) | 86                       |
| Speaker  | 8, to quick-check question 1    |                           | 372                             | not reached              |

- **The first lesson** is 42 steps: 6 letter cards, 31 graded questions and 11 traces.
  - After "Can't trace now" the learner taps it 10 more times in their first five minutes.
  - The link fades in after the trace pad: missing at about 0.7 s, present on the next poll.
- **Q-131 and Q-140 were still open.**
  - Space and the arrow keys did nothing on any radio or tab; only Enter worked.
  - Every item was its own Tab stop.
  - The cause is react-native-web 0.19, which answers Space only on a button.
- **"More below" covered a control at 320x568.**
  - It sat over the quick check's fourth option, so a tap there scrolled instead of answering.
  - It also sat over "You're all set"'s Start learning.
  - It was a regression from the night before: the cue had just been added to every onboarding screen. The goal step's Continue had the same fault on 27 October.
- **A speaker who gets all four quick-check questions wrong** still lands on "50 of 81 lessons done". This is by design (moved ahead), but jarring.

## Built and shipped tonight

**Radio groups and tab bars answer the keyboard (Q-131, Q-140).** The design review specified a hook at eleven call sites. The manager built one web-only handler that works from the ARIA roles instead.

- **Space** chooses.
- **Arrows** move, and in a radio group they also choose. Settings' learning track rewrites the course, so there arrows only move.
- **Tab** treats each group as one stop, by roving tabindex set just before each Tab.

Measured on the built app, first against last night's build:

| Control                    | Last night        | Tonight                          |
| -------------------------- | ----------------- | -------------------------------- |
| Onboarding goal: Space     | did nothing       | chose the goal                   |
| Onboarding goal: ArrowDown | did nothing       | moved to and chose the next goal |
| Onboarding goal: Tab       | stayed on a radio | reached Continue                 |
| Tab bar: ArrowRight        | did nothing       | moved focus, screen unchanged    |
| Tab bar: Space             | did nothing       | opened Review                    |

`check:controls` now drives all three kinds of group. It failed six ways on last night's build.

**Second check** (`qaaf-critic`: a screen-reader user, engineering, the case against): **HOLD.**

- **Blocking:** the first version redirected focus after a Tab, using a flag that a Tab off the end of the page left set. The next click on a radio had focus yanked back to the old choice, and Space then undid the new one.
- **Major:** the tab bar, last on the page, was still three Tab stops.
- **Major:** the check claimed "one Tab stop" without ever pressing Tab on the tab bar.

All three were fixed with roving tabindex. The check now presses Tab on the tab bar, and was seen to fail on the first version. Settings' daily goal now follows the usual radio pattern (a critic minor). Re-check: SHIP. Tab from the tab bar, the Practice shelves, Settings' two groups and the Letter Lab's 40-letter rail all land and leave correctly.

**Onboarding's "More below" is a band of its own under the scroll view,** so nothing tappable can sit under it.

- On a speaker's route at 320x568, last night's build had a quick-check option under the pill on 4 of 4 questions. Tonight's has none.
- The second check passed it, with one major: the band collapsed at the end of a scroll and moved content up to 60px under a finger. A screen whose band has shown now keeps its space; measured, Continue stays at 415.

**A reload after the quick check keeps its score (Q-141).** It resumed on "You're all set", where it used to restart the quick check.

## Recorded, not built

- **After the first "Can't trace now", skip the session's remaining traces (Q-149).**
  - Against: it takes all practice from a learner who skipped only for the moment.
- **Focus on Session complete, Home and onboarding still starts on the page body** (QA). Recorded as Q-150, the same fix as Q-113 on other screens.

## What this is not evidence for

- Real human timing.
- A real screen reader: the handler's interplay with a screen reader's own arrow keys is reasoned about, not heard.
- The Roman track.
- 200% text.
