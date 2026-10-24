# 2026-10-23 · Interaction (area 5) and onboarding (area 6)

Reviewed by `qaaf-design` (32 tool calls, read-only) on the fdc36a7 build, with
`qaaf-qa` for last night's reward changes. Run as general-purpose agents
reading their role files: the machine was rebuilt tonight and the specialist
agent types were not registered at first.

## Fixed tonight

1. **A trace was praised three times, and a failed one "corrected" with
   itself** (Q-078). Passed: "That is the shape ✓", "Nicely done." on the pad,
   then "Beautifully done" on the banner. Failed: the pad's reason, then a
   banner card "The answer: ـت te" showing again the shape already on the
   pad. In a lesson the pad now says nothing on a pass, a refusal keeps its
   reason, and a trace has no answer card. Letter Lab, with no banner, keeps
   the pad's line.
2. **A question's answers could sit under the fold with nothing to say so**
   (Q-075): "More below" now shows on any exercise that runs past the screen
   before it is answered, not only teaching cards.
3. **A repeated lesson paid less with nothing to say why** (QA): the reason
   line now covers the repeat rule too.

## Findings

- **Front door to the first letter: 11 taps and 10 screens** at 390x844 and
  320x568 (door, brand welcome, goal, track, voice, background, daily goal,
  ready, Home, lesson). At 320x568 two of those screens also need a scroll
  to Continue (Q-073).
- **What onboarding's answers drive for a new learner** (from the code):
  the track changes the course; "speaker" brings the placement quiz; the goal
  changes only Home's title and greeting; the daily goal only Home's XP bar;
  the level nothing in l-1. A fresh walk ended with every value but the goal
  at its default.
- **No waits in l-1:** every tap changed the screen in 2 to 24ms. 42
  exercises, 6 of them teaching cards and 11 traces.
- **Strokes drawn after Check do nothing,** with no sign (left in Q-078).

## Proposals

- **P-116: "You're all set" opens the first lesson, not Home** (9 taps, every
  question kept; dropping the repeated welcome, P-107, makes 8). Against:
  Home's path and its hints are first seen after the lesson; leaving a lesson
  that was not opened from Home needs care.
- **P-112, now without dates: the lesson first, the questions after** (1 tap
  to a letter). Against: a Roman-track learner meets Nastaliq first; a
  reading speaker starts at alif; the questions afterwards can be abandoned;
  answering first builds commitment.

## What this is not evidence for

A script's timings with a mouse in Chromium, not touch or a person; synthetic
traces; no screen reader; no learner data.
