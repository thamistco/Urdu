import { ReactNode } from 'react';
import { Pressable, View, ViewStyle, AccessibilityRole } from 'react-native';
import { feedback } from '../lib/feedback';

/** Raised surface. Optional leading-edge accent stripe + tap behaviour. */
export function Card({
  children,
  onPress,
  accent,
  className = '',
  style,
  paper = false,
  accessibilityRole,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: string;
  className?: string;
  style?: ViewStyle;
  paper?: boolean;
  /** For a card that is an announcement rather than a surface — a screen reader
   *  otherwise reaches it only by traversing past content the learner is
   *  already looking at. */
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
}) {
  const base = paper ? 'bg-parchment' : 'bg-ink-700';
  const inner = (
    <View
      className={`rounded-2xl border border-white/10 p-5 ${base} ${className}`}
      style={[accent ? { borderStartWidth: 4, borderStartColor: accent } : null, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}
    >
      {inner}
    </Pressable>
  );
}
