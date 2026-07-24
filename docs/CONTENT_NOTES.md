# Content & curriculum references

Sources to align Harf's letters, joining forms, and vocabulary against as the
content expands.

## Primary reference
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
