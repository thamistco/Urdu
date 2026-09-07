import { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Reveal } from '../components/Reveal';
import { Txt, Bold, Eyebrow, Heading } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { getLeague, promote, demote } from '../lib/gamification';
import { useProgressStore } from '../store/useProgressStore';

/** Believable weekly cohort. Deterministic per-week so it feels stable. */
const NAMES = [
  'Ayesha',
  'Bilal',
  'Zara',
  'Omar',
  'Hina',
  'Kamran',
  'Sana',
  'Yusuf',
  'Mariam',
  'Faisal',
  'Nadia',
  'Tariq',
  'Rida',
  'Imran',
];

function seededXp(seed: number, i: number) {
  const x = Math.sin(seed * 9301 + i * 49297) * 233280;
  return Math.floor(Math.abs(x % 1) * 380) + 30;
}

export function LeaderboardScreen() {
  const nav = useNavigation();
  const weeklyXp = useProgressStore((s) => s.weeklyXp);
  const leagueId = useProgressStore((s) => s.leagueId);
  const weekKey = useProgressStore((s) => s.weekKey);
  const league = getLeague(leagueId);

  const rows = useMemo(() => {
    const others = NAMES.map((name, i) => ({ name, xp: seededXp(weekKey, i), me: false }));
    const all = [...others, { name: 'You', xp: weeklyXp, me: true }];
    return all.sort((a, b) => b.xp - a.xp);
  }, [weekKey, weeklyXp]);

  const PROMOTE_ZONE = 5;
  const DEMOTE_ZONE = rows.length - 3;

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} title="League" />

        <Reveal>
          <View className="items-center pb-4">
            <Txt style={{ fontSize: 52 }}>{league.icon}</Txt>
            <Heading className="mt-2 text-2xl" style={{ color: league.color }}>
              {league.name} League
            </Heading>
            <Txt className="mt-1 text-center text-xs text-paper/55">
              Top 5 rise to {getLeague(promote(leagueId)).name} · bottom 3 fall to {getLeague(demote(leagueId)).name}.
              Resets weekly.
            </Txt>
          </View>
        </Reveal>

        <View className="gap-2">
          {rows.map((r, i) => {
            const rank = i + 1;
            const zone = i < PROMOTE_ZONE ? 'up' : i >= DEMOTE_ZONE ? 'down' : 'stay';
            const zoneColor =
              zone === 'up' ? palette.jade : zone === 'down' ? palette.rose : withAlpha(palette.white, 0.15);
            return (
              <Reveal key={r.name} delay={i * 25}>
                <View
                  className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: r.me ? palette.gold : withAlpha(palette.white, 0.08),
                    backgroundColor: r.me ? withAlpha(palette.gold, 0.12) : palette.ink700,
                    borderStartWidth: 3,
                    borderStartColor: zoneColor,
                  }}
                >
                  <Bold style={{ width: 26, color: rank <= 3 ? palette.gold : palette.cream }}>{rank}</Bold>
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: r.me ? palette.gold : withAlpha(palette.white, 0.1) }}
                  >
                    <Bold style={{ color: r.me ? palette.ink : palette.cream }}>{r.name[0]}</Bold>
                  </View>
                  <Bold className="flex-1 text-[15px]" style={{ color: r.me ? palette.gold : palette.cream }}>
                    {r.name}
                  </Bold>
                  <Bold className="text-sm text-paper/70">{r.xp} XP</Bold>
                </View>
              </Reveal>
            );
          })}
        </View>

        <View className="mt-5 flex-row items-center justify-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.jade }} />
            <Eyebrow className="text-paper/55" style={{ fontSize: 9 }}>
              Promotion
            </Eyebrow>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.rose }} />
            <Eyebrow className="text-paper/55" style={{ fontSize: 9 }}>
              Demotion
            </Eyebrow>
          </View>
        </View>
        <View className="h-6" />
      </Screen>
    </View>
  );
}
