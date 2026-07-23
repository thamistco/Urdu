import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback pairs with audio for multi-sensory reinforcement.
 * Kept subtle — a gentle nudge, never a jolt. Fully mutable via settings.
 */

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

const safe = (fn: () => Promise<void>) => {
  if (!enabled || Platform.OS === 'web') return;
  fn().catch(() => {});
};

export const haptics = {
  select: () => safe(() => Haptics.selectionAsync()),
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  correct: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  incorrect: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  celebrate: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
