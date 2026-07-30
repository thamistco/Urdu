import { View, Text as RNText } from 'react-native';
import { ICONS, IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import { TOPICS, type Word } from '../data/words';
import { WORD_ICON, NUMERALS, COLOURS } from '../data/art';

/**
 * The tile every picture sits in.
 *
 * This used to be an ornamental 8-point star: a gold diamond crossed with a
 * gold square, plus four corner dots, stacked behind a 40px icon. At that size
 * none of it read as ornament — it read as clutter competing with the very
 * thing it was framing, and it dated the whole app. The frame's actual job is
 * modest: give every picture the same footprint and the same edge, so a grid
 * of them looks deliberate. A single rounded container does that.
 *
 * Plain views rather than SVG on purpose. A screen can hold twenty of these,
 * and an SVG frame would mean twenty copies of the same `<Defs>` with the same
 * gradient ids — ids are document-global, so that is a collision waiting to
 * render wrong.
 */
function Medallion({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size * 0.3,
        backgroundColor: palette.ink800,
        borderWidth: 1,
        borderColor: withAlpha(palette.gold, 0.2),
        overflow: 'hidden',
      }}
    >
      {/* a single soft highlight along the top edge, so the tile reads as a
          raised surface catching the same low sun as everything else */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: size * 0.5,
          backgroundColor: withAlpha(palette.gold, 0.05),
        }}
      />
      <View style={{ width: size * 0.62, height: size * 0.62, alignItems: 'center', justifyContent: 'center' }}>
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
  /** Deliberately not `string`: an unknown name renders nothing at all, so the
   *  compiler is the only thing that catches a typo before a learner does. */
  name: IconName;
  size?: number;
  tile?: boolean;
}) {
  const Icon = ICONS[name];
  const body = Icon ? <Icon size={size * (tile ? 0.56 : 0.9)} /> : null;
  if (!tile) return body;
  return <Medallion size={size}>{body}</Medallion>;
}

function NumeralTile({ numeral, size }: { numeral: string; size: number }) {
  return (
    <Medallion size={size}>
      <RNText style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.gold, fontSize: size * 0.42 }}>{numeral}</RNText>
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

// The mappings themselves live in data/art.ts, where the audit can read them —
// re-exported here so call sites can keep asking the art module for its art.
export { WORD_ICON, NUMERALS, COLOURS, hasWordArt, pictureIdentifies } from '../data/art';

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
  family: 'family',
  read: 'pen',
  heritage: 'mosque',
  curious: 'sparkle',
};
const TOPIC_ICON: Record<string, IconName> = {
  'first-words': 'sparkle',
  family: 'family',
  food: 'bowl',
  home: 'house',
  nature: 'moon',
  greetings: 'salaam',
};

export function GoalArt({ goalKey, size = 44 }: { goalKey: string; size?: number }) {
  return <Illustration name={GOAL_ICON[goalKey] ?? 'sparkle'} size={size} />;
}

export function TopicArt({ topicId, size = 44 }: { topicId: string; size?: number }) {
  if (topicId === 'numbers') return <NumeralTile numeral="۳" size={size} />;
  if (topicId === 'colours') return <SwatchTile color={palette.gold} size={size} />;
  if (TOPIC_ICON[topicId]) return <Illustration name={TOPIC_ICON[topicId]} size={size} />;
  // topics without a bespoke illustration yet → their emoji in the medallion
  const emoji = TOPICS.find((t) => t.id === topicId)?.icon ?? '✨'; // audit:emoji-ok — topic art falls back to its data emoji
  return (
    <Medallion size={size}>
      <RNText style={{ fontSize: size * 0.42 }}>{emoji}</RNText>
    </Medallion>
  );
}

/**
 * Icon for a lesson node on the path (drawn without a frame). Each kind of
 * lesson gets its own mark so a long path stays readable at a glance.
 */
export function lessonIconName(kind: string, topic?: string): IconName {
  switch (kind) {
    case 'letters':
      return 'pen';
    case 'vocab':
      return (topic && TOPIC_ICON[topic]) || 'sparkle';
    case 'phrases':
      return 'salaam';
    case 'grammar':
      return 'lattice';
    case 'sentences':
      return 'tiles';
    case 'reading':
      return 'scroll';
    case 'dialogue':
      return 'salaam';
    case 'review':
      return 'crescent';
    default:
      return 'star';
  }
}
