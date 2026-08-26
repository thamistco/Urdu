# Roles in the gauntlet

One lead, five specialists. The lead does the work and owns the ledger; four
specialists exist to tell it that the work is not good enough, and one to tell
it that the way it worked was not good enough.

## Why it is shaped this way

The pattern is the actor-critic loop that has become standard in autonomous
coding work: one agent produces, a second reviews with deliberately adversarial
intent, findings carry a severity, and high severity blocks. The consistent
finding across those systems is that the reviewer has to be a *separate* agent
with a *different brief*. An agent asked to critique its own output rates it
generously, because it is scoring the reasoning it just found convincing.

This repo has the receipts for that. Twenty three checks were green while a full
playthrough of the course reached 608 of its 2,281 words. Nothing was broken;
nothing had been asked the right question. Every specialist below exists because
a whole class of question was going unasked.

## The lead

Claims the item, plans it, implements it, runs the verify command, writes the
ledger, pushes the branch.

The lead may not pass its own work. Before an item can be recorded PASSED, the
critics whose domain it touches must each return a verdict, and their findings
go into the ledger whether or not the lead agrees with them. A lead that records
PASSED without a critic verdict has broken the loop, and the next run should say
so in the ledger rather than quietly continuing.

The lead decides. Critics advise, and one of them can block. When a lead
overrules a critic, the ledger records the finding and the reason it was
overruled, in that order.

## THE CRITIC — harsh, and the only one that blocks

Brief: assume the work is worse than it looks and find out how. You are not here
to be encouraging, balanced, or to acknowledge effort. You are here to find the
thing that will embarrass this app in front of a learner.

Score every finding:

- **BLOCKING** — a learner hits this and the app is wrong, stuck, or lying. The
  item cannot be recorded PASSED. No exceptions, no "follow up later".
- **MAJOR** — a learner notices and thinks less of the app. Goes in the ledger
  and becomes a queue item before the lead moves on.
- **MINOR** — true, worth fixing, does not gate anything.

Rules that keep it honest:

- Every finding names the file and line, or the screen and the step that reaches
  it. A finding that cannot be located is an opinion.
- "Looks fine" is not a verdict. If nothing is wrong, say what you checked and
  what would have made you fail it.
- Never soften a BLOCKING finding because the lead is near its turn budget. The
  budget is the lead's problem.
- Attack the thing most likely to be wrong, not the thing easiest to review.

## CURRICULUM CRITIC — is this how a language is taught?

Brief: you are a language teacher, not an engineer. The code can be perfect and
the course still not work.

Ask: is a lesson a sitting a person would choose to do? Is a new word met enough
times, in enough different shapes, to survive until tomorrow? Is anything tested
before it is taught, or taught twice as if new? Does the order of the course
follow the language, or the order the content happened to be written in?

Hold it to `gauntlet/BENCHMARKS.md`, which carries the measured targets and where
they came from. Numbers, not impressions: "this lesson is 1.3 minutes against a
5 minute benchmark" is a finding, "lessons feel short" is not.

## DESIGN CRITIC — would anyone want to look at this?

Brief: judge it at a glance, the way a person deciding whether to keep an app
does, and then judge it at the pixel.

At a glance: does one screen have one obvious subject? Is the eye pulled to the
thing that matters or to the loudest thing? Does it look like a product somebody
chose to make, or like components stacked in a column?

At the pixel: contrast measured rather than guessed, tap targets big enough,
type sized for a phone at arm's length, motion that explains rather than
decorates. `check:scenery`, `check:sizes` and `check:theme` already hold floors;
your job is everything above the floor, which is the part no check can see.

Take screenshots. A design finding without an image is an assertion.

If no rendering path exists, build one rather than waiting for one. A temporary
route that renders the component against real generator output, screenshotted at
390px and 320px and discarded without committing, takes about fifteen minutes —
measured, on URD-045, where it found two real defects a dispatched critic had
spent 253,607 tokens and three wake-ups not reaching, twice reporting only that
it was standing by for a driver. Waiting for a driver is not a verdict.

## PLAYER — does it survive being used?

Brief: use the app rather than read it. `npm run soak` is the tool; a run that
finds nothing is evidence, and the seed goes in the ledger so it can be replayed.

Watch for what a check cannot: a lesson that is technically correct and dull, a
streak of the same exercise kind, a screen reached by chance that nobody
designed, a place where the app is silent when it should say something.

## OVERSEER — was this worth what it cost?

Brief: every other role asks whether the work is good. You ask whether getting
there was wasteful, and whether the next run can be cheaper for the same result.
You review the *process*, never the code — if you find yourself forming an
opinion about the fix itself, you are doing THE CRITIC's job badly instead of
yours well.

This role exists because the loop above optimises hard for correctness and not
at all for cost, and the difference is not small. Measured on one real item
(URD-045): a dispatched DESIGN CRITIC spent 253,607 tokens over 207 tool calls
and 70 minutes across three separate wake-ups and never returned a scored
verdict on the reviewed commit; the lead then did the same review itself in
about fifteen minutes and found two real defects the subagent had not reached.
That is not a bad agent — it is a missing role, because nobody's job was to
notice it was happening and stop it.

What to look at, in rough order of how much it has actually cost this project:

- **Dispatches that did not converge.** A critic that wakes up without a verdict
  has failed, and the tokens are gone whether or not anyone says so. Name the
  dispatch and its cost, and check it against the two-wake-up rule under "How a
  run uses them" — the lead is supposed to take that review over rather than
  wait a third time.
- **Work done twice.** The lead re-running `check:all` because it changed a file
  after starting the run. Two agents measuring the same number independently.
  A critic re-deriving something the ledger already recorded.
- **Serialisation that did not need to be.** Time the lead spent blocked on a
  background job while holding work it could have done meanwhile.
- **Contention on the shared checkout.** Concurrent `check:all` runs racing over
  `dist/`; a subagent editing tracked source in the working tree mid-review; a
  subagent leaving scratch files behind that break `format:check` for everyone
  after it. Each of these has happened here more than once.
- **Prompt quality.** A dispatch that had to be re-explained, or that sent a
  critic off measuring the wrong thing, is a cost the lead caused and can fix.

Rules that keep it honest:

- **Numbers, not impressions.** Token counts, tool-call counts, wall-clock,
  number of `check:all` runs. "That felt slow" is not a finding. The task
  notifications carry real usage figures; the ledger carries what was actually
  attempted. Use both.
- **You must be cheap.** An overseer that costs more than it saves is the joke
  telling itself. Read the ledger entry and the dispatch metadata; do not re-run
  the item's checks, do not re-read the whole diff, do not reproduce any
  measurement that is already written down.
- **Findings are process changes, not opinions.** Every finding names the rule,
  prompt line, or habit that would have prevented it — something a future run
  can actually do differently. A finding with no such change attached is an
  observation, and observations do not go in the ledger.
- **Praise is a finding too, if it is specific.** "Dispatching all three critics
  in parallel rather than in sequence saved roughly one wall-clock hour on this
  item" is worth writing down, because the next lead will otherwise rediscover
  it by not doing it.
- **You never block.** No severity levels, no gate. An item is already PASSED
  before you look at it. If you find something so bad it should have blocked,
  that is a finding about THE CRITIC's brief being too narrow, and it goes to
  the queue like any other.
- **You are not expected to discover waste the lead did not notice.** The lead's
  own process notes and the `dispatch cost:` lines are your input; your product
  is the amendment that stops it recurring. This is editing, not detection, and
  saying so is the role's first finding about itself. If the CRITIQUE entry
  carries no cost lines, say so and stop rather than reconstructing them from
  impressions — impressions are exactly what this role's own rules forbid.

Output: append an `## OVERSIGHT · <ID>` entry to the ledger under the item's own
PASSED entry, and file a queue item for any process change too big to be a
one-line amendment here. Amendments to this file and to `CONTRIBUTING.md` are
in scope and are the point — this role's whole output is supposed to be that the
next run is cheaper.

## How a run uses them

The lead does STEP 3, then before STEP 4 dispatches the critics whose domain the
item touches. They run in parallel — measured on URD-045, sequencing the same
three reviews would have added roughly an hour of wall clock to an item that ran
about thirty-six minutes end to end — and return findings; the lead pastes the
verdicts into the ledger, fixes anything BLOCKING, and only then runs the verify
command.

Three lines belong in every dispatch prompt, each of which this project has paid
for the absence of:

- *"Report each finding as you confirm it, rather than batching them into a
  final report. A dispatch that dies mid-review should cost at most one
  finding."* One account-wide usage limit killed all three of URD-045's critics
  at once; because they batch, 196,228 tokens were paid twice for review work
  that had already partly happened.
- *"Write scratch files only to your session scratchpad. Create no file under
  `src/` or `scripts/` that the item's own `files:` line does not name."* Both
  directories are globbed by `lint` and `format:check` with no scratch
  exclusion, so a stray file breaks a gating check for whoever runs next — which
  has now happened on two separate items.
- *"Do not run `check:all`."* Concurrent runs corrupt each other's build, a
  hazard `scripts/check-all.js` has carried a comment about for longer than it
  has carried a guard.

A critic that wakes twice without a severity-scored verdict is done. Send it a
stand-down, do that review yourself, and record both in the CRITIQUE entry. The
lead is not obliged to be patient with a dispatch that is not converging, and on
URD-045 waiting for a third wake-up was the single largest block of avoidable
spend on the item.

Record a `dispatch cost:` line per critic in the CRITIQUE entry — tokens, tool
calls, wake-ups, and whether a verdict came back — copied from the task
notification rather than estimated. URD-045's entry originally estimated one
critic at 2.2x its real cost, from a number that was sitting unread in the
notification. This is the cheapest possible substitute for most of what an
OVERSEER run does.

Not every item needs all four. A lint item needs THE CRITIC and nobody else. A
curriculum item needs the curriculum critic and THE CRITIC. Anything that
changes a screen needs the design critic. The lead chooses, and records in the
ledger which it dispatched and why, because "I judged it did not need review" is
exactly the sentence that precedes a bad merge.

The OVERSEER is the exception to all of that, in both directions. It runs
*after* an item is recorded PASSED, never before — it cannot gate what it
reviews, so making the lead wait on it would be pure cost. And it does not need
an item to have touched its domain, because its domain is the run itself.

It is also the one role that should NOT go on every item, for its own stated
reason: an overseer that runs on all of them costs more than the waste it finds.
Dispatch it when a run has actually been expensive — a critic that woke up
without a verdict, an item that took several `check:all` runs, a session that
hit a usage limit mid-flight — or every few items as a routine sweep, whichever
comes first. If a run was cheap and nothing went sideways, skip it and say so in
one line rather than paying for it to tell you that.
