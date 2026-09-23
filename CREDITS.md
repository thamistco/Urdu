# Credits & attributions

## Learning content
The letter-introduction order, and the themes and grammar sequence of the early
units, are adapted from:

> **Basic Urdu** by **Rajiv Ranjan**, Michigan State University Libraries.
> Copyright © 2022 Rajiv Ranjan. Licensed under **Creative Commons
> Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
> Source: https://openbooks.lib.msu.edu/urdu/

Adaptations (reordering, rewording, exercise design, and app presentation) are
Harf's own. The attribution is shown in the app at **Settings → Credits**
(`src/screens/CreditsScreen.tsx`, also at `/credits`).

**This file said CC BY until 2026-09-23. The book is CC BY-NC.** NonCommercial
means the adapted material may not be used "primarily intended for or directed
towards commercial advantage or monetary compensation". Harf is free with no
advertisements today. Before it charges, sells a subscription or shows ads,
either get written permission from the author or replace what was adapted.

## Fonts (SIL Open Font License)
- **Noto Nastaliq Urdu** — Google / SIL OFL
- **Fraunces** — SIL OFL
- **Public Sans** — SIL OFL

## Sounds & illustrations
Feedback sounds (`scripts/generate-sounds.js`) and the illustration set
(`src/art/`) are original to Harf.

## Voice
Word, sentence and conversation audio is synthesised with Google Cloud
Text-to-Speech (`scripts/generate-voice.js`, see `VOICE_SETUP.md`).

## Pictures
`assets/images/evening.jpg` and `assets/images/evening-dusk.jpg` (the evening
sky behind sign-in and the welcome screen) are **AI-generated**, per the app's
owner on 2026-09-23. The generator was not recorded. Before charging for the
app, confirm that generator's terms allowed commercial use on the plan it was
made with. Some image generators' free tiers did not. In the US, an image made
wholly by AI generally has no copyright, so nobody, including Harf, can stop
others reusing it; it can still be used here.

## Open-source software and fonts
Every npm package in the shipped bundle and every typeface, with its
copyright notice and full licence text, is listed in the app at **Settings →
Credits → Open-source licences** (`/licences`). The list is generated from the
built bundle by `scripts/generate-licences.js`, and `check:licences` fails the
deploy when it is out of date. At the time of writing: 82 MIT, 5 BSD, and 3 OFL
typefaces. Nothing copyleft ships.
