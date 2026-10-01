import { Linking, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Txt, Bold, Heading } from '../components/Text';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Who else's work is in the app, and on what terms.
 *
 * The course content is written for Harf and is not adapted from any
 * textbook. Early planning notes referenced "Basic Urdu" by Rajiv Ranjan;
 * every trace of that adaptation was replaced in October 2026 (rewritten
 * scenes, independently developed structure), so the CC BY-NC attribution
 * that used to live here is gone. The full history is in
 * docs/COMMERCIAL_READINESS.md.
 *
 * Reachable without an account, like Privacy and Terms, for the same reason:
 * someone deciding whether to use the app can read it first.
 */

const OFL_URL = 'https://openfontlicense.org';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Bold className="mb-2 text-[0.9375rem]">{title}</Bold>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Txt className="mb-2 text-[0.8125rem] leading-6 text-paper/80">{children}</Txt>;
}

function Link({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}, opens ${url}`}
      onPress={() => Linking.openURL(url)}
    >
      <Txt className="mb-1 text-[0.8125rem] leading-6 text-gold underline">{label}</Txt>
    </Pressable>
  );
}

export function CreditsScreen() {
  const nav = useNavigation<Nav>();
  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={nav.canGoBack() ? () => nav.goBack() : undefined} title="Credits" />
        <Heading className="mb-6 text-lg">Whose work is in Harf</Heading>

        <Section title="Course content">
          <Para>
            Every lesson, sentence, reading and dialogue in Harf is written for this app. The course structure was
            developed independently and is not adapted from any textbook.
          </Para>
        </Section>

        <Section title="Typefaces">
          <Para>Noto Nastaliq Urdu, Fraunces and Public Sans, each used under the SIL Open Font License 1.1.</Para>
          <Link label="SIL Open Font License" url={OFL_URL} />
        </Section>

        <Section title="Voices">
          <Para>The recorded words and sentences are synthesised with Google Cloud Text-to-Speech.</Para>
        </Section>

        <Section title="Sounds and pictures">
          <Para>The feedback sounds, the drawn illustrations and the evening sky were made for Harf.</Para>
        </Section>

        <Section title="Software">
          <Para>
            Harf is written with Expo and React, and runs in your browser through React Native for Web. It also uses
            other open-source libraries, each under its own licence.
          </Para>
          <Pressable accessibilityRole="link" onPress={() => nav.navigate('Licences')}>
            <Txt className="mb-1 text-[0.8125rem] leading-6 text-gold underline">Open-source licences</Txt>
          </Pressable>
        </Section>
      </Screen>
    </View>
  );
}
