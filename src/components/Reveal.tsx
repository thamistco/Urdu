import { ReactNode, useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Gentle "rise-in" entrance — fade + small upward translate. The signature calm
 * motion of the app. Honors the reduced-motion setting (accessibility).
 */
export function Reveal({
  children,
  delay = 0,
  distance = 10,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: any;
}) {
  const reduced = useSettingsStore((s) => s.reducedMotion);
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      p.value = 1;
      return;
    }
    p.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, [delay, reduced, p]);

  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * distance }],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
