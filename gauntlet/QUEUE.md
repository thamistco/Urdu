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

## URD-070 — traceTheLetter's "stroke registered" guard only proves the pointer's first point landed on the pad, not the rest of the walk
attempts: 0
files: scripts/soak.js
definition of done: URD-068 fixed `traceArea()` to read the drawing pad's
  real `boundingBox()` instead of inferring one from the caption, and
  added a guard — after the walk, assert the "Draw over the grey letter"
  caption is gone, proving *some* stroke registered — specifically to
  stop a driver from reporting an answer it never actually gave.
  `TracePad`'s `PanResponder.onPanResponderGrant`
  (`src/components/TracePad.tsx:88-91`) records a stroke and clears the
  caption on the bare touch-DOWN point alone, before any of the walk's
  subsequent `mouse.move()` calls run. So the guard proves only that
  `walk[0]` landed inside the pad — not that `walk[1..end]` did. A
  `traceArea()` rect that is subtly wrong (a small size/scale mismatch
  between the measured `boundingBox()` and the pad's real touch surface,
  rather than the total, uniform miss URD-068 fixed) could still pass
  this guard on point one while later points — especially near the
  glyph's edges, which the nearest-neighbour walk in `glyphStroke()`
  visits — drift off the true pad, producing a partial or garbage stroke
  that still "answers" the exercise rather than dead-ending. "Nothing
  broke" would not catch this: the invariant it violates is grading
  accuracy, not liveness, and none of `playLesson`'s checks look at it.
  A promising direction, not mandated: `TracePad` already renders
  "N% of the letter covered" after `Check` is tapped
  (`TracePad.tsx:223`, `check()`'s own `scoreTrace` call) — reading that
  percentage back and asserting it's high on a real (non-`wrongOnPurpose`)
  walk would catch a walk that silently went off-pad partway through,
  which the mere absence of the caption cannot.
verify: construct a `traceArea()` that is correct at the walk's first
  point but off by enough at the glyph's far edge to put later points
  outside the real pad (e.g. scale the measured rect by a few percent
  around its own top-left corner rather than its centre) — confirm the
  existing "stroke registered" guard still reports success while the
  actual coverage `TracePad` grades is visibly degraded, then fix the
  guard so it can tell the two cases apart and confirm the same
  deliberately-wrong rect now fails loudly instead.
notes: Found by THE CRITIC, dispatched retroactively against the pushed
  URD-068 commits (see `gauntlet/LEDGER.md`'s
  "CRITIQUE · URD-067 & URD-068 · retroactive dispatch" entry) — one
  MAJOR, same class of blind spot as the bug URD-068 fixed, one level
  down, in the exact mechanism whose own doc comment claims it closes
  that hole. Not blocking URD-068's PASSED status: the fix genuinely
  closes the total-miss case it was built for, verified independently by
  the critic with a live re-run; this is a narrower, unclosed residual.

## URD-071 — do-chashmi-he's note correctly explains its own function, but that text is never shown to a learner during real play
attempts: 0
files: src/data/letters.ts, src/exercises/generator.ts, src/screens/LetterLabScreen.tsx (or a new lesson-time surface)
definition of done: `do-chashmi-he`'s `note` field
  (`src/data/letters.ts`, group 8) correctly states its actual function —
  "it aspirates the letter before it (k→kh, b→bh)" — a silent modifier on
  the *preceding* consonant, not a standalone sound the way `choti-he`
  is. That correct explanation is data only: `letter.note` renders in
  exactly one place in the whole app, `LetterLabScreen.tsx`, already
  documented elsewhere in this corpus (`src/data/letters.test.ts`,
  URD-053's own note) as "flashcard trivia, not part of the real lesson
  path." The one exercise mechanism that surfaces note text *during* real
  play, `letterContrastExercise` (via `confusableMatesIn()`,
  `src/exercises/generator.ts`), is gated strictly by `confusableWith`
  buckets — which `do-chashmi-he` correctly has none of (URD-067). Net
  effect, confirmed by tracing the real call graph: across
  `do-chashmi-he`'s 6 real sightings in lesson `l-8` ("The h family"), a
  learner sees "do chashmī he · sounds like 'h (aspirate)'" repeated
  verbatim and is never told what "aspirate" means or that ھ modifies the
  letter before it, unless they voluntarily open the letter lab. Not a
  repetition problem — ھ appears in 197 of 1,010 word entries (~19.5%),
  heavy real-word reinforcement (تھا/تھی/تھے/تھیں, اچھا) — the gap is the
  missing explicit "here's the rule" moment, not exposure count.
verify: TBD by whoever picks this up — measure, don't assume, exactly how
  many of `letters.ts`'s 40 entries have a `note` describing *behaviour*
  (a modifier, a rule, a "never stands alone") rather than pure *shape*
  ("one dot above", "same bowl as"), since `do-chashmi-he` is likely not
  the only one affected. `confusableWith` is documented as, and should
  stay, a visual-shape mechanism (do not fix this by adding a link
  URD-067 correctly declined to add — CURRICULUM CRITIC explicitly
  checked and rejected that route, since it would misrepresent an unlike
  pair as near-identical outlines to the `letterContrast` UI). The
  right-shaped fix is a real exposure path for a *function* note,
  independent of the shape mechanism — e.g. surfacing it once on a
  letter's first real sighting, or a lightweight second note field shown
  the first time such a letter is met — decided and justified in the
  same way URD-067 had to justify its own criterion, not assumed.
notes: Found by CURRICULUM CRITIC, dispatched retroactively against the
  pushed URD-067 commits (see `gauntlet/LEDGER.md`'s
  "CRITIQUE · URD-067 & URD-068 · retroactive dispatch" entry). Not
  blocking URD-067 — the shape decision that item actually made (no
  `confusableWith` link) is correct and unrelated to this gap; this is a
  different, pre-existing pedagogical question URD-067 and URD-053 both
  came near but neither one actually closed.

---

The queue was briefly empty as of 2026-08-29, when URD-065 through
URD-069 were all PASSED with no items behind them — the first time in
this file's history. It did not stay that way: dispatching the critics
those five items should have had at the time (see the ledger entry
above) surfaced URD-070 and URD-071 the same way URD-009–013 and URD-A01
came from critiquing earlier work rather than a fresh sweep. That is the
loop working as intended, not a sign the earlier "done" claims were
false — both items above still stand PASSED, with these two filed
forward rather than reopened.
