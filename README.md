# Harf · حرف

**A calm, gamified app for learning Urdu — from the alphabet to expressing ideas.**

Harf teaches Urdu the way it is actually written and spoken: every letter in all
four of its position forms, vocabulary in themed sets, grammar explained plainly
and then drilled, and short graded readings. A four-stage course
(Beginner → Elementary → Intermediate → Advanced) with spaced repetition
underneath.

> Core thesis: every Urdu letter has **four faces** — alone, at the start, in the
> middle, at the end. Most apps teach one. Harf teaches all four.

---

## What's in it

| | |
| --- | --- |
| **Vocabulary** | **2,028 words** across **122 themed topics**, each with script, Roman transliteration, meaning and a picture cue |
| **Script** | All **40 letters** with every position form, connector vs. non-connector behaviour, and a teaching note apiece |
| **Grammar** | **25 concepts** — pronouns, "to be", gender, plurals, possession, postpositions, oblique case, negation, questions, conjunctions, the four tenses, dative subjects, ability, obligation, comparatives, imperative, subjunctive, perfective, relative clauses, compound verbs, the passive and causatives — each with explanation, paradigm table, examples and drills |
| **Sentences** | **140** word-order builders + 28 everyday phrases |
| **Reading** | **17 graded passages** and **12 two-speaker conversations**, all with comprehension questions |
| **Course** | **35 units · 233 lessons** across four CEFR-style stages (A1 → B2) |
| **Exercises** | 15 types: letter-position ID, letter pick, **letter tracing**, picture→word, word→meaning, **meaning→word**, **typing from memory**, listen-&-tap, word build, matching board, grammar teach, grammar drill, sentence build, reading, conversation |

### Learning design
- **Difficulty climbs within a lesson** — meet a word with a picture, come back
  to it from the English, type it from memory, build it letter by letter. Every
  word is seen at least twice and the second sighting always asks for more.
  Review leans on the harder demands, since an item is only in review because
  it was met before.
- **Nothing is solvable by elimination** — the build exercises include decoy
  tiles, and picture options are checked for distinct art *and* distinct
  meanings.
- **Tracing is really scored** — each glyph ships with a bitmask of where its
  ink is (`npm run gen:masks`), so coverage and precision are measured, not
  estimated. A scribble covers 100% and is still rejected. The same pad is in
  the Letter Lab, where you can trace any letter in any of its four forms
  without a lesson or a heart at stake.
- **Spaced repetition (SM-2)** — items you miss come back first.
- **Gamification** — XP and levels, day streaks with freeze protection, hearts
  with timed regeneration, gems, weekly leagues, tiered achievements, daily goals.
- **Comic register** — flat saturated fills, black keylines and a halftone
  screen on a near-black ground, with newsprint cream as the reading surface.
  Yellow is reserved for reward and primary actions so it keeps its meaning;
  green and red carry correct and incorrect. Feedback sounds stay soft
  pentatonic tones — the colour is loud, the audio isn't. Correct rises
  (C5→G5), incorrect falls a whole step low down and plays 4.5 dB quieter, so
  a miss is acknowledged rather than announced.
- **Jump ahead** — any lesson is tappable; locked ones stay marked.

## Design language
Every illustration sits inside an **8-point geometric star medallion**, and a
faint halftone dot screen sits behind every screen. The palette is defined once
in `src/theme/colors.ts` and mirrored in `tailwind.config.js`; every
foreground/background pair clears WCAG AA. One rule the palette imposes:
lettering on a bright fill is ink, not white — white on comic green is 2.4:1.
Typography pairs **Noto Nastaliq Urdu** for the script with Fraunces (display)
and Public Sans (body).

UI follows Apple HIG and common UI-craft guidance: ≥44pt touch targets, one
clear hierarchy per screen, consistent 8pt spacing, no pure black, restrained
type scale, and accessibility labels on interactive elements.

## Tech

Expo SDK 52 · React Native 0.76 · TypeScript (strict) · NativeWind ·
Zustand + AsyncStorage · Reanimated · react-native-svg · Supabase (optional auth).

```
src/
  data/        letters · words + vocab/ modules · grammar · sentences · units · achievements
  lib/         srs (SM-2) · gamification · sound · haptics · speech · sync · supabase
  store/       progress · settings · auth   (persisted)
  components/  Screen · Button · Card · ProgressBar · Illustration · Text · …
  art/         the illustration set (SVG)
  exercises/   11 exercise types + generator
  screens/     onboarding · Home(path) · Lesson · LetterLab · Practice · Profile · …
scripts/       generate-sounds.js · generate-icons.js · generate-voice.js
```

## Running it

```bash
npm install
npm run web        # browser
npx expo start     # then 'a' for Android, or scan the QR in Expo Go
```

Live preview (auto-deploys on push): **https://thamistco.github.io/Urdu/**

### Android APK
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview
```

## Optional integrations
- **Sign-in & cloud save** — see [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md). Runs
  in guest mode (local progress) until configured.
- **One consistent pronunciation voice** — see [`VOICE_SETUP.md`](VOICE_SETUP.md).
  Falls back to the device's text-to-speech until generated.

## Content provenance
Course *structure* is informed by published Urdu curricula (see
[`docs/CONTENT_NOTES.md`](docs/CONTENT_NOTES.md)); all vocabulary, sentences,
explanations and exercises are **written originally** for Harf. Adapted material
from the CC-BY source is credited in [`CREDITS.md`](CREDITS.md).

## Verification
`npx tsc --noEmit` passes (strict) · `npx expo export --platform web` builds
clean · automated Playwright walkthrough of every screen reports no runtime errors.
