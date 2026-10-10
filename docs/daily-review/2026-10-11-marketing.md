# 2026-10-11 · Marketing: World Urdu Day, 9 November (area 12)

`qaaf-growth` wrote the plan for the first launch moment, four weeks away, that
the review can build without spending money, creating accounts or contacting
anyone (29 tool calls, read-only; Reddit mirrors and subreddit-size trackers
were blocked).

## What a visitor sees today

The front door shows the wordmark, "Speak Urdu? Now read it. / New to Urdu?
Start at the first letter…", then "Start learning", then about seven onboarding
steps before the first lesson. A shared link previewed as "Qaaf" over the
380-character course description, which chat apps cut off, with the square
icon as its picture.

## The day

9 November is Iqbal Day, a Pakistani public holiday again since 2022, and is
also called World Urdu Day; in 2026 it is a Monday. The only diaspora
observance found was in the Maldives. Rekhta (about 20 million users a year)
runs its own free script course, so it is a competitor, not a channel. Launch
spikes from Show HN and Product Hunt fade within days (founders' accounts,
survivorship-biased).

**The case against tying it to Iqbal:** in India Iqbal is linked with
partition (Delhi University voted in 2023 to drop him from a syllabus), and
many Urdu speakers are Indian; the diaspora barely marks the day; and without
a waitlist (O-10) the spike is lost. **Decided:** call it World Urdu Day, with
Iqbal out of the headline.

## Built tonight: P-037, the share card

A shared link now previews as "Qaaf: Learn Urdu" with one line: "Speak Urdu?
Now read it. New to Urdu? Start at the first letter. A full Urdu course." The
page's search description is unchanged.

- **Second check, `qaaf-critic`,** from the person receiving the link (a
  cousin, a parent, someone with no Urdu) and engineering: **SHIP** (d23b7b1).
  The line is the welcome screen's own words; "A full Urdu course" is already
  the store copy. Applied: ", on the web" dropped, since it would read as "no
  app" once the store apps exist; `check:claims` now reads the line for stale
  numbers and fails if it is missing or over 120 characters. Not measured:
  where WhatsApp cuts a preview; iMessage shows only the title.

## Proposals, for the owner to act on

- **P-040, a World Urdu Day line on the front door,** 7 to 12 November by the
  learner's local date ("World Urdu Day · 9 November" above the headline, which
  stays); `check:scenery` must still pass. And a 1200x630 share picture from
  the evening scene with the wordmark and the headline.
- **P-041, a shared link that opens the first lesson,** so a visitor's first
  screen is reading a word, not a seven-step questionnaire. Against: placement
  is skipped, so a fluent reader starts too low.
- **Where to post (the owner's call; nothing was posted):** r/Urdu (a UK learner
  with Pakistani roots asking how to improve their reading; size unknown);
  r/ABCDesis (about 103,000 to 122,000 members raised outside South Asia);
  r/languagelearning (one promotion, with the moderators' permission first);
  the "Learn Urdu with me" Discord (about 3,500 members). UK GCSE Urdu teachers
  are a weaker fit: their learners are children.
- **Decide the bar before posting:** at least 15 replies of substance and at
  least 3 learners saying they came back after day 7, plus the waitlist count
  if O-10 exists.

## Not evidence for

That heritage learners respond to Iqbal or Urdu Day; the size or rules of
r/Urdu; that launch-decay patterns from other products apply. With no
analytics, replies and a waitlist are the only signal, and they lean towards
people who already love Urdu.
