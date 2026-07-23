import { View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt } from '../components/Text';
import { feedback } from '../lib/feedback';
import { palette, withAlpha } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<string, string> = {
  Learn: '📚',
  Practice: '🎯',
  Profile: '👤',
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={{ backgroundColor: palette.ink800, borderTopWidth: 1, borderTopColor: withAlpha(palette.white, 0.08) }}>
      <SafeAreaView edges={['bottom']}>
        <View className="flex-row px-3 pt-2 pb-1">
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  feedback.tap();
                  if (!focused) navigation.navigate(route.name);
                }}
                className="flex-1 items-center py-2"
              >
                <Txt style={{ fontSize: 24, opacity: focused ? 1 : 0.45 }}>{ICONS[route.name]}</Txt>
                <Txt
                  className="mt-1 text-[11px]"
                  style={{ color: focused ? palette.gold : withAlpha(palette.cream, 0.5), fontWeight: '700' }}
                >
                  {route.name}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Learn" component={HomeScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
