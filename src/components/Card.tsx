import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { feedback } from '../lib/feedback';

/** Raised surface. Optional left accent stripe + tap behaviour. */
export function Card({
  children,
  onPress,
  accent,
  className = '',
  style,
  paper = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: string;
  className?: string;
  style?: ViewStyle;
  paper?: boolean;
}) {
  const base = paper ? 'bg-paper' : 'bg-ink-700';
  const inner = (
    <View
      className={`rounded-2xl border border-white/10 p-5 ${base} ${className}`}
      style={[
        accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null,
        style,
      ]}
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
