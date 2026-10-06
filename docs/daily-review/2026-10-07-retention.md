# 2026-10-07 · Retention and habit (area 7)

First review of this area. `qaaf-growth` researched what brings learners back
(26 tool calls; Duolingo's blog and engineering site and Lenny's Newsletter
were blocked, so Duolingo's figures come from search summaries) and read what
Qaaf already has.

## What Qaaf has

A streak with freezes (start with 1, hold up to 3, 30 gems each, spent
automatically); four daily goals; "Play today to keep your N-day streak" on
Home; a weekly league whose players are generated, and says so. No comeback
flow (a broken streak just reads 0), no weekly recap, no reminders.

## What research says

- Learners who reach a 7-day streak are 2.4 times as likely to come back the
  next day, and letting people hold two freezes raised daily learners 0.38%
  (Duolingo, via search summaries).
- **Slack as reserves keeps people going:** with "emergency reserves", people
  resumed after a miss 55% of the time against 37% with a hard goal (Sharif
  and Shu 2019).
- **The case against:** seeing a broken streak lowers later engagement, more
  so when people blame themselves; being able to repair it softens that
  (Silverman and Barasch 2023). Guilt-trip notifications are widely called
  manipulative.
- People take up goals at fresh starts: a new week, month or year (Dai,
  Milkman and Riis 2014).
- Reminders help modestly: Duolingo's algorithm, tested on 200 million
  notifications, added 0.5% daily users and 2% new-user retention (KDD 2020).
  Web push on iPhone works only once the site is on the home screen and needs
  a server.

## Shipped tonight

**P-008: a freeze for each missed day, up to the three a learner holds.** A
learner could buy three freezes and still lose the streak by missing two
days, because a freeze only covered a gap of exactly one. Now each missed day
spends one while there are enough; with too few, the streak ends and the
freezes are kept. The lesson-complete card says how many days were covered.

- First check: growth, from the learner's and family's fairness and the
  research above.
- Second check, `qaaf-critic`, as a habit designer defending the streak and
  an engineer worried about saved progress. It confirmed covered days do not
  add to the streak and that restocking costs 9 to 18 lessons, then **held**
  on three real bugs, each measured: the card undercounted when the app was
  opened on more than one missed day; a learner who opened the app daily
  lost freezes that one who stayed away kept; and an old notice could claim a
  freeze saved a streak that had just ended. All fixed; a unit test now
  asserts opening the app daily and not at all end the same for every gap
  and stock, and fails with either fix removed. Re-checked; **SHIP**. Merge
  273cfae.

## Queued, not built

- **A comeback screen in place of a silent zero (P-011):** "Welcome back",
  the best streak, the letters learned, and a three-minute review of what is
  due. Possibly a once-a-month repair. Against: forgiveness can cost the habit
  hook; the 30-day limit is judgement.
- **An opt-in calendar reminder and a Monday recap (P-012):** a repeating
  calendar event the learner adds and owns, which needs no server, and a
  weekly look back. Against: it fires on days already practised and cannot be
  personalised, which is where Duolingo's gain came from.
- A minor from the P-008 second check (Q-017): freezes bought while some are
  on hold can be lost to the three-freeze cap if the streak then breaks.

## Not evidence for

None of these numbers come from Qaaf; every proposal needs analytics (Q-005)
before its effect can be measured beyond unit tests.
