import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Txt, Bold, Heading } from '../components/Text';
import { ContactLine, HAS_CONTACT } from '../components/ContactLine';
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
        <Txt className="mb-6 text-[0.75rem] text-paper/55">Last updated 2026-10-29</Txt>

        <Section title="Who we are">
          Who runs Qaaf, and how to contact them, will be added here before Qaaf launches.
        </Section>

        <Section title="What Qaaf is">
          Qaaf is a self-study Urdu course: lessons, vocabulary, grammar and spaced-repetition review. It is free, has
          no advertisements, and does not require an account to use.
        </Section>

        <Section title="No certification">
          The level labels in the app describe how difficult the content is, not an accredited qualification. Qaaf does
          not certify fluency and nothing here should be presented as a formal language credential.
        </Section>

        <Section title="Your progress">
          Your progress is stored only on this device: in this browser on the website, in the app on a phone. Clearing
          this site’s data or the app’s storage, uninstalling the app, private browsing, or changing browser or device
          starts you afresh, and we cannot get it back. Where sign-in is offered, signing in keeps a copy you can carry
          on from elsewhere.
        </Section>

        <Section title="Using the app fairly">
          Please don’t try to break, reverse-engineer for harmful purposes, or resell access to the app. It is provided
          for personal, family and classroom language learning.
        </Section>

        <Section title="No warranty">
          Qaaf is provided as-is. We work hard to keep the content accurate and the app working, but we make no
          guarantee that it is error-free or that it will always be available.
        </Section>

        <Section title="Changes">
          We may update the app and these terms over time. If these terms change, the date above will change.
        </Section>

        {HAS_CONTACT ? (
          <Section title="Contact">
            <ContactLine about="these terms" />
          </Section>
        ) : null}
      </Screen>
    </View>
  );
}
