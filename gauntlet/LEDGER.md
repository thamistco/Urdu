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
