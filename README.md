# Harf · حرف

**Learn to read Urdu the way it is really written.**

حرف means "letter", which is the whole idea. Urdu is written in Nastaliq, and
every letter changes shape depending on where it sits in a word — ب at the start
of a word looks nothing like ب at the end. Most courses teach the isolated forms,
hand you a transliteration, and leave you unable to read a shop sign.

Harf teaches all forty letters in all four of their joining forms, then 2,246
words spoken aloud, 256 sentences you assemble right-to-left yourself, 25 grammar
ideas one at a time, and 17 readings. A four-stage course (Beginner →
Elementary → Intermediate → Advanced) with spaced repetition underneath, so what
you are about to forget comes back first.

Not learning the script? Pick the Roman track at the start and the entire course
is taught in transliteration instead.

Free, no advertisements, no account required. Store copy and the reasoning behind
the name live in [docs/store-listing.md](docs/store-listing.md).

> Core thesis: every Urdu letter has **four faces** — alone, at the start, in the
> middle, at the end. Most apps teach one. Harf teaches all four.

---

## What's in it

| | |
| --- | --- |
| **Vocabulary** | **2,246 words** across **122 themed topics**, each with script, Roman transliteration, meaning and a picture cue |
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
Behind every screen is a **misty forest at dusk** — three ridges carrying tree
lines, fog lying in the valleys between them, layered cloud, and the sun as a
warm bloom behind the weather rather than a disc in the middle of the picture.
It is decoration that has to lose to legibility, so its brightest point is held
to 6:1 against the body text and measured, not estimated (`npm run
check:scenery`) — the stacked cloud layers were at 4.47:1, under WCAG AA, while
the comment above them claimed 6.

The palette is defined once in `src/theme/colors.ts` and mirrored in
`tailwind.config.js`. That mirror is now enforced (`npm run check:theme`),
because it had silently drifted across two re-themes: NativeWind resolves
`bg-ink-700` against the config, so every `className` colour kept the old look
while every inline `palette.x` moved. Every foreground/background pair clears
WCAG AA. One rule the palette imposes: lettering on a bright fill is ink, not
white — white on comic green is 2.4:1.
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
clean · automated Playwright walkthrough of every screen reports no runtime
errors. Beyond that, each claim this README makes has a script that fails when
it stops being true, and all of them run in CI before anything deploys:

| Check | What it would catch |
| --- | --- |
| `npm run audit` | content wiring: a lesson pointing at a topic that does not exist, a picture that cannot identify its word, two topics sharing a badge |
| `npm run check:answerable` | a generated question that cannot be answered from what it puts on screen |
| `npm run check:roman` | the typed-answer matcher accepting or refusing the wrong spellings |
| `npm run check:trace` | letter tracing that an honest attempt cannot pass, or a scribble can |
| `npm run check:srs` | spaced repetition not behaving the way the app says it does |
| `npm run check:voice` | a clip the TTS API returned as silence |
| `npm run check:theme` | `tailwind.config.js` drifting from `colors.ts`, colour written as raw hex outside the theme, a palette token nothing uses |
| `npm run check:scenery` | the background getting bright enough to fight the text on it |
| `npm run check:stability` | a question changing under the answer being given to it |
| `npm run check:secrets` | a credential reaching a tracked file |
| `npm run check:deployed` | the live site not actually serving the commit CI just built |
| `npm run lint` / `format:check` | style drift, dead code, and stale React dependency arrays |

All of them, in the deploy's own order and against a deploy-shaped build:

```bash
npm run check:all
```

Conventions this project follows, and why, are in
[CONTRIBUTING.md](CONTRIBUTING.md).
