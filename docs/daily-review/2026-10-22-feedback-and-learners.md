# 2026-10-22 · Marketing (area 12), feedback and privacy (area 14), what learners say (area 15)

Area 12 by `qaaf-growth` (33 tool calls, read-only); areas 14 and 15 by
`qaaf-learner-voice` (29 tool calls, read-only). Every page fetch by learner
voice was blocked (DNS), so its points come from search summaries (marked SS).
Nothing was posted.

## Area 12: the first two minutes of an Urdu Day visitor

Read from the source (with no sign-in keys deployed): the front door ("World
Urdu Day · 9 November" from 7 to 12 November on windows at least 580px tall,
"Speak Urdu? Now read it.", "Start learning"); then the onboarding welcome,
**where the day's connection is lost**; why, how, voice, "Do you already know
some Urdu?", a quick check for speakers, a daily goal, "You're all set"; then
Home. **7 to 9 taps before the first Urdu letter.** The posts' four-shapes
puzzle is "Position practice", lesson 3 for a beginner; کتاب cannot be read in
the app until kaaf, in letter group 6.

By 5 November:

| Item                                              | State                                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| The dated line                                    | Done (`src/lib/urduDay.ts`); hidden under 580px tall                                                                         |
| Share card and link previews                      | Done in code; the live tags are not yet checked (a curl check, P-094's list)                                                 |
| A deep link the posts can use                     | Not possible: a visitor not signed in has only the front door's route, and Pages serves deep links with a 404. Link the root |
| P-094 (sign-in hidden from 5 November unless O-6) | Not built                                                                                                                    |
| O-10, the moderators (P-097)                      | The owner's, open                                                                                                            |

**Proposal (P-112, a narrowed P-041): "Try a letter: 3 minutes"** on the front
door from 7 to 12 November, shown even where the dated line is hidden: it
enters as a guest, opens "Meet the letters" directly, and asks the onboarding
questions after the lesson, with the lesson counted. **Learner:** the first
screen is a letter, continuing the post they tapped. **Family:** a forwarded
link opens on a letter, not a questionnaire. **Business:** Duolingo moved
sign-up behind a first lesson and reported about 20% more (DAU or next-day
retention, sources disagree:
[Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding),
[StriveCloud](https://www.strivecloud.io/blog/blog-gamification-examples-boost-user-retention-duolingo)).
**Against:** vendor figures say longer quizzes raise trial starts; answering
builds commitment; a speaker who reads well starts too low; it changes the
first screen 16 days before the day and needs two checks; without O-10 a better
first visit is still not kept. Judgement: build it only if both checks pass by
3 November.

## Area 14: hearing from learners with no accounts or trackers (SS)

- A prefilled email link is the easiest way in: one indie developer's one-tap
  "email us" brought "screens and screens" of feedback
  ([dev.to](https://dev.to/grommash9/one-tap-email-to-reach-you-1mao), one
  developer).
- GitHub Issues and Discussions put people off, needing a login
  ([Flathub](https://discourse.flathub.org/t/getting-feedback/3864)).
- "Copy debug info" buttons are an established pattern (Signal, Musixmatch,
  Chromium), with the text shown before it is sent. No user view found.
- Feeling heard depends on the reply, not the channel: public boards help only
  while kept current (one Canny review, one Discord user).

**Proposal (P-113):** a "Copy details" row in Settings beside P-020's
on-device reports: version, track, date and the learner's saved reports, shown
before copying; a mailto once an address exists (O-11 or P-108). **Against:**
until then there is nowhere to paste it, and unanswered reports bring back the
"not heard" complaint.

## Area 15: large text and accessibility in language apps (SS)

- **Arabic script is too small:** learners install extensions to enlarge it
  in Duolingo ([arabiconline](https://arabiconline.eu/?p=108134),
  [Huruf](https://addons.mozilla.org/en-CA/firefox/addon/huruf_letters/));
  several voices. One reviewer asks for a Nastaliq size option.
- **Separate sizes for script, Roman and English** were added by ChinesePod on
  request; DuoCards' developer said larger text stops fitting on cards.
- **Blind learners:** Duolingo is "mostly accessible" with VoiceOver but ads
  trap focus (one AppleVis user); Anki is "not fully accessible" by its own
  developer's account. Nothing on blind learners of Urdu.
- **Colour-only feedback:** one colour-blind WaniKani user re-entered answers
  already wrong. Qaaf marks answers with a tick or a cross too (P-013).
- **Timers:** people ask to hide them; Qaaf has no countdown.

**Proposals:** an Urdu script size control apart from the browser's text size
(P-114; against: Nastaliq is tall, overflow bugs at large text have been many,
evidence for Nastaliq is one person); one real VoiceOver or TalkBack pass
before Urdu Day (Q-062, needs a person).

## What this is not evidence for

Nothing from Qaaf's learners, Urdu learners or parents; no page was read in
full by learner voice; the first-two-minutes walk is read from code, not timed
or played; whether anyone clicks or a shorter start keeps heritage learners.
