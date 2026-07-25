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
| **Reading** | **17 graded passages** with comprehension questions, from five-line beginner scenes to character sketches |
| **Course** | **35 units · 221 lessons** across four CEFR-style stages (A1 → B2) |
| **Exercises** | 11 types: letter-position ID, letter pick, picture→word, word→meaning, listen-&-tap, word build, matching board, grammar teach, grammar drill, sentence build, reading |

### Learning design
- **Spaced repetition (SM-2)** — items you miss come back first.
- **Gamification** — XP and levels, day streaks with freeze protection, hearts
  with timed regeneration, gems, weekly leagues, tiered achievements, daily goals.
- **Calm by design** — the palette ("plum & saffron") follows learning
  colour-psychology: a deep aubergine focus base, saffron reward accent used
  sparingly, pistachio for correct, and a muted rose madder — never alarm-red —
  for misses. Feedback sounds are soft pentatonic tones.
- **Jump ahead** — any lesson is tappable; locked ones stay marked.

## Design language
Heritage-geometric: every illustration sits inside an **8-point Islamic star
medallion** in saffron on deep plum, echoing the lattice motif used throughout.
The palette is defined once in `src/theme/colors.ts` and mirrored in
`tailwind.config.js`; every foreground/background pair clears WCAG AA.
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
