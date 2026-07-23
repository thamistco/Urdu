import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Urdu, Txt, Eyebrow } from '../components/Text';
import { palette, withAlpha } from '../theme';

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'muted';

const BORDER: Record<ChoiceState, string> = {
  idle: withAlpha(palette.white, 0.12),
  correct: palette.jade,
  wrong: palette.rose,
  muted: withAlpha(palette.white, 0.08),
};
const FILL: Record<ChoiceState, string> = {
  idle: palette.ink700,
  correct: withAlpha(palette.jade, 0.18),
  wrong: withAlpha(palette.rose, 0.18),
  muted: palette.ink800,
};

/** A single selectable answer tile. */
export function Choice({
  children,
  state = 'idle',
  onPress,
  disabled,
  className = '',
}: {
  children: ReactNode;
  state?: ChoiceState;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        opacity: state === 'muted' ? 0.55 : 1,
      })}
      className={className}
    >
      <View
        className="items-center justify-center rounded-2xl border px-3 py-4"
        style={{ borderColor: BORDER[state], backgroundColor: FILL[state], borderWidth: 2 }}
      >
        {children}
      </View>
    </Pressable>
  );
}

/** The prompt "paper" — the warm surface the script/emoji lives on. */
export function PromptCard({
  children,
  label,
  height = 160,
}: {
  children: ReactNode;
  label?: string;
  height?: number;
}) {
  return (
    <View className="rounded-2xl bg-paper px-6 pb-5 pt-4" style={{ minHeight: height }}>
      {label ? (
        <Eyebrow style={{ color: withAlpha(palette.ink, 0.5) }} className="mb-2 text-center">
          {label}
        </Eyebrow>
      ) : null}
      <View className="flex-1 items-center justify-center">{children}</View>
    </View>
  );
}

export function Question({ children }: { children: ReactNode }) {
  return <Txt className="mb-4 text-center text-base text-paper/80">{children}</Txt>;
}

export { palette, withAlpha } from '../theme';
export { Urdu };
