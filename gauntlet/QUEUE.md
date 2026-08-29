# Gauntlet queue

Ordered. The top unclaimed item is what the next run picks up.

Every item carries a `verify` command that exits 0 or does not. An item without
one is a drift generator: it gets marked done on somebody's reasoning and stays
wrongly done. If you add an item and cannot name the command that proves it, the
item is not ready to be queued.

`verify` may name a script that does not exist yet — creating it is part of the
work. The item is done when that command exits 0, and not before.

Every item below came from measuring this repo, not from a list of things Urdu
apps generally need. The numbers in them were taken on 2026-08-07 at `5cbe0e6`,
and the ones URD-A02 attempt 1 moved were re-measured on 2026-08-09 at `d778928`
and say so where they changed. If a number no longer reproduces, say so in the
ledger and close the item rather than inventing work to justify it.

Items URD-009 to URD-013 came out of the critique of URD-A02 rather than a sweep,
which is the loop working as intended: the review of one item is the best source
of the next ones.

`npm run check:all` is the final gate for anything touching shipped code. It
reads its step list out of `.github/workflows/deploy-preview.yml`, so it cannot
drift from what CI runs.

`npm run check:shape` states the curriculum target in a form a machine can
settle. It failed on purpose for most of this file's life, deliberately kept
out of `check:all` until URD-A02 closed its last two problems; it passes now
and is wired into `.github/workflows/deploy-preview.yml`, so `check:all`
gates it like everything else.

Items are dispatched to critics before they can be recorded PASSED; see
gauntlet/ROLES.md. The measured targets the curriculum critic holds you to, and
where they came from, are in gauntlet/BENCHMARKS.md.

---

## URD-072 — baRi-ye is drilled on positions its own glyph never occupies in real text
attempts: 0
files: src/data/letters.ts, src/exercises/letterFormGrading.ts (or wherever the
  substitution is judged to belong)
definition of done: `baRi-ye`'s `forms` (`src/data/letters.ts`) are hand-written
  rather than built with `nonConnector()`/`connector()`, because the letter
  never actually occurs at the start or middle of a real Urdu word — it is
  final-only. To keep the four-position `letterForm` drill uniform, its
  `initial`/`medial` entries are substituted with a *different* letter's
  glyph (`choti-ye`'s `ی`), and nothing on screen — not `baRi-ye`'s own
  `note` ("wide sweeping tail used at the end of words"), not the exercise
  itself — tells a learner this is happening. `isCorrectPosition`
  (`letterFormGrading.ts`) grades by literal string equality across `forms`,
  so the substitution passes ordinary grading silently; `pickedATwin`
  (`LetterExercises.tsx`) only fires for a genuine self-duplicate
  (`nonConnector()`'s case), not this one, so its own explanatory line never
  appears either. A learner is quizzed "which position is this letter
  showing?" against start/middle glyphs that are, in real text, never this
  letter's own.
verify: decide and justify, the way URD-067 had to for its own criterion,
  whether the right fix is (a) excluding `baRi-ye` from `letterForm`'s
  full 4-position drill entirely (it only has two real positions:
  isolated/final), (b) a reveal line analogous to `pickedATwin`'s that
  fires specifically for this substitution and says so, or (c) something
  else — then add a test in the shape of `letterFormGrading.test.ts`'s
  existing invariants proving the chosen fix, and confirm any other letter
  with the same real shape (final-only, hand-written `forms`) is covered
  by the same rule rather than special-cased to just `baRi-ye`.
notes: Found by CURRICULUM CRITIC, dispatched retroactively against
  URD-071's pushed commits (see `gauntlet/LEDGER.md`'s "CRITIQUE ·
  URD-070 & URD-071 · dispatched properly this time" entry) while
  checking whether URD-071's "exactly 2 letters" scope claim was
  actually complete. It wasn't, for a different reason than the one
  searched for — this is a synthetic-position case, not a modifier-of-
  neighbour case, and the search pattern that found `do-chashmi-he`/
  `noon-ghunna` cannot find it. Not blocking URD-071 — pre-existing,
  unrelated to that item's diff.

## URD-073 — tracedPointsDrift has no independent defense against a wrong-pad-selected bug
attempts: 0
files: scripts/soak.js
definition of done: URD-070's `tracedPointsDrift()` catches a `traceArea()`
  rect that is wrong *for the right pad* — it reads the pad via the exact
  same selector/heuristic `traceArea()` already used
  (`page.locator('[aria-label^="Drawing area"]')`, first on-screen match)
  and checks the recorded stroke against that same element's own geometry.
  A future bug where the driver identifies the *wrong* pad entirely (two
  drawing surfaces mounted at once, a stale previous screen not yet
  unmounted — this file's own long-standing comment on why every
  interaction is filtered by on-screen position documents this class of
  hazard as real, not hypothetical) would have both calls agree with each
  other trivially: the wrong pad's own points would read as "inside" its
  own bounds, zero drift, no finding — the exact blind spot this item
  exists to close, one layer up.
verify: construct a scenario with two `[aria-label^="Drawing area"]`
  matches on screen at once (or simulate one convincingly) where the
  walk is computed against one and drawn on the other; confirm
  `tracedPointsDrift` currently reports clean in that case, then add a
  second, independent way to confirm identity (e.g. cross-checking the
  pad's own screenshot pixels against where the glyph mask expects ink,
  the way `glyphStroke` already does, rather than trusting the same
  locator twice) and confirm the constructed scenario now fails loudly.
notes: Found by THE CRITIC, dispatched retroactively against URD-070's
  pushed commits (see the same ledger entry as URD-072 above). Not
  blocking URD-070 — that item's own target (a right-pad-wrong-rect
  bug) is genuinely closed; this is a materially different failure mode.

## URD-074 — the trace-drift check's real sensitivity is bounded by glyphStroke's own sampling margin, not by its SLACK constant
attempts: 0
files: scripts/soak.js
definition of done: URD-070's drift check tolerates 2px of rounding slack
  at the pad's edge before flagging a recorded stroke point as outside it.
  Measured directly (`SOAK_MEASURE_DRIFT_MARGIN=1 npm run soak`): a real,
  correctly-geometried walk's closest recorded point never comes nearer
  than 30-34px to the pad's true edge, because `glyphStroke()` only
  samples 2px in from a screenshot already inset 4px from the pad, and a
  rendered glyph's own ink sits well clear of the card's border regardless.
  That natural clearance, not `SLACK`, is what actually bounds the check's
  sensitivity — it reliably catches a `traceArea()` drift of roughly 30px
  or more, not the few-px drift its own framing (URD-070's item text:
  "subtly wrong") described. Whether that's tight enough is an open
  question this item should answer with a number, not an assumption.
verify: decide what sensitivity is actually needed (what is the smallest
  real `traceArea()` regression that would meaningfully corrupt grading,
  and is 30px comfortably inside or dangerously close to that?), and if
  tighter detection is warranted, narrow `glyphStroke()`'s own sampling
  margin (or add a second, edge-focused sample pass) rather than retuning
  `SLACK`, which this item's own measurement shows would change nothing
  on its own. Confirm the new margin with the same `SOAK_MEASURE_DRIFT_MARGIN`
  instrumentation before and after, and re-run URD-070's own deliberate-
  failure repro at a smaller, genuinely marginal scale factor to confirm
  the tightened check now catches what the original 2px number could not.
notes: Found by THE CRITIC, dispatched retroactively against URD-070's
  pushed commits, measuring rather than assuming per this project's own
  non-negotiable #4 — the exact rule URD-070's own `SLACK` constant had
  skipped the first time. Not blocking URD-070 — the fix reliably catches
  what it was demonstrated against; this is about how much further it
  could reasonably go.

## URD-075 — functionNote still doesn't reach letterPick or letterTrace
attempts: 0
files: src/exercises/LetterExercises.tsx, src/components/TracePad.tsx (or
  src/exercises/TraceExercise.tsx)
definition of done: URD-071 gave `do-chashmi-he`/`noon-ghunna` a real,
  plain-language translation of their `sound` field's jargon, rendered in
  `LetterFormExercise` and `LetterSpotExercise` — the two exercise kinds
  that already had a place to hang it (a reveal-after-answering state, and
  a real word on screen, respectively). `LetterPickExercise` and
  `letterTrace` (`TracePad.tsx`) still show only the bare, untranslated
  tag ("h (aspirate)", "ñ (nasal)") with nothing added, because neither
  currently has an analogous "something else is already shown here"
  moment to attach `functionNote` to without inventing new UI.
verify: for each of the two remaining kinds, decide (and justify, the way
  URD-071 had to for its own two) whether a natural attachment point
  exists that URD-071's review missed, or whether closing this needs a
  genuinely new UI element — and if the latter, whether that is worth
  doing given `functionNote` already reaches 3 of `do-chashmi-he`'s 6 real
  sightings (`letterForm` ×2, `letterSpot` ×1) without it. Confirm with a
  live screenshot against a real lesson, the way URD-071 did, not asserted.
notes: Found by THE CRITIC, dispatched retroactively against URD-071's
  pushed commits (same ledger entry as URD-072/073/074). Not blocking
  URD-071 — the fix genuinely closed the "reaches a learner at all" gap
  for the two kinds it targeted; this is the remainder.

---

Empty of nothing-left-to-do items as of 2026-08-29, but not actually empty:
URD-072 through URD-075 came from dispatching, properly this time, the
critics URD-070 and URD-071 should have had before being recorded PASSED —
the same gap URD-067/068 had earlier the same day, caught this time only
because a direct question ("are all critics happy") prompted a check rather
than the file being trusted. Both PASSED statuses stand; none of the four
findings above were severe enough to block, and all four are recorded with
the critic that found them in `gauntlet/LEDGER.md`.
