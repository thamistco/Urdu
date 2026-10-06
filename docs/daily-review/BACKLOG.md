# Daily review backlog

Everything the nightly review found that was too big to fix in one night, or is
not the review's to decide. Ranked by what most moves Qaaf towards a launch that
lasts. Each item names the night that found it, so the evidence can be read.

Sizes: **S** one night, **M** a few nights, **L** needs planning.
**Owner** means it needs a decision, money or an account only the owner has.

## Needs the owner

| ID  | What                                                                                           | Why                                                                                 | Found      |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| O-1 | Replace the Google text-to-speech key and put the new one in the environment's secrets         | The old one was pasted in chat. Nothing new can be recorded without it.             | 2026-09-23 |
| O-2 | Add `qaaf://auth` as a redirect in Supabase and in the Google sign-in client                   | Sign-in on a native build will fail without it.                                     | 2026-10-01 |
| O-3 | Store and trademark search for "Qaaf"                                                          | Only "Harf" was ever checked.                                                       | 2026-10-01 |
| O-4 | Allow edits to `.github/workflows/` and `.githooks/` so `HARF_*` build settings can be renamed | Cosmetic; blocked by permissions.                                                   | 2026-10-01 |
| O-5 | Apple Developer ($99/year) and Google Play ($25 once) accounts                                 | No native build can ship without them. See Q-001.                                   | 2026-10-06 |
| O-6 | Decide the price and the paywall: what is free, trial length, monthly/yearly/family/lifetime   | Recommendation in `2026-10-06-market.md`: alphabet free, 7-day trial, ~$69.99/year. | 2026-10-06 |

Parked by the owner (not to be raised): the support email; the _Basic Urdu_
comparison.

## Queued work

| ID    | Area         | What                                                                                                                                           | Size | Status                         | Found      |
| ----- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------ | ---------- |
| Q-001 | Launch       | Native iOS and Android builds (Expo EAS), installed and smoke-tested on a real phone                                                           | L    | open, needs O-5                | 2026-10-06 |
| Q-002 | Monetisation | Payments and a paywall (RevenueCat or the stores' own billing), shaped by O-6                                                                  | L    | open, needs O-6                | 2026-10-06 |
| Q-003 | Growth       | Family plan and a parent's view of a child's progress, to compete with BOLI and KidsBolo                                                       | L    | open                           | 2026-10-06 |
| Q-004 | Marketing    | Positioning: lead with "You speak it. Now read it." in the store listing and on the sign-in screen                                             | S    | open, owner to approve wording | 2026-10-06 |
| Q-005 | Analytics    | Privacy-respecting measurement of day 1, 7 and 30 retention and lesson completion; none exists today                                           | M    | open                           | 2026-10-06 |
| Q-006 | Content      | Native-speaker recordings for the most-heard items, the 40 letters first (uTalk markets against synthetic voices)                              | M    | open, costs money              | 2026-10-06 |
| Q-007 | Launch       | A launch plan aimed at January, when education installs retain best; a waitlist page before that                                               | M    | open                           | 2026-10-06 |
| Q-008 | Marketing    | Short-video content plan built on belonging ("read what your grandmother writes"), and a list of diaspora communities and creators to approach | M    | open                           | 2026-10-06 |
| Q-009 | Market       | Install and use Ling, Mondly and uTalk's Urdu courses for a proper teardown; tonight was desk research only                                    | M    | open                           | 2026-10-06 |
