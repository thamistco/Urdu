# Gauntlet loop

A self-restarting autonomous work loop. Two layers:

- **Outer loop** — a cloud Routine on an hourly cron. It fires whether or not
  there is quota. When rate limited the run is rejected and nothing happens;
  when the window resets, the next fire just works. That rejection *is* the
  self-restart. No scripts, no VPS, no tmux.
- **Inner loop** — `/goal` inside each run, chewing queue items until the turn
  budget is hit, then stopping cleanly with everything committed.

## The files

```
.claude/settings.json    effort and permissions for cloud runs
gauntlet/QUEUE.md        ordered backlog, top item is next up
gauntlet/LEDGER.md       append only run log, the loop's only memory
gauntlet/blocked/        items that failed three times, with notes
gauntlet/done/           completed item specs, for audit
```

The cloud runner clones this repo fresh every run and remembers nothing.
`LEDGER.md` is therefore the entire memory of the loop. If it is not committed,
the loop has amnesia and redoes work it already did.

## The routine prompt

Create at [claude.ai/code/routines](https://claude.ai/code/routines), or `/schedule`
in the CLI. Hourly.

```
You are running one iteration of the Harf gauntlet. Harf is an Urdu course
(Expo / React Native / react-native-web) deployed to GitHub Pages. You are
unattended.
Nobody will answer questions. Never ask; decide and record the decision.

STEP 1 — ORIENT
Read gauntlet/LEDGER.md (last 3 entries) and gauntlet/QUEUE.md.
If QUEUE.md is empty, append a NO-WORK entry to LEDGER.md, commit, and stop.

STEP 2 — CLAIM
Take the top unclaimed item in QUEUE.md. Create a branch
claude/gauntlet-<slug>. Append a CLAIMED entry to LEDGER.md with the
item id, timestamp, and the item's stated verification command.

STEP 3 — WORK
Set this goal and work it:

  /goal <the item's Definition of Done>, proven by <the item's verify
  command> exiting 0, with no other test file modified — or stop after
  12 turns and record why

STEP 4 — VERIFY
Run the item's verify command. Paste the actual output into the ledger.
Never mark an item done on the basis of your own reasoning — only on a
command exiting 0. If it passes: move the item spec to gauntlet/done/,
remove it from QUEUE.md, commit, push the claude/ branch, open a PR.

STEP 5 — ON FAILURE
Append a FAILED entry with the real error output and your diagnosis.
Increment the item's attempt counter in QUEUE.md.
- Attempt 1 or 2: leave it at the top of the queue for the next run.
- Attempt 3: move the item to gauntlet/blocked/ with your notes, remove
  it from QUEUE.md, and note in the ledger that it needs Opus or a human.
Then move to the next queue item if turns remain.

STEP 6 — CLOSE
Whatever happened, before you finish: commit and push. A run that ends
with uncommitted work is a lost run. Append a DONE-FOR-NOW entry
summarising what changed and what the next run should pick up.

HARD RULES
- Never push to main. Only claude/-prefixed branches.
- Never edit or delete a test to make it pass. If a test looks wrong,
  record that in the ledger and move the item to blocked/.
- Never add a dependency not already in package.json without recording
  why in the ledger.
- Keep to 12 turns. Stopping early with clean state beats finishing
  dirty.
- `npm run check:all` is the gate for anything touching shipped code. It
  reads its step list out of the deploy workflow, so it cannot drift from
  what CI runs.
- Never weaken an existing check to make an item pass. Several items name
  a check they must not relax on the way past; that is the whole point of
  them. Fix the code, or disable at the site with a sentence saying why
  the rule is wrong there.
- A new check you add must be broken on purpose once, and seen to fail,
  before you trust it. A check that has never failed is a hypothesis.
  Record the induced failure output in the ledger.
- Read docs/ENGINEERING_STANDARDS.md before writing code. It is the
  constitution of this repo and it is not optional.
- Measure, do not estimate. Contrast ratios, file sizes and render counts
  get measured on the real built artifact, never inferred.
```

## Queue items

Every item needs a machine-checkable gate. An item with no verify command is a
drift generator: it will be marked done wrongly, and stay wrongly done.

```markdown
## URD-004 — Make the top level titles reachable
attempts: 0
files: src/lib/gamification.ts, src/lib/gamification.test.ts
definition of done: The highest level title is attainable by finishing the
  course. Measured: the whole path is roughly 11,552 XP, which is level 20
  on xpForLevel(n) = 30(n-1)n. "Master" is level 25 and needs 18,000.
verify: npm test -- src/lib/gamification.test.ts
notes: Derive the course total in the test rather than hardcoding it, so it
  stays true the next time the path grows.
```

`verify` may name a script that does not exist yet — creating it is part of the
work. The item is done when that command exits 0, and not before.

## Two things that will bite you

**Usage credits must be off**, at [claude.ai/settings/usage](https://claude.ai/settings/usage).
With credits on, hitting the subscription limit does not stop the loop, it
starts billing at API rates, hourly, unattended. With credits off the run is
simply rejected until the window resets, which is the behaviour you want. Check
this before turning the routine on.

**There is no quota API.** A run cannot see how much of the window is left, so
"stop just short of the limit" is not literally achievable. Cap each run at
about 12 turns so no single run drains a window, and let rejection be the brake.
If a run is cut off mid-work, the branch and the ledger are the recovery point,
which is what Step 6 is for.

Routines are in research preview, there is a daily cap on runs per account
separate from usage limits, and the minimum interval is one hour.

## First run checklist

1. Commit these files with two or three queue items.
2. Run the loop **manually once** in a terminal, paste the prompt, and watch it.
   Fix the prompt before automating anything.
3. Create the routine, hourly. Use **Run now** and read the transcript.
4. Trim the routine's connectors to only what it needs. Everything connected is
   available to it without asking.
5. Let it run one overnight cycle. Read the ledger in the morning, not the
   diffs. The ledger tells you whether the loop is thinking straight; the diffs
   only tell you what it typed. Then read the PRs.

A green run status means the session started and exited without an
infrastructure error. It does not mean the task succeeded. Trust the ledger and
the PRs.

## Where the queue comes from

The queue is not a list of things Urdu apps generally need. Every item in it was
found by measuring this repo, and each carries the number that found it, so a
run can tell whether the item is still real before starting work. If a
measurement no longer reproduces, the honest move is to close the item in the
ledger, not to invent work that justifies it.

What that turned up, and what it says about where this app actually is:

- **Its own recent work is the biggest risk.** Splitting topics across enough
  lessons to cover their vocabulary took the path from 174 lessons to 608. The
  learn screen maps every lesson of every unit inside a plain `ScrollView`, so
  all 608 rows mount at once, and a returning learner's unit percentages fell
  without them doing anything. Neither is caught by any existing check. Both are
  near the top of the queue.
- **The gamification numbers were tuned for a shorter course.** Finishing
  everything now yields about 11,552 XP, which is level 20; the top title sits
  at level 25 and needs 18,000. Nobody reaches it by playing.
- **The tools have gaps too, and they count.** The soak added in `e3e0546` only
  ever exercises two of the nine exercise kinds, because it starts at lesson one
  and the first units are alphabet lessons. A soak that never reaches
  `sentenceBuild` is not soaking the part of the app most likely to break.
- **Several things a generic list would queue are already done here.** The
  Nastaliq font is loaded and subset, `check:srs` holds the scheduler,
  `check:roman` holds transliteration against a canonical table, `check:voice`
  holds every clip audible, `check:order` holds teaching order, and
  `check:coverage` holds every one of the 2,281 words to exactly one lesson.
  Queueing those again would burn runs proving what is already proven. Where an
  item does touch one of them, it names the check it must not weaken on the way
  past.
- **What is genuinely missing is narrower than a generic list suggests.** Four
  letters that sound identical and so cannot be tested by ear, a first-run
  lockout with no way out and no explanation, 20 typed `any`s, and 8 physical
  direction properties.

  A generic list would also queue "mark synthesised audio as synthesised". Every
  clip in Harf is synthesised, so a per-clip flag would be a constant, and a
  check on it would assert nothing. If the app should disclose that its audio is
  synthetic, that is one sentence somewhere, not a data model.

## Two adaptations to the original spec

Both would have failed on the first unattended run, so they are fixed in the
committed files rather than discovered at 3am:

- **`git push` was missing from the allow list** while Steps 4 and 6 both
  require it. An unattended run would have stopped to ask for permission nobody
  was there to give. `Bash(git push:*)` is allowed; the force variants stay
  denied. Branch creation was missing for the same reason and is allowed too.
- **The build script here is `npm run build:web`**, not `npm run build`, and the
  checks are `npm run check:*`. The allow list names the commands this repo
  actually has, so the loop cannot stall on a script that does not exist. Tests
  live beside their source as `src/**/*.test.ts`; there is no `test/` directory.
