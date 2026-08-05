# Content & curriculum references

Sources to align Harf's letters, joining forms, and vocabulary against as the
content expands.

## Licensing rule (read first)
Build content from the **CC-BY source** (with attribution, see `CREDITS.md`) or
write it **originally**. Copyrighted books listed here are for background only:
use **uncopyrightable facts** (alphabet, word meanings, grammar rules) — never
their specific **expression** (sentences, dialogues, exercises, or the
selection/arrangement of a word list). This is not legal advice; for a
commercial release, get a proper IP review.

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

## Reference: script-teaching method (govt. publication — facts only)
- **"Let's Learn Urdu: Beginner's Manual for Urdu Script"** by **Gopi Chand
  Narang** — National Council for Promotion of Urdu Language (NCPUL), Ministry
  of HRD, Govt of India. (The URL was blocked earlier; reviewed directly from an
  uploaded scanned copy — no extractable text, images only.)
  - License status unclear (a govt. publication, no explicit open license
    found) — treat like the copyrighted sources: **facts/method only**, never
    reproduce its images, drill sentences, or exercises.
  - Confirms the pedagogy already used in `letters.ts`: **non-connectors and
    simple shapes first**, harder connectors and concepts introduced later,
    graded "gradually and systematically" rather than the traditional
    alphabet-poster order — validates our Group 1–8 approach.
  - Its reading drills recombine only the letters taught so far into short
    connected sentences, repeated for fluency, with the sentence pool growing
    as more letters are learned. Worth adopting as a **pattern** (short graded
    reading passages using only already-taught letters) for a future "reading
    fluency" exercise type — written with our own original sentences.

## Reference: functional syllabus (copyrighted — background only)
- **"Complete Urdu"** by **David Matthews & Mohamed Kasim Dalvi** (Teach
  Yourself / Hodder).
  - ⚠️ **Copyrighted commercial book.** Do **not** copy its text, dialogues,
    exercises, or the selection/arrangement of its content. Only uncopyrightable
    *facts* (grammar rules, word meanings) inform us — written originally.
  - Useful as a **functional ("can-do") progression** and a **grammar spine**:
    - Units: (1) greetings, directions, personal details/phone numbers;
      (2) introductions, polite/respectful forms, family, children;
      (3) invitations, needs/likes/dislikes, taxis, ordering a meal;
      (4) possession, relationships, origins, age, geography of Pakistan;
      (5) work & daily routine, telling the time, days of the week;
      (6) leisure, customs, schooling, who/whose, weather, months & dates;
      (7) reservations; (8) at a restaurant / the bill; (9) family & home;
      (10) hotels & staying somewhere; (11) showing your village/town;
      (12) travel ("off to Delhi"); (13) packing / completed trips.
    - Grammar order (full spine): gender & number → **oblique case** (nouns,
      plurals, feminine, pronouns, possessive adjectives) → postpositions
      (incl. `tak`, `se pahle`, compound) → **present habitual** →
      **imperative** (incl. negative commands, "if") → **present continuous** →
      **future** → **past of "to be" (tha)** → **subjunctive** (+ conditional
      "if", negative with `na`) → **past habitual / past continuous** →
      **simple past** (intransitive) → **perfect & pluperfect**.
  - TODO: sequence a future **phrases + grammar track** along this order,
    written originally.
  - Note: also not fetchable from the build sandbox (403).

## How our content is structured today
- `src/data/letters.ts` — the 40 letters, each with all four position forms and
  a teaching note (grouped by `group` for the path).
- `src/data/vocab/*.ts` — themed vocabulary in modules, each exporting
  `TopicPack[]` built by the `pack()` helper in `vocab/types.ts`.
  `src/data/words.ts` merges these with the core sets into `TOPICS` / `WORDS`:
  **2,281 words across 122 topics.**
- `src/data/grammar.ts` — **25 concepts**, each with an explanation, an optional
  paradigm table, examples and fill-the-gap drills.
- `src/data/sentences.ts` — **256 sentences** for word-order building (many
  tagged with the `concept` they illustrate, so grammar lessons can reinforce
  them) and **17 graded reading passages** with comprehension questions.
- `src/data/units.ts` — the path: **39 units / 237 lessons**, interleaving
  script, vocabulary, grammar, sentence building and reading. Every topic,
  concept and passage is reachable from it.

### Adding content
A new topic is one `pack(...)` call in a `vocab/` module plus one `V('id', …)`
line in `units.ts`. A new grammar point is one entry in `GRAMMAR` plus a `G(…)`
line. Nothing else needs touching — the exercise generator builds the questions.

Two invariants worth preserving:
- **Every topic, grammar concept and passage must appear in `units.ts`.**
  Content that isn't on the path is invisible outside the Practice tab.
- **Picture-based questions need visually distinct options.** The generator
  enforces this (`cueOf` / `distractorsFor` in `exercises/generator.ts`), because
  at this scale many words legitimately share an emoji.

When we incorporate the NCPUL progression, keep the four-forms-per-letter thesis
central and prefer its introduction order for absolute beginners.
