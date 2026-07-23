# Harf · حرف

**A calm, gamified Android app for learning to read Urdu — taught by letter _position_, not an alphabet poster.**

Harf grew out of a single React prototype into a full Expo / React Native app,
drawing the best mechanics from Duolingo, Busuu, Drops, Memrise and Babbel while
keeping a distinct, unhurried personality: deep-indigo nights, warm parchment,
and one gold geometric star as its only flourish.

> Core thesis: every Urdu letter has **four faces** — alone, at the start, in the
> middle, at the end. Most apps teach one. Harf teaches all four.

---

## What makes it work (the addictive-but-calm loop)

| Pillar | How it's built |
| --- | --- |
| **Gamified** | XP + levels (named tiers), day streaks with freeze protection, hearts/lives with timed regen, gems, weekly leagues with promotion/demotion, tiered achievements, daily goals. |
| **Calm** | Color-psychology palette (indigo focus base, gold reward accent used sparingly, jade for correct, muted rose — never alarm-red — for misses). Gentle "rise-in" motion, reduced-motion support. |
| **Addictive (kindly)** | Short 5-minute sessions (Drops), immediate multi-sensory feedback, visible progress everywhere, "come back tomorrow — the words you missed return first." |
| **Multi-sensory feedback** | Synthesised sounds per the research brief: a rising C-major arpeggio for correct, a soft falling two-note for misses (neutral, not scolding), plus level-up & streak cues — paired with subtle haptics. |
| **Real learning** | The full Urdu letter set in all four position forms, ~60 themed vocabulary words, phrases, and an SM-2 spaced-repetition engine so review is real, not decorative. |

## Feature tour

- **Onboarding** — goal → track (script / Roman / both) → placement check → daily goal, setting your true starting level.
- **Learn** — a Duolingo-style unlockable path of 6 units / 25 lessons.
- **Lesson player** — 7 exercise types: letter-position ID, letter pick, picture→word, word→meaning, listen-&-tap (device TTS), scrambled **word build**, and a Drops-style **matching board**. Hearts, live progress, and a warm completion summary with confetti.
- **Letter Lab** — the signature screen: browse every letter, flip through its four forms on the "paper", hear it, and read a hand-written note on how it behaves.
- **Practice** — daily SRS review + per-topic drills + a memory-strength meter.
- **Profile** — level ring, stat grid, a 7-day XP chart, league, achievements, settings.
- **League & Achievements** — weekly standings with promotion/demotion zones; six tiered badges.

## Tech & architecture

- **Expo SDK 52**, React Native 0.76, TypeScript (strict), **NativeWind** (Tailwind for RN).
- **Zustand + AsyncStorage** for persisted state (progress + settings).
- **react-native-reanimated** for motion, **react-native-svg** for the lattice motif, **expo-av / expo-haptics / expo-speech** for feedback.

```
src/
  theme/        color system + tokens (grounded in the color-psychology research)
  data/         letters (4 forms) · words (themed) · units (the path) · achievements
  lib/          srs (SM-2) · gamification (xp/levels/leagues) · sound · haptics · feedback · speech · date
  store/        useProgressStore · useSettingsStore  (persisted)
  components/   Screen · Button · Card · ProgressBar · Confetti · Reveal · Stats · Text · TopBar · LatticeBackground
  exercises/    types · generator · 7 exercise views + renderer
  screens/      onboarding · Home(path) · Lesson · LessonComplete · LetterLab · Practice · Profile · Leaderboard · Achievements · Settings
  navigation/   RootNavigator (stack) + MainTabs (Learn / Practice / Profile)
scripts/        generate-sounds.js (synthesises the WAV feedback) · generate-icons.js (app icon/splash)
```

The feedback sounds and app icons are **generated from code** (no binary black boxes)
so they're reproducible and easy to tweak:

```bash
npm run gen:sounds      # regenerate assets/sounds/*.wav
node scripts/generate-icons.js
```

## Running it

```bash
npm install
npx expo start          # then press 'a' for Android, or scan the QR in Expo Go
```

### Building an installable Android APK/AAB (EAS)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # APK you can sideload
```

A `preview` profile that outputs an APK:

```json
// eas.json
{
  "build": {
    "preview": { "android": { "buildType": "apk" } },
    "production": {}
  }
}
```

### Verification done in this repo

- `npx tsc --noEmit` — passes (strict).
- `npx expo export --platform android` — bundles cleanly to Hermes bytecode.

## Design credits / research

Grounded in the shared research on mobile UI principles, color psychology for
learning, the retention mechanics of the leading language apps, and UI
sound-feedback theory (rising major-key rewards, soft neutral miss tones). See
the palette rationale in `src/theme/colors.ts` and the sound spec in
`scripts/generate-sounds.js`.
