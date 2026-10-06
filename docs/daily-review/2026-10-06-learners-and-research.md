# 2026-10-06 · What learners say, and what the research shows

Areas 15 and 16, added to the rotation today at the owner's request: look at
what people say about other language apps (what they like, what they wish
existed), what Urdu learners want in particular, and what research shows
works, then adapt it into Qaaf. Research and proposals only; no code changed.
Several forum pages could not be opened from here, so Reddit views come through
search summaries and mirrors, and say so.

## What learners say

### About the big apps

- **"A long streak, and still no conversation."** The most-cited complaint of
  2026 is that the game has taken over the learning: "I have a 1,200-day streak
  in Duolingo and I cannot hold a conversation in Spanish"; "the app wants me to
  tap matching words, not speak the language"
  ([unstar.app review analysis](https://unstar.app/blog/language-learning-app-reviews-duolingo-babbel-rosetta-stone-2026)).
- **Speaking is the gap.** Studies of learners using Duolingo name missing
  real conversation, too little pronunciation feedback and missing cultural
  context ([JEE study](https://journal.upp.ac.id/index.php/JEE/article/view/4612)).
- **Moving people's progress breaks trust.** When Duolingo reshuffled its
  courses, most poll respondents said it hurt them: finished sections filled
  with unfamiliar material, others sent back far below their level
  ([Android Authority poll](https://androidauthority.com/duolingo-course-updates-poll-results-3690803)).
- **What they value:** real interaction, structured repetition and clear
  feedback; streaks were rated the strongest motivator; repetitive drills and
  shallow personalisation push people away
  ([jios.foi.hr study](https://jios.foi.hr/index.php/jios/article/view/2575/1076),
  [Oulu thesis on Duolingo streaks](https://oulurepo.oulu.fi/handle/10024/54117)).

### About Urdu apps

- Ling's Urdu users report a paywall straight after the first lesson,
  translation errors within minutes, a robotic-feeling chatbot, and voice
  recognition that fails even in a quiet room
  ([justuseapp reviews](https://justuseapp.com/en/app/1403783779/sprachen-lernen-ling/reviews)).
  Against that, Ling is rated 4.6 from about 11,000 ratings, so these are the
  complaints of a minority of a popular app, not a verdict on it.

### What Urdu learners want in particular

- **Nastaliq, not Naskh.** Urdu readers grew up on Nastaliq and find the Naskh
  that most websites fall back to harder to read; learners on r/Urdu swap
  Nastaliq resources and recommend practising the shapes that differ most
  ([r/Urdu thread, via mirror](https://cal1.lr.ggtyler.dev/r/Urdu/comments/1jemloe/nastaliq_learning_resources)).
  Qaaf is Nastaliq throughout, which is right.
- **Heritage speakers can already understand; decoding is the barrier.**
  For a speaker of Hindi or Urdu, written Urdu is "almost fully comprehensible",
  and "the only tricky part is decoding the script"
  ([zabaan.com](https://www.zabaan.com/?p=12222)). Universities run whole
  courses for exactly this learner
  ([Columbia](https://doc.sis.columbia.edu/subj/MDES/UN1615-20261-001),
  [Northwestern](https://class-descriptions.northwestern.edu/4920/WCAS/HIND_URD/16093)).

## What the research shows

- **Spacing and retrieval** are among the best-replicated findings in learning:
  spreading practice out beats cramming it, and recalling beats re-reading. For
  vocabulary, saying or producing the word beats only recognising it. Spacing
  helps explicit knowledge far more than the automatic kind
  ([summary with sources](https://dev.to/pocket_linguist/the-science-of-language-learning-what-research-actually-says-1a93),
  [SSLLT](https://pressto.amu.edu.pl/index.php/ssllt/article/view/49487)).
- **Mixing beats blocking** for grammar practice: interleaved exercises feel
  slower and are remembered longer
  ([Cambridge](https://www.cambridge.org/core/product/4D03D1F5169B719D90F14BBE474015F5)).
- **Input is necessary.** Grammar without real reading and listening produces
  "test-takers, not speakers"; input combined with retrieval works best
  ([summary](https://dev.to/pocket_linguist/the-science-of-language-learning-what-research-actually-says-1a93)).
- **Reading Arabic script is a speed problem as much as a knowledge problem.**
  Readers have to tell close letter shapes apart fast; fluency comes from
  automaticity, and around **45 to 60 words a minute** frees working memory for
  understanding ([Frontiers 2025](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1628051/pdf),
  [Asaad and Eviatar](https://newiipdm.haifa.ac.il/wp-content/uploads/2015/05/AsaadEviatar2013a.pdf)).
- **Shadowing** (repeating audio as you hear it) improved pronunciation and
  fluency in a 2017 study, and 10 to 15 minutes three or four times a week for
  six weeks gave lower-intermediate learners measurable listening gains
  ([Migaku guide citing both studies](https://migaku.com/blog/language-fun/shadowing-a-practitioners-guide-to-the-technique-in-2026)).

## Where Qaaf stands

Measured in the code today:

| What works               | Qaaf                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Spaced repetition        | Yes, a review schedule with its own check (`check:srs`)                                                  |
| Retrieval and production | Yes: typing a word, giving the Urdu for a meaning, building words and sentences                          |
| Real input               | Yes: 17 readings and 12 dialogues, all recorded                                                          |
| Listening                | Yes: listen-and-tap, every item recorded in two voices                                                   |
| Script, shape by shape   | Yes: all 40 letters in all four forms, tracing, contrast drills for look-alikes                          |
| Heritage speakers        | Partly: a speaker skips the basic vocabulary at setup, but nothing trains reading speed                  |
| Speaking                 | **No.** The app never uses the microphone; the privacy policy says so                                    |
| Reading speed            | **No.** Nothing measures or builds how fast a learner reads                                              |
| Not reshuffling progress | Yes: the migration notice (URD-014) tells a learner when content moved, rather than moving them silently |

## Proposals (checked once today; second check on a later day)

- **P-003 Say it back.** A shadowing step on dialogue and reading lines.
- **P-004 Read faster.** Reading-speed practice for the script, aimed at
  heritage speakers.
- **P-001 gains evidence:** a paywall straight after the first lesson is one of
  Ling's top complaints, which supports keeping the alphabet free.

Details and the perspectives weighed are in `BACKLOG.md`.

## What this night is not evidence for

- Review sentiment is from summaries and samples, not a count of every review.
- No study cited was run on Urdu learners except the script-reading ones, and
  those are on Arabic, a close cousin but not the same script style.
- Nothing here measures Qaaf's own learners; there are none yet.
