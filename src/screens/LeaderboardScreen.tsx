import { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { LeagueBadge } from '../components/Illustration';
import { Reveal } from '../components/Reveal';
import { Txt, Bold, Eyebrow, Heading } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { getLeague, leagueAbove, leagueBelow, leagueMovementLine } from '../lib/gamification';
import { useProgressStore } from '../store/useProgressStore';

/**
 * A practice cohort. Deterministic per-week so it feels stable.
 *
 * Named on screen for what it is — see the line under the league header. It
 * exists so the league can teach pacing before there is anyone to pace
 * against; it is not a claim that these people are playing.
 */
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

  // A zone that leads nowhere is not a zone. In Emerald there is nothing to
  // rise to and in Clay nothing to fall to, so those stripes and their legend
  // entries come off rather than colouring rows for a move that cannot happen.
  const canRise = leagueAbove(leagueId) !== null;
  const canFall = leagueBelow(leagueId) !== null;
  const PROMOTE_ZONE = canRise ? 5 : 0;
  const DEMOTE_ZONE = canFall ? rows.length - 3 : rows.length;

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} title="League" />

        <Reveal>
          <View className="items-center pb-4">
            <LeagueBadge color={league.color} size={52} />
            <Heading className="mt-2 text-2xl" style={{ color: league.color }}>
              {league.name} League
            </Heading>
            <Txt className="mt-1 text-center text-xs text-paper/55">{leagueMovementLine(leagueId)} Resets weekly.</Txt>
            {/* The fourteen names below are generated from the week number.
                The code has always been honest about it — "Believable weekly
                cohort" — and the screen was not: it presented them exactly
                like real competitors, with nothing anywhere saying otherwise.
                Kept, because a league with nobody in it teaches nothing about
                pacing, and said out loud, because this was the one place the
                app told a learner something untrue. */}
            <Txt className="mt-2 text-center text-[0.6875rem] text-paper/55">
              The other names are a practice cohort, not real people. Your XP is the only real number here.
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
                  <Bold className="flex-1 text-[0.9375rem]" style={{ color: r.me ? palette.gold : palette.cream }}>
                    {r.name}
                  </Bold>
                  <Bold className="text-sm text-paper/70">{r.xp} XP</Bold>
                </View>
              </Reveal>
            );
          })}
        </View>

        <View className="mt-5 flex-row items-center justify-center gap-4">
          {canRise && (
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.jade }} />
              <Eyebrow className="text-paper/55 text-[0.5625rem]">Promotion</Eyebrow>
            </View>
          )}
          {canFall && (
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.rose }} />
              <Eyebrow className="text-paper/55 text-[0.5625rem]">Demotion</Eyebrow>
            </View>
          )}
        </View>
        <View className="h-6" />
      </Screen>
    </View>
  );
}
