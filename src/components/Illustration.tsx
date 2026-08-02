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
/**
 * A vector icon for the topics where one is an honest fit.
 *
 * This was six entries for a course with 122 vocab topics, so a lesson on
 * colours, numbers, the weather or the body all rendered the same generic
 * sparkle on the learning path — every unit looked like every other unit
 * until you tapped it, which is exactly what made the path hard to navigate
 * at a glance.
 *
 * Reused icons between closely related topics (`briefcase` for both
 * `work-life` and `jobs`, `bowl` for `food`, `kitchen` and `meals`) are
 * deliberate — those topics really do share a picture. Topics with no honest
 * match are left out on purpose rather than stretched to fit; `LessonIcon`
 * below falls back to the topic's own emoji for those, which is still
 * topic-specific even without bespoke art.
 */
const TOPIC_ICON: Record<string, IconName> = {
  'first-words': 'sparkle',
  family: 'family',
  'family-more': 'family',
  food: 'bowl',
  kitchen: 'bowl',
  cooking: 'bowl',
  meals: 'bowl',
  home: 'house',
  household: 'house',
  nature: 'moon',
  nature2: 'tree',
  environment: 'tree',
  greetings: 'salaam',
  honorifics: 'salaam',
  formal: 'salaam',
  faith: 'mosque',
  body: 'eye',
  'body-more': 'arm',
  senses: 'eye',
  organs: 'intestine',
  weather: 'rain',
  'weather-more': 'sun',
  sky: 'sun',
  days: 'clock',
  time: 'clock',
  timewords: 'clock',
  'measure-time': 'clock',
  school: 'book',
  education: 'book',
  subjects: 'book',
  literature: 'scroll',
  poetry: 'scroll',
  history: 'scroll',
  'work-life': 'briefcase',
  jobs: 'briefcase',
  business: 'briefcase',
  office: 'briefcase',
  'jobs-more': 'gear',
  tools: 'gear',
  appliances: 'gear',
  science: 'gear',
  tech: 'bolt',
  digital: 'bolt',
  verbs: 'bolt',
  verbs2: 'bolt',
  verbs3: 'bolt',
  'motion-verbs': 'bolt',
  'mind-verbs': 'bolt',
  health: 'heart',
  illness: 'handHeart',
  lifeevents: 'handHeart',
  medicine: 'droplet',
  bathroom: 'droplet',
  money: 'tag',
  'shopping-talk': 'tag',
  bank: 'gem',
  economy: 'gem',
  festivals: 'medal',
  celebrations: 'medal',
  sports: 'medal',
  emotions: 'smile',
  feelings: 'smile',
  personality: 'smile',
  relationships: 'handshake',
  social: 'handshake',
  expressions: 'speechBubble',
  idioms: 'speechBubble',
  'speech-verbs': 'speechBubble',
  media: 'speechBubble',
  phone: 'speechBubble',
  city: 'door',
  places: 'door',
  rooms: 'door',
  furniture: 'chair',
  drinks: 'tea',
  tastes: 'tea',
  fruits: 'apple',
  vegetables: 'sprout',
  farm: 'sprout',
  garden: 'sprout',
  grains: 'bread',
  landscape: 'mountain',
  sealife: 'waves',
  emergency: 'flame',
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
 *
 * `vocab` is deliberately not one of the cases here — that kind is the one
 * with a topic to represent, and `LessonIcon` below decides it directly so
 * there is exactly one place that logic lives, not this generic fallback plus
 * a smarter one layered on top of it.
 */
function lessonIconName(kind: string): IconName {
  switch (kind) {
    case 'letters':
      return 'pen';
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

/**
 * The icon actually drawn on a path node.
 *
 * `lessonIconName` above is a straight kind → icon lookup, and its `vocab`
 * case was `TOPIC_ICON[topic] || 'sparkle'` — a topic outside the tiny
 * hand-written map fell all the way to the same generic mark every *other*
 * uncovered topic used too. `TOPIC_ICON` now covers a lot more ground, but 122
 * topics were never going to all get bespoke art in one pass, so this is
 * where the honest fallback lives: a topic's own emoji, which is already
 * unique per topic in the data, rather than one shared placeholder for
 * everything still uncovered. Numbers and colours get the same bespoke tiles
 * `TopicArt`/`WordArt` already use elsewhere, for the same reason.
 */
export function LessonIcon({ kind, topic, size = 34 }: { kind: string; topic?: string; size?: number }) {
  if (kind === 'vocab' && topic) {
    if (topic === 'numbers') {
      return <RNText style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.gold, fontSize: size * 0.86 }}>۳</RNText>;
    }
    if (topic === 'colours') {
      return (
        <View
          style={{ width: size * 0.62, height: size * 0.62, borderRadius: size * 0.31, backgroundColor: palette.gold }}
        />
      );
    }
    if (TOPIC_ICON[topic]) return <Illustration name={TOPIC_ICON[topic]} tile={false} size={size} />;
    const emoji = TOPICS.find((t) => t.id === topic)?.icon ?? '✨'; // audit:emoji-ok — falls back to the topic's own emoji
    return <RNText style={{ fontSize: size * 0.72 }}>{emoji}</RNText>;
  }
  return <Illustration name={lessonIconName(kind)} tile={false} size={size} />;
}
