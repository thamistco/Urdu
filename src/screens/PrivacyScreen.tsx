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
        <Txt className="mb-6 text-[0.75rem] text-paper/55">Last updated 2026-10-29</Txt>

        <Section title="Who we are">
          Who runs Qaaf, and how to contact them, will be added to this page before Qaaf launches.
        </Section>

        <Section title="No account is required">
          Qaaf works fully as a guest. Your lesson progress, streak, hearts, gems, settings and the answers you gave
          when you started (why you are learning, and whether you already speak some Urdu) are stored only on this
          device, in its local app storage. We never see them, and none of it is sent anywhere unless you sign in. That
          storage is what lets the app work; nothing in it is used for tracking.
        </Section>

        <Section title="If you choose to sign in">
          Where Qaaf offers sign-in, signing in with Google or Apple is optional and exists so your progress can follow
          you to a second device. It creates an account identified by the email your provider shares with us, and your
          progress, settings and those answers are copied to that account so they can be restored elsewhere. If the
          account already holds progress from another device, that copy replaces the progress on this one. Signing in
          also keeps a sign-in key on this device, so you stay signed in. To stop syncing, sign out in Settings: the
          progress on this device stays, and you can carry on as a guest.
        </Section>

        <Section title="Why we keep it, and who handles it">
          The legal reason we can keep your account is that you asked us to: keeping your progress is the service you
          signed in for. Supabase stores the account and the copy of your progress for us. Google or Apple confirm who
          you are when you sign in, under their own privacy policies. GitHub hosts the website. Some of these services
          may store data outside the UK, for example in the United States. Which countries, and the protections that
          apply, will be added here once they are confirmed.
        </Section>

        <Section title="What we do not do">
          No advertising and no ad network of any kind. No selling, renting or sharing your data with third parties for
          marketing. No tracking across other apps or websites. No analytics: we do not count visits or track how you
          use the app; the only record of use we hold is the progress a signed-in learner syncs, and records of
          sign-ins. The microphone is used only when you tap Say it back on a line, to record you saying it so you can
          hear yourself next to the course’s own recording. That recording stays on your device. It is never uploaded,
          never shared and never scored, and nothing else in the app ever listens to you.
        </Section>

        <Section title="Audio and other assets">
          The Urdu voice recordings and the fonts are part of Qaaf itself, never fetched from another service. In the
          phone app they play from your device. On the website they come from the same site as everything else, which
          GitHub Pages hosts: like any web host, GitHub receives your IP address and browser details with each request
          and keeps them for security, under GitHub’s own privacy statement. We cannot see those records. If a recording
          is missing or will not play, or if you turn on hearing the English meaning, your device’s own voice reads it,
          and some browsers do that on their maker’s servers.
        </Section>

        <Section title="Deleting your data">
          Uninstalling the app, or on the website clearing this site’s data in your browser, removes everything stored
          on your device, including any Say it back recording, which on a phone sits in the app’s temporary storage
          until the system clears it. If you are signed in, Delete account in Settings (under Data) deletes your account
          and the copy of your progress stored with it; if you have signed out, sign in again to find it. If it says
          deleting is not switched on yet, nothing has been deleted; please try again later. Records of past sign-ins
          may also be kept after an account is deleted. Resetting your progress from Settings clears it without needing
          to delete the app.
        </Section>

        <Section title="How long it is kept">
          Your account and its copy of your progress are kept until you delete them. After that, copies may remain in
          the database provider’s backups until those backups are replaced. We will state that period here once it is
          confirmed.
        </Section>

        <Section title="Your rights">
          The law gives you the right to see the data we hold about you, to have it corrected or deleted, to limit or
          object to how we use it, and to have a copy of it. If you are signed in, Delete account in Settings deletes
          your account and its copy of your progress. If it says deleting is not switched on yet, nothing has been
          deleted; please try again later. A way to contact us for anything else will be added to this page. You only
          ever need to sign in if you want your progress on another device; everything else works without it. Nothing
          about you is decided automatically: the review schedule is worked out on your device and only decides which
          words come back. If you are unhappy with how your data is handled, you can complain to the Information
          Commissioner’s Office at ico.org.uk.
        </Section>

        <Section title="Children">
          Children and teenagers can use Qaaf as guests. As a guest, nothing about you or your progress is sent to us
          (the website’s host sees each request, as described under Audio and other assets): no ads, no tracking, and no
          chat or contact with other people; the league is a practice group the app makes up, not real players. Say it
          back recordings stay on the device. Signing in is the only way anything about a learner reaches us: an email
          address and, from Google, a name and profile picture; their progress, settings and starting answers; and
          records of sign-ins. If you are under 13, please don’t sign in without a parent or carer; if you are under 18,
          we suggest telling one. If you think a child has signed in without your permission, use Delete account in
          Settings on the device they used, while signed in as them; signing out there stops anything more being sent.
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
