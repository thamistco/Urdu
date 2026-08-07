# Gauntlet queue

Ordered. The top unclaimed item is what the next run picks up.

Every item carries a `verify` command that exits 0 or does not. An item without
one is a drift generator: it gets marked done on somebody's reasoning, and stays
wrongly done forever. If you add an item and cannot name the command that proves
it, the item is not ready to be queued.

`verify` may name a script that does not exist yet. Creating it is part of the
work — but the item is only done when that command runs and exits 0.

Commands here are the ones this repo actually has. `npm run check:all` runs the
whole CI pipeline in the workflow's own order and is the final gate on any item
that touches shipped code.

---

## URD-001 — Nastaliq descenders must not clip
attempts: 0
files: scripts/check-nastaliq.js, package.json, .github/workflows/deploy-preview.yml
definition of done: A check renders Nastaliq text at the three sizes the app
  uses it at (the wordmark, a lesson prompt, a vocabulary tile) and fails if any
  glyph's ink is cut off by its own line box. Nastaliq descends far below the
  baseline and cascades right to left, so a line height that is fine for Latin
  slices the tail off ی and ے. Wire it into the workflow so `check:all` picks it
  up automatically.
verify: npm run check:nastaliq
notes: `check:sizes` already catches text clipped by the *window*; this is text
  clipped by its own line box, which that cannot see. Measure rendered pixels,
  do not infer from font metrics. Break it on purpose before trusting it.

## URD-002 — Typed answers accept missing harakat
attempts: 0
files: src/lib/roman.ts, src/lib/roman.test.ts
definition of done: A learner who types a word without its diacritics is marked
  correct. Answer comparison NFC-normalises both sides and strips aerab before
  comparing. A golden corpus of at least 50 real pairs in the test file, each a
  bare spelling against its marked form.
verify: npm test -- src/lib/roman.test.ts
notes: `check:roman` already holds Roman spellings to the canonical table, which
  is a different property: that is about the course being self consistent, this
  is about being generous to the learner. Do not weaken `check:roman` to pass.

## URD-003 — Roman Urdu fuzzy matching
attempts: 0
files: src/lib/roman.ts, src/lib/roman.test.ts
definition of done: There is no single Roman Urdu standard, so exact matching
  rejects correct answers constantly. A scoring function accepts the spellings
  learners really use, against a corpus of at least 30 words with several
  attested spellings each. It must still reject a different word: the test
  asserts both directions, and the rejection half is the one that matters.
verify: npm test -- src/lib/roman.test.ts
notes: Depends on URD-002 landing first; they share a file.

## URD-004 — RTL layout audit
attempts: 0
files: src/components/, src/screens/
definition of done: No physical direction properties left in components that
  render Urdu: marginLeft, paddingRight and friends become logical equivalents.
  Mixed runs are isolated so an English brand name or a digit inside an Urdu
  sentence cannot reorder the line around it. A check fails on any physical
  property reintroduced in those files.
verify: npm run check:all
notes: Write the guard as a source scan in the style of `check:theme`, which
  already does exactly this shape of thing for colour.

## URD-005 — Teach ذ ز ض ظ by context, not by sound
attempts: 0
files: src/data/letters.ts, src/data/units.ts, scripts/check-order.js
definition of done: These four letters are pronounced identically by most Urdu
  speakers, so an exercise that asks a learner to pick one by sound alone is
  unanswerable and `check:answerable` should say so. Either the exercises for
  this set are spelling-context based, or they are not generated. A check proves
  no listening exercise can offer two of the four as options.
verify: npm run check:answerable
notes: This is the same shape as the verdict-cue bug: an exercise that cannot be
  answered from what it puts on screen. Extend `check:answerable` rather than
  writing a new script.

## URD-006 — Spaced repetition is a pure function
attempts: 0
files: src/lib/srs.ts, src/lib/srs.test.ts
definition of done: The scheduler is deterministic given (item, history, now),
  with no reads of Date.now() inside it. Property tests over at least 500
  simulated review sequences assert the intervals never go backwards after a
  correct answer and never exceed the configured ceiling.
verify: npm test -- src/lib/srs.test.ts
notes: `check:srs` already asserts the end-to-end behaviour; this is the unit
  level underneath it. Both should pass, and `check:srs` must not be relaxed.

## URD-007 — Mark synthesised audio as synthesised
attempts: 0
files: src/lib/voiceManifest.ts, src/components/, scripts/check-voice.js
definition of done: Urdu text to speech is not good enough to pass silently as a
  native speaker. Every clip records whether it is a recording or synthesised,
  and the UI says so where a learner is being asked to imitate it. A check fails
  if any clip lacks the flag.
verify: npm run check:voice
notes: Design for native recordings replacing TTS clip by clip without a data
  migration, so the flag is per clip rather than global.
