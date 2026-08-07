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
You are running one iteration of the Urdu app gauntlet. You are unattended.
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
```

## Queue items

Every item needs a machine-checkable gate. An item with no verify command is a
drift generator: it will be marked done wrongly, and stay wrongly done.

```markdown
## URD-014 — Ligature safe truncation
attempts: 0
files: src/components/UrduText.tsx, src/components/urdu-text.test.ts
definition of done: Urdu strings truncate at grapheme cluster boundaries,
  never mid ligature, and never orphan a diacritic from its base letter.
verify: npm test -- src/components/urdu-text.test.ts
notes: Nastaliq joins aggressively; slicing by code unit splits ligatures.
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

## Where this was adapted to the repo

Two things in the original spec would have failed on the first run here, and are
changed in the committed files rather than left to be discovered at 3am:

- **`git push` was missing from the allow list** while Steps 4 and 6 both
  require it. An unattended run would have stopped to ask for permission that
  nobody was there to give. `Bash(git push:*)` is allowed; the force variants
  stay denied. Branch creation (`checkout`, `switch`, `branch`) was missing for
  the same reason and is allowed too.
- **The build script here is `npm run build:web`**, not `npm run build`, and the
  checks are `npm run check:*`. The allow list names the commands this repo
  actually has, so the loop does not stall on a script that does not exist.

The starter queue was rewritten against this codebase for the same reason. The
original items assumed a `test/` directory and `npm test -- test/...`; tests here
live beside their source as `src/**/*.test.ts`. Several of the suggested items
were also already done — fonts are loaded and subset, `check:srs` exists,
`check:voice` exists — so the queued items are the parts genuinely still missing,
with the existing checks named as the things not to weaken on the way past.
