/**
 * Which picture stands for which piece of content, and whether that picture can
 * carry a question on its own.
 *
 * Kept out of the component that draws it so the content audit can load it:
 * these are facts about the course, and `npm run audit` checks them the same
 * way it checks that every lesson points at a topic that exists.
 */

import type { IconName } from '../art/icons';
import type { Word } from './words';

export const WORD_ICON: Record<string, IconName> = {
  'w-paani': 'droplet', 'w-kitaab': 'book', 'w-ghar': 'house', 'w-dil': 'heart',
  'w-naam': 'tag', 'w-dost': 'handshake', 'w-kaam': 'briefcase', 'w-waqt': 'clock',
  'w-maan': 'woman', 'w-baap': 'man', 'w-behen': 'girl', 'w-bhai': 'boy',
  'w-dada': 'elderMan', 'w-dadi': 'elderWoman', 'w-beta': 'sonChild', 'w-beti': 'daughterChild',
  'w-roti': 'bread', 'w-chai': 'tea', 'w-doodh': 'milk', 'w-seb': 'apple',
  'w-anda': 'egg', 'w-chawal': 'rice', 'w-gosht': 'meat', 'w-namak': 'salt',
  'w-mez': 'table', 'w-kursi': 'chair', 'w-darwaza': 'door', 'w-khirki': 'window',
  'w-chabi': 'key', 'w-ghadi': 'clock', 'w-bistar': 'bed', 'w-chiragh': 'lamp',
  'w-chaand': 'moon', 'w-suraj': 'sun', 'w-tara': 'star', 'w-phool': 'flower',
  'w-darakht': 'tree', 'w-barish': 'rain', 'w-samundar': 'waves', 'w-pahaar': 'mountain',
  'w-salam': 'salaam', 'w-shukriya': 'thanks', 'w-haan': 'check', 'w-nahi': 'cross',
  'w-maaf': 'handHeart', 'w-khush': 'smile',
};

export const NUMERALS: Record<string, string> = {
  'w-ek': '۱', 'w-do': '۲', 'w-teen': '۳', 'w-chaar': '۴',
  'w-paanch': '۵', 'w-chhe': '۶', 'w-saat': '۷', 'w-aath': '۸',
};

export const COLOURS: Record<string, { color: string; ring?: boolean }> = {
  'w-laal': { color: '#E5484D' }, 'w-neela': { color: '#3E7CB1' },
  'w-hara': { color: '#2E8B75' }, 'w-peela': { color: '#FFC72C' },
  'w-kaala': { color: '#15181C', ring: true }, 'w-safed': { color: '#FFF6E2', ring: true },
};

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
  'food', 'drinks', 'meals', 'grains', 'fruits', 'vegetables', 'cooking', 'kitchen',
  // living things
  'animals', 'birds', 'wildlife', 'sealife', 'farm', 'body', 'organs',
  // the built world
  'home', 'rooms', 'furniture', 'household', 'bathroom', 'appliances', 'containers',
  'tools', 'materials', 'toys', 'school', 'office',
  // outdoors and getting about
  'nature', 'nature2', 'sky', 'landscape', 'garden', 'places', 'city', 'road',
  'transport', 'airport',
  // what you wear, and what you count
  'clothing', 'clothing-more', 'numbers', 'colours', 'shapes',
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
  'w-sar',      // head — drawn as a whole person
  'w-sehat',    // health / condition
  'w-aaram',    // rest / comfort
  'w-naukri',   // job, as opposed to the people who do one
  'w-tankhwah', // salary
  // the abstract half of the first lesson: a luggage tag is not "name", a
  // handshake is not "friend", a briefcase is not "work", a clock is not "time"
  'w-naam', 'w-dost', 'w-kaam', 'w-waqt',
]);

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
  // A still picture cannot distinguish an action from its object: 🏃 is as much
  // "runner" or "race" as "to run".
  if (/\bto\s/.test(word.meaning)) return false;
  // "cold / winter", "plane / ship" — the picture can only ever be one of them.
  if (word.meaning.includes('/')) return false;
  return DEPICTIVE_TOPICS.has(word.topic);
}

