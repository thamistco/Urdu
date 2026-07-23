import { View } from 'react-native';
import { Bold, Txt } from './Text';
import { palette, withAlpha } from '../theme';
import { HEARTS_MAX } from '../lib/gamification';

/** Compact stat chip used in headers — streak, gems, hearts. */
export function StatChip({
  icon,
  value,
  color = palette.gold,
}: {
  icon: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: withAlpha(color, 0.14), borderWidth: 1, borderColor: withAlpha(color, 0.3) }}
    >
      <Txt style={{ fontSize: 15 }}>{icon}</Txt>
      <Bold style={{ color }} className="text-sm">
        {value}
      </Bold>
    </View>
  );
}

/** The row of live stats shown at the top of learning screens. */
export function StatBar({
  streak,
  gems,
  hearts,
}: {
  streak: number;
  gems: number;
  hearts: number;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <StatChip icon="🔥" value={streak} color={palette.flame} />
      <StatChip icon="💠" value={gems} color={palette.jadeLight} />
      <StatChip icon="❤️" value={`${hearts}/${HEARTS_MAX}`} color={palette.rose} />
    </View>
  );
}

/** Row of heart pips (used in the lesson player). */
export function Hearts({ count }: { count: number }) {
  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: HEARTS_MAX }).map((_, i) => (
        <Txt key={i} style={{ fontSize: 16, opacity: i < count ? 1 : 0.22 }}>
          {i < count ? '❤️' : '🤍'}
        </Txt>
      ))}
    </View>
  );
}
