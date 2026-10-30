# 2026-10-30 · Marketing (area 12), pricing (area 10), and growth and referral (area 13)

Two agents ran, both read-only:

- **`qaaf-growth`** (24 tool calls, about 2 minutes, two over its budget) covered areas 10 and 12. Every web source was a search summary.
- **`qaaf-learner-voice`** (21 tool calls, about 2 minutes) covered area 13. No page outside the repository resolved, so every outside source is a search summary.

## Marketing and pricing

**Findings**

- **The store listing describes a native build, not the web one.** `docs/store-listing.md` says "works offline" and "signing in is there if you want it". Both are true only of a native build (bundled assets and configured sign-in). The listing is for the stores, so it stands. It must not be reused for the website.
- **Paywalls** (RevenueCat 2026, through secondary sources): hard paywalls convert 10.7%, freemium 2.1%, and one-year retention is about equal. There is no education-specific figure.
- **Duolingo** reportedly meters free use by a daily "energy" pool (unconfirmed blogs).
- **Matra,** the closest heritage-literacy rival (Hindi), is free with no in-app purchases.
- **Launch channels:**
  - One Reddit post reportedly brought Polygloss about 2,600 sign-ups, while its Product Hunt launch flopped (self-reported).
  - A Tamil heritage app got 0 Product Hunt upvotes.
  - r/languagelearning allows self-promotion only in its monthly thread.

**Decided, recorded, not acted on**

- **The first 100 learners** (P-146): three free channels, once O-12 (the address), Q-069, Q-038 and P-130 are done:
  - one disclosed r/Urdu post asking native speakers for corrections;
  - r/languagelearning's monthly thread;
  - the owner's own family and community groups.

  Against: one shot under rules not yet read; generalists; friends' biased praise. Measured without tracking: replies reporting a finished alphabet, and P-130 reports. This means contacting people, so it is the owner's to do.

- **Pricing:** keep the launch fully free. Keep P-001 for later with two changes:
  - count lessons, not exercises;
  - learners who started before payments keep what they were promised.

  Against: freemium converts at a fifth of a hard paywall, and a later limit reads as something taken back.

- **Store copy:** a draft true of today's build, with "computer-generated voices" said plainly. It is kept in this report for P-019, and not yet checked by `check:claims`.

## Growth and referral: what learners say

**Findings**

- Heritage learners are criticised by relatives and teachers, and starting from what they can already do keeps them going (one expert, on NPR).
- Practising as a family helps children past barriers (one study of 212 families).
- Parents check safety, no ads and privacy (Common Sense's privacy criteria).
- Urdu children's apps have almost no independent reviews.

The learner-voice report said Q-003 (family plan) was missing from the backlog. It is not: Q-003 is in the queue.

**Proposals**

- **P-083 and P-103 as one share card at the end of the alphabet unit, shown once:** raised in priority, not new.
  - Against: share buttons are rarely used, and the effect could never be measured.
- **One plain line on the Settings privacy card,** "No ads. No tracking. As a guest, nothing you do leaves this phone." Recorded as P-143.
  - Against: no evidence anyone reads it, and it must not suggest Qaaf is made for children.
- **Learner profiles on a shared phone: held, and the hold written down.** A second learner means restructuring `qaaf-progress`, the key that must never lose data, and there is no evidence Urdu families want it.

## What this is not evidence for

- No page read in full.
- No learner saw any proposal.
- Nothing about how many people feel any of this.
