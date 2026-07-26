import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
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
import { invalidateSpeech } from '../lib/speech';
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
      return `${ex.letter.name}: ${ex.letter.forms.isolated}`;
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
      return `${ex.word.urdu}: ${ex.word.meaning}`;
    default:
      return '';
  }
}

export function LessonScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  /**
   * Resolved once per lesson id, not once per render.
   *
   * The exercise set below is memoised on this value, and the generator is
   * random — so if this changes identity, every question in the lesson is
   * silently replaced. Practice lessons are built on demand rather than looked
   * up on the path, so calling `resolveLesson` inline handed back a new object
   * each render: answering a question re-rendered the screen, which rebuilt the
   * lesson, which regenerated the questions. The prompt and all four options
   * changed under the learner's finger at the moment they answered, so the
   * answer was graded against a question they had never seen.
   */
  const lesson = useMemo(() => resolveLesson(route.params.lessonId)!, [route.params.lessonId]);

  const showRoman = useSettingsStore((s) => s.showRoman);
  const track = useSettingsStore((s) => s.track);
  const gradeItem = useProgressStore((s) => s.gradeItem);
  const loseHeart = useProgressStore((s) => s.loseHeart);
  const finishLesson = useProgressStore((s) => s.finishLesson);
  const refillHearts = useProgressStore((s) => s.refillHearts);
  const hearts = useProgressStore((s) => s.hearts);
  const gems = useProgressStore((s) => s.gems);

  /**
   * Build the exercise set once, weaving in whatever SRS items are due.
   *
   * Keyed on the lesson *id* and the track — both plain strings — rather than
   * on the lesson object. The generator is random, so anything that re-runs
   * this mid-lesson swaps out the question the learner is looking at; making
   * the dependencies primitives means no caller can cause that by handing back
   * an equal-but-different object.
   */
  const exercises = useMemo(() => {
    const srs = useProgressStore.getState().srs;
    const srsType = useProgressStore.getState().srsType;
    const due = dueQueue(srs, 4).map((id) => ({ id, type: srsType[id] ?? ('word' as const) }));
    return buildLessonExercises(lesson, due, track);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, track]);

  const [idx, setIdx] = useState(0);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const bodyRef = useRef<ScrollView>(null);

  const current = exercises[idx];
  const total = exercises.length;

  const onGraded = useCallback(
    (result: GradedResult) => {
      setGraded(result.correct);
      // Answering both reveals the correct answer at the foot of the exercise
      // and opens the feedback banner, which takes a third of the screen. A
      // learner who got it wrong was left looking at the question with the
      // explanation off-screen below, so bring it into view.
      if (!result.correct) {
        setTimeout(() => bodyRef.current?.scrollToEnd({ animated: true }), 120);
      }
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

  // Stop this lesson's audio the instant the screen is left, however that
  // happens — closing the lesson mid-word shouldn't leave its pronunciation
  // playing into whatever the learner opens next.
  useEffect(() => invalidateSpeech, []);

  const advance = () => {
    invalidateSpeech();
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
        <Screen scroll padded={false} lattice={false} scrollRef={bodyRef}>
          <View className="px-5 pb-8 pt-4">
            <ExerciseView
              key={idx}
              exercise={current}
              track={track}
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
                        : 'Not quite, but that’s okay'}
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
