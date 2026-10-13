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
import { count } from '../lib/plural';
import { useEffect, useState } from 'react';
import { useProgressStore, type FinishResult } from '../store/useProgressStore';
import { heartsAreFree } from '../lib/hearts';
import { HEARTS_MAX, HEART_REGEN_MINUTES, REFILL_COST } from '../lib/gamification';

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
      <Eyebrow style={{ color: withAlpha(color, 0.8) }} className="mt-0.5 text-[0.5625rem]">
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

  /**
   * Said once, the first time a lesson ends with hearts switched on: when Unit
   * 1 is finished or skipped. Until now the rule was first met as a wall in the
   * middle of a lesson (QA, 2026-10-13, C1). Fixed at mount, so the screen
   * does not change under the learner when the flag is saved.
   */
  const [heartsNote] = useState(() => {
    const s = useProgressStore.getState();
    return !s.heartsIntroSeen && !heartsAreFree(s.completedLessons, s.skippedLessons);
  });
  useEffect(() => {
    if (heartsNote) useProgressStore.getState().seeHeartsIntro();
  }, [heartsNote]);

  return (
    <View className="flex-1 bg-ink">
      <Confetti show />
      {/* Scrolls once it outgrows the screen. Fixed-height, its cards slid
          under the footnote and Continue at 320px and at large text (design
          review, 2026-10-13). */}
      <Screen fill>
        <SafeAreaView className="flex-grow">
          <View className="flex-grow items-center justify-center">
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
              {/* "36 of 43" alone could be words, points or anything; this says
                  what it counts. */}
              <Txt className="mt-1 text-center text-sm text-paper/60">exercises correct</Txt>
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
            {heartsNote && (
              <Reveal delay={160} style={{ width: '100%' }}>
                <View
                  accessibilityRole="summary"
                  className="mb-3 flex-row items-start gap-3 rounded-2xl border p-4"
                  style={{ borderColor: withAlpha(palette.rose, 0.35), backgroundColor: withAlpha(palette.rose, 0.1) }}
                >
                  <Illustration name="heart" tile={false} size={26} />
                  <View className="flex-1">
                    <Bold className="text-[0.9375rem]">Hearts are on from here</Bold>
                    <Txt className="mt-1 text-xs leading-5 text-paper/75">
                      {`You have ${HEARTS_MAX}. A wrong answer costs one, one comes back every ${HEART_REGEN_MINUTES} minutes, and a refill costs ${REFILL_COST} gems. Guess-first questions and tracing stay free.`}
                    </Txt>
                  </View>
                </View>
              </Reveal>
            )}
            {accuracy < 60 && (
              <Reveal delay={180} style={{ width: '100%' }}>
                <View
                  className="mb-3 items-center rounded-2xl border p-4"
                  style={{
                    borderColor: withAlpha(palette.gold, 0.3),
                    backgroundColor: withAlpha(palette.gold, 0.08),
                  }}
                >
                  <Bold style={{ color: palette.goldLight }}>A tough one</Bold>
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
                  <Bold style={{ color: palette.flameLight }}>
                    {count(result.streak, 'day')} in a row. Keep it alight!
                  </Bold>
                </View>
              </Reveal>
            )}

            {/* Once, on the lesson after a freeze is spent, whether it went at
                launch or inside this lesson. Without it the streak simply
                survived a missed day and the learner never learned why. */}
            {result.freezeUsed && (
              <Reveal delay={240} style={{ width: '100%' }}>
                <View
                  className="mb-3 items-center rounded-2xl border p-4"
                  style={{ borderColor: withAlpha(palette.gold, 0.35), backgroundColor: withAlpha(palette.gold, 0.1) }}
                >
                  <Bold style={{ color: palette.goldLight }}>
                    {result.freezeUsed.days > 1
                      ? `${result.freezeUsed.days} streak freezes covered the ${result.freezeUsed.days} days you missed`
                      : 'A streak freeze covered the day you missed'}
                  </Bold>
                  <Txt className="mt-1 text-center text-xs text-paper/70">
                    {result.freezeUsed.left
                      ? `You have ${count(result.freezeUsed.left, 'freeze')} left.`
                      : result.freezeUsed.days > 1
                        ? 'Those were your last ones. You can buy more on your profile.'
                        : 'That was your last one. You can buy another on your profile.'}
                  </Txt>
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
                  <Illustration name={a.icon} tile={false} size={30} />
                  <View className="flex-1">
                    <Eyebrow style={{ color: palette.jadeLight }}>Achievement · Tier {a.tier}</Eyebrow>
                    <Bold className="text-[0.9375rem]">{a.title}</Bold>
                  </View>
                </View>
              </Reveal>
            ))}
          </View>

          <Reveal delay={420}>
            {accuracy < 60 ? null : (
              <Txt className="mb-4 text-center text-xs text-paper/55">
                {/* It said "Come back tomorrow", over a Continue button that
                  opens the next lesson at once, and testers read it as a
                  daily limit (QA report, 2026-10-12). */}
                {/* Only when something did: under "Flawless session · 22 of 22"
                  it promised to bring back mistakes there were none of (QA
                  round 5, L28). */}
                {correct < total
                  ? 'Whatever slipped comes back first in your next practice.'
                  : 'Nothing slipped. The words come back when they are due.'}
              </Txt>
            )}
            <Button onPress={onHome}>Continue</Button>
          </Reveal>
        </SafeAreaView>
      </Screen>
    </View>
  );
}
