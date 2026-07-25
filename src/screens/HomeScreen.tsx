import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Reveal } from '../components/Reveal';
import { StatChip } from '../components/Stats';
import { WordArt, Illustration, lessonIconName } from '../components/Illustration';
import { Display, Heading, Txt, Bold, Eyebrow, Urdu } from '../components/Text';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { levelProgress, levelTitle } from '../lib/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { UNITS, Lesson, LESSON_ORDER } from '../data/units';
import { LEVEL_META, LEVEL_ORDER, type Level } from '../data/words';
import { WORDS } from '../data/words';
import { DAILY_GOALS } from '../data/achievements';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GREETING: Record<string, string> = {
  family: 'Speak with them',
  read: 'Read the script',
  heritage: 'Come home to it',
  curious: 'Explore Urdu',
};

function lessonState(
  lessonId: string,
  completed: Record<string, unknown>
): 'done' | 'current' | 'locked' {
  if (completed[lessonId]) return 'done';
  const idx = LESSON_ORDER.indexOf(lessonId);
  const prev = LESSON_ORDER[idx - 1];
  if (idx === 0 || (prev && completed[prev])) return 'current';
  return 'locked';
}

function LessonNode({
  lesson,
  color,
  state,
  offset,
  onPress,
}: {
  lesson: Lesson;
  color: string;
  state: 'done' | 'current' | 'locked';
  offset: number;
  onPress: () => void;
}) {
  const bg = state === 'locked' ? palette.ink700 : state === 'done' ? color : withAlpha(color, 0.22);
  const ring = state === 'current' ? palette.gold : 'transparent';
  return (
    <View className="mb-6 flex-row items-center" style={{ marginLeft: offset }}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}. ${lesson.subtitle}. ${
          state === 'done' ? 'Completed' : state === 'current' ? 'Start this lesson' : 'Locked — tap to jump ahead'
        }`}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }], opacity: state === 'locked' ? 0.7 : 1 })}
      >
        <View
          className="h-[68px] w-[68px] items-center justify-center rounded-full"
          style={{
            backgroundColor: bg,
            borderWidth: state === 'current' ? 3 : state === 'done' ? 0 : 2,
            borderColor: state === 'current' ? ring : withAlpha(palette.white, 0.12),
          }}
        >
          {state === 'done' ? (
            <Txt style={{ fontSize: 28, color: '#fff' }}>✓</Txt>
          ) : (
            <View style={{ opacity: state === 'locked' ? 0.85 : 1 }}>
              <Illustration name={lessonIconName(lesson.kind, lesson.topic)} tile={false} size={34} />
            </View>
          )}
        </View>
        {state === 'current' && (
          <View
            className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: palette.gold }}
          >
            <Eyebrow style={{ color: palette.ink, fontSize: 8 }}>Start</Eyebrow>
          </View>
        )}
        {state === 'locked' && (
          <View
            className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.ink600, borderWidth: 1, borderColor: withAlpha(palette.white, 0.15) }}
          >
            <Txt style={{ fontSize: 10, opacity: 0.7 }}>🔒</Txt>
          </View>
        )}
      </Pressable>
      <View className="ml-4 flex-1">
        <Bold
          className="text-[15px]"
          style={{ opacity: state === 'locked' ? 0.5 : 1, writingDirection: 'ltr', textAlign: 'left' }}
        >
          {lesson.title}
        </Bold>
        <Txt className="text-xs text-paper/55" style={{ writingDirection: 'ltr', textAlign: 'left' }}>
          {lesson.subtitle}
        </Txt>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const store = useProgressStore();
  const regenHearts = useProgressStore((s) => s.regenHearts);

  useEffect(() => {
    regenHearts();
  }, [regenHearts]);

  const { level, ratio } = levelProgress(store.totalXp);
  const goal = DAILY_GOALS.find((g) => g.id === store.dailyGoalId) ?? DAILY_GOALS[1];
  const dailyRatio = Math.min(1, store.todayXp / goal.xp);
  const word = WORDS[new Date().getDate() % WORDS.length];

  const openLesson = (lesson: Lesson, _state: string) => {
    // Any lesson can be started — locked ones are "jump ahead". Even with 0
    // hearts you can begin; the lesson player handles running out mid-session.
    nav.navigate('Lesson', { lessonId: lesson.id });
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen>
        {/* header */}
        <Reveal>
          <SafeAreaView edges={['top']}>
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Eyebrow style={{ color: palette.gold }}>Harf · حرف</Eyebrow>
                <Display className="mt-1 text-3xl leading-9">
                  {GREETING[store.goal ?? 'curious']}
                </Display>
              </View>
              <View className="flex-row gap-2">
                <StatChip icon="🔥" value={store.streak} color={palette.flame} />
                <StatChip icon="💠" value={store.gems} color={palette.jadeLight} />
              </View>
            </View>
          </SafeAreaView>
        </Reveal>

        {/* level + daily goal */}
        <Reveal delay={60}>
          <Card className="mb-4">
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="rounded-lg px-2 py-1" style={{ backgroundColor: palette.gold }}>
                  <Bold style={{ color: palette.ink }} className="text-xs">
                    LVL {level}
                  </Bold>
                </View>
                <Bold className="text-sm">{levelTitle(level)}</Bold>
              </View>
              <Txt className="text-xs text-paper/55">
                {store.todayXp}/{goal.xp} XP today
              </Txt>
            </View>
            <ProgressBar progress={ratio} height={10} />
            <View className="mt-3 flex-row items-center gap-2">
              <Txt style={{ fontSize: 14 }}>🎯</Txt>
              <View className="flex-1">
                <ProgressBar progress={dailyRatio} color={palette.jade} height={8} />
              </View>
              <Txt className="text-[11px] text-paper/50">
                {dailyRatio >= 1 ? 'Goal met ✓' : `${Math.round(dailyRatio * 100)}%`}
              </Txt>
            </View>
          </Card>
        </Reveal>

        {/* today's word + letter lab */}
        <Reveal delay={120}>
          <View className="mb-5 flex-row gap-3">
            <Card paper className="flex-1" style={{ paddingVertical: 14 }}>
              <Eyebrow style={{ color: withAlpha(palette.ink, 0.5) }} className="mb-2">
                Today's word
              </Eyebrow>
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <Urdu style={{ fontSize: 32, color: palette.ink, lineHeight: 48 }}>{word.urdu}</Urdu>
                  <Txt style={{ color: palette.ink }} className="text-xs opacity-60">
                    {word.roman} · {word.meaning}
                  </Txt>
                </View>
                <WordArt word={word} size={46} />
              </View>
            </Card>
            <Pressable
              onPress={() => {
                feedback.tap();
                nav.navigate('LetterLab');
              }}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
            >
              <View
                className="h-full w-24 items-center justify-center rounded-2xl border px-2 py-4"
                style={{ borderColor: withAlpha(palette.gold, 0.3), backgroundColor: withAlpha(palette.gold, 0.1) }}
              >
                <Illustration name="pen" tile={false} size={40} />
                <Eyebrow style={{ color: palette.gold, fontSize: 9 }} className="mt-3 text-center">
                  Letter{'\n'}Lab
                </Eyebrow>
              </View>
            </Pressable>
          </View>
        </Reveal>

        {/* jump-ahead hint */}
        <Reveal delay={150}>
          <View
            className="mb-1 flex-row items-center gap-2 rounded-xl px-3 py-2"
            style={{ backgroundColor: withAlpha(palette.gold, 0.08) }}
          >
            <Txt style={{ fontSize: 13 }}>💡</Txt>
            <Txt className="flex-1 text-[11px] text-paper/55">
              Tap any lesson to jump ahead — locked ones stay marked, and unlock as you pass them.
            </Txt>
          </View>
        </Reveal>

        {/* the path, grouped into course stages */}
        {LEVEL_ORDER.map((lvl: Level) => {
          const levelUnits = UNITS.filter((u) => u.level === lvl);
          if (!levelUnits.length) return null;
          const meta = LEVEL_META[lvl];
          const total = levelUnits.reduce((n, u) => n + u.lessons.length, 0);
          const done = levelUnits.reduce(
            (n, u) => n + u.lessons.filter((l) => store.completedLessons[l.id]).length,
            0
          );
          return (
            <View key={lvl}>
              <Reveal>
                <View className="mb-1 mt-7 flex-row items-center gap-3">
                  <View
                    className="rounded-lg px-2.5 py-1"
                    style={{ backgroundColor: withAlpha(meta.color, 0.18), borderWidth: 1, borderColor: withAlpha(meta.color, 0.4) }}
                  >
                    <Bold style={{ color: meta.color }} className="text-xs">
                      {meta.tag}
                    </Bold>
                  </View>
                  <View className="flex-1">
                    <Heading className="text-lg">{meta.title}</Heading>
                    <Txt className="text-xs text-paper/50">{meta.blurb}</Txt>
                  </View>
                  <Txt className="text-[11px] text-paper/45">
                    {done}/{total}
                  </Txt>
                </View>
                <View className="mb-1 mt-2">
                  <ProgressBar progress={total ? done / total : 0} color={meta.color} height={6} spring={false} />
                </View>
              </Reveal>
              {levelUnits.map((unit, ui) => (
          <Reveal key={unit.id} delay={Math.min(120 + ui * 30, 300)}>
            <View className="mb-2 mt-4 flex-row items-center gap-3">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: unit.color }} />
              <View className="flex-1">
                <Eyebrow style={{ color: unit.color }}>{unit.title}</Eyebrow>
                <Txt className="text-xs text-paper/45">{unit.subtitle}</Txt>
              </View>
            </View>
            <View className="mt-3 pl-2">
              {unit.lessons.map((lesson, li) => {
                const st = lessonState(lesson.id, store.completedLessons);
                const offset = [0, 28, 44, 28][li % 4];
                return (
                  <LessonNode
                    key={lesson.id}
                    lesson={lesson}
                    color={unit.color}
                    state={st}
                    offset={offset}
                    onPress={() => openLesson(lesson, st)}
                  />
                );
              })}
            </View>
          </Reveal>
              ))}
            </View>
          );
        })}

        <Txt className="mb-4 mt-6 text-center text-xs leading-5 text-paper/40">
          Every letter has four faces. Most apps teach one.
        </Txt>
      </Screen>
    </View>
  );
}
