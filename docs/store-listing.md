# Store listing

Ready-to-paste copy for the App Store and Google Play, plus the reasoning behind
it. Every number here is counted from the data by `npm run audit`, not estimated
— if the content changes, these change with it.

---

## The name stays: Harf

**حرف means "letter".** The app's whole thesis is that Urdu is written in
Nastaliq, that every letter changes shape depending on where it sits in a word,
and that most courses skip this and leave people unable to read. A name that
means "letter" is not decoration; it is the product. The icon is the letter ح.

Checked for collisions: the only app of that name is *Harf Avcısı*, a Turkish
word puzzle — different language, different category, different market. Low risk.

**The problem was never the brand.** It was that nothing anywhere — not the app
name, not a description, because there wasn't one — contained the word "Urdu".
Nobody searches for "Harf". Tens of thousands of people a month search for
"learn Urdu". That is a *title* problem, and the fix is the format every large
app already uses: brand, then what it does. Duolingo's real App Store title is
"Duolingo - Language Lessons", not "Duolingo".

---

## Fields

Apple indexes name + subtitle + keywords — 160 characters in total, and they
carry far more ranking weight than the description. Google Play indexes title +
short description + full description. So the tight fields do the work, and the
long description is for the human who has already arrived.

### App Store

| Field | Limit | Copy |
| --- | --- | --- |
| Name | 30 | `Harf: Learn Urdu` |
| Subtitle | 30 | `Every letter, in every form` |
| Keywords | 100 | `urdu,nastaliq,alphabet,script,read,write,pakistani,hindi,vocabulary,flashcards,tracing,phrases` |
| Promotional text | 170 | `Urdu letters change shape depending on where they sit in a word. Harf teaches all four forms of all forty letters — then 2,281 words, spoken aloud.` |

The subtitle deliberately repeats nothing from the name. "Urdu" is in the name,
so the subtitle spends its thirty characters on the thing that makes this app
different from every other one in the category.

### Google Play

| Field | Limit | Copy |
| --- | --- | --- |
| Title | 30 | `Harf: Learn Urdu & Script` |
| Short description | 80 | `Read Urdu the way it is really written — every letter, in every joining form.` |

Play has no subtitle, so its title carries one keyword more than Apple's.

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
> each one recorded in a single consistent voice. 2,893 clips are bundled with
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

| Claim | Source |
| --- | --- |
| 40 letters × 4 forms = 160 shapes | `LETTERS`, `POSITIONS` |
| 2,281 words, 122 topics | `WORDS`, `TOPICS` |
| 256 sentences, 17 passages, 12 dialogues | `SENTENCES`, `PASSAGES`, `DIALOGUES` |
| 25 grammar concepts | `GRAMMAR` |
| 237 lessons, 39 units | `ALL_LESSONS`, `UNITS` |
| 2,893 recorded clips, one voice, offline | `assets/voice/`, `npm run check:voice` |
| Two voices in dialogues | `Dialogue.voices`, `scripts/generate-voice.js` |
| Spaced repetition | `src/lib/srs.ts`, `npm run check:srs` |
| Roman track | `unitsForTrack`, `npm run check:answerable` |
| Free, no ads, no account | no billing or ad dependency in the project |

## Not claimed

Worth being explicit about, because the temptation in store copy is to imply it:

- **No speech recognition.** The app plays Urdu and asks you to type or choose;
  it never listens to you or scores your accent.
- **No live tutors, no community.** It is a solo course.
- **No certification.** The A1–B2 labels describe the difficulty of the content,
  not an accredited assessment.
