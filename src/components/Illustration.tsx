import { View, Text as RNText } from 'react-native';
import { ICONS, IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import { type Word } from '../data/words';
import { WORD_ICON, NUMERALS, COLOURS } from '../data/art';
import { TOPIC_ICON } from '../art/topicIcons';

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
  // Decoration: every illustration sits beside the words that say what it
  // means, and an unnamed picture was announced as a bare "image" on the
  // out-of-hearts and lesson-complete screens (design review, 2026-10-13).
  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants">
      {tile ? <Medallion size={size}>{body}</Medallion> : body}
    </View>
  );
}

function NumeralTile({ numeral, size }: { numeral: string; size: number }) {
  return (
    <Medallion size={size}>
      <RNText style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.gold, fontSize: size * 0.42 }}>{numeral}</RNText>
    </Medallion>
  );
}

/**
 * A league's badge, drawn in the league's own colour.
 *
 * The seven leagues each carry a `color` and, until now, a coloured-circle
 * emoji beside it — and the two never matched. Clay is `#C08457`, a warm
 * terracotta; 🟤 is whatever brown the device's emoji font ships, and on this
 * dark ground it read as a flat dot with no edge. Every screen that showed a
 * league showed one colour in the heading and a different one in the picture.
 *
 * Plain views rather than SVG, for the reason `Medallion` gives above: the
 * leaderboard can hold a stack of these.
 */
export function LeagueBadge({ color, size = 44 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: Math.max(1, size * 0.045),
        borderColor: withAlpha(palette.ink, 0.35),
      }}
    >
      {/* the struck rim, so it reads as a coin rather than a dot */}
      <View
        style={{
          width: size * 0.66,
          height: size * 0.66,
          borderRadius: size * 0.33,
          borderWidth: Math.max(1, size * 0.045),
          borderColor: withAlpha(palette.cream, 0.45),
        }}
      />
    </View>
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
  heritage: 'feather',
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
 * deliberate — those topics really do share a picture.
 *
 * All 122 are covered now, so the emoji fallback in `LessonIcon` and
 * `TopicArt` below reaches nothing: it is the safety net for a topic added
 * without art, not a state the app ships in. A topic-specific emoji is still
 * the right thing to fall back *to* — better one wrong-looking picture than one
 * shared placeholder on every uncovered topic at once — but a new topic should
 * get a drawing here rather than rely on it.
 */

export function GoalArt({ goalKey, size = 44 }: { goalKey: string; size?: number }) {
  return <Illustration name={GOAL_ICON[goalKey] ?? 'sparkle'} size={size} />;
}

export function TopicArt({ topicId, size = 44 }: { topicId: string; size?: number }) {
  // `numbers-more` is the same topic further along, so it gets the same tile
  // rather than falling through to its own emoji.
  if (topicId === 'numbers' || topicId === 'numbers-more') return <NumeralTile numeral="۳" size={size} />;
  if (topicId === 'colours') return <Illustration name="swatches" size={size} />;
  // A topic with no drawn icon gets a drawn sparkle, never its emoji (see
  // LessonIcon below; QA, 2026-10-22).
  return <Illustration name={TOPIC_ICON[topicId] ?? 'sparkle'} size={size} />;
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
    // Both of these were `salaam`, the greeting mark, which fits a lesson on
    // saying hello and nothing else these two kinds contain: "Talk: Tea or
    // coffee?" and "Everyday phrases" are exchanges, not greetings.
    case 'phrases':
      return 'dialogue';
    case 'grammar':
      return 'lattice';
    case 'sentences':
      return 'tiles';
    case 'reading':
      return 'scroll';
    case 'dialogue':
      return 'dialogue';
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
    if (topic === 'numbers' || topic === 'numbers-more') {
      return <RNText style={{ fontFamily: 'NotoNastaliq-Bold', color: palette.gold, fontSize: size * 0.86 }}>۳</RNText>;
    }
    if (topic === 'colours') return <Illustration name="swatches" tile={false} size={size} />;
    // A topic with no drawn icon gets a drawn sparkle, never its emoji: the
    // emoji fallback was exempt from the audit, and two Unit 1 nodes showed
    // 🙏 and 🎙️ among drawn icons (QA, 2026-10-22; standard 86).
    return <Illustration name={TOPIC_ICON[topic] ?? 'sparkle'} tile={false} size={size} />;
  }
  return <Illustration name={lessonIconName(kind)} tile={false} size={size} />;
}
