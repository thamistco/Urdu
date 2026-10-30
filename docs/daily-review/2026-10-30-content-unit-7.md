# 2026-10-30 · Content moderation: last night's changes, and Unit 7

Reviewed by `qaaf-content` (35 tool calls, about 6 minutes, read-only).

- It is not a native speaker.
- Platts and Rekhta did not resolve, so Rekhta and HinKhoj are cited from search snippets.

## Findings and what was done

1. **بکری "goat" and بکرا "male goat" made "goat" two right answers.** Fixed: "she-goat" and "he-goat".
2. **Last night's pictures:**
   - Baker 🫓 read as "bread": back to 🥖.
   - Cook 🧑‍🍳 had become shared with the waiter, costing the cook its picture questions: the waiter is now 🤵.
   - The teacher and salary changes stand.
   - روزہ "a fast (not eating)" matches Rekhta.
   - The heritage feather is fine.
3. **Hamza's middle form ـئـ is right.** But the letter's "never joins" contradicted it, in the Letter Lab and on its card (QA too). **Fixed:** the Lab's badge now shows only when no form a letter is asked in joins forward, and the card says hamza looks the same alone and at the start.
   - Its example word چائے does not show the medial form, since ئ follows alif. کئی would, but changing it needs a recording (Q-156).
4. **Unit 7's subtitle left out fe.** Fixed.
5. **نمکین is glossed "savoury snack" and "salty".** Kept: the two entries are different uses, and changing either needs a native speaker (Q-145).
6. **Mid-word nasals:** saanp and chyoonṭi against the course's ooñṭ and daañt. Needs a native speaker (Q-145).
7. **Shared pictures mislead on study cards** (fruit is an apple, soft is flatbread, chutney a chilli): Q-045.
8. **Balance:** no practice word from another faith. P-121 and P-126 wait on the voice key.

## Two right answers, Units 1 to 7

These pairs are not caught by `sensesOf`:

- الوداع / Goodbye (Q-148)
- معاف / معافی
- ضرور / بالکل
- آدمی / شخص / انسان
- چیز / سامان
- کام / نوکری
- روز / روزمرہ
- پورا / تمام
- خوبصورت / پیارا
- آنگن / صحن (آنگن is also listed twice)
- خوش twice
- آواز / شور

**Proposed:** a near-sense table read by both `distractorsFor` and `synonymsOf`, and a check over each review pool, first broken with Q-148. Recorded as **P-145**. The goat pair is fixed tonight in the data, not by the table.

## Needs a native speaker (H1)

- saañp and chyooñṭi.
- چائے's "chai" against "chaa'e".
- شیر "lion" or "tiger".
- روزہ against vrat.
- چٹان against پتھر.

## What this is not evidence for

- No dictionary page was opened.
- Not a native speaker.
