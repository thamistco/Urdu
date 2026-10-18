# 2026-10-17 · Retention and habit (area 7), monetisation and pricing (area 10)

Researched by `qaaf-growth` (29 tool calls, read-only). webkit.org did not
resolve, so WebKit points come from search summaries.

## Findings

- **iPhone web push** works only after the site is added to the home screen,
  needs a manifest, and must be asked for from a tap; a learner who says no
  must remove and re-add the app to be asked again
  ([OneSignal](https://documentation.onesignal.com/docs/ios-web-push),
  [Pushpad](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications)).
  Qaaf has no service worker, keys or server to send from.
- **An iPhone home-screen app does not share storage with Safari**, by design
  ([WebKit bug 181849](https://bugs.webkit.org/show_bug.cgi?id=181849)). The
  site keeps progress only on the device, so P-075's add-to-home-screen hint
  would open an empty app on an iPhone.
- **Safari deletes a site's storage after 7 days of Safari use with no visit
  to it**; home-screen apps keep their own count
  ([Search Engine Land](https://searchengineland.com/what-safaris-7-day-cap-on-script-writeable-storage-means-for-pwa-developers-332519)).
  Judgement: a learner who lapses for a week on an iPhone may come back to
  nothing. Logged as Q-069; the cure is sign-in sync (needs O-6) and, worth
  measuring first, asking the browser to keep storage
  (`navigator.storage.persist()`).
- **Calendar files** are reported to fail from home-screen apps and from
  Chrome on iOS ([Apple forums](https://developer.apple.com/forums/thread/744029)).
- **Reminders:** Duolingo's tuned reminders added 2% to new-user retention
  over its existing ones ([KDD 2020](https://research.Duolingo.com/papers/yancey.kdd20.pdf)).
  No study of web-push opt-in for installed web apps was found.
- **Pricing:** no new Urdu or heritage prices. Apple charges nothing on US
  link-out payments today and proposed 15% (5% for small businesses) in
  August, undecided ([iPhone in Canada](https://www.iphoneincanada.ca/2026/08/14/apple-proposes-15-cut-purchases-outside-app-store/)),
  which strengthens P-081 (sell on the web first). RevenueCat 2026: half of
  paid conversions happen on day 0
  ([SaaStr](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/)).

## Proposals (first check)

- **P-074 next, specified:** at the end of the day's first finished lesson,
  "When will you practise tomorrow?" with Morning, Midday, Evening or Not
  now; stored as `practicePlan: {slot, forDate}` in `qaaf-settings`; the next
  day only, Home says "Your evening lesson: N min, M words to bring back"; a
  missed plan is never mentioned; after two "Not now" in a row, not asked for
  7 days; an optional Google Calendar link, `.ics` only in a Safari tab. Needs
  nothing from the owner. Against: one more tap as the learner leaves, and the
  effect it rests on came on top of a mailed reminder.
- **P-075 on Android only** until progress survives the move (sign-in sync,
  O-6). Against: the iPhone loses the strongest cue there is.
- **P-001 stands; build no "what Premium will include" page.** It would
  promise features and prices that have not had their second check. Against
  holding back: if half of payers convert on day 0, a trial at the daily
  limit may come too late. For P-001's second check.

## What this is not evidence for

No Qaaf data (Q-005); no web-push opt-in figure; no calendar trial; current
iOS behaviour not confirmed on a device.
