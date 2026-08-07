# Benchmarks

What the curriculum critic holds Harf to, where the numbers came from, and what
Harf currently measures. Measured 2026-08-07 at `7b5a6ba`.

Impressions are not findings here. "Lessons feel short" is unusable; "a lesson
is 1.3 minutes against a 5 minute benchmark" can be acted on and argued with.

## The comparison set

**Drops** caps a study session at five minutes by design, and free accounts are
held to that cap. Its content is roughly a hundred topic lists of about twenty
words each, and a session drills around fifteen of them through several
different micro-games — word construction, image match, and so on — so a word is
met repeatedly inside the session that introduces it.

**Duolingo** runs lessons of five to ten minutes. Units carry explicit learning
objectives, and for intermediate learners units are deliberately broken into
smaller chunks, which is the same instinct as splitting a topic applied at a
coarser grain.

Both land in the same place: **a session is about five minutes**, and length
comes from repetition rather than from volume of new material.

## Where Harf sits

| | Harf | Drops | Duolingo |
| --- | --- | --- | --- |
| session length | **1.3 min** | 5 min, capped | 5 to 10 min |
| new words per lesson | **4.6** | ~15 drilled of a ~20 word list | a handful, heavily repeated |
| sightings per new word | **1.8** | several per session | four to six |
| vocabulary lessons | **493** | ~100 topic lists | units, chunked |
| topic split into | **up to 7 parts** | one list | chunks with objectives |
| whole course | 12.3 hours | — | — |

## The dial that is not the obvious one

The obvious fix for a 1.3 minute lesson is more words, and on its own it is the
wrong one. Neither product gets to five minutes by front-loading vocabulary —
Duolingo introduces only a handful of new words in a ten minute lesson. They get
there by meeting each word four to six times inside the session, in different
shapes.

A Harf word is currently met **1.8** times. So a lesson rebuilt by raising the
word count alone would be longer and teach worse: more new material, still
barely repeated. Both dials move, and `check:shape` holds both.

## Targets, as encoded in `check:shape`

- 3 to 8 minutes per lesson, at 9 seconds per exercise
- at least 3 sightings of each new word inside its own lesson
- at most 3 parts per topic
- 4 to 12 lessons per unit
- every topic carries a category from a declared taxonomy

`check:shape` fails today and is deliberately not in `check:all`. It is the
verify command for the curriculum work, not a gate on shipping. Wire it into the
workflow on the commit that makes it pass, and not before.

## What Harf should not copy

Both comparisons are vocabulary-first apps with shallow grammar, and Harf is not
trying to be one. It teaches an abjad with four joining forms per letter, 25
grammar patterns and 256 sentences the learner assembles. A five minute session
is a benchmark for *session shape*, not an instruction to become a flashcard
app: the tracing, the sentence building and the grammar have no equivalent in
either product and are the reason someone would choose this over them.

The honest use of these numbers is as a floor on attention and a ceiling on
fragmentation, not as a target to converge on.

## Sources

- [Drops on Google Play](https://play.google.com/store/apps/details?id=com.languagedrops.drops.international)
- [Drops app review, FluentU](https://www.fluentu.com/blog/reviews/drops-language-app/)
- [Drops app review, Lingomee](https://lingomee.com/drops-app-review/)
- [Language learning in five minute drops, Eurolinguiste](https://eurolinguiste.com/language-learning-in-5-minute-drops/)
- [Duolingo language learning plan](https://duolingoguides.com/duolingo-language-learning-plan/)
- [How Duolingo teaches English](https://blog.duolingo.com/how-duolingo-teaches-english)
- [New Duolingo home screen design](https://blog.duolingo.com/new-duolingo-home-screen-design)

On the loop's own shape, the actor-critic pattern and severity-scored blocking
review come from the same place a lot of autonomous coding work has landed:

- [Actor critic adversarial coding](https://understandingdata.com/posts/actor-critic-adversarial-coding/)
- [Multi agent critique and revision](https://www.emergentmind.com/topics/multi-agent-critique-and-revision-326a2d61-fb41-400d-a710-1cbf54133f20)
- [Building a multi agent TDD loop](https://ranjithkannan.com/2026/04/10/multi-agent-tdd-loop/)
