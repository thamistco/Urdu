# The launch bar

The owner, 2026-10-23: no launch date. Keep improving every night, and say
when the app can launch and everything in it is the best it can be.

This is what "can launch" means, so the answer each night is a judgement
against a written bar, not a feeling. The nightly summary ends with where Qaaf
stands against it. Launch here means the free web app, publicised; the store
apps add their own items (marked). Charging money adds P-001 and
`docs/COMMERCIAL_READINESS.md`.

## 1. What the review can do itself

Each of these is met when the evidence named beside it exists.

| #   | The bar                                                                                 | Evidence                                                      | 2026-10-23                       |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------- |
| R1  | No open bug a learner can hit that blocks, loses progress, or teaches something wrong   | Every open Q-item triaged; none of those kinds left           | not met: 18 to fix, sorted below |
| R2  | QA finds nothing above low on two nights running                                        | Two consecutive QA reports                                    | not met                          |
| R3  | Every one of the 16 areas reviewed with no open high finding                            | README dates; reports                                         | not met                          |
| R4  | A screen-reader user can complete Unit 1                                                | P-115 (letter spotting) built; checks pass                    | not met                          |
| R5  | 200% text works at 320x568 and in landscape on every exercise kind                      | `check:stability`, `check:controls`; Lesson complete measured | partly                           |
| R6  | Offline is honest: an installed app opens, or does not claim to be installable          | P-111, or `display` changed                                   | not met                          |
| R7  | A learner can tell you something is wrong from inside the app                           | P-020 rebuilt (lost on 22 October) and P-113                  | not met                          |
| R8  | The course's own decisions are settled: re-asking misses (P-085), letter forms (P-105b) | Built and second-checked, or dropped with a reason            | not met                          |
| R9  | The privacy page meets UK GDPR article 13 apart from the holder's details               | P-093 drafted                                                 | not met                          |

## 2. What needs a person (not money)

| #   | The bar                                                                           | Why the review cannot                   | 2026-10-23 |
| --- | --------------------------------------------------------------------------------- | --------------------------------------- | ---------- |
| H1  | A native speaker has listened to the flagged clips and read the flagged spellings | P-024, P-092b, Q-081: no one here hears | not met    |
| H2  | One real VoiceOver or TalkBack pass through Unit 1                                | Q-062: headless checks miss focus traps | not met    |
| H3  | One real phone, iPhone and Android, through onboarding and a lesson               | Only Chromium on a desktop is available | not met    |

## 3. What needs the owner

| #   | The bar                                                                | Item                | 2026-10-23 |
| --- | ---------------------------------------------------------------------- | ------------------- | ---------- |
| O1  | The privacy page names who holds learners' data, and how to reach them | O-11                | open       |
| O2  | Sign-in on the web either works fully (deletion included) or is hidden | O-6, or P-094 built | open       |
| O3  | (Store apps only) developer accounts, a closed test, store forms       | O-5, O-7, O-8       | open       |

## The verdict

**2026-10-23: not ready.** Of the review's own bar, nothing is fully met; the
largest pieces are the 18 queued items sorted below as before launch (R1) and
two clean QA nights (R2). The person and owner items are open. Each night moves this table
and says so in the summary; when every row in sections 1 and 2 is met and O1
and O2 are done, the summary says "ready to launch".

## R1: the open queued items, sorted (2026-10-23)

66 queued items were open in `BACKLOG.md`. Sorted by one question: could a
learner hit it, and would it stop them, lose their work, or teach them
something wrong?

**Before launch (18):** Q-010 (search "Qaaf" against trademarks before
publicising the name), Q-026, Q-027, Q-034, Q-073, Q-080 (large text and small
screens; R5), Q-077 (letter spotting by screen reader; R4), Q-038
(leaving a lesson throws its answers away), Q-040, Q-044, Q-051 (right answers
marked wrong: synonyms, forgiving spelling, sentence variants), Q-045 (emoji
give answers away), Q-052 (letter-spot tiles that overlap), Q-053 (Urdu in
grammar notes in the browser's font, possibly disjoined), Q-069 (Safari can
wipe a lapsed learner's progress), Q-075 (two answers below the fold with no
cue), Q-035 (privacy; R9), and Q-025 if sign-in stays on the web (O2).

**Needs a person (H1 to H3):** Q-049, Q-057, Q-058, Q-081 (a native ear);
Q-062 (a real phone).

**Store apps only (O3):** Q-001, Q-002, Q-019, Q-024.

**Can follow launch (34):** Q-003, Q-005, Q-006 (costs money), Q-007, Q-008,
Q-009, Q-017, Q-018, Q-028, Q-030, Q-036, Q-037, Q-039, Q-041, Q-042, Q-043,
Q-046, Q-047 (the track's place; the tab icons are done), Q-048, Q-050,
Q-054, Q-055, Q-056, Q-059 (کنجی's gloss), Q-060, Q-061, Q-064, Q-065, Q-067,
Q-074, Q-076, Q-078, Q-083, Q-085. "The best it can be" still wants them, and
the nights keep taking them; they do not hold launch.

**Closed on sorting (5):** Q-015 (fixed 16 October, 9e11bdd), Q-063 and Q-066
(done 16 October), Q-070 (fixed 20 and 21 October), Q-033 (the same as
Q-077, kept under that number). Q-059's افق half was fixed on 18 October; its
کنجی gloss remains, under "can follow".
