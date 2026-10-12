import type { ReactNode } from 'react';
import { View } from 'react-native';
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

/** Row of heart pips (used in the lesson player). */
export function Hearts({ count }: { count: number }) {
  return (
    // An image role, because a label on an element with no role is ignored by
    // screen readers on the web: without it "3 of 5 hearts" was in the page
    // and announced nowhere.
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
        <View key={i} style={{ opacity: i < count ? 1 : 0.22 }}>
          <Illustration name="heart" tile={false} size={16} />
        </View>
      ))}
    </View>
  );
}
