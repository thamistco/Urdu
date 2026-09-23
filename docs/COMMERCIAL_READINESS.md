# Before Harf charges money

Everything that has to be true, legally, before the app is sold, subscribed to
or shows ads. Each item says what was found, what was done, and what is still
open. **This is not legal advice.** It is an engineering record of what the
code and content actually contain, so that a lawyer's review starts from facts
instead of from a search.

Last reviewed 2026-09-23.

---

## 1. The textbook the course was planned from: open

**What it is.** _Basic Urdu_ by Rajiv Ranjan (Michigan State University
Libraries, 2022), <https://openbooks.lib.msu.edu/urdu/>. Licensed **CC BY-NC
4.0**, NonCommercial. The repository called it CC BY from 2026-07-24 until
2026-09-23, which was wrong, and the in-app attribution it promised did not
exist until 2026-09-23.

**What NonCommercial covers.** Copyright, and so the licence, covers the
book's _expression_: its sentences, dialogues, readings, exercises and
explanations, and arguably a creative selection and arrangement. It does not
cover facts (Urdu words and what they mean, grammar rules, the alphabet) or
ideas (teach the letters in groups, start with greetings, a chapter on family).

**What was taken, as far as the history shows.** One commit says it drew on
the book: `41d4faf` (2026-07-24, ~180 words, 28 phrases, 14 units), "structure
informed by … Basic Urdu; wording original". Checked since:

- **Letter order: not from the book.** The app teaches the standard alphabet
  order (alif, be, pe, te … ye) in eight shape groups. The book starts with
  alif and the non-connectors.
- **Unit structure: not from the book.** 41 units against its 8 chapters.
- **The 28 phrases:** stock phrasebook lines (hello, thank you, how much is
  this). Not protectable expression.
- **Readings and conversations: unresolved.** The scenes parallel the book's:
  "My family" (book 3.2, میرا خاندان), "My house" (4.2, عمران کا گھر), "At the
  fruit stall" (5.2, پھل اور سبزی کی دکان پر), "Asking the way" (6.3, راستہ
  بتانا), "A letter to a friend" (8.3, خط لکھنا), and a phone call to Imran,
  the book's recurring character. A scene is an idea; the wording is what
  matters, and it has not been compared.
- **256 sentences and the grammar notes: not compared.** Four distinctive
  lines were searched and matched nothing online. That is a sample, not a
  comparison.

**Why it is unresolved.** The book cannot be fetched from the build sandbox:
the network policy blocks `openbooks.lib.msu.edu`, `open.umn.edu` and the
mirrors. Allowing `openbooks.lib.msu.edu` would let every sentence, reading,
dialogue and grammar example in the app be diffed against the whole book,
which turns "not compared" above into a number.

**Ways to close it, cheapest first.**

1. **Ask the author.** A commercial permission for an app that credits him
   costs him nothing and is often granted. Draft below.
2. **Rewrite the parallel scenes from scratch** (new situations, new names, no
   Imran), then diff against the book to prove nothing else overlaps. Every
   changed Urdu line needs new audio in both voices, which needs a Google
   Cloud TTS key. The previous key was exposed in chat and has to be replaced;
   put the new one in the environment's secrets, never in a message.
3. Both, which is the belt-and-braces answer.

Until one of these is done, keep the Credits attribution exactly as it is.

**Draft request** (his contact is on the MSU directory,
<https://lilac.msu.edu/rajiv-ranjan/>):

> Subject: Permission request: Basic Urdu in a paid Urdu-learning app
>
> Dear Dr Ranjan,
>
> I'm building Harf, an app that teaches Urdu script and language. In planning
> its early lessons we consulted your open textbook _Basic Urdu_, and the app
> credits you and the book, with its CC BY-NC 4.0 licence, on its Credits
> screen.
>
> We plan to offer Harf as a paid app. Because the book is licensed for
> non-commercial use, I'd like to ask your permission to continue using any
> material in Harf that is adapted from it in a commercial release, with the
> same attribution. I'm happy to share exactly what the app contains, and to
> change or remove anything you would prefer it didn't.
>
> Thank you for making the book openly available.

---

## 2. Open-source software and fonts: done

Every package in the shipped bundle (82 MIT, 5 BSD) and every typeface (3,
OFL 1.1) is listed with its full notice at Settings → Credits → Open-source
licences. Generated from the bundle; `check:licences` fails the deploy if it
drifts. Nothing copyleft ships.

**Open for native builds.** The list covers the web bundle. An iOS or Android
build also ships native code (React Native, Hermes, Expo modules' native
side). Regenerate the list against the native build when it exists.

## 3. Voice: done

All 5,857 clips are Google Cloud Text-to-Speech voices (Chirp 3 HD, one
WaveNet), checked against `assets/voice*/spoken.json`. Google's service terms
let the customer use generated audio commercially. No ElevenLabs audio ships.

## 4. The evening sky picture: open, small

AI-generated, per the owner. Credited as such. **Confirm the generator and
that its terms allowed commercial use on the plan used**; some free tiers did
not. An image made wholly by AI generally has no copyright in the US, so it
can be used but not protected.

## 5. Drawn art and sounds: done

`src/art/` and the tab icons are hand-authored SVG paths, not an icon library.
Feedback sounds are synthesised by `scripts/generate-sounds.js`.

## 6. Pages and copy that change on the day Harf charges: open

These are true today and become false the day the price changes, so they are
changed then, not before:

- **Terms of Service** says "It is free, has no advertisements". Add purchase,
  subscription, auto-renewal and refund terms (refunds go through Apple and
  Google). Auto-renewal disclosures are required by both stores and by some
  jurisdictions' consumer law.
- **Privacy Policy**: add that payments are processed by Apple / Google and
  Harf never sees card details, plus whatever a receipt-validation backend
  stores.
- **Store listing** (`docs/store-listing.md`) ends "Free. No advertisements."
- **`{{SUPPORT_EMAIL}}`** in Privacy and Terms still needs a real address.
  Both stores require working support contact.
- Have a lawyer read Privacy and Terms. They were written from the code, not
  from legal templates, and have not been reviewed.

## 7. The name: open

"Harf" (حرف, "letter") has one known app collision, a Turkish word game. No
trademark search has been done. Run one in the countries you will sell in
(UKIPO, USPTO, EUIPO) before spending on the brand. A common word used
descriptively for a letters app may be hard to register.

## 8. Things checked and found fine

- No poet's verse is quoted anywhere. Faiz, for example, died in 1984 and is
  still in copyright in most countries; Ghalib and Iqbal are not.
- No competitor name or trademark appears in anything a learner or store
  reader sees. Duolingo, Drops and Memrise appear only in code comments and
  internal reasoning.
- The league's cohort says on screen that it is not real people
  (`check:controls` holds this), which matters more once people pay.
