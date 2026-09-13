import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Confetti } from '../components/Confetti';
import { Reveal } from '../components/Reveal';
import { GeoDivider } from '../components/GeoDivider';
import { Display, Heading, Txt, Bold, Eyebrow } from '../components/Text';
import { Illustration } from '../components/Illustration';
import type { IconName } from '../art/icons';
import { palette, withAlpha } from '../theme';
import { levelTitle } from '../lib/gamification';
import type { FinishResult } from '../store/useProgressStore';

function RewardTile({ icon, value, label, color }: { icon: IconName; value: string; label: string; color: string }) {
  return (
    <View
      className="flex-1 items-center rounded-2xl border p-4"
      style={{ borderColor: withAlpha(color, 0.3), backgroundColor: withAlpha(color, 0.1) }}
    >
      <Illustration name={icon} tile={false} size={26} />
      <Display style={{ color }} className="mt-1 text-2xl">
        {value}
      </Display>
      <Eyebrow style={{ color: withAlpha(color, 0.8), fontSize: 9 }} className="mt-0.5">
        {label}
      </Eyebrow>
    </View>
  );
}

export function LessonComplete({
  result,
  correct,
  total,
  onHome,
}: {
  result: FinishResult;
  correct: number;
  total: number;
  onHome: () => void;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

  return (
    <View className="flex-1 bg-ink">
      <Confetti show />
      <Screen scroll={false}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center">
            <Reveal>
              <View className="items-center">
                <Illustration
                  name={result.perfect ? 'star' : accuracy >= 80 ? 'crescent' : 'sparkle'}
                  tile={false}
                  size={64}
                />
              </View>
              <Eyebrow style={{ color: palette.gold }} className="mt-4 text-center">
                {result.perfect ? 'Flawless session' : 'Session complete'}
              </Eyebrow>
              <Display className="mt-1 text-center text-4xl">
                {correct} of {total}
              </Display>
              <GeoDivider />
            </Reveal>

            <Reveal delay={120} style={{ width: '100%' }}>
              <View className="mb-4 mt-2 flex-row gap-3">
                <RewardTile icon="bolt" value={`+${result.xpGained}`} label="XP" color={palette.gold} />
                <RewardTile icon="gem" value={`+${result.gemsGained}`} label="Gems" color={palette.jadeLight} />
                <RewardTile icon="crescent" value={`${accuracy}%`} label="Accuracy" color={palette.roseLight} />
              </View>
            </Reveal>

            {/* A low score used to pass without comment: a playtester finished
                all fourteen lessons getting two thirds wrong and was never
                once pointed back at anything. Not a gate and not a scold —
                the words that went wrong are already in the schedule, so this
                only says so, at the one moment the learner is deciding
                whether to carry on or stop. */}
            {accuracy < 60 && (
              <Reveal delay={180} style={{ width: '100%' }}>
                <View
                  className="mb-3 items-center rounded-2xl border p-4"
                  style={{
                    borderColor: withAlpha(palette.gold, 0.3),
                    backgroundColor: withAlpha(palette.gold, 0.08),
                  }}
                >
                  <Bold style={{ color: palette.goldLight }}>Plenty of new words in that one</Bold>
                  <Txt className="mt-1 text-center text-xs text-paper/70">
                    The ones that slipped are already queued for your next practice.
                  </Txt>
                </View>
              </Reveal>
            )}

            {result.streakIncreased && (
              <Reveal delay={220} style={{ width: '100%' }}>
                <View
                  className="mb-3 flex-row items-center justify-center gap-2 rounded-2xl border p-4"
                  style={{
                    borderColor: withAlpha(palette.flame, 0.35),
                    backgroundColor: withAlpha(palette.flame, 0.1),
                  }}
                >
                  <Illustration name="flame" tile={false} size={26} />
                  <Bold style={{ color: palette.flameLight }}>{result.streak} days in a row. Keep it alight!</Bold>
                </View>
              </Reveal>
            )}

            {result.leveledUp && (
              <Reveal delay={300} style={{ width: '100%' }}>
                <View
                  className="mb-3 items-center rounded-2xl border p-4"
                  style={{ borderColor: withAlpha(palette.gold, 0.35), backgroundColor: withAlpha(palette.gold, 0.1) }}
                >
                  <Eyebrow style={{ color: palette.gold }}>Level up!</Eyebrow>
                  <Heading className="mt-1 text-xl">
                    Level {result.newLevel} · {levelTitle(result.newLevel)}
                  </Heading>
                </View>
              </Reveal>
            )}

            {result.newAchievements.map((a, i) => (
              <Reveal key={a.id} delay={360 + i * 80} style={{ width: '100%' }}>
                <View
                  className="mb-3 flex-row items-center gap-3 rounded-2xl border p-4"
                  style={{ borderColor: withAlpha(palette.jade, 0.35), backgroundColor: withAlpha(palette.jade, 0.1) }}
                >
                  <Txt style={{ fontSize: 30 }}>{a.icon}</Txt>
                  <View className="flex-1">
                    <Eyebrow style={{ color: palette.jadeLight }}>Achievement · Tier {a.tier}</Eyebrow>
                    <Bold className="text-[15px]">{a.title}</Bold>
                  </View>
                </View>
              </Reveal>
            ))}
          </View>

          <Reveal delay={420}>
            <Txt className="mb-4 text-center text-xs text-paper/55">
              Come back tomorrow. We’ll bring back what you missed first.
            </Txt>
            <Button onPress={onHome}>Continue</Button>
          </Reveal>
        </SafeAreaView>
      </Screen>
    </View>
  );
}
