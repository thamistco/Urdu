import { useEffect, useMemo, useState } from 'react';
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
import { Display, Heading, Txt, Bold, Eyebrow } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { levelProgress, levelTitle } from '../lib/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Lesson, unitsForTrack, findLesson } from '../data/units';
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

/** `order` is the path as the learner's track sees it — on the Roman track the
 *  letter lessons are not on it, so the lesson after them unlocks first.
 *
 *  `skipped` marks lessons pre-satisfied at onboarding for a learner who
 *  already speaks Urdu (see `Background` in the progress store) — they count
 *  the same as `completed` for unlocking what comes next, but render as their
 *  own state rather than a real "done", since nothing was actually attempted. */
function lessonState(
  lessonId: string,
  completed: Record<string, unknown>,
  skipped: Record<string, unknown>,
  order: string[]
): 'done' | 'skipped' | 'current' | 'locked' {
  if (completed[lessonId]) return 'done';
  if (skipped[lessonId]) return 'skipped';
  const idx = order.indexOf(lessonId);
  const prev = order[idx - 1];
  if (idx === 0 || (prev && (completed[prev] || skipped[prev]))) return 'current';
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
  state: 'done' | 'skipped' | 'current' | 'locked';
  offset: number;
  onPress: () => void;
}) {
  const bg =
    state === 'locked' || state === 'skipped' ? palette.ink700 : state === 'done' ? color : withAlpha(color, 0.22);
  const ring = state === 'current' ? palette.gold : 'transparent';
  return (
    <View className="mb-6 flex-row items-center" style={{ marginLeft: offset }}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}. ${lesson.subtitle}. ${
          state === 'done'
            ? 'Completed'
            : state === 'skipped'
            ? 'Skipped as already known — tap to try it anyway'
            : state === 'current'
            ? 'Start this lesson'
            : 'Locked — tap to jump ahead'
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.94 : 1 }],
          opacity: state === 'locked' || state === 'skipped' ? 0.7 : 1,
        })}
      >
        <View
          className="h-[68px] w-[68px] items-center justify-center rounded-full"
          style={{
            backgroundColor: bg,
            borderWidth: state === 'current' ? 3 : state === 'done' ? 0 : state === 'skipped' ? 2 : 2,
            borderColor:
              state === 'current'
                ? ring
                : state === 'skipped'
                ? withAlpha(palette.jade, 0.4)
                : withAlpha(palette.white, 0.12),
            borderStyle: state === 'skipped' ? 'dashed' : 'solid',
          }}
        >
          {state === 'done' ? (
            <Txt style={{ fontSize: 28, color: '#fff' }}>✓</Txt>
          ) : (
            <View style={{ opacity: state === 'locked' || state === 'skipped' ? 0.85 : 1 }}>
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
        {state === 'skipped' && (
          <View
            className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.jadeDark, borderWidth: 1, borderColor: withAlpha(palette.white, 0.15) }}
          >
            <Txt style={{ fontSize: 10 }}>⏭</Txt>
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
  const track = useSettingsStore((s) => s.track);
  const regenHearts = useProgressStore((s) => s.regenHearts);

  useEffect(() => {
    regenHearts();
  }, [regenHearts]);

  const { level, ratio } = levelProgress(store.totalXp);
  const goal = DAILY_GOALS.find((g) => g.id === store.dailyGoalId) ?? DAILY_GOALS[1];
  const dailyRatio = Math.min(1, store.todayXp / goal.xp);
  const word = WORDS[new Date().getDate() % WORDS.length];

  // The path as this learner's track sees it: someone who chose Roman is not
  // shown — or blocked by — the thirteen lessons of alphabet.
  const units = useMemo(() => unitsForTrack(track), [track]);
  const order = useMemo(() => units.flatMap((u) => u.lessons.map((l) => l.id)), [units]);

  // The one next thing to do: the first lesson on the path not yet finished
  // — skipped lessons count as done here too, since there's nothing left to do.
  const currentId = useMemo(
    () => order.find((id) => !store.completedLessons[id] && !store.skippedLessons[id]) ?? order[order.length - 1],
    [store.completedLessons, store.skippedLessons, order]
  );
  const currentLesson = findLesson(currentId);
  const currentUnit = units.find((u) => u.lessons.some((l) => l.id === currentId));
  const currentLevel: Level = currentUnit?.level ?? 'beginner';
  const finished = order.every((id) => store.completedLessons[id] || store.skippedLessons[id]);

  // The course is long. Only the stage you are on is expanded; the others
  // collapse to a progress line you can open when you want to look ahead.
  const [openLevels, setOpenLevels] = useState<Partial<Record<Level, boolean>>>({});
  const isOpen = (lvl: Level) => openLevels[lvl] ?? lvl === currentLevel;
  const toggleLevel = (lvl: Level) => {
    feedback.tap();
    setOpenLevels((s) => ({ ...s, [lvl]: !isOpen(lvl) }));
  };

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
                <StatChip
                  icon={<Illustration name="flame" tile={false} size={16} />}
                  value={store.streak}
                  color={palette.flame}
                />
                <StatChip
                  icon={<Illustration name="gem" tile={false} size={16} />}
                  value={store.gems}
                  color={palette.jadeLight}
                />
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
              <Illustration name="sparkle" tile={false} size={16} />
              <View className="flex-1">
                <ProgressBar progress={dailyRatio} color={palette.jade} height={8} />
              </View>
              <Txt className="text-[11px] text-paper/50">
                {dailyRatio >= 1 ? 'Goal met ✓' : `${Math.round(dailyRatio * 100)}%`}
              </Txt>
            </View>
          </Card>
        </Reveal>

        {/* the one obvious next action */}
        {currentLesson && (
          <Reveal delay={90}>
            <Pressable
              onPress={() => {
                feedback.tap();
                // Once the path is finished there is no "next" lesson — the
                // course becomes its review queue.
                nav.navigate('Lesson', { lessonId: finished ? 'practice-review' : currentLesson.id });
              }}
              accessibilityRole="button"
              accessibilityLabel={
                finished
                  ? 'Course complete. Open your daily review.'
                  : `Continue: ${currentLesson.title}. ${currentLesson.subtitle}`
              }
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <View
                className="mb-4 flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
                style={{
                  backgroundColor: withAlpha(palette.gold, 0.14),
                  borderColor: withAlpha(palette.gold, 0.42),
                }}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: withAlpha(palette.gold, 0.22) }}
                >
                  <Illustration
                    name={finished ? 'medal' : lessonIconName(currentLesson.kind, currentLesson.topic)}
                    tile={false}
                    size={26}
                  />
                </View>
                <View className="flex-1">
                  <Eyebrow style={{ color: palette.gold }}>
                    {finished
                      ? `All ${order.length} lessons done`
                      : store.completedLessons[order[0]] || store.skippedLessons[order[0]]
                      ? 'Continue'
                      : 'Start here'}
                  </Eyebrow>
                  <Bold className="mt-0.5 text-[15px]">
                    {finished ? 'Keep it warm' : currentLesson.title}
                  </Bold>
                  <Txt className="text-xs text-paper/55">
                    {finished
                      ? 'The course is yours — daily review keeps it that way.'
                      : `${currentUnit ? currentUnit.title.replace(/ · .*/, '') : currentLesson.subtitle} · ${currentLesson.subtitle}`}
                  </Txt>
                </View>
                <Txt style={{ color: palette.gold, fontSize: 20 }}>›</Txt>
              </View>
            </Pressable>
          </Reveal>
        )}

        {/* today's word + letter lab */}
        <Reveal delay={120}>
          <View className="mb-5 flex-row gap-3">
            <Card paper className="flex-1" style={{ paddingVertical: 14 }}>
              <Eyebrow style={{ color: withAlpha(palette.ink, 0.5) }} className="mb-2">
                Today's word
              </Eyebrow>
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <Lexeme urdu={word.urdu} roman={word.roman} track={track} size={28} color={palette.ink} align="left" />
                  <Txt style={{ color: palette.ink }} className="text-xs opacity-60">
                    {word.meaning}
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

        {/* jump-ahead hint — pointless once there is nothing left to jump to */}
        {!finished && (
        <Reveal delay={150}>
          <View
            className="mb-1 flex-row items-center gap-2 rounded-xl px-3 py-2"
            style={{ backgroundColor: withAlpha(palette.gold, 0.08) }}
          >
            <Illustration name="sparkle" tile={false} size={15} />
            <Txt className="flex-1 text-[11px] text-paper/55">
              Tap any lesson to jump ahead — locked ones stay marked, and unlock as you pass them.
            </Txt>
          </View>
        </Reveal>
        )}

        {/* the path, grouped into course stages */}
        {LEVEL_ORDER.map((lvl: Level) => {
          const levelUnits = units.filter((u) => u.level === lvl);
          if (!levelUnits.length) return null;
          const meta = LEVEL_META[lvl];
          const total = levelUnits.reduce((n, u) => n + u.lessons.length, 0);
          const done = levelUnits.reduce(
            (n, u) => n + u.lessons.filter((l) => store.completedLessons[l.id] || store.skippedLessons[l.id]).length,
            0
          );
          return (
            <View key={lvl}>
              <Reveal>
                <Pressable
                  onPress={() => toggleLevel(lvl)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen(lvl) }}
                  accessibilityLabel={`${meta.title}. ${done} of ${total} lessons done. ${
                    isOpen(lvl) ? 'Collapse' : 'Expand'
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                >
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
                      <Txt className="text-xs text-paper/50">
                        {(track === 'roman' && meta.romanBlurb) || meta.blurb}
                      </Txt>
                    </View>
                    <Txt className="text-[11px] text-paper/45">
                      {done}/{total}
                    </Txt>
                    <Txt style={{ color: withAlpha(palette.cream, 0.5), fontSize: 15 }}>
                      {isOpen(lvl) ? '⌃' : '⌄'}
                    </Txt>
                  </View>
                  <View className="mb-1 mt-2">
                    <ProgressBar progress={total ? done / total : 0} color={meta.color} height={6} spring={false} />
                  </View>
                  {!isOpen(lvl) && (
                    <Txt className="mt-2 text-[11px] text-paper/40">
                      {levelUnits.length} units · tap to open
                    </Txt>
                  )}
                </Pressable>
              </Reveal>
              {isOpen(lvl) && levelUnits.map((unit, ui) => (
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
                const st = lessonState(lesson.id, store.completedLessons, store.skippedLessons, order);
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
