import { ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Urdu, Txt, Eyebrow } from '../components/Text';
import { Illustration } from '../components/Illustration';
import { palette, withAlpha } from '../theme';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { isPlaying, onPlaybackChange } from '../lib/speech';
import { useSettingsStore } from '../store/useSettingsStore';

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
  accessibilityLabel,
  style,
}: {
  children: ReactNode;
  state?: ChoiceState;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  /** For a choice whose content is not itself readable text — a bare glyph
   *  or icon, say — since without one a screen reader falls back to reading
   *  whatever text node is inside, which for a lone script character is a
   *  materially weaker signal than a real label. Optional because most
   *  callers' children already read fine on their own. */
  accessibilityLabel?: string;
  /** Extra layout (styling) a caller needs per-instance rather
   *  than shared across every `Choice`. Merged alongside the press-state
   *  style this component already computes, never replacing it. For margins,
   *  wrap the `Choice` in a separate `View` instead, since react-native-web
   *  does not properly render logical margins (`marginStart`/`marginEnd`)
   *  through function-valued style callbacks. */
  style?: { marginTop?: number; marginBottom?: number };
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => ({
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        opacity: state === 'muted' ? 0.55 : 1,
        ...style,
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
      <Txt className="text-[0.6875rem] text-paper/55">
        {roman ? 'builds left to right' : 'builds right to left, like Urdu'}
      </Txt>
    </View>
  );
}

/** A small tap-to-hear button — reading content (sentences, passages,
 *  dialogues) only shows a word's script and roman, never how it sounds,
 *  unless something on screen offers to say it. */
/**
 * Which speaker button last started something. Several share a screen (each
 * line of a dialogue has one), and only the one that was tapped should show
 * that it is playing. A module counter rather than context: the buttons are
 * scattered through unrelated exercises and need only this one number.
 */
let speakerOwner = 0;
const ownerListeners = new Set<() => void>();
const claimSpeaker = () => {
  speakerOwner += 1;
  ownerListeners.forEach((l) => l());
  return speakerOwner;
};

/** How long a tap may wait for audio to start before the button gives up on it
 *  (muted, no clip, no voice). Long enough for a first clip to load. */
const START_GRACE_MS = 1500;

/**
 * A round speaker that shows when it is speaking.
 *
 * It used to scale while pressed and otherwise look the same silent or
 * playing, so a learner could not tell whether a tap had registered, least of
 * all on a first clip that takes a moment to load. It now fills, gains a cream
 * ring and a soft pulsing halo from the tap until its audio finishes, driven by
 * `onPlaybackChange` in lib/speech.ts. With reduced motion on, the halo holds
 * still. If nothing starts within START_GRACE_MS it returns to rest.
 */
export function SpeakerButton({
  onPress,
  size = 30,
  label = 'Play audio',
}: {
  onPress: () => void;
  size?: number;
  label?: string;
}) {
  const reduced = useSettingsStore((st) => st.reducedMotion);
  const [mine, setMine] = useState<number | null>(null);
  const [owner, setOwner] = useState(speakerOwner);
  const [on, setOn] = useState(isPlaying);
  const started = useRef(false);

  useEffect(() => onPlaybackChange(setOn), []);
  useEffect(() => {
    const l = () => setOwner(speakerOwner);
    ownerListeners.add(l);
    return () => {
      ownerListeners.delete(l);
    };
  }, []);

  const active = mine !== null && mine === owner;

  // Back to rest once this button's audio has started and then stopped.
  useEffect(() => {
    if (!active) return;
    if (on) started.current = true;
    else if (started.current) setMine(null);
  }, [on, active]);

  // Or if nothing ever started.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      if (!started.current) setMine(null);
    }, START_GRACE_MS);
    return () => clearTimeout(t);
  }, [active]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    if (active && !reduced) {
      pulse.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [active, reduced, pulse]);
  const halo = useAnimatedStyle(() => ({
    opacity: active ? 0.55 - pulse.value * 0.35 : 0,
    transform: [{ scale: 1.18 + pulse.value * 0.14 }],
  }));

  return (
    <Pressable
      onPress={() => {
        started.current = false;
        setMine(claimSpeaker());
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: palette.gold,
          },
          halo,
        ]}
      />
      <View
        testID={active ? 'speaker-playing' : 'speaker-idle'}
        className="items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: withAlpha(palette.gold, active ? 0.55 : 0.18),
          borderWidth: active ? 2 : 1.5,
          borderColor: active ? palette.cream : palette.gold,
        }}
      >
        <Illustration name="speaker" tile={false} size={size * 0.56} />
      </View>
    </Pressable>
  );
}

export { palette, withAlpha } from '../theme';
export { Urdu };
