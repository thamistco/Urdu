# Credits & attributions

## Learning content

All course content — letters, words, sentences, readings, dialogues and
grammar notes — is written originally for Qaaf.

Early planning (2026) referenced *Basic Urdu* by Rajiv Ranjan (Michigan State
University Libraries, CC BY-NC 4.0) while sketching the course, and the
repository credited it as an adapted source. On 2026-10-01 every trace of
that adaptation was replaced: the six scenes whose situations paralleled the
book's (r-1, r-5, r-4, d-4, d-5, d-6) were rewritten with new scenarios, the
two stock phrases shared with the book were reworded, and the structure was
confirmed independently developed (41 app units vs the book's 8 chapters, a
different letter-introduction order, original wording throughout — verified
by the repository-wide provenance audits). No adapted expression from
*Basic Urdu* remains, so no BY-NC attribution is owed and the in-app credit
was removed. The full history is in
[`docs/COMMERCIAL_READINESS.md`](docs/COMMERCIAL_READINESS.md).

## Fonts (SIL Open Font License)

- **Noto Nastaliq Urdu** — Google / SIL OFL
- **Fraunces** — SIL OFL
- **Public Sans** — SIL OFL

## Sounds & illustrations

Feedback sounds (`scripts/generate-sounds.js`), the illustration set
(`src/art/`) and the evening sky behind sign-in and the welcome screen
(`assets/images/evening.jpg`, `assets/images/evening-dusk.jpg`) are original
to Qaaf.

## Voice

Word, sentence and conversation audio is synthesised with Google Cloud
Text-to-Speech (`scripts/generate-voice.js`, see `VOICE_SETUP.md`).

## Open-source software and fonts

Every npm package in the shipped bundle and every typeface, with its
copyright notice and full licence text, is listed in the app at **Settings →
Credits → Open-source licences** (`/licences`). The list is generated from the
built bundle by `scripts/generate-licences.js`, and `check:licences` fails the
deploy when it is out of date. At the time of writing: 82 MIT, 5 BSD, and 3 OFL
typefaces. Nothing copyleft ships.
