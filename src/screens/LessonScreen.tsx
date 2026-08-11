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
import { SpeakerButton } from '../exercises/common';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { announce, invalidateSpeech } from '../lib/speech';
import { dueQueue, dueBudget } from '../lib/srs';
import { shouldUpdateSrs } from '../lib/sessionGrading';
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

/**
 * How much the learner had to supply, which is how much a correct answer is
 * worth to the schedule.
 *
 * `produce` is the kinds that put nothing on screen to choose from — typing a
 * word, assembling it letter by letter, ordering a sentence's words. Getting
 * one of those right is real evidence of recall; picking the right picture out
 * of four is much weaker, and the interval should grow accordingly.
 */
function demandOf(ex: Exercise | undefined): 'produce' | 'recognise' {
  switch (ex?.kind) {
    case 'typeWord':
    case 'wordBuild':
    case 'sentenceBuild':
    case 'letterTrace':
      return 'produce';
    default:
      return 'recognise';
  }
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

/**
 * What this exercise can say out loud, if anything.
 *
 * Mirrors `answerLabel` above, which describes the same exercises in text. A
 * wrong answer is the moment the pronunciation is worth most — and on a
 * listening question it is the whole question, which until now vanished behind
 * the feedback banner the instant it was answered wrongly. The learner heard it
 * once, guessed, and never got to hear it again.
 *
 * Returns null for exercises with nothing recorded — letter *forms* are a
 * shape, not a sound, and there is no clip for a position.
 */
function audioOf(ex: Exercise): { id: string; urdu: string; roman?: string } | null {
  switch (ex.kind) {
    case 'letterPick':
    case 'letterTrace':
      return { id: ex.letter.id, urdu: ex.letter.forms.isolated, roman: ex.letter.name };
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
      return { id: ex.word.id, urdu: ex.word.urdu, roman: ex.word.roman };
    default:
      return null;
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
    // How many due items to ask for is scheduling policy, not a screen
    // decision — see `dueBudget`, which is where the old flat cap of four for
    // every kind of lesson was quietly defeating spaced repetition.
    const want = dueBudget(lesson.kind, lesson.size);
    const due = dueQueue(srs, want).map((id) => ({ id, type: srsType[id] ?? ('word' as const) }));
    // Every id the learner has ever been graded on — see the doc comment on
    // `fallbackReviewRefs` for why a review with nothing due yet needs this
    // rather than trusting a topic's word list to mean "shown".
    const known = new Set(Object.keys(srs));
    return buildLessonExercises(lesson, due, track, known);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, track]);

  const [idx, setIdx] = useState(0);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  /**
   * Forces `ExerciseView` to remount after a gem refill.
   *
   * Refilling reset `graded` to null and hid the "out of hearts" screen, but
   * `idx` never changed, so `<ExerciseView key={idx}>` stayed mounted with the
   * state left over from the failed attempt — `picked`/`locked` inside the
   * exercise component itself, which every exercise's `choose()`/`check()`
   * guards against re-firing. The learner was returned to a question with
   * disabled inputs and no footer to press Continue on, since the footer only
   * shows when `graded != null`. Bumping this into the key on refill is what
   * actually gives them a clean second try at the same question.
   */
  const [attempt, setAttempt] = useState(0);
  const bodyRef = useRef<ScrollView>(null);

  /**
   * Which items this lesson visit has already updated SRS state for.
   *
   * A lesson can meet the same word or letter more than once by design — the
   * whole point of the staggered pipelines in `generator.ts` — but every
   * exercise grades independently, and until `shouldUpdateSrs` existed, every
   * sighting of an item called `gradeItem`, walking its `SrsCard` through
   * SM-2 as if each were a separate day's review. A letter met 6 times
   * correctly in one sitting pushed its next due date out 98 days from a
   * single 5 minute lesson. See the doc comment on `shouldUpdateSrs` for the
   * full measurement.
   *
   * Reset whenever `exercises` changes — a new lesson visit, including the
   * same lesson opened again — rather than once at mount, so it cannot
   * outlive the session it is scoped to.
   */
  const gradedThisSession = useRef<Set<string>>(new Set());
  useEffect(() => {
    gradedThisSession.current = new Set();
  }, [exercises]);

  const current = exercises[idx];
  /** The clip the feedback banner offers to replay, when there is one. */
  const replay = current ? audioOf(current) : null;
  const total = exercises.length;

  const onGraded = useCallback(
    (result: GradedResult) => {
      setGraded(result.correct);
      // Answering opens the feedback banner, which takes a third of the
      // screen, so bring it into view. Used to fire only on a wrong answer —
      // "the explanation is off-screen below" was the case that mattered when
      // every exercise body was a handful of short words. `wordFromMeaning`
      // drawing full sentences (see `SENTENCE_WORDS`, generator.ts) can now
      // put a tall option grid on screen too, and THE CRITIC measured the
      // footer landing directly on top of the bottom two cards' Urdu text on
      // a *correct* answer at a stock 375x812 viewport — the same off-screen
      // problem, just from a tall question instead of a tall explanation.
      setTimeout(() => bodyRef.current?.scrollToEnd({ animated: true }), 120);
      // update SRS memory for each item touched — but only the first sighting
      // of it this lesson visit. See the doc comment on `gradedThisSession`.
      //
      // Every answer used to be graded `good` or `again`, which left the
      // scheduler's `easy` branch dead: recalling a word from nothing but its
      // English and recognising it among four pictures pushed the next review
      // out by exactly the same amount. They are not the same evidence, so a
      // correct answer on an exercise that supplied no options counts as easy.
      const grade = !result.correct ? 'again' : demandOf(exercises[idx]) === 'produce' ? 'easy' : 'good';
      result.items.forEach((it) => {
        if (shouldUpdateSrs(gradedThisSession.current, it)) gradeItem(it.id, it.type, grade);
      });
      if (result.correct) {
        setCorrectCount((c) => c + 1);
      } else if (!isTeaching(exercises[idx])) {
        loseHeart();
        if (useProgressStore.getState().hearts <= 0) {
          setTimeout(() => setOutOfHearts(true), 500);
        }
      }
    },
    // `idx` and `exercises` belong here because the body reads
    // `exercises[idx]`. They were missing, so the callback was built once on the
    // first render and every answer for the rest of the lesson was judged
    // against exercise 0 — which in a grammar lesson is the teaching card, and
    // `isTeaching` therefore suppressed the heart loss for every wrong answer in
    // the lesson. Grammar cost nothing to get wrong.
    [gradeItem, loseHeart, exercises, idx]
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
    return <LessonComplete result={result} correct={correctCount} total={total} onHome={() => nav.navigate('Main')} />;
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
                    setAttempt((a) => a + 1);
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
            <Txt className="text-2xl text-paper/55">✕</Txt>
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
              key={`${idx}-${attempt}`}
              exercise={current}
              track={track}
              showRoman={showRoman}
              locked={graded != null}
              onGraded={onGraded}
              onExpand={() => bodyRef.current?.scrollToEnd({ animated: true })}
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
              <View className="px-5 py-4" style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
                <View className="mb-3 flex-row items-center gap-2">
                  <Illustration
                    name={isTeaching(current) ? 'lattice' : graded ? 'check' : 'crescent'}
                    tile={false}
                    size={24}
                  />
                  <View className="flex-1">
                    <Bold
                      style={{
                        color: isTeaching(current) ? palette.gold : graded ? palette.jadeLight : palette.roseLight,
                      }}
                    >
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
                  {/* Hear it again. Only on a wrong answer, which is where it
                      was asked for and where it is worth most: the app says the
                      word once when the answer lands, and before this there was
                      no way to ask for it a second time. */}
                  {!graded && current && !isTeaching(current) && replay ? (
                    <SpeakerButton
                      size={38}
                      label={`Hear ${replay.roman ?? replay.urdu} again`}
                      onPress={() => announce(replay.id, replay.urdu, replay.roman)}
                    />
                  ) : null}
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
