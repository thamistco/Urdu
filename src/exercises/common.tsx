import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Urdu, Txt, Eyebrow } from '../components/Text';
import { Illustration } from '../components/Illustration';
import { palette, withAlpha } from '../theme';

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'muted';

const BORDER: Record<ChoiceState, string> = {
  idle: withAlpha(palette.white, 0.12),
  // Picked, but not yet judged. On the matching board this is the whole
  // feedback a learner gets between the two taps, so it has to be unmissable
  // — full-strength yellow, not a tint of it.
  selected: palette.gold,
  correct: palette.jade,
  wrong: palette.rose,
  muted: withAlpha(palette.white, 0.08),
};
const FILL: Record<ChoiceState, string> = {
  idle: palette.ink700,
  selected: withAlpha(palette.gold, 0.22),
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
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        opacity: state === 'muted' ? 0.55 : 1,
      })}
      className={className}
    >
      <View
        className="items-center justify-center rounded-2xl border px-3 py-4"
        style={{
          borderColor: BORDER[state],
          backgroundColor: FILL[state],
          borderWidth: state === 'selected' ? 3 : 2,
          minHeight: 56,
          transform: [{ scale: state === 'selected' ? 1.03 : 1 }],
        }}
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
    <View
      className="rounded-2xl bg-parchment px-6 pb-5 pt-4"
      style={{ minHeight: height, borderWidth: 2, borderColor: palette.ink }}
    >
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

/**
 * Which way the tray fills.
 *
 * Both building exercises lay their tiles out right-to-left, because that is
 * how Urdu is written — the first tile tapped goes on the right. Nothing said
 * so, and a learner who assumes it works the way every other list they have
 * used works will place every letter in a word backwards, be told they are
 * wrong, and have no idea why. One line fixes that.
 */
export function BuildDirection({ roman }: { roman?: boolean }) {
  return (
    <View className="mb-4 flex-row items-center justify-center gap-1.5">
      <Txt style={{ color: palette.gold }} className="text-xs">
        {roman ? '→' : '←'}
      </Txt>
      <Txt className="text-[11px] text-paper/55">
        {roman ? 'builds left to right' : 'builds right to left, like Urdu'}
      </Txt>
    </View>
  );
}

/** A small tap-to-hear button — reading content (sentences, passages,
 *  dialogues) only shows a word's script and roman, never how it sounds,
 *  unless something on screen offers to say it. */
export function SpeakerButton({
  onPress,
  size = 30,
  label = 'Play audio',
}: {
  onPress: () => void;
  size?: number;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: withAlpha(palette.gold, 0.18),
          borderWidth: 1.5,
          borderColor: palette.gold,
        }}
      >
        <Illustration name="speaker" tile={false} size={size * 0.56} />
      </View>
    </Pressable>
  );
}

export { palette, withAlpha } from '../theme';
export { Urdu };
