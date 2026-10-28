# 2026-10-28 · Market (area 1) and launch readiness (area 11)

Two read-only agents reviewed these areas:

- `qaaf-learner-voice`: 23 tool calls, about 2 minutes. It looked at what Urdu learners have said since 21 October.
- `qaaf-growth`: 22 tool calls, about 2 minutes. It looked at what stands between today's site and a publicised free launch.

**Not legal advice.** All sources are search summaries; no page was read whole.

## Area 1: what learners say

**Little is dated after 21 October.** No new Urdu app was confirmed. Duolingo still has no Urdu course for English speakers.

The steady themes, each from one to three sources (several of them vendor or affiliate pages):

- **Script and speech are separate products.** Learners pair a tracing app with a speaking app. Pimsleur is praised for audio but "does not teach reading".
- **Competitors' weaknesses.**
  - Ling: thin grammar, bugs, price.
  - Mondly: teaches Urdu from Hindi.
  - uTalk: a phrasebook.
  - Rekhta's Aamozish: a quiz that can be passed without learning.
  - Small "Learn Urdu" apps: no audio, heavy ads.
- **Heritage learners.** One r/Urdu thread says resources are scarce.
- **Indian learners.** A Hindi reader on r/Urdu found Nastaliq hard; Zabaan runs a Hindi-to-Urdu course.
- **Parents and YouTube.** No learner's own words found.

**Already in Qaaf**, so not proposed: a heritage path, grammar notes, tap a word for its meaning, re-asking misses.

**Proposed:**

- **P-131, an opt-in "I read Hindi" letter key.** It shows each letter's Devanagari equivalent the first time the letter appears, fading out as the Naskh bridge (P-109) does.
  - For: Indian learners are the group vendors serve.
  - Against: it is politically sensitive, so it must stay off the store listing. It needs a font and a content check. The evidence is one post plus vendor pages.
- **P-132, listing copy.** "Reads and speaks: the script, with audio on every word". It should be written only once a check proves every word has a clip.
  - Against: it rests on competitors' reviews, not on Qaaf's learners.

## Area 11: launch readiness

**Gaps, ranked, and who closes each:**

1. **O-12, the permanent address (owner).** Choosing it later empties every learner's saved progress.
2. **R1, 11 before-launch bugs (the review).** Q-069 and Q-038 lose a learner's work.
3. **H1, a native ear (a person).**
4. **R9, who holds the data (owner, O-11).**
5. **O2, sign-in on the web (owner O-6, or the review's P-094 flag).**
6. **R4 and H2, a screen-reader user through Unit 1 (the review, then a person).**
7. **R5, R6, R7 (the review).** R6 was built tonight: P-111.
8. **R2 and R3 (the review, over time).**
9. **H3, real phones (a person).**
10. **O5, the name (owner).**

**Missing rows, proposed for the bar:**

- **P-127, terms that match the build.**
  - `TermsScreen.tsx` is dated 22 September.
  - It says signing in protects against lost progress, which becomes untrue if sign-in is hidden.
  - It speaks of uninstalling.
  - It names no operator.
  - Against: a free app with no account needs little in its terms.
- **P-128, children.**
  - The UK Children's code covers under-18s, and the ICO says free services too.
  - The privacy page uses the US cutoff of under 13.
  - Add a sentence that guest use keeps nothing off the device.
- **P-129, a voluntary accessibility statement.**
  - The EAA does not appear to reach a free education app from a sole developer: education is not among its services, and microenterprises are exempt.
  - A short statement listing the known gaps (letter spotting, 200% text) is still worth writing.
  - Against: it lists failures in public.
- **Q-139, hosting under a spike.**
  - Pages has a soft limit of 100 GB a month, and throttles at an unpublished rate.
  - A first visit is about 10 MB.
  - Add a check of the live site and a fallback line for any launch post.

**Storage notice: no banner.** PECR's "strictly necessary" exception covers keeping a learner's own selections. The existing storage line is enough (judgement).

**R7, reporting a problem with no server, account or email:**

| Option | What it is                                                                                          | Against                                       |
| ------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **A**  | P-020 and P-113 as specified                                                                        | Nowhere to send reports; held twice on layout |
| **B**  | One "Something wrong?" row in Settings and on Lesson complete, kept on the phone with a Copy button | Less exact about which item                   |
| **C**  | Reword R7 as "the app never implies it is listening"                                                | Heritage learners are the native ear H1 lacks |

Growth recommends B now, then A once a destination exists. **Recorded as P-130, not built tonight.**

## What this is not evidence for

None of this rests on primary legal texts, on how the EAA was written into each country's law, on the live site's real per-visit weight, or on Pages' throttle rate.
