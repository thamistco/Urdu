# 2026-10-12 · The full QA report, worked through

A second, larger report came in on the same day: automated browser testers
played 342 of the 350 lessons to the end, read the whole course against the
code, and measured all 5,502 clips (Whisper and MMS speech models, plus
signal). It found 46 issues: 2 critical, 10 high, 18 medium and 16 low. It also
listed 17 claims its own agents made that turned out wrong, so they are not
raised again (its §14). No native speaker checked anything in it, the testers
could not hear audio, they traced with a mouse and they used desktop screens
only.

Its testers ran partly before and partly after this morning's deploy (it quotes
both the browser's confirm dialog and today's "Free in Unit 1" label). So every
finding was checked against the current code before anything was done.

## Fixed

| Report                                                                                                                      | What changed                                                                                                                                                                                                                                                                                                    | Commit  |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| K2 Critical: "builds right to left" read as "tap the last first"                                                            | "Tap in reading order: the first letter goes on the right". One slot per letter, the next one marked, a gap between words (also B4). The bank fills right to left like the tray                                                                                                                                 | 2ce9bce |
| H1 High: build tiles say "Tap to take it back" after CHECK                                                                  | They no longer say it once they cannot be taken back. Retrying is a design question (P-063)                                                                                                                                                                                                                     | 2ce9bce |
| B7 Medium: sentence tiles labelled only "Word tile"                                                                         | Each tile says its word to a screen reader                                                                                                                                                                                                                                                                      | 2ce9bce |
| K1 Critical, part: traces cost hearts, and fail with a mouse (H5)                                                           | A trace costs no heart. The economy itself is P-061                                                                                                                                                                                                                                                             | ec8878c |
| B11 Low: "Free in Unit 1" over Unit 36 lessons                                                                              | "Free until Unit 1 is done", which is the rule                                                                                                                                                                                                                                                                  | ec8878c |
| H4 High, part: no step counter                                                                                              | "14 of 37" under the progress bar. Shorter lessons stay P-046                                                                                                                                                                                                                                                   | 121e005 |
| §4.3 High: about 20 natural spellings refused                                                                               | A spelling one letter off is accepted with "Close enough ✓" and the stored spelling, unless it is another word or the word is short. 16 of the 21 listed now pass (thik already did). The five that do not are two letters off (jootay, jehaiz, dozain), a short word (reet) or another word (zehen for zaheen) | 4230755 |
| B1 Medium: literal asterisks on five grammar cards                                                                          | Italics                                                                                                                                                                                                                                                                                                         | 122a3d4 |
| (found while fixing B1) drill notes showed script on the Roman track                                                        | Through `romanProse()`, held by the content test                                                                                                                                                                                                                                                                | 122a3d4 |
| §6 "Come back tomorrow"; "Speak, don't just read"; B12 "Speak with them"                                                    | Copy that matches what the app does                                                                                                                                                                                                                                                                             | ff76427 |
| (found while fixing s-72) Roman sentence tiles read ہوا as "hawa" and میں as "main" where the sentence says "hua" and "meñ" | Tiles take the sentence's own romanisation                                                                                                                                                                                                                                                                      | 6e132a7 |
| §4.1 content                                                                                                                | نکاس, whale, gala, داخل, رونا, گرانا, روزمرہ, ری سائیکل, s-72, s-236, s-250, s-143, s-165, r-1, zo’e. See the commit for each                                                                                                                                                                                   | 29ecdc5 |

## Already fixed, or not as reported

- **H2, leaving uses `window.confirm`.** Replaced by an in-app dialog this
  morning (e105d7d). Losing the lesson's progress is still true: Q-038.
- **H3, matching gives no feedback and does not count a wrong pair.** It does
  count it: `Matching.tsx` grades the exercise correct only with no mistakes,
  and the wrong tiles turn red for half a second. "Not quite:" with the meaning
  shipped this morning (4b179d3).
- **B3, Both track drops the Roman on the first question.** Fixed this morning
  (f8400fb). Letter-ID choices show letter names, not words, so there is no
  Roman to show.
- **B12's unlabelled "32", and "no gem balance on Home" (§8).** Fixed this
  morning (3326b76): the header reads "32 gems".
- **B2, Urdu in grammar prose drawn as separate letters.** Not reproduced: in
  Chromium the script is joined, in the browser's fallback font. Q-053 sets it
  in the app's Urdu font, which would rule out a desktop font that cannot join.
- **Script-first track shows Roman in grammar tables (§7).** Intended: a
  learner reading the script still needs to know how a pattern sounds. Left as
  is.

## Proposed (research changes, each waits for a second check)

- **P-061** The hearts economy. Its second check (qaaf-critic, the case
  against) passed the cheaper refill, 40 gems to 25, which shipped. It held
  "Practise to earn hearts": with no saved progress, practising throws away
  the learner's place in the lesson they were stuck in, so the free route
  leads back to the same wall; two hearts could be farmed by tapping through
  at random; and the header would show the wrong label. It waits for Q-038.
- **P-062** Grammar order: the past with نے is used from Unit 10 and taught in
  Unit 37; imperatives are used from the beginner units and taught in Unit 31;
  postpositions (Unit 15) come before the oblique (Unit 17). Teach a survival
  past and polite imperatives early as chunks, or rewrite those sentences.
- **P-063** One retry after a wrong build.
- **P-064** One Roman convention for the whole course (dotted or plain, no
  stray macrons, one rule for hyphens), with accepted alternates stored per
  word.
- **P-065** One rule for diacritic tiles in builds: never required, never a
  decoy.
- **P-066** A "Review" tag on review items inside new-word lessons.
- **P-067** Reading and dialogue lessons longer than two steps.
- **P-068** "Can't listen now" on audio-only items.
- **P-069** Register: contrast and test aap, tum and tu after g-pronouns, and
  tag only true honorifics "(polite)".

Already proposed and strengthened by this report: P-046 (shorter lessons;
median 43 steps, maximum 61), P-048 (gender; 16 masculine first-person
sentences to 1 feminine, and the r-8, r-9, r-11 and r-13 narrators), P-049
(tracing), P-059 (graded speaking).

## Queued

Q-051 to Q-060 in `BACKLOG.md`: sentence-build decoys that are valid variants,
letter-spot tiles that overlap, Urdu in grammar prose, desktop layout and
feedback-text polish, the onboarding voice preview, topic filing and
emoji, r-17's poetry evening without a couplet, native listening, کنجی and
the duplicate افق, and the Unit 19 review's title.

## Audio

| Verdict                                  | Clips |
| ---------------------------------------- | ----- |
| Passes both models                       | 950   |
| Passes the only model run on it          | 2,215 |
| One model disagrees                      | 135   |
| The only model run disagrees             | 580   |
| Both disagree: needs native listening    | 28    |
| Letter names, not model-assessable       | 80    |
| No model check yet (female single words) | 1,514 |

The 28 where both models heard something else, for a native speaker first:

- Male voice: w-adab, w-chamach, w-footpath, w-lugat, w-test.
- Female voice: ain-word, s-7, w-bulb2, w-chhutti-school, w-chhutti2,
  w-chunaanche, w-daadline, w-darjan2, w-fashion, w-guarantee, w-hajj,
  w-injection, w-jar, w-kaghaz2, w-laakh, w-pakadna, w-sakhi, w-sanat,
  w-sheesha2, w-sofa, w-terha, w-tip, w-zameen2.

Many disagreements are spellings that sound alike (ص and س, ق and ک), which no
acoustic model can tell apart, so they are not faults. The report points to
retroflex and aspiration as the ones worth a listen: s-7 and s-56 (ٹھنڈا heard
as تھنڈا), w-terha, w-test, w-injection, w-laakh, w-jar, w-kaghaz2,
w-pakadna. 437 clips peak at 0 dBFS (413 of them in the male voice), which is
Q-050. Nothing in the audio was changed today: a regenerated clip from the same
voice would most likely say the same thing.

## What this is not evidence for

- The fixes were seen in Chromium at 390 px wide only: the build tray, the
  counter, the italics and the header. Traces were not tried on a touch
  screen, so whether tracing is easier on a phone than with a mouse is still
  untested.
- The typing tolerance is unit-tested on the report's own list. Nobody has
  typed into the live app with it.
- No native speaker has checked the content corrections, the new s-72 clip,
  or the choice of "vhel" for whale.
