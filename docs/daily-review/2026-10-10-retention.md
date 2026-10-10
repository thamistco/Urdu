# 2026-10-10 · Retention and habit, second pass (area 7)

`qaaf-growth` was asked one question: which single retention change should a
web-only Qaaf, with no server notifications, build next? 29 tool calls; some
sites were blocked, so some facts come from search summaries.
`qaaf-learner-voice` added what learners say about first weeks (28 calls).

## What it found

- **When a streak breaks, Qaaf says nothing.** `rollStreak` sets it to 0 and
  keeps no record of what it was; Home shows a flame with 0. The best streak
  appears only on Profile. Meeting the daily goal shows an 11px "Goal met ✓"
  on Home and nothing on the lesson's end.
- **Web push** works on iPhone only for a site added to the home screen (iOS
  16.4 and later) and still needs a push subscription and a server; Chrome's
  Notification Triggers, which could have scheduled one without a server, never
  launched. Opt-in runs at about 5 to 8% of visitors (vendor figures).
- **A broken streak shown as broken lowers later engagement** more than one
  that holds, even for identical behaviour, and most when people blame
  themselves (seven experiments; CU Boulder). The authors advise against
  pointing at the lapse.
- **Competitors:** Duolingo ran a free streak revival in June 2026 and says
  losing a streak is a common reason people stop returning; Drops relies on a
  home-screen widget.
- **Heritage learners** report shame, guilt and doubts about authenticity, worst
  in writing, which is what Qaaf teaches.
- **First weeks, from learners:** doing something in the first session brings
  people back on day 2 (one vendor figure, +20% for Duolingo moving sign-up
  after the first lesson); "too easy" makes people quit; about a third of app
  users in one survey quit for no visible progress, boredom, too many
  notifications or burnout. No figure is Qaaf's.

## Decided and built: P-011, a welcome back

Chosen over web push (a server, an install on iPhone, and about one learner in
twenty), a calendar reminder (fires whether or not the learner practised) and a
goal-met moment (no evidence found).

When a streak of 3 days or more breaks while the learner is away, Home shows:
"Welcome back. You'd built a 12-day streak. You've learned 28 words and 12
letters. One lesson today starts a new streak." It says what was built and
learned, never what was missed; letters are left out on the Roman track. It is
set once, goes when a lesson is finished, and keeps Home from scrolling past it.

- **Second check, `qaaf-critic`,** from a lapsed heritage learner and a child,
  and from data and sync: **HOLD** for one line. A 1-day streak got "You'd
  built a 1-day run", praise that reads as hollow to the learner most likely
  to lapse. Now 3 days or more; "streak" as everywhere else; "You've learned",
  since after weeks away many words are due again. Measured in the browser
  across eight cases (lapsed, reopened, played yesterday, freezes covering the
  gap, too few freezes, Roman track, 320 wide, brand new) and found the rest
  sound, including old saved progress with no such field, Reset, and the
  placement skip, which does not inflate the count.
- **Re-check: SHIP,** measured again across eight cases including streaks of
  1, 2 and 3 (d72375d).
- `check:controls` now reads Home after opening: a 12-day streak lapsed 5 days
  is welcomed back; a freeze-kept one and a 2-day one are not.

## Queued

- At 320x568 the welcome back pushes the Continue card mostly under the tab
  bar (Q-034).
- A cloud copy uploaded before this change, adopted on another device, can
  leave a stale welcome beside a live streak until a lesson is finished: rare,
  needs sign-in and two devices (Q-034).
- A goal-met line on the lesson's end, and two on-device counters (welcomes
  shown, welcomes followed by a lesson) for the closed-test testers to read
  out, since there are no analytics (with Q-005).
- Reminders wait for native builds, where local notifications need no server
  (P-007, Q-001).

## Not evidence for

None of these figures are Qaaf's. The streak study is lab and online
experiments, not a language app; Duolingo's revival results were not
published. Nothing here measures whether a welcome back brings anyone back.
