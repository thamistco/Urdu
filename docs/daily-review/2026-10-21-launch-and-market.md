# 2026-10-21 · Launch readiness (area 11) and market (area 1)

Area 11 by `qaaf-growth` (28 tool calls, read-only); area 1 by
`qaaf-learner-voice` (29 tool calls, read-only). Neither could reach the live
site, docs.github.com, Goodreads or several review sites (DNS); points from
search summaries are marked (S).

## Area 11: the web launch checklist for 7 November

**Done**

- Deep links: CI copies `index.html` to `404.html` and adds `.nojekyll`
  (`.github/workflows/deploy-preview.yml`), and the lesson, privacy and terms
  routes exist. GitHub Pages serves that fallback with a 404 status, so
  crawlers treat deep links as missing; the planned posts link to the root,
  which returns 200.
- The share picture and large card, written when CI sets SITE_ORIGIN.
- Favicon and manifest (one 1024px icon marked "any maskable").
- Privacy and Terms at public addresses; not yet to UK GDPR article 13 (P-093).
- Bandwidth: GitHub Pages' soft limit is 100 GB a month, with 429s possible and
  no published rate (S). About 10 MB per first visit, so 500 visitors is about
  5 GB. The risk is the unpublished rate limit, not the bandwidth (judgement).

**The review can do without the owner:** P-094 as a build flag (S); an article
13 page draft with the data holder left blank (M); an accessibility statement
(M; good practice, not a duty for a private app); manifest icons at 192 and
512 with separate "any" and "maskable" entries (S); a curl check of the live
site for og:image, a deep link and sign-in (S).

**Needs the owner:** O-11 (the data holder, and article 13 asks for their
contact details too: an email, a postal address or a form); O-6 by 5 November
or P-094 applies; O-10; whether the Supabase secrets are set (this decides
whether sign-in is live at all); and, later, a host for web sales, since Pages
is "not intended… to run your online business, e-commerce site"
([GitHub](https://help.github.com/articles/what-is-github-pages)).

**How a learner reports a problem today:** they cannot, from inside the app.
On Urdu Day the only route is a reply under the post they came from.

**Proposal (P-108):** one contact form, on whatever service the owner picks for
O-10, used for the waitlist, the contact details article 13 asks for, and
problem reports, linked from Settings, Privacy and Terms. **Against:** it
collects emails and free text, so the privacy page grows; someone must read it
daily, and spam will come; it may cut across the owner's choice to park the
support email, so it is theirs to accept.

## Area 1: what learners say about learning to read Urdu

- **Teach Yourself "Read and Write Urdu Script"** (retail reviews, S): liked as
  a slim alphabet-only primer; several found it easier because they already
  read Hindi, Punjabi or Arabic script; complaints are letters changing shape
  by position and missing vowel marks.
- **UrduPod101** (S): "not super helpful for the alphabet", and transliteration
  that does not always match the script (one learner).
- **Memrise** community decks vary and now live away from the main app (S).
  **Tutors** cost $4 to $40 on Preply, of uneven quality (S). **Ling**: one
  reviewer says tracing made the script approachable (S).
- **Nastaliq against Naskh:** nothing newer than the March 2025 r/Urdu thread
  already reported. For Nastaliq: Urdu users asked Debian for a Nastaliq font
  because Naskh was not good enough (2013, software users). Against: Persian
  children in grades 1 to 3 read faster and more accurately in Naskh than in
  Tahriri, a style derived from Nastaliq
  ([IKIU](https://jtpsol.journals.ikiu.ac.ir/article_1350.html?lang=en), S).
- **New apps:** none confirmed since 13 October. One not mentioned before:
  "GupShup - Learn Urdu" (vocabulary and phrases with XP, one rating, release
  date unknown, nothing about the script).

**Decision recorded:** Qaaf stays Nastaliq-first. Printed Urdu is Nastaliq,
and the one study against it is on Persian children reading a related style.

**Proposals:** extend P-023 with a "you already read this" bridge, a known word
in Naskh beside the Nastaliq for learners who read Arabic letters from mosque
school (P-109; against: two shapes at once for a beginner, evidence is
reviews); say up front when Roman and vowel marks will fade (P-110; against:
one learner's comment, and whether Qaaf already does this was not checked).

## What this is not evidence for

The live site was not inspected; the GitHub limits are from search summaries;
no lawyer was consulted. Each market point rests on one to a few reviews,
nearly all read through search summaries; nothing from Roman-script learners,
parents, or people who left an app.
