import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Txt, Bold, Heading } from '../components/Text';
import type { RootStackParamList } from '../navigation/types';
import LICENCES from '../data/licences.json';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * The copyright notice and licence of every package and typeface the app
 * ships, which is the one condition MIT, BSD and the Open Font License attach
 * to using them.
 *
 * The list is generated from the built bundle by `scripts/generate-licences.js`
 * and `check:licences` fails the deploy if it falls out of date, so nothing
 * here is typed by hand. Rows start collapsed: ninety licence texts open at
 * once would be a wall nobody reads, and a row names the package and its
 * licence without being opened.
 */
function Row({ name, version, license, text }: { name: string; version: string; license: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="border-b border-white/5 py-3">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${name}, ${license}. ${open ? 'Hide' : 'Show'} licence`}
        onPress={() => setOpen((o) => !o)}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Bold className="text-[0.875rem]">{name}</Bold>
            <Txt className="text-xs text-paper/55">{version ? `${version} · ${license}` : license}</Txt>
          </View>
          <Txt className="text-xs text-paper/55">{open ? 'Hide' : 'Show'}</Txt>
        </View>
      </Pressable>
      {open && <Txt className="mt-3 text-[0.6875rem] leading-5 text-paper/70">{text}</Txt>}
    </View>
  );
}

export function LicencesScreen() {
  const nav = useNavigation<Nav>();
  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={nav.canGoBack() ? () => nav.goBack() : undefined} title="Open-source licences" />
        <Heading className="mb-2 text-lg">Software Harf is built on</Heading>
        <Txt className="mb-4 text-[0.8125rem] leading-6 text-paper/80">
          Harf includes the following open-source software and typefaces. Each is used under the licence shown, and each
          licence asks that its notice be included here.
        </Txt>
        {LICENCES.packages.map((p) => (
          <Row key={p.name} name={p.name} version={p.version} license={p.license} text={LICENCES.texts[p.text]} />
        ))}
      </Screen>
    </View>
  );
}
