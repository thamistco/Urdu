import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Bold, Txt } from './Text';
import { Illustration } from './Illustration';
import { palette, withAlpha } from '../theme';
import { HEARTS_MAX } from '../lib/gamification';

/** Compact stat chip used in headers — streak, gems, hearts. */
export function StatChip({
  icon,
  value,
  unit,
  color = palette.gold,
}: {
  /** A drawn mark from the icon set — see `Illustration`. */
  icon: ReactNode;
  value: string | number;
  /**
   * What the number counts, shown beside it. A tester read the Home header as
   * "1 · 32" — a flame and a gem are not self-explanatory to somebody on day
   * one, and a bare number next to each said nothing about either.
   */
  unit?: string;
  color?: string;
}) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: withAlpha(color, 0.14), borderWidth: 1, borderColor: withAlpha(color, 0.3) }}
    >
      {icon}
      <Bold style={{ color }} className="text-sm">
        {value}
        {unit ? <Txt style={{ color }} className="text-xs">{` ${unit}`}</Txt> : null}
      </Bold>
    </View>
  );
}

/** The row of live stats shown at the top of learning screens. */
export function StatBar({ streak, gems, hearts }: { streak: number; gems: number; hearts: number }) {
  return (
    <View className="flex-row items-center justify-between">
      <StatChip icon={<Illustration name="flame" tile={false} size={16} />} value={streak} color={palette.flame} />
      <StatChip icon={<Illustration name="gem" tile={false} size={16} />} value={gems} color={palette.jadeLight} />
      <StatChip
        icon={<Illustration name="heart" tile={false} size={16} />}
        value={`${hearts}/${HEARTS_MAX}`}
        color={palette.rose}
      />
    </View>
  );
}

/**
 * The window's width at normal text size: its width divided by how much text
 * is scaled, by the system on a phone or by the root font size on the web.
 * Read on every render, since the web gives no event when the text size
 * changes; the lesson header renders again on every step.
 */
export function useTextWidth(): number {
  const { width, fontScale } = useWindowDimensions();
  const rootPx =
    Platform.OS === 'web' && typeof document !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
  return width / Math.max(fontScale || 1, rootPx / 16);
}

/**
 * Row of heart pips (used in the lesson player).
 *
 * `free` while hearts cost nothing (Unit 1, lib/hearts.ts). Five full pips
 * there looked exactly like five hearts that happened not to have dropped, so
 * the first wrong answer after Unit 1 was the first anyone learned that hearts
 * could go, and a tester met "Out of hearts" having never seen one leave
 * (2026-10-12). So the free stretch says it is free, and a lost heart says so:
 * the pip that went is marked for a moment and a screen reader hears it.
 */
export function Hearts({ count, free = false }: { count: number; free?: boolean | 'unit' | 'lesson' | null }) {
  // Under 300 text-widths the badge says only "Free"; the label read aloud
  // keeps the whole rule (QA round 5, M27). Counted in text, not pixels: a
  // 320px phone at 200% text is still 320px wide, and the badge read "Fre…"
  // (design review, 2026-10-19, Q-072).
  const tight = useTextWidth() < 300;
  const prev = useRef(count);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    const dropped = count < prev.current;
    prev.current = count;
    if (!dropped) return;
    setLost(true);
    const t = setTimeout(() => setLost(false), 1600);
    return () => clearTimeout(t);
  }, [count]);

  if (free) {
    return (
      <View
        accessible
        accessibilityRole="image"
        // Not "Hearts are…": the checks find speaker buttons by a label that
        // starts "Hear", and this one was taken for one.
        accessibilityLabel={
          free === 'lesson'
            ? 'This lesson is free: wrong answers cost no hearts'
            : 'Unit 1 is free: wrong answers cost no hearts until you finish it'
        }
        className="flex-row items-center gap-1"
        // Shrinks rather than pushing the header wider than the screen at
        // large text sizes (QA, 2026-10-13, M27).
        style={{ flexShrink: 1, minWidth: 0 }}
      >
        <Illustration name="heart" tile={false} size={16} />
        <Bold numberOfLines={1} style={{ color: palette.roseLight, flexShrink: 1 }} className="text-xs">
          {/* Not "in Unit 1": a learner who jumps ahead keeps free hearts
              until Unit 1 is finished, and read "Free in Unit 1" over a
              Unit 36 lesson as a mistake (QA report, 2026-10-12). */}
          {tight ? 'Free' : free === 'lesson' ? 'Free this lesson' : 'Free until Unit 1 is done'}
        </Bold>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5">
      {lost ? (
        <Bold accessibilityLiveRegion="polite" style={{ color: palette.roseLight }} className="text-xs">
          {`−1 heart`}
        </Bold>
      ) : null}
      {/* An image role, because a label on an element with no role is ignored
          by screen readers on the web: without it "3 of 5 hearts" was in the
          page and announced nowhere. */}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${count} of ${HEARTS_MAX} hearts`}
        className="flex-row items-center gap-1"
      >
        {/* Drawn marks, not ❤️/🤍. System emoji render differently on every
            platform — which is the exact problem the icon set exists to solve —
            and next to the drawn flame and gem in the same bar they looked like
            they belonged to a different app. */}
        {Array.from({ length: HEARTS_MAX }).map((_, i) => (
          <View
            key={i}
            style={{
              opacity: i < count ? 1 : lost && i === count ? 0.6 : 0.22,
              transform: [{ scale: lost && i === count ? 1.25 : 1 }],
            }}
          >
            <Illustration name="heart" tile={false} size={16} />
          </View>
        ))}
      </View>
    </View>
  );
}
