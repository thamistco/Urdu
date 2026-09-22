import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Txt, Bold, Heading } from '../components/Text';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Reachable without signing in and without choosing guest — registered
 * outside RootNavigator's auth gate, at a real URL (`/privacy`), because that
 * is what an app store review actually needs: a public link nobody has to log
 * in to open. Settings links here too, for a learner who is already inside.
 *
 * The content states what this build actually does, not a generic template.
 * It has not had a lawyer's review — see the note left for whoever ships this.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Bold className="mb-2 text-[0.9375rem]">{title}</Bold>
      <Txt className="text-[0.8125rem] leading-6 text-paper/80">{children}</Txt>
    </View>
  );
}

export function PrivacyScreen() {
  const nav = useNavigation<Nav>();
  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={nav.canGoBack() ? () => nav.goBack() : undefined} title="Privacy Policy" />
        <Heading className="mb-1 text-lg">Your data, plainly</Heading>
        <Txt className="mb-6 text-[0.75rem] text-paper/55">Last updated 2026-09-22</Txt>

        <Section title="No account is required">
          Harf works fully as a guest. Your lesson progress, streak, hearts, gems and settings are stored only on this
          device, in its local app storage. We never see them, and nothing is sent anywhere unless you turn on sign-in
          below.
        </Section>

        <Section title="If you choose to sign in">
          Signing in with Google or Apple is optional and exists so your progress can follow you to a second device. It
          creates an account identified by the email your provider shares with us, and your progress is copied to that
          account so it can be restored elsewhere. You can stop syncing at any time from Settings; your on-device
          progress keeps working exactly as before.
        </Section>

        <Section title="What we do not do">
          No advertising and no ad network of any kind. No selling, renting or sharing your data with third parties for
          marketing. No microphone access and no voice recording — the app plays recorded Urdu audio to you; it never
          listens to you or scores your accent. No tracking across other apps or websites.
        </Section>

        <Section title="Audio and other assets">
          The Urdu voice recordings are bundled with the app and played from your device. Loading them does not send any
          information about you anywhere.
        </Section>

        <Section title="Deleting your data">
          Uninstalling the app removes everything stored on your device. If you have signed in, deleting your account
          (Settings → Data) removes the copy of your progress stored with your account as well. Resetting your progress
          from Settings clears it without needing to delete the app.
        </Section>

        <Section title="Children">
          Harf is a general-audience language course and is not directed at children under 13. We do not knowingly
          collect personal information from a child under that age.
        </Section>

        <Section title="Changes to this policy">
          If what the app collects changes: for instance, if we add optional crash reporting to fix bugs faster, this
          page will be updated first, and the date above will change.
        </Section>

        <Section title="Contact">Questions about this policy: {'{{SUPPORT_EMAIL}}'}</Section>
      </Screen>
    </View>
  );
}
