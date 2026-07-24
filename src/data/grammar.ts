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
  /** a small table of forms, when the concept has a paradigm */
  table?: { heading: string[]; rows: string[][] };
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
      'Urdu pronouns do not change for gender — میں means "I" whether you are a man or a woman.',
      'There are three words for "you". آپ is polite and safe with anyone. تم is casual, for friends and children. تو is very intimate and can sound rude — leave it alone at first.',
      'وہ does double duty: it means "he", "she" and "they", and also "that". Context tells you which.',
    ],
    table: {
      heading: ['Urdu', 'Roman', 'Meaning'],
      rows: [
        ['میں', 'main', 'I'],
        ['ہم', 'ham', 'we'],
        ['آپ', 'aap', 'you (polite)'],
        ['تم', 'tum', 'you (casual)'],
        ['یہ', 'ye', 'he/she/this (near)'],
        ['وہ', 'wo', 'he/she/that (far)'],
      ],
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
        because: 'ہیں is the verb form that goes with آپ.',
      },
      {
        id: 'g-pronouns-d2',
        prompt: '___ پانی پیتا ہوں',
        promptRoman: '___ paani peeta hoon',
        meaning: 'I drink water',
        answer: 'میں',
        options: ['میں', 'تم', 'آپ', 'یہ'],
        because: 'ہوں only ever follows میں.',
      },
    ],
  },
  {
    id: 'g-to-be',
    title: 'The verb "to be"',
    summary: 'ہوں · ہے · ہیں — am, is, are',
    level: 'beginner',
    explain: [
      'Urdu sentences usually end with the verb. The commonest verb is ہونا, "to be".',
      'Pick the ending by who you are talking about: ہوں after میں, ہے after a single person or thing, ہیں after آپ, ہم, and plurals.',
      'There is no word for "a" or "an" — "I am a doctor" is simply میں ڈاکٹر ہوں.',
    ],
    table: {
      heading: ['Pronoun', 'to be', 'Example'],
      rows: [
        ['میں', 'ہوں (hoon)', 'میں خوش ہوں'],
        ['تم', 'ہو (ho)', 'تم خوش ہو'],
        ['یہ / وہ', 'ہے (hai)', 'وہ خوش ہے'],
        ['ہم / آپ / وہ (pl.)', 'ہیں (hain)', 'ہم خوش ہیں'],
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
        because: 'میں always takes ہوں.',
      },
      {
        id: 'g-tobe-d2',
        prompt: 'وہ میرا بھائی ___',
        promptRoman: 'wo mera bhai ___',
        meaning: 'He is my brother',
        answer: 'ہے',
        options: ['ہے', 'ہوں', 'ہیں', 'ہو'],
        because: 'One person or thing takes ہے.',
      },
      {
        id: 'g-tobe-d3',
        prompt: 'آپ کہاں ___؟',
        promptRoman: 'aap kahaañ ___?',
        meaning: 'Where are you?',
        answer: 'ہیں',
        options: ['ہیں', 'ہے', 'ہوں', 'ہو'],
        because: 'آپ takes the plural-polite ہیں.',
      },
    ],
  },
  {
    id: 'g-gender',
    title: 'Gender & number',
    summary: 'Every noun is masculine or feminine',
    level: 'beginner',
    explain: [
      'Every Urdu noun is either masculine or feminine — there is no "it". لڑکا (boy) is masculine, لڑکی (girl) is feminine.',
      'A useful rule of thumb: nouns ending in ‑ا are usually masculine, and those ending in ‑ی are usually feminine. There are exceptions, but it will carry you a long way.',
      'Adjectives that end in ‑ا change to match: اچھا لڑکا (good boy) but اچھی لڑکی (good girl), and اچھے لڑکے for the plural.',
    ],
    table: {
      heading: ['', 'Singular', 'Plural'],
      rows: [
        ['Masculine', 'اچھا لڑکا', 'اچھے لڑکے'],
        ['Feminine', 'اچھی لڑکی', 'اچھی لڑکیاں'],
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
        because: 'لڑکی is feminine, so the adjective ends in ‑ی.',
      },
      {
        id: 'g-gender-d2',
        prompt: '___ گھر',
        promptRoman: '___ ghar',
        meaning: 'a big house',
        answer: 'بڑا',
        options: ['بڑا', 'بڑی', 'بڑے', 'بڑیاں'],
        because: 'گھر is masculine singular, so the adjective ends in ‑ا.',
      },
    ],
  },

  // ---------------- ELEMENTARY ----------------
  {
    id: 'g-possess',
    title: 'Possession — کا، کی، کے',
    summary: "Urdu's version of apostrophe-s",
    level: 'elementary',
    explain: [
      'To say "X\'s Y", put کا between them: علی کا گھر — "Ali\'s house".',
      'کا behaves like an adjective: it agrees with the thing owned, not the owner. Masculine → کا, feminine → کی, masculine plural → کے.',
      'The possessive pronouns follow the same pattern: میرا / میری (my), تمہارا (your), اُس کا (his/her), ہمارا (our), آپ کا (your, polite).',
    ],
    table: {
      heading: ['Thing owned', 'Form', 'Example'],
      rows: [
        ['Masculine sing.', 'کا', 'علی کا بیٹا'],
        ['Feminine', 'کی', 'علی کی بیٹی'],
        ['Masculine plural', 'کے', 'علی کے بیٹے'],
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
        because: 'کتاب is feminine, so "my" becomes میری.',
      },
      {
        id: 'g-poss-d2',
        prompt: 'علی ___ گھر بڑا ہے',
        promptRoman: 'Ali ___ ghar baṛa hai',
        meaning: "Ali's house is big",
        answer: 'کا',
        options: ['کا', 'کی', 'کے', 'کو'],
        because: 'گھر is masculine singular → کا.',
      },
    ],
  },
  {
    id: 'g-postpositions',
    title: 'Postpositions',
    summary: 'Urdu puts "in, on, to" AFTER the noun',
    level: 'elementary',
    explain: [
      'English says "in the house"; Urdu says گھر میں — house-in. These little words come after the noun, so they are called postpositions.',
      'The everyday set: میں (in), پر (on), سے (from, with, by), کو (to, for), تک (up to, until), کے ساتھ (with).',
      'A noun before a postposition shifts into the oblique form — a small change you will meet next.',
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
        because: 'پر means "on".',
      },
      {
        id: 'g-post-d2',
        prompt: 'وہ اسکول ___ جاتا ہے',
        promptRoman: 'wo iskool ___ jaata hai',
        meaning: 'He goes to school',
        answer: 'کو',
        options: ['کو', 'پر', 'سے', 'میں'],
        because: 'کو marks the destination "to".',
      },
    ],
  },
  {
    id: 'g-oblique',
    title: 'The oblique case',
    summary: 'Nouns change shape before a postposition',
    level: 'elementary',
    explain: [
      'When a postposition follows, a masculine noun ending in ‑ا changes to ‑ے. لڑکا becomes لڑکے: لڑکے کو — "to the boy".',
      'Plurals take ‑وں before a postposition: لڑکوں سے — "from the boys".',
      'Feminine nouns and masculine nouns not ending in ‑ا stay as they are: کتاب میں, گھر میں.',
    ],
    table: {
      heading: ['Plain', 'Oblique', 'With postposition'],
      rows: [
        ['لڑکا', 'لڑکے', 'لڑکے کو'],
        ['لڑکے (pl.)', 'لڑکوں', 'لڑکوں سے'],
        ['کتاب', 'کتاب', 'کتاب میں'],
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
        because: 'کمرا becomes کمرے before the postposition میں.',
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
      'For things you do regularly, take the verb stem, add ‑تا / ‑تی / ‑تے, then the right form of "to be".',
      'جانا (to go) has the stem جا. So: میں جاتا ہوں — "I go" (said by a man), میں جاتی ہوں (said by a woman).',
      'This is the first place gender shows up in verbs: the ‑تا part agrees with the person doing it.',
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
        because: 'The subject is feminine singular → ‑تی.',
      },
      {
        id: 'g-pres-d2',
        prompt: 'ہم اردو بول___ ہیں',
        promptRoman: 'ham urdu bol___ hain',
        meaning: 'We speak Urdu',
        answer: 'تے',
        options: ['تے', 'تا', 'تی', 'تیں'],
        because: 'Plural subjects take ‑تے with ہیں.',
      },
    ],
  },
  {
    id: 'g-continuous',
    title: 'Present continuous',
    summary: 'What you are doing right now',
    level: 'intermediate',
    explain: [
      'For an action happening at this moment, use the stem + رہا / رہی / رہے + "to be".',
      'میں جا رہا ہوں — "I am going". The رہا part agrees with the speaker, just like ‑تا did.',
      'Compare: میں کھاتا ہوں ("I eat", generally) vs میں کھا رہا ہوں ("I am eating", now).',
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
        because: 'بارش is feminine → رہی.',
      },
    ],
  },
  {
    id: 'g-past',
    title: 'Past tense',
    summary: 'تھا · تھی · تھے — was, were',
    level: 'intermediate',
    explain: [
      'The past of "to be" is تھا. It agrees with the subject: تھا (m. sing.), تھی (f.), تھے (m. pl.), تھیں (f. pl.).',
      'میں خوش تھا — "I was happy" (man speaking); میں خوش تھی (woman speaking).',
      'Add تھا to the habitual form to get "used to": میں جاتا تھا — "I used to go".',
    ],
    table: {
      heading: ['Subject', 'was/were'],
      rows: [
        ['masculine singular', 'تھا'],
        ['feminine singular', 'تھی'],
        ['masculine plural', 'تھے'],
        ['feminine plural', 'تھیں'],
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
        because: 'کتاب is feminine singular → تھی.',
      },
    ],
  },
  {
    id: 'g-future',
    title: 'Future tense',
    summary: 'What you will do',
    level: 'intermediate',
    explain: [
      'The future adds ‑گا / ‑گی / ‑گے to the subjunctive stem: میں جاؤں گا — "I will go".',
      'The گا part agrees with the subject, exactly like the other verb endings you have met.',
      'Common forms: میں کروں گا (I will do), وہ کرے گا (he will do), ہم کریں گے (we will do).',
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
        because: 'A feminine subject takes ‑گی.',
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
      'Politeness lives in the verb ending. To آپ, add ‑یے: بیٹھیے ("please sit"). To تم, use the bare stem + و: بیٹھو.',
      'For an extra-gentle request, ‑یے گا: آئیے گا — "do come".',
      'Make it negative with مت (for commands) or نہ: مت جاؤ — "don\'t go".',
    ],
    table: {
      heading: ['To whom', 'Ending', 'Example'],
      rows: [
        ['آپ (polite)', '‑یے', 'کیجیے'],
        ['تم (casual)', '‑و', 'کرو'],
        ['very polite', '‑یے گا', 'کیجیے گا'],
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
        because: 'The polite imperative for آپ ends in ‑یے.',
      },
    ],
  },
  {
    id: 'g-subjunctive',
    title: 'The subjunctive',
    summary: 'Maybe, should, if — the "unreal" mood',
    level: 'advanced',
    explain: [
      'The subjunctive covers wishes, suggestions, doubts and "if" — things not stated as fact.',
      'Forms are the future without گا: میں جاؤں (that I go), وہ جائے (that he go), ہم جائیں (that we go).',
      'Use it after اگر (if), شاید (perhaps), and to suggest: چلیں؟ — "shall we go?" Its negative is نہ, not نہیں.',
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
        because: 'شاید (perhaps) takes the subjunctive.',
      },
    ],
  },
  {
    id: 'g-perfect',
    title: 'Completed actions',
    summary: 'Perfect & pluperfect — has done, had done',
    level: 'advanced',
    explain: [
      'Add the right form of "to be" to the past participle: وہ گیا ہے — "he has gone"; وہ گیا تھا — "he had gone".',
      'With transitive verbs in the past, Urdu marks the doer with نے and the verb agrees with the *object*, not the subject: اُس نے کتاب پڑھی — "he read the book" (پڑھی is feminine to match کتاب).',
      'This نے construction surprises most learners. Intransitive verbs like جانا and آنا never use it.',
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
        because: 'Transitive verbs in the past take نے after the subject.',
      },
    ],
  },
];

export const getGrammar = (id: string) => GRAMMAR.find((g) => g.id === id);
export const grammarByLevel = (level: Level) => GRAMMAR.filter((g) => g.level === level);
