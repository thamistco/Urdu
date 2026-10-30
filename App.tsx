import './global.css';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Font from 'expo-font';
// Each weight by its own file. The packages' index requires every weight it
// has, so the bundler shipped all 40 font files, 4.5 MB, for the 7 the app
// loads (performance review, 2026-10-24, Q-083).
import Fraunces_600SemiBold from '@expo-google-fonts/fraunces/Fraunces_600SemiBold.ttf';
import Fraunces_900Black from '@expo-google-fonts/fraunces/Fraunces_900Black.ttf';
import PublicSans_400Regular from '@expo-google-fonts/public-sans/PublicSans_400Regular.ttf';
import PublicSans_500Medium from '@expo-google-fonts/public-sans/PublicSans_500Medium.ttf';
import PublicSans_700Bold from '@expo-google-fonts/public-sans/PublicSans_700Bold.ttf';
import NotoNastaliqUrdu_400Regular from '@expo-google-fonts/noto-nastaliq-urdu/NotoNastaliqUrdu_400Regular.ttf';
import NotoNastaliqUrdu_700Bold from '@expo-google-fonts/noto-nastaliq-urdu/NotoNastaliqUrdu_700Bold.ttf';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ConfirmHost } from './src/components/ConfirmHost';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SoundNotice } from './src/components/SoundNotice';
import { linking } from './src/navigation/linking';
import { initSound } from './src/lib/sound';
import { installGroupKeys } from './src/lib/groupKeys';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useProgressStore } from './src/store/useProgressStore';
import { useAuthStore } from './src/store/useAuthStore';
import { palette } from './src/theme';
import { storageRefused, onStorageRefused, progressSetAside, onProgressSetAside } from './src/store/storage';
import { Txt } from './src/components/Text';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.ink,
    card: palette.ink,
    text: palette.cream,
    primary: palette.gold,
    border: 'transparent',
  },
};

/**
 * What the browser tab, the bookmark and an installed shortcut are called.
 *
 * React Navigation names the document after the active route by default, which
 * meant the app introduced itself as **Onboarding** — the internal name of a
 * screen — in the tab strip, in history, and on the home screen of anyone who
 * installed it from the browser. A route name is a thing this codebase says to
 * itself, and it had ended up being the first thing the product said to a user.
 *
 * The name leads, because that is what a person scans a tab strip for, and the
 * screen follows it only where it tells them something. Onboarding, sign-in and
 * the path are all just "Qaaf": they are the app opening, not a place inside it.
 */
const HOME_ROUTES = new Set(['Onboarding', 'Login', 'Home', 'Main']);
const DOCUMENT_TITLE = {
  formatter: (_options: unknown, route?: { name?: string }) =>
    route?.name && !HOME_ROUTES.has(route.name) ? `Qaaf · ${route.name}` : 'Qaaf · Learn Urdu',
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces: Fraunces_600SemiBold,
    'Fraunces-Black': Fraunces_900Black,
    PublicSans: PublicSans_400Regular,
    'PublicSans-Med': PublicSans_500Medium,
    'PublicSans-Bold': PublicSans_700Bold,
    NotoNastaliq: NotoNastaliqUrdu_400Regular,
  });

  /**
   * The bold Nastaliq after the first paint, not before it: as a second
   * 530 KB file on the critical path it held the first screen back on a slow
   * phone (QA, 2026-10-13, M24). It is not only a few numerals, as this once
   * said: `<Urdu>` defaults to bold, so the front door's قاف wordmark is in it,
   * and shows a thin fallback face until it arrives, 5.4s on Slow 4G
   * (performance review, 2026-10-21, P-096).
   */
  // Space, arrows and one Tab stop for every radio group and tab bar (web).
  useEffect(() => installGroupKeys(), []);

  useEffect(() => {
    if (!fontsLoaded) return;
    Font.loadAsync({ 'NotoNastaliq-Bold': NotoNastaliqUrdu_700Bold }).catch(() => {});
  }, [fontsLoaded]);

  // Never let a slow/blocked font load brick the app — proceed after a short
  // grace period regardless (fonts pop in when ready). Keeps hosted previews
  // and offline launches from hanging on a blank screen.
  const [graceElapsed, setGraceElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), 2500);
    return () => clearTimeout(t);
  }, []);

  /**
   * Saved progress and sign-in are read from storage asynchronously, and the
   * navigator picks its screens from them: no sign-in shows Login, not
   * onboarded shows Onboarding, and only after that does a Lesson route
   * exist. Drawn before they load, a returning learner's lesson link
   * resolves against an empty profile and lands on setup, which QA testers
   * reported on the live site (QA report v3, L23; inferred from code, not
   * reproduced locally, where storage always wins the race). So the screens
   * wait for both. The fallback keeps a storage that never answers from
   * leaving the app blank.
   */
  const [hydrated, setHydrated] = useState(
    () => useProgressStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()
  );
  useEffect(() => {
    if (hydrated) return;
    const check = () => {
      if (useProgressStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) setHydrated(true);
    };
    const offs = [useProgressStore.persist.onFinishHydration(check), useAuthStore.persist.onFinishHydration(check)];
    check();
    const t = setTimeout(() => setHydrated(true), 5000);
    return () => {
      offs.forEach((off) => off());
      clearTimeout(t);
    };
  }, [hydrated]);

  const ready = (fontsLoaded || !!fontError || graceElapsed) && hydrated;

  useEffect(() => {
    initSound();
    // apply persisted sound/haptic prefs to the effect layer, and regen hearts
    useSettingsStore.getState().syncEffects();
    useProgressStore.getState().regenHearts();
    // restore auth session (no-op / guest when no backend is configured)
    useAuthStore.getState().init();
  }, []);

  const onReady = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Said once, at the top, when this browser refuses storage: the app still
  // runs, but nothing it learns survives closing the page (QA, M21).
  const [refused, setRefused] = useState(storageRefused);
  useEffect(() => onStorageRefused(() => setRefused(true)), []);
  const [setAside, setSetAside] = useState(progressSetAside);
  useEffect(() => onProgressSetAside(() => setSetAside(true)), []);

  /**
   * Two tabs, one profile. Each tab held its own copy of the progress and
   * wrote it whole, so a lesson finished in one tab was overwritten by the
   * next save from the other: finish v-first-words in tab A, v-greetings in
   * tab B, then Continue in A, and v-greetings was gone (QA, 2026-10-13,
   * M26). The browser tells every other tab when a key changes, so each tab
   * now reloads the saved progress the moment another tab writes it, before
   * it can write its stale copy over the top.
   */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'qaaf-progress') void useProgressStore.persist.rehydrate();
      else if (e.key === 'qaaf-settings') void useSettingsStore.persist.rehydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: palette.ink }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.ink }}>
      <SafeAreaProvider>
        {refused ? (
          <View
            accessibilityRole="alert"
            style={{ backgroundColor: palette.ink700, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Txt className="text-center text-xs text-paper/80">
              This browser is blocking storage, so your progress won’t be kept after you close the page.
            </Txt>
          </View>
        ) : null}
        {setAside ? (
          <View
            accessibilityRole="alert"
            style={{
              backgroundColor: palette.ink700,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Txt className="flex-1 text-xs text-paper/80">
              Your saved progress could not be read, so Qaaf has started fresh. A copy is kept on this device.
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={() => setSetAside(false)}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Txt className="text-xs text-paper">OK</Txt>
            </Pressable>
          </View>
        ) : null}
        <NavigationContainer linking={linking} theme={navTheme} onReady={onReady} documentTitle={DOCUMENT_TITLE}>
          <StatusBar style="light" />
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
          <ConfirmHost />
        </NavigationContainer>
        <SoundNotice />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
