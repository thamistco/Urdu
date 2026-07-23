import { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme';

const COLORS = [palette.gold, palette.jade, palette.rose, palette.flame, palette.goldLight];
const { width } = Dimensions.get('window');

function Piece({ index }: { index: number }) {
  const t = useSharedValue(0);
  const startX = (index / 24) * width + (Math.random() * 30 - 15);
  const drift = Math.random() * 60 - 30;
  const rot = Math.random() * 720 - 360;
  const size = 6 + Math.random() * 6;
  const color = COLORS[index % COLORS.length];
  const delay = Math.random() * 400;

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 1600 + Math.random() * 700, easing: Easing.out(Easing.quad) }));
  }, [t, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: t.value * 620 },
      { translateX: t.value * drift },
      { rotate: `${t.value * rot}deg` },
    ],
    opacity: 1 - t.value * 0.7,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -20,
          left: startX,
          width: size,
          height: size * 1.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

/** A short, celebratory confetti burst for lesson completion / level-ups. */
export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}
