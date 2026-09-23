import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { palette } from '../theme';
import { useProgressStore } from '../store/useProgressStore';
import { useAuthStore, isAuthed } from '../store/useAuthStore';
import { MainTabs } from './MainTabs';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { LetterLabScreen } from '../screens/LetterLabScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { CreditsScreen } from '../screens/CreditsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const onboarded = useProgressStore((s) => s.onboarded);
  const authed = useAuthStore(isAuthed);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: palette.ink } }}
    >
      {!authed ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Lesson"
            component={LessonScreen}
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="LetterLab" component={LetterLabScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
        </>
      )}
      {/*
       * Privacy, Terms and Credits are registered unconditionally, after the
       * auth/onboarding gate above, so /privacy and /terms resolve at any
       * state -- signed out, mid-onboarding, or fully in. An app store
       * reviewer, or anyone else with the link, should never have to create a
       * profile or even tap "continue as a guest" to read them; that is the
       * one thing a privacy policy's own URL has to guarantee.
       *
       * Declared AFTER the gated block on purpose. React Navigation's native
       * stack takes its initial route from the first Stack.Screen registered,
       * absent an explicit initialRouteName -- declaring these two first, as
       * the first version of this did, would have made Privacy the screen a
       * fresh install opens on instead of Login. Order here is load-bearing,
       * not decorative.
       */}
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Credits" component={CreditsScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
