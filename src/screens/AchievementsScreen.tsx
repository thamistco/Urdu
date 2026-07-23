import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Reveal } from '../components/Reveal';
import { ProgressBar } from '../components/ProgressBar';
import { Txt, Bold, Eyebrow, Heading } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { ACHIEVEMENTS } from '../data/achievements';
import { useProgressStore } from '../store/useProgressStore';

export function AchievementsScreen() {
  const nav = useNavigation();
  const metrics = useProgressStore((s) => s.metrics());
  const achieved = useProgressStore((s) => s.achieved);

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <TopBar onBack={() => nav.goBack()} title="Achievements" />

        <Reveal>
          <Heading className="mb-1 text-2xl">Your journey</Heading>
          <Txt className="mb-5 text-sm text-paper/55">
            Each badge tiers up as you go — small wins early, rare targets later.
          </Txt>
        </Reveal>

        <View className="gap-3">
          {ACHIEVEMENTS.map((a, i) => {
            const value = metrics[a.metric];
            const tier = achieved[a.id] ?? 0;
            const maxTier = a.tiers.length;
            const nextThreshold = a.tiers[Math.min(tier, maxTier - 1)];
            const prevThreshold = tier > 0 ? a.tiers[tier - 1] : 0;
            const isMax = tier >= maxTier;
            const ratio = isMax
              ? 1
              : Math.min(1, (value - prevThreshold) / (nextThreshold - prevThreshold));
            const unlocked = tier > 0;

            return (
              <Reveal key={a.id} delay={i * 40}>
                <View
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: unlocked ? withAlpha(palette.gold, 0.35) : withAlpha(palette.white, 0.08),
                    backgroundColor: unlocked ? withAlpha(palette.gold, 0.07) : palette.ink700,
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: unlocked ? withAlpha(palette.gold, 0.2) : withAlpha(palette.white, 0.06) }}
                    >
                      <Txt style={{ fontSize: 26, opacity: unlocked ? 1 : 0.4 }}>{a.icon}</Txt>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Bold className="text-[15px]">{a.title}</Bold>
                        {tier > 0 && (
                          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: withAlpha(palette.gold, 0.2) }}>
                            <Eyebrow style={{ color: palette.gold, fontSize: 8 }}>
                              {isMax ? 'MAX' : `Tier ${tier}`}
                            </Eyebrow>
                          </View>
                        )}
                      </View>
                      <Txt className="text-xs text-paper/55">{a.description}</Txt>
                    </View>
                  </View>
                  <View className="mt-3">
                    <ProgressBar progress={ratio} color={unlocked ? palette.gold : withAlpha(palette.white, 0.3)} height={7} spring={false} />
                    <Txt className="mt-1 text-right text-[11px] text-paper/45">
                      {isMax ? `${value} · complete` : `${value} / ${nextThreshold}`}
                    </Txt>
                  </View>
                </View>
              </Reveal>
            );
          })}
        </View>
        <View className="h-8" />
      </Screen>
    </View>
  );
}
