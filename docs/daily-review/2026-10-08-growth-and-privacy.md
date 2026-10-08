# 2026-10-08 · Growth and referral, analytics, feedback and privacy (areas 13 and 14)

First review of both areas. `qaaf-learner-voice` researched what learners say
about sharing, tracking and reporting mistakes. It ran over its 15-minute
budget, was stopped at 24 minutes before writing anything, and was resumed
only to write up its 11 searches. Reddit was reachable only through mirrors,
so everything here comes from search summaries, not counts.

## What Qaaf has

No sharing, no analytics, no "report a problem" button (confirmed in src/).
Guest progress stays on the device; sign-in is optional.

## What learners say

- **Word of mouth brings most learners:** about 80% organic at Duolingo in
  early 2023, its own figure.
- **People share pride, not invitations:** the top tenth of Duolingo
  learners made over half its Year in Review shares. Nothing found shows that
  shares bring new learners.
- **Social pressure is the repeated complaint:** friend streaks add other
  people's expectations; feeds fill with strangers; children do the easiest
  lesson to save a streak. Against: Duolingo says a shared streak makes people
  22% more likely to finish the day's lesson.
- **Urdu community classes are family-driven** (mosque classes, Sunday
  schools, one per source); none was found tied to an app. No evidence was
  found either way about Urdu learned through WhatsApp groups.
- **Privacy:** analysts, more than learners, flag the big apps (Duolingo's
  policy names six ad networks; one Memrise release had ten trackers). Parents
  complain about ads in children's apps again and again. Most Urdu children's
  apps give no privacy details at all. A "no account" app can still carry ad
  and analytics code, so a claim alone proves little.
- **Reporting errors:** Duolingo gets about 200,000 reports a day, about one
  in ten valid; the complaint is reports that go nowhere. Smaller apps that
  show learners their own reports were welcomed.

## Built tonight

**A check that keeps the privacy promise checkable.** `check:controls` now
records every host the app contacts from a cold start to the lesson path and
fails on any but its own. A font CDN, an analytics snippet or an ad SDK added
later fails the build, rather than being found by an analyst. (An engineering
check of an existing promise, so it ships without a second check; broken on
purpose before shipping.)

## Proposals, not built

1. **"Report this item" on the answer banner (P-020).** It sends the item, the
   answer given and a category, showing exactly what will be sent. Heritage
   speakers are probably the best reporters (judgement). Against: one owner
   reads every report and most will be invalid; it would be the first data to
   leave a guest's device, so the privacy policy changes first; and where
   reports go is an outside service, so the owner's choice.
2. **Share a word, not a streak (P-021):** the phone's share menu sends one
   line, such as "I read امی today", with no streak, no referral code and no
   prompt. Against: no evidence that shares bring learners, and by design
   nobody could measure whether they do.
3. **"No ads. No trackers." where parents see it (P-022),** now that a check
   enforces it. Against: the privacy page says Qaaf is not aimed at under-13s,
   which has to be settled before courting parents of young children.

## Not evidence for

No review counts; the Duolingo figures are the company's own. Not done:
Reddit directly, store reviews filtered for invite complaints, certificates,
any WhatsApp evidence.
