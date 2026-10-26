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
| 1   | Market and competitors       | Who else teaches Urdu, what they charge, where they are weak, who our learners are           | 2026-10-24    |
| 2   | Accessibility                | Screen readers, contrast, text size, motor and colour-blind use                              | 2026-10-26    |
| 3   | Visual design and aesthetics | Consistency, hierarchy, polish, the Moonrise brand across every screen                       | 2026-10-26    |
| 4   | Learning effectiveness       | Does it teach? Curriculum order, spaced repetition, script mastery                           | 2026-10-23    |
| 5   | Interaction and ease of use  | Friction, dead ends, confusing controls, error states, speed of a session                    | 2026-10-23    |
| 6   | Onboarding and first session | The first five minutes: does a stranger reach a win and want a second day                    | 2026-10-23    |
| 7   | Retention and habit          | Streaks, reminders, goals, comeback paths, what brings people back                           | 2026-10-23    |
| 8   | Content quality              | Urdu accuracy, translations, audio, cultural fit, originality                                | 2026-10-26    |
| 9   | Performance and reliability  | Load time, bundle size, offline, crashes, low-end phones                                     | 2026-10-24    |
| 10  | Monetisation and pricing     | What is free, what is paid, price, trial, paywall design, family plans                       | 2026-10-23    |
| 11  | Launch readiness             | Native builds, store accounts and listings, legal, support, payments                         | 2026-10-24    |
| 12  | Marketing and advertising    | Positioning, channels, creators, paid ads, budget, launch moments                            | 2026-10-26    |
| 13  | Growth and referral          | Sharing, invites, family features, word of mouth, community                                  | 2026-10-23    |
| 14  | Analytics, feedback, privacy | What to measure, how to hear from learners, staying privacy-respecting                       | 2026-10-26    |
| 15  | What learners say            | Reviews of other apps, forums, what people love and wish existed, what Urdu learners ask for | 2026-10-26    |
| 16  | Learning science             | What research shows works for learning a language and a script, and whether Qaaf does it     | 2026-10-26    |

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
8. **Audit:** `qaaf-auditor` on the night's commits, reports and draft
   summary; answer every flag.
9. **Summarise the day** for the owner (see below).

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
| `qaaf-tester`        | Plays the app as one kind of learner (eight personas, rotated)           |
| `qaaf-content`       | Moderates the course: accuracy, respect, fit for children, consistency   |
| `qaaf-auditor`       | Audits the manager's own night before the summary goes out               |

**The manager** is the session running the review. It alone builds, commits,
merges and ships. Its duties:

1. **Prepare.** Build `dist/` once before dispatching, so no agent builds; give
   each agent that needs the app its own port; give each one task.
2. **Dispatch in parallel, in the background,** each with its budget (30 to 40
   tool calls, 15 to 20 minutes) and the report format in its file: QA, the
   rotation's specialists, one tester persona and the content moderator (see
   "Checks and balances").
3. **Check on them.** Every few minutes, check each running agent's state. A
   background agent's output file does not grow while it works, so its size
   says nothing (learned 2026-10-06); track elapsed time against the budget
   and the completion notice instead.
   An agent past its time budget, repeating itself, waiting on something, or
   drifting from its task is stopped, and its partial report is used. The
   measured reason this exists: one critic once spent 253,607 tokens over 70
   minutes and never returned a verdict (gauntlet/ROLES.md, OVERSEER).
   At the budget, tell the agent to report now; a few minutes later, stop it.
   The message arrives only at its next tool round. If a stopped agent had
   written nothing, resume it once, with no tools allowed, to write up what
   it already found (2026-10-08: two agents stopped at 24 minutes had written
   nothing, and their research was recovered this way).
   While agents run, the manager edits nothing they run: on 2026-10-07 it
   changed `scripts/lib/serve-dist.js` in the working tree mid-run, and the
   design agent's door-opener then looked for a button the built app did not
   have yet. Work on agents' tools goes in a worktree until they finish.
4. **Weigh the feedback.** Turn findings into fixes, proposals and backlog
   items. A specialist advises; the manager decides.
5. **Second-check, build, ship,** and record what each agent cost in the
   night's report, so the next night can be cheaper.

## Checks and balances

The owner, 2026-10-24: there are no community testers or moderators, so the
review builds its own, as many agents as it needs, with checks and balances so
that everything keeps running smoothly. Nobody checks their own work:

| Work                        | Done by         | Checked by                                       |
| --------------------------- | --------------- | ------------------------------------------------ |
| Finding bugs                | `qaaf-qa`       | the manager reproduces each before fixing it     |
| Learning, design, growth    | the specialists | `qaaf-critic`, from a different viewpoint        |
| How it feels to a learner   | `qaaf-tester`   | the manager reproduces; the critic on changes    |
| The course's content        | `qaaf-content`  | the manager reads each source; a native ear (H1) |
| Building, shipping, records | the manager     | `qaaf-auditor`, before the summary               |
| The whole night             | the manager     | the owner, from the summary                      |

**Every night** dispatches, beside `qaaf-qa` and the rotation's specialists,
one `qaaf-tester` persona, the next in its list after the last report's, and
`qaaf-content` on the content changed since its last report, or, if none
changed, the next unit in order. **Before the summary**, `qaaf-auditor` gets
the night's commit range, reports and draft summary. The summary answers
each of its flags, by fixing it or saying why not.

**Run health,** checked at the start of each night and written in the
night's agents report:

1. **The machine.** If `/home/user/Urdu` is missing or has no `node_modules`,
   the container was rebuilt (it was on 22 October). Fetch the deploy branch,
   check it out tracking the remote, and run `npm ci`. Anything that was only
   on the old machine is gone; say what in the summary.
2. **Last night's deploy.** The latest push's deploy run succeeded, and its
   "Verify the live site is serving this commit" step passed. If not, fixing
   that comes before anything else tonight.
3. **Flaky checks.** A check that failed in CI and passed on a re-run, with
   no change, is recorded in BACKLOG as a Q-item ("flaky: <check>, <date>").
   On its second time it is fixed that night, not re-run again.
4. **Agents.** Which agent types are registered (a type missing from the list
   runs as general-purpose, told to read its file); each agent's cost against
   its budget. A night whose agents spend more than 1.2 million tokens in all
   says why, and the next night trims.
5. **Held work.** Only the deploy branch may be pushed without the owner's
   permission, and a branch that is not pushed is lost when the machine is
   rebuilt (P-020 was, on 22 October). Work that is built but not shipped
   (held, dropped for now, or waiting on a second check) is saved as
   `docs/daily-review/held/<id>-<what>.patch` (`git format-patch`) and
   committed on the deploy branch, with its BACKLOG item pointing to it.
   Remove the patch when the work ships or is given up for good.
6. **Two bad nights.** If the deploy fails two nights running, or the
   auditor flags the same thing twice, the next night ships no new features
   until that is fixed.

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
- where Qaaf stands against [the launch bar](LAUNCH_BAR.md), with the table
  updated that night, and whether the manager would launch now.

## What a run must not do

- Spend money, create accounts, sign up for services, or accept terms.
- Post, publish or contact anyone outside this repository and its site.
- Use the owner's text-to-speech key without asking first. The owner,
  2026-10-24: ask permission before each use, with the expected cost. Run
  `node scripts/generate-voice.js --cost` (and with `VOICE_SET=m`, and
  `--force` if a re-record is meant), which needs no key and sends nothing,
  and put its figures in the question: the clips, the characters, the cost
  with and without the month's free allowance, and the ceiling if every clip
  is retried. Ask in the conversation and wait; a night with no answer leaves
  the clips for another night and says so in the summary. Once allowed, the
  key goes in an environment variable for that one command, with
  `--approved`, and is never written to any file, commit or message. Without
  `--approved` the script prints the cost and records nothing, and the deploy
  no longer generates at all. So a change to any spoken Urdu (a word, its
  pronunciation form, a sentence) leaves its clips stale, `check:voice-fidelity`
  fails, and nothing deploys until the owner says yes and the clips are
  recorded: ask the same night the change is made, or hold the change. (This replaces the 2026-10-08 "keep
  using the key".)
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
