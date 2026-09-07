import { ReactNode, useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * URD-015: dismissing the path-moved notice removed 275px of content in the
 * same instant as the tap that dismissed it, so a learner's finger — still
 * settling from that tap — could land on whatever had already snapped into
 * its place. This is the duration an exit holds its layout space, faded but
 * still fully present, before the caller is told it's safe to stop
 * rendering it: comfortably past any real gesture's press-to-release time,
 * on purpose, rather than a value tuned to the minimum that clears a check.
 */
const EXIT_MS = 300;

/**
 * Gentle "rise-in" entrance — fade + small upward translate. The signature calm
 * motion of the app. Honors the reduced-motion setting (accessibility).
 *
 * Optionally also a "fade-out" exit, for content a learner dismisses rather
 * than content that just appears once: pass `visible={false}` and the card
 * fades in place — opacity only, no layout change — instead of vanishing.
 * The caller is still the one that stops rendering it; `onExited` is the cue
 * for when that's safe to do without a tap finding the wrong thing where it
 * used to be. Every existing caller that never sets `visible` is unaffected
 * — that prop defaults true and the exit path never runs.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 10,
  style,
  visible = true,
  onExited,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  visible?: boolean;
  /** Fires once the exit finishes. Never fires if `visible` stays true. */
  onExited?: () => void;
}) {
  const reduced = useSettingsStore((s) => s.reducedMotion);
  const enter = useSharedValue(reduced ? 1 : 0);
  const exit = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, [delay, reduced, enter]);

  /**
   * THE CRITIC, URD-015: `onExited` is a fresh function every render (every
   * caller passes an inline arrow), and `reduced` can change too. Either one
   * used to sit in the effect below's dependency array, so an unrelated
   * re-render mid-exit — a double-tap on the dismiss button re-firing the
   * same store action, or the URD-014 stacking hand-off revealing a second
   * notice while the first is still fading — reran the effect. React tears
   * down the previous run's cleanup first, which cancelled the pending
   * reduced-motion `setTimeout` with nothing left to reschedule it (the
   * `wasVisible` guard below only starts an exit once), so the "dismissed"
   * card simply never left the screen. Reachable with the app's own Reduce
   * Motion setting on, reproduced with a real double-tap. Reading both
   * through a ref means only a genuine `visible` transition can start or
   * cancel an exit — a parent re-render for any other reason can't.
   */
  const latest = useRef({ onExited, reduced });
  useEffect(() => {
    latest.current = { onExited, reduced };
  });

  // Tracks the previous `visible` so the exit only ever starts on a real
  // true→false transition, not on every render this prop happens to appear
  // in (mount included — a card that starts hidden is not "exiting").
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (wasVisible.current && !visible) {
      if (latest.current.reduced) {
        // No animated fade for reduced motion, but the same safety window
        // still holds the layout before disappearing — the point of this
        // delay is timing, not motion, so it applies either way.
        const t = setTimeout(() => latest.current.onExited?.(), EXIT_MS);
        wasVisible.current = visible;
        return () => clearTimeout(t);
      }
      exit.value = withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(() => latest.current.onExited?.())();
      });
    }
    wasVisible.current = visible;
  }, [visible, exit]);

  const anim = useAnimatedStyle(() => ({
    opacity: enter.value * exit.value,
    transform: [{ translateY: (1 - enter.value) * distance }],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
