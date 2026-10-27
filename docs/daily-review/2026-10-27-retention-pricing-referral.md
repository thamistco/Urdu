# 2026-10-27 · Retention (area 7), monetisation (area 10), growth (area 13)

`qaaf-learner-voice` (18 tool calls, about 2 minutes) on the review card's
pressure (Q-096); `qaaf-growth` (19 calls, about 1 minute) on the share card
(Q-109) and whether anything paid is left in a free launch.

## Area 7: Home's review card on day one (P-124, from Q-096)

A miss is due again at once, so straight after a first lesson Home showed that
lesson's mistakes as "4 things to bring back … Leave them and they fade." Two
testers read day one as debt.

What learners say (search summaries, no page read whole): a growing review pile
is a common reason to quit (WaniKani forum threads; "Anki wall" posts, which
sell their own products); WaniKani keeps the first days light and new users
read it as a welcome; Duolingo's guilt-framed reminders are widely resented (an
r/duolingo thread of about 2,400 upvotes, read on a mirror). Learning science:
a first retrieval after a delay retains better than an immediate one
(Karpicke and Roediger 2007, though their delay was within a session, minutes
not a night, as the second check pointed out). The case against: forgetting is
real and late reviews cost recovery (Matuschak's notes on Quantum Country), and
loss framing made people use reminders more in one study (PMC9288568).

**Built:** the card and its count stay; the words change.

- Missed today, and one lesson weaves all of it back in (four or fewer):
  "Missed today · 4 things to look at again · Your next lessons bring them
  back first, so there’s no rush."
- Anything else: "Ready to review · 12 things to review · A few minutes now and
  they’ll last much longer."

The screen reader hears the eyebrow and the count.

**Second check:** `qaaf-critic` (truth and engineering; a learner on day one
and day five; the case against). Verdict: **SHIP**, with two majors.

- The spoken label still said "due now": fixed.
- The promise was false in reading and dialogue lessons. There, the woven
  reviews were trimmed away along with the lesson's own question, in 29 of 350
  lessons. That older bug is fixed and tested.

Its simulation used the real scheduler over 30 days and 20 seeds, one session
a day.

- A returning learner never opens on the gentle wording.
- It is about 45% of end-of-day views.
- Skipping the review whenever it shows left 26.6 due at day 30, against 23.3
  for always reviewing. Skipping reviews altogether left 143.

That simulation is not evidence about real learners.

A re-check of the fixes: **SHIP**. One minor was fixed: "your next lesson"
became "lessons", because a unit review weaves back three, not four. Two were
left. In reading and dialogue lessons the woven items now sit between the
passage's two questions, though the text stays on screen. And "Ready to review
· 12 things to review" repeats itself.

## Area 10: nothing paid in a free launch

Launch is the free web app (LAUNCH_BAR). Searching `src` for Premium,
subscriptions, prices and paywalls found nothing; gems are earned, never sold.
"Unlock every lesson" in Settings is in the tester panel, built only in tester
mode (not confirmed by running it). P-106, the Premium draft (£59.99 a year),
stays recorded for if a paid tier is ever added, and is marked in
`2026-10-23-retention-pricing-referral.md` as not part of launch.

## Area 13: the share card (Q-109)

The card was never missing: `assets/images/share-card.jpg` (1200x630, drawn by
`scripts/make-share-card.js`) is copied and named by `web:meta` whenever the
deployed origin is known, and the deploy sets it. `check:all` did not, so the
local page had no picture tags while still asking for the large card; that is
the local-and-CI-differ pattern of non-negotiable 6.

**Fixed:** `check:all` passes the deploy's origin; `web:meta` asks for the
large card only with a picture; and a new `check:share-card`, run straight
after `web:meta` in the workflow, asserts both image tags, that they point at
the page's own `share-card.jpg` over https, that the file is a 1200x630 JPEG of
300 KB or less by its own header, and alt text. Broken on purpose three ways
(no origin, file deleted, a 1080x1920 JPEG): each failed.

**Not done:** `check:deployed` could fetch the live picture and expect a 200
JPEG (Q-129). The name "Qaaf" is drawn into the card and written in three
places, so a rename (O-13) needs the card redrawn: Q-130.

## What this is not evidence for

No learner saw either card wording; the share card was not pasted into a real
chat client.
