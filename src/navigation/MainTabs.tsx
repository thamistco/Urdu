import { View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt } from '../components/Text';
import { feedback } from '../lib/feedback';
import { palette, withAlpha } from '../theme';
import { CONTENT_MAX_WIDTH } from '../components/Screen';
import { HomeScreen } from '../screens/HomeScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Tab glyphs are drawn rather than borrowed from emoji so they can take the
 * bar's tint (gold when selected, muted otherwise) and stay identical on every
 * platform — the emoji set rendered differently on each and broke the palette.
 */
function TabIcon({ name, color }: { name: string; color: string }) {
  const p = {
    stroke: color,
    strokeWidth: 2,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {name === 'Learn' && (
        <>
          {/* an open book */}
          <Path
            d="M12 6.5C10.2 5.2 7.7 4.8 5 5.2v12c2.7-.4 5.2 0 7 1.3 1.8-1.3 4.3-1.7 7-1.3v-12c-2.7-.4-5.2 0-7 1.3Z"
            {...p}
          />
          <Path d="M12 6.5v12" {...p} />
        </>
      )}
      {name === 'Practice' && (
        <>
          {/* concentric target — the spaced-repetition motif */}
          <Circle cx={12} cy={12} r={7.5} {...p} />
          <Circle cx={12} cy={12} r={3.5} {...p} />
          <Circle cx={12} cy={12} r={1} fill={color} stroke="none" />
        </>
      )}
      {name === 'Profile' && (
        <>
          <Circle cx={12} cy={8.5} r={3.6} {...p} />
          <Path d="M5.5 19.2c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5" {...p} />
        </>
      )}
    </Svg>
  );
}

function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      style={{ backgroundColor: palette.ink800, borderTopWidth: 1, borderTopColor: withAlpha(palette.white, 0.08) }}
    >
      <SafeAreaView edges={['bottom']}>
        {/* the bar spans the screen; the three tabs track the content column */}
        <View
          className="flex-row px-3 pt-2 pb-1"
          style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}
        >
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
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={route.name}
              >
                <TabIcon name={route.name} color={focused ? palette.gold : withAlpha(palette.cream, 0.45)} />
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
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Learn" component={HomeScreen} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
