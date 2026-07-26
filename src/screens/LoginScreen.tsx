import { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Reveal } from '../components/Reveal';
import { GeoDivider } from '../components/GeoDivider';
import { Display, Txt, Bold, Eyebrow, Urdu, urduGlyph } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { useAuthStore } from '../store/useAuthStore';

function ProviderButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={({ pressed }) => ({ transform: [{ translateY: pressed ? 2 : 0 }] })}
    >
      <View
        className="flex-row items-center justify-center gap-3 rounded-2xl py-4"
        style={{ backgroundColor: palette.paper, marginBottom: 4 }}
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

export function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const busy = useAuthStore((s) => s.busy);
  const authConfigured = useAuthStore((s) => s.authConfigured);
  const [note, setNote] = useState<string | null>(null);

  const handle = async (provider: 'google' | 'apple') => {
    setNote(null);
    const res = await signIn(provider);
    if (!res.ok && res.message) setNote(res.message);
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <Reveal>
          <View className="items-center">
            <Urdu style={{ color: palette.gold, ...urduGlyph(64) }}>حرف</Urdu>
            <Display className="mb-2 text-4xl">Harf</Display>
            <GeoDivider />
            <Txt className="mb-10 max-w-[300px] text-center text-[15px] leading-6 text-paper/70">
              Learn to read Urdu, every letter in all four of its faces. Sign in to keep your
              streak and progress safe across devices.
            </Txt>
          </View>
        </Reveal>

        <Reveal delay={80}>
          <View className="gap-3">
            <ProviderButton label="Continue with Google" onPress={() => handle('google')} loading={busy === 'google'} />
            <ProviderButton label="Continue with Apple" onPress={() => handle('apple')} loading={busy === 'apple'} />
            <View className="my-1 flex-row items-center gap-3">
              <View className="h-px flex-1" style={{ backgroundColor: withAlpha(palette.cream, 0.12) }} />
              <Eyebrow className="text-paper/35">or</Eyebrow>
              <View className="h-px flex-1" style={{ backgroundColor: withAlpha(palette.cream, 0.12) }} />
            </View>
            <Button variant="ghost" onPress={continueAsGuest}>
              Continue as a guest
            </Button>
          </View>
        </Reveal>

        {note && (
          <Reveal>
            <View
              className="mt-5 rounded-xl border-l-2 p-3"
              style={{ borderLeftColor: palette.gold, backgroundColor: withAlpha(palette.gold, 0.08) }}
            >
              <Txt className="text-xs leading-5 text-paper/75">{note}</Txt>
            </View>
          </Reveal>
        )}

        {!authConfigured && !note && (
          <Reveal delay={160}>
            <Txt className="mt-5 text-center text-[11px] leading-5 text-paper/35">
              Guest progress is saved on this device. Connect a backend to enable Google & Apple
              sign-in and cloud save.
            </Txt>
          </Reveal>
        )}
      </View>
    </Screen>
  );
}
