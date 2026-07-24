/**
 * Sentences and short reading passages — original content written for Harf.
 *
 * Two purposes:
 *  1. `SENTENCES` feed the sentence-building exercise: the learner assembles a
 *     sentence from shuffled word tiles, which teaches Urdu word order
 *     (subject → object → verb) far better than any explanation.
 *  2. `PASSAGES` are short graded readings. Following the classic primer
 *     method, each one reuses vocabulary the learner already has, so reading
 *     feels like recognition rather than decoding.
 */

import type { Level } from './words';

export type Sentence = {
  id: string;
  /** words in correct order — the tile pool is these, shuffled */
  words: string[];
  roman: string;
  meaning: string;
  level: Level;
  /** grammar concept this sentence illustrates, if any */
  concept?: string;
};

export const SENTENCES: Sentence[] = [
  // ---- beginner: X is Y ----
  { id: 's-1', words: ['یہ', 'کتاب', 'ہے'], roman: 'ye kitaab hai', meaning: 'This is a book', level: 'beginner', concept: 'g-to-be' },
  { id: 's-2', words: ['میں', 'خوش', 'ہوں'], roman: 'main khush hoon', meaning: 'I am happy', level: 'beginner', concept: 'g-to-be' },
  { id: 's-3', words: ['وہ', 'میرا', 'دوست', 'ہے'], roman: 'wo mera dost hai', meaning: 'He is my friend', level: 'beginner', concept: 'g-to-be' },
  { id: 's-4', words: ['آپ', 'کیسے', 'ہیں'], roman: 'aap kaise hain', meaning: 'How are you?', level: 'beginner' },
  { id: 's-5', words: ['میرا', 'نام', 'علی', 'ہے'], roman: 'mera naam Ali hai', meaning: 'My name is Ali', level: 'beginner', concept: 'g-possess' },
  { id: 's-6', words: ['یہ', 'میری', 'ماں', 'ہیں'], roman: 'ye meri maañ hain', meaning: 'This is my mother', level: 'beginner', concept: 'g-possess' },
  { id: 's-7', words: ['پانی', 'ٹھنڈا', 'ہے'], roman: 'paani ṭhanḍa hai', meaning: 'The water is cold', level: 'beginner' },
  { id: 's-8', words: ['وہ', 'بڑا', 'گھر', 'ہے'], roman: 'wo baṛa ghar hai', meaning: 'That is a big house', level: 'beginner', concept: 'g-gender' },

  // ---- elementary: place, possession, questions ----
  { id: 's-9', words: ['کتاب', 'میز', 'پر', 'ہے'], roman: 'kitaab mez par hai', meaning: 'The book is on the table', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-10', words: ['ہم', 'گھر', 'میں', 'ہیں'], roman: 'ham ghar meñ hain', meaning: 'We are in the house', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-11', words: ['آپ', 'کہاں', 'رہتے', 'ہیں'], roman: 'aap kahaañ rehte hain', meaning: 'Where do you live?', level: 'elementary' },
  { id: 's-12', words: ['یہ', 'کتنے', 'کا', 'ہے'], roman: 'ye kitne ka hai', meaning: 'How much is this?', level: 'elementary' },
  { id: 's-13', words: ['میرے', 'دو', 'بھائی', 'ہیں'], roman: 'mere do bhai hain', meaning: 'I have two brothers', level: 'elementary', concept: 'g-possess' },
  { id: 's-14', words: ['کمرے', 'میں', 'کوئی', 'نہیں'], roman: 'kamre meñ koi nahiñ', meaning: 'There is nobody in the room', level: 'elementary', concept: 'g-oblique' },
  { id: 's-15', words: ['بچے', 'باغ', 'میں', 'کھیلتے', 'ہیں'], roman: 'bachche baagh meñ khelte hain', meaning: 'The children play in the garden', level: 'elementary' },

  // ---- intermediate: tenses, daily life ----
  { id: 's-16', words: ['میں', 'روز', 'کام', 'کرتا', 'ہوں'], roman: 'main roz kaam karta hoon', meaning: 'I work every day', level: 'intermediate', concept: 'g-present' },
  { id: 's-17', words: ['وہ', 'چائے', 'پیتی', 'ہے'], roman: 'wo chai peeti hai', meaning: 'She drinks tea', level: 'intermediate', concept: 'g-present' },
  { id: 's-18', words: ['بارش', 'ہو', 'رہی', 'ہے'], roman: 'baarish ho rahi hai', meaning: 'It is raining', level: 'intermediate', concept: 'g-continuous' },
  { id: 's-19', words: ['میں', 'کل', 'بازار', 'جاؤں', 'گا'], roman: 'main kal bazaar jaaoon ga', meaning: 'I will go to the market tomorrow', level: 'intermediate', concept: 'g-future' },
  { id: 's-20', words: ['وہ', 'گھر', 'میں', 'نہیں', 'تھا'], roman: 'wo ghar meñ nahiñ tha', meaning: 'He was not at home', level: 'intermediate', concept: 'g-past' },
  { id: 's-21', words: ['ڈاکٹر', 'نے', 'دوا', 'دی'], roman: 'ḍākṭar ne dawa di', meaning: 'The doctor gave medicine', level: 'intermediate', concept: 'g-perfect' },
  { id: 's-22', words: ['ہمیں', 'ٹکٹ', 'خریدنا', 'ہے'], roman: 'hameñ ṭikaṭ khareedna hai', meaning: 'We have to buy a ticket', level: 'intermediate' },

  // ---- advanced: opinion, nuance ----
  { id: 's-23', words: ['مجھے', 'یہ', 'کتاب', 'بہت', 'پسند', 'آئی'], roman: 'mujhe ye kitaab bahut pasand aayi', meaning: 'I liked this book very much', level: 'advanced' },
  { id: 's-24', words: ['اگر', 'وقت', 'ہو', 'تو', 'ملیں'], roman: 'agar waqt ho to mileñ', meaning: 'If there is time, let us meet', level: 'advanced', concept: 'g-subjunctive' },
  { id: 's-25', words: ['وہ', 'محنتی', 'ہے', 'لیکن', 'خاموش', 'ہے'], roman: 'wo mehnati hai lekin khaamosh hai', meaning: 'He is hard-working but quiet', level: 'advanced' },
  { id: 's-26', words: ['مجھے', 'امید', 'ہے', 'کہ', 'آپ', 'آئیں', 'گے'], roman: 'mujhe umeed hai ke aap aayeñ ge', meaning: 'I hope that you will come', level: 'advanced' },
  { id: 's-27', words: ['اُس', 'نے', 'خط', 'لکھا', 'تھا'], roman: 'us ne khat likha tha', meaning: 'He had written the letter', level: 'advanced', concept: 'g-perfect' },
  { id: 's-28', words: ['ذرا', 'آہستہ', 'بولیے'], roman: 'zara aahista boliye', meaning: 'Please speak slowly', level: 'advanced', concept: 'g-imperative' },
];

/** A short reading passage with comprehension. */
export type Passage = {
  id: string;
  title: string;
  level: Level;
  /** lines of the passage, in order */
  lines: { urdu: string; roman: string; meaning: string }[];
  question: { ask: string; answer: string; options: string[] };
};

export const PASSAGES: Passage[] = [
  {
    id: 'r-1',
    title: 'My house',
    level: 'elementary',
    lines: [
      { urdu: 'یہ میرا گھر ہے۔', roman: 'ye mera ghar hai.', meaning: 'This is my house.' },
      { urdu: 'گھر میں ایک باغ ہے۔', roman: 'ghar meñ ek baagh hai.', meaning: 'There is a garden in the house.' },
      { urdu: 'باغ میں پھول ہیں۔', roman: 'baagh meñ phool hain.', meaning: 'There are flowers in the garden.' },
      { urdu: 'مجھے میرا گھر پسند ہے۔', roman: 'mujhe mera ghar pasand hai.', meaning: 'I like my house.' },
    ],
    question: {
      ask: 'What is in the garden?',
      answer: 'Flowers',
      options: ['Flowers', 'A car', 'Books', 'Water'],
    },
  },
  {
    id: 'r-2',
    title: 'A day at the market',
    level: 'intermediate',
    lines: [
      { urdu: 'صبح میں بازار گیا۔', roman: 'subah main bazaar gaya.', meaning: 'In the morning I went to the market.' },
      { urdu: 'وہاں بہت ہجوم تھا۔', roman: 'wahaañ bahut hujoom tha.', meaning: 'There was a big crowd there.' },
      { urdu: 'میں نے پھل اور سبزی خریدی۔', roman: 'main ne phal aur sabzi khareedi.', meaning: 'I bought fruit and vegetables.' },
      { urdu: 'آم بہت مہنگے تھے۔', roman: 'aam bahut mehnge the.', meaning: 'The mangoes were very expensive.' },
      { urdu: 'پھر میں گھر واپس آیا۔', roman: 'phir main ghar waapas aaya.', meaning: 'Then I came back home.' },
    ],
    question: {
      ask: 'What was expensive?',
      answer: 'The mangoes',
      options: ['The mangoes', 'The vegetables', 'The tickets', 'The tea'],
    },
  },
  {
    id: 'r-3',
    title: 'My daily routine',
    level: 'intermediate',
    lines: [
      { urdu: 'میں روز صبح جلدی اٹھتا ہوں۔', roman: 'main roz subah jaldi uṭhta hoon.', meaning: 'I get up early every morning.' },
      { urdu: 'پہلے چائے پیتا ہوں۔', roman: 'pehle chai peeta hoon.', meaning: 'First I drink tea.' },
      { urdu: 'پھر کام پر جاتا ہوں۔', roman: 'phir kaam par jaata hoon.', meaning: 'Then I go to work.' },
      { urdu: 'شام کو گھر آتا ہوں۔', roman: 'shaam ko ghar aata hoon.', meaning: 'In the evening I come home.' },
      { urdu: 'رات کو کتاب پڑھتا ہوں۔', roman: 'raat ko kitaab paṛhta hoon.', meaning: 'At night I read a book.' },
    ],
    question: {
      ask: 'What does he do first in the morning?',
      answer: 'Drinks tea',
      options: ['Drinks tea', 'Goes to work', 'Reads a book', 'Goes to the market'],
    },
  },
  {
    id: 'r-4',
    title: 'A letter to a friend',
    level: 'advanced',
    lines: [
      { urdu: 'پیارے دوست، السلام علیکم۔', roman: 'pyaare dost, assalaam-o-alaikum.', meaning: 'Dear friend, peace be upon you.' },
      { urdu: 'مجھے امید ہے کہ آپ خیریت سے ہوں گے۔', roman: 'mujhe umeed hai ke aap khairiyat se hoñ ge.', meaning: 'I hope you are well.' },
      { urdu: 'یہاں موسم بہت اچھا ہے۔', roman: 'yahaañ mausam bahut achha hai.', meaning: 'The weather here is very good.' },
      { urdu: 'اگر وقت ہو تو ضرور آئیے۔', roman: 'agar waqt ho to zaroor aaiye.', meaning: 'If you have time, do come.' },
      { urdu: 'آپ کا دوست، احمد۔', roman: 'aap ka dost, Ahmed.', meaning: 'Your friend, Ahmed.' },
    ],
    question: {
      ask: 'What does the writer say about the weather?',
      answer: 'It is very good',
      options: ['It is very good', 'It is very cold', 'It is raining', 'It is too hot'],
    },
  },
];

export const sentencesByLevel = (level: Level) => SENTENCES.filter((s) => s.level === level);
export const passagesByLevel = (level: Level) => PASSAGES.filter((p) => p.level === level);
export const getPassage = (id: string) => PASSAGES.find((p) => p.id === id);
