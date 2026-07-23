import './global.css';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Fraunces_600SemiBold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import {
  NotoNastaliqUrdu_400Regular,
  NotoNastaliqUrdu_700Bold,
} from '@expo-google-fonts/noto-nastaliq-urdu';

import { RootNavigator } from './src/navigation/RootNavigator';
import { initSound } from './src/lib/sound';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useProgressStore } from './src/store/useProgressStore';
import { palette } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: palette.ink, card: palette.ink, text: palette.cream, primary: palette.gold, border: 'transparent' },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces: Fraunces_600SemiBold,
    'Fraunces-Black': Fraunces_900Black,
    PublicSans: PublicSans_400Regular,
    'PublicSans-Med': PublicSans_500Medium,
    'PublicSans-Bold': PublicSans_700Bold,
    NotoNastaliq: NotoNastaliqUrdu_400Regular,
    'NotoNastaliq-Bold': NotoNastaliqUrdu_700Bold,
  });

  useEffect(() => {
    initSound();
    // apply persisted sound/haptic prefs to the effect layer, and regen hearts
    useSettingsStore.getState().syncEffects();
    useProgressStore.getState().regenHearts();
  }, []);

  const onReady = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: palette.ink }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.ink }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme} onReady={onReady}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
