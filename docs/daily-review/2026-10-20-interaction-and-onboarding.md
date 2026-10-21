# 2026-10-20 · Interaction and ease of use (area 5), onboarding and first session (area 6)

Reviewed by `qaaf-design` (29 tool calls, about 8 minutes, read-only) in
Chromium on the 481f47d build, and by `qaaf-qa` for focus and the new
announcements. "200%" is a 32px root font.

## The wrong-answer banner at 200% (Q-070): fixed tonight

| Answer at 320x568, 200%       | Banner | Past the screen | Continue             |
| ----------------------------- | ------ | --------------- | -------------------- |
| Word (paani), before          | 508px  | 37px            | 465–573, 5px cut     |
| Sentence (main khush hoon)    | 540px  | 69px            | 497–605, a third cut |
| Word and sentence, px spacing | 416px  | none            | 444–552              |

The banner's padding and gaps were in rem and doubled with the text. Set in px
at their 100% sizes, nothing moves at normal text and both real answers fit.
An injected 51-character sentence still runs 181px over; no real answer that
long was found. A card laid out in a row was rejected (baselines do not line
up, a row cannot hold a sentence); a card that scrolls inside the banner is
kept in reserve for if a real long answer turns up. `check:stability` now
answers wrongly at 200% on 320x568 and requires Continue on the screen; it
reports 573px against the old build.

Found on the way: at 200% the Urdu script and the verdict stay the same size
while the Roman and the English double, so a low-vision reader gets English
bigger than the Urdu (added to Q-071).

## Focus after an answer: fixed tonight (QA)

- **A matched pair dropped focus to the page** after every pair but the last.
  Focus now moves to the first word still unmatched; `check:stability` walks
  v-road-p2 to its board and pairs by keyboard (reports the page against the
  old build).
- **After about one wrong typed answer in three, focus fell to the page** after
  the banner had opened. The banner now restores focus after any later drop
  while it is open. This did not reproduce in my own walk on either build, so
  that half is defensive.

QA confirmed the rest of last night's work: the verdict was announced after
every kind of answer and never stale, never in Roman script on the Roman track,
and a held or repeated Enter never skipped an answer.

## Area 6: onboarding as a new guest

- 11 taps and 10 screens to the first lesson screen; about 20 seconds for a
  script with no reading time, a floor rather than a person's time. No dead
  ends.
- **"Start" is said twice:** "Start learning" on the front door, then a second
  brand screen with "Let's start"; the Roman-letters offer appears there and
  again at "How do you want to learn?" (P-107).
- **At 320x568 the "More below" pill sits over the top of Continue** on the
  goal step (pill 512–556, Continue from 542), and on the track step Continue
  is at 671 because the chosen card grows to 237px (added to Q-073).
- Lesson 1's first card at 320: "Got it" at 704, so the learner scrolls; the
  cue says so (P-076).

## Area 5: one lesson (l-1 at 390x844)

- No waits: every tap changed the screen in 114 to 140ms.
- **"Which tile is alif?" tiles are announced only as "Tile 1 of 4"** and the
  right one is marked by colour alone, so a screen-reader user cannot answer
  (Q-077). Naming the letter would give the answer away; the fix needs care.
- **Tracing gives its verdict twice in different words:** "That is the shape ✓
  / Nicely done." and then the banner's "Beautifully done" (Q-078).
- Strokes drawn after Check do nothing, with no sign of it (Q-078).
- Long first lessons: l-1 has 42 exercises, first-words 45, s-beginner 50
  (P-046 already covers length).
- The close button's box starts 8px above the screen (44x56 at y −8) (Q-079).

## What this is not evidence for

Root font size, not iOS Dynamic Type or Android font scale. A script's timings,
not a person's. The long sentence was injected. No contrast measured tonight.
Screen-reader findings come from accessible names and where focus lands, not
from VoiceOver or TalkBack.
