# 2026-10-12 · A tester's report, worked through

A tester played onboarding on all three tracks and in both voices, all of
Unit 1, and at least one lesson in every unit from 2 to 41. They also covered
review, practice, Letter Lab, Read Faster, the league, achievements, the
profile, Settings and the legal pages. They read about 220 words, a sample of
sentences, all 28 phrases, all 12 dialogues and some passages in the code. They
put 1,385 clips through Urdu speech recognition and ran a signal check on all
5,502.

This page records what was done with it. The bugs were fixed the same day,
since bug fixes ship at once. The content corrections a reader can verify were
applied. Everything that is a design or research decision went to the backlog,
where it waits for its second check.

## Fixed (section 1, bugs)

| #   | Report                                                                      | What changed                                                                                                                                      | Commit  |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Privacy and Terms show `{{SUPPORT_EMAIL}}`                                  | The Contact section is left out until an address is set. check:links fails any screen showing `{{…}}`; broken on purpose, it failed on both pages | a7ccf7c |
| 2   | ✕, Reset and Sign out use the browser's `window.confirm`                    | An in-app dialog (`ConfirmHost`). check:controls fails if closing a lesson asks in the browser's dialog; broken on purpose, it failed             | e105d7d |
| 3   | Hearts free in Unit 1, then "Out of hearts" with none ever seen leaving     | The header says "Free in Unit 1"; after that a lost heart shows "−1 heart" and is announced; the out-of-hearts screen states the rule             | bb478f6 |
| 4   | B2 reviews open on beginner letter-position drills                          | Letters are spaced through a review instead of always first. The new test fails against the old mixing step                                       | 541d56f |
| 5   | Matching: a wrong pair just clears                                          | "Not quite:" with the word and its meaning, in a live region                                                                                      | 4b179d3 |
| 6   | Read Faster linked from nowhere; Back does nothing on its gated screen      | A Practice card says what it needs and how far the learner is; Back falls back to Home                                                            | 30a31ec |
| 7   | "Locked, tap to jump ahead" opens normally                                  | "Not reached yet, tap to jump ahead", and the hint to match                                                                                       | 109bfa2 |
| 8   | Roman track shows Nastaliq in grammar explanations                          | `romanProse()` keeps the romanisation and drops the script. The content test holds all 25 cards to none; broken on purpose, it failed             | a4e7ae4 |
| 8   | Both track drops the Roman on Lesson 2's first question                     | The picture question shows the track as chosen, like every other exercise                                                                         | f8400fb |
| 8   | Script quick check asks the Roman "ghar"; 5 bar segments over "4 of 4"      | Four script questions (گھر added); one segment per question. The new test fails against the old selection                                         | d2f130a |
| 9   | A new word's opening question has no speaker                                | It has one, on that first meeting only                                                                                                            | f0a6547 |
| 10  | ژ, ا, د: two options marked right; Letter Lab shows four identical forms    | Positions with the same glyph fold into one ("Alone or start", "Middle or end"), with one line saying why                                         | 27c5fcf |
| 11  | Unlabelled "1 · 32" in the header; "Plenty of new words" after no new words | "1 day", "32 gems"; the note now reads "A tough one"                                                                                              | f2cfc58 |

Two parts of the bug list were not done and are queued: saving a lesson
partway (Q-038), and whether finishing a unit review should mark that unit's
lessons as done (Q-039).

## Content (section 2)

Applied, and the changed clips regenerated in both voices:

- چلانا is written چلّانا. Bare, it reads as chalaana, "to drive", which the
  course also teaches.
- ایکسرے is written ایکس رے ("eks re").
- فن is romanised "fann".
- سرخ means "red", marked formal, so it is never a second right answer beside
  لال.
- "My sister is a teacher" paired میری بہن with the masculine استاد. It is now
  "My brother is a teacher". استانی would be the only use of a word the course
  never teaches.
- At the restaurant, the guest asked how the food was before ordering any. They
  now ask what is good today, and order what the waiter recommends.
- Turmeric and the other spices sit in a topic now titled "Grains, Pulses &
  Spices". Moving the words would regroup finished lessons. Fatigue under
  "Inside the Body" and music under "Voices & Stories" fit those topics' own
  descriptions, so they stay.

Not changed:

- **darmiyaan.** Every screen already says "darmiyaan"; "dermiyaan" is only an
  id. The real finding is that درمیان is taught twice, as "between" and "in
  between". That joins the near-duplicates (Q-041).
- **Gender** of the 14 first-person sentences: a design decision (P-048).
- **Synonyms, near-duplicates, level tags and final punctuation:** queued
  (Q-040 to Q-043).

## Backlogged (sections 3 to 7)

Each one is in `BACKLOG.md` with its ID. Research proposals are P-046 to
P-060; smaller queued work is Q-038 to Q-050.

## What this report is not evidence for

- The browser checks of these fixes were run on a 390x844 viewport in Chromium
  only. The 375–414 px sweep the tester asked for is Q-048, not done.
- The matching "Not quite" line was checked by reading the code and by the
  type checker, not seen in a browser: no lesson reachable early enough
  contains a matching exercise for a quick drive.
- No native speaker has heard the four regenerated clips. They passed the
  automated checks only.
