import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useProgressStore } from '../store/useProgressStore';
import { MainTabs } from './MainTabs';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { LetterLabScreen } from '../screens/LetterLabScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const onboarded = useProgressStore((s) => s.onboarded);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#0C1A33' } }}>
      {!onboarded ? (
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
          <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
