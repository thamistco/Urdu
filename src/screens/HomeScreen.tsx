import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Reveal } from '../components/Reveal';
import { StatChip } from '../components/Stats';
import { WordArt, Illustration, LessonIcon } from '../components/Illustration';
import { CycleMark } from '../art/icons';
import { Display, Heading, Txt, Bold, Eyebrow } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { confirmAction } from '../lib/confirm';
import { levelProgress, levelTitle } from '../lib/gamification';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Lesson, unitsForTrack, findLesson, ALL_LESSONS } from '../data/units';
import { needsPathMoveNotice } from '../lib/progress';
import { LEVEL_META, LEVEL_ORDER, type Level, glossOf } from '../data/words';
import { WORDS } from '../data/words';
import { DAILY_GOALS } from '../data/achievements';
import type { RootStackParamList } from '../navigation/types';
import { dueCount } from '../lib/srs';
import { testerFlags } from '../store/useTesterStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** How many lessons the course holds, across both tracks. Module scope: it is a
 *  constant of the build, and rebuilding a 350-entry structure on the screen
 *  URD-002 exists to make lighter is the wrong place to put it. */
const PATH_SIZE = ALL_LESSONS.length;

/** Said once, so it lives once. Also read aloud by the notice's own
 *  accessibility label, which is why it is a string rather than JSX. */
const NOTICE_BODY =
  'Short lessons were merged into fewer, longer ones, so your units hold a different number of lessons than when you were last here. Nothing you learned was lost: your streak, your level and everything the app remembers about your words are untouched.';

/**
 * URD-014: a genuinely different truth from `NOTICE_BODY` above, and said
 * with different copy on purpose. `NOTICE_BODY` can honestly promise
 * nothing was lost, because a regroup keeps a topic's first-part id. This
 * one cannot: an old update really did drop this learner's lesson
 * checkmarks (`ticksWipedByMigration` — see `lib/progress.ts`), so it says
 * so plainly and reassures only about what is actually still true.
 *
 * Says "lesson progress" rather than "finished lessons" on purpose — THE
 * CRITIC found `hadTicks` (progress.ts) correctly counts a skip-only wipe
 * (lessons pre-satisfied at onboarding, never actually attempted) as
 * something lost, but the first draft's copy described only the completed
 * case. A heritage learner who skipped lessons at onboarding and lost
 * those skips had nothing "finished" to overclaim.
 */
const TICKS_WIPED_NOTICE_TITLE = 'Your lesson progress wasn’t carried over';
const TICKS_WIPED_NOTICE_BODY =
  'An old update couldn’t carry over your lesson history, so your lesson progress was reset. Your streak, your level and everything the app remembers about your words and letters are untouched — pick back up wherever feels right.';

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
  // Tester mode opens the path so any lesson can be looked at without playing
  // thirty before it. Off by default even once unlocked, precisely so the locked
  // state a real learner meets can still be seen.
  if (testerFlags().unlockAll) return 'current';
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
    <View className="mb-6 flex-row items-center" style={{ marginStart: offset }}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}. ${lesson.subtitle}. ${
          state === 'done'
            ? 'Completed'
            : state === 'skipped'
              ? 'Skipped as already known, tap to try it anyway'
              : state === 'current'
                ? 'Start this lesson'
                : 'Locked, tap to jump ahead'
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
            <Txt style={{ fontSize: 28, color: palette.white }}>✓</Txt>
          ) : (
            <View style={{ opacity: state === 'locked' || state === 'skipped' ? 0.85 : 1 }}>
              <LessonIcon kind={lesson.kind} topic={lesson.topic} size={34} />
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
            <Illustration name="lock" tile={false} size={11} />
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
      <View className="ms-4 flex-1">
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

  // Recomputed from `store.srs` rather than called as an action, so the card
  // appears and clears as answers land instead of only on a remount.
  const dueNow = useMemo(() => dueCount(store.srs), [store.srs]);

  const { level, ratio } = levelProgress(store.totalXp);
  const goal = DAILY_GOALS.find((g) => g.id === store.dailyGoalId) ?? DAILY_GOALS[1];
  const dailyRatio = Math.min(1, store.todayXp / goal.xp);
  const word = WORDS[new Date().getDate() % WORDS.length];

  // The path as this learner's track sees it: someone who chose Roman is not
  // shown — or blocked by — the thirteen lessons of alphabet.
  const units = useMemo(() => unitsForTrack(track), [track]);
  /**
   * Measured against the whole path rather than this learner's track. On the
   * Roman track `units` drops the thirteen alphabet lessons, so a track switch
   * would otherwise register as the course changing size underneath them.
   */
  /**
   * URD-014, THE CRITIC's MAJOR: two dismiss-once alert cards can otherwise
   * stack on Home. A wiped profile's first render always has empty
   * `completed`/`skipped`, so `needsPathMoveNotice` itself starts false —
   * but if the learner leaves the ticks-wiped notice up, does a few lessons,
   * and the path regroups again before they dismiss it, `needsPathMoveNotice`
   * turns true while `ticksWipedByMigration` is still true too.
   *
   * Kept as two names on purpose, not one gated boolean. `rawPathNotice` is
   * what the path-moved notice is actually true of, independent of whether
   * anything else is currently showing; `pathNotice` is what gets rendered
   * — the two notices queued strictly one at a time. The `notePathSize`
   * effect just below has to read `rawPathNotice`, not `pathNotice`: an
   * earlier version of this fix read the gated value there too, and it
   * silently re-recorded `pathSize` to the current path the moment the
   * wipe notice appeared — "nothing is owed" was true only because the
   * gate said so, not because the path genuinely matched — which erased
   * the path-moved notice's own evidence before the learner ever saw it,
   * the identical shape of silent loss this whole item exists to close,
   * one layer up. Caught by testing the sequence live, not by reading the
   * code: dismissing the wipe notice never revealed a path-moved notice
   * that a stale `pathSize` should have produced.
   */
  const rawPathNotice = needsPathMoveNotice({
    completed: store.completedLessons,
    skipped: store.skippedLessons,
    pathSize: PATH_SIZE,
    seen: store.pathNoticeSeen,
    lastPathSize: store.pathSize,
  });
  const pathNotice = !store.ticksWipedByMigration && rawPathNotice;

  /**
   * URD-015: dismissing a notice used to remove its whole card — 275px on
   * this one — in the same instant as the tap that dismissed it, so a
   * finger still settling from that tap could land on whatever had already
   * snapped into its place. `showX` stays true for as long as `<Reveal>`'s
   * exit fade is still running, even after the store flag that first
   * showed the card has gone false; only `onExited` (fired once the fade
   * genuinely finishes) is allowed to stop rendering it. The effects only
   * ever set these true, never false — going false is `onExited`'s job
   * alone, so a card can't be yanked from under its own exit animation by
   * some unrelated re-render.
   */
  const [showTicksWiped, setShowTicksWiped] = useState(store.ticksWipedByMigration);
  useEffect(() => {
    if (store.ticksWipedByMigration) setShowTicksWiped(true);
  }, [store.ticksWipedByMigration]);
  const [showPathNotice, setShowPathNotice] = useState(pathNotice);
  useEffect(() => {
    if (pathNotice) setShowPathNotice(true);
  }, [pathNotice]);

  /**
   * A learner who is owed nothing has still *seen* this path, and needs to be
   * recorded as having seen it — otherwise the next regroup cannot tell them
   * apart from someone who was last here two paths ago. Runs on the launches
   * where nothing is shown; the dismissal records it on the launches where
   * something is.
   *
   * Reads `rawPathNotice`, not `pathNotice` — see the comment above.
   */
  const notePathSize = useProgressStore((s) => s.notePathSize);
  useEffect(() => {
    if (!rawPathNotice && store.pathSize !== PATH_SIZE) notePathSize(PATH_SIZE);
  }, [rawPathNotice, store.pathSize, notePathSize]);
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

  /**
   * Land on the lesson you are actually up to.
   *
   * The path is 233 lessons. Onboarding can now skip a learner a long way down
   * it — a heritage speaker who places well starts past the whole Beginner
   * stage — and until this, that learner opened the app at lesson one of
   * thirty-six with no indication that the answer to "where do I start?" was
   * two screens further down. The skip was real but invisible, which reads as
   * the questionnaire having done nothing.
   *
   * Fires once per mount, and only when the current lesson is far enough down
   * to be off-screen; scrolling the app out from under someone who is already
   * looking at the right thing is worse than not scrolling at all.
   *
   * And not at all while the path-moved notice is up. Review measured this
   * landing the learner between 646 and 4,597 pixels below a notice that sits at
   * the top of this same ScrollView — rendered on every launch, scrolled past on
   * every launch, and dismissed on tap rather than on render, so never dismissed
   * either. The notice is the one thing on the screen that has to be read before
   * anything else makes sense; the scroll runs when it is gone.
   *
   * URD-014's ticks-wiped notice sits above this same ScrollView the same way,
   * and needs the identical guard — THE CRITIC caught this reviewing that item:
   * `pathNotice` alone let the wipe notice get auto-scrolled past within ~1.5s
   * for exactly the population it exists for (a wiped profile always starts at
   * the very first lesson, which combined with the header and the notice card
   * itself reliably clears the 420px threshold below). Gated on both now, not
   * just the older of the two.
   *
   * URD-015: gated on `showTicksWiped`/`showPathNotice` — whether either card
   * is still rendering at all — rather than the raw store flags. A dismissed
   * notice keeps rendering, fading in place, for the whole of its exit (see
   * `Reveal.tsx`); the raw flags go false the instant the tap lands, before
   * that fade even starts. Scrolling while a card is still visibly there,
   * mid-fade, is exactly the same "not while the notice is up" case the
   * comment above already argues for.
   */
  const pathRef = useRef<ScrollView>(null);
  const currentNode = useRef<View>(null);
  const didAutoScroll = useRef(false);
  // URD-032: the height of everything above the accordion (header, level
  // card, continue card, today's-word card, jump-ahead hint) — see
  // `toggleLevel` below for what this is for. Captured via `onLayout`
  // rather than measured fresh at toggle time deliberately: this region's
  // height never changes when a stage collapses or expands, so one
  // measurement (updated whenever this content's own height legitimately
  // changes, e.g. the jump-ahead hint disappearing on course completion)
  // stays valid across every toggle, sidestepping both failure modes the
  // comment on `toggleLevel` documents for measuring anything *inside* the
  // accordion at toggle time.
  const fixedHeaderHeight = useRef(0);

  // The course is long. Only one course stage is expanded at a time — the
  // others collapse to a progress line you can open when you want to look
  // ahead. Accordion, not independent toggles: each stage's lessons only
  // mount while its stage is the open one, so opening a second stage closes
  // whichever was open rather than adding to it. Independent per-level
  // toggles used to let a learner reach every stage open at once — 348
  // mounted lesson rows at the time this was found (now 350, URD-A02's
  // lesson-shape split having added two units' worth since), the exact
  // thing this screen exists to avoid — by
  // nothing more than curious tapping; `check:path` only exercises the
  // default state, so this is enforced by there being no way to reach that
  // state at all, not by a check that would merely notice it.
  //
  // `undefined` means "never touched" (falls back to the learner's current
  // stage); `'none'` is a real, distinct state — tapping the open stage
  // collapses it, and that is not the same as never having touched anything.
  const [openLevel, setOpenLevel] = useState<Level | 'none' | undefined>(undefined);
  const effectiveOpenLevel = openLevel === undefined ? currentLevel : openLevel === 'none' ? null : openLevel;
  const isOpen = (lvl: Level) => effectiveOpenLevel === lvl;

  // Once a learner explicitly opens a stage, it stays open (or explicitly
  // closed) rather than following `currentLevel` — but only until real
  // progress moves `currentLevel` itself, not for the rest of the session.
  // THE CRITIC reviewing this accordion found the pin was otherwise
  // permanent: `HomeScreen` never remounts between lessons (it sits under a
  // tab navigator beneath the lesson screen), so a single curious tap on
  // any header — not just a mistouch of the one that would later become
  // current — silently stopped this screen from opening the learner's
  // actual current stage as they advanced, and stopped the mount-time
  // auto-scroll below from ever firing again (it needs the current lesson's
  // row mounted, which requires its stage to be the open one).
  //
  // URD-032: re-opening the right stage here was only half the fix — THE
  // CRITIC found, reviewing this same accordion again, that nothing then
  // scrolled to reveal it. `didAutoScroll` below is a one-shot-per-mount
  // guard, and this screen genuinely never remounts between lessons, so
  // once it had fired once (on the very first Home visit of the session)
  // it stayed fired forever, regardless of how many times `currentLevel`
  // legitimately advanced afterward. A learner who finishes their stage's
  // last lesson while scrolled away from it got the newly-current stage
  // opened, correctly, with no scroll to show them it happened. Resetting
  // the guard here — the one place that already knows `currentLevel` just
  // changed for a real reason, not a remount — re-arms it for exactly that
  // case, without turning it into an unconditional "scroll on every render"
  // that would fight a learner who is deliberately looking elsewhere.
  //
  // THE CRITIC, reviewing that fix, found this effect has to run — and land
  // its `didAutoScroll.current = false` reset — *before* the auto-scroll
  // effect below reads that same ref, in the same commit, or the reset
  // arrives one render too late to matter: a real mid-session stage advance
  // changes `currentId` and `currentLevel` together, and React runs a
  // component's effects in hook-declaration order within one commit, so
  // whichever of these two effects is declared first sees the ref as it was
  // *before* the other one touches it. Declared after (as this was
  // originally written), the auto-scroll effect ran first, read the guard
  // as still `true` from its earlier mount-time fire, and bailed before this
  // effect ever got to reset it — silently reproducing the exact bug this
  // was meant to close, confirmed live by reordering the two effects, one
  // way, then the other, and tracing which one saw the stale value.
  // Declaring it here, ahead of the auto-scroll effect, is the fix: the
  // reset lands in the same commit but earlier in hook order, so the
  // auto-scroll effect below always sees the just-reset guard, not the
  // stale one.
  useEffect(() => {
    setOpenLevel(undefined);
    didAutoScroll.current = false;
  }, [currentLevel]);

  useEffect(() => {
    if (didAutoScroll.current || showPathNotice || showTicksWiped) return;
    const t = setTimeout(() => {
      // `measure` reports pageY — position on screen. The list has not been
      // scrolled yet at this point, so pageY is also the content offset we
      // want. Accumulating nested onLayout values instead would mean summing
      // three levels of parent-relative coordinates, which silently goes wrong
      // the first time the tree gains a wrapper.
      currentNode.current?.measure((_x, _y, _w, _h, _px, pageY) => {
        if (typeof pageY === 'number' && pageY > 420) {
          didAutoScroll.current = true;
          pathRef.current?.scrollTo({ y: pageY - 200, animated: true });
        }
      });
    }, 500);
    return () => clearTimeout(t);
  }, [currentId, showPathNotice, showTicksWiped]);

  /**
   * Opening a stage below the fold used to leave the scroll position exactly
   * where it was: DESIGN CRITIC reviewing this accordion found that when the
   * stage that closes is tall (a beginner stage open is roughly 8,000px) and
   * the one that opens is a similar height, the same raw offset that used to
   * point at the next stage's collapsed one-line summary lands deep inside
   * that stage's now-open lesson list instead — a screenful of anonymous
   * lesson rows with no header in sight, on the single most natural next
   * action from the default screen (scroll past stage one, open stage two).
   *
   * Landing on the newly-open stage's own header exactly was tried two
   * ways and both measured wrong against the real react-native-web build:
   * `measureLayout` against the ScrollView returned 0 regardless of the
   * header's real position, and tracking scroll offset via `onScroll` plus
   * a fresh `measure()` raced a real browser behavior — when a stage this
   * tall collapses, the browser clamps the current `scrollTop` down to the
   * new, much smaller scrollable range *synchronously*, ahead of the
   * throttled `onScroll` event that would have reported it, so the tracked
   * offset was stale at exactly the moment that mattered. Both looked
   * correct reading the code; both were wrong measured live.
   *
   * Landing at the top of the screen needed no measurement at all, so it
   * couldn't go stale the same way: whatever the browser does to the scroll
   * position when a stage collapses, resetting to `y: 0` is always a valid
   * position (the app's own header and "today's word" card, never empty,
   * never mid-list), and confirmed by the exact defect DESIGN CRITIC filed —
   * "no header in sight" — is definitionally impossible at the top of the
   * page. That was the trade chosen once the precise, in-accordion version
   * couldn't be made to work — but it costs a bigger jump (~8,000px) than
   * scrolling directly to the new stage would.
   *
   * URD-032: DESIGN CRITIC measured the actual cost of that trade — ~500px
   * of return scroll to get back past the fixed cards above the accordion,
   * against the ~8,000px the bug being fixed would have cost — and found a
   * middle ground neither failed approach above ruled out: `fixedHeaderHeight`
   * (captured once via `onLayout`, not measured fresh at toggle time) is the
   * height of everything ABOVE the accordion — content that never changes
   * size when a stage inside the accordion collapses or expands. Landing
   * there instead of `y: 0` still needs no fresh measurement at toggle time
   * (so it can't go stale the way the two failed approaches did — nothing
   * about it depends on which stage just collapsed or how tall it was), and
   * it is still always a valid, labeled, non-empty position (the accordion's
   * own collapsed stage list starts right there) — it just skips the fixed
   * cards this same toggle doesn't need to re-show, roughly halving the
   * return scroll.
   *
   * DESIGN CRITIC, measuring this landing frame by frame, found the scroll
   * calling `scrollTo` in the same tick as `setOpenLevel` produced two
   * disconnected motions rather than one: the state update's own reflow
   * (the previously-open stage collapsing) triggers the browser's
   * synchronous scrollTop clamp — the same real behavior that made the
   * `onScroll`-tracked-offset approach above read stale — *before* the
   * requested animated scroll has moved more than a few px, so ~99% of the
   * distance happened as an instant, unanimated jump, with only the last
   * couple hundred px actually easing in. Deferring the `scrollTo` call
   * into an effect that fires after `openLevel` (and its collapse) has
   * committed lets the clamp happen first, invisibly, off whatever the
   * animation would have shown; the effect's own `scrollTo` then glides
   * smoothly from wherever the clamp actually landed to
   * `fixedHeaderHeight.current` — one continuous, comprehensible motion
   * instead of a jump followed by a corrective wobble. `pendingScrollOpen`
   * carries no measurement (unlike the two failed approaches) — it is
   * only a "was this call an open" flag, so it cannot go stale the way a
   * captured height or offset could.
   */
  const pendingScrollOpen = useRef(false);

  const toggleLevel = (lvl: Level) => {
    feedback.tap();
    pendingScrollOpen.current = !isOpen(lvl);
    setOpenLevel(isOpen(lvl) ? 'none' : lvl);
  };

  useEffect(() => {
    if (!pendingScrollOpen.current) return;
    pendingScrollOpen.current = false;
    const id = requestAnimationFrame(() => {
      pathRef.current?.scrollTo({ y: fixedHeaderHeight.current, animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [openLevel]);

  const openLesson = (lesson: Lesson, _state: string) => {
    // Any lesson can be started — locked ones are "jump ahead". Even with 0
    // hearts you can begin; the lesson player handles running out mid-session.
    nav.navigate('Lesson', { lessonId: lesson.id });
  };

  return (
    <View className="flex-1 bg-ink">
      <Screen scrollRef={pathRef}>
        {/* everything above the accordion — see `fixedHeaderHeight` above */}
        <View
          collapsable={false}
          onLayout={(e) => {
            fixedHeaderHeight.current = e.nativeEvent.layout.height;
          }}
        >
          {/* header */}
          <Reveal>
            <SafeAreaView edges={['top']}>
              <View className="mb-4 flex-row items-start justify-between">
                <View className="flex-1 pe-3">
                  <Eyebrow style={{ color: palette.gold }}>Harf · حرف</Eyebrow>
                  <Display className="mt-1 text-3xl leading-9">{GREETING[store.goal ?? 'curious']}</Display>
                </View>
                <View className="flex-row items-center gap-2">
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
                  {/* TEMPORARY, and asked for knowingly: a one-tap way to walk
                    the course from the first lesson again while testing.
                    Delete this Pressable to remove it — nothing else depends
                    on it, and the same thing lives permanently in Settings →
                    Data, and behind the passphrase in Settings → Tester.

                    It is on the home screen, so it is on every learner's
                    home screen; the confirm dialog is the only thing between
                    a mis-tap and a wiped streak. That is the whole cost, and
                    it is the reason this comment says remove it. The dialog
                    now says plainly that this is a testing button, so nobody
                    reaches the confirm step thinking it is a feature. */}
                  <Pressable
                    onPress={() => {
                      feedback.tap();
                      confirmAction(
                        'Start the course over?',
                        'A testing button: clears progress, streak, XP and memory on this device so the path can be walked from the first lesson again. There is no way to get them back.',
                        'Reset',
                        () => {
                          store.resetAll();
                          feedback.incorrect();
                        }
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Reset progress and start the course over (for testing)"
                    hitSlop={6}
                  >
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full border"
                      style={{
                        borderColor: withAlpha(palette.rose, 0.4),
                        backgroundColor: withAlpha(palette.rose, 0.12),
                      }}
                    >
                      <CycleMark size={16} color={palette.roseLight} />
                    </View>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </Reveal>

          {/* URD-014: the learner who lost the most, told the least.
            An old profile's lesson-id migration empties completedLessons and
            skippedLessons, because a positional id from before the path was
            content-keyed genuinely cannot be translated. That is correct —
            but it also deletes the only evidence `needsPathMoveNotice` reads,
            so the notice below it never fires for exactly this learner. This
            card is that second, separate truth, with its own honest copy:
            unlike a regroup, something really was dropped here. */}
          {showTicksWiped && (
            <Reveal delay={20} visible={store.ticksWipedByMigration} onExited={() => setShowTicksWiped(false)}>
              <Card
                className="mb-4"
                accent={palette.gold}
                accessibilityRole="alert"
                accessibilityLabel={`${TICKS_WIPED_NOTICE_TITLE}. ${TICKS_WIPED_NOTICE_BODY}`}
              >
                <Bold className="text-base">{TICKS_WIPED_NOTICE_TITLE}</Bold>
                <Txt className="mt-2 text-sm leading-6 text-paper/75">{TICKS_WIPED_NOTICE_BODY}</Txt>
                <View className="mt-3 flex-row">
                  <Button
                    variant="ghost"
                    onPress={() => {
                      feedback.tap();
                      store.dismissTicksWipedNotice();
                    }}
                  >
                    Got it
                  </Button>
                </View>
              </Card>
            </Reveal>
          )}

          {/* Why the unit counts moved.
            The path has been rebuilt underneath people twice and will move
            again: once splitting each topic across enough lessons to cover its
            vocabulary, once regrouping those into sittings. What a returning
            learner sees is not a lost tick, because a topic's first part keeps
            its id, but a unit that read 55 of 55 now reading 55 of 81. That is
            indistinguishable from lost progress from the inside, and lost
            progress is the thing most likely to make somebody stop opening it.

            Two sentences, at body size rather than caption size, and no numbers.
            The first draft was four sentences of 12px fine print carrying the
            only message in the app a learner has to actually read, and its
            concrete count was true only of the minority whose lesson ids died —
            rendering "1 of the 1 you had finished are now part of other
            lessons" for the commonest returning profile there is.

            It also does not say which way the percentages went. The first draft
            said they start lower; measured across every profile that triggers
            this, they are the same or higher in 466 of 604 cases and unchanged
            in the overwhelming majority of units. A reassurance the learner can
            disprove by looking at the screen behind it is worse than silence.

            `dismissPathNotice` is what makes it once, and it fires on the tap
            rather than on the render, so a notice drawn and never read is still
            owed. It records the path size with the flag, so the next regroup
            re-arms this without anyone bumping the persist version. */}
          {showPathNotice && (
            <Reveal delay={30} visible={pathNotice} onExited={() => setShowPathNotice(false)}>
              <Card
                className="mb-4"
                accent={palette.gold}
                accessibilityRole="alert"
                accessibilityLabel={`Lessons were regrouped. ${NOTICE_BODY}`}
              >
                <Bold className="text-base">Lessons were regrouped</Bold>
                <Txt className="mt-2 text-sm leading-6 text-paper/75">{NOTICE_BODY}</Txt>
                <View className="mt-3 flex-row">
                  <Button
                    variant="ghost"
                    onPress={() => {
                      feedback.tap();
                      store.dismissPathNotice(PATH_SIZE);
                    }}
                  >
                    Got it
                  </Button>
                </View>
              </Card>
            </Reveal>
          )}

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
                <Txt className="text-[11px] text-paper/55">
                  {dailyRatio >= 1 ? 'Goal met ✓' : `${Math.round(dailyRatio * 100)}%`}
                </Txt>
              </View>
            </Card>
          </Reveal>

          {/* Whatever the schedule says is slipping.
            The spaced-repetition engine has always been running — every answer
            updates a memory record, and review lessons draw from what is due —
            but nothing outside the Practice tab ever said so, so the one number
            that should decide how a session starts was invisible on the screen
            the learner lands on. Shown only when something is actually due;
            an empty queue is not worth a card. */}
          {dueNow > 0 && (
            <Reveal delay={75}>
              <Pressable
                onPress={() => {
                  feedback.tap();
                  nav.navigate('Lesson', { lessonId: 'practice-review' });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Review ${dueNow} ${dueNow === 1 ? 'item' : 'items'} due now`}
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
              >
                <View
                  className="mb-4 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor: withAlpha(palette.jade, 0.14),
                    borderColor: withAlpha(palette.jade, 0.42),
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: withAlpha(palette.jade, 0.22) }}
                  >
                    <Illustration name="clock" tile={false} size={22} />
                  </View>
                  <View className="flex-1">
                    <Eyebrow style={{ color: palette.jade }}>Due for review</Eyebrow>
                    <Bold className="mt-0.5 text-[15px]">
                      {dueNow} {dueNow === 1 ? 'thing' : 'things'} to bring back
                    </Bold>
                    <Txt className="text-xs text-paper/55">Reviewed now, they stick; left much longer, they go.</Txt>
                  </View>
                  <Txt style={{ color: palette.jade, fontSize: 20 }}>›</Txt>
                </View>
              </Pressable>
            </Reveal>
          )}

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
                    {finished ? (
                      <Illustration name="medal" tile={false} size={26} />
                    ) : (
                      <LessonIcon kind={currentLesson.kind} topic={currentLesson.topic} size={26} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Eyebrow style={{ color: palette.gold }}>
                      {finished
                        ? `All ${order.length} lessons done`
                        : store.completedLessons[order[0]] || store.skippedLessons[order[0]]
                          ? 'Continue'
                          : 'Start here'}
                    </Eyebrow>
                    <Bold className="mt-0.5 text-[15px]">{finished ? 'Keep it warm' : currentLesson.title}</Bold>
                    <Txt className="text-xs text-paper/55">
                      {finished
                        ? "You've made it through the whole course. Daily review keeps it fresh."
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
                  Today’s word
                </Eyebrow>
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1">
                    <Lexeme
                      urdu={word.urdu}
                      roman={word.roman}
                      track={track}
                      size={28}
                      color={palette.ink}
                      align="left"
                    />
                    <Txt style={{ color: palette.ink }} className="text-xs opacity-60">
                      {glossOf(word)}
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
                  Tap any lesson to jump ahead. Locked ones unlock as you pass them.
                </Txt>
              </View>
            </Reveal>
          )}
        </View>

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
                      style={{
                        backgroundColor: withAlpha(meta.color, 0.18),
                        borderWidth: 1,
                        borderColor: withAlpha(meta.color, 0.4),
                      }}
                    >
                      <Bold style={{ color: meta.color }} className="text-xs">
                        {meta.tag}
                      </Bold>
                    </View>
                    <View className="flex-1">
                      <Heading className="text-lg">{meta.title}</Heading>
                      <Txt className="text-xs text-paper/55">
                        {(track === 'roman' && meta.romanBlurb) || meta.blurb}
                      </Txt>
                    </View>
                    <Txt className="text-[11px] text-paper/55">
                      {done}/{total}
                    </Txt>
                    <Txt style={{ color: withAlpha(palette.cream, 0.5), fontSize: 15 }}>{isOpen(lvl) ? '⌃' : '⌄'}</Txt>
                  </View>
                  <View className="mb-1 mt-2">
                    <ProgressBar progress={total ? done / total : 0} color={meta.color} height={6} spring={false} />
                  </View>
                  {!isOpen(lvl) && (
                    <Txt className="mt-2 text-[11px] text-paper/55">{levelUnits.length} units · tap to open</Txt>
                  )}
                </Pressable>
              </Reveal>
              {isOpen(lvl) &&
                levelUnits.map((unit, ui) => (
                  <Reveal key={unit.id} delay={Math.min(120 + ui * 30, 300)}>
                    <View className="mb-2 mt-4 flex-row items-center gap-3">
                      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: unit.color }} />
                      <View className="flex-1">
                        <Eyebrow style={{ color: unit.color }}>{unit.title}</Eyebrow>
                        <Txt className="text-xs text-paper/55">{unit.subtitle}</Txt>
                      </View>
                    </View>
                    <View className="mt-3 ps-2">
                      {unit.lessons.map((lesson, li) => {
                        const st = lessonState(lesson.id, store.completedLessons, store.skippedLessons, order);
                        const offset = [0, 28, 44, 28][li % 4];
                        const node = (
                          <LessonNode
                            key={lesson.id}
                            lesson={lesson}
                            color={unit.color}
                            state={st}
                            offset={offset}
                            onPress={() => openLesson(lesson, st)}
                          />
                        );
                        if (lesson.id !== currentId) return node;
                        return (
                          <View key={lesson.id} ref={currentNode} collapsable={false}>
                            {node}
                          </View>
                        );
                      })}
                    </View>
                  </Reveal>
                ))}
            </View>
          );
        })}

        <Txt className="mb-4 mt-6 text-center text-xs leading-5 text-paper/55">
          Every letter has four faces. Most apps teach one.
        </Txt>
      </Screen>
    </View>
  );
}
