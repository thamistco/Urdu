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
 * The course's letter order and the themes and grammar sequence of its early
 * units are adapted from "Basic Urdu" by Rajiv Ranjan. Its licence asks for
 * attribution wherever the adapted work goes, and until this screen existed
 * the only attribution was CREDITS.md in the repository, which no learner ever
 * sees. That file also called the licence CC BY. It is CC BY-NC 4.0, which
 * does not allow commercial use. Both were wrong for two months.
 *
 * Reachable without an account, like Privacy and Terms, for the same reason:
 * someone deciding whether to use the app can read it first.
 */

const BOOK_URL = 'https://openbooks.lib.msu.edu/urdu/';
const LICENCE_URL = 'https://creativecommons.org/licenses/by-nc/4.0/';
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

        <Section title="Course structure">
          <Para>
            The order the letters are introduced in, and the themes and grammar sequence of the early units, are adapted
            from Basic Urdu by Rajiv Ranjan, Michigan State University Libraries. Copyright 2022 Rajiv Ranjan, licensed
            under Creative Commons Attribution-NonCommercial 4.0 International.
          </Para>
          <Para>
            Harf has changed it: the material is reordered, rewritten and turned into exercises. The original author
            does not endorse Harf.
          </Para>
          <Link label="Basic Urdu" url={BOOK_URL} />
          <Link label="CC BY-NC 4.0 licence" url={LICENCE_URL} />
        </Section>

        <Section title="Typefaces">
          <Para>Noto Nastaliq Urdu, Fraunces and Public Sans, each used under the SIL Open Font License 1.1.</Para>
          <Link label="SIL Open Font License" url={OFL_URL} />
        </Section>

        <Section title="Voices">
          <Para>The recorded words and sentences are synthesised with Google Cloud Text-to-Speech.</Para>
        </Section>

        <Section title="Sounds and illustrations">
          <Para>The feedback sounds and the drawn illustrations were made for Harf.</Para>
        </Section>

        <Section title="Software">
          <Para>
            Harf is built with React Native, Expo and other open-source libraries, each under its own licence.
          </Para>
        </Section>
      </Screen>
    </View>
  );
}
