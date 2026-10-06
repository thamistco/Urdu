# Daily review backlog

Everything the nightly review found that was too big to fix in one night, or is
not the review's to decide. Ranked by what most moves Qaaf towards a launch that
lasts. Each item names the night that found it, so the evidence can be read.

Sizes: **S** one night, **M** a few nights, **L** needs planning.

The review decides and ships (the owner delegated decisions on 2026-10-06 and
reverts from the daily summary if needed). A change that comes from research
ships after a second check from a different viewpoint; see the README.

## Needs the owner

Only what the review cannot do itself: money, accounts, keys, outside
dashboards and permissions.

| ID  | What                                                                                           | Why                                                                     | Found      |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- |
| O-1 | Replace the Google text-to-speech key and put the new one in the environment's secrets         | The old one was pasted in chat. Nothing new can be recorded without it. | 2026-09-23 |
| O-2 | Add `qaaf://auth` as a redirect in Supabase and in the Google sign-in client                   | Sign-in on a native build will fail without it.                         | 2026-10-01 |
| O-4 | Allow edits to `.github/workflows/` and `.githooks/` so `HARF_*` build settings can be renamed | Cosmetic; blocked by permissions.                                       | 2026-10-01 |
| O-5 | Apple Developer ($99/year) and Google Play ($25 once) accounts                                 | No native build can ship without them. See Q-001.                       | 2026-10-06 |

Parked by the owner (not to be raised): the support email; the _Basic Urdu_
comparison.

## Checked once

Research changes waiting for their second check, which comes from a different
viewpoint (a `qaaf-critic` agent) and can be the same day. Each is built on its
own branch first; SHIP merges it.

P-001 cannot be built until payments exist (Q-002). The others found on
2026-10-07 are recorded with their evidence and the case against in that
night's reports, and wait for a night to build them:

- **P-006** A heritage first minute: a speaker's first item is a familiar word (امی), heard then decoded with help. `2026-10-07-onboarding-and-ease.md`
- **P-007** Reminders asked for once, after the first finished lesson, with no guilt in the wording. Waits for notifications.
- **P-009** A word answered right before it is due keeps its interval, so a same-day review does not jump it from 1 day to 3. `2026-10-07-learning.md`
- **P-010** Fade the Roman on the "both" track once a word is known. A promise change; wants a heritage learner's check. `2026-10-07-learning.md`
- **P-011** A comeback screen in place of a silent zero streak. `2026-10-07-retention.md`
- **P-012** An opt-in calendar reminder (no server) and a Monday recap. `2026-10-07-retention.md`
- **P-013** Ticks and crosses on answer tiles as well as colour; emoji pictures on light tiles. `2026-10-07-accessibility-and-design.md`

| ID    | Proposal                                                                                                                                                                                                                                                                                                                                                                                                                | First checked | Perspectives weighed on day one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-001 | **How Qaaf is paid for: a daily free allowance with a trial at the limit** (the owner raised the Drops model). Free forever: the whole alphabet, all review, and 2 new lessons a day. Premium: unlimited lessons and a family plan. Hitting the daily limit offers a 7-day Premium trial. Starting prices ~$9.99/month, ~$69.99/year, a family plan near $119.99, lifetime ~$149.99. Built once payments exist (Q-002). | 2026-10-06    | **Learner:** a daily allowance builds the habit that education apps lose (2 to 3% kept at day 30); counting lessons rather than minutes never cuts a lesson off halfway. **Parent:** a course that is never fully locked earns a family's trust. **Business, against:** free-with-limits converts about 2.1% of trials against 10.7% for a hard paywall (RevenueCat 2026); the trial at the limit is there to win some of that back, and it is a bet. **Competitors:** Drops gives 5 free minutes a day ($69.99/yr), Duolingo meters through hearts, Ling uses a trial then a paywall. **Engineering:** needs payments and native builds first. **Learners of other apps:** a paywall straight after the first lesson is among Ling's top complaints, which supports keeping the alphabet free. |

## Shipped

| ID    | What                                                        | Second check (viewpoint)                              | Outcome                                                                       | Live                |
| ----- | ----------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------- |
| P-002 | "Speak Urdu? Now read it." on sign-in and in the store copy | Complete beginner, brand, store rules                 | HOLD (no subject, store page turned beginners away), fixed, SHIP              | 2026-10-06, 4f03ee2 |
| P-004 | Read faster: reading-speed rounds in the script             | Learning scientist, data integrity, screen reader     | HOLD (a tap-through set an unbeatable best), fixed, SHIP                      | 2026-10-06, 4f03ee2 |
| P-003 | Say it back: repeat a line and hear yourself next to it     | Privacy and legal accuracy, accessibility, robustness | HOLD twice (policy date, open web microphone, cross-line race), fixed, SHIP   | 2026-10-06, 4982c07 |
| P-008 | A streak freeze for each missed day, up to the three held   | Habit designer, saved-progress engineer               | HOLD (card miscounted, daily openers lost freezes, stale notice), fixed, SHIP | 2026-10-07, 273cfae |
| P-005 | Only someone who already speaks Urdu takes the quick check  | The case for placement, the checks driving onboarding | HOLD (playtest self-test turned red), fixed, SHIP                             | 2026-10-07, e1ba3f0 |

## Queued work

| ID    | Area          | What                                                                                                                                                                                                                         | Size | Status            | Found      |
| ----- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------- | ---------- |
| Q-001 | Launch        | Native iOS and Android builds (Expo EAS), installed and smoke-tested on a real phone                                                                                                                                         | L    | open, needs O-5   | 2026-10-06 |
| Q-002 | Monetisation  | Payments and a paywall (RevenueCat or the stores' own billing), shaped by P-001                                                                                                                                              | L    | open, needs O-5   | 2026-10-06 |
| Q-003 | Growth        | Family plan and a parent's view of a child's progress, to compete with BOLI and KidsBolo                                                                                                                                     | L    | open              | 2026-10-06 |
| Q-005 | Analytics     | Privacy-respecting measurement of day 1, 7 and 30 retention and lesson completion; none exists today                                                                                                                         | M    | open              | 2026-10-06 |
| Q-006 | Content       | Native-speaker recordings for the most-heard items, the 40 letters first (uTalk markets against synthetic voices)                                                                                                            | M    | open, costs money | 2026-10-06 |
| Q-007 | Launch        | A launch plan aimed at January, when education installs retain best; a waitlist page before that                                                                                                                             | M    | open              | 2026-10-06 |
| Q-008 | Marketing     | Short-video content plan built on belonging ("read what your grandmother writes"), and a list of diaspora communities and creators to approach                                                                               | M    | open              | 2026-10-06 |
| Q-009 | Market        | Install and use Ling, Mondly and uTalk's Urdu courses for a proper teardown; tonight was desk research only                                                                                                                  | M    | open              | 2026-10-06 |
| Q-010 | Launch        | Store and trademark search for "Qaaf" (both app stores; UKIPO, USPTO, EUIPO); only "Harf" was ever checked                                                                                                                   | S    | open              | 2026-10-01 |
| Q-011 | Accessibility | Say it back and Read faster: announce recording start/stop and give feedback when sound is off (critic minors, 2026-10-06)                                                                                                   | S    | fixed 2026-10-07  | 2026-10-06 |
| Q-012 | Robustness    | Say it back: a tap on a second line in the instant the first is starting is dropped (tap again works); await the in-flight start instead                                                                                     | S    | fixed 2026-10-07  | 2026-10-06 |
| Q-013 | Checks        | openTheDoor reads "copy and regex drifted apart" as "already past the door"; detect the door by its button instead (pre-existing, found by the P-002 critic)                                                                 | S    | fixed 2026-10-07  | 2026-10-06 |
| Q-014 | Accessibility | Large text breaks Home: at 1.5x the headline splits mid-word beside the streak and gem pills, at 2x one letter a line, Letter Lab tile empty; `check:text-scale` missed it. Also "all 40 letters" 3.7:1, topics count 4.09:1 | M    | open              | 2026-10-07 |
| Q-015 | Accessibility | Settings switches are 40x20 targets and their rows are not pressable; make the row the control without nesting a switch in a button                                                                                          | S    | open              | 2026-10-07 |
| Q-016 | Design        | At 320 wide a two-word prompt pushes three of four answers below the fold, and "Got it" on a new-letter card sits below it                                                                                                   | S    | open              | 2026-10-07 |
| Q-017 | Retention     | Freezes bought while some are on hold can be lost to the three-freeze cap if the streak then breaks (P-008 critic minor)                                                                                                     | S    | open              | 2026-10-07 |
| Q-018 | Docs          | `gauntlet/BENCHMARKS.md` still says 1.3 min and 1.8 sightings a word; `check:shape` measures 5.2 min and about 4.4                                                                                                           | S    | open              | 2026-10-07 |
