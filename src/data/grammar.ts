/**
 * Grammar concepts — the backbone that turns vocabulary into language.
 *
 * Each concept is a short, teachable idea with a plain-English explanation, a
 * few worked examples, and practice items the lesson player turns into
 * exercises. Content is written originally; the *sequence* follows the
 * consensus order of established Urdu courses (pronouns → "to be" → gender →
 * oblique → postpositions → tenses → mood), which is a pedagogical fact rather
 * than anyone's expression.
 */

import type { Level } from './words';

export type GrammarExample = {
  urdu: string;
  roman: string;
  meaning: string;
};

/** A fill-in-the-blank drill: the sentence with ___ where the answer goes. */
export type GrammarDrill = {
  id: string;
  /** sentence with ___ marking the gap */
  prompt: string;
  promptRoman: string;
  meaning: string;
  answer: string;
  options: string[];
  /** why the answer is right — shown after answering */
  because: string;
};

export type GrammarConcept = {
  id: string;
  title: string;
  /** one-line summary shown on the lesson card */
  summary: string;
  level: Level;
  /** the teaching text — short paragraphs */
  explain: string[];
  /**
   * A small table of forms, when the concept has a paradigm.
   *
   * `rowsRoman` mirrors `rows` cell for cell: a romanization for every cell
   * that holds Urdu script, or '' for a cell that is already plain English.
   * It is authored by hand rather than guessed at render time, because a
   * mechanical transliteration is wrong more often than right, and a couple
   * of these cells (a slash-joined list of pronouns, a full example
   * sentence) are exactly the kind of thing no word-by-word lookup covers.
   */
  table?: { heading: string[]; rows: string[][]; rowsRoman?: string[][] };
  examples: GrammarExample[];
  drills: GrammarDrill[];
};

export const GRAMMAR: GrammarConcept[] = [
  // ---------------- BEGINNER ----------------
  {
    id: 'g-pronouns',
    title: 'Pronouns',
    summary: 'I, you, he/she, we, they',
    level: 'beginner',
    explain: [
      'Urdu pronouns do not change for gender, میں (main) means "I" whether you are a man or a woman.',
      'There are three words for "you". آپ (aap) is polite and safe with anyone. تم (tum) is casual, for friends and children. تو (tu) is very intimate and can sound rude, leave it alone at first.',
      'وہ (wo) does double duty: it means "he", "she" and "they", and also "that". Context tells you which.',
    ],
    table: {
      heading: ['Pronoun', 'Meaning'],
      rows: [
        ['میں', 'I'],
        ['ہم', 'we'],
        ['آپ', 'you (polite)'],
        ['تم', 'you (casual)'],
        ['یہ', 'he/she/this (near)'],
        ['وہ', 'he/she/that (far)'],
      ],
      rowsRoman: [['main', ''], ['ham', ''], ['aap', ''], ['tum', ''], ['ye', ''], ['wo', '']],
    },
    examples: [
      { urdu: 'میں طالبِ علم ہوں', roman: 'main taalib-e-ilm hoon', meaning: 'I am a student' },
      { urdu: 'آپ ڈاکٹر ہیں', roman: 'aap ḍākṭar hain', meaning: 'You are a doctor' },
      { urdu: 'وہ میرا دوست ہے', roman: 'wo mera dost hai', meaning: 'He is my friend' },
    ],
    drills: [
      {
        id: 'g-pronouns-d1',
        prompt: '___ استاد ہیں',
        promptRoman: '___ ustaad hain',
        meaning: 'You (polite) are a teacher',
        answer: 'آپ',
        options: ['آپ', 'میں', 'وہ', 'ہم'],
        because: 'ہیں (hain) is the verb form that goes with آپ (aap).',
      },
      {
        id: 'g-pronouns-d2',
        prompt: '___ پانی پیتا ہوں',
        promptRoman: '___ paani peeta hoon',
        meaning: 'I drink water',
        answer: 'میں',
        options: ['میں', 'تم', 'آپ', 'یہ'],
        because: 'ہوں (hoon) only ever follows میں (main).',
      },
    ],
  },
  {
    id: 'g-to-be',
    title: 'The verb "to be"',
    summary: 'hoon · hai · hain: am, is, are',
    level: 'beginner',
    explain: [
      'Urdu sentences usually end with the verb. The commonest verb is ہونا (hona): "to be".',
      'Pick the ending by who you are talking about: ہوں (hoon) after میں (main), ہے (hai) after a single person or thing, ہیں (hain) after آپ (aap), ہم (ham), and plurals.',
      'There is no word for "a" or "an", "I am a doctor" is simply میں ڈاکٹر ہوں (main ḍākṭar hoon).',
    ],
    table: {
      heading: ['Pronoun', 'to be', 'Example'],
      rows: [
        ['میں', 'ہوں', 'میں خوش ہوں'],
        ['تم', 'ہو', 'تم خوش ہو'],
        ['یہ / وہ', 'ہے', 'وہ خوش ہے'],
        ['ہم / آپ / وہ (pl.)', 'ہیں', 'ہم خوش ہیں'],
      ],
      rowsRoman: [
        ['main', 'hoon', 'main khush hoon (I am happy)'],
        ['tum', 'ho', 'tum khush ho (you are happy)'],
        ['ye / wo', 'hai', 'wo khush hai (he/she is happy)'],
        ['ham / aap / wo (pl.)', 'hain', 'ham khush hain (we are happy)'],
      ],
    },
    examples: [
      { urdu: 'یہ کتاب ہے', roman: 'ye kitaab hai', meaning: 'This is a book' },
      { urdu: 'ہم گھر میں ہیں', roman: 'ham ghar meñ hain', meaning: 'We are at home' },
      { urdu: 'تم بیمار ہو', roman: 'tum bimaar ho', meaning: 'You are ill' },
    ],
    drills: [
      {
        id: 'g-tobe-d1',
        prompt: 'میں خوش ___',
        promptRoman: 'main khush ___',
        meaning: 'I am happy',
        answer: 'ہوں',
        options: ['ہوں', 'ہے', 'ہیں', 'ہو'],
        because: 'میں (main) always takes ہوں (hoon).',
      },
      {
        id: 'g-tobe-d2',
        prompt: 'وہ میرا بھائی ___',
        promptRoman: 'wo mera bhai ___',
        meaning: 'He is my brother',
        answer: 'ہے',
        options: ['ہے', 'ہوں', 'ہیں', 'ہو'],
        because: 'One person or thing takes ہے (hai).',
      },
      {
        id: 'g-tobe-d3',
        prompt: 'آپ کہاں ___؟',
        promptRoman: 'aap kahaañ ___?',
        meaning: 'Where are you?',
        answer: 'ہیں',
        options: ['ہیں', 'ہے', 'ہوں', 'ہو'],
        because: 'آپ (aap) takes the plural-polite ہیں (hain).',
      },
    ],
  },
  {
    id: 'g-gender',
    title: 'Gender & number',
    summary: 'Every noun is masculine or feminine',
    level: 'beginner',
    explain: [
      'Every Urdu noun is either masculine or feminine, there is no "it". لڑکا (laṛka, boy) is masculine, لڑکی (laṛki, girl) is feminine.',
      'A useful rule of thumb: nouns ending in ‑ا (‑a) are usually masculine, and those ending in ‑ی (‑i) are usually feminine. There are exceptions, but it will carry you a long way.',
      'Adjectives that end in ‑ا (‑a) change to match: اچھا لڑکا (achha laṛka, good boy) but اچھی لڑکی (achhi laṛki, good girl), and اچھے لڑکے (achhe laṛke) for the plural.',
    ],
    table: {
      heading: ['', 'Singular', 'Plural'],
      rows: [
        ['Masculine', 'اچھا لڑکا', 'اچھے لڑکے'],
        ['Feminine', 'اچھی لڑکی', 'اچھی لڑکیاں'],
      ],
      rowsRoman: [
        ['', 'achha laṛka (good boy)', 'achhe laṛke (good boys)'],
        ['', 'achhi laṛki (good girl)', 'achhi laṛkiyaañ (good girls)'],
      ],
    },
    examples: [
      { urdu: 'بڑا گھر', roman: 'baṛa ghar', meaning: 'a big house (m.)' },
      { urdu: 'بڑی کتاب', roman: 'baṛi kitaab', meaning: 'a big book (f.)' },
      { urdu: 'چھوٹے بچے', roman: 'chhoṭe bachche', meaning: 'small children (m. pl.)' },
    ],
    drills: [
      {
        id: 'g-gender-d1',
        prompt: '___ لڑکی',
        promptRoman: '___ laṛki',
        meaning: 'a good girl',
        answer: 'اچھی',
        options: ['اچھی', 'اچھا', 'اچھے', 'اچھو'],
        because: 'لڑکی (laṛki) is feminine, so the adjective ends in ‑ی (‑i).',
      },
      {
        id: 'g-gender-d2',
        prompt: '___ گھر',
        promptRoman: '___ ghar',
        meaning: 'a big house',
        answer: 'بڑا',
        options: ['بڑا', 'بڑی', 'بڑے', 'بڑیاں'],
        because: 'گھر (ghar) is masculine singular, so the adjective ends in ‑ا (‑a).',
      },
    ],
  },

  {
    id: 'g-plurals',
    title: 'Making plurals',
    summary: 'One book, two books: how nouns change',
    level: 'beginner',
    explain: [
      'Masculine nouns ending in ‑ا (‑a) swap it for ‑ے (‑e): لڑکا → لڑکے (laṛka → laṛke), کمرا → کمرے (kamra → kamre).',
      'Every other masculine noun looks the same in the plural. گھر (ghar) is "house" and "houses"; the number or the verb tells you which.',
      'Feminine nouns ending in ‑ی (‑i) add ‑اں (‑aañ): لڑکی → لڑکیاں (laṛki → laṛkiyaañ). Feminine nouns ending in a consonant add ‑یں (‑eñ): کتاب → کتابیں (kitaab → kitaabeñ), رات → راتیں (raat → raateñ).',
    ],
    table: {
      heading: ['Type', 'Singular', 'Plural'],
      rows: [
        ['Masc. in ‑ا', 'لڑکا', 'لڑکے'],
        ['Other masc.', 'گھر', 'گھر'],
        ['Fem. in ‑ی', 'لڑکی', 'لڑکیاں'],
        ['Other fem.', 'کتاب', 'کتابیں'],
      ],
      rowsRoman: [
        ['', 'laṛka (boy)', 'laṛke (boys)'],
        ['', 'ghar (house)', 'ghar (houses)'],
        ['', 'laṛki (girl)', 'laṛkiyaañ (girls)'],
        ['', 'kitaab (book)', 'kitaabeñ (books)'],
      ],
    },
    examples: [
      { urdu: 'دو لڑکے', roman: 'do laṛke', meaning: 'two boys' },
      { urdu: 'تین کتابیں', roman: 'teen kitaabeñ', meaning: 'three books' },
      { urdu: 'یہ گھر بڑے ہیں', roman: 'ye ghar baṛe hain', meaning: 'These houses are big' },
    ],
    drills: [
      {
        id: 'g-plur-d1',
        prompt: 'میرے پاس دو ___ ہیں',
        promptRoman: 'mere paas do ___ hain',
        meaning: 'I have two books',
        answer: 'کتابیں',
        options: ['کتابیں', 'کتاب', 'کتابوں', 'کتابیاں'],
        because: 'کتاب (kitaab) is feminine and ends in a consonant, so the plural adds ‑یں (‑eñ).',
      },
      {
        id: 'g-plur-d2',
        prompt: 'باغ میں تین ___ ہیں',
        promptRoman: 'baagh meñ teen ___ hain',
        meaning: 'There are three boys in the garden',
        answer: 'لڑکے',
        options: ['لڑکے', 'لڑکا', 'لڑکی', 'لڑکوں'],
        because: 'Masculine nouns ending in ‑ا (‑a) take ‑ے (‑e) in the plural.',
      },
    ],
  },

  // ---------------- ELEMENTARY ----------------
  {
    id: 'g-possess',
    title: 'Possession: ka, ki, ke',
    summary: "Urdu's version of apostrophe-s",
    level: 'elementary',
    explain: [
      'To say "X\'s Y", put کا (ka) between them: علی کا گھر (Ali ka ghar): "Ali\'s house".',
      'کا (ka) behaves like an adjective: it agrees with the thing owned, not the owner. Masculine → کا (ka), feminine → کی (ki), masculine plural → کے (ke).',
      'The possessive pronouns follow the same pattern: میرا / میری (mera / meri, my), تمہارا (tumhaara, your), اُس کا (us ka, his/her), ہمارا (hamaara, our), آپ کا (aap ka, your, polite).',
    ],
    table: {
      heading: ['Thing owned', 'Form', 'Example'],
      rows: [
        ['Masculine sing.', 'کا', 'علی کا بیٹا'],
        ['Feminine', 'کی', 'علی کی بیٹی'],
        ['Masculine plural', 'کے', 'علی کے بیٹے'],
      ],
      rowsRoman: [
        ['', 'ka', 'Ali ka beṭa (Ali\'s son)'],
        ['', 'ki', 'Ali ki beṭi (Ali\'s daughter)'],
        ['', 'ke', 'Ali ke beṭe (Ali\'s sons)'],
      ],
    },
    examples: [
      { urdu: 'میرا نام علی ہے', roman: 'mera naam Ali hai', meaning: 'My name is Ali' },
      { urdu: 'یہ میری کتاب ہے', roman: 'ye meri kitaab hai', meaning: 'This is my book' },
      { urdu: 'استاد کا کمرہ', roman: 'ustaad ka kamra', meaning: "the teacher's room" },
    ],
    drills: [
      {
        id: 'g-poss-d1',
        prompt: 'یہ میر___ کتاب ہے',
        promptRoman: 'ye mer___ kitaab hai',
        meaning: 'This is my book',
        answer: 'ی',
        options: ['ی', 'ا', 'ے', 'وں'],
        because: 'کتاب (kitaab) is feminine, so "my" becomes میری (meri).',
      },
      {
        id: 'g-poss-d2',
        prompt: 'علی ___ گھر بڑا ہے',
        promptRoman: 'Ali ___ ghar baṛa hai',
        meaning: "Ali's house is big",
        answer: 'کا',
        options: ['کا', 'کی', 'کے', 'کو'],
        because: 'گھر (ghar) is masculine singular → کا (ka).',
      },
    ],
  },
  {
    id: 'g-postpositions',
    title: 'Postpositions',
    summary: 'Urdu puts "in, on, to" AFTER the noun',
    level: 'elementary',
    explain: [
      'English says "in the house"; Urdu says گھر میں (ghar meñ): house-in. These little words come after the noun, so they are called postpositions.',
      'The everyday set: میں (meñ, in), پر (par, on), سے (se, from, with, by), کو (ko, to, for), تک (tak, up to, until), کے ساتھ (ke saath, with).',
      'A noun before a postposition shifts into the oblique form, a small change you will meet next.',
    ],
    table: {
      heading: ['Postposition', 'Meaning', 'Example'],
      rows: [
        ['میں', 'in', 'شہر میں'],
        ['پر', 'on / at', 'میز پر'],
        ['سے', 'from / with', 'گھر سے'],
        ['کو', 'to / for', 'مجھ کو'],
        ['تک', 'up to / until', 'رات تک'],
      ],
      rowsRoman: [
        ['meñ', '', 'shehar meñ (in the city)'],
        ['par', '', 'mez par (on the table)'],
        ['se', '', 'ghar se (from home)'],
        ['ko', '', 'mujh ko (to me)'],
        ['tak', '', 'raat tak (until night)'],
      ],
    },
    examples: [
      { urdu: 'کتاب میز پر ہے', roman: 'kitaab mez par hai', meaning: 'The book is on the table' },
      { urdu: 'میں بازار سے آیا', roman: 'main bazaar se aaya', meaning: 'I came from the market' },
      { urdu: 'ہم گھر میں ہیں', roman: 'ham ghar meñ hain', meaning: 'We are in the house' },
    ],
    drills: [
      {
        id: 'g-post-d1',
        prompt: 'کتاب میز ___ ہے',
        promptRoman: 'kitaab mez ___ hai',
        meaning: 'The book is on the table',
        answer: 'پر',
        options: ['پر', 'میں', 'سے', 'تک'],
        because: 'پر (par) means "on".',
      },
      {
        id: 'g-post-d2',
        prompt: 'وہ اسکول ___ جاتا ہے',
        promptRoman: 'wo iskool ___ jaata hai',
        meaning: 'He goes to school',
        answer: 'کو',
        options: ['کو', 'پر', 'سے', 'میں'],
        because: 'کو (ko) marks the destination "to".',
      },
    ],
  },
  {
    id: 'g-oblique',
    title: 'The oblique case',
    summary: 'Nouns change shape before a postposition',
    level: 'elementary',
    explain: [
      'When a postposition follows, a masculine noun ending in ‑ا (‑a) changes to ‑ے (‑e). لڑکا (laṛka) becomes لڑکے (laṛke): لڑکے کو (laṛke ko): "to the boy".',
      'Plurals take ‑وں (‑oñ) before a postposition: لڑکوں سے (laṛkoñ se): "from the boys".',
      'Feminine nouns and masculine nouns not ending in ‑ا (‑a) stay as they are: کتاب میں (kitaab meñ), گھر میں (ghar meñ).',
    ],
    table: {
      heading: ['Plain', 'Oblique', 'With postposition'],
      rows: [
        ['لڑکا', 'لڑکے', 'لڑکے کو'],
        ['لڑکے (pl.)', 'لڑکوں', 'لڑکوں سے'],
        ['کتاب', 'کتاب', 'کتاب میں'],
      ],
      rowsRoman: [
        ['laṛka (boy)', 'laṛke', 'laṛke ko (to the boy)'],
        ['laṛke (boys)', 'laṛkoñ', 'laṛkoñ se (from the boys)'],
        ['kitaab (book)', 'kitaab', 'kitaab meñ (in the book)'],
      ],
    },
    examples: [
      { urdu: 'لڑکے کو کتاب دو', roman: 'laṛke ko kitaab do', meaning: 'Give the book to the boy' },
      { urdu: 'کمرے میں کوئی نہیں', roman: 'kamre meñ koi nahiñ', meaning: 'There is nobody in the room' },
    ],
    drills: [
      {
        id: 'g-obl-d1',
        prompt: 'کمر___ میں میز ہے',
        promptRoman: 'kamr___ meñ mez hai',
        meaning: 'There is a table in the room',
        answer: 'ے',
        options: ['ے', 'ا', 'ی', 'وں'],
        because: 'کمرا (kamra) becomes کمرے (kamre) before the postposition میں (meñ).',
      },
    ],
  },

  {
    id: 'g-negation',
    title: 'Saying no',
    summary: 'nahiñ · na · mat: three ways to negate',
    level: 'elementary',
    explain: [
      'نہیں (nahiñ) is the everyday "not". It goes immediately before the verb: میں نہیں جاتا (main nahiñ jaata): "I do not go".',
      'In a simple "X is Y" sentence, نہیں (nahiñ) usually swallows the ہے (hai): وہ ڈاکٹر نہیں (wo ḍākṭar nahiñ): "he is not a doctor". Adding ہے (hai) is not wrong, just heavier.',
      'مت (mat) is only for telling someone not to do something: مت جاؤ (mat jaao): "don\'t go". نہ (na) is the quiet one, used with the subjunctive and in pairs: نہ یہ نہ وہ (na ye na wo): "neither this nor that".',
    ],
    table: {
      heading: ['Word', 'Use', 'Example'],
      rows: [
        ['نہیں', 'ordinary "not"', 'میں نہیں جاؤں گا'],
        ['مت', 'negative command', 'مت بولو'],
        ['نہ', 'subjunctive, "neither…nor"', 'شاید وہ نہ آئے'],
      ],
      rowsRoman: [
        ['nahiñ', '', 'main nahiñ jaaoon ga (I will not go)'],
        ['mat', '', 'mat bolo (don\'t speak)'],
        ['na', '', 'shaayad wo na aaye (perhaps he won\'t come)'],
      ],
    },
    examples: [
      { urdu: 'مجھے یہ پسند نہیں', roman: 'mujhe ye pasand nahiñ', meaning: "I don't like this" },
      { urdu: 'وہ گھر میں نہیں تھا', roman: 'wo ghar meñ nahiñ tha', meaning: 'He was not at home' },
      { urdu: 'یہاں مت بیٹھو', roman: 'yahaañ mat baiṭho', meaning: "Don't sit here" },
    ],
    drills: [
      {
        id: 'g-neg-d1',
        prompt: 'میں آج ___ آؤں گا',
        promptRoman: 'main aaj ___ aaoon ga',
        meaning: 'I will not come today',
        answer: 'نہیں',
        options: ['نہیں', 'مت', 'نہ', 'کوئی'],
        because: 'A plain statement takes نہیں (nahiñ) before the verb.',
      },
      {
        id: 'g-neg-d2',
        prompt: 'دروازہ ___ کھولو',
        promptRoman: 'darwaaza ___ kholo',
        meaning: "Don't open the door",
        answer: 'مت',
        options: ['مت', 'نہیں', 'نہ', 'کبھی'],
        because: 'A command told *not* to do something uses مت (mat).',
      },
    ],
  },
  {
    id: 'g-questions',
    title: 'Asking questions',
    summary: 'The k- words: who, what, where, when, why',
    level: 'elementary',
    explain: [
      'Almost every Urdu question word begins with k‑, which makes them easy to spot: کون (kaun, who), کیا (kya, what), کہاں (kahaañ, where), کب (kab, when), کیوں (kyoñ, why), کیسے (kaise, how), کتنا (kitna, how much), کون سا (kaun sa, which).',
      'The question word usually sits just before the verb, where the answer would go: آپ کہاں رہتے ہیں؟ (aap kahaañ rehte hain?): "Where do you live?"',
      'For a yes/no question, put کیا (kya) at the front, or simply raise your voice at the end. کیا آپ ڈاکٹر ہیں؟ (kya aap ḍākṭar hain?): "Are you a doctor?"',
    ],
    table: {
      heading: ['Question word', 'Meaning'],
      rows: [
        ['کون', 'who'],
        ['کیا', 'what'],
        ['کہاں', 'where'],
        ['کب', 'when'],
        ['کیوں', 'why'],
        ['کیسے', 'how'],
        ['کتنا', 'how much'],
      ],
      rowsRoman: [['kaun', ''], ['kya', ''], ['kahaañ', ''], ['kab', ''], ['kyoñ', ''], ['kaise', ''], ['kitna', '']],
    },
    examples: [
      { urdu: 'آپ کا نام کیا ہے؟', roman: 'aap ka naam kya hai?', meaning: 'What is your name?' },
      { urdu: 'یہ کتنے کا ہے؟', roman: 'ye kitne ka hai?', meaning: 'How much is this?' },
      { urdu: 'کیا آپ اردو بولتے ہیں؟', roman: 'kya aap urdu bolte hain?', meaning: 'Do you speak Urdu?' },
    ],
    drills: [
      {
        id: 'g-ques-d1',
        prompt: 'آپ ___ رہتے ہیں؟',
        promptRoman: 'aap ___ rehte hain?',
        meaning: 'Where do you live?',
        answer: 'کہاں',
        options: ['کہاں', 'کب', 'کیوں', 'کون'],
        because: 'کہاں (kahaañ) asks about a place.',
      },
      {
        id: 'g-ques-d2',
        prompt: '___ آپ چائے پیئیں گے؟',
        promptRoman: '___ aap chai piyeñ ge?',
        meaning: 'Will you drink tea?',
        answer: 'کیا',
        options: ['کیا', 'کون', 'کیسے', 'کتنا'],
        because: 'کیا (kya) at the start turns a statement into a yes/no question.',
      },
    ],
  },
  {
    id: 'g-conjunctions',
    title: 'Joining ideas',
    summary: 'and, but, or, because',
    level: 'elementary',
    explain: [
      'اور (aur) joins things: چائے اور روٹی (chai aur roṭi). لیکن (lekin, or its shorter cousin مگر / magar) contrasts: وہ چھوٹا ہے لیکن مضبوط ہے (wo chhoṭa hai lekin mazboot hai).',
      'یا (ya) offers a choice; کیونکہ (kyoñke) gives a reason and always comes *before* the reason, exactly like English "because".',
      'کہ (ke) is the workhorse "that", introducing a reported thought: مجھے لگتا ہے کہ وہ آئے گا (mujhe lagta hai ke wo aaye ga): "I think that he will come".',
    ],
    table: {
      heading: ['Connector', 'Meaning'],
      rows: [
        ['اور', 'and'],
        ['لیکن / مگر', 'but'],
        ['یا', 'or'],
        ['کیونکہ', 'because'],
        ['اس لیے', 'therefore'],
        ['کہ', 'that'],
      ],
      rowsRoman: [['aur', ''], ['lekin / magar', ''], ['ya', ''], ['kyoñke', ''], ['is liye', ''], ['ke', '']],
    },
    examples: [
      { urdu: 'میں تھکا ہوں کیونکہ میں نے کام کیا', roman: 'main thaka hoon kyoñke main ne kaam kiya', meaning: 'I am tired because I worked' },
      { urdu: 'چائے یا کافی؟', roman: 'chai ya coffee?', meaning: 'Tea or coffee?' },
      { urdu: 'وہ محنتی ہے لیکن خاموش ہے', roman: 'wo mehnati hai lekin khaamosh hai', meaning: 'He is hard-working but quiet' },
    ],
    drills: [
      {
        id: 'g-conj-d1',
        prompt: 'میں نہیں آیا ___ میں بیمار تھا',
        promptRoman: 'main nahiñ aaya ___ main bimaar tha',
        meaning: 'I did not come because I was ill',
        answer: 'کیونکہ',
        options: ['کیونکہ', 'لیکن', 'یا', 'اور'],
        because: 'کیونکہ (kyoñke) introduces the reason.',
      },
    ],
  },

  // ---------------- INTERMEDIATE ----------------
  {
    id: 'g-present',
    title: 'Present habitual tense',
    summary: 'What you do every day',
    level: 'intermediate',
    explain: [
      'For things you do regularly, take the verb stem, add ‑تا / ‑تی / ‑تے (‑ta / ‑ti / ‑te), then the right form of "to be".',
      'جانا (jaana, to go) has the stem جا (ja). So: میں جاتا ہوں (main jaata hoon): "I go" (said by a man), میں جاتی ہوں (main jaati hoon) (said by a woman).',
      'This is the first place gender shows up in verbs: the ‑تا (‑ta) part agrees with the person doing it.',
    ],
    table: {
      heading: ['Who', 'Form', 'Meaning'],
      rows: [
        ['میں (m.)', 'جاتا ہوں', 'I go'],
        ['میں (f.)', 'جاتی ہوں', 'I go'],
        ['وہ (m.)', 'جاتا ہے', 'he goes'],
        ['وہ (f.)', 'جاتی ہے', 'she goes'],
        ['ہم / وہ (pl.)', 'جاتے ہیں', 'we / they go'],
      ],
      rowsRoman: [
        ['main (m.)', 'jaata hoon', ''],
        ['main (f.)', 'jaati hoon', ''],
        ['wo (m.)', 'jaata hai', ''],
        ['wo (f.)', 'jaati hai', ''],
        ['ham / wo (pl.)', 'jaate hain', ''],
      ],
    },
    examples: [
      { urdu: 'میں روز کام کرتا ہوں', roman: 'main roz kaam karta hoon', meaning: 'I work every day' },
      { urdu: 'وہ چائے پیتی ہے', roman: 'wo chai peeti hai', meaning: 'She drinks tea' },
      { urdu: 'بچے اسکول جاتے ہیں', roman: 'bachche iskool jaate hain', meaning: 'The children go to school' },
    ],
    drills: [
      {
        id: 'g-pres-d1',
        prompt: 'وہ روز کتاب پڑھ___ ہے',
        promptRoman: 'wo roz kitaab paṛh___ hai',
        meaning: 'She reads a book every day',
        answer: 'تی',
        options: ['تی', 'تا', 'تے', 'تیں'],
        because: 'The subject is feminine singular → ‑تی (‑ti).',
      },
      {
        id: 'g-pres-d2',
        prompt: 'ہم اردو بول___ ہیں',
        promptRoman: 'ham urdu bol___ hain',
        meaning: 'We speak Urdu',
        answer: 'تے',
        options: ['تے', 'تا', 'تی', 'تیں'],
        because: 'Plural subjects take ‑تے (‑te) with ہیں (hain).',
      },
    ],
  },
  {
    id: 'g-continuous',
    title: 'Present continuous',
    summary: 'What you are doing right now',
    level: 'intermediate',
    explain: [
      'For an action happening at this moment, use the stem + رہا / رہی / رہے (raha / rahi / rahe) + "to be".',
      'میں جا رہا ہوں (main ja raha hoon): "I am going". The رہا (raha) part agrees with the speaker, just like ‑تا did.',
      'Compare: میں کھاتا ہوں (main khaata hoon, "I eat", generally) vs میں کھا رہا ہوں (main kha raha hoon, "I am eating", now).',
    ],
    examples: [
      { urdu: 'میں کھانا کھا رہا ہوں', roman: 'main khaana kha raha hoon', meaning: 'I am eating food' },
      { urdu: 'بارش ہو رہی ہے', roman: 'baarish ho rahi hai', meaning: 'It is raining' },
      { urdu: 'وہ کام کر رہے ہیں', roman: 'wo kaam kar rahe hain', meaning: 'They are working' },
    ],
    drills: [
      {
        id: 'g-cont-d1',
        prompt: 'بارش ہو ___ ہے',
        promptRoman: 'baarish ho ___ hai',
        meaning: 'It is raining',
        answer: 'رہی',
        options: ['رہی', 'رہا', 'رہے', 'رہیں'],
        because: 'بارش (baarish) is feminine → رہی (rahi).',
      },
    ],
  },
  {
    id: 'g-past',
    title: 'Past tense',
    summary: 'tha · thi · the: was, were',
    level: 'intermediate',
    explain: [
      'The past of "to be" is تھا (tha). It agrees with the subject: تھا (tha, m. sing.), تھی (thi, f.), تھے (the, m. pl.), تھیں (thiñ, f. pl.).',
      'میں خوش تھا (main khush tha): "I was happy" (man speaking); میں خوش تھی (main khush thi) (woman speaking).',
      'Add تھا (tha) to the habitual form to get "used to": میں جاتا تھا (main jaata tha): "I used to go".',
    ],
    table: {
      heading: ['Subject', 'was/were'],
      rows: [
        ['masculine singular', 'تھا'],
        ['feminine singular', 'تھی'],
        ['masculine plural', 'تھے'],
        ['feminine plural', 'تھیں'],
      ],
      rowsRoman: [
        ['', 'tha'],
        ['', 'thi'],
        ['', 'the'],
        ['', 'thiñ'],
      ],
    },
    examples: [
      { urdu: 'وہ گھر میں تھا', roman: 'wo ghar meñ tha', meaning: 'He was at home' },
      { urdu: 'کتاب میز پر تھی', roman: 'kitaab mez par thi', meaning: 'The book was on the table' },
      { urdu: 'ہم دوست تھے', roman: 'ham dost the', meaning: 'We were friends' },
    ],
    drills: [
      {
        id: 'g-past-d1',
        prompt: 'کتاب میز پر ___',
        promptRoman: 'kitaab mez par ___',
        meaning: 'The book was on the table',
        answer: 'تھی',
        options: ['تھی', 'تھا', 'تھے', 'تھیں'],
        because: 'کتاب (kitaab) is feminine singular → تھی (thi).',
      },
    ],
  },
  {
    id: 'g-future',
    title: 'Future tense',
    summary: 'What you will do',
    level: 'intermediate',
    explain: [
      'The future adds ‑گا / ‑گی / ‑گے (‑ga / ‑gi / ‑ge) to the subjunctive stem: میں جاؤں گا (main jaaoon ga): "I will go".',
      'The گا (ga) part agrees with the subject, exactly like the other verb endings you have met.',
      'Common forms: میں کروں گا (main karoon ga, I will do), وہ کرے گا (wo kare ga, he will do), ہم کریں گے (ham kareñ ge, we will do).',
    ],
    examples: [
      { urdu: 'میں کل آؤں گا', roman: 'main kal aaoon ga', meaning: 'I will come tomorrow' },
      { urdu: 'وہ خط لکھے گی', roman: 'wo khat likhe gi', meaning: 'She will write a letter' },
      { urdu: 'ہم بازار جائیں گے', roman: 'ham bazaar jaayeñ ge', meaning: 'We will go to the market' },
    ],
    drills: [
      {
        id: 'g-fut-d1',
        prompt: 'وہ کل آئے ___',
        promptRoman: 'wo kal aaye ___',
        meaning: 'She will come tomorrow',
        answer: 'گی',
        options: ['گی', 'گا', 'گے', 'گیں'],
        because: 'A feminine subject takes ‑گی (‑gi).',
      },
    ],
  },

  {
    id: 'g-dative',
    title: 'The mujhe feeling',
    summary: 'Liking, knowing, hunger: things that happen *to* you',
    level: 'intermediate',
    explain: [
      'A whole family of Urdu expressions puts the person in the کو (ko) form instead of making them the subject. Literally, "to me this is pleasing" rather than "I like this".',
      'The short forms are worth memorising as a set: مجھے (mujhe, to me), تمہیں (tumheñ, to you), آپ کو (aap ko), اُسے (use, to him/her), ہمیں (hameñ, to us), اُنہیں (unheñ, to them).',
      'Use it for liking (پسند ہونا, pasand hona), knowing a language (آنا, aana), needing (چاہیے, chaahiye), and for hunger, thirst, cold and fear, which in Urdu "attach" to you: مجھے بھوک لگی ہے (mujhe bhook lagi hai).',
    ],
    table: {
      heading: ['Long form', 'Short form', 'Meaning'],
      rows: [
        ['مجھ کو', 'مجھے', 'to me'],
        ['تم کو', 'تمہیں', 'to you (casual)'],
        ['اُس کو', 'اُسے', 'to him/her'],
        ['ہم کو', 'ہمیں', 'to us'],
        ['اُن کو', 'اُنہیں', 'to them'],
      ],
      rowsRoman: [
        ['mujh ko', 'mujhe', ''],
        ['tum ko', 'tumheñ', ''],
        ['us ko', 'use', ''],
        ['ham ko', 'hameñ', ''],
        ['un ko', 'unheñ', ''],
      ],
    },
    examples: [
      { urdu: 'مجھے چائے پسند ہے', roman: 'mujhe chai pasand hai', meaning: 'I like tea' },
      { urdu: 'اُسے اردو آتی ہے', roman: 'use urdu aati hai', meaning: 'She knows Urdu' },
      { urdu: 'ہمیں بھوک لگی ہے', roman: 'hameñ bhook lagi hai', meaning: 'We are hungry' },
    ],
    drills: [
      {
        id: 'g-dat-d1',
        prompt: '___ یہ کتاب پسند ہے',
        promptRoman: '___ ye kitaab pasand hai',
        meaning: 'I like this book',
        answer: 'مجھے',
        options: ['مجھے', 'میں', 'میرا', 'مجھ'],
        because: 'پسند ہونا (pasand hona) puts the liker in the کو (ko) form: مجھے (mujhe).',
      },
      {
        id: 'g-dat-d2',
        prompt: 'اُسے اردو ___ ہے',
        promptRoman: 'use urdu ___ hai',
        meaning: 'She knows Urdu',
        answer: 'آتی',
        options: ['آتی', 'آتا', 'جانتی', 'آتے'],
        because: 'Knowing a language uses آنا (aana), agreeing with اردو (urdu, feminine) → آتی (aati).',
      },
    ],
  },
  {
    id: 'g-ability',
    title: 'Can & could',
    summary: 'sakna: being able to do something',
    level: 'intermediate',
    explain: [
      'Put سکنا (sakna) after the bare verb stem and everything else stays normal: میں جا سکتا ہوں (main ja sakta hoon): "I can go".',
      'The stem never changes; سکنا (sakna) carries all the endings. میں بول سکتا ہوں (main bol sakta hoon), وہ بول سکتی ہے (wo bol sakti hai), ہم بول سکتے ہیں (ham bol sakte hain).',
      'For the negative, نہیں (nahiñ) goes before the pair: میں نہیں جا سکتا (main nahiñ ja sakta). To say you *managed* to do something, پانا (paana) does that job: میں نہیں جا پایا (main nahiñ ja paaya): "I couldn\'t manage to go".',
    ],
    examples: [
      { urdu: 'کیا آپ اردو بول سکتے ہیں؟', roman: 'kya aap urdu bol sakte hain?', meaning: 'Can you speak Urdu?' },
      { urdu: 'میں آج نہیں آ سکتا', roman: 'main aaj nahiñ aa sakta', meaning: 'I cannot come today' },
      { urdu: 'وہ اچھا گا سکتی ہے', roman: 'wo achha ga sakti hai', meaning: 'She can sing well' },
    ],
    drills: [
      {
        id: 'g-abil-d1',
        prompt: 'میں یہ کام کر ___ ہوں',
        promptRoman: 'main ye kaam kar ___ hoon',
        meaning: 'I can do this work',
        answer: 'سکتا',
        options: ['سکتا', 'سکتی', 'سکتے', 'سکنا'],
        because: 'سکنا (sakna) takes the endings; a masculine "I" gives سکتا ہوں (sakta hoon).',
      },
    ],
  },
  {
    id: 'g-obligation',
    title: 'Have to & should',
    summary: 'chaahiye · hai · paṛna: three strengths of "must"',
    level: 'intermediate',
    explain: [
      'All three use the infinitive (the ‑نا, ‑na form) with the person in the کو (ko) form: مجھے (mujhe), آپ کو (aap ko), اُسے (use).',
      'مجھے جانا ہے (mujhe jaana hai) is a plan: "I have to go". مجھے جانا چاہیے (mujhe jaana chaahiye) is advice: "I should go". مجھے جانا پڑا (mujhe jaana paṛa) is pressure from outside: "I had to go".',
      'One quirk: with the ہے (hai) version the infinitive agrees with the object. مجھے کتاب خریدنی ہے (mujhe kitaab khareedni hai), because کتاب (kitaab) is feminine.',
    ],
    table: {
      heading: ['Pattern', 'Strength', 'Example'],
      rows: [
        ['‑نا ہے', 'plan / need', 'مجھے جانا ہے'],
        ['‑نا چاہیے', 'advice', 'آپ کو آرام کرنا چاہیے'],
        ['‑نا پڑا', 'compulsion', 'مجھے رکنا پڑا'],
      ],
      rowsRoman: [
        ['‑na hai', '', 'mujhe jaana hai (I have to go)'],
        ['‑na chaahiye', '', 'aap ko aaraam karna chaahiye (you should rest)'],
        ['‑na paṛa', '', 'mujhe rukna paṛa (I had to stop)'],
      ],
    },
    examples: [
      { urdu: 'ہمیں ٹکٹ خریدنا ہے', roman: 'hameñ ṭikaṭ khareedna hai', meaning: 'We have to buy a ticket' },
      { urdu: 'آپ کو آرام کرنا چاہیے', roman: 'aap ko aaraam karna chaahiye', meaning: 'You should rest' },
      { urdu: 'مجھے جلدی اٹھنا پڑا', roman: 'mujhe jaldi uṭhna paṛa', meaning: 'I had to get up early' },
    ],
    drills: [
      {
        id: 'g-oblig-d1',
        prompt: 'آپ کو دوا لینی ___',
        promptRoman: 'aap ko dawa leni ___',
        meaning: 'You should take the medicine',
        answer: 'چاہیے',
        options: ['چاہیے', 'ہے', 'پڑا', 'ہوں'],
        because: 'چاہیے (chaahiye) is the "should" of advice.',
      },
    ],
  },
  {
    id: 'g-comparative',
    title: 'Comparing things',
    summary: 'Bigger than, the biggest',
    level: 'intermediate',
    explain: [
      'Urdu has no "‑er" ending. You mark the thing you are comparing *against* with سے (se), and leave the adjective alone: یہ گھر اُس سے بڑا ہے (ye ghar us se baṛa hai): "this house is bigger than that one".',
      'Add زیادہ (zyaada, more) when you want emphasis: وہ مجھ سے زیادہ تیز ہے (wo mujh se zyaada tez hai).',
      'For the superlative, compare against everything: سب سے (sab se). وہ سب سے اچھا ہے (wo sab se achha hai): "he is the best of all".',
    ],
    table: {
      heading: ['Pattern', 'Meaning', 'Example'],
      rows: [
        ['X سے بڑا', 'bigger than X', 'یہ اُس سے بڑا ہے'],
        ['X سے زیادہ', 'more than X', 'وہ مجھ سے زیادہ تیز ہے'],
        ['سب سے', 'the most of all', 'سب سے اچھا'],
      ],
      rowsRoman: [
        ['X se baṛa', '', 'ye us se baṛa hai (this is bigger than that)'],
        ['X se zyaada', '', 'wo mujh se zyaada tez hai (he is faster than me)'],
        ['sab se', '', 'sab se achha (the best of all)'],
      ],
    },
    examples: [
      { urdu: 'چائے کافی سے سستی ہے', roman: 'chai coffee se sasti hai', meaning: 'Tea is cheaper than coffee' },
      { urdu: 'یہ کتاب سب سے دلچسپ ہے', roman: 'ye kitaab sab se dilchasp hai', meaning: 'This book is the most interesting' },
    ],
    drills: [
      {
        id: 'g-comp-d1',
        prompt: 'یہ گھر اُس ___ بڑا ہے',
        promptRoman: 'ye ghar us ___ baṛa hai',
        meaning: 'This house is bigger than that one',
        answer: 'سے',
        options: ['سے', 'کو', 'میں', 'پر'],
        because: 'سے (se) marks what you are comparing against.',
      },
      {
        id: 'g-comp-d2',
        prompt: 'وہ ___ سے اچھا کھلاڑی ہے',
        promptRoman: 'wo ___ se achha khilaaṛi hai',
        meaning: 'He is the best player of all',
        answer: 'سب',
        options: ['سب', 'بہت', 'زیادہ', 'کچھ'],
        because: 'سب سے (sab se, "than all") makes the superlative.',
      },
    ],
  },

  // ---------------- ADVANCED ----------------
  {
    id: 'g-imperative',
    title: 'Requests & commands',
    summary: 'Asking politely, telling directly',
    level: 'advanced',
    explain: [
      'Politeness lives in the verb ending. To آپ (aap), add ‑یے (‑iye): بیٹھیے (baiṭhiye, "please sit"). To تم (tum), use the bare stem + و (‑o): بیٹھو (baiṭho).',
      'For an extra-gentle request, ‑یے گا (‑iye ga): آئیے گا (aaiye ga): "do come".',
      'Make it negative with مت (mat, for commands) or نہ (na): مت جاؤ (mat jaao): "don\'t go".',
    ],
    table: {
      heading: ['To whom', 'Ending', 'Example'],
      rows: [
        ['آپ (polite)', '‑یے', 'کیجیے'],
        ['تم (casual)', '‑و', 'کرو'],
        ['very polite', '‑یے گا', 'کیجیے گا'],
      ],
      rowsRoman: [
        ['aap (polite)', '‑iye', 'kijiye (please do it)'],
        ['tum (casual)', '‑o', 'karo (do it)'],
        ['very polite', '‑iye ga', 'kijiye ga (do it, please)'],
      ],
    },
    examples: [
      { urdu: 'اندر تشریف لائیے', roman: 'andar tashreef laaiye', meaning: 'Please come in' },
      { urdu: 'ذرا آہستہ بولیے', roman: 'zara aahista boliye', meaning: 'Please speak slowly' },
      { urdu: 'یہاں مت بیٹھو', roman: 'yahaañ mat baiṭho', meaning: "Don't sit here" },
    ],
    drills: [
      {
        id: 'g-imp-d1',
        prompt: 'ذرا سن___',
        promptRoman: 'zara sun___',
        meaning: 'Please listen (polite)',
        answer: 'یے',
        options: ['یے', 'و', 'تا', 'گا'],
        because: 'The polite imperative for آپ (aap) ends in ‑یے (‑iye).',
      },
    ],
  },
  {
    id: 'g-subjunctive',
    title: 'The subjunctive',
    summary: 'Maybe, should, if: the "unreal" mood',
    level: 'advanced',
    explain: [
      'The subjunctive covers wishes, suggestions, doubts and "if", things not stated as fact.',
      'Forms are the future without گا (ga): میں جاؤں (main jaaoon, that I go), وہ جائے (wo jaaye, that he go), ہم جائیں (ham jaayeñ, that we go).',
      'Use it after اگر (agar, if), شاید (shaayad, perhaps), and to suggest: چلیں؟ (chaleñ?): "shall we go?" Its negative is نہ (na), not نہیں (nahiñ).',
    ],
    examples: [
      { urdu: 'شاید وہ آئے', roman: 'shaayad wo aaye', meaning: 'Perhaps he will come' },
      { urdu: 'اگر وقت ہو تو ملیں', roman: 'agar waqt ho to mileñ', meaning: 'If there is time, let us meet' },
      { urdu: 'میں کیا کروں؟', roman: 'main kya karoon?', meaning: 'What should I do?' },
    ],
    drills: [
      {
        id: 'g-subj-d1',
        prompt: 'شاید وہ کل ___',
        promptRoman: 'shaayad wo kal ___',
        meaning: 'Perhaps he will come tomorrow',
        answer: 'آئے',
        options: ['آئے', 'آیا', 'آتا ہے', 'آئے گا'],
        because: 'شاید (shaayad, perhaps) takes the subjunctive.',
      },
    ],
  },
  {
    id: 'g-perfect',
    title: 'Completed actions',
    summary: 'Perfect & pluperfect: has done, had done',
    level: 'advanced',
    explain: [
      'Add the right form of "to be" to the past participle: وہ گیا ہے (wo gaya hai): "he has gone"; وہ گیا تھا (wo gaya tha): "he had gone".',
      'With transitive verbs in the past, Urdu marks the doer with نے (ne) and the verb agrees with the *object*, not the subject: اُس نے کتاب پڑھی (us ne kitaab paṛhi): "he read the book" (پڑھی/paṛhi is feminine to match کتاب/kitaab).',
      'This نے (ne) construction surprises most learners. Intransitive verbs like جانا (jaana) and آنا (aana) never use it.',
    ],
    examples: [
      { urdu: 'وہ گھر گیا ہے', roman: 'wo ghar gaya hai', meaning: 'He has gone home' },
      { urdu: 'میں نے کھانا کھایا', roman: 'main ne khaana khaaya', meaning: 'I ate the food' },
      { urdu: 'اُس نے خط لکھا تھا', roman: 'us ne khat likha tha', meaning: 'He had written the letter' },
    ],
    drills: [
      {
        id: 'g-perf-d1',
        prompt: 'میں ___ کھانا کھایا',
        promptRoman: 'main ___ khaana khaaya',
        meaning: 'I ate the food',
        answer: 'نے',
        options: ['نے', 'کو', 'سے', 'میں'],
        because: 'Transitive verbs in the past take نے (ne) after the subject.',
      },
    ],
  },
  {
    id: 'g-relative',
    title: 'Relative clauses',
    summary: 'jo … wo: the sentence that comes in pairs',
    level: 'advanced',
    explain: [
      'English says "the man who came is my friend". Urdu builds it as a matched pair: جو آدمی آیا، وہ میرا دوست ہے (jo aadmi aaya, wo mera dost hai): "which man came, that one is my friend".',
      'The j‑ word opens the clause and the corresponding word closes it. Learn them as couples: جو…وہ (jo…wo), جہاں…وہاں (jahaañ…wahaañ), جب…تب (jab…tab), جتنا…اتنا (jitna…utna), جیسا…ویسا (jaisa…waisa).',
      'The جو (jo) half normally comes first. It sounds formal in English, but in Urdu it is the ordinary, everyday way to say it.',
    ],
    table: {
      heading: ['Opener', 'Partner', 'Meaning'],
      rows: [
        ['جو', 'وہ', 'who / which … that'],
        ['جہاں', 'وہاں', 'where … there'],
        ['جب', 'تب', 'when … then'],
        ['جتنا', 'اتنا', 'as much as'],
        ['جیسا', 'ویسا', 'just as … so'],
      ],
      rowsRoman: [
        ['jo', 'wo', ''],
        ['jahaañ', 'wahaañ', ''],
        ['jab', 'tab', ''],
        ['jitna', 'utna', ''],
        ['jaisa', 'waisa', ''],
      ],
    },
    examples: [
      { urdu: 'جو کتاب میز پر ہے، وہ میری ہے', roman: 'jo kitaab mez par hai, wo meri hai', meaning: 'The book that is on the table is mine' },
      { urdu: 'جب بارش ہوتی ہے، تب ٹھنڈ ہوتی ہے', roman: 'jab baarish hoti hai, tab ṭhanḍ hoti hai', meaning: 'When it rains, it gets cold' },
      { urdu: 'جہاں چاہ، وہاں راہ', roman: 'jahaañ chaah, wahaañ raah', meaning: 'Where there is a will, there is a way' },
    ],
    drills: [
      {
        id: 'g-rel-d1',
        prompt: '___ آدمی آیا، وہ استاد ہے',
        promptRoman: '___ aadmi aaya, wo ustaad hai',
        meaning: 'The man who came is a teacher',
        answer: 'جو',
        options: ['جو', 'وہ', 'کون', 'یہ'],
        because: 'جو (jo) opens the clause and وہ (wo) answers it.',
      },
      {
        id: 'g-rel-d2',
        prompt: 'جہاں آپ رہتے ہیں، ___ میں بھی رہتا ہوں',
        promptRoman: 'jahaañ aap rehte hain, ___ main bhi rehta hoon',
        meaning: 'Where you live, I live too',
        answer: 'وہاں',
        options: ['وہاں', 'یہاں', 'کہاں', 'جہاں'],
        because: 'جہاں (jahaañ) is always answered by وہاں (wahaañ).',
      },
    ],
  },
  {
    id: 'g-compound',
    title: 'Compound verbs',
    summary: 'The little verb that adds colour',
    level: 'advanced',
    explain: [
      'Urdu often pairs a main verb stem with a second, "helper" verb that adds nuance rather than meaning. کھانا (khaana) is "to eat"; کھا لینا (kha lena) is "to eat up".',
      'لینا (lena) points the action back at the doer, دینا (dena) points it outward at someone else. اُس نے کتاب پڑھ لی (us ne kitaab paṛh li, read it for himself) vs اُس نے کتاب پڑھ دی (us ne kitaab paṛh di, read it out to someone).',
      'جانا (jaana) marks completion: سو جانا (so jaana, "fall asleep"), بیٹھ جانا (baiṭh jaana, "sit down"); and ڈالنا (ḍaalna) makes it forceful or sudden. Using these is what makes Urdu sound natural rather than translated.',
    ],
    table: {
      heading: ['Helper', 'Adds', 'Example'],
      rows: [
        ['لینا', 'for oneself', 'کھا لینا'],
        ['دینا', 'for another', 'دے دینا'],
        ['جانا', 'completion', 'سو جانا'],
        ['ڈالنا', 'force / suddenness', 'توڑ ڈالنا'],
      ],
      rowsRoman: [
        ['lena', '', 'kha lena (to eat up)'],
        ['dena', '', 'de dena (to give away)'],
        ['jaana', '', 'so jaana (to fall asleep)'],
        ['ḍaalna', '', 'toṛ ḍaalna (to smash)'],
      ],
    },
    examples: [
      { urdu: 'میں نے کھانا کھا لیا', roman: 'main ne khaana kha liya', meaning: 'I ate the food (all of it)' },
      { urdu: 'وہ سو گیا', roman: 'wo so gaya', meaning: 'He fell asleep' },
      { urdu: 'مجھے کتاب دے دو', roman: 'mujhe kitaab de do', meaning: 'Give me the book' },
    ],
    drills: [
      {
        id: 'g-comp2-d1',
        prompt: 'بچہ سو ___',
        promptRoman: 'bachcha so ___',
        meaning: 'The child fell asleep',
        answer: 'گیا',
        options: ['گیا', 'لیا', 'دیا', 'ڈالا'],
        because: 'جانا (jaana) marks the action as completed, he went from awake to asleep.',
      },
    ],
  },
  {
    id: 'g-passive',
    title: 'The passive',
    summary: 'When the doer disappears',
    level: 'advanced',
    explain: [
      'To say a thing was done without naming who did it, use the past participle plus جانا (jaana): خط لکھا گیا (khat likha gaya): "the letter was written".',
      'The participle agrees with the thing it happened to: کتاب پڑھی گئی (kitaab paṛhi gayi, feminine), خط لکھے گئے (khat likhe gaye, masculine plural).',
      'If you do want to name the agent, mark them with سے (se): یہ کام مجھ سے نہیں ہوا (ye kaam mujh se nahiñ hua): "this work could not be done by me". Urdu also uses the passive to soften a refusal.',
    ],
    examples: [
      { urdu: 'دروازہ کھولا گیا', roman: 'darwaaza khola gaya', meaning: 'The door was opened' },
      { urdu: 'یہ کتاب اردو میں لکھی گئی', roman: 'ye kitaab urdu meñ likhi gayi', meaning: 'This book was written in Urdu' },
      { urdu: 'کھانا تیار کیا جا رہا ہے', roman: 'khaana tayyaar kiya ja raha hai', meaning: 'The food is being prepared' },
    ],
    drills: [
      {
        id: 'g-pass-d1',
        prompt: 'خط لکھا ___',
        promptRoman: 'khat likha ___',
        meaning: 'The letter was written',
        answer: 'گیا',
        options: ['گیا', 'گئی', 'گئے', 'جانا'],
        because: 'خط (khat) is masculine singular, so جانا (jaana) becomes گیا (gaya).',
      },
    ],
  },
  {
    id: 'g-causative',
    title: 'Causatives',
    summary: 'Do it · make someone do it · have it done',
    level: 'advanced',
    explain: [
      'Urdu grows new verbs out of old ones. From one root you get three: doing it yourself, making someone do it, and having it done through a third person.',
      'The pattern is regular. کرنا (karna, to do) → کرانا (karaana, to make someone do) → کروانا (karwaana, to get it done). بننا (banna, to be made) → بنانا (banaana, to make) → بنوانا (banwaana, to have made).',
      'میں نے کھانا بنایا (main ne khaana banaaya) means "I cooked". میں نے کھانا بنوایا (main ne khaana banwaaya) means "I had the food cooked", by someone else. One extra syllable changes who did the work.',
    ],
    table: {
      heading: ['Base', 'Causative', 'Double causative'],
      rows: [
        ['کرنا (do)', 'کرانا', 'کروانا'],
        ['پڑھنا (read)', 'پڑھانا (teach)', 'پڑھوانا'],
        ['بننا (be made)', 'بنانا (make)', 'بنوانا'],
        ['کھانا (eat)', 'کھلانا (feed)', 'کھلوانا'],
      ],
      rowsRoman: [
        ['karna (do)', 'karaana', 'karwaana'],
        ['paṛhna (read)', 'paṛhaana (teach)', 'paṛhwaana'],
        ['banna (be made)', 'banaana (make)', 'banwaana'],
        ['khaana (eat)', 'khilaana (feed)', 'khilwaana'],
      ],
    },
    examples: [
      { urdu: 'وہ بچوں کو اردو پڑھاتی ہے', roman: 'wo bachchoñ ko urdu paṛhaati hai', meaning: 'She teaches Urdu to the children' },
      { urdu: 'میں نے کپڑے سلوائے', roman: 'main ne kapṛe silwaaye', meaning: 'I had the clothes stitched' },
      { urdu: 'ماں نے بچے کو کھانا کھلایا', roman: 'maañ ne bachche ko khaana khilaaya', meaning: 'The mother fed the child' },
    ],
    drills: [
      {
        id: 'g-caus-d1',
        prompt: 'استاد بچوں کو ___ ہیں',
        promptRoman: 'ustaad bachchoñ ko ___ hain',
        meaning: 'The teacher teaches the children',
        answer: 'پڑھاتے',
        options: ['پڑھاتے', 'پڑھتے', 'پڑھواتے', 'پڑھے'],
        because: 'پڑھنا (paṛhna) is "to read"; the causative پڑھانا (paṛhaana) is "to teach".',
      },
    ],
  },
];

export const getGrammar = (id: string) => GRAMMAR.find((g) => g.id === id);
export const grammarByLevel = (level: Level) => GRAMMAR.filter((g) => g.level === level);
