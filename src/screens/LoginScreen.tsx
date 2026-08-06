import { useState } from 'react';
import { View, Pressable, ActivityIndicator, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Reveal } from '../components/Reveal';
import { Wordmark } from '../components/Wordmark';
import { EveningScene, SAFE_TOP, SAFE_TOP_LIMIT, SAFE_BOTTOM } from '../components/EveningScene';
import { Txt, Bold } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { useAuthStore } from '../store/useAuthStore';

function ProviderButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => ({ transform: [{ translateY: pressed ? 2 : 0 }] })}
    >
      <View
        className="flex-row items-center justify-center gap-3 rounded-2xl py-3.5"
        style={{ backgroundColor: palette.parchment }}
      >
        {loading ? (
          <ActivityIndicator color={palette.ink} />
        ) : (
          <Bold style={{ color: palette.ink }} className="text-[15px]">
            {label}
          </Bold>
        )}
      </View>
    </Pressable>
  );
}

/**
 * The front door.
 *
 * This is the one screen that stands on `EveningScene` rather than the drawn
 * landscape, and the whole layout is built around the two bands of that picture
 * that are dark enough to carry text. The name goes in the top band, the
 * controls in the bottom one, and the middle — the sunset — is left alone.
 *
 * That is why the two zones are fixed heights taken from the window rather than
 * `flex` around a centred column, which is what this screen used to be. A
 * centred column puts a paragraph and three buttons straight across the sun,
 * where the background measures 1.04:1 against the text on it. The top inset is
 * taken out of the top band because the bands are fractions of the *window* —
 * the picture spans the whole of it, while this content starts below the notch.
 *
 * The copy is short for the same reason. There is 28% of the screen below the
 * sunset and everything has to live in it, so the tagline is a line rather than
 * a paragraph. `check:scenery` measures what is actually behind each line of
 * text on this screen, so a stack that grows back up into the sun fails there
 * rather than shipping.
 */
export function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const busy = useAuthStore((s) => s.busy);
  const authConfigured = useAuthStore((s) => s.authConfigured);
  const [note, setNote] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const handle = async (provider: 'google' | 'apple') => {
    setNote(null);
    const res = await signIn(provider);
    if (!res.ok && res.message) setNote(res.message);
  };

  /**
   * The name is sized to its band, and the band grows if the name needs it.
   *
   * At a fixed 52 the wordmark was taller than the band on every phone shorter
   * than about 900pt, so it overflowed upward and the ح was sliced off by the
   * top of the screen.
   *
   * Two attempts failed here by assuming the block scales with its font size. It
   * does not: rendered at 46 it is 152pt tall and at 52 it is 164, so 2pt of it
   * follow the font and 60 do not. Those 60 are the divider and the gaps around
   * it, and on a 568pt screen they are most of an 18% band on their own, which
   * is why a proportional shrink kept clipping however small the multiplier got.
   *
   * So the band takes what the mark needs, up to the point where the picture
   * stops being dark (`SAFE_TOP_LIMIT`), and the mark is solved for the band
   * rather than scaled toward it.
   */
  const MARK_FIXED = 60;
  const MARK_PER_PT = 2;
  const MARK_MAX = 52;
  const bandLimit = Math.max(height * SAFE_TOP_LIMIT - insets.top, 0);
  const topBand = Math.max(height * SAFE_TOP - insets.top, Math.min(bandLimit, MARK_PER_PT * MARK_MAX + MARK_FIXED));
  const markSize = Math.round(Math.max(22, Math.min(MARK_MAX, (topBand - MARK_FIXED) / MARK_PER_PT)));

  /**
   * How much of the screen the controls actually need, measured rather than
   * assumed, and handed to the picture so its scrim can come up to meet them.
   *
   * `1 - SAFE_BOTTOM` is 28% of the height, which is generous at 900pt and not
   * nearly enough at 568, where this stack ran off the bottom of the screen.
   * Until the first layout pass reports a height there is nothing to measure,
   * so it starts at the constant and settles on the real number immediately.
   */
  const [stackHeight, setStackHeight] = useState(0);
  const onStack = (e: LayoutChangeEvent) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    if (h && h !== stackHeight) setStackHeight(h);
  };
  const needed = stackHeight + Math.max(insets.bottom, 8) + 16;
  const safeBottom = stackHeight ? Math.max(0.4, Math.min(SAFE_BOTTOM, 1 - needed / height)) : SAFE_BOTTOM;
  const bottomBand = height * (1 - safeBottom);

  return (
    <Screen scroll={false} padded={false} backdrop={<EveningScene safeBottom={safeBottom} />}>
      <View className="flex-1">
        <View style={{ height: topBand }} className="items-center justify-end">
          <Reveal>
            <Wordmark size={markSize} />
          </Reveal>
        </View>

        {/* The picture. Nothing may be placed here. */}
        <View className="flex-1" />

        <View
          onLayout={onStack}
          style={{ minHeight: bottomBand, paddingBottom: Math.max(insets.bottom, 8) }}
          className="justify-center px-5"
        >
          <Reveal delay={80}>
            {/* Two lines, where there was one that assumed its own point.
                "Every letter, in all four of its faces" means nothing to
                someone who has not yet seen that a letter has faces, and this
                is the screen where nobody has. The fact comes first now.

                The room came from the "or" rule that used to sit between the
                providers and the guest button: a band this tight can afford
                decoration or it can afford saying what the app is, and the
                ghost button is already distinct enough to separate itself. */}
            <Txt className="mb-3 text-center text-[13px] leading-5 text-paper/70">
              The whole language, not a phrasebook. The alphabet, the words, the grammar and the sound of it.
            </Txt>
            <View className="gap-2.5">
              <ProviderButton
                label="Continue with Google"
                onPress={() => handle('google')}
                loading={busy === 'google'}
              />
              <ProviderButton label="Continue with Apple" onPress={() => handle('apple')} loading={busy === 'apple'} />
              <Button variant="ghost" onPress={continueAsGuest}>
                Continue as a guest
              </Button>
            </View>
          </Reveal>

          {note && (
            <Reveal>
              <View
                className="mt-3 rounded-xl border-l-2 p-2.5"
                style={{ borderLeftColor: palette.gold, backgroundColor: withAlpha(palette.gold, 0.08) }}
              >
                <Txt className="text-[11px] leading-4 text-paper/75">{note}</Txt>
              </View>
            </Reveal>
          )}

          {!authConfigured && !note && (
            <Reveal delay={160}>
              <Txt className="mt-3 text-center text-[11px] leading-4 text-paper/70">
                Signing in isn’t ready yet. Your progress stays on this device.
              </Txt>
            </Reveal>
          )}
        </View>
      </View>
    </Screen>
  );
}
