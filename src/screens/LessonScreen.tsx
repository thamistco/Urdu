import { useMemo, useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Screen, CONTENT_MAX_WIDTH } from '../components/Screen';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Hearts } from '../components/Stats';
import { Txt, Bold, Heading } from '../components/Text';
import { Illustration } from '../components/Illustration';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { dueQueue } from '../lib/srs';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { resolveLesson } from '../data/units';
import { POSITIONS } from '../data/letters';
import { ExerciseView } from '../exercises';
import { buildLessonExercises } from '../exercises/generator';
import type { Exercise, GradedResult } from '../exercises/types';
import type { FinishResult } from '../store/useProgressStore';
import { LessonComplete } from './LessonComplete';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'Lesson'>;

/** Teaching cards are informational — no hearts, no pass/fail styling. */
function isTeaching(ex: Exercise | undefined): boolean {
  return ex?.kind === 'grammarTeach';
}

function answerLabel(ex: Exercise): string {
  switch (ex.kind) {
    case 'letterForm':
      return POSITIONS.find((p) => p.key === ex.position)?.label ?? '';
    case 'letterPick':
    case 'letterTrace':
      return `${ex.letter.name} — ${ex.letter.forms.isolated}`;
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
      return `${ex.word.urdu} — ${ex.word.meaning}`;
    default:
      return '';
  }
}

export function LessonScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const lesson = resolveLesson(route.params.lessonId)!;

  const showRoman = useSettingsStore((s) => s.showRoman);
  const gradeItem = useProgressStore((s) => s.gradeItem);
  const loseHeart = useProgressStore((s) => s.loseHeart);
  const finishLesson = useProgressStore((s) => s.finishLesson);
  const refillHearts = useProgressStore((s) => s.refillHearts);
  const hearts = useProgressStore((s) => s.hearts);
  const gems = useProgressStore((s) => s.gems);

  // Build the exercise set once, weaving in whatever SRS items are due.
  const exercises = useMemo(() => {
    const srs = useProgressStore.getState().srs;
    const srsType = useProgressStore.getState().srsType;
    const due = dueQueue(srs, 4).map((id) => ({ id, type: srsType[id] ?? ('word' as const) }));
    return buildLessonExercises(lesson, due);
  }, [lesson]);

  const [idx, setIdx] = useState(0);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);

  const current = exercises[idx];
  const total = exercises.length;

  const onGraded = useCallback(
    (result: GradedResult) => {
      setGraded(result.correct);
      // update SRS memory for each item touched
      result.items.forEach((it) => gradeItem(it.id, it.type, result.correct ? 'good' : 'again'));
      if (result.correct) {
        setCorrectCount((c) => c + 1);
      } else if (!isTeaching(exercises[idx])) {
        loseHeart();
        if (useProgressStore.getState().hearts <= 0) {
          setTimeout(() => setOutOfHearts(true), 500);
        }
      }
    },
    [gradeItem, loseHeart]
  );

  const advance = () => {
    if (idx < total - 1) {
      setGraded(null);
      setIdx(idx + 1);
    } else {
      const r = finishLesson({
        lessonId: lesson.id,
        correct: correctCount,
        total,
        xp: lesson.xp,
        isReview: lesson.kind === 'review',
      });
      feedback.levelUp();
      setResult(r);
      setDone(true);
    }
  };

  if (done && result) {
    return (
      <LessonComplete
        result={result}
        correct={correctCount}
        total={total}
        onHome={() => nav.navigate('Main')}
      />
    );
  }

  if (outOfHearts) {
    return (
      <Screen scroll={false}>
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center px-2">
            <Illustration name="heart" tile={false} size={60} />
            <Heading className="mb-2 mt-4 text-2xl">Out of hearts</Heading>
            <Txt className="mb-8 max-w-[280px] text-center text-sm text-paper/60">
              Hearts refill slowly over time, or you can spend gems to keep the calm going now.
            </Txt>
            <View className="w-full gap-3">
              <Button
                variant="primary"
                disabled={gems < 40}
                onPress={() => {
                  if (refillHearts()) {
                    feedback.correct();
                    setOutOfHearts(false);
                    setGraded(null);
                  }
                }}
              >
                Refill · 40 gems (you have {gems})
              </Button>
              <Button variant="ghost" onPress={() => nav.navigate('Main')}>
                Leave for now
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* header: close + progress + hearts — the bar is full width, its
            contents track the content column so they line up with the exercise */}
        <View
          className="flex-row items-center gap-3 px-4 pb-3 pt-1"
          style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}
        >
          <Pressable
            hitSlop={12}
            onPress={() => {
              feedback.tap();
              nav.navigate('Main');
            }}
          >
            <Txt className="text-2xl text-paper/50">✕</Txt>
          </Pressable>
          <View className="flex-1">
            <ProgressBar progress={(idx + (graded != null ? 1 : 0)) / total} color={palette.jade} height={12} />
          </View>
          <Hearts count={hearts} />
        </View>

        {/* exercise body */}
        <Screen scroll padded={false} lattice={false}>
          <View className="px-5 pt-4">
            <ExerciseView
              key={idx}
              exercise={current}
              showRoman={showRoman}
              locked={graded != null}
              onGraded={onGraded}
            />
          </View>
        </Screen>

        {/* feedback footer */}
        {graded != null && (
          <Animated.View
            entering={SlideInDown.duration(260)}
            style={{
              backgroundColor: isTeaching(current)
                ? withAlpha(palette.gold, 0.14)
                : graded
                ? withAlpha(palette.jade, 0.16)
                : withAlpha(palette.rose, 0.16),
              borderTopWidth: 1,
              borderTopColor: isTeaching(current) ? palette.gold : graded ? palette.jade : palette.rose,
            }}
          >
            <SafeAreaView edges={['bottom']}>
              <View
                className="px-5 py-4"
                style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}
              >
                <View className="mb-3 flex-row items-center gap-2">
                  <Illustration
                    name={isTeaching(current) ? 'lattice' : graded ? 'check' : 'crescent'}
                    tile={false}
                    size={24}
                  />
                  <View className="flex-1">
                    <Bold style={{ color: isTeaching(current) ? palette.gold : graded ? palette.jadeLight : palette.roseLight }}>
                      {isTeaching(current)
                        ? 'Keep that in mind'
                        : graded
                        ? 'Beautifully done'
                        : 'Not quite — that’s okay'}
                    </Bold>
                    {!graded && current && !isTeaching(current) ? (
                      <Txt className="text-xs text-paper/70">Answer: {answerLabel(current)}</Txt>
                    ) : null}
                  </View>
                </View>
                <Button
                  variant={isTeaching(current) ? 'primary' : graded ? 'correct' : 'incorrect'}
                  sound={false}
                  onPress={advance}
                >
                  {idx < total - 1 ? 'Continue' : 'Finish'}
                </Button>
              </View>
            </SafeAreaView>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}
