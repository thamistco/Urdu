# 2026-10-16 · Analytics, feedback and privacy (area 14)

Researched by `qaaf-learner-voice` (26 tool calls, read-only). Five sites were
blocked (blog.duolingo.com, forum.clozemaster.com, feedback.gtaf.org,
forum.practiceportuguese.com, mvanec.substack.com); points from them are from
search summaries and labelled so.

## What learners say

- **Silence after a report is resented.** An r/duolingo mega-thread asks for
  "some kind of acknowledgment"
  ([mirror](https://reddit.fabiomanganiello.com/r/duolingo/comments/1bilp9a/mega_thread_xp_issues_and_more)).
  Thin sources.
- **Report buttons are used heavily and are mostly wrong.** Duolingo reports
  about 200,000 a day, 72% "my answer should have been accepted", about 10%
  needing a fix ([blog](https://blog.duolingo.com/how-user-reports-improve-course-content),
  summary only; one company's figure).
- **Losing a place to ask about a sentence** (Duolingo's sentence discussions,
  removed March 2022) is still complained about years later
  ([blog](https://trong.loang.net/~xarvos/blog/tree/content/posts/2022-11-06-against-duolingo.md),
  [r/duolingo](https://lr.psf.lt/r/duolingo/comments/1hh9hc2/does_anyone_here_like_duolingo/m2qmy7c/?context=3)).
- **Opt-in measurement is tolerated; third parties are not.** Audacity's 2021
  opt-in telemetry was dropped after users objected to Google and Yandex
  receiving the data ([TechRadar](https://www.techradar.com/news/audacity-reverses-opt-in-telemetry-plans-following-user-revolt),
  [Register](https://www.theregister.com/2021/05/07/audacity_telemetry/)).
- **Parents:** kids' apps sell "no accounts, no ads, no SDKs", and one that
  claimed "no tracking" was contradicted by its own privacy label
  ([Fluentkids](https://apps.apple.com/mz/app/fluentkids-learn-english/id6450116042)).
  The claim has to match the label.
- **Take-up:** opt-in telemetry somewhere between 1% (Notesnook's estimate,
  [blog](https://blog.notesnook.com/telemetry-opt-in-vs-opt-out)) and about 20%
  (Julia, forum arithmetic); in-app surveys about 13% (a vendor). No figure was
  found for how many people press a report button.

## What the app said, and what was fixed tonight

- **The privacy page described a phone app** (fixed, d9ff102).
  It said the recordings were bundled and that loading them sent nothing
  about the learner anywhere. Qaaf ships as a website on GitHub Pages, and
  GitHub logs each visitor's IP address for security
  ([GitHub Docs, "Data collection"](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)).
  It now says so, that we cannot see those records, and that on the website
  clearing the site's data is what uninstalling is on a phone. Dated 16
  October.
- **Settings' "Feedback" section was about chimes and vibration** (fixed): a
  learner looking for a way to tell us something landed there. It is now
  "Sound and touch".
- **There is no way to send anything at all**: the support address is still a
  placeholder (parked by the owner; not raised).
- **"Not directed at children under 13"** still sits against P-022's "No ads.
  No trackers." where parents see it. Unchanged; P-022 waits on it.

## Proposal: P-020 first, kept on the device

The specialist recommends P-020 over P-042 and P-043, in a form that does not
wait on the owner:

- A small "Something wrong?" link on the answer banner, after an answer only.
- A sheet with three choices: "My answer should count", "The Urdu looks
  wrong", "It sounds wrong" (P-024's category).
- Stored on the device only: item id, choice, the learner's answer, the date;
  at most 50.
- The sheet says "Saved on this device. Nothing is sent unless you choose
  to." Settings gains "Your reports (3)" with Copy. Email waits for a real
  address.

**For:** beginners, where a marking error hurts; heritage speakers, for the
"sounds wrong" category; Roman-track learners, whose spelling variants land in
"should count"; parents, since nothing leaves the device. **Against:** most
reports will be wrong (Duolingo's 90%), so sorting them costs the owner time;
reports nobody reads repeat the "no acknowledgment" complaint, which only the
honest wording answers; people who leave are still unheard. Not built tonight:
it is the largest item on the list and wants the night it needs.

## What this is not evidence for

Nothing here comes from Qaaf's own learners, and no r/Urdu or heritage-learner
post on privacy was found. How many would press the button or Copy, and
whether parents would accept a report sheet, are unknown. Response rates are
vendor figures or forum arithmetic.
