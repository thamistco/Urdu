import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { ProgressBar } from '../components/ProgressBar';
import { Display, Heading, Txt, Bold, Eyebrow, Urdu, urduGlyph } from '../components/Text';
import { Illustration } from '../components/Illustration';
import type { IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { levelProgress, levelTitle, getLeague } from '../lib/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { lastSevenDayKeys } from '../lib/date';
import { ACHIEVEMENTS } from '../data/achievements';
import { LETTERS } from '../data/letters';
import { WORDS } from '../data/words';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatBox({ icon, value, label }: { icon: IconName; value: string | number; label: string }) {
  return (
    <View className="w-[31%] items-center rounded-2xl border border-white/10 bg-ink-700 py-4">
      <Illustration name={icon} tile={false} size={24} />
      <Display className="mt-1 text-xl">{value}</Display>
      <Eyebrow className="mt-0.5 text-paper/45" style={{ fontSize: 9 }}>
        {label}
      </Eyebrow>
    </View>
  );
}

function WeekChart() {
  const xpHistory = useProgressStore((s) => s.xpHistory);
  const keys = lastSevenDayKeys();
  const values = keys.map((k) => xpHistory[k] ?? 0);
  const max = Math.max(60, ...values);
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayDow = new Date().getDay();

  // A week of stub-height bars says nothing except that the chart is broken.
  // Before there is any history, say what will fill it.
  if (values.every((v) => v === 0)) {
    return (
      <View className="items-center justify-center" style={{ height: 96 }}>
        <Txt className="text-center text-xs leading-5 text-paper/45">
          Finish a lesson and your week starts filling in here.
        </Txt>
      </View>
    );
  }

  return (
    <View className="flex-row items-end justify-between" style={{ height: 96 }}>
      {values.map((v, i) => {
        const dow = (todayDow - (6 - i) + 7) % 7;
        const h = Math.max(6, (v / max) * 80);
        const isToday = i === 6;
        return (
          <View key={i} className="flex-1 items-center">
            <View
              style={{
                width: 14,
                height: h,
                borderRadius: 7,
                backgroundColor: isToday ? palette.gold : withAlpha(palette.gold, 0.35),
              }}
            />
            <Txt className="mt-1.5 text-[10px] text-paper/45">{labels[dow]}</Txt>
          </View>
        );
      })}
    </View>
  );
}

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const s = useProgressStore();
  const { level, ratio, into, span } = levelProgress(s.totalXp);
  const league = getLeague(s.leagueId);
  const unlockedAch = ACHIEVEMENTS.filter((a) => (s.achieved[a.id] ?? 0) > 0).length;

  const link = (screen: keyof RootStackParamList) => () => {
    feedback.tap();
    nav.navigate(screen as any);
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        {/* identity */}
        <Reveal>
          <SafeAreaView edges={['top']}>
            <View className="items-center pb-2 pt-2">
              <View
                className="h-24 w-24 items-center justify-center rounded-full border-2"
                style={{ borderColor: palette.gold, backgroundColor: withAlpha(palette.gold, 0.12) }}
              >
                <Urdu style={{ color: palette.gold, ...urduGlyph(32) }}>ح</Urdu>
              </View>
              <Display className="mt-3 text-2xl">Level {level}</Display>
              <Eyebrow style={{ color: palette.gold }}>{levelTitle(level)}</Eyebrow>
              <View className="mt-3 w-full px-6">
                <ProgressBar progress={ratio} height={8} />
                <Txt className="mt-1 text-center text-[11px] text-paper/45">
                  {into} / {span} XP to level {level + 1}
                </Txt>
              </View>
            </View>
          </SafeAreaView>
        </Reveal>

        {/* stat grid */}
        <Reveal delay={80}>
          <View className="mb-3 mt-4 flex-row justify-between">
            <StatBox icon="flame" value={s.streak} label="Day streak" />
            <StatBox icon="bolt" value={s.totalXp} label="Total XP" />
            <StatBox icon="gem" value={s.gems} label="Gems" />
          </View>
          <View className="mb-4 flex-row justify-between">
            <StatBox icon="medal" value={s.longestStreak} label="Best streak" />
            <StatBox icon="pen" value={`${s.learnedLetters.length}/${LETTERS.length}`} label="Letters" />
            <StatBox icon="book" value={`${s.learnedWords.length}/${WORDS.length}`} label="Words" />
          </View>
        </Reveal>

        {/* weekly activity */}
        <Reveal delay={140}>
          <Card className="mb-4">
            <Eyebrow className="mb-3 text-paper/50">This week</Eyebrow>
            <WeekChart />
          </Card>
        </Reveal>

        {/* league */}
        <Reveal delay={180}>
          <Pressable onPress={link('Leaderboard')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
              <Txt style={{ fontSize: 30 }}>{league.icon}</Txt>
              <View className="flex-1">
                <Bold className="text-[15px]">{league.name} League</Bold>
                <Txt className="text-xs text-paper/55">{s.weeklyXp} XP this week · tap to see standings</Txt>
              </View>
              <Txt className="text-paper/40">›</Txt>
            </View>
          </Pressable>
        </Reveal>

        {/* achievements */}
        <Reveal delay={220}>
          <Pressable onPress={link('Achievements')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
              <Illustration name="medal" tile={false} size={30} />
              <View className="flex-1">
                <Bold className="text-[15px]">Achievements</Bold>
                <Txt className="text-xs text-paper/55">
                  {unlockedAch} of {ACHIEVEMENTS.length} unlocked
                </Txt>
              </View>
              <Txt className="text-paper/40">›</Txt>
            </View>
          </Pressable>
        </Reveal>

        {/* settings */}
        <Reveal delay={260}>
          <Pressable onPress={link('Settings')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View className="mb-8 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
              <Illustration name="gear" tile={false} size={28} />
              <View className="flex-1">
                <Bold className="text-[15px]">Settings</Bold>
                <Txt className="text-xs text-paper/55">Sound, haptics, script & Roman, daily goal</Txt>
              </View>
              <Txt className="text-paper/40">›</Txt>
            </View>
          </Pressable>
        </Reveal>
      </Screen>
    </View>
  );
}
