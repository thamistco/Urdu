# 2026-10-26 · Privacy (area 14), what learners say about reporting (area 15), marketing (area 12)

Area 14 by `qaaf-growth` (26 tool calls, about 2 minutes, read-only); area 15
by `qaaf-learner-voice` (27 tool calls, about 2 minutes, read-only); the
privacy page then second-checked twice by `qaaf-critic`. **Not legal advice;
no lawyer has read the page.**

## Area 14: the privacy page against UK GDPR article 13 (R9)

The page said nothing of why data is kept or on what basis, who handles it,
transfers abroad, how long it is kept, the learner's rights, complaints,
whether anything is required, or automated decisions, and it said only
progress is copied on sign-in when `sync.ts` uploads progress, settings and
the onboarding answers. Fonts and voice clips are bundled; nothing is fetched
from another origin at run time, so that section was already right.

**Built (P-093), and second-checked from accuracy against the code, a parent
of an 11-year-old and a reader of English as a second language, and the case
against.** The first check found the draft untrue of this build in places:
it told learners to ask us for their data and that "we will reply" with no
contact anywhere; it promised deletion "straight away" when the deletion
function is not yet installed (O-6); it assumed sign-in exists, when the
public build may have none; it left out the onboarding answers and that an
account's copy replaces this device's progress; it claimed "the safeguards UK
law requires" with no region known; and its children's section was US
wording for a course families will use. All fixed in the critic's wording;
the re-check found the deletion promise still in three places, now each with
"If it says deleting is not switched on yet, nothing has been deleted". The
critic said its wording makes the page SHIP.

What the page now says it does not know yet, plainly: who runs Qaaf and how to
reach them (O-11); which countries data is kept in and the protections that
apply; how long backups last. R9 asks for article 13 apart from the holder's
details; the region and backup period are the owner's dashboard to read, so
R9 is close but not met.

## Area 15: what learners say about reporting a problem (R7)

Mostly search summaries. Duolingo receives about 200,000 reports a day, 72%
"my answer should count", about 10% valid (its own blog). The commonest
complaint across WaniKani, Memrise, Busuu and Drops users is silence: reports
that change nothing and get no reply, until people stop. Duolingo's report
is "pretty well buried" (one blogger). Learners like fixing it themselves
(WaniKani's own synonyms; Bunpro's undo, valued and misused). No Urdu or
heritage learner evidence was found; Roman Urdu has no standard spelling
(zindagi, zindagee, zindagy), which `roman.ts` already folds.

**For P-020, the in-app report:** "Something wrong?" in words; on a wrong
answer, "My answer should count" (saving what was typed), "The Urdu looks
wrong", "It sounds wrong", and on a right answer only the last two; an
optional "What do you say instead?"; the item, track, version and date saved
with it (P-113). After reporting, say what is true: "Saved on this phone only.
Qaaf doesn't send reports anywhere yet, so nobody has read it. You'll find it
under Settings, Your reports, where you can copy it." A quiet "Reported" on
an item already reported. Against: a report that goes nowhere could cost more
trust than no button, and the banner is already crowded at 200% on a small
screen; honest wording and P-113's Copy answer it. A "count it anyway" button
is not proposed: a scoring change people can misuse.

## Area 12: one free thing

Add an `og:image`: the page declares a large-image card but names no image,
so every shared link is bare text (also suggested 2026-10-21). Against:
nobody is sharing yet, and the card goes stale if the name changes (O-13).

## What this is not evidence for

How a lawyer, the ICO or a store reviewer reads the page; whether sign-in is
live on the deploy (the secrets cannot be seen from here); how many Qaaf
learners would report anything.
