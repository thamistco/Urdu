# 2026-10-08 · Launch readiness and marketing (areas 11 and 12)

First review of both areas. `qaaf-growth` checked the repository against the
current App Store and Google Play rules and researched launch moments and
channels (28 tool calls; support.google.com was blocked, so Google's rules
come from search summaries).

## What stands between Qaaf and the stores

| Item                                                                             | State tonight                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| In-app account deletion (Apple 5.1.1(v), Google's deletion policy)               | Was missing while the privacy policy promised it; built tonight as P-015    |
| Store copy that calls the synthesised voices "native" or "real" recordings (2.3) | Fixed tonight (d3e8862)                                                     |
| Android target API 36, required for new Play apps since 31 August 2026           | Not done: needs Expo SDK 54 or later; SDK 55 removes expo-av (Say it back)  |
| Play closed test: a new personal account needs 12 testers opted in for 14 days   | Owner                                                                       |
| Sign in with Apple beside Google (4.8)                                           | Done in the app; the native Apple sheet waits on O-2                        |
| Privacy labels and Data safety form                                              | Owner enters them; collected only after sign-in: email, user id, progress   |
| Age rating, including Apple's social-media questions                             | Owner; judgement 4+                                                         |
| Kids or Families category                                                        | Decided: do not list. It brings parental gates and SDK rules for good       |
| Screenshots: 6.9-inch iPhone, and 13-inch iPad because supportsTablet is true    | Not done                                                                    |
| Accessibility Nutrition Labels                                                   | Voluntary today; "Larger Text" means 200%, which failed until tonight's fix |
| Listing: the keyword "hindi" risks 2.3.7; "Free" must change once P-001 ships    | Queued (P-019)                                                              |

## Marketing

- **Positioning** (judgement): the only course that teaches Urdu and nothing
  else, all the way. Compete on depth, not price: Mondly is about $72 a year
  for 41 languages; uTalk sells Urdu for £29.99 to £99.99.
- **Moments:** 9 November, Iqbal Day and World Urdu Day, web and a waitlist
  only; January for the store launch, when education installs keep best; Eid
  al-Fitr around 9 to 10 March 2027 for greetings to family. Against Eid:
  Urdu is not a religious language, and it could make Qaaf look like a Quran
  app.
- **Channels:** no study was found of how heritage learners of Urdu use
  YouTube, TikTok or WhatsApp, so the channel choice is judgement. The nearest
  evidence: Pakistani families abroad want their children to learn Urdu.
- **Paid:** Apple Search Ads about $2.06 a tap for US education apps; Meta
  about $2.40 to $3.50 an install in the UK and US. £500 buys about 200
  installs, of which 4 to 8 would still be learning at day 30 (the agent's
  arithmetic).

## Decided on the owner's behalf

- **No paid advertising until day-30 retention can be measured** (Q-005).
  £500 would buy a handful of lasting learners and no knowledge.
- **Do not list in a Kids or Families category.**

## Queued

- Q-019: Expo SDK upgrade to 54 or later, expo-av to expo-audio, Android
  target API 36. L. A January launch depends on it.
- Q-020: store screenshots, or supportsTablet set false to drop the iPad set.
- P-019: listing fixes: drop "hindi", rewrite "Free" when P-001 ships.
- Q-007 updated: a waitlist from 9 November needs somewhere to keep emails,
  which is an outside service, so the owner's (O-10).

## Not evidence for

Rules were read from sources and summaries tonight; none of it is a review
outcome. The channel advice is judgement; the paid figures are industry
averages, not Qaaf's.
