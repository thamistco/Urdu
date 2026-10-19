# 2026-10-19 · Marketing and advertising (area 12): a World Urdu Day playbook

Researched by `qaaf-growth` (25 tool calls, read-only). Nothing was written
and nothing was posted. This follows the plan in
`2026-10-16-marketing-and-market.md` with the detail the owner needs to act on
it.

**The biggest gap:** the current rules of r/Urdu, r/ABCDesis and the "Learn
Urdu with me" Discord could not be read. reddit.com and old.reddit are refused
from here, five Reddit mirrors failed, and searches found nothing. The
r/languagelearning rules come from search summaries of a mirror of its wiki
([mirror](https://redlib.groet-infra.nl/r/languagelearning/wiki/rules_for_promotion/)),
not the live page.

## Rules

- **r/languagelearning:** "ALL self-promotion outside of the monthly stickied
  thread is allowed only by permission." Permission covers one submission, and
  "associated" includes a social tie, so the post must say "I made this".
- **r/Urdu, r/ABCDesis, the Discord:** unread. Reddit leaves self-promotion to
  each subreddit's moderators
  ([redship](https://redship.io/blog/reddit-self-promotion-rules)). The owner
  reads each sidebar or rules channel and asks the moderators by 31 October.

## Drafts (judgement; the owner adjusts)

- **r/Urdu**, title "One letter, four shapes: ب بـ ـبـ ـب". Body: "Ahead of
  World Urdu Day: be changes shape with its position. Can you read کتاب? Answer
  in the comments tomorrow. (I made a small reading app, for people who speak
  Urdu but can't read it: https://thamistco.github.io/Urdu/)"
- **r/ABCDesis**, title "Who else can talk to their nani in Urdu but can't
  read a word?", only if that is true of the owner. The same four forms, "can
  you read کتاب?", then the link last with "I built this".
- **r/languagelearning:** a message to the moderators first: "I built a free
  web app teaching heritage speakers to read Urdu script. May I post one script
  puzzle on 9 November, World Urdu Day?" Otherwise the monthly thread.
- **Discord:** a short version of the puzzle, only in the channel the admins
  choose.

Captions for the share picture:

1. "Speak Urdu? Now read it. World Urdu Day, 9 November."
2. "ب بـ ـبـ ـب: one letter, four shapes. Read the Urdu you already speak."
3. "For anyone who speaks Urdu at home and has never read it. Nothing to
   install."

## Timing

Randal Olson's Reddit-wide studies found posts submitted around 9am Eastern
did best and those around midnight worst
([2015](https://www.randalolson.com/2015/01/11/a-data-driven-guide-to-creating-successful-reddit-posts-redux/));
weekend posts succeeded less often but scored higher when they did
([2013](https://randalolson.com/2013/03/15/a-data-driven-guide-to-creating-successful-reddit-posts/)).
9am Eastern in November is 14:00 UTC: 14:00 London, 19:00 Karachi, 19:30
Delhi. Suggested (judgement): r/Urdu on Saturday 7th, r/ABCDesis and the
Discord on Sunday 8th, r/languagelearning on Monday 9th, spaced so the replies
can be answered.

## Replies (judgement)

Answer every attempt at the word in the first two hours and correct gently;
post the answer as a comment; stay out of Hindi–Urdu arguments; write every
complaint down as a backlog item; never repost a removed post, ask the
moderators why instead.

## Measuring without trackers

- **Reddit post insights:** views, upvote rate and shares, for the poster once
  a post has 10 views, gone after 45 days
  ([Social Samosa](https://www.socialsamosa.com/2022/03/reddit-rolls-out-performance-metrics-on-the-web-for-creators)).
  Screenshot them on day 1 and day 7.
- **Replies of substance,** counted by hand. The bar is 15.
- **Supabase, the owner's dashboard:** accounts created 7 to 9 November, and
  rows in `progress` (`src/lib/sync.ts`) with `updated_at` after 16 November
  for learners back after day 7. The bar is 3. Guests who never sign in leave
  no trace.
- **GitHub traffic** covers 14 days for the repository
  ([docs](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository));
  whether it counts Pages visits is **unverified**, probably not.
- **Discord Server Insights** needs more than 500 members and an admin
  ([Discord](https://support.discord.com/hc/en-us/articles/360032807371)).

## Perspectives

**Learner:** the puzzle is the product working on them. **Family:** the caption
is something to forward. **Communities:** they need disclosure and permission.
**Against posting at all:** with no waitlist (O-10) the visits are not kept;
permission is given once and would be spent before a native app exists; a
removal or ban hurts the real launch; the replies lean to people who already
read Urdu.

## Proposals (added to the backlog)

1. **P-097:** the owner asks every moderator team by 31 October and posts only
   where they say yes. Owner's, since it means contacting people.
2. O-10 gains a date: decide where waitlist emails go before 7 November, or
   post only the r/Urdu puzzle and keep the rest for launch.
3. **P-098:** one tally sheet for the day: the insights screenshots, replies of
   substance, and the Supabase counts on days 1 and 7.

Nothing was built from this; it is all the owner's to do or decline.

## What this is not evidence for

The current rules of three of the four communities; the best time for these
particular communities (Olson's data is old and covers all of Reddit); that
anyone clicks, signs up or comes back; that the Discord server still exists.
