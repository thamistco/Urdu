## URD-A03 — Give culture a door a beginner can walk through
attempts: 0
files: src/data/vocab/culture-arts.ts, src/data/words.ts, src/data/units.ts
definition of done: The `culture` category contains at least one beginner or
  elementary topic, and `check:shape` gains a rule that no category is confined
  to a single CEFR level. Measured at URD-A01: culture was 14 of 14 advanced,
  every topic first met in units 32 to 37 of 39. Splitting `leisure` out helped
  and did not fix it, because the cause is content rather than labelling: the
  course has no beginner cultural material to categorise.
verify: npm run check:shape
notes: Raised by the curriculum critic on URD-A01, and its reasoning is the
  reason this is not cosmetic. Someone who picks Urdu over Hindi often comes for
  the ghazal, for family, or for faith. Gating all of that behind the last third
  of the course tells them the thing they came for is not for them yet. A first
  festival, a first couplet, the names of the Islamic months: small, concrete,
  and beginner reachable.

  Do not fix this by relabelling an advanced topic as beginner. The check that
  lands with it should make that impossible to pass.

---
BLOCKED 2026-08-08, on attempt 1 rather than 3. Recorded as a lead decision.

The item needs new beginner cultural words. `check:voice` requires every
speakable word to ship a clip in BOTH voices (scripts/check-voice.js:114 to 121
and 149 to 152), and generating clips needs the Google TTS key, which is not
available to an agent session: it was used in memory and never stored, correctly.
Adding words without audio fails check:voice, which is inside check:all.

Not left at the top of the queue for two more attempts, because the blocker is a
missing credential rather than a problem that a retry could solve. Two more
identical failures would teach nobody anything and would stall every run behind
it. The three attempt rule exists to stop a lead giving up early; it is not a
reason to repeat a deterministic failure.

TO UNBLOCK: run `npm run gen:voice` with GOOGLE_TTS_API_KEY set, for both voices,
then the item is ordinary work. Whoever does that should also rotate the key
afterwards if it is the one that passed through a chat.
