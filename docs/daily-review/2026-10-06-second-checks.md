# 2026-10-06 · First second checks by agents

The owner replaced the two-day wait with a second check from a different
viewpoint, done by a separate agent, and asked for a manager that keeps the
agents from getting stuck. This is the first run of that, on the three features
built earlier today.

## What the critics found

All three came back **HOLD** the first time, each for something real that the
builder had missed:

- **P-002, the headline.** "You speak it. Now read it." had no subject (the
  wordmark never says "Urdu") and the store text dropped every word for a
  complete beginner. Now "Speak Urdu? Now read it." with a beginner line.
- **P-004, Read faster.** One curious tap-through stored a best of about 240 a
  minute that no honest round could beat, shown on the Review card for good. Now
  a reveal under 0.4 s does not count, and a best needs 8 of 10 genuinely read.
- **P-003, Say it back.** The privacy policy kept its old date, the store
  listing still said the app never listens, and double taps or a second line
  could leave a web microphone open. Held twice; fixed both times.

Each fix went back to the critic that held it, which then said **SHIP**.
Then each shipped through `check:all`, and the manager's own 320px screenshot
of a reading caught one more layout problem the critic had predicted (fixed
before shipping).

## What the agents cost

| Check                 | Rounds | Tool calls | Time (first + re-checks) | Tokens reported (last round) |
| --------------------- | ------ | ---------- | ------------------------ | ---------------------------- |
| P-002 critic          | 2      | 10 + 3     | 88 s + 21 s              | 82,097                       |
| P-004 critic          | 2      | 13 + 3     | 93 s + 28 s              | 89,083                       |
| P-003 critic          | 3      | 17 + 3 + 3 | 128 s + 39 s + 32 s      | 102,088                      |

Every agent finished well inside its budget (30 tool calls, 15 minutes); none
had to be stopped. The token figures are as the harness reports them for the
last round, which includes the agent's context carried from earlier rounds.

## What the manager learned

- The monitor watched the agents' output files for growth; those files do not
  grow while an agent works, so it reported nothing useful. Elapsed time against
  the budget, and the completion notice, are what to watch. The README now says
  so.
- Re-checks sent to the same critic were cheap (3 tool calls each), because it
  already held the context. Prefer resuming the critic that held a change over
  starting a new one.
- Every first verdict was HOLD, and every HOLD was right. The second check is
  doing its job.

## Not evidence for

- No critic ran a real screen reader or a real phone; their accessibility and
  native findings come from reading the code.
- "Say it back" was tested with Chromium's simulated microphone, not a voice.
