import { View, Text as RNText } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { ICONS, IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import { TOPICS, type Word } from '../data/words';

/**
 * Heritage medallion frame — every picture in the app sits inside an 8-point
 * Islamic-geometric star (two overlapping squares) in gold on deep indigo, the
 * same motif as the app's lattice. This ornamental framing is what gives the
 * illustration set its "gold-leaf on indigo" heritage character, and keeps
 * everything perfectly aligned and uniformly sized.
 */
function Medallion({ size, children }: { size: number; children: React.ReactNode }) {
  const gold = palette.gold;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute' }}>
        <Rect x={2.5} y={2.5} width={59} height={59} rx={13} fill="#0E1D3A" stroke={withAlpha(gold, 0.38)} strokeWidth={1.2} />
        {/* 8-point star: a diamond over an axis-aligned square */}
        <Path d="M32 6 L58 32 L32 58 L6 32 Z" fill={withAlpha(gold, 0.05)} stroke={withAlpha(gold, 0.5)} strokeWidth={1} />
        <Rect x={13} y={13} width={38} height={38} rx={3} fill="none" stroke={withAlpha(gold, 0.5)} strokeWidth={1} />
        {/* corner ornament dots */}
        <Circle cx={32} cy={6} r={1.1} fill={gold} />
        <Circle cx={58} cy={32} r={1.1} fill={gold} />
        <Circle cx={32} cy={58} r={1.1} fill={gold} />
        <Circle cx={6} cy={32} r={1.1} fill={gold} />
      </Svg>
      <View style={{ width: size * 0.56, height: size * 0.56, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

export function Illustration({
  name,
  size = 44,
  tile = true,
}: {
  name: IconName | string;
  size?: number;
  tile?: boolean;
}) {
  const Icon = ICONS[name as string];
  const body = Icon ? <Icon size={size * (tile ? 0.56 : 0.9)} /> : null;
  if (!tile) return body;
  return <Medallion size={size}>{body}</Medallion>;
}

function NumeralTile({ numeral, size }: { numeral: string; size: number }) {
  return (
    <Medallion size={size}>
      <RNText style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.gold, fontSize: size * 0.42 }}>
        {numeral}
      </RNText>
    </Medallion>
  );
}

function SwatchTile({ color, size, ring }: { color: string; size: number; ring?: boolean }) {
  return (
    <Medallion size={size}>
      <View
        style={{
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: size * 0.22,
          backgroundColor: color,
          borderWidth: ring ? 1.5 : 0,
          borderColor: withAlpha(palette.cream, 0.5),
        }}
      />
    </Medallion>
  );
}

// ---- content → art mappings ---------------------------------------------

const WORD_ICON: Record<string, IconName> = {
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

const NUMERALS: Record<string, string> = {
  'w-ek': '۱', 'w-do': '۲', 'w-teen': '۳', 'w-chaar': '۴',
  'w-paanch': '۵', 'w-chhe': '۶', 'w-saat': '۷', 'w-aath': '۸',
};

const COLOURS: Record<string, { color: string; ring?: boolean }> = {
  'w-laal': { color: '#E5484D' }, 'w-neela': { color: '#3E7CB1' },
  'w-hara': { color: '#2E8B75' }, 'w-peela': { color: '#E8A33D' },
  'w-kaala': { color: '#15181C', ring: true }, 'w-safed': { color: '#F4EBD9', ring: true },
};

export function hasWordArt(word: Word): boolean {
  return !!(WORD_ICON[word.id] || NUMERALS[word.id] || COLOURS[word.id]);
}

export function WordArt({ word, size = 56 }: { word: Word; size?: number }) {
  if (NUMERALS[word.id]) return <NumeralTile numeral={NUMERALS[word.id]} size={size} />;
  if (COLOURS[word.id]) return <SwatchTile {...COLOURS[word.id]} size={size} />;
  const icon = WORD_ICON[word.id];
  if (icon) return <Illustration name={icon} size={size} />;
  return (
    <Medallion size={size}>
      <RNText style={{ fontSize: size * 0.42 }}>{word.emoji}</RNText>
    </Medallion>
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
  if (TOPIC_ICON[topicId]) return <Illustration name={TOPIC_ICON[topicId]} size={size} />;
  // topics without a bespoke illustration yet → their emoji in the medallion
  const emoji = TOPICS.find((t) => t.id === topicId)?.icon ?? '✨';
  return (
    <Medallion size={size}>
      <RNText style={{ fontSize: size * 0.42 }}>{emoji}</RNText>
    </Medallion>
  );
}

/** Icon for a lesson node on the path (drawn without a frame). */
export function lessonIconName(kind: string, topic?: string): IconName {
  if (kind === 'letters') return 'pen';
  if (kind === 'vocab') return (topic && TOPIC_ICON[topic]) || 'sparkle';
  if (kind === 'phrases') return 'salaam';
  return 'star';
}
