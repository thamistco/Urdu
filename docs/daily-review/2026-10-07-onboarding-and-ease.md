# 2026-10-07 · Onboarding, first session and ease of use (areas 5 and 6)

First review of both areas. `qaaf-learner-voice` researched what learners say
about the first days in language apps (28 tool calls; Reddit mirrors,
unstar.app and kimola.com were blocked, so those come from search summaries).

## What learners say

- **Learning before being asked anything** is what many praise. Duolingo
  credits moving sign-up after the first lesson with a 20% rise in next-day
  retention (its own figure, repeated by Appcues and Wyzowl, not independently
  checked).
- **Long onboarding loses people.** A vendor figure, quoted second-hand: flows
  over five screens are finished by under 60%, three or fewer by over 80%.
- **Guilt-trip notifications** are among the most repeated complaints, for
  years ("an annoying nagging parent"), and some people quit over them.
- **Starting at the wrong level** cuts both ways: learners call themselves
  beginners out of modesty and get bored; one forum user was placed too high.
- **Heritage speakers** are pitched "skip the basics, learn to read" by
  Matra (Hindi) and BolNama (Urdu), both direct competitors.

## What Qaaf did

A new learner went through goal, track, voice (when two exist), "do you know
some Urdu", a four-question quick check, daily goal and "you're all set":
six or seven screens and four questions before the first lesson.

The manager then read the code and found the quick check decided **nothing**
for anyone who answered "I'm starting from scratch": their label, path and
skips all come from that answer, and the quiz only decides whether a speaker
is offered the alphabet skip. `startLevel` is saved and read by nothing. So a
beginner answered four questions, under a line saying they "work out where to
start you", that changed nothing.

## Shipped tonight

**P-005: only someone who already speaks Urdu takes the quick check.** A
beginner goes from that answer to the daily goal, four screens sooner. The
quiz sits under the same progress dot as the question before it, so the dot
count does not change with the answer.

- First check: learner voice (beginner's viewpoint).
- Second check, `qaaf-critic`, from the case for placement and from the
  checks that drive onboarding. It confirmed from every reader of the quiz
  result that nothing changed for a beginner, and **held** on the playtest
  self-test, which the change turned red (it is not in CI, so nothing would
  have said so). Fixed with a new case that fails against the old rule;
  re-checked; **SHIP**. Merge e1ba3f0.

## Queued, not built

- **A heritage first minute (P-006):** a speaker's first item is a familiar
  word such as امی, heard and then decoded with help, before single letters.
  Against: one more content branch, and decoding before the letters can
  frustrate.
- **Kind reminders, asked for late (P-007):** when reminders exist, ask once
  after the first finished lesson with no guilt in the wording and a one-tap
  off. Nothing to build until notifications exist.
- Found by the P-005 critic and not this change's job: a Roman-track speaker
  who answers every question is labelled "You already read some Urdu", and
  someone who reads the script but does not speak Urdu fits neither answer.

## Not evidence for

Search summaries, not a count of reviews; the retention and screen-count
figures are vendors' and one company's. Nothing here measures Qaaf learners,
and P-005's effect cannot be measured until analytics exist (Q-005).
