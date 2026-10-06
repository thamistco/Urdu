# Daily review

Every night at midnight UK time, one part of Qaaf gets a hard look: researched
online, measured on the real app, criticised, and improved. The owner asked for
this on 2026-10-06 so the app gets better every day, across everything that
decides whether it succeeds: how it looks, how it teaches, how it feels to use,
how it makes money, how it launches, and how people find it and keep coming
back.

This folder is the review's memory. A run that is not written down here did not
happen.

## The rotation

One area a night. Take the area with the oldest "last reviewed" date; on a tie,
the one higher in this list. Fourteen areas, so each comes round every two
weeks.

| #   | Area                         | What it covers                                                                     | Last reviewed |
| --- | ---------------------------- | ---------------------------------------------------------------------------------- | ------------- |
| 1   | Market and competitors       | Who else teaches Urdu, what they charge, where they are weak, who our learners are | 2026-10-06    |
| 2   | Accessibility                | Screen readers, contrast, text size, motor and colour-blind use                    | never         |
| 3   | Visual design and aesthetics | Consistency, hierarchy, polish, the Moonrise brand across every screen             | never         |
| 4   | Learning effectiveness       | Does it teach? Curriculum order, spaced repetition, script mastery                 | never         |
| 5   | Interaction and ease of use  | Friction, dead ends, confusing controls, error states, speed of a session          | never         |
| 6   | Onboarding and first session | The first five minutes: does a stranger reach a win and want a second day          | never         |
| 7   | Retention and habit          | Streaks, reminders, goals, comeback paths, what brings people back                 | never         |
| 8   | Content quality              | Urdu accuracy, translations, audio, cultural fit, originality                      | never         |
| 9   | Performance and reliability  | Load time, bundle size, offline, crashes, low-end phones                           | never         |
| 10  | Monetisation and pricing     | What is free, what is paid, price, trial, paywall design, family plans             | never         |
| 11  | Launch readiness             | Native builds, store accounts and listings, legal, support, payments               | never         |
| 12  | Marketing and advertising    | Positioning, channels, creators, paid ads, budget, launch moments                  | never         |
| 13  | Growth and referral          | Sharing, invites, family features, word of mouth, community                        | never         |
| 14  | Analytics, feedback, privacy | What to measure, how to hear from learners, staying privacy-respecting             | never         |

## A night's work

1. **Pick** the area by the rule above. Read the last report for it, if any,
   and the open items for it in `BACKLOG.md`.
2. **Research** online first: competitors, platform guidance, published
   benchmarks. Cite every source in the report. A claim with no source is
   labelled as judgement.
3. **Measure** the built or live app for that area. Measure, do not estimate
   (CLAUDE.md rule 4), and say what each number is not evidence for (rule 5).
4. **Fix** what is small, safe and clearly right, through the usual gate:
   `npm run check:all`, push to the deploy branch, confirm from the deploy
   job's `check:deployed` line that the site serves it. One logical change per
   commit.
5. **Queue** everything bigger in `BACKLOG.md`, with the evidence and a size.
6. **Write** the night's report as `YYYY-MM-DD-<area>.md` and update the
   "last reviewed" date above.
7. **Tell** the owner, briefly: what was looked at, what changed and is live,
   what was queued, and anything only they can decide.

## What a run must not do

- Spend money, create accounts, sign up for services, or accept terms.
- Post, publish or contact anyone outside this repository and its site.
- Change prices, legal text, the brand or anything a learner pays for. These
  go to "Needs the owner" in `BACKLOG.md` with a recommendation.
- Generate new audio without a text-to-speech key in the environment's
  secrets. The key pasted in chat is exposed and is due to be replaced.
- Weaken a check to go green, or report a deploy live without reading the
  deploy log.
- Rename the `qaaf-*` localStorage keys. See CLAUDE.md.

## Parked by the owner

Not to be raised again until the owner brings them back (2026-10-06):

- The support email address (`SUPPORT_EMAIL` is still a placeholder).
- Comparing the course against _Basic Urdu_ (`openbooks.lib.msu.edu` is blocked
  in this environment).
