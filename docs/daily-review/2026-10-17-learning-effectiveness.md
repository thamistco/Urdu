# 2026-10-17 · Learning effectiveness (area 4)

Reviewed by `qaaf-learning` (27 tool calls, about 14 minutes, read-only),
measuring with scratch vitest files that call the real `buildLessonExercises`
on both tracks with empty progress.

## Findings

1. **Sentence lessons use grammar not yet taught.** Each sentence lesson builds
   10 sentences (Unit 13's builds 6), and opens with a graded meaning pick.
   Against the order grammar is taught in (`src/data/units.ts`):
   - Unit 20: 6 of 10 untaught. s-190, s-187, s-199 and s-74 use نے or the
     simple past (taught in Unit 22); s-67 and s-206 use imperatives (Unit 31).
   - Unit 12: s-114 (گیا), s-149 (میں "in", Unit 15), s-226 (اپنے کمرے میں,
     also the oblique, Unit 17).
   - Unit 33: s-117 (کر دیجیے, a compound verb, Unit 36); s-246 (کاش … ہوتا) is
     tagged g-subjunctive, whose card teaches only the future without گا.
   - Units 4 and 6 use میرا/میری; possessives are taught in Unit 14.
     These join P-062 part 2 (rewrites, which need a native speaker).
2. **Three sentence-lesson subtitles promised what the lesson does not
   teach. Fixed tonight.** Unit 13's "Say what you did and will do" had no
   past or future; Unit 14's "Say where things are" had one place sentence in
   ten; Unit 30's "Speaking politely" is future, ability and obligation. Each
   pool is the same on every visit (measured over six). Now: "What you do,
   and what is happening now", "Whose it is, and everyday facts", "Plans,
   needs and what you can do".
3. **Numerals are tested before they are explained.** numeralRead comes at
   exercise 44 of 47 in Unit 3 and 40 of 43 in Unit 19, on both tracks; the
   digits appear before that only as pictures on word cards. That Urdu digits
   run left to right is said only after a reversal mistake
   (`src/exercises/NumeralRead.tsx:77`), and that miss is graded.
4. **Readings come first, then a question**, with meanings shown after "I've
   read it". Known-word coverage measured a median of 54%, 0 of 29 passages at
   95% or more, but this badly undercounts (grammar words and inflected forms
   do not match the vocabulary list). Not a coverage result.

## Draft teach cards for P-051 (first check)

Examples checked against `src/data/sentences.ts`; none is a lesson's first
question. "Taught" means taught by that lesson.

| Unit | The pattern                                                                      | Example                                                        |
| ---- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 4    | The "be" word comes last and matches the subject (میں…ہوں, تم…ہو, وہ…ہے, ہم…ہیں) | تم بیمار ہو۔ _tum bimaar ho_, "You are ill"                    |
| 6    | Words ending ـا change to ـی for feminine nouns                                  | وہ چھوٹا لڑکا ہے۔ _wo chhoṭa laṛka hai_                        |
| 10   | Review: یہ/وہ + noun + describing word + ہے                                      | یہ کتاب اچھی ہے۔ _ye kitaab achhi hai_                         |
| 12   | The verb comes last; habitual stem+تا/تی/تے, now stem+رہا/رہی/رہے                | وہ چائے پیتی ہے۔ _wo chai peeti hai_ (replace 3 sentences)     |
| 13   | Time words like روز and ہر ہفتے go with the habitual                             | وہ ہر ہفتے خط لکھتا ہے۔ _wo har hafte khat likhta hai_         |
| 14   | کا/کی/کے matches the thing owned                                                 | علی کی بہن ڈاکٹر ہے۔ _Ali ki behen ḍaakṭar hai_                |
| 20   | Words after the noun: سے, تک, کے سامنے                                           | گاڑی گھر کے سامنے ہے۔ (after P-062 part 2 rewrites)            |
| 23   | X Y سے + describing word, "X is more … than Y"; سب سے, "most"                    | چائے کافی سے سستی ہے۔ _chai kaafi se sasti hai_                |
| 30   | سکنا means "can"; ہے/پڑا after a verb means "must"                               | میں آج نہیں آ سکتا۔ _main aaj nahiñ aa sakta_                  |
| 32   | With نے the verb matches the object                                              | ہم نے فلم دیکھی تھی۔ (needs a native speaker: s-23's پسند آئی) |
| 33   | شاید or اگر … تو + subjunctive                                                   | شاید بارش ہو۔ _shaayad baarish ho_                             |
| 41   | Passive is the past form + جانا                                                  | دروازہ کھولا جا رہا ہے۔ (needs a native speaker)               |

Perspectives: a beginner gets the rule; a heritage speaker gets one screen to
skip; a Roman-track card shows the Roman; a teacher would call it
presentation, then practice. Explicit instruction beats implicit and lasts
([Norris and Ortega 2000](https://doi.org/10.1111/0023-8333.00136)).
**Against:** failed attempts before teaching help later learning ([Kornell,
Hays and Bjork 2009](https://pubmed.ncbi.nlm.nih.gov/19586265/)), with
feedback straight away; and asking about the sentence just shown is copying,
not retrieval ([Pyc and Rawson 2009](https://doi.org/10.1016/j.jml.2009.01.004)).
So the card's example must not be among the lesson's first three questions,
and a unit test should hold that. Explanations can slow down people who already
know the pattern (the expertise reversal effect, Kalyuga et al. 2003, cited
from memory). Fix the content first (finding 1).

- **P-089, one line before the first numeral question:** "Urdu digits run
  left to right." Against: the feedback after a miss is the pretesting design;
  but it fires only on a reversal, and the miss is graded (judgement).

## What this is not evidence for

Recall, time spent, or reading coverage (finding 4 is a lower bound). The
Urdu in the drafts is not checked by a speaker. Untagged sentences were read
only where listed.
