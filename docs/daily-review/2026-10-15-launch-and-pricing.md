# 2026-10-15 · Monetisation and launch readiness (areas 10 and 11)

`qaaf-growth`, 31 tool calls (1 over its 30), 2.3 minutes, read-only. Every
web source came through search summaries; no store page was fetched directly.

## The launch checklist as it stands

The repo: Expo ~52, React Native 0.76.6, expo-av ~15; no privacy manifest and
no target SDK in `app.json` or `app.config.js`; Privacy, Terms and Settings
screens exist; Delete account is wired; Terms and Privacy say nothing about
subscriptions, payments or refunds.

| Rule (source, date)                                                                                                                                                                                        | State                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Apple: build with Xcode 26 from 28 Apr 2026, so Expo SDK 54+ ([Expo, 27 Apr 2026](https://expo.dev/blog/app-store-connect-minimum-sdk-26))                                                                 | Not done (Q-019)                                              |
| Apple: the new age-rating questionnaire ([9to5mac, 24 Jul 2025](https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/))                                             | Owner (O-8)                                                   |
| Apple: privacy labels; a privacy manifest                                                                                                                                                                  | Owner (O-8); manifest not in config                           |
| Account deletion                                                                                                                                                                                           | Code done; database off (O-6); Apple token revocation (Q-024) |
| Apple: 6.9-inch screenshots, 1320x2868, 1 to 10                                                                                                                                                            | Not done (Q-020)                                              |
| Apple 3.1.2: subscription title, length and price on the paywall; links to privacy and terms                                                                                                               | Not done                                                      |
| Texas SB2420 (app store age verification): stayed injunction, at the Supreme Court ([Pearl Cohen](https://www.pearlcohen.com/fifth-circuit-stays-injunctions-against-texas-app-store-accountability-act/)) | Owner or counsel                                              |
| Play: target API 36 since 31 Aug 2026, extension to 1 Nov 2026 ([Android Developers](https://developer.android.com/google/play/requirements/target-sdk))                                                   | Not done (Q-019)                                              |
| Play: in-app and web account deletion, and the Data safety form ([help 13327111](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en-GB))                                        | Code done (needs O-6); the form is the owner's                |
| Play: 12 testers for 14 days; developer verification (from 2027 outside BR/ID/SG/TH)                                                                                                                       | Owner (O-7)                                                   |
| Play: 2 to 8 screenshots, a 1024x500 feature graphic, a 512 icon                                                                                                                                           | Not done                                                      |

**Q-019 is the gate for both stores**, and the Play extension ends on
1 November 2026.

## Payments for P-001

- **RevenueCat** (`react-native-purchases`): one entitlement across web
  (Web Billing via Stripe or Paddle) and native since 9.7.6; free to $2.5k a
  month tracked revenue, then 1% of gross; needs a development build.
- **expo-iap:** free, StoreKit 2 and Play Billing, no web; receipts and
  entitlements on our own server.
- **Fees:** Apple 15% under the Small Business Program; Play about 15% for
  subscriptions; Paddle 5% + $0.50 as merchant of record.
- **Before anyone can pay:** Q-019, native builds, subscription terms, a
  privacy policy naming the processors, a 3.1.2 paywall, restore purchases.
- **Only the owner can:** store accounts (O-5), Apple's Paid Apps agreement,
  bank and tax, Play's payments profile, Small Business Program, a RevenueCat
  and Stripe or Paddle account, the products in each console, O-6, Q-024.

## Proposals (checked once)

- **P-079** RevenueCat for payments, built after Q-019. For: free until
  $2.5k a month; a parent who pays on the web is unlocked on the phone;
  restore and receipts handled. Against: 1% of gross for ever and one
  vendor; expo-iap and a Supabase function cost nothing but are more code.
- **P-080** Subscription and refund clauses in Terms, processors named in
  Privacy, and a 3.1.2 paywall spec, before any billing code. For: the most
  common 3.1.2 rejection removed; learners know what renews. Against: wording
  for a product that does not exist goes stale, and legal wording is the
  owner's or counsel's to judge, so it waits for the owner.
- **P-081** Sell on the web first (RevenueCat Web Billing, Paddle) to answer
  Q-002. For: about 5% instead of 15%; real prices tested before the stores.
  Against: tiny traffic and no analytics (Q-005), so the result could not be
  read; needs owner accounts.

## What this is not evidence for

Nothing was built, uploaded or bought. Google's 2026 fee split, the Texas
law's status and Stripe's subscription fee are unconfirmed.
