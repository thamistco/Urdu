import { View, Text as RNText } from 'react-native';
import { ICONS, IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import type { Word } from '../data/words';

/**
 * A framed illustration tile. Every picture in the app sits in the same rounded
 * "frame" so nothing is ever cut off or mis-sized, and the set reads as one
 * system on both the parchment cards and the dark cards.
 */
export function Illustration({
  name,
  size = 44,
  tile = true,
  bg,
}: {
  name: IconName | string;
  size?: number;
  tile?: boolean;
  bg?: string;
}) {
  const Icon = ICONS[name as string];
  const inner = size * 0.66;
  const body = Icon ? <Icon size={inner} /> : null;
  if (!tile) return body;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg ?? '#132743',
        borderWidth: 1,
        borderColor: withAlpha(palette.gold, 0.18),
      }}
    >
      {body}
    </View>
  );
}

/** Numeral tile — the picture cue for number words. */
function NumeralTile({ numeral, size }: { numeral: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#132743',
        borderWidth: 1,
        borderColor: withAlpha(palette.gold, 0.18),
      }}
    >
      <RNText style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.gold, fontSize: size * 0.5 }}>
        {numeral}
      </RNText>
    </View>
  );
}

/** Colour swatch tile — the picture cue for colour words. */
function SwatchTile({ color, size, ring }: { color: string; size: number; ring?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#132743',
        borderWidth: 1,
        borderColor: withAlpha(palette.gold, 0.18),
      }}
    >
      <View
        style={{
          width: size * 0.52,
          height: size * 0.52,
          borderRadius: size * 0.26,
          backgroundColor: color,
          borderWidth: ring ? 1.5 : 0,
          borderColor: withAlpha(palette.cream, 0.5),
        }}
      />
    </View>
  );
}

// ---- content → art mappings ---------------------------------------------

const WORD_ICON: Record<string, IconName> = {
  // first words
  'w-paani': 'droplet', 'w-kitaab': 'book', 'w-ghar': 'house', 'w-dil': 'heart',
  'w-naam': 'tag', 'w-dost': 'handshake', 'w-kaam': 'briefcase', 'w-waqt': 'clock',
  // family
  'w-maan': 'woman', 'w-baap': 'man', 'w-behen': 'woman', 'w-bhai': 'man',
  'w-dada': 'elderMan', 'w-dadi': 'elderWoman', 'w-beta': 'child', 'w-beti': 'child',
  // food
  'w-roti': 'bread', 'w-chai': 'tea', 'w-doodh': 'milk', 'w-seb': 'apple',
  'w-anda': 'egg', 'w-chawal': 'rice', 'w-gosht': 'meat', 'w-namak': 'salt',
  // home
  'w-mez': 'table', 'w-kursi': 'chair', 'w-darwaza': 'door', 'w-khirki': 'window',
  'w-chabi': 'key', 'w-ghadi': 'clock', 'w-bistar': 'bed', 'w-chiragh': 'lamp',
  // nature
  'w-chaand': 'moon', 'w-suraj': 'sun', 'w-tara': 'star', 'w-phool': 'flower',
  'w-darakht': 'tree', 'w-barish': 'rain', 'w-samundar': 'waves', 'w-pahaar': 'mountain',
  // greetings
  'w-salam': 'salaam', 'w-shukriya': 'thanks', 'w-haan': 'check', 'w-nahi': 'cross',
  'w-maaf': 'handHeart', 'w-khush': 'smile',
};

const NUMERALS: Record<string, string> = {
  'w-ek': '۱', 'w-do': '۲', 'w-teen': '۳', 'w-chaar': '۴',
  'w-paanch': '۵', 'w-chhe': '۶', 'w-saat': '۷', 'w-aath': '۸',
};

const COLOURS: Record<string, { color: string; ring?: boolean }> = {
  'w-laal': { color: '#E5484D' }, 'w-neela': { color: '#3E7CB1' },
  'w-hara': { color: '#2E8B75' }, 'w-peela': { color: '#E8A33D' },
  'w-kaala': { color: '#15181C', ring: true }, 'w-safed': { color: '#F4EBD9', ring: true },
};

/** True when we have real artwork for a word (so exercises can rely on a picture cue). */
export function hasWordArt(word: Word): boolean {
  return !!(WORD_ICON[word.id] || NUMERALS[word.id] || COLOURS[word.id]);
}

/**
 * The picture for a word: custom illustration where we have one, a numeral/colour
 * cue for numbers/colours, otherwise the emoji as a graceful fallback.
 */
export function WordArt({ word, size = 56 }: { word: Word; size?: number }) {
  if (NUMERALS[word.id]) return <NumeralTile numeral={NUMERALS[word.id]} size={size} />;
  if (COLOURS[word.id]) return <SwatchTile {...COLOURS[word.id]} size={size} />;
  const icon = WORD_ICON[word.id];
  if (icon) return <Illustration name={icon} size={size} />;
  // fallback: emoji centred in a matching frame so sizing/alignment stay consistent
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#132743',
        borderWidth: 1,
        borderColor: withAlpha(palette.gold, 0.18),
      }}
    >
      <RNText style={{ fontSize: size * 0.5 }}>{word.emoji}</RNText>
    </View>
  );
}

const GOAL_ICON: Record<string, IconName> = {
  family: 'family', read: 'pen', heritage: 'mosque', curious: 'sparkle',
};
const TOPIC_ICON: Record<string, IconName> = {
  'first-words': 'sparkle', family: 'family', food: 'bowl', home: 'house',
  nature: 'moon', greetings: 'salaam',
};

export function GoalArt({ goalKey, size = 44 }: { goalKey: string; size?: number }) {
  return <Illustration name={GOAL_ICON[goalKey] ?? 'sparkle'} size={size} />;
}

export function TopicArt({ topicId, size = 44 }: { topicId: string; size?: number }) {
  if (topicId === 'numbers') return <NumeralTile numeral="۳" size={size} />;
  if (topicId === 'colours') return <SwatchTile color="#E8A33D" size={size} />;
  return <Illustration name={TOPIC_ICON[topicId] ?? 'sparkle'} size={size} />;
}
