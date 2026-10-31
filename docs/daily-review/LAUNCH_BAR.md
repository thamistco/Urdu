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

| #   | The bar                                                                                 | Evidence                                                      | 2026-10-31                                     |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| R1  | No open bug a learner can hit that blocks, loses progress, or teaches something wrong   | Every open Q-item triaged; none of those kinds left           | not met: 0 for the review; 3 wait on the owner |
| R2  | QA finds nothing above low on two nights running                                        | Two consecutive QA reports                                    | not met: a medium on 30 October                |
| R3  | Every one of the 16 areas reviewed with no open high finding                            | README dates; reports                                         | not met                                        |
| R4  | A screen-reader user can complete Unit 1                                                | P-115 (letter spotting) built; checks pass                    | not met: letter spotting passable; Q-112 open  |
| R5  | 200% text works at 320x568 and in landscape on every exercise kind                      | `check:stability`, `check:controls`; Lesson complete measured | partly                                         |
| R6  | Offline is honest: an installed app opens, or does not claim to be installable          | P-111, or `display` changed                                   | met: display browser (P-134); P-111 held       |
| R7  | A learner can tell you something is wrong from inside the app                           | P-020 rebuilt (lost on 22 October) and P-113                  | not met: P-130 specified, not built            |
| R8  | The course's own decisions are settled: re-asking misses (P-085), letter forms (P-105b) | Built and second-checked, or dropped with a reason            | met: P-085 built, P-105b dropped               |
| R9  | The privacy page meets UK GDPR article 13 apart from the holder's details               | P-093 drafted                                                 | nearly: text second-checked; holder to come    |

## 2. What needs a person (not money)

| #   | The bar                                                                           | Why the review cannot                   | 2026-10-26 |
| --- | --------------------------------------------------------------------------------- | --------------------------------------- | ---------- |
| H1  | A native speaker has listened to the flagged clips and read the flagged spellings | P-024, P-092b, Q-081: no one here hears | not met    |
| H2  | One real VoiceOver or TalkBack pass through Unit 1                                | Q-062: headless checks miss focus traps | not met    |
| H3  | One real phone, iPhone and Android, through onboarding and a lesson               | Only Chromium on a desktop is available | not met    |

## 3. What needs the owner

| #   | The bar                                                                | Item                | 2026-10-26 |
| --- | ---------------------------------------------------------------------- | ------------------- | ---------- |
| O1  | The privacy page names who holds learners' data, and how to reach them | O-11                | open       |
| O2  | Sign-in on the web either works fully (deletion included) or is hidden | O-6, or P-094 built | open       |
| O3  | (Store apps only) developer accounts, a closed test, store forms       | O-5, O-7, O-8       | open       |
| O4  | The address Qaaf lives at for good, chosen before any link is public   | O-12                | open       |
| O5  | The name: accepted on desk research, or cleared by an attorney         | O-13 (Q-010)        | open       |

## The verdict

**2026-10-30: not ready.** R4 moved again without being met: every radio
group and the tab bar now answer Space and the arrow keys, and each group is
one Tab stop (Q-131, Q-140); before, only Enter worked and every choice was
its own Tab stop. Answer tiles are still named only by their glyph
(Q-112) and letter spotting cannot be answered by ear (P-115). R1: still 12
before launch; nothing found tonight joins them (P-144, a review that charges
hearts for forgetting, is serious but not blocking: hearts refill). R2 has not
started: QA's worst tonight was a medium (hamza described two ways), fixed. R7
and R9 are unchanged. When every row in sections 1 and 2 is met and O1 and O2
are done, the summary says "ready to launch".

**2026-10-31 (night): not ready, and the review's own share of the list is
done.** P-137 shipped: a unit review opened ahead of its unit now tests a
learner out. The critic held it twice, once because a failed test-out filled
the review queue with untaught words and once because a retake asked the
same questions it had just answered. The tester then passed a full Unit 2
test-out. What stands between Qaaf and launch is now the owner's: Q-069 and
the rest of Q-025 wait on O-6 (sign-in sync, or P-111), Q-035 on O-11, and
O1, O2 and O4. After those come section 2's person-only checks (H1 to H3).
R2 has not started: QA's worst tonight was a medium, fixed. Would I launch
now? Not publicly: Safari can still clear a lapsed learner's progress
(Q-069), and the privacy page names no holder.

**2026-10-31 (daytime, the before-launch list worked first): not ready, and
closer.** Of the 12 before-launch items, 8 are done: Q-052, Q-034, Q-073,
Q-026, Q-027 and Q-077 fixed; Q-038 (a lesson left partway opens where it was
left) built, held by its second check for losing grades on a reload, fixed
and passed; Q-045 measured fixed since 13 October. Three cannot be closed in
code and move to the owner: Q-069 and the rest of Q-025 wait on O-6 (sign-in
sync) or P-111, Q-035 on O-11. One is left for the review: P-137, a unit
review that can test a learner out, which is a course change and needs its
own research and second check. R4 moved: letter spotting can now be passed
over by screen reader and says which tile was right; answer tiles named only
by their glyph (Q-112) remain.

## R1: the open queued items, sorted (2026-10-23)

66 queued items were open in `BACKLOG.md`. Sorted by one question: could a
learner hit it, and would it stop them, lose their work, or teach them
something wrong?

**Before launch, 31 October night: 0 for the review, 3 waiting on the owner (Q-069 and Q-025 on O-6, Q-035 on O-11).** Done on 30 and 31 October: Q-052, Q-034, Q-073, Q-026, Q-027, Q-038, Q-077, P-137; Q-045 found fixed since 13 October. The list as it stood (12 on 29 October, with P-137; 11 on 26 October; 14 on the 24th, Q-080 and Q-093 fixed, Q-051 found fixed since 13 October): P-137 (a unit review cannot test a learner out), Q-026, Q-027, Q-034, Q-073 (large text and small
screens; R5), Q-077 (letter spotting by screen reader; R4), Q-038
(leaving a lesson throws its answers away), Q-045 (emoji
give answers away), Q-052 (letter-spot tiles that overlap), Q-069 (Safari can
wipe a lapsed learner's progress), Q-035 (privacy; R9), Q-025 if sign-in stays on the web (O2).

**Needs a person (H1 to H3):** Q-049, Q-057, Q-058, Q-081 (a native ear);
Q-062 (a real phone).

**Store apps only (O3):** Q-001, Q-002, Q-019, Q-024.

**Can follow launch (33):** Q-003, Q-005, Q-006 (costs money), Q-007, Q-008,
Q-009, Q-017, Q-018, Q-028, Q-030, Q-036, Q-037, Q-039, Q-041, Q-042, Q-043,
Q-046, Q-047 (the track's place; the tab icons are done), Q-048, Q-050,
Q-054, Q-055, Q-056, Q-059 (کنجی's gloss), Q-060, Q-061, Q-064, Q-065, Q-067,
Q-074, Q-076, Q-078, Q-085. "The best it can be" still wants them, and
the nights keep taking them; they do not hold launch.

**Closed the same night (3):** Q-040 and Q-044, found already done on
checking (synonyms and forgiving spelling are accepted); Q-075, fixed
(853f26e).

**Found on 30 October, can follow:** Q-149 to Q-158. **Fixed on 30 October:** Q-131, Q-140, Q-141, Q-136, Q-143.

**Found on 29 October, can follow:** Q-140 to Q-148. **Fixed on 29 October:** Q-113 (focus on each step), Q-138 (one START badge), and the onboarding scroll and trace guide found by the low-vision tester.

**Found on 28 October, can follow:** Q-131 to Q-139. **Fixed on 28 October:** Q-095 (the rest), Q-103 (the rest).

**Found on 27 October, can follow:** Q-116 to Q-130. **Fixed on 27 October:** Q-096, Q-104, Q-109, Q-115, and parts of Q-095, Q-102 and Q-103.

**Fixed on 26 October:** Q-080 (Home's card at 200%), Q-093 (a speaker's known words), Q-101 (the letter-spot answer card), Q-110 (two right answers by shared sense), and the dot rule for traces. **Found on 26 October, can follow:** Q-108, Q-109, Q-111 to Q-115.

**Fixed on 24 October:** Q-053 (grammar notes in the browser's font, found
12 October, before launch), Q-083 (unused fonts shipped, can follow), and,
found the same night, Q-097 (tracing praised swipes), Q-098 (a reading's
question answered by its English) and Q-099 (the leave dialog's wording).
**Found on 24 October, can follow:** Q-100 to Q-107.

**Found on 23 October, can follow:** Q-086, Q-087, Q-088 to Q-092 (the
content sweep), Q-094 to Q-096 (the tester).

**Closed on sorting (5):** Q-015 (fixed 16 October, 9e11bdd), Q-063 and Q-066
(done 16 October), Q-070 (fixed 20 and 21 October), Q-033 (the same as
Q-077, kept under that number). Q-059's افق half was fixed on 18 October; its
کنجی gloss remains, under "can follow".
