## URD-A01 — Give every topic a category
attempts: 0
files: src/data/words.ts, src/data/vocab/, scripts/check-shape.js
definition of done: `Topic` carries a `category` from a declared taxonomy, every
  one of the 122 topics has one, and `check:shape` no longer reports the
  uncategorised failure. Today a topic has a title, an icon, a blurb and a CEFR
  level, and nothing that says what kind of thing it is: nothing groups "Food &
  drink" with "At the restaurant" and separates both from "Formal & written".
  Start from the taxonomy in check-shape.js (survival, people, world, doing,
  abstract, formal), change it if a better one survives contact with the real
  122, and say in the ledger why.
verify: npm run check:shape
notes: First of the curriculum items because everything after it wants to group
  by something. Dispatch the curriculum critic: the taxonomy is a pedagogical
  claim about what a learner is doing, not a filing decision. Note that
  check:shape will still fail on the other four counts until URD-A02 lands, so
  for this item alone, pass means the categorisation failure is gone from its
  output.

---
COMPLETED 2026-08-08 on claude/gauntlet-topic-categories.
Eleven categories, not the six placeholders or the nine first drafted. Both
critics returned BLOCKING findings and both were right; see the ledger for the
verdicts and for what was fixed as a result.
