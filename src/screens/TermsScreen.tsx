import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Txt, Bold, Heading } from '../components/Text';
import { ContactLine } from '../components/ContactLine';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Same reachability rules as PrivacyScreen — see the note there. */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Bold className="mb-2 text-[0.9375rem]">{title}</Bold>
      <Txt className="text-[0.8125rem] leading-6 text-paper/80">{children}</Txt>
    </View>
  );
}

export function TermsScreen() {
  const nav = useNavigation<Nav>();
  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={nav.canGoBack() ? () => nav.goBack() : undefined} title="Terms of Service" />
        <Heading className="mb-1 text-lg">The short version</Heading>
        <Txt className="mb-6 text-[0.75rem] text-paper/55">Last updated 2026-09-22</Txt>

        <Section title="What Harf is">
          Harf is a self-study Urdu course: lessons, vocabulary, grammar and spaced-repetition review. It is free, has
          no advertisements, and does not require an account to use.
        </Section>

        <Section title="No certification">
          The level labels in the app describe how difficult the content is, not an accredited qualification. Harf does
          not certify fluency and nothing here should be presented as a formal language credential.
        </Section>

        <Section title="Your progress">
          By default your progress is stored only on your device and can be lost if you uninstall the app, clear its
          storage, or switch devices without signing in first. Signing in is the way to protect against that; using the
          app without it is a choice you are free to make; we are not responsible for progress lost as a result.
        </Section>

        <Section title="Using the app fairly">
          Please don’t try to break, reverse-engineer for harmful purposes, or resell access to the app. It is provided
          for personal, non-commercial language learning.
        </Section>

        <Section title="No warranty">
          Harf is provided as-is. We work hard to keep the content accurate and the app working, but we make no
          guarantee that it is error-free or that it will always be available.
        </Section>

        <Section title="Changes">
          We may update the app and these terms over time. Continuing to use Harf after a change means you accept the
          updated terms.
        </Section>

        <Section title="Contact">
          <ContactLine about="these terms" />
        </Section>
      </Screen>
    </View>
  );
}
