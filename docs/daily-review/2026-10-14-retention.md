# 2026-10-14 · Retention and habit: bringing a learner back without notifications (area 7)

`qaaf-growth`, 22 tool calls, 2.1 minutes, read-only. web.dev and
making.duolingo.com did not resolve, so figures from them come from search
summaries. Qaaf is a web app today, with no push notifications.

## Findings

- **Benchmarks:** education apps keep about 14–15% of users on day 1 and 2–3%
  on day 30; consumer apps about 25%, 11–13% and 6% ([Business of Apps](https://www.businessofapps.com/?p=56781),
  accessed 2026-10-14). Secondary sources quoting each other; none specific to
  language apps.
- **Planning prompts work with no notification.** Writing down the date and
  time of a flu shot raised uptake 4.2 points; a date alone +1.5, not
  significant (Milkman et al., PNAS 2011, [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3127912)).
  A 2025 meta-analysis of 642 tests: d .27–.66, larger for "if X, then Y"
  plans that are rehearsed ([Sheeran and Listrom 2025](https://kops.uni-konstanz.de/handle/123456789/69905)).
- **The home screen:** Duolingo promoted its widget after lessons; widget users
  kept learning longer even allowing for keener learners adding it (no figure)
  ([blog](https://blog.duolingo.com/widget-feature)). Qaaf writes a standalone
  manifest but never suggests installing; iPhone has no install prompt, and a
  site cannot tell whether it was added.
- **Calendar reminders:** no randomised trial found; reminders timed to "fresh
  start" dates did not change adherence in about 13,000 patients. The case
  against P-012 stands.
- **Streak anxiety:** no peer-reviewed study isolating streaks; learner
  accounts and journalism only.
- **"Leave something unfinished":** design blogs only, no retention data.
- **Qaaf today:** the end of a lesson looks back only ("Whatever slipped…"):
  no plan for tomorrow, no goal-met line, no named next lesson.

## Proposals (checked once)

- **P-074** A tomorrow plan at the end of the day's first lesson: "When will
  you practise tomorrow?" Morning, Midday, Evening or Skip, kept on the device;
  next day Home says "Your evening lesson: 3 minutes, 6 words to bring back";
  an optional one-off calendar entry. For: implementation intentions are the
  best-evidenced lever here; the learner owns the time; a family can set a
  child's together; no server, no account, nothing for the stores to object
  to. Against: another tap at the moment of leaving; Milkman's effect came on
  top of a mailed reminder; a missed plan could breed guilt, so Home must
  never mention one. Measure with on-device counters read by closed testers.
- **P-075** An add-to-home-screen hint after the third finished lesson, once,
  dismissable. For: the icon is the reminder, the nearest thing to Duolingo's
  widget. Against: may only reflect keen learners; installs cannot be counted
  on iPhone; it nags; short-lived once native builds ship.
- Naming tomorrow on the lesson's end ("Tomorrow: 6 words come back · Next:
  …") is folded into P-074.

## What this is not evidence for

No Qaaf retention data exists (Q-005). No language-app day-1/7/30 figures were
found, and no study of calendar reminders.
