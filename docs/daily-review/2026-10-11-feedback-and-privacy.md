# 2026-10-11 · Learning whether it works, without analytics (areas 13 and 14)

`qaaf-learner-voice` asked how small, privacy-respecting learning apps find out
whether they work, and what learners accept (28 tool calls, read-only; a
Clozemaster forum thread, the Guardian Project site and Indie Hackers were
blocked, so those come from search summaries). Qaaf has no analytics and
promises none, and a check enforces that the app contacts no host but its own.

## What learners say

- **What annoys, across many sources and years:** rating prompts that
  interrupt or come back after "no", and after every update; mid-lesson cards
  and exit screens (one evaluation counted seven screens to leave a Duolingo
  lesson; a widely upvoted post calls it "an annoying nagging parent"). One
  language app asked for a rating at first launch, then put up a paywall.
- **What is accepted:** being asked once, at a natural point, with a permanent
  "rate" link in Settings (Apple caps its own prompt at three a year and
  reportedly rejects "do you like us?" gating); opt-in that says exactly what is
  sent (about half opted in at one app, a vendor case study; AnkiDroid's reports
  are opt-in in Settings; Clean Insights asks per measurement and adds numbers
  up on the device); or no telemetry at all, with direct feedback (Mockoon
  removed theirs; small language apps market "no account, no analytics").
- **In-app one-question surveys get more answers than email** (about 13 to 36%
  against 6 to 25%; vendor figures).
- **The problem every approach shares:** people who leave are never asked.
  That is the honest cost of keeping "No trackers" true.

## Proposals

- **P-042, "Your numbers":** a card the learner can read (days active, lessons
  finished, accuracy by unit, reviews due, the last lesson left unfinished)
  with a "Copy" button, and "Email it" once a support address exists. Nothing
  leaves the device unless the learner sends it, and then exactly the text on
  screen; a mailto link contacts no host. Against: few will press it, and those
  who do are the keen ones. A heritage learner gets accuracy by unit, which
  shows where reading breaks down.
- **P-043, one question, once,** on the screen after finishing the alphabet
  unit ("What do you want Urdu for? Read family letters / Speak / Exam /
  Other"), skippable, never mid-lesson, never repeated, kept on the device and
  shown in P-042's text. Against: "once is too much" to some, and exit screens
  show how this grows. Welcome to a heritage learner only if the answer changes
  what the app suggests.
- **P-044, a store rating only after a native release:** the system prompt
  once, after a learner finishes a unit, never at launch, never gated, plus a
  "Rate Qaaf" row in Settings. Not relevant while Qaaf is web-only.

## Not evidence for

Heritage learners' or parents' tolerance for prompts (nothing found); how many
would press "Copy" (the 50% was an opt-in switch, from a vendor). Response
rates are vendor benchmarks with different definitions. Nothing comes from
Qaaf's own learners.
