# Store listing

Ready-to-paste copy for the App Store and Google Play, plus the reasoning behind
it. Every number here is counted from the data by `npm run audit`, not estimated
— if the content changes, these change with it.

---

## The name: Harf on the phone, `Harf: Learn Urdu` in the stores

**حرف means "letter".** The app's whole thesis is that Urdu is written in
Nastaliq, that every letter changes shape depending on where it sits in a word,
and that most courses skip this and leave people unable to read. A name that
means "letter" is not decoration; it is the product. The icon is the letter ح.

Checked for collisions: the only app of that name is _Harf Avcısı_, a Turkish
word puzzle — different language, different category, different market. Low risk.

**These are two different names, and they should be.** The home-screen label is
set by `expo.name` in `app.json` and stays **Harf**: a launcher truncates at
about twelve characters, and the icon beside it is already the letter ح, so
anything longer is a name nobody finishes reading. The store name is a separate
field in App Store Connect and the Play Console, it is the single strongest
ranking signal either store has, and there **Harf** alone is close to useless —
nobody searches for it, while tens of thousands a month search for "learn Urdu".

So the store name is brand-then-function, the format every large app in the
category uses: Duolingo's real App Store title is "Duolingo - Language Lessons",
not "Duolingo".

**Why "Learn Urdu" and not "Learn to Read Urdu".** The name was the longer
form for one release, on the argument that _read_ is the one claim here that a
phrasebook app cannot copy. That argument was about the differentiator and not
about the product: this is a full course — 2,281 words with audio, 25 grammar
concepts, sentence building, readings and conversations — and a name promising
reading describes the first unit rather than the app. A learner who wants to
speak Urdu reads "Learn to Read Urdu" and correctly concludes it is not for
them, which is the expensive direction to be wrong in.

Reach is unaffected either way, since both stores tokenise and "Learn Urdu" is
the exact phrase people search. So the shorter name costs nothing and stops
turning away the larger half of the audience.

The script stays the differentiator; it just stops being the whole promise. The
subtitle carries it — _From alphabet to conversation_ is the arc of the course,
and the alphabet half of it is the part nobody else teaches properly.

---

## Fields

Apple indexes name + subtitle + keywords — 160 characters in total, and they
carry far more ranking weight than the description. Google Play indexes title +
short description + full description. So the tight fields do the work, and the
long description is for the human who has already arrived.

### App Store

| Field            | Limit | Copy                                                                                                                                                                    |
| ---------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name             | 30    | `Harf: Learn Urdu`                                                                                                                                                      |
| Subtitle         | 30    | `From alphabet to conversation`                                                                                                                                         |
| Keywords         | 100   | `urdu,nastaliq,alphabet,script,read,write,pakistani,hindi,vocabulary,flashcards,tracing,phrases`                                                                        |
| Promotional text | 170   | `A full Urdu course, not a phrasebook: the alphabet in all four of its joining forms, 2,281 words spoken aloud, 25 grammar ideas and 256 sentences you build yourself.` |

The subtitle deliberately repeats nothing from the name. "Urdu" is in the name,
so the subtitle spends its thirty characters on the shape of the course — where
it starts and where it gets you — which is also where the differentiator lives.

### Google Play

| Field             | Limit | Copy                                                                              |
| ----------------- | ----- | --------------------------------------------------------------------------------- |
| Title             | 30    | `Harf: Learn Urdu`                                                                |
| Short description | 80    | `The whole language: 40 letters, 2,281 spoken words, grammar and real sentences.` |

Play has no subtitle, so the short description carries the breadth that Apple's
subtitle carries. The title is identical on both stores on purpose: it is the
name people will say out loud and search for again, and two spellings of it is a
brand paying twice for one word.

---

## Full description

> Urdu is written in Nastaliq, and its letters change shape depending on where
> they sit in a word. ب at the start of a word looks nothing like ب at the end.
> Most courses teach you the isolated forms, hand you a transliteration, and
> leave you unable to read a shop sign.
>
> Harf teaches the script the way it is actually written.
>
> **The alphabet, properly.** All forty letters, each in all four positional
> forms — 160 shapes in total — with tracing practice that checks whether you
> actually drew the letter rather than just filled the space.
>
> **2,281 words across 122 topics**, from family and food to law and medicine,
> each one recorded in a single consistent voice. 2,748 clips are bundled with
> the app, so pronunciation works offline and sounds the same on every phone.
>
> **Sentences you build yourself.** 256 sentences, assembled word by word,
> right to left, so Urdu's word order becomes something you feel rather than a
> rule you memorise. Plus 17 reading passages and 12 conversations, each read by
> two different voices so you can follow who is speaking.
>
> **25 grammar ideas, one at a time.** Pronouns, gender, the oblique case, the
> mujhe construction, causatives — explained in plain English, then drilled.
>
> **It remembers what you are about to forget.** Every answer feeds a spaced
> repetition schedule. Words you got wrong come back within minutes; words you
> know are held back for weeks.
>
> **Not learning the script?** Choose the Roman track at the start and the whole
> course — every word, sentence, and conversation — is taught in transliteration
> instead. Change your mind whenever you like.
>
> 237 lessons across 39 units, from the first letter to holding an opinion.
>
> Free. No advertisements. No account needed — your progress is saved on your
> device, and signing in is only there if you want it on more than one.

---

## Claims and where they come from

Nothing above is rounded up. `npm run audit` prints these counts; if a number
here stops matching, the listing is out of date rather than the audit being
wrong.

| Claim                                    | Source                                         |
| ---------------------------------------- | ---------------------------------------------- |
| 40 letters × 4 forms = 160 shapes        | `LETTERS`, `POSITIONS`                         |
| 2,281 words, 122 topics                  | `WORDS`, `TOPICS`                              |
| 256 sentences, 17 passages, 12 dialogues | `SENTENCES`, `PASSAGES`, `DIALOGUES`           |
| 25 grammar concepts                      | `GRAMMAR`                                      |
| 237 lessons, 39 units                    | `ALL_LESSONS`, `UNITS`                         |
| 2,748 recorded clips, one voice, offline | `assets/voice/`, `npm run check:voice`         |
| Two voices in dialogues                  | `Dialogue.voices`, `scripts/generate-voice.js` |
| Spaced repetition                        | `src/lib/srs.ts`, `npm run check:srs`          |
| Roman track                              | `unitsForTrack`, `npm run check:answerable`    |
| Free, no ads, no account                 | no billing or ad dependency in the project     |

## Not claimed

Worth being explicit about, because the temptation in store copy is to imply it:

- **No speech recognition.** The app plays Urdu and asks you to type or choose;
  it never listens to you or scores your accent.
- **No live tutors, no community.** It is a solo course.
- **No certification.** The A1–B2 labels describe the difficulty of the content,
  not an accredited assessment.
