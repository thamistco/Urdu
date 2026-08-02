/**
 * Which picture stands for which piece of content, and whether that picture can
 * carry a question on its own.
 *
 * Kept out of the component that draws it so the content audit can load it:
 * these are facts about the course, and `npm run audit` checks them the same
 * way it checks that every lesson points at a topic that exists.
 */

import type { IconName } from '../art/icons';
import { WORDS, type Word } from './words';

export const WORD_ICON: Record<string, IconName> = {
  'w-paani': 'droplet',
  'w-kitaab': 'book',
  'w-ghar': 'house',
  'w-dil': 'heart',
  'w-naam': 'tag',
  'w-dost': 'handshake',
  'w-kaam': 'briefcase',
  'w-waqt': 'clock',
  'w-maan': 'woman',
  'w-baap': 'man',
  'w-behen': 'girl',
  'w-bhai': 'boy',
  'w-dada': 'elderMan',
  'w-dadi': 'elderWoman',
  'w-beta': 'sonChild',
  'w-beti': 'daughterChild',
  'w-roti': 'bread',
  'w-chai': 'tea',
  'w-doodh': 'milk',
  'w-seb': 'apple',
  'w-anda': 'egg',
  'w-chawal': 'rice',
  'w-gosht': 'meat',
  'w-namak': 'salt',
  'w-mez': 'table',
  'w-kursi': 'chair',
  'w-darwaza': 'door',
  'w-khirki': 'window',
  'w-chabi': 'key',
  'w-ghadi': 'clock',
  'w-bistar': 'bed',
  'w-chiragh': 'lamp',
  'w-chaand': 'moon',
  'w-suraj': 'sun',
  'w-tara': 'star',
  'w-phool': 'flower',
  'w-darakht': 'tree',
  'w-barish': 'rain',
  'w-samundar': 'waves',
  'w-pahaar': 'mountain',
  'w-salam': 'salaam',
  'w-shukriya': 'thanks',
  'w-haan': 'check',
  'w-nahi': 'cross',
  'w-maaf': 'handHeart',
  'w-khush': 'smile',

  // ---- second pass -------------------------------------------------------
  // The set was 60 drawn pictures against 2,425 words, so 97.5% of the course
  // fell through to a system emoji in a frame — the very inconsistency the
  // drawn set exists to remove. These add no new drawings; they are words the
  // *existing* icons already depict honestly and were simply never wired to.
  // Anything the icon would only approximate was left out on purpose: a guava
  // is not a pomegranate, a platter is not a table, a desert is not a mountain.
  'w-aadmi': 'man',
  'w-aag': 'flame',
  'w-aata': 'bread',
  'w-akhbaar': 'scroll',
  'w-anaaj': 'rice',
  'w-anaar': 'pomegranate',
  'w-angoothi': 'gem',
  'w-aurat': 'woman',
  'w-auzaar': 'gear',
  'w-baadal2': 'rain',
  'w-bacche': 'child',
  'w-bachcha': 'child',
  'w-bachpan': 'child',
  'w-barfbaari': 'rain',
  'w-barsaat': 'rain',
  'w-basta': 'briefcase',
  'w-batti': 'lamp',
  'w-bauchhaar': 'rain',
  'w-beej': 'sprout',
  'w-bhanji': 'girl',
  'w-bhatija': 'boy',
  'w-biwi': 'woman',
  'w-biwi2': 'woman',
  'w-boondabaandi2': 'droplet',
  'w-boorha': 'elderMan',
  'w-bulb': 'lamp',
  'w-buzurg': 'elderMan',
  'w-chai-daani': 'tea',
  'w-chakki': 'gear',
  'w-chameli': 'flower',
  'w-chandni': 'moon',
  'w-chattan': 'mountain',
  'w-choti': 'mountain',
  'w-chulha': 'flame',
  'w-daftar': 'briefcase',
  'w-dahi2': 'milk',
  'w-darwaza2': 'door',
  'w-darya': 'waves',
  'w-dehleez': 'door',
  'w-dhoop': 'sun',
  'w-dophar': 'sun',
  'w-fajar': 'sun',
  'w-fasal': 'sprout',
  'w-fatah': 'medal',
  'w-gaddaa': 'bed',
  'w-garmi': 'flame',
  'w-ghaas2': 'sprout',
  'w-ghaati': 'mountain',
  'w-ghadi-wall': 'clock',
  'w-ghadi2': 'clock',
  'w-ghanta': 'clock',
  'w-girjaghar': 'mosque',
  'w-gulaab': 'flower',
  'w-haar': 'gem',
  'w-inaam': 'medal',
  'w-insaan2': 'man',
  'w-ishq': 'heart',
  'w-jangal2': 'tree',
  'w-jheel': 'waves',
  'w-kaaghaz': 'scroll',
  'w-kaamyaabi': 'medal',
  'w-kaapi': 'book',
  'w-kabab': 'meat',
  'w-kambal': 'bed',
  'w-katori': 'bowl',
  'w-khat': 'scroll',
  'w-kunda': 'key',
  'w-kunji': 'key',
  'w-larka': 'boy',
  'w-larki': 'girl',
  'w-lassi': 'milk',
  'w-lehr': 'waves',
  'w-likhna': 'pen',
  'w-log': 'family',
  'w-lugat': 'book',
  'w-machine': 'gear',
  'w-makaan2': 'house',
  'w-mandir': 'mosque',
  'w-mansoon': 'rain',
  'w-masjid': 'mosque',
  'w-minute': 'clock',
  'w-mitti': 'sprout',
  'w-mohabbat': 'heart',
  'w-mombatti': 'lamp',
  'w-namak-daani': 'salt',
  'w-namaz': 'mosque',
  'w-namkeen': 'salt',
  'w-nana': 'elderMan',
  'w-nani': 'elderWoman',
  'w-nazm': 'scroll',
  'w-novel': 'book',
  'w-paratha': 'bread',
  'w-parivaar': 'family',
  'w-paudha': 'tree',
  'w-pencil': 'pen',
  'w-phal3': 'apple',
  'w-piyaala': 'bowl',
  'w-pyaali': 'bowl',
  'w-qalam': 'pen',
  'w-rishta': 'family',
  'w-roshandan': 'window',
  'w-roshni2': 'lamp',
  'w-sabza': 'sprout',
  'w-safha': 'scroll',
  'w-sailaab3': 'waves',
  'w-samaan': 'briefcase',
  'w-sayyara': 'star',
  'w-shaakh': 'tree',
  'w-shaayari': 'scroll',
  'w-shabnam': 'droplet',
  'w-shauhar2': 'man',
  'w-shohar': 'man',
  'w-sitara': 'star',
  'w-sofa': 'chair',
  'w-stool': 'chair',
  'w-taala': 'key',
  'w-takiya': 'bed',
  'w-tamgha': 'medal',
  'w-teela': 'mountain',
  'w-tehreer': 'pen',
  'w-thaila': 'briefcase',
  'w-toofaan': 'rain',
  'w-tuloo': 'sun',
  'w-waadi2': 'mountain',
  'w-walid': 'man',
  'w-walida': 'woman',

  // ---- the body ----------------------------------------------------------
  // These are the words the emoji font actively got wrong rather than merely
  // approximated. It has one glyph — 💪 — for arm, shoulder and elbow, and one
  // — 👁️ — for eye, eyebrows and eyelashes, so the same picture was shown for
  // six different words and "which word is this?" had no answer. See the note
  // over the drawings in art/icons.tsx.
  'w-baazoo2': 'arm',
  'w-kandha': 'shoulder',
  'w-kohni': 'elbow',
  'w-aankh': 'eye',
  'w-bhow': 'eyebrow',
  'w-bhoon': 'eyebrow',
  'w-palken': 'eyelashes',
  'w-munh': 'mouth',
  'w-hont2': 'lips',
  'w-jild': 'skin',
  'w-aant': 'intestine',
};

/**
 * One to eight used to be the whole map, so نو (9), دس (10) and صفر (0) fell
 * through to `word.emoji` — a digit emoji — while every other number rendered
 * an Urdu-script numeral glyph. Same category, two different icon languages
 * side by side in one set of multiple-choice options. All eleven numbers the
 * course teaches (0-10) are here now, so the whole category is one thing.
 */
export const NUMERALS: Record<string, string> = {
  'w-sifar': '۰',
  'w-ek': '۱',
  'w-do': '۲',
  'w-teen': '۳',
  'w-chaar': '۴',
  'w-paanch': '۵',
  'w-chhe': '۶',
  'w-saat': '۷',
  'w-aath': '۸',
  'w-nau': '۹',
  'w-das': '۱۰',
};

/**
 * The colour words, each drawn as the colour it names.
 *
 * These are the one place in the app where a hex literal is the *content*
 * rather than the styling: لال has to be red, and it has to stay red through
 * any re-theme, because the swatch is the question. A palette token here would
 * mean a learner one day being shown the interface's accent orange and asked to
 * name it "red". Hence the region marker rather than a token — `check:theme`
 * otherwise fails on every raw hex under src/.
 */
/* check:theme-off — depicted colour: these ARE the vocabulary */
export const COLOURS: Record<string, { color: string; ring?: boolean }> = {
  'w-laal': { color: '#E5484D' },
  'w-neela': { color: '#3E7CB1' },
  'w-hara': { color: '#2E8B75' },
  'w-peela': { color: '#FFC72C' },
  'w-kaala': { color: '#15181C', ring: true },
  'w-safed': { color: '#FFF6E2', ring: true },
  // the colour words added in the vocabulary expansion — a swatch is the one
  // picture that *is* the word, so these also become picture-only questions
  'w-gulaabi': { color: '#E89BB0' },
  'w-narangi-clr': { color: '#E8833A' },
  'w-bhoora': { color: '#8B5E3C' },
  'w-jamni': { color: '#7A4A8C' },
  'w-khaakstari': { color: '#8A8A82' },
  'w-sunehra': { color: '#D4A73C' },
  'w-chandi-clr': { color: '#C6C8CA', ring: true },
  'w-aasmani': { color: '#7FB2E5' },
  'w-surkh': { color: '#C0342B' },
  'w-qirmizi': { color: '#9B2242' },
  'w-zeetooni': { color: '#7A7F3C' },
  'w-syaah': { color: '#0E0E10', ring: true },
  'w-pyaazi': { color: '#D9A0A8' },
  'w-firozi': { color: '#3BB3B8' },
};
/* check:theme-on */

export function hasWordArt(word: Word): boolean {
  return !!(WORD_ICON[word.id] || NUMERALS[word.id] || COLOURS[word.id]);
}

/**
 * Topics whose art depicts the thing itself.
 *
 * There is a difference between a picture of a word and a picture *for* a word,
 * and only the first can be a question on its own. An apple drawn for "apple"
 * is the word; a pair of cupped hands drawn for "forgive" is a mood. Ask
 * "which word is this?" over the second and there is no way to answer — the
 * same hands would do for sorry, mercy, please, prayer or charity.
 *
 * So this is an allow-list, not a block-list: a topic earns a picture-only
 * question by being made of things that can be drawn, and everything else —
 * verbs, feelings, values, question words, grammar, anything new that has not
 * been considered — gets its meaning shown alongside the picture instead. The
 * cost of being wrong in that direction is a slightly easier question. The cost
 * of being wrong in the other is a question with no answer.
 */
const DEPICTIVE_TOPICS = new Set([
  // food and drink
  'food',
  'drinks',
  'meals',
  'grains',
  'fruits',
  'vegetables',
  'cooking',
  'kitchen',
  // living things
  'animals',
  'birds',
  'wildlife',
  'sealife',
  'farm',
  'body',
  'organs',
  // the built world
  'home',
  'rooms',
  'furniture',
  'household',
  'bathroom',
  'appliances',
  'containers',
  'tools',
  'materials',
  'toys',
  'school',
  'office',
  // outdoors and getting about
  'nature',
  'nature2',
  'sky',
  'landscape',
  'garden',
  'places',
  'city',
  'road',
  'transport',
  'airport',
  // what you wear, and what you count
  'clothing',
  'clothing-more',
  'numbers',
  'colours',
  'shapes',
  // people by their trade — the emoji carry their tools
  'jobs',
  // the very first lesson, which is half concrete nouns and half not; the
  // abstract half is named in SYMBOLIC_WORDS below
  'first-words',
]);

/**
 * Words inside a depictive topic whose own picture is still a stand-in.
 * Small by design: if this list starts growing, the topic does not belong on
 * the allow-list above.
 */
const SYMBOLIC_WORDS = new Set([
  'w-sar', // head, drawn as a whole person
  'w-sehat', // health / condition
  'w-aaram', // rest / comfort
  'w-naukri', // job, as opposed to the people who do one
  'w-tankhwah', // salary
  // the abstract half of the first lesson: a luggage tag is not "name", a
  // handshake is not "friend", a briefcase is not "work", a clock is not "time"
  'w-naam',
  'w-dost',
  'w-kaam',
  'w-waqt',
]);

/** The picture a word shows: illustration, numeral, swatch, or its emoji. */
export function cueOf(word: Word): string {
  if (NUMERALS[word.id]) return `num:${NUMERALS[word.id]}`;
  if (COLOURS[word.id]) return `col:${COLOURS[word.id].color}`;
  if (WORD_ICON[word.id]) return `ico:${WORD_ICON[word.id]}`;
  return `emo:${word.emoji}`;
}

/**
 * Pictures that stand for more than one word in the course.
 *
 * The lists above are hand-written, and the reason a picture fails to name its
 * word is usually not that it is a poor drawing — it is that some *other* word
 * is using the same one. 💪 was arm, shoulder, elbow and muscle; 👁️ was eye,
 * eyebrows and eyelashes; 🏺 was seven different clay vessels. Those six words
 * were spotted by hand; 466 of the 766 words then allowed a picture-only
 * question turned out to have the same problem, which is far too many to keep
 * on a list.
 *
 * So it is counted instead. A picture that names exactly one word can carry a
 * question alone; a picture shared with anything else cannot, and the word gets
 * its meaning captioned underneath like any other. This is derived from the
 * data, so drawing a word its own picture silently promotes it and adding a
 * word that reuses one silently demotes both — neither can drift.
 */
const SHARED_CUES: Set<string> = (() => {
  const count = new Map<string, number>();
  for (const w of WORDS) {
    const c = cueOf(w);
    count.set(c, (count.get(c) ?? 0) + 1);
  }
  return new Set([...count].filter(([, n]) => n > 1).map(([c]) => c));
})();

/**
 * Can this word be asked with nothing but its picture?
 *
 * Used by the generator to decide whether "which word is this?" needs the
 * English underneath. Never guesses in the generous direction.
 */
export function pictureIdentifies(word: Word): boolean {
  // A numeral and a colour swatch are the thing itself, whatever the topic.
  if (NUMERALS[word.id] || COLOURS[word.id]) return true;
  if (SYMBOLIC_WORDS.has(word.id)) return false;
  // Someone else is already using this picture.
  if (SHARED_CUES.has(cueOf(word))) return false;
  // A still picture cannot distinguish an action from its object: 🏃 is as much
  // "runner" or "race" as "to run".
  if (/\bto\s/.test(word.meaning)) return false;
  // "cold / winter", "plane / ship" — the picture can only ever be one of them.
  if (word.meaning.includes('/')) return false;
  return DEPICTIVE_TOPICS.has(word.topic);
}
