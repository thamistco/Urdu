import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { palette } from '../theme';

/** Smoothly-animated progress bar. Spring on grow → feels alive, not mechanical. */
export function ProgressBar({
  progress,
  color = palette.gold,
  track = 'rgba(255,255,255,0.1)',
  height = 12,
  spring = true,
}: {
  progress: number; // 0..1
  color?: string;
  track?: string;
  height?: number;
  spring?: boolean;
}) {
  const w = useSharedValue(0);
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    w.value = spring ? withSpring(clamped, { damping: 18, stiffness: 120 }) : withTiming(clamped, { duration: 350 });
  }, [progress, spring, w]);

  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={{ height, backgroundColor: track, borderRadius: height / 2, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: height / 2 }, style]}>
        {/* subtle top highlight for a soft, tactile sheen */}
        <View
          style={{
            position: 'absolute',
            top: height * 0.18,
            left: 6,
            right: 6,
            height: height * 0.22,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.25)',
          }}
        />
      </Animated.View>
    </View>
  );
}
