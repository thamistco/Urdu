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

As many areas a night as the night allows: the owner asked (2026-10-06) for as
much as possible every day. Take them in order of the oldest "last reviewed"
date; on a tie, the one higher in this list. Each area finished gets its own
report.

| #   | Area                         | What it covers                                                                               | Last reviewed |
| --- | ---------------------------- | -------------------------------------------------------------------------------------------- | ------------- |
| 1   | Market and competitors       | Who else teaches Urdu, what they charge, where they are weak, who our learners are           | 2026-10-06    |
| 2   | Accessibility                | Screen readers, contrast, text size, motor and colour-blind use                              | never         |
| 3   | Visual design and aesthetics | Consistency, hierarchy, polish, the Moonrise brand across every screen                       | never         |
| 4   | Learning effectiveness       | Does it teach? Curriculum order, spaced repetition, script mastery                           | never         |
| 5   | Interaction and ease of use  | Friction, dead ends, confusing controls, error states, speed of a session                    | never         |
| 6   | Onboarding and first session | The first five minutes: does a stranger reach a win and want a second day                    | never         |
| 7   | Retention and habit          | Streaks, reminders, goals, comeback paths, what brings people back                           | never         |
| 8   | Content quality              | Urdu accuracy, translations, audio, cultural fit, originality                                | never         |
| 9   | Performance and reliability  | Load time, bundle size, offline, crashes, low-end phones                                     | never         |
| 10  | Monetisation and pricing     | What is free, what is paid, price, trial, paywall design, family plans                       | never         |
| 11  | Launch readiness             | Native builds, store accounts and listings, legal, support, payments                         | never         |
| 12  | Marketing and advertising    | Positioning, channels, creators, paid ads, budget, launch moments                            | never         |
| 13  | Growth and referral          | Sharing, invites, family features, word of mouth, community                                  | never         |
| 14  | Analytics, feedback, privacy | What to measure, how to hear from learners, staying privacy-respecting                       | never         |
| 15  | What learners say            | Reviews of other apps, forums, what people love and wish existed, what Urdu learners ask for | 2026-10-06    |
| 16  | Learning science             | What research shows works for learning a language and a script, and whether Qaaf does it     | 2026-10-06    |

## A night's work

1. **Pick** the area by the rule above. Read the last report for it, if any,
   and the open items for it in `BACKLOG.md`.
2. **Second checks first.** Anything in `BACKLOG.md` under "Checked once"
   gets its second check now (see below). Those that hold ship tonight.
3. **Research** online: competitors, platform guidance, published benchmarks,
   and what learners themselves say about this area in other apps' reviews and
   in forums (the owner asked for this on 2026-10-06: what people like, what
   they wish existed, what Urdu learners want in particular, and what research
   says works). Always from several perspectives (see below). Cite every source
   in the report; a claim with no source is labelled as judgement.
4. **Measure** the built or live app for that area. Measure, do not estimate
   (CLAUDE.md rule 4), and say what each number is not evidence for (rule 5).
5. **Fix bugs now.** Something broken, wrong or failing a check is fixed the
   same night through the usual gate: `npm run check:all`, push to the deploy
   branch, confirm from the deploy job's `check:deployed` line that the site
   serves it. One logical change per commit.
6. **Propose everything else, build it, and second-check it.** A change that
   comes out of research (a new feature, a redesign, a price, new wording)
   goes into "Checked once" with the perspectives weighed, and is built on its
   own branch, `claude/proposal-<id>-<slug>`, through `check:all`. It ships
   once a second check from a different viewpoint says SHIP (see below).
7. **Write** the night's report as `YYYY-MM-DD-<area>.md` and update the
   "last reviewed" date above.
8. **Summarise the day** for the owner (see below).

## Several perspectives, every time

The owner asked (2026-10-06) that research always look at a question from
several sides. Each proposal names at least three of these, and at least one of
them has to be the case against it:

- the learner: a beginner, a heritage speaker who cannot read, a Roman-track
  learner;
- a parent or family choosing for a child;
- a disabled learner (screen reader, low vision, motor);
- the business: revenue, cost, risk;
- competitors, and what they learned the hard way;
- the stores' rules (Apple, Google) and the law;
- the Urdu-speaking community: accuracy, culture, respect;
- engineering: what it costs to build and to keep working.

## A second check from a different viewpoint

The owner's rule, revised on 2026-10-06: a change that comes from research is
checked twice before it ships, and the second check comes from a different
viewpoint than the first. It no longer has to wait a day.

- **The first check** is the specialist that proposed it, with its evidence
  and the perspectives it weighed, recorded in "Checked once" in `BACKLOG.md`.
- **The second check** is a different agent (`qaaf-critic`, told which
  viewpoint to take, never the proposer's): it looks for evidence against the
  change, takes a perspective the first did not, and examines the built branch.
  SHIP: the manager merges it and ships it that day. HOLD: it is changed (and
  checked again) or dropped, with the reason written down.

Bug fixes still ship the moment they are fixed.

## Agents, and the manager

The owner asked (2026-10-06) for specialist agents with one manager that takes
their feedback and keeps checking on them so nobody gets stuck or wastes time.
The specialists live in `.claude/agents/`:

| Agent                | Covers                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| `qaaf-critic`        | The second check: harsh, finds what will embarrass the app, SHIP or HOLD |
| `qaaf-learning`      | Curriculum and learning science                                          |
| `qaaf-design`        | Visual design and accessibility, with screenshots and measurements       |
| `qaaf-learner-voice` | What learners say about other apps, and what Urdu learners want          |
| `qaaf-growth`        | Monetisation, launch, store presence, marketing, retention, referral     |
| `qaaf-qa`            | Plays the built app hunting for bugs                                     |

**The manager** is the session running the review. It alone builds, commits,
merges and ships. Its duties:

1. **Prepare.** Build `dist/` once before dispatching, so no agent builds; give
   each agent that needs the app its own port; give each one task.
2. **Dispatch in parallel, in the background,** each with its budget (30 to 40
   tool calls, 15 to 20 minutes) and the report format in its file.
3. **Check on them.** Every few minutes, check each running agent's state. A
   background agent's output file does not grow while it works, so its size
   says nothing (learned 2026-10-06); track elapsed time against the budget
   and the completion notice instead.
   An agent past its time budget, repeating itself, waiting on something, or
   drifting from its task is stopped, and its partial report is used. The
   measured reason this exists: one critic once spent 253,607 tokens over 70
   minutes and never returned a verdict (gauntlet/ROLES.md, OVERSEER).
4. **Weigh the feedback.** Turn findings into fixes, proposals and backlog
   items. A specialist advises; the manager decides.
5. **Second-check, build, ship,** and record what each agent cost in the
   night's report, so the next night can be cheaper.

## Decisions

The owner has delegated decisions to the review (2026-10-06): prices, wording,
design, features. The review decides, ships, and says so plainly in the day's
summary, with what to revert if the owner disagrees. The owner reads the
summary and asks for reverts.

What still needs the owner is only what the review physically cannot do:
spending money, creating accounts, keys, and settings in outside dashboards.
These stay under "Needs the owner" in `BACKLOG.md`.

## The end-of-day summary

Every night's run ends with one message to the owner covering everything that
changed in the app since the last summary, including work done during the day.
Plain language, no jargon:

- what changed, in the words a learner would use;
- why, in a sentence;
- whether it is live (only after reading the deploy log);
- what was decided on the owner's behalf, and the commit to revert if wanted;
- what was proposed tonight and will be checked again tomorrow;
- anything only the owner can do.

## What a run must not do

- Spend money, create accounts, sign up for services, or accept terms.
- Post, publish or contact anyone outside this repository and its site.
- Generate new audio without a text-to-speech key in the environment's
  secrets. The key pasted in chat is exposed and is due to be replaced.
- Ship a research change that has had only one check, or whose second check
  came from the same viewpoint as its first.
- Weaken a check to go green, or report a deploy live without reading the
  deploy log.
- Rename the `qaaf-*` localStorage keys. See CLAUDE.md.

## Parked by the owner

Not to be raised again until the owner brings them back (2026-10-06):

- The support email address (`SUPPORT_EMAIL` is still a placeholder).
- Comparing the course against _Basic Urdu_ (`openbooks.lib.msu.edu` is blocked
  in this environment).
