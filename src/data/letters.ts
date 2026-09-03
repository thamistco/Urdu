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
  /**
   * What the voice clip should say, when the glyph itself will not do.
   *
   * `generate-voice.js` records a letter by synthesising its isolated form —
   * handed `ب`, a TTS engine says "be", which is exactly right for 38 of the
   * 40 letters. It cannot work for the two that have no standalone
   * pronunciation at all: `ھ` and `ں` modify the letter or vowel *before*
   * them and are silent alone (the same fact `functionNote` teaches, URD-071).
   * Asked to voice a bare `ھ`, Google's TTS refused the narrator voice
   * entirely, fell back to an older model, and produced 3.12 seconds against
   * a 1.13s median for letter clips — the largest gap between the two voice
   * sets anywhere in the corpus (`check:voice-fidelity`, which found this).
   *
   * So those two say their *name*, which is what a teacher says out loud when
   * pointing at the letter. Named after `Word.pronounce` (`words.ts`), which
   * exists for the same reason one level down: a spelling the engine would
   * otherwise have to guess at gets an explicit reading instead. Like that
   * field, it is never rendered — it only ever reaches the speech engine.
   */
  pronounce?: string;
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
  /**
   * URD-071: a short, plain-language fact for the handful of letters whose
   * real behaviour a beginner cannot get from `name`/`sound` alone — a
   * modifier that changes a *neighbouring* letter or vowel rather than
   * carrying a sound of its own. `note` already says this correctly for
   * `do-chashmi-he` and `noon-ghunna` ("it aspirates/nasalises ... before
   * it"), but `note` renders in exactly one place in the whole app
   * (`LetterLabScreen`, already documented elsewhere in this corpus as
   * flashcard trivia outside the real lesson path) — every real exercise
   * shows only `name` and `sound`, and `sound`'s own bracketed tag
   * ("aspirate", "nasal") is exactly the kind of phonetics jargon this field
   * exists to translate, not just repeat. Shown twice per teaching lesson,
   * not on every sighting — THE CRITIC found the first version of this fix
   * only rendered it in `LetterFormExercise`, one exercise kind of several,
   * reusing that component's own `pickedATwin` "reveal a fact after
   * answering" convention; CURRICULUM CRITIC separately found the one real
   * word that would anchor it concretely (`LETTER_CONTEXT_WORD`) is shown
   * on a *different* screen, `LetterSpotExercise`, that never rendered this
   * field either — so the rule and a live example of it never shared a
   * screen. Now shown on both. `letterPick`/`letterTrace` still don't carry
   * it (URD-075, filed forward) — those exercises never show a word or a
   * reveal-after-answering state to hang it on. Unset for every ordinary
   * letter; a letter whose full behaviour *is* its sound (`hamza`'s glottal
   * catch, `ain`'s plain-English "silent") needs no translation and gets
   * none.
   */
  functionNote?: string;
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
    note: 'A single upright stroke, no madda (wavy hat) on top. It never joins to the letter after it, a natural break in the word.',
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
    note: 'One dot below, not pe’s three. The bowl stays shallow in Nastaliq, it sits, it does not scoop.',
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
    note: 'Two dots above. Soft dental t, tongue on the teeth, not the ridge. The everyday “t”, the one to reach for by default in native and Persian vocabulary alike (دوست/dost “friend”, بات/baat “talk / matter”), and in most Arabic loanwords too. ط never occurs outside Arabic/Persian loanwords, so seeing that one does mean “borrowed”, but seeing this one doesn’t rule borrowing out.',
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
    note: 'Three dots above. One of three letters spelling the same “s”, inherited from Arabic, not Urdu’s everyday “s” (that’s س, seen): anchor it to the word this lesson actually shows it in, متاثر (mutasir, “impressed”), rather than guessing.',
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
    note: 'A deep hook with one dot inside, not che’s three. The dot rides low, tucked in the belly.',
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
    note: 'A dotless deep curve; khe adds one dot above it. It sounds the same as choṭī he, inherited from Arabic, not Urdu’s everyday “h” (that’s ہ, choṭī he): anchor it to the word this lesson actually shows it in, خدا حافظ (khuda haafiz, “goodbye”), rather than guessing.',
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
    note: 'A soft angled stroke, no dot and no retroflex mark. It never joins forward, so the next letter starts fresh.',
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
    note: 'Daal with one dot above. One of three “z” spellings inherited from Arabic/Persian, not Urdu’s everyday “z” (that’s ز, ze): anchor it to the word this lesson actually shows it in, کاغذ (kaaghaz, “paper”), rather than guessing.',
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
    note: 'A shallow curve that dips below the line, no dots and no retroflex mark. Lightly rolled r.',
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
    note: 'Re with one dot above. The everyday “z”, the one to reach for by default in native and Persian vocabulary alike (زندگی/zindagi “life”, بازار/bazaar “market”), and in most Arabic loanwords too. ذ ض ظ never occur outside a handful of Arabic/Persian loanwords, so seeing one of those three does mean “borrowed”, but seeing this one doesn’t rule borrowing out.',
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
    note: 'Three teeth, no dots above them; sheen has three. When it joins forward the teeth flatten almost to a line. The everyday “s”, the one to reach for by default in native and Persian vocabulary alike (دوست/dost “friend”, سبزی/sabzi “vegetable”), and in most Arabic loanwords too. ث and ص never occur outside Arabic/Persian loanwords, so seeing one of those two does mean “borrowed”, but seeing this one doesn’t rule borrowing out.',
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
    note: 'A wide loop with a tail, no dot above; zwaad has one. It sounds the same as seen, inherited from Arabic, not Urdu’s everyday “s” (that’s س, seen): anchor it to the word this lesson actually shows it in, صفر (sifar, “zero”), rather than guessing.',
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
    note: 'Swaad with one dot above. One of three “z” spellings inherited from Arabic/Persian, not Urdu’s everyday “z” (that’s ز, ze): anchor it to the word this lesson actually shows it in, ضرورت (zaroorat, “necessity”), rather than guessing.',
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
    note: 'A loop with an upright stroke, no dot above; zoe has one. It sounds like te, inherited from Arabic, not Urdu’s everyday “t” (that’s ت, te): anchor it to the word this lesson actually shows it in, خط (khat, “letter”), rather than guessing.',
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
    note: 'To’e with one dot above. One of three “z” spellings inherited from Arabic/Persian, not Urdu’s everyday “z” (that’s ز, ze): anchor it to the word this lesson actually shows it in, منظر (manzar, “scene/view”), rather than guessing.',
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
    note: 'It shifts shape completely, so its four forms look very different, and carries no dot; ghain has one above. In Urdu it is not a throat sound: it usually just carries a vowel, or is silent.',
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
    note: 'One stroke on top, part of the letter and not an accent; gaaf adds a second stroke above it. Do not drop it.',
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
    note: 'Deep bowl, one dot above; noon ghunna has none. Joined forward it looks like be, the dot is the only tell.',
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
    // Silent alone, so the clip says its name. See `pronounce`'s own comment.
    pronounce: 'نون غنہ',
    confusableWith: 'noon',
    functionNote: 'Silent on its own. It sends the vowel before it through the nose, like French bon.',
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
  //
  // URD-067: `choti-he` (ہ) and `do-chashmi-he` (ھ) share this group — the
  // header above calls it the h family — are taught back to back, and neither
  // names the other via `confusableWith`. That is deliberate, not an omission.
  //
  // The criterion is the one `confusableWith`'s own doc comment states: a link
  // is warranted where a letter's curated note describes the shared shape
  // ("Same bowl as be", "One dot above the ح (baṛī he) curve"). That holds
  // across the whole corpus — all 16 declared pairs are documented that way
  // from one side or the other, checked in `letters.test.ts` — and neither
  // note here claims it. `do-chashmi-he`'s "The h with two eyes" names its own
  // eyes, not a mark added to ہ's outline, and `choti-he`'s note names ح, not
  // ھ. Rendering all four forms of each at the letter lab's own
  // `urduGlyph(72)` in the app's own Nastaliq agrees: ھ cannot be obtained by
  // adding anything to ہ, the way khe is baṛī he plus a dot or gaaf is kaaf
  // plus a stroke. Its two eyes are the body of a wider, flatter letter, near
  // identical across its four forms, where ہ is compact and its four faces
  // differ sharply (its own note says so). Re-render with
  // `node scripts/measure-glyph-pair.js choti-he do-chashmi-he --png out.png`.
  //
  // Two tempting shortcuts were measured and both fail — recorded so the next
  // reader does not re-derive them:
  //
  //   The shipped trace masks score this pair 0.443, effectively tied with the
  //   genuinely confusable baRi-he ~ khe at 0.458. They normalise every glyph
  //   into its own square (`generate-glyph-masks.js`), discarding scale, and
  //   they rank 114 *undeclared* pairs above this one.
  //
  //   Rendered glyph width does not discriminate either. It is 1.00x across
  //   all four forms for baRi-he ~ khe and kaaf ~ gaaf, which invites the rule
  //   "a mark leaves the outline's width alone" — but declared pairs run to
  //   4.00x (alif ~ alif-madda, where the madda dwarfs a bare upright) and
  //   2.29x (noon ~ noon-ghunna), both wider apart than this pair's 2.47x.
  //
  // Same teaching group is not the criterion either: all 16 links are
  // same-group, so that is a property of every link rather than a reason for
  // one.
  //
  // The two are of course easy to *confuse in use* — both romanise as "h".
  // That is a sound-and-function question, which URD-053 handled in these
  // notes; `confusableWith` is documented as visual shape, and linking them
  // would put the pair into `letterContrast`'s head-to-head drill, which
  // exists for telling near-identical outlines apart.
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
    note: 'The “small” h. Its four faces look remarkably different, watch them shift. The everyday “h”, the one to reach for by default in native and Persian vocabulary alike (بہن/behen “sister”, ہاں/haañ “yes”), and in most Arabic loanwords too. ح never occurs outside Arabic/Persian loanwords, so seeing that one does mean “borrowed”, but seeing this one doesn’t rule borrowing out.',
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
    // Silent alone, so the clip says its name. See `pronounce`'s own comment.
    pronounce: 'دو چشمی ہے',
    // URD-067: deliberately no `confusableWith: 'choti-he'` — see the group 8
    // header above. "The h with two eyes" names this letter's own eyes, not a
    // mark added to ہ's outline, which is what a link would assert.
    functionNote: 'Silent on its own. It changes the sound of the letter right before it (k→kh, b→bh).',
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
    note: 'Serves as “y” and the long vowel “ee” with a small hooked tail, not baṛī ye’s long sweeping one. Two dots below appear in some styles.',
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
