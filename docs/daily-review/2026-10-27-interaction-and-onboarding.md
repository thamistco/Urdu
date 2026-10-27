# 2026-10-27 · Interaction (area 5) and onboarding (area 6)

`qaaf-design` (22 tool calls, about 3 minutes, read-only) turned the
onboarding findings of the last three testers into fixes, with screenshots at
390x844 and 320x568. `qaaf-qa` (40 calls, about 18 minutes) played last
night's changes. Two testers ran (their own reports: a parent choosing for a
child, and a reader who skips the alphabet).

## Bugs fixed tonight

1. **The welcome's "Learn the whole course in English letters instead"** was
   plain text that did nothing when tapped (Q-103). It is now a link, at least
   44px tall, that starts onboarding with the Roman track chosen; the track
   screen still explains the choice. Checked in the build at both sizes: the
   track screen opens with Roman Urdu selected.
2. **"Type this word"** under "Water" read as "type Water" (Q-115). Now "Type
   the Urdu for this", which is what a screen reader already heard.
3. **Nothing said Urdu runs right to left** before alif's card said it joins
   "only from the right" (Q-102). The course's first letter card now says
   "Urdu is written from right to left, so a word starts on the right." A
   one-sided middle form is now "joined on one side, same as the end form"
   (beside "joined on both sides"), which does not need the direction and
   keeps the tile four lines tall. Measured: Got it ends at 837 of 844 at
   390x844 (807 without the line); at 320x568 it was already below the fold
   (757) and is at 801.
4. **A speaker who skips the alphabet was drilled on it at once** (reader
   tester): Home's Continue opened Unit 1's review, 22 questions on the
   letters and words just skipped, then Unit 2's and Unit 3's. Onboarding now
   also skips a unit's review when it skips every lesson of the unit: Units 1,
   2, 3, 5, 7, 8 and 9 for such a speaker; Units 4 and 6 keep theirs for their
   grammar and sentences. Its second check held it: Unit 1's free hearts
   then ended before anything had explained them. Now a skipper's first
   lesson is free ("Free this lesson") and ends with "Hearts are on from
   here"; re-checked in the build, SHIP.
5. **The Letter Lab's trace dead-ended after a refusal** (QA): "Draw the dots
   too" took away Clear and Check, so the dot could not be added. The Lab now
   offers "Keep drawing" (keeps the strokes) or, after a pass, "Trace it
   again". Replayed QA's case on the build: bowl, refused, Keep drawing, dot,
   Check, "That is the shape".
6. **"The answer: End."** for a letter whose options were "Alone or start"
   and "Middle or end" (parent tester, steps 21 and 31). The answer now names
   the button shown.

## Design changes, second-checked

**P-125** (from Q-103, Q-104, Q-115), words only:

- "Speak with family": "Parents, grandparents, a partner’s family" (it was
  "relatives back home").
- "Read & write it": "The Urdu script, letter by letter" (it was "Nastaliq,
  the Urdu script").
- "I’m starting from scratch": "New to me, or I know a few words from
  family".
- The daily goal says what XP is.

Second check (truth, layout, the case against): **SHIP**, the XP line made
"the points you earn as you learn" (practice pays XP too). A third "a little
Urdu" answer was weighed and not added: it would change nothing on the path.

## Found, not fixed tonight

- **A reload partway through onboarding starts it again** (Q-103, the rest
  of it): every answer lives in component state. Keep a draft in the existing
  `qaaf-settings` store (never a new key), cleared on finish.
- **"More below" sits on Continue** on the goal step at 320x568, so a tap in
  the middle of the button scrolls instead (design, likely cause of "Continue
  twice did not advance"; not confirmed).
- **Letter spotting's "second tile from the right"** has no clear meaning when
  the tiles wrap two by two (parent tester): Q-116.
- **Lesson complete at 200% on 320x568**: Continue at 1,844 to 1,952px of a
  2,032px scroll in a 568px window (QA; Q-111).
- **The privacy page** at 200%: the date breaks "2026-" / "10-26", and there
  is no back control in its header (QA): Q-121.

## What this is not evidence for

Chromium only, scripted players, no real screen reader, no native build. The
right-to-left line and the onboarding words have not been read by a real
beginner.
