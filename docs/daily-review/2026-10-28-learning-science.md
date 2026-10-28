# 2026-10-28 · Learning science (area 16): where letters are asked, and re-ask kinds

Reviewed by `qaaf-learning` (18 tool calls, about 4 minutes, read-only). It drove the real generator in throwaway scripts.

## Measured

**Alif madda (آ) was drilled in shapes no word has.** Across 200 builds each, on Both and Script:

- Every l-1 asked آ joined twice: a pick in its middle shape, and "which position?" on its end shape.
- Every l-1-2 asked "which position?" on its middle shape and traced its end shape.
- ـآ was offered as a wrong option in a middle- or end-position pick in about 140 of every 200 l-1 builds. That is the auditor's count, settling near 140 over 1,000 builds; the learning review's own count of 168 did not reproduce.

**The course's word list** (2,170 tokens) shows where four letters actually occur:

| Letter     | In the course                                           | Never                                         |
| ---------- | ------------------------------------------------------- | --------------------------------------------- |
| آ          | 50: 47 start a word; 3 follow ر, so they stand unjoined | joined (ـآ)                                   |
| Hamza      | 92: ئ mid-word 89; ء at the end 3                       | at the start of a word                        |
| Baṛī ye    | 42, all at the end                                      | start or middle (those glyphs are choṭī ye's) |
| Nūn ghunna | 28, all at the end                                      | start or middle                               |

**Re-asks today** are mostly the same difficulty with the direction reversed:

| Missed                          | Re-asked as                     |
| ------------------------------- | ------------------------------- |
| A listening or picture question | meaning pick                    |
| A meaning pick                  | word from meaning               |
| A typed answer                  | word from meaning (a step down) |

The harder mapping proposed on 26 October rarely has a target it can build. Building the word from tiles was possible for only 2 of 31 words in three early lessons.

## Decided and built (P-133): each letter asked only where Urdu writes it

**The rule.** A letter may list the positions it is asked in:

- alif madda: alone and start;
- baṛī ye and nūn ghunna: alone and end;
- hamza: alone and middle.

The other 36 letters are unchanged. Questions take their position from that list, and a wrong option must exist at that position. Every form is still shown on the letter's card and in the Letter Lab.

**Evidence and the case against.** A learner learns to read by decoding the words they actually meet (Share 1995), and frequency drives what is learned (Ellis 2002). Against: joined آ exists in real text (بآسانی, مآخذ). It can be taught when such a word enters the course.

**Second check** (`qaaf-critic`: Urdu orthography and the case against, engineering, a beginner in l-1). It was first reviewed against the wrong commit:

- **HOLD on the first version.** It asked picks in place of alif madda's "which position?", which put six reviews past 40% letter-pick in `check:shape`.
- **The shipped version, two majors, both fixed:**
  - Hamza was still asked at its end form, the bare mark ٔ.
  - The test could not catch two of the four claims. It is now one rule per fact, each first shown to catch a made-up word.
- **Re-check: SHIP.**

Two of the critic's minor findings were fixed after the SHIP:

- "Which position?" named positions a letter is never asked in. Hamza's ء answered "Alone or start", though no word starts with it. Labels now name only the positions a letter is asked in.
- The rule for hamza's end mark caught only the separate mark. Widened, it found the izāfat ۂ in کرۂ, درجۂ and معاہدۂ. So the mark is met on he, which word-building teaches as its own tile, never floating as the drill showed it.

## Decided, not built: the harder re-ask mapping

A harder retrieval helps only when it succeeds (Pyc and Rawson 2009; Bjork 1994). Re-asks come after the lesson's feedback and are not graded, so a second failure would go unseen. For a heritage speaker, listening is the easiest kind, not a harder one.

Recorded against P-085: log whether each re-ask was answered right, by the kind that was missed, before any harder mapping is built.

## What this is not evidence for

- Simulated builds, not learners.
- The course's own word list, not a corpus of Urdu.
- Retention.
