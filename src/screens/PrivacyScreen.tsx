import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Txt, Bold, Heading } from '../components/Text';
import { ContactLine, HAS_CONTACT } from '../components/ContactLine';
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
        <Txt className="mb-6 text-[0.75rem] text-paper/55">Last updated 2026-10-26</Txt>

        <Section title="No account is required">
          Qaaf works fully as a guest. Your lesson progress, streak, hearts, gems and settings are stored only on this
          device, in its local app storage. We never see them, and nothing is sent anywhere unless you turn on sign-in
          below. That storage is what lets the app work; nothing in it is used for tracking.
        </Section>

        <Section title="If you choose to sign in">
          Signing in with Google or Apple is optional and exists so your progress can follow you to a second device. It
          creates an account identified by the email your provider shares with us, and your progress and settings are
          copied to that account so they can be restored elsewhere. Signing in also keeps a sign-in key on this device,
          so you stay signed in. You can stop syncing at any time from Settings; your on-device progress keeps working
          exactly as before.
        </Section>

        <Section title="Why we keep it, and who handles it">
          We keep your account only to give you the saved progress you asked for by signing in: that is what makes it
          lawful for us to hold it. Supabase stores the account and the copy of your progress for us. Google or Apple
          confirm who you are when you sign in, under their own privacy policies. GitHub hosts the website. Some of
          these services may keep data outside the UK; where they do, it is protected by the safeguards UK law requires.
        </Section>

        <Section title="What we do not do">
          No advertising and no ad network of any kind. No selling, renting or sharing your data with third parties for
          marketing. No tracking across other apps or websites. The microphone is used only when you tap Say it back on
          a line, to record you saying it so you can hear yourself next to the course’s own recording. That recording
          stays on your device. It is never uploaded, never shared and never scored, and nothing else in the app ever
          listens to you.
        </Section>

        <Section title="Audio and other assets">
          The Urdu voice recordings and the fonts are part of Qaaf itself, never fetched from another service. In the
          phone app they play from your device. On the website they come from the same site as everything else, which
          GitHub Pages hosts: like any web host, GitHub receives your IP address and browser details with each request
          and keeps them for security, under GitHub’s own privacy statement. We cannot see those records.
        </Section>

        <Section title="Deleting your data">
          Uninstalling the app, or on the website clearing this site’s data in your browser, removes everything stored
          on your device, including any Say it back recording, which on a phone sits in the app’s temporary storage
          until the system clears it. If you are signed in, Delete account in Settings (under Data) deletes your account
          and the copy of your progress stored with it; if you have signed out, sign in again to find it. Our database
          provider may keep backups, and records of past sign-ins, after an account is deleted. Resetting your progress
          from Settings clears it without needing to delete the app.
        </Section>

        <Section title="How long it is kept">
          Your account and its copy of your progress are kept until you delete them. After that, the database provider’s
          backups may hold a copy for a short time, until they are replaced.
        </Section>

        <Section title="Your rights">
          You can ask to see the data we hold about you, to have it corrected or deleted, to limit how we use it, to
          have a copy of it, or object to how we use it. Delete account in Settings does the deleting for you straight
          away. Nothing is required of you: you only ever need to sign in if you want your progress on another device.
          Nothing about you is decided automatically; the review schedule is worked out on your device and only decides
          which words come back. If you are unhappy with how your data is handled, tell us first and we will reply, and
          you can also complain to the Information Commissioner’s Office at ico.org.uk.
        </Section>

        <Section title="Children">
          Qaaf is a general-audience language course and is not directed at children under 13. We do not knowingly
          collect personal information from a child under that age.
        </Section>

        <Section title="Changes to this policy">
          If what the app collects changes: for instance, if we add optional crash reporting to fix bugs faster, this
          page will be updated first, and the date above will change.
        </Section>

        {HAS_CONTACT ? (
          <Section title="Contact">
            <ContactLine about="this policy" />
          </Section>
        ) : null}
      </Screen>
    </View>
  );
}
