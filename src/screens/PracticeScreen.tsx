import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Reveal } from '../components/Reveal';
import { ProgressBar } from '../components/ProgressBar';
import { Display, Heading, Txt, Bold, Eyebrow, Urdu } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { dueCount } from '../lib/srs';
import { strength } from '../lib/srs';
import { useProgressStore } from '../store/useProgressStore';
import { TOPICS, wordsByTopic } from '../data/words';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PracticeScreen() {
  const nav = useNavigation<Nav>();
  const srs = useProgressStore((s) => s.srs);
  const learnedWords = useProgressStore((s) => s.learnedWords);
  const regenHearts = useProgressStore((s) => s.regenHearts);

  useEffect(() => {
    regenHearts();
  }, [regenHearts]);

  const due = dueCount(srs);
  const totalTracked = Object.keys(srs).length;
  const mastered = Object.values(srs).filter((c) => strength(c) >= 0.8).length;

  const go = (lessonId: string) => {
    feedback.tap();
    nav.navigate('Lesson', { lessonId });
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        <Reveal>
          <SafeAreaView edges={['top']}>
            <Eyebrow style={{ color: palette.gold }}>Practice</Eyebrow>
            <Display className="mt-1 text-3xl">Keep it warm</Display>
            <Txt className="mt-1 text-sm text-paper/55">
              Spaced repetition brings back exactly what you're about to forget.
            </Txt>
          </SafeAreaView>
        </Reveal>

        {/* daily review hero */}
        <Reveal delay={80}>
          <Pressable onPress={() => go('practice-review')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View
              className="mb-4 mt-5 overflow-hidden rounded-2xl p-6"
              style={{ backgroundColor: palette.jade }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Eyebrow style={{ color: withAlpha('#ffffff', 0.75) }}>Daily review</Eyebrow>
                  <Heading style={{ color: '#fff' }} className="mt-1 text-2xl">
                    {due > 0 ? `${due} item${due > 1 ? 's' : ''} due` : 'All caught up'}
                  </Heading>
                  <Txt style={{ color: withAlpha('#ffffff', 0.85) }} className="mt-1 text-sm">
                    {due > 0 ? 'A calm few minutes to lock them in.' : 'Come back later, or drill a topic below.'}
                  </Txt>
                </View>
                <Txt style={{ fontSize: 44 }}>🔁</Txt>
              </View>
            </View>
          </Pressable>
        </Reveal>

        {/* memory strength */}
        {totalTracked > 0 && (
          <Reveal delay={140}>
            <Card className="mb-6">
              <View className="mb-2 flex-row items-center justify-between">
                <Bold className="text-sm">Memory strength</Bold>
                <Txt className="text-xs text-paper/55">
                  {mastered} of {totalTracked} mastered
                </Txt>
              </View>
              <ProgressBar progress={totalTracked ? mastered / totalTracked : 0} color={palette.gold} height={10} />
            </Card>
          </Reveal>
        )}

        {/* topics */}
        <Reveal delay={200}>
          <Eyebrow className="mb-3 text-paper/50">Drill a topic</Eyebrow>
        </Reveal>
        <View className="flex-row flex-wrap justify-between">
          {TOPICS.map((t, i) => {
            const words = wordsByTopic(t.id);
            const known = words.filter((w) => learnedWords.includes(w.id)).length;
            return (
              <Reveal key={t.id} delay={220 + i * 30} style={{ width: '48%' }}>
                <Pressable onPress={() => go(`practice-topic-${t.id}`)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                  <View className="mb-3 rounded-2xl border border-white/10 bg-ink-700 p-4">
                    <Txt style={{ fontSize: 26 }}>{t.icon}</Txt>
                    <Bold className="mt-2 text-sm">{t.title}</Bold>
                    <Txt className="mt-0.5 text-[11px] text-paper/50">
                      {known}/{words.length} words
                    </Txt>
                    <View className="mt-2">
                      <ProgressBar progress={words.length ? known / words.length : 0} color={palette.jadeLight} height={5} spring={false} />
                    </View>
                  </View>
                </Pressable>
              </Reveal>
            );
          })}
        </View>

        <View className="h-6" />
      </Screen>
    </View>
  );
}
