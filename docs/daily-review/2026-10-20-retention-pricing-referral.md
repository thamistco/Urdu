# 2026-10-20 · Retention (area 7), monetisation (area 10), growth and referral (area 13)

Area 7 by `qaaf-learner-voice` (33 tool calls, read-only); areas 10 and 13 by
`qaaf-growth` (29 tool calls, read-only). Every page fetch by learner voice
failed (DNS), so its points come from search summaries (marked SS); growth
could not reach MDN, caniuse, RevenueCat, Lenny's Newsletter or Paddle's docs,
and read no official price page.

## Area 7: what learners say about coming back, and about league farming

- **The pile of overdue reviews is what drives returners away** (many voices,
  three communities, all SS): "you'll come back to hundreds of overdue
  reviews. This is where people quit"
  ([Migaku](https://migaku.com/blog/japanese/anki-language-learning-guide));
  WaniKani returners report 900 to 1,600 reviews waiting
  ([thread](https://community.wanikani.com/t/900-reviews-coming-back-after-a-break/18817));
  Bunpro and Anki users ask for a way back short of a reset. **What helped:**
  reviews only, in small batches, until accuracy returned
  ([WaniKani](https://community.wanikani.com/t/restarting-after-a-break/66244)).
- **Qaaf showed the pile.** With more than 30 due, Home's main card said
  "{N} things to bring back", though the review it offers is 20.
- **League farming:** a few voices say farmers make a league feel out of
  reach; a fan newsletter says Duolingo's fix was to pay path lessons more
  (about 10 to 25 XP), not to punish side activities
  ([DuoPlanet](https://newsletter.duoplanet.com/posts/has-duolingo-finally-fixed-xp), SS).
  Mogavi et al. name competitiveness as a main cause of "gamification misuse"
  ([arXiv 2203.16175](https://arxiv.org/pdf/2203.16175), abstract, SS). No
  account or figure of anyone leaving because others farm was found.
- **Losing a streak can be a relief** to some (3 interviews,
  [uxdesign.cc](https://uxdesign.cc/3-reframing-streaks-on-duolingo-5-ideas-for-a-more-healthy-and-flexible-approach-to-language-8fd89545771e), SS).
- Nothing specific to Urdu or heritage learners was found on either question.

**Built tonight, P-104:** with more than 30 due, Home now says "20 to bring
back first", then the lesson to carry on with; the total stays on the Review
tab.
**Against:** it hides a true number, and some learners are spurred by a big
one. Second check: `2026-10-20-agents.md`. Leagues: no new proposal; P-090 (a
switch to hide the league) covers learners who stop caring. P-102, which cut a
tapped-through review's XP, was built tonight and held: it moved the farming to
Topic practice and fined a returner who did badly on the catch-up
(`2026-10-20-learning-effectiveness.md`). Qaaf's league opponents are
generated, so farming harms no real person; the reason to fix it is the
learner's own reward.

## Area 10: what can be ready before payments exist (O-9)

Prices, all second-hand: Ling $14.99 to $16.99 a month, $79.99 to $89.99 a
year, $149.99 for life, 7-day trial
([Ling](https://ling-app.com/blog/ling-app-pro-vs-free-version/)); Duolingo
Super about $12.99 a month or $83.88 a year, Family $119.99 for six
([subger](https://subger.com/en/service/duolingo-plus)); Babbel $107.40 a year
([Pulse Signal](https://getpulsesignal.com/pricing/babbel)); Pimsleur about
$19.95 a month. No GBP or PKR prices found; India figures conflict. RevenueCat's
2026 report via [SaaStr](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/):
10.7% of downloads pay behind a hard paywall against 2.1% for freemium; 39.8%
of 7-day trial cancellations happen on day 0. Paddle lists 30 currencies; INR
only on a legacy page, PKR unconfirmed, so Pakistan may be charged in USD.

Recommendations (judgement, for P-001's second check when it is built):

1. **What is free:** keep the 8 October split. Against: hard paywalls convert
   five times better, but a heritage learner turned away on day one sends no
   one.
2. **Price:** $9.99 a month, $69.99 a year, below Ling, Duolingo and Babbel;
   add £8.99 and £59.99; keep ₹999 and Rs 2,999 with a USD fallback.
3. **Trial:** 7 days, offered at the daily limit, with a reminder before it
   ends.
4. **Family:** none in the first week; adding members needs invites and a
   backend. **Lifetime:** none.

Ready before O-9 with no accounts (P-106): one `isPremium` source behind a
flag, the limit screen, the P-080 wording, prices in one config table, restore
through sign-in. After O-9: products, a webhook, the entitlement row. Unknowable
without learners: conversion at any price, price sensitivity in India and
Pakistan, whether two lessons a day is too tight, refunds.

## Area 13: sharing by World Urdu Day

**P-103 (new):** on Lesson complete, from the first finished lesson, a quiet
secondary button, "Know someone who speaks Urdu but can't read it?", calling
the Web Share API with the link (the share picture is already on every link);
where sharing is unsupported, copy the link and say "Link copied". No URL
parameter, nothing recorded. Web Share works in Chrome, Edge and Safari, not
Firefox without a flag ([web.dev](https://web.dev/articles/web-share)).

**Learner:** one tap after a success. **Family:** a WhatsApp link with the card
is normal. **Business:** free to build; share buttons are used by about 0.2% of
mobile visitors ([GOV.UK 2014](https://insidegovuk.blog.gov.uk/2014/02/20/gov-uk-social-sharing-buttons-the-first-10-weeks),
old). **Against:** after one lesson there is little to vouch for; without O-10
the visits are not kept; it cannot be measured apart from the posts. Held
until the owner decides O-10, as the growth review itself recommends.

## What this is not evidence for

Any Qaaf learner's willingness to pay or share; whether the prices above are
current; whether Paddle can sell in Pakistan; how Urdu families share; any
measured rate of leaving over farming or backlogs (all anecdotes, mostly from
learners of Japanese).
