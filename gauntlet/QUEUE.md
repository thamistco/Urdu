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

## URD-065 — check:theme's withAlpha rule cannot see a faded text colour reached through a variable
attempts: 0
files: scripts/check-theme.js
definition of done: URD-052 taught `check:theme` to catch
  `withAlpha(palette.paper, N)` written *inline* at a `color:`/
  `placeholderTextColor=` site, but `Button.tsx` — the exact file whose
  real regression motivated URD-052 — reaches its disabled-label colour
  through a variable instead: `const text = disabled ?
  withAlpha(palette.paper, 0.55) : TEXT[variant]`, then `style={{ color:
  text }}` several lines later. URD-052's rule only ever looks at the
  token immediately following `color:`/`placeholderTextColor=`, so it
  never sees the `withAlpha` call at all when it's one hop away through a
  local variable — the same idiom this file already uses for every other
  colour it computes (`fill`, `edge`, `border` are all built the same
  way). Catch this shape too, or say plainly in the check's own doc
  comment that it only covers the literal-inline case (already done, by
  THE CRITIC's finding, as of URD-052's own fix) and is not the general
  claim its name suggests.
verify: with `Button.tsx`'s `text` variable temporarily set back to `0.4`
  (the file's own documented worst-case value, 3.24:1 against `ink700`),
  `npm run check:theme` reports it as a legibility-floor violation. Today
  it reports clean.
notes: Found by THE CRITIC reviewing URD-052, live-reproduced against the
  real file (reverted after). Not blocking that item — no real content
  regresses today, `Button.tsx`'s own value is already `0.55` — this is a
  coverage gap in the check itself, the same "the comment claims more
  than the code checks" mistake URD-052 exists to fix, now found one
  layer deeper in the fix it made. Closing it needs either a small
  forward data-flow trace (a local `const NAME = ... withAlpha(...) ...`
  followed by `NAME` reaching a text-colour prop within the same
  function) or accepting that a regex-based check cannot see through
  indirection and saying so — this file is deliberately "cheap and
  slightly conservative," not an AST walk, per its own header comment.

## URD-066 — check:theme's withAlpha rule cannot see a faded text colour whose ternary wraps onto multiple lines
attempts: 0
files: scripts/check-theme.js
definition of done: URD-052's `WITH_ALPHA_PAPER` regex excludes newlines
  from the gap between `color:`/`placeholderTextColor=` and the
  `withAlpha` call (`[^\n{}]*?`), so a ternary Prettier wraps onto several
  lines — which it will do the moment the expression crosses this
  project's configured `printWidth` (120; the real
  `LetterLabScreen.tsx:159` line this item fixed sits at 108 characters,
  single-line only by margin) — evades the check entirely. Catch a
  wrapped ternary too, without reopening the false-positive risk a
  newline-permissive version was found to have (a `color:`/
  `placeholderTextColor=` key followed, across a comma, by an unrelated
  sibling property whose own value happens to be a `withAlpha
  (palette.paper, …)` call would be misattributed as the *first* prop's
  value if newlines and commas are simply allowed through).
verify: with the real `LetterLabScreen.tsx:159` line reformatted onto
  Prettier's own natural multi-line ternary shape (value temporarily set
  back to `0.4`), `npm run check:theme` reports it as a legibility-floor
  violation. Today it reports clean.
notes: Found by THE CRITIC reviewing URD-052, live-reproduced against the
  real file (reverted after). Not blocking that item for the same reason
  URD-065 isn't: no real content regresses today, every real site this
  fix touches is currently single-line. Genuinely harder than it looks —
  a naive fix (drop the `\n` exclusion) was checked directly and shown to
  risk misattributing a sibling property's value to the wrong key, which
  would be a new class of false positive worse than the false negative it
  closes. Likely needs the same real parsing URD-065 would need, or a
  bound smarter than "no newlines" (e.g. stop at the next `key:` pattern,
  not just the next brace) — worth solving both in one pass since they
  share a root cause (this file is regex-based, not an AST walk).

## URD-067 — choti-he and do-chashmi-he share a teaching group and a visual family but have no confusableWith link
attempts: 0
files: src/data/letters.ts
definition of done: `choti-he` (ہ) and `do-chashmi-he` (ھ) sit in the same
  teaching group (`group: 8`, the file's own comment literally reads "the
  h family") and are taught back to back, yet neither names the other via
  `confusableWith` — unlike `khe`, which does link to `baRi-he`
  (`confusableWith: 'baRi-he'`) despite being in a different group
  entirely. The two glyphs differ only by the two "eyes" (dots) `do
  chashmi he`'s name describes, the same kind of close visual pair
  `confusableWith` exists to keep apart within a lesson's rounds
  (`bucketKeyOf`/`letterContrast`, generator.ts) and drill directly
  against each other (URD-047). Decide, against the real rendered glyphs
  at the sizes the app actually draws them, whether this is a genuine
  visual confusable pair that belongs in the same bucket, or whether the
  two "eyes" are visually distinct enough at those sizes that no link is
  warranted — either way, say so on purpose rather than by omission.
verify: a test in the same shape as `src/data/letters.test.ts`'s existing
  `confusableWith`-bucket invariants (one base per bucket, etc.) covering
  whichever answer is chosen — either asserting `do-chashmi-he` and
  `choti-he` share a bucket the way `khe`/`baRi-he` do, or a comment on
  both entries stating why they deliberately don't, checked against a
  real rendered comparison (a design-harness screenshot at the app's own
  letter-lab size, per this project's established harness technique) not
  assumed from the glyphs' Unicode names alone.
notes: Found by CURRICULUM CRITIC reviewing URD-053, judging the
  `do-chashmi-he` sound-collision exclusion (correct — it's a genuinely
  distinct aspirate phoneme, not a second spelling of plain h) but noting
  this is a *different* axis of potential confusion (visual shape, not
  sound) that URD-053 never touched and that predates it. Not blocking
  URD-053 — that item's own scope is the same-sound disambiguation notes,
  and `do-chashmi-he`'s own note already correctly explains its real
  phonetic role independent of this gap.

## URD-068 — traceTheLetter's solver dead-ends on a real letterTrace screen, newly reachable now that URD-063 unblocked letterSpot
attempts: 0
files: scripts/soak.js
definition of done: `scripts/soak.js --seed 4 --lessons 8` (real run, this
  session) hits a genuine "dead end" failure — 4 identical, unchanged
  screenshots of "be · start / trace the letter" — never reachable before
  URD-063, because every earlier attempt on that seed hard-failed on the
  very first `letterSpot` screen instead (confirmed directly: the same
  seed against the pre-URD-063 code reproduces 5/5 `unanswerable screen`
  failures on that first `letterSpot`, never reaching `be`'s trace screen
  at all). `traceTheLetter` (`soak.js`) reads the glyph off a screenshot
  of the drawing panel and walks a nearest-neighbour path through its dark
  pixels; on this specific screen it returns `false` — no trace is drawn,
  the "Draw over the grey letter" caption and blank grey glyph sit
  unchanged across every retry — and the driver has no other move for a
  `letterTrace` screen, so the same screen repeats until the idle counter
  (4) fires. Root cause not yet isolated: candidates include the drawing
  area's computed bounding box (`area = { x: box.x - 4, y: box.y - 330,
  ... }`) landing off-panel for this specific letter/position/viewport
  combination, or the panel's rendered glyph mask being too light for the
  `lum < 200` threshold to find at least 12 points, or something specific
  to `be`'s own glyph or the `alone`/`initial` position. Adjacent to
  URD-063, not that item's fault — nothing in this file's tracing logic
  changed there.
verify: reproduce `--seed 4` losing to this exact dead end, instrument
  `traceTheLetter` to log why it returns `false` on this specific screen
  (empty `pts`, an out-of-bounds `area`, or something else), fix the real
  cause, and confirm `--seed 4 --lessons 8` no longer dead-ends on it —
  screenshots on real re-runs should show at least a partial trace drawn
  before either passing or being correctly refused.
notes: Found running URD-063's own verify command
  (`npm run soak -- --lessons 8 --require letterSpot`, several seeds) to
  check whether letterSpot's fix let a letter lesson complete — it did not
  reproduce a completion in ~85 attempts across 6 runs (0/85), and this
  dead end is one of the reasons why: a real, load-bearing failure mode
  that letterSpot's own earlier hard-failure had been masking simply by
  making sure no run ever got far enough to reach it. The other reason
  (hearts economy attrition making full-lesson survival low-probability
  per attempt even with every named kind solving correctly) is already
  documented and accepted elsewhere in this file's own comments, from an
  earlier item — not new, and not this item's to fix either.

## URD-069 — Choice's marginStart/marginEnd style prop renders as zero gap in the real web build
attempts: 0
files: src/exercises/common.tsx, src/exercises/LetterSpot.tsx
definition of done: `Choice` (`common.tsx`) accepts a `style` prop typed
  `{ marginStart?; marginEnd?; marginTop?; marginBottom? }`, merged into
  its `Pressable`'s own function-valued `style` callback
  (`style={({ pressed }) => ({ ...computed, ...style })}`). `LetterSpot.tsx`
  passes `style={{ marginStart: wordGap, marginEnd: 4 }}` specifically so
  a wider gap falls between tiles that cross a real word boundary in a
  multi-word phrase (`baRi-he`'s خدا حافظ, `hamza`'s ان شاء اللہ) — the
  component's own doc comment says so directly ("rendered as a wider gap
  in LetterSpot.tsx, so the tile row's grouping matches what the prompt
  actually reads"). Measured directly against the real exported web build
  (a design-harness render of `LetterSpotExercise` against real generator
  output, screenshotted and inspected via `getBoundingClientRect`/
  `getComputedStyle`, at 320/390/1280px): every adjacent tile pair
  touches at 0px, regardless of whether `wordGap` was 4 or 14, and the
  rendered `<button>`'s own class list and inline attributes carry no
  margin at all — only `transform`/`opacity` from the same style object
  made it through. The sibling `my-1` Tailwind className on the identical
  element correctly produces a real 4px vertical margin, so the mechanism
  that's broken is specifically react-native-web's handling of a
  `marginStart`/`marginEnd` key passed through a *function-valued*
  `style` prop on `Pressable`, not styling generally.
verify: a screenshot-based check (or a lighter DOM-inspection script,
  matching this file's own design-harness convention) confirming a
  measurable, non-zero gap renders between two tiles on either side of a
  real `wordBreakAfter` boundary, for a real multi-word `LETTER_CONTEXT_WORD`
  phrase (`baRi-he` or `hamza`), at both 320px and 390px — not merely that
  the prop is passed, since that already appeared to be the case before
  this was caught.
notes: Found by DESIGN CRITIC reviewing URD-063 (the `letterSpot` tile
  width fix) — confirmed real and pre-existing (the `style` prop this bug
  lives in is untouched by that item's diff; only the tile's `className`
  changed there), so not that item's fault and not blocking it, but
  directly undercuts this exact component's own stated reason for the
  style prop's existence, confirmed live rather than assumed from the
  prop being passed. Likely fix: move the gap onto a className-based
  margin (matching how `my-1` already works reliably) or wrap each tile
  in a plain `View` carrying the margin, rather than the inline
  logical-margin object passed through `Pressable`'s function-style path
  — not yet root-caused why only that path drops it.
