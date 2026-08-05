import './global.css';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold, Fraunces_900Black } from '@expo-google-fonts/fraunces';
import { PublicSans_400Regular, PublicSans_500Medium, PublicSans_700Bold } from '@expo-google-fonts/public-sans';
import { NotoNastaliqUrdu_400Regular, NotoNastaliqUrdu_700Bold } from '@expo-google-fonts/noto-nastaliq-urdu';

import { RootNavigator } from './src/navigation/RootNavigator';
import { initSound } from './src/lib/sound';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useProgressStore } from './src/store/useProgressStore';
import { useAuthStore } from './src/store/useAuthStore';
import { palette } from './src/theme';

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
 * the path are all just "Harf": they are the app opening, not a place inside it.
 */
const HOME_ROUTES = new Set(['Onboarding', 'Login', 'Home', 'Main']);
const DOCUMENT_TITLE = {
  formatter: (_options: unknown, route?: { name?: string }) =>
    route?.name && !HOME_ROUTES.has(route.name) ? `Harf · ${route.name}` : 'Harf · Learn Urdu',
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces: Fraunces_600SemiBold,
    'Fraunces-Black': Fraunces_900Black,
    PublicSans: PublicSans_400Regular,
    'PublicSans-Med': PublicSans_500Medium,
    'PublicSans-Bold': PublicSans_700Bold,
    NotoNastaliq: NotoNastaliqUrdu_400Regular,
    'NotoNastaliq-Bold': NotoNastaliqUrdu_700Bold,
  });

  // Never let a slow/blocked font load brick the app — proceed after a short
  // grace period regardless (fonts pop in when ready). Keeps hosted previews
  // and offline launches from hanging on a blank screen.
  const [graceElapsed, setGraceElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const ready = fontsLoaded || !!fontError || graceElapsed;

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

  if (!ready) return <View style={{ flex: 1, backgroundColor: palette.ink }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.ink }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme} onReady={onReady} documentTitle={DOCUMENT_TITLE}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
