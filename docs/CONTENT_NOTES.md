# Content & curriculum references

Sources to align Harf's letters, joining forms, and vocabulary against as the
content expands.

## Primary, usable source (CC-BY — we can adapt with attribution)
- **"Basic Urdu"** by **Rajiv Ranjan**, Michigan State University Libraries
  (Pressbooks), licensed **CC-BY**.
  https://openbooks.lib.msu.edu/basicurdu/
  - Theme-based, novice → ACTFL intermediate-low/mid. Readable (provided as a
    local export), so this is the source we build from. **Attribution is
    required** — see `CREDITS.md`.

  **Letter-introduction order (Chapter 1)** — align `letters.ts` groups / the
  path to this authoritative sequence:
  1. **Alif + non-connectors** — alif ا; daal د / re ر groups; wao و
  2. **be ب series, jim ج group, sin س group**
  3. **kaaf ک, gaaf گ, swad ص, zwad ض, fe ف, qaaf ق, toe ط, zoe ظ**
  4. **laam ل, mim م, nun ن, ain ع, ghain غ**
  5. **chhoti ye ی, baRi ye ے, do-chashmi he ھ, chhoti he ہ, hamza ء**

  **Chapter map (themes + grammar) — a ready 8-unit curriculum:**
  1. Urdu & the script
  2. Beginning conversations — greetings, introductions, **numbers 0–10**;
     grammar: gender & number, pronouns + verb "to be"
  3. **خاندان Family** — adjectives, possessive ('s / کا کی کے), wh-questions
  4. **Describing places** — عمران کا گھر / کمرہ / شہر; post-positions, oblique case
  5. **Likes / dislikes / needs / possession** — fruit & veg shop, restaurant;
     past "to be", کو subjects, چاہیے "need"
  6. **Instructions & requests** — recipe, directions; imperatives, verbs
  7. **Past / present / future actions** — routine, hobbies, festivals; tenses
  8. **Past & completed actions** — perfective aspect, کر construction, subjunctive

  **TODO (build-out):** reorder `letters.ts` groups to (1)–(5); grow `words.ts`
  with each chapter's themed vocabulary; add a **phrases/sentences track** and
  simple **grammar exercises** (gender, pronouns+"to be", postpositions) mapped
  to chapters 2–8.

## Reference (curriculum comparison)
- **"Let's Learn Urdu" (English medium)** — National Council for Promotion of
  Urdu Language (NCPUL) / Urdu Council.
  https://www.urducouncil.nic.in/sites/default/files/2024-07/Let%27s%20Learn%20Urdu%20%28English%29.pdf
  - Official government primer — an authoritative source for the **order letters
    are introduced**, how **position/joining forms** are taught, and the
    **beginner vocabulary** set.
  - TODO: align `src/data/letters.ts` group order and `src/data/units.ts` lesson
    sequence with this book's progression; cross-check example words and add its
    vocabulary to `src/data/words.ts`.
  - Note: the PDF is not fetchable from the build sandbox (returns 403). To fold
    it in, either share the key pages/tables directly, or we consult it from an
    environment with open network access.

## Secondary reference
- **"Teach Yourself Urdu"** (Delacy / Ahmed) — a well-structured self-study
  course.
  https://theswissbay.ch/pdf/Books/Linguistics/Mega%20linguistics%20pack/Indo-European/Indo-Aryan/Urdu,%20Teach%20Yourself.pdf
  - Good for **grammar progression** (pronouns, verb "to be", simple sentences,
    postpositions), **transliteration conventions**, and graded dialogues that
    could seed a future "phrases / conversation" track.
  - TODO: use its unit order to design a grammar/sentence track beyond
    single-word vocabulary; borrow its dialogue scenarios for phrase lessons.
  - Note: also not fetchable from the build sandbox (403).

## How our content is structured today
- `src/data/letters.ts` — the letter set, each with all four position forms and
  a teaching note (grouped by `group` for the path).
- `src/data/words.ts` — themed vocabulary + short phrases.
- `src/data/units.ts` — the unit/lesson path built from the above.

When we incorporate the NCPUL progression, keep the four-forms-per-letter thesis
central and prefer its introduction order for absolute beginners.
