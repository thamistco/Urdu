/**
 * The Urdu letter set — taught by POSITION FORM, which is Harf's core thesis.
 *
 * Every letter is shown in four "faces":
 *   alone (isolated) · start (initial) · middle (medial) · end (final)
 *
 * Position glyphs are built with the Arabic tatweel (ـ, U+0640) as a joining
 * stub, so learners see how the shape connects. Non-connecting letters
 * (alif, daal, re, waw, …) only ever join from the RIGHT — they never fuse to
 * the letter that follows — so their "start" looks like alone and their
 * "middle" looks like end. `connects: false` marks these, and the UI explains
 * it rather than pretending all letters behave the same.
 */

const T = 'ـ'; // tatweel / kashida

import type { IconName } from '../art/icons';

export type LetterForms = {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
};

export type Letter = {
  id: string;
  name: string;
  sound: string;
  /** Does it connect to the following letter? */
  connects: boolean;
  forms: LetterForms;
  word: string;
  roman: string;
  meaning: string;
  emoji: string;
  /**
   * A drawn illustration to use instead of the emoji. Some of these words have
   * no emoji at all (there is no pomegranate) and some of the near-misses are
   * actively wrong — the apple that stood in for انار was the same glyph as
   * the apple for سیب.
   */
  icon?: IconName;
  note: string;
  /** Rough teaching group for the learning path. */
  group: number;
  /**
   * URD-022: the id of the letter this one is visually confusable with
   * within its own teaching group — same base shape, distinguished only by
   * a dot or diacritic (e.g. `pe`'s bowl is `be`'s with two extra dots).
   * Unset for a group's "base" letter; every letter that shares a bucket
   * (base plus all its variants) points at the same base id, so the
   * exercise generator can keep them apart within a lesson's rounds
   * instead of drilling them back to back. Derived conservatively from
   * each letter's own curated `note` above — only pairs the note itself
   * describes as sharing a shape ("same bowl as", "X with N dots", "X
   * with the retroflex mark") are marked, nothing inferred beyond that.
   */
  confusableWith?: string;
};

function connector(base: string): LetterForms {
  return {
    isolated: base,
    initial: base + T,
    medial: T + base + T,
    final: T + base,
  };
}

function nonConnector(base: string): LetterForms {
  // Joins only from the right: start == alone, middle == end.
  return {
    isolated: base,
    initial: base,
    medial: T + base,
    final: T + base,
  };
}

export const LETTERS: Letter[] = [
  // ---- Group 1: first friends -------------------------------------------
  {
    id: 'alif',
    name: 'alif',
    sound: 'a / aa',
    connects: false,
    forms: nonConnector('ا'),
    word: 'انار',
    roman: 'anaar',
    meaning: 'pomegranate',
    emoji: '🍎',
    icon: 'pomegranate',
    group: 1,
    note: 'A single upright stroke. It never joins to the letter after it, a natural break in the word.',
  },
  {
    id: 'alif-madda',
    name: 'alif madda',
    sound: 'aa',
    connects: false,
    forms: nonConnector('آ'),
    word: 'آم',
    roman: 'aam',
    meaning: 'mango',
    emoji: '🥭',
    group: 1,
    note: 'Alif wearing a wavy hat (madda). It starts a word with a long “aa”, alif alone cannot do that at the beginning.',
    confusableWith: 'alif',
  },
  {
    id: 'be',
    name: 'be',
    sound: 'b',
    connects: true,
    forms: connector('ب'),
    word: 'بلی',
    roman: 'billi',
    meaning: 'cat',
    emoji: '🐈',
    group: 1,
    note: 'One dot below. The bowl stays shallow in Nastaliq, it sits, it does not scoop.',
  },
  {
    id: 'pe',
    name: 'pe',
    sound: 'p',
    connects: true,
    forms: connector('پ'),
    word: 'پانی',
    roman: 'paani',
    meaning: 'water',
    emoji: '💧',
    group: 1,
    note: 'Same bowl as be, but three dots below. A Persian/Urdu letter, Arabic has no p.',
    confusableWith: 'be',
  },
  {
    id: 'te',
    name: 'te',
    sound: 't',
    connects: true,
    forms: connector('ت'),
    word: 'تارا',
    roman: 'taara',
    meaning: 'star',
    emoji: '⭐',
    group: 1,
    note: 'Two dots above. Soft dental t, tongue on the teeth, not the ridge.',
  },
  {
    id: 'Te',
    name: 'Te',
    sound: 'ṭ (hard)',
    connects: true,
    forms: connector('ٹ'),
    word: 'ٹماٹر',
    roman: 'ṭamaaṭar',
    meaning: 'tomato',
    emoji: '🍅',
    group: 1,
    note: 'A small mark above, shaped like ط (to’e), marks the retroflex “hard” t. Curl the tongue back.',
  },

  // ---- Group 2 -----------------------------------------------------------
  {
    id: 'se',
    name: 'se',
    sound: 's',
    connects: true,
    forms: connector('ث'),
    word: 'ثمر',
    roman: 'samar',
    meaning: 'fruit',
    emoji: '🍇',
    group: 2,
    note: 'Three dots above. In Urdu it sounds exactly like seen, one of three letters spelling the same “s”.',
  },
  {
    id: 'jeem',
    name: 'jeem',
    sound: 'j',
    connects: true,
    forms: connector('ج'),
    word: 'جہاز',
    roman: 'jahaaz',
    meaning: 'ship / plane',
    emoji: '✈️',
    group: 2,
    note: 'A deep hook with one dot inside. The dot rides low, tucked in the belly.',
  },
  {
    id: 'che',
    name: 'che',
    sound: 'ch',
    connects: true,
    forms: connector('چ'),
    word: 'چاند',
    roman: 'chaand',
    meaning: 'moon',
    emoji: '🌙',
    group: 2,
    note: 'The jeem shape with three dots. Say “ch” as in chair.',
    confusableWith: 'jeem',
  },
  {
    id: 'baRi-he',
    name: 'baṛī he',
    sound: 'h',
    connects: true,
    forms: connector('ح'),
    word: 'حلوہ',
    roman: 'halwa',
    meaning: 'sweet dish',
    emoji: '🍮',
    group: 2,
    note: 'A dotless deep curve. In Urdu it sounds the same as choṭī he, an ordinary h.',
  },
  {
    id: 'khe',
    name: 'khe',
    sound: 'kh',
    connects: true,
    forms: connector('خ'),
    word: 'خط',
    roman: 'khat',
    meaning: 'letter (mail)',
    emoji: '✉️',
    group: 2,
    note: 'One dot above the ح (baṛī he) curve. A raspy “kh”, like clearing the throat gently.',
    confusableWith: 'baRi-he',
  },

  // ---- Group 3: the non-joiners -----------------------------------------
  {
    id: 'daal',
    name: 'daal',
    sound: 'd',
    connects: false,
    forms: nonConnector('د'),
    word: 'دل',
    roman: 'dil',
    meaning: 'heart',
    emoji: '❤️',
    group: 3,
    note: 'A soft angled stroke. It never joins forward, so the next letter starts fresh.',
  },
  {
    id: 'Daal',
    name: 'Ḍaal',
    sound: 'ḍ (hard)',
    connects: false,
    forms: nonConnector('ڈ'),
    word: 'ڈبہ',
    roman: 'ḍabba',
    meaning: 'box',
    emoji: '📦',
    group: 3,
    note: 'Daal with the retroflex mark, the hard d made with the tongue curled back.',
    confusableWith: 'daal',
  },
  {
    id: 'zaal',
    name: 'zaal',
    sound: 'z',
    connects: false,
    forms: nonConnector('ذ'),
    word: 'ذرا',
    roman: 'zara',
    meaning: 'a little',
    emoji: '🤏',
    group: 3,
    note: 'Daal with one dot above. One of three “z” spellings inherited from Arabic/Persian, not Urdu’s everyday “z” (that’s ز, ze): anchor it to this word, ذرا (zara, “a little”), rather than guessing.',
    confusableWith: 'daal',
  },
  {
    id: 're',
    name: 're',
    sound: 'r',
    connects: false,
    forms: nonConnector('ر'),
    word: 'روٹی',
    roman: 'roṭi',
    meaning: 'bread',
    emoji: '🫓',
    group: 3,
    note: 'A shallow curve that dips below the line. Lightly rolled r.',
  },
  {
    id: 'Re',
    name: 'Ṛe',
    sound: 'ṛ',
    connects: false,
    forms: nonConnector('ڑ'),
    word: 'گھڑی',
    roman: 'ghaṛi',
    meaning: 'watch / clock',
    emoji: '⌚',
    group: 3,
    note: 'Re with the retroflex mark, a flapped, curled r with no true English match.',
    confusableWith: 're',
  },
  {
    id: 'ze',
    name: 'ze',
    sound: 'z',
    connects: false,
    forms: nonConnector('ز'),
    word: 'زمین',
    roman: 'zameen',
    meaning: 'earth / land',
    emoji: '🌍',
    group: 3,
    note: 'Re with one dot above. The everyday “z”, the one to reach for by default in native and Persian vocabulary alike (زندگی/zindagi “life”, بازار/bazaar “market”). ذ ض ظ, not this, are the three reserved for words borrowed from Arabic.',
    confusableWith: 're',
  },
  {
    id: 'zhe',
    name: 'zhe',
    sound: 'zh',
    connects: false,
    forms: nonConnector('ژ'),
    word: 'ژالہ',
    roman: 'zhaala',
    meaning: 'hail',
    emoji: '🧊',
    group: 3,
    note: 'Re with three dots, a rare “zh” sound, like the s in “measure”.',
    confusableWith: 're',
  },

  // ---- Group 4 -----------------------------------------------------------
  {
    id: 'seen',
    name: 'seen',
    sound: 's',
    connects: true,
    forms: connector('س'),
    word: 'سیب',
    roman: 'seb',
    meaning: 'apple',
    emoji: '🍎',
    group: 4,
    note: 'Three teeth. When it joins forward the teeth flatten almost to a line.',
  },
  {
    id: 'sheen',
    name: 'sheen',
    sound: 'sh',
    connects: true,
    forms: connector('ش'),
    word: 'شیر',
    roman: 'sher',
    meaning: 'lion',
    emoji: '🦁',
    group: 4,
    note: 'Seen with three dots above the teeth. Say “sh”.',
    confusableWith: 'seen',
  },
  {
    id: 'swaad',
    name: 'swaad',
    sound: 's',
    connects: true,
    forms: connector('ص'),
    word: 'صابن',
    roman: 'saabun',
    meaning: 'soap',
    emoji: '🧼',
    group: 4,
    note: 'A wide loop with a tail. In Urdu it sounds the same as seen, the spelling is inherited from Arabic.',
  },
  {
    id: 'zwaad',
    name: 'zwaad',
    sound: 'z',
    connects: true,
    forms: connector('ض'),
    word: 'ضرب',
    roman: 'zarb',
    meaning: 'multiply / strike',
    emoji: '✖️',
    group: 4,
    note: 'Swaad with one dot above. One of three “z” spellings inherited from Arabic/Persian, not Urdu’s everyday “z” (that’s ز, ze): anchor it to this word, ضرب (zarb, “multiply/strike”), rather than guessing.',
    confusableWith: 'swaad',
  },

  // ---- Group 5 -----------------------------------------------------------
  {
    id: 'toe',
    name: 'to’e',
    sound: 't',
    connects: true,
    forms: connector('ط'),
    word: 'طوطا',
    roman: 'toota',
    meaning: 'parrot',
    emoji: '🦜',
    group: 5,
    note: 'A loop with an upright stroke. In Urdu it sounds like te, the soft dental t.',
  },
  {
    id: 'zoe',
    name: 'zo’e',
    sound: 'z',
    connects: true,
    forms: connector('ظ'),
    word: 'ظرف',
    roman: 'zarf',
    meaning: 'vessel',
    emoji: '🏺',
    group: 5,
    note: 'To’e with one dot above. One of three “z” spellings inherited from Arabic/Persian, not Urdu’s everyday “z” (that’s ز, ze): anchor it to this word, ظرف (zarf, “vessel”), rather than guessing.',
    confusableWith: 'toe',
  },
  {
    id: 'ain',
    name: 'ain',
    sound: 'a / ‘ (silent)',
    connects: true,
    forms: connector('ع'),
    word: 'عینک',
    roman: 'ainak',
    meaning: 'glasses',
    emoji: '👓',
    group: 5,
    note: 'It shifts shape completely, so its four forms look very different. In Urdu it is not a throat sound: it usually just carries a vowel, or is silent.',
  },
  {
    id: 'ghain',
    name: 'ghain',
    sound: 'gh',
    connects: true,
    forms: connector('غ'),
    word: 'غبارہ',
    roman: 'ghubaara',
    meaning: 'balloon',
    emoji: '🎈',
    group: 5,
    note: 'Ain with one dot above. A gargled “gh”, like a French r.',
    confusableWith: 'ain',
  },

  // ---- Group 6 -----------------------------------------------------------
  {
    id: 'fe',
    name: 'fe',
    sound: 'f',
    connects: true,
    forms: connector('ف'),
    word: 'فون',
    roman: 'fon',
    meaning: 'phone',
    emoji: '📱',
    group: 6,
    note: 'A small head with one dot above and a tail. Straightforward “f”.',
  },
  {
    id: 'qaaf',
    name: 'qaaf',
    sound: 'q',
    connects: true,
    forms: connector('ق'),
    word: 'قلم',
    roman: 'qalam',
    meaning: 'pen',
    emoji: '🖊️',
    group: 6,
    note: 'Two dots above a deep bowl. A “q” made further back than k.',
  },
  {
    id: 'kaaf',
    name: 'kaaf',
    sound: 'k',
    connects: true,
    forms: connector('ک'),
    word: 'کتاب',
    roman: 'kitaab',
    meaning: 'book',
    emoji: '📖',
    group: 6,
    note: 'The stroke on top is part of the letter, not an accent. Do not drop it.',
  },
  {
    id: 'gaaf',
    name: 'gaaf',
    sound: 'g',
    connects: true,
    forms: connector('گ'),
    // CURRICULUM CRITIC, URD-020: the previous example word, گھر (ghar,
    // "house"), puts gaaf directly before do-chashmi-he — the aspirated "gh"
    // digraph do-chashmi-he's own note already names as a distinct sound
    // from a letter's plain one, the same pattern applying here as g→gh.
    // Now newly promoted into a real, graded exercise (URD-020: this
    // `word` field used to be unused by the lesson generator, only shown
    // on `LetterLabScreen`), a learner hears "ghar," not gaaf's own plain
    // "g". گلاب (gulab, "rose") keeps gaaf isolated from any digraph.
    word: 'گلاب',
    roman: 'gulab',
    meaning: 'rose',
    emoji: '🌹',
    icon: 'flower',
    group: 6,
    note: 'Kaaf with a second stroke on top, the tell for a hard “g”.',
    confusableWith: 'kaaf',
  },

  // ---- Group 7: the finishers -------------------------------------------
  {
    id: 'laam',
    name: 'laam',
    sound: 'l',
    connects: true,
    forms: connector('ل'),
    word: 'لڑکا',
    roman: 'laṛka',
    meaning: 'boy',
    emoji: '👦',
    group: 7,
    note: 'A tall stroke curving into a bowl at the end. Clear “l”.',
  },
  {
    id: 'meem',
    name: 'meem',
    sound: 'm',
    connects: true,
    forms: connector('م'),
    word: 'ماں',
    roman: 'maan',
    meaning: 'mother',
    emoji: '🤱',
    group: 7,
    note: 'A small closed loop with a tail. The tail only appears at the end of a word.',
  },
  {
    id: 'noon',
    name: 'noon',
    sound: 'n',
    connects: true,
    forms: connector('ن'),
    word: 'نام',
    roman: 'naam',
    meaning: 'name',
    emoji: '✍️',
    group: 7,
    note: 'Deep bowl, one dot above. Joined forward it looks like be, the dot is the only tell.',
  },
  {
    id: 'noon-ghunna',
    name: 'noon ghunna',
    sound: 'ñ (nasal)',
    connects: false,
    forms: nonConnector('ں'),
    word: 'ہاں',
    roman: 'haañ',
    meaning: 'yes',
    emoji: '✅',
    icon: 'check',
    group: 7,
    note: 'A dotless noon at the end of a word, it nasalises the vowel before it.',
    confusableWith: 'noon',
  },
  {
    id: 'waw',
    name: 'waaw',
    sound: 'w / o / u',
    connects: false,
    forms: nonConnector('و'),
    word: 'وقت',
    roman: 'waqt',
    meaning: 'time',
    emoji: '⏰',
    group: 7,
    note: 'A round head with a tail. It never joins forward, and doubles as the vowels o and u.',
  },

  // ---- Group 8: the h family & vowely ends ------------------------------
  {
    id: 'choti-he',
    name: 'choṭī he',
    sound: 'h',
    connects: true,
    forms: connector('ہ'),
    word: 'ہاتھی',
    roman: 'haathi',
    meaning: 'elephant',
    emoji: '🐘',
    group: 8,
    note: 'The “small” h. Its four faces look remarkably different, watch them shift.',
  },
  {
    id: 'do-chashmi-he',
    name: 'do chashmī he',
    sound: 'h (aspirate)',
    connects: true,
    forms: connector('ھ'),
    word: 'کھانا',
    roman: 'khaana',
    meaning: 'food',
    emoji: '🍲',
    group: 8,
    note: 'The h with two eyes. It never stands alone in meaning, it aspirates the letter before it (k→kh, b→bh).',
  },
  {
    id: 'hamza',
    name: 'hamza',
    sound: 'ʔ (glottal)',
    connects: false,
    forms: {
      isolated: 'ء',
      initial: 'ء',
      medial: 'ئ',
      final: 'ٔ',
    },
    word: 'چائے',
    roman: 'chaa’e',
    meaning: 'tea',
    emoji: '🍵',
    group: 8,
    note: 'A tiny mark, not a full letter, a catch in the voice between two vowels.',
  },
  {
    id: 'choti-ye',
    name: 'choṭī ye',
    sound: 'y / ee',
    connects: true,
    forms: connector('ی'),
    word: 'یاد',
    roman: 'yaad',
    meaning: 'memory',
    emoji: '💭',
    group: 8,
    note: 'Serves as “y” and the long vowel “ee”. Two dots below appear in some styles.',
  },
  {
    id: 'baRi-ye',
    name: 'baṛī ye',
    sound: 'e / ai',
    connects: false,
    forms: {
      isolated: 'ے',
      initial: 'یـ',
      medial: T + 'یـ',
      final: 'ـے',
    },
    // CURRICULUM CRITIC, URD-020: میز (mez, "table") — م ی ز, choti-ye not
    // baRi-ye — does not contain this letter's own glyph anywhere, in any
    // position. Only shown on `LetterLabScreen` before this fix; a lesson
    // generator search that draws on `Letter.word` would have promoted this
    // false example into a real, graded exercise. جوتے (joote, "shoes")
    // ends in ے, the exact final-position "e/ai" sound this letter's own
    // note below describes — چائے was tried first but `audit-content.js`
    // caught it already belonging to `hamza` (its ئ, hamza on ye, sits in
    // the same word), so the two letters would have shared one example.
    word: 'جوتے',
    roman: 'joote',
    meaning: 'shoes',
    emoji: '👟',
    group: 8,
    note: 'The “big” ye, a wide sweeping tail used at the end of words for the “e/ai” sound.',
    confusableWith: 'choti-ye',
  },
];

export const POSITIONS = [
  { key: 'isolated', label: 'Alone', hint: 'standing by itself' },
  { key: 'initial', label: 'Start', hint: 'first letter of a word' },
  { key: 'medial', label: 'Middle', hint: 'joined on both sides' },
  { key: 'final', label: 'End', hint: 'last letter of a word' },
] as const;

export type PositionKey = (typeof POSITIONS)[number]['key'];

export const getLetter = (id: string) => LETTERS.find((l) => l.id === id);
