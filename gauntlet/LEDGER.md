# Gauntlet ledger

Append only. Newest entries at the bottom. Never rewrite history here.

The cloud runner clones this repo fresh on every run and remembers nothing
between them. This file is the entire memory of the loop: what was claimed, what
was proved, what failed and why. A run that does not commit its entry has not
happened as far as the next run is concerned, and the work will be done again.

Entry types: CLAIMED · PASSED · FAILED · BLOCKED · NO-WORK · DONE-FOR-NOW

Rules that keep this worth reading:

- Paste the real output of the verify command. Not a summary of it, and never a
  claim that it passed without the text that says so.
- An item is done when a command exits 0. Reasoning about why it ought to pass
  is not evidence and does not go in the PASSED entry.
- Record decisions taken alone. Nobody is going to answer a question mid-run, so
  the decision and its reason are the deliverable.
- Read this file before the diffs. It tells you whether the loop is thinking
  straight; the diffs only tell you what it typed.

---

## CLAIMED · URD-A01 · 2026-08-08T08:12Z
Give every topic a category.
verify: `npm run check:shape`
branch: claude/gauntlet-topic-categories
run: by hand from an interactive session, not the routine. The routine
(trig_01A1PR5M8aYv8f2dLyeDFHn5) is disabled: a routine fired session gets an
empty working directory because create_trigger has no way to name a repository.
Confirmed by probe session_01HJWQQgf9fVGsH91Bach9bZ, which reported
"empty /home/user, no git, no gauntlet/QUEUE.md". Two fires produced nothing.
