# 2026-10-11 · Launch readiness and pricing, second pass (areas 10 and 11)

`qaaf-growth` audited the repository as it is tonight against the App Store
and Google Play rules for a first submission in early 2027 (27 tool calls,
read-only). The live site could not be fetched from here; `check:links`
already proves `/privacy` loads.

## The finding that changes the order of work

**Q-019 blocks the App Store as well as Google Play.** Since 28 April 2026
every App Store upload must be built with Xcode 26, and Expo says SDK 53 and
older "may not be compatible" and recommends SDK 54 or later. Qaaf is on Expo
52 and expo-av. Play has required target API 36 since 31 August 2026 (an
extension runs to 1 November). Q-019 moves to the top of the queue: it is the
only blocker on both stores the review can clear itself.

## The audit

| Requirement                                     | State                        | Evidence                                        | Fix                                                             |
| ----------------------------------------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Built with Xcode 26; Play target API 36         | Not met                      | package.json: expo ~52, expo-av ~15             | Q-019: SDK 54+, expo-av to expo-audio                           |
| Export-compliance answer                        | **Fixed tonight (P-036)**    | app.json                                        | usesNonExemptEncryption false; precondition in store-listing.md |
| iPad screenshots                                | **Fixed tonight (P-036)**    | app.json supportsTablet                         | false; iPads run it as an iPhone app                            |
| Keyword "hindi" (2.3.7)                         | **Fixed tonight (P-036)**    | store-listing.md                                | "speak", "qaida", "alif"                                        |
| Native Sign in with Apple and Google            | **Fixed tonight** (6f6201f)  | supabase.ts: implicit flow, native wants a code | Native asks for PKCE; found by P-036's second check             |
| Privacy manifest (ITMS-91053)                   | Unverified                   | no ios.privacyManifests                         | Check at the first EAS upload                                   |
| In-app account deletion                         | In code, off in the database | useAuthStore.ts                                 | Owner, O-6                                                      |
| Revoke Apple tokens on deletion                 | Not met                      | Q-024                                           | Owner deploys a server function                                 |
| Privacy policy content                          | Partly met                   | PrivacyScreen.tsx                               | Name the database provider and backup retention (Q-035)         |
| Support contact                                 | Owner                        | contact.ts is still a placeholder               | Parked by the owner; both stores require one                    |
| Age rating, Play target audience                | Owner                        | the only notable word is "blood"                | Judgement: 4+ (or 9+); Play: 13+ so Families rules do not apply |
| Texas app-store age checks                      | Unknown                      | injunction stayed, June 2026                    | Owner or counsel                                                |
| Testers, privacy labels, Data safety, trademark | Owner                        | O-7, O-8, Q-010                                 |                                                                 |
| Version numbers                                 | Met                          | eas.json autoIncrement                          |                                                                 |

Say it back's recordings never leave the phone, so under both stores' meaning
of "collected" there is nothing to declare for them (judgement).

## P-036, built and shipped

Second check, `qaaf-critic`, from an App Store reviewer and the export rules,
a heritage and an Indian Urdu speaker searching, and engineering: **SHIP**.

- The encryption answer is right: the only cryptography is system TLS and
  the sign-in library's hashing (PKCE), both exempt. expo-crypto is installed
  but unused. Since app.json cannot carry a comment, the precondition is
  written beside the listing.
- iPhone-only cannot be undone once a build with iPad support ships; this one
  has never shipped.
- Losing "hindi" costs little: a "hindi" search shows thousands of Hindi apps.
  The keyword field also repeated "urdu" and "script" from the name and
  subtitle, which are searched with it; those slots now hold "qaida" (the
  traditional primer) and "alif". "poetry" and "ghazal" were rejected because
  the course barely holds poetry.

## The pricing question to answer before payments (Q-002)

**Will heritage learners and parents pay every month or year, or only once?**
Bol sells a one-off unlock and Matra is free (2026-10-09), and P-001 has no
lifetime plan. Without analytics: about 15 interviews (Van Westendorp's four
questions, then a forced choice between $69.99 a year and a one-off price), and
the same choice on the 9 November waitlist if O-10 exists. Against: people say
they would pay more than they do; it gives a direction, not a price.

## Not evidence for

No build was made or uploaded; nothing here is a review outcome. Google's rules
were read through summaries. No price has been tested on a learner.
