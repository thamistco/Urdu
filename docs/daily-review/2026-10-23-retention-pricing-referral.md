# 2026-10-23 · Retention (area 7), monetisation (area 10), growth and referral (area 13)

Area 7 by `qaaf-learner-voice` (27 tool calls); areas 10 and 13 by
`qaaf-growth` (23 tool calls); both read-only. Every page fetch by learner
voice failed (DNS), so its points come from search summaries (SS); growth
could not reach legislation.gov.uk or EUR-Lex, so its legal points come from
case summaries and law-firm notes, not the primary texts. **Not legal advice.**

The owner, 23 October: no launch date, so nothing here is aimed at World Urdu
Day any more.

## Area 7: reminders without push, and streaks in a browser

- **WaniKani, web only with no official reminders, is the closest case:** its
  learners built their own (a phone app, a browser extension with a badge, a
  calm new-tab page) or set an alarm at a fixed time (SS, committed learners).
- **Most people refuse browser notification prompts:** granted 10 to 12% of the
  time on desktop and 21 to 23% on Android, across all sites
  ([USENIX Sec '21](https://www.usenix.org/conference/usenixsecurity21/presentation/bilogrevic), SS).
  On iPhone, web push needs the app installed to the home screen, which opens
  with none of Safari's progress.
- **A browser-only streak can hold a long habit** (Wordle), credited to sharing
  with family, not reminders; the common complaint is losing it to cleared data
  or a new device ("I cried"; Safari users reporting resets every few days)
  (SS, many voices).
- Nothing on Urdu or heritage learners; Muslim habit guides advise a small
  amount right after a prayer, as the cue (guides, not learners).

**Decided:** no browser notifications before sign-in sync exists: most refuse
the prompt, the iPhone path loses progress, and there is no server to send
from. **Against:** WaniKani's learners wanted notifications enough to build
them, and Android and desktop Chrome lose a working channel.

**Proposals:** P-117, at a streak of 7 or more, a quiet "Saved in this browser
only" on the streak card, linked to `navigator.storage.persist()` (Q-069).
Against: worry over something the learner cannot fix yet; sign-in sync is the
cure. An "after a prayer" time choice for P-074's reminder was considered and
**not** proposed: it assumes a religious learner, and many heritage learners
are Hindu, Sikh or not religious.

## Area 10: the screen at the daily limit (P-106)

**2026-10-27: not part of launch.** Launch is the free web app
(`LAUNCH_BAR.md`), and nothing in the app is paid. This draft stays for if a
paid tier is ever added, after O-9; no run should build it before then.

A draft, in the app's voice: "That's today's two new lessons. Your reviews and
the whole alphabet stay open. New lessons open again tomorrow." Always free:
the alphabet, every review, two new lessons a day. Premium adds as many new
lessons a day as you like, at £59.99 a year or £8.99 a month, VAT included;
seven days free with an email two days before they end; cancel any time and
keep Premium to the end of what was paid; a full refund on request within 14
days of the first payment.

What UK and EU consumer rules ask of it (from summaries): what Premium adds,
the total price with tax per period, the length and how to end it, directly
before the order (UK CCR 2013 reg. 14 and Sch. 2; EU CRD art. 6); the seller's
name and contact; the right of withdrawal or that it is lost; an order button
that says payment follows (CCR reg. 14(3); the CJEU's Fuhrmann-2, C-249/21,
and Conny, C-400/22, so "Try 7 days free" can only open the checkout); a free
trial told clearly at booking or a fresh 14 days at conversion (Sofatutor,
C-565/22); an express, acknowledged and confirmed waiver if the 14 days are to
be lost for digital content (the draft does not use one and offers the refund
instead); the EU withdrawal button required since 19 June 2026; Germany's
cancellation button (BGB §312k). The UK's DMCC subscription rules are expected
in spring 2027; the draft already meets them.

**Cannot be written until O-9 and O-11:** who the seller is (a merchant of
record such as Paddle is the seller, which decides whose screens carry the
order button, the waiver, the confirmation email and the cancellation button),
refund terms, whether a card is taken at the trial's start, the currencies
really charged, tax by region, who sends the reminder, and where "Settings →
Plan" leads.

## Area 13: P-103 (a share button), judged with no date

**Judgement: build it, on four conditions:** shown from the end of the first
unit, not the first lesson; one share component shared with P-021; a second
check; dropped if it pushes Continue off a 320x568 screen at 200% text. It was
held for the waitlist (O-10), but a shared link opens the app itself, which
keeps progress with no account, so little is lost without one. **Against:**
share buttons are rarely used (about 0.2%, old), Duolingo's referral
programme lifted new users by 3%
([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)),
it cannot be measured, and a repeated prompt can read as nagging.

## What this is not evidence for

How any Qaaf learner responds; measured return rates from any reminder;
whether anyone will pay these prices or share; any legal rule read in its
primary text or applied to Qaaf.
