# 2026-10-29 · Content moderation: last night's corrections, and Unit 6

Reviewed by `qaaf-content` (28 tool calls, about 4 minutes, read-only). It is not a native speaker. No dictionary site could be reached:

- rekhta.org did not resolve;
- Platts at dsal.uchicago.edu was refused by the proxy.

Each finding names its source.

## Findings and what was done

1. **Hamza's middle form was drawn in the wrong shape** (source: Unicode joining type, from memory; the repo's own other letters).
   - It was stored as a bare ئ, so the card, the question and the trace pad drew the full standalone shape.
   - Mid-word, as in چائے and کئی, it joins on both sides.
   - P-133 asks hamza in the middle, so this came up in half its questions.
   - **Fixed:** ـئـ, like every other joining letter's middle form, with its trace mask rebuilt. Only hamza's mask was regenerated.
2. **"Festivals of every faith" was not true of the course** (source: the repo).
   - The culture faith words are Muslim ones only; nothing covers Diwali, Holi, Christmas, Vaisakhi or gurdwara.
   - The heritage goal still showed a mosque.
   - **Fixed:**
     - the heritage goal is a feather;
     - the code comment says only what is true;
     - روزہ is glossed "a fast (not eating)" rather than "fast (Ramadan)", still told apart from تیز "fast".
   - **Not done:** adding دیوالی, ہولی, کرسمس, بیساکھی and گوردوارہ. They are already P-121 and P-126. New words need recordings, and the voice key needs the owner's yes.
3. **Misleading pictures. Fixed:**
   - salary 🧾 → 💵 (it was the receipt picture);
   - teacher and cook were the only men among the jobs → 🧑‍🏫, 🧑‍🍳;
   - baker (naanbaai) 🥖 → 🫓.

   **Not fixed:** eraser still shows a broom. There is no eraser emoji, so it needs a drawn icon (Q-144).

4. **Independence Day shows 🇵🇰. Kept, decided.** The course is Pakistan-centred (Basant, Pakistani Roman spellings), and its other festival choices match.
5. **Needs a native speaker (LAUNCH_BAR H1).** Q-145.
   - Is اسکیل "sikel" or "iskel"?
   - Is the musician "mausiqaar" or "musiqaar"?
   - Confirm "rabaṛ" and "naanbaai".
   - Is "Deep sounds" a fair title for a lesson whose to'e "sounds like te"?
6. **Minor, not changed.** 🎼 stands for four music words. Shared pictures are kept out of picture questions, so no question had two right answers.

## Checked and clean

- Church and temple art.
- The 🪦 cemetery.
- The tu drill.
- askAt for alif madda, nūn ghunna, baṛī ye and hamza.
- Unit 6's four grammar drills each have exactly one right answer.
- The two-meaning words حساب and مالی are never both offered.
- Ten sampled sentences.
- Nothing unsuitable for a child.

## What this is not evidence for

- No dictionary was consulted directly.
- The review lesson's word mix was not checked.
