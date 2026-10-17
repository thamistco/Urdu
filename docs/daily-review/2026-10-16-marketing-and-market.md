# 2026-10-16 · Marketing and advertising (area 12), market and competitors (area 1)

Researched by `qaaf-growth` (29 tool calls, read-only). Three sites would not
load (ling-app.com, apppricinglab.com, theindianawaaz.com); facts from them come
from search summaries and are labelled so. Built and measured by the manager.

## Findings

- **World Urdu Day is fixed.** Pakistan's Cabinet Division lists Iqbal Day for
  Monday 9 November 2026, so 7 to 9 November is a long weekend
  ([Daily Pakistan](https://en.dailypakistan.com.pk/19-Jan-2026/public-holidays-in-pakistan-2026-revealed-check-notification-here)).
- **India marks it too.** A Delhi committee gives its World Urdu Awards on 9
  November (Indian Awaaz, search summary only) and Hyderabad schools plan
  events ([Siasat](https://www.siasat.com/world-urdu-day-hyderabad-to-celebrate-its-legacy-amidst-concerns-of-decline-3128061/)).
  That answers the 11 October worry that the day is Pakistani alone; the line
  still names the day rather than Iqbal.
- **The market since 13 October:** no new Urdu app found. Duolingo still has
  no Urdu course for English speakers; English-from-Urdu is still a test
  ([duolingoguides](https://duolingoguides.com/?p=7326)). Ling's blog now quotes
  $16.99 a month, $64.99 for six months and $89.99 a year, against $14.99 and
  $79.99 recorded on 13 October (search summary, undated, **unverified**).
- **Positioning:** Lentil ([listing](https://apps.apple.com/app/id1437742541))
  and Mondly lead with phrases, Kids Bolo starts families in Roman Urdu
  ([site](https://kidsbolo.com/pages/learn-urdu-online)), Ling covers many
  languages. None leads with reading for people who already speak. Judgement:
  keep "Speak Urdu? Now read it." and the store copy.
- **The share picture was the square icon** in the small card, so a pasted
  link showed an orange letter and nothing of the script. Meta asks for under
  600 KB ([Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/)),
  some clients drop previews over 300 KB ([Wix](https://support.wix.com/en/article/wix-editor-recommended-ogimage-size)).
- **Comparable launches** say little about a free launch with no budget: Kupu's
  35,051 first-day downloads were self-reported and paid for by sponsors
  ([case study](https://www.thestable.com.au/update-colenso-bbdo-spark-remarkable-success-for-the-app-allowing-the-maori-language-to-thrive-again/)).

## Built, second-checked and shipped tonight: P-040

1. **"World Urdu Day · 9 November"** above the front door's headline, which
   stays, from 7 to 12 November by the learner's own calendar
   (`src/lib/urduDay.ts`), on windows at least 580px tall. The date test fails with either bound moved or the
   month guard removed. `check:scenery` now also renders the front door on 9
   November and requires the line to be there and on the dark band.
2. **A 1200x630 share picture** (`assets/images/share-card.jpg`) drawn by
   `scripts/make-share-card.js` from the evening scene, قاف, the name and the
   headline; the large card, with size and alt text declared. Measured: 50 KB,
   worst pixel behind the words 8.21:1. The first crop, with the words on the
   sunset, measured 2.37:1 and the script failed it.

The second check held it twice before SHIP (`2026-10-16-agents.md`): the
line is goldLight, not gold (5.35:1 at 320x568), and shows only in windows
580px tall or more, since between 520 and 565px it sat on the sunset's glow
at 4.31:1. Where it shows its worst pixel is 7.36:1. The alt text opens in
Latin, "Qaaf (قاف): Speak Urdu? Now read it.", and "9 November" no longer
breaks across lines.

Perspectives: **learner**, it says why today; **family**, a reason to forward
the link, and the preview now shows the script; **community**, the line names
the day, not a person, so it reads the same in Lahore and Hyderabad.
**Against:** the diaspora barely marks the day; the line runs six days a year;
with no waitlist (O-10) the visits are not kept; iMessage shows only the title
and WhatsApp may show no preview at all.

## A plan for the owner (nothing was posted)

- Post on Saturday 7 to Monday 9 November in r/Urdu, r/ABCDesis,
  r/languagelearning (moderators' permission first) and the "Learn Urdu with
  me" Discord.
- A puzzle, not an ad: one letter in its four forms, then "can you read this
  word?", the link last.
- Nastaliq calligraphy short-video creators are the people to approach (weak
  evidence). Indian Urdu Day committees are institutions, not channels.
- Against: unpaid posts are small, communities limit self-promotion, and the
  replies lean to people who already love Urdu.
- The bar, from 11 October: at least 15 replies of substance and at least 3
  learners back after day 7.

## What this is not evidence for

That anyone abroad responds to the day; Ling's current price; that a large
preview raises clicks; any creator's reach. No store page was read directly
and nothing was installed.
