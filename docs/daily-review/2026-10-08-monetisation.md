# 2026-10-08 · Monetisation and pricing (area 10)

First review of this area as an area (P-001, the daily free allowance, came
out of the market night). `qaaf-growth` researched prices by region, the free
and paid split, family and lifetime plans, and the payment rules. It ran over
its 15-minute budget, was stopped at 24 minutes before writing anything, and
was resumed only to write up what its 21 searches had already returned.
revenuecat.com was blocked, so RevenueCat figures come from search summaries.

## What competitors charge

- Duolingo Super: Rs 3,120 a year in India, and Airtel's 376 million
  customers in India have had a free year since September 2026; about Rs 749 a
  month in Pakistan; a six-person family plan at $119.99.
- Ling: $79.99 to $89.99 a year, $149.99 lifetime. Pimsleur also sells a
  lifetime Urdu course.
- The stores' default regional prices follow exchange rates, not what buyers
  can afford. ₹99 to ₹149 a month is a common entry price in India.
- RevenueCat 2026 (summary): by day 35, 0.7% of downloads pay in India,
  against 2.8% in North America. No controlled price test was found; by
  arithmetic, a 70% cut needs 3.3 times as many payers to break even.
- Paying from Pakistan: Stripe does not serve sellers based there; Google
  Play can charge to Jazz, Telenor, Ufone and Zong phone bills.

## Paywalls

- Duolingo's energy system drains even on perfect lessons, and learners say
  free use can fall to two lessons a day; Duolingo reports higher conversion.
- Longer trials convert better across all apps (17 to 32 days: 42.5%; 5 to 9
  days: 37.4%), and in education 23.5% of trials start a month or more after
  install, which supports offering the trial at the limit, as P-001 does.
- From January 2027 UK law requires a reminder before a trial ends.

## Taking payment

The stores' rules do not reach the website. In the apps, as of tonight's
sources: US iOS apps may link out to a web checkout (no fee until a court
sets one); the UK forbids it pending the competition regulator; the EU charges
10 to 15% (not confirmed live); Google allows links in the US, UK and EU at
10% on subscriptions. Elsewhere on iOS, a web purchase may unlock the app only
if it is also sold inside it.

## Decided on the owner's behalf (recorded under P-001, nothing to ship yet)

| Region                                                | Month  | Year     | Family   |
| ----------------------------------------------------- | ------ | -------- | -------- |
| UK, US, Canada, Norway, UAE, Saudi (local equivalent) | $9.99  | $69.99   | $119.99  |
| India                                                 | ₹149   | ₹999     | ₹1,699   |
| Pakistan                                              | Rs 449 | Rs 2,999 | Rs 4,999 |

- **No lifetime plan at launch.** It can take sales from the yearly plan, and
  nothing can measure that before analytics exist (Q-005).
- **Free forever:** the alphabet and Letter Lab, all review, Read faster and
  Say it back, and two new lessons a day, never cut off mid-lesson, no timer.
  The limit screen offers review first and the trial second.
- **Against, kept in view:** two lessons a day is close to the energy cap
  learners resent; a free Duolingo year is the comparison in India; a cheap
  web price invites buying from abroad; carrier billing caps may block
  Pakistan's yearly plan.

These are the first check. They get their second check, from a different
viewpoint, when payments are built (Q-002), because nothing about them is
live until then.

## Needs the owner

To sell on the web before the apps exist: a payment provider that acts as
seller of record and handles VAT (Paddle was named) and a way for a web
purchase to unlock the apps later (RevenueCat Web Billing). Both are accounts
and money, so they are the owner's (O-9). Fees were not researched.

## Not evidence for

No price has been tested on a Qaaf learner. Exact store prices for India and
Pakistan, local Urdu and Hindi apps, and Google's default regional prices
were not reached before the agent was stopped.
