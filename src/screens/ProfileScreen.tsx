import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { ProgressBar } from '../components/ProgressBar';
import { Display, Txt, Bold, Eyebrow, Urdu, urduGlyph } from '../components/Text';
import { Illustration, LeagueBadge } from '../components/Illustration';
import type { IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { levelProgress, levelTitle, getLeague } from '../lib/gamification';
import { useProgressStore, FREEZE_COST, FREEZE_MAX } from '../store/useProgressStore';
import { lastSevenDayKeys } from '../lib/date';
import { ACHIEVEMENTS } from '../data/achievements';
import { LETTERS } from '../data/letters';
import { WORDS } from '../data/words';
import type { NoParamScreen, RootStackParamList } from '../navigation/types';
import { wholeWords } from '../lib/wholeWords';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatBox({ icon, value, label }: { icon: IconName; value: string | number; label: string }) {
  return (
    <View className="w-[31%] items-center rounded-2xl border border-white/10 bg-ink-700 py-4">
      <Illustration name={icon} tile={false} size={24} />
      <Display className="mt-1 text-xl">{value}</Display>
      <Eyebrow className="mt-0.5 text-paper/55 text-[0.5625rem]">{label}</Eyebrow>
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
        <Txt className="text-center text-xs leading-5 text-paper/55">
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
            <Txt className="mt-1.5 text-[0.625rem] text-paper/55">{labels[dow]}</Txt>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Streak freezes: how many the learner holds, what one does, and a way to buy
 * another.
 *
 * The store has always had them. A new profile starts with one, a single
 * missed day spends one automatically, and gems could buy more, but nothing on
 * any screen showed the count or offered the purchase, so a freeze was spent
 * or kept without the learner ever knowing either had happened. It sits under
 * the streak because that is what it protects.
 */
function FreezeCard() {
  const freezes = useProgressStore((st) => st.freezes);
  const gems = useProgressStore((st) => st.gems);
  const buyFreeze = useProgressStore((st) => st.buyFreeze);
  const full = freezes >= FREEZE_MAX;
  const short = gems < FREEZE_COST;
  const why = full ? `You can hold ${FREEZE_MAX}.` : short ? `Needs ${FREEZE_COST} gems; you have ${gems}.` : null;

  return (
    <Card className="mb-4">
      <View className="flex-row flex-wrap items-center gap-3">
        <View className="flex-1" style={wholeWords}>
          <Bold className="text-[0.9375rem]">Streak freezes</Bold>
          <Txt className="mt-0.5 text-xs text-paper/55">
            Each freeze covers one missed day and is used automatically. Miss more days than you have freezes and the
            streak ends, but you keep your freezes.
          </Txt>
        </View>
        <View className="flex-row gap-1.5" accessible accessibilityLabel={`${freezes} of ${FREEZE_MAX} streak freezes`}>
          {Array.from({ length: FREEZE_MAX }, (_, i) => (
            <View
              key={i}
              className="h-3.5 w-3.5 rounded-full"
              style={{
                backgroundColor: i < freezes ? palette.gold : 'transparent',
                borderWidth: 1.5,
                borderColor: i < freezes ? palette.gold : withAlpha(palette.white, 0.25),
              }}
            />
          ))}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Buy a streak freeze for ${FREEZE_COST} gems${why ? `. ${why}` : ''}`}
        aria-disabled={!!why}
        disabled={!!why}
        onPress={() => {
          if (buyFreeze()) feedback.tap();
        }}
        style={({ pressed }) => ({ transform: [{ scale: pressed && !why ? 0.98 : 1 }], opacity: why ? 0.55 : 1 })}
      >
        <View
          className="mt-3 flex-row items-center justify-center gap-2 rounded-xl py-2.5"
          style={{
            borderWidth: 1.5,
            borderColor: withAlpha(palette.gold, 0.6),
            backgroundColor: withAlpha(palette.gold, 0.12),
          }}
        >
          <Illustration name="gem" tile={false} size={16} />
          <Bold className="text-sm" style={{ color: palette.gold }}>
            Buy one · {FREEZE_COST} gems
          </Bold>
        </View>
      </Pressable>
      {why ? <Txt className="mt-2 text-center text-[0.6875rem] text-paper/55">{why}</Txt> : null}
    </Card>
  );
}

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const s = useProgressStore();
  const { level, ratio, into, span } = levelProgress(s.totalXp);
  const league = getLeague(s.leagueId);
  const unlockedAch = ACHIEVEMENTS.filter((a) => (s.achieved[a.id] ?? 0) > 0).length;

  const link = (screen: NoParamScreen) => () => {
    feedback.tap();
    nav.navigate(screen);
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
                <Txt className="mt-1 text-center text-[0.6875rem] text-paper/55">
                  {into} / {span} XP to level {level + 1}
                </Txt>
              </View>
            </View>
          </SafeAreaView>
        </Reveal>

        {/* weekly activity: first, as the one block here that says what to do
            today. The stats below are the record. */}
        <Reveal delay={80}>
          <Card className="mb-4 mt-4">
            <Eyebrow className="mb-3 text-paper/55">This week</Eyebrow>
            <WeekChart />
          </Card>
        </Reveal>

        {/* stat grid */}
        <Reveal delay={140}>
          <View className="mb-3 flex-row justify-between">
            <StatBox icon="flame" value={s.streak} label="Day streak" />
            <StatBox icon="bolt" value={s.totalXp} label="Total XP" />
            <StatBox icon="gem" value={s.gems} label="Gems" />
          </View>
          <View className="mb-4 flex-row justify-between">
            <StatBox icon="medal" value={s.longestStreak} label="Best streak" />
            <StatBox icon="pen" value={`${s.learnedLetters.length}/${LETTERS.length}`} label="Letters" />
            <StatBox icon="book" value={`${s.learnedWords.length}/${WORDS.length}`} label="Words" />
          </View>
          <FreezeCard />
        </Reveal>

        {/* league */}
        <Reveal delay={180}>
          <Pressable
            accessibilityRole="button"
            onPress={link('Leaderboard')}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <View className="mb-3 flex-row flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
              <LeagueBadge color={league.color} size={30} />
              <View className="flex-1" style={wholeWords}>
                <Bold className="text-[0.9375rem]">{league.name} League</Bold>
                <Txt className="text-xs text-paper/55">{s.weeklyXp} XP this week · tap to see standings</Txt>
              </View>
              <Txt className="text-base text-paper/55">›</Txt>
            </View>
          </Pressable>
        </Reveal>

        {/* achievements */}
        <Reveal delay={220}>
          <Pressable
            accessibilityRole="button"
            onPress={link('Achievements')}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <View className="mb-3 flex-row flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
              <Illustration name="medal" tile={false} size={30} />
              <View className="flex-1" style={wholeWords}>
                <Bold className="text-[0.9375rem]">Achievements</Bold>
                <Txt className="text-xs text-paper/55">
                  {unlockedAch} of {ACHIEVEMENTS.length} unlocked
                </Txt>
              </View>
              <Txt className="text-base text-paper/55">›</Txt>
            </View>
          </Pressable>
        </Reveal>

        {/* settings */}
        <Reveal delay={260}>
          <Pressable
            accessibilityRole="button"
            onPress={link('Settings')}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <View className="mb-8 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
              <Illustration name="gear" tile={false} size={28} />
              <View className="flex-1">
                <Bold className="text-[0.9375rem]">Settings</Bold>
                <Txt className="text-xs text-paper/55">Sound, haptics, script & Roman, daily goal</Txt>
              </View>
              <Txt className="text-base text-paper/55">›</Txt>
            </View>
          </Pressable>
        </Reveal>
      </Screen>
    </View>
  );
}
