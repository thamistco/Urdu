import { reach } from '../lib/reach';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Screen, CONTENT_MAX_WIDTH } from '../components/Screen';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Hearts } from '../components/Stats';
import { Txt, Bold, Heading, Eyebrow } from '../components/Text';
import { Lexeme } from '../components/Lexeme';
import { Illustration } from '../components/Illustration';
import { SpeakerButton, SPOKEN_ONLY } from '../exercises/common';
import { palette, withAlpha } from '../theme';
import { feedback } from '../lib/feedback';
import { announce, invalidateSpeech } from '../lib/speech';
import { cardsOnTrack, dueQueue, dueBudget, type SrsGrade } from '../lib/srs';
import { srsGradeFor } from '../lib/sessionGrading';
import { unitEvidenceFrom } from '../lib/unitSkip';
import { useSessionGradeFlush } from './useSessionGradeFlush';
import { answerReveal, spokenVerdict } from './answerReveal';
import { useBannerFocus } from './useBannerFocus';
import { useStepFocus, STEP_COUNTER_ID } from './useStepFocus';
import { REFILL_COST, gemsShortOfRefill, minutesUntilNextHeart } from '../lib/gamification';
import { useProgressStore, type ItemType } from '../store/useProgressStore';
import { heartsAreFree, heartsFreeFor } from '../lib/hearts';
import { useSettingsStore } from '../store/useSettingsStore';
import { resolveLesson, type Lesson } from '../data/units';
import { ExerciseView } from '../exercises';
import { buildLessonExercises, isWovenReview, reaskExercises, type Miss } from '../exercises/generator';
import type { Exercise, GradedResult } from '../exercises/types';
import type { FinishResult } from '../store/useProgressStore';
import { LessonComplete } from './LessonComplete';
import type { RootStackParamList } from '../navigation/types';
import { confirmAction } from '../lib/confirm';
import { dayKey } from '../lib/date';
import { restoreSnapshot, takeSnapshot } from '../lib/lessonResume';
import { onLeavingPage } from '../lib/leavingPage';
import { plainRoman } from '../lib/roman';
import { useMoreBelow, MoreBelowCue } from '../components/MoreBelow';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'Lesson'>;

/** Space under each exercise, which "More below" does not count as more. */
const BODY_PAD_BOTTOM = 32;

/** A lesson that can be left and picked up again: anything but practice (Q-038). */
const resumable = (lessonId: string) => !lessonId.startsWith('practice-');

/** Teaching cards are informational — no hearts, no pass/fail styling. */
function isTeaching(ex: Exercise | undefined): boolean {
  return ex?.kind === 'grammarTeach' || ex?.kind === 'wordTeach' || ex?.kind === 'letterTeach';
}

/**
 * Said, and shown under "Once more", when the re-asks start: the lesson is
 * already saved, and nothing here counts. Without it the last question said
 * Continue, the bar ran back to empty and ✕ still looked like losing the
 * lesson (P-085 second check, 2026-10-24).
 */
const REASK_SAVED = 'Lesson saved. These don’t count; close any time for your results.';

/**
 * The first question ever asked about a word, where guessing is the point.
 *
 * Guessing before being told is worth more than being told outright — four
 * experiments on this exact format measured it — but only when feedback
 * follows, and the research never charges for a wrong guess. This app did:
 * a learner lost a heart for failing a question about a word it had not yet
 * shown them, which is the single thing a beginner complained about most.
 *
 * So these still grade, still count as a sighting, and still show the answer.
 * They just cost nothing, and the card that follows says what the word was.
 */
function isPretest(ex: Exercise | undefined): boolean {
  return (
    (ex?.kind === 'multipleChoice' || ex?.kind === 'meaningPick' || ex?.kind === 'listenTap') && ex.pretest === true
  );
}

/**
 * A trace costs no heart.
 *
 * It is the one exercise graded on the hand rather than on knowing, and on a
 * mouse or trackpad the coverage check needs four to seven overlapping drags
 * per letter: QA testers failed looped letters like ع and ط on every attempt,
 * and with hearts charged that made letter lessons unplayable on a desktop
 * (QA report, 2026-10-12). A failed trace still schedules the letter again.
 */
function isTrace(ex: Exercise | undefined): boolean {
  return ex?.kind === 'letterTrace';
}

/** A listening card on a word this lesson has only met as a guess so far. */
function isFirstListen(ex: Exercise | undefined, pretested: Set<string>): boolean {
  if (ex?.kind !== 'listenTap' || ex.pretest || !pretested.has(ex.word.id)) return false;
  pretested.delete(ex.word.id); // the first one only
  return true;
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

/**
 * What this exercise can say out loud, if anything.
 *
 * Mirrors `answerReveal` (`./answerReveal.ts`), which describes the same
 * exercises in text. A
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
    case 'letterContrast':
      return { id: ex.letter.id, urdu: ex.letter.forms.isolated, roman: ex.letter.name };
    case 'multipleChoice':
    case 'meaningPick':
    case 'listenTap':
    case 'wordBuild':
    case 'wordFromMeaning':
    case 'typeWord':
    case 'letterSpot':
      return { id: ex.word.id, urdu: ex.word.urdu, roman: ex.word.roman };
    default:
      return null;
  }
}

/**
 * The route, and what to show when its lesson id names nothing.
 *
 * /lesson/does-not-exist went straight into the session with an undefined
 * lesson, and the first `lesson.kind` threw: a blank page on an onboarded
 * profile (QA, 2026-10-13, H11). A typo in a shared link, or a lesson renamed
 * since the link was made, now gets a sentence and a way home.
 */
export function LessonScreen() {
  const route = useRoute<Rt>();
  const id = route.params?.lessonId;
  // Resolved once per id: see the note in LessonSession on why identity matters.
  const lesson = useMemo(() => (id ? resolveLesson(id) : undefined), [id]);
  if (!lesson) return <LessonNotFound />;
  return <LessonSession lesson={lesson} />;
}

function LessonNotFound() {
  const nav = useNavigation<Nav>();
  return (
    <Screen fill>
      <SafeAreaView className="flex-grow">
        <View className="flex-grow items-center justify-center px-2">
          <Heading className="mb-2 text-center text-2xl">That lesson isn’t here</Heading>
          <Txt className="mb-8 max-w-[300px] text-center text-sm text-paper/60">
            The link may have a typo, or the lesson may have moved. Everything you have learned is still saved.
          </Txt>
          <View className="w-full">
            <Button onPress={() => nav.reset({ index: 0, routes: [{ name: 'Main' }] })}>Go to your lessons</Button>
          </View>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

function LessonSession({ lesson }: { lesson: Lesson }) {
  const nav = useNavigation<Nav>();
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
  // A unit review and the Daily Review both resolve to this kind. The header
  // says so, because otherwise a review looked exactly like a lesson and a
  // learner met old material with nothing saying why.
  const isReview = lesson.kind === 'review';

  const showRoman = useSettingsStore((s) => s.showRoman);
  const track = useSettingsStore((s) => s.track);
  const setTrack = useSettingsStore((s) => s.setTrack);
  /**
   * Where this lesson was left, if it was left partway (Q-038): the same
   * questions, the step after the last one answered, and the lesson's own
   * tallies, so leaving at step 30 of 49 no longer meant starting from the
   * first card. Practice is short and built from what is due today, so it
   * always starts afresh.
   */
  const resumed = useMemo(() => {
    if (!resumable(lesson.id)) return null;
    const held = useProgressStore
      .getState()
      .lessonsInProgress.find((l) => l.lessonId === lesson.id && l.track === track);
    return restoreSnapshot(held, lesson.id, track, dayKey());
  }, [lesson.id, track]);
  // Under 300px (a 360px phone at 200% text) the header wraps, so the hearts
  // badge takes a line of its own rather than being squeezed to "F…" (QA,
  // 2026-10-13).
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const narrowHeader = windowWidth < 300;
  // How far down the screen the exercise body starts: the header, and a
  // review's eyebrow when there is one.
  const [aboveBody, setAboveBody] = useState(0);
  const gradeItem = useProgressStore((s) => s.gradeItem);
  // `flushSessionGrades` (`lib/sessionGrading.ts`) keeps its item type as a
  // loose `string`, like the rest of `lib/`, rather than depending on
  // `ItemType` (`useProgressStore.ts`). Every id it ever holds came from
  // `recordSighting`, called only with `ItemRef`s (`exercises/types.ts`)
  // whose `type` is already `'letter' | 'word'` — the same union `ItemType`
  // is — so this cast reflects a real invariant, not a papered-over one.
  const applyGrade = useCallback(
    (id: string, type: string, grade: SrsGrade) => gradeItem(id, type as ItemType, grade),
    [gradeItem]
  );
  /**
   * Items this lesson has already taken a heart for: a heart for not knowing
   * the thing, not for the lesson asking twice.
   *
   * A vocabulary lesson climbs — meet the word, recall it, then produce it —
   * so one word it has not taught yet cost two or three hearts before the
   * lesson was over. That is the repetition working as designed, charged to
   * the learner as though it were three separate failures.
   *
   * Measured over a beginner walking all 350 lessons: 12.9 wrong answers per
   * lesson but only 6.5 *distinct* items wrong, or 1.99 hearts per item
   * missed. With five hearts that is 2.6 walls in every lesson — and the wall
   * is meant to be a choice between waiting and paying. It was neither: a
   * lesson paid 5 gems and a refill cost 40 then, so a learner earning their
   * way out needed eight clean lessons to buy back one wall they hit twice in
   * the lesson they were standing in.
   *
   * Charging once per item takes those to 6.5 and 1.3. The mechanic is
   * untouched for a learner who genuinely does not know five different things;
   * what goes is the multiplier the climb was adding on top.
   *
   * Keyed on the item, so an exercise covering several — a matching board —
   * only spares the ones already paid for.
   */
  const chargedRef = useRef<Set<string>>(new Set());
  /** Per item: right on every sighting this lesson, first time. See `lessonsToSkip`. */
  const firstTryRef = useRef<Map<string, boolean>>(new Map());
  /**
   * P-085: each item still wrong at its last showing, by item, with the
   * exercise it was missed on; asked once more after the lesson is saved.
   */
  const missRef = useRef<Map<string, Miss>>(new Map());
  /**
   * Steps passed over with "Can't trace now" (P-122). Left out of the score:
   * counted as wrong, a learner who cannot trace could never pass 74% on l-1
   * or earn its perfect bonus (second check, 2026-10-26).
   */
  const skippedRef = useRef(0);
  const [skippedCount, setSkippedCount] = useState(() => resumed?.skipped ?? 0);
  /** The planned re-asks, read by `advance` in the same tap that planned them. */
  const reaskRef = useRef<Exercise[]>([]);
  const loseHeart = useProgressStore((s) => s.loseHeart);
  const finishLesson = useProgressStore((s) => s.finishLesson);
  const refillHearts = useProgressStore((s) => s.refillHearts);
  const hearts = useProgressStore((s) => s.hearts);
  const gems = useProgressStore((s) => s.gems);
  const heartsUpdatedAt = useProgressStore((s) => s.heartsUpdatedAt);
  const heartsFree = useProgressStore((s) => heartsFreeFor(s.completedLessons, s.skippedLessons));
  const holdLesson = useProgressStore((s) => s.holdLesson);
  const dropLesson = useProgressStore((s) => s.dropLesson);

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
    if (resumed) return resumed.exercises;
    const srs = useProgressStore.getState().srs;
    const srsType = useProgressStore.getState().srsType;
    // How many due items to ask for is scheduling policy, not a screen
    // decision — see `dueBudget`, which is where the old flat cap of four for
    // every kind of lesson was quietly defeating spaced repetition.
    const want = dueBudget(lesson.kind, lesson.size, lesson.id);
    // Only what this track can show: capped before the generator dropped the
    // rest, a Roman learner's due letters filled every slot (cardsOnTrack).
    const due = dueQueue(cardsOnTrack(srs, srsType, track), want).map((id) => ({
      id,
      type: srsType[id] ?? ('word' as const),
    }));
    // Every id the learner has ever been graded on — see the doc comment on
    // `fallbackReviewRefs` for why a review with nothing due yet needs this
    // rather than trusting a topic's word list to mean "shown".
    const known = new Set(Object.keys(srs));
    // URD-039: how many times this exact lesson has already been completed —
    // folded into the review fallback's shuffle seed so a unit whose every
    // word the learner already knows doesn't offer the same fixed subset of
    // it on every single replay. See `buildLessonExercises`'s `visit` param.
    const visit = useProgressStore.getState().completedLessons[lesson.id]?.done ?? 0;
    return buildLessonExercises(lesson, due, track, known, visit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, track]);

  const [idx, setIdx] = useState(() => resumed?.at ?? 0);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [correctCount, setCorrectCount] = useState(() => resumed?.correct ?? 0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);
  /**
   * Out of hearts before the first question, not at the first mistake.
   *
   * At 0 hearts any lesson still opened, and the wall appeared at the first
   * wrong answer, mid-lesson (QA, 2026-10-13, C1). It now meets the learner at
   * the door, with the same refill and the same time to the next heart, so a
   * lesson is never started that cannot be finished.
   */
  const [outOfHearts, setOutOfHearts] = useState(() => {
    useProgressStore.getState().regenHearts();
    const s = useProgressStore.getState();
    return !heartsAreFree(s.completedLessons, s.skippedLessons) && s.hearts <= 0;
  });
  /**
   * Words met in this lesson's guess-first questions. A listening card on one
   * of them is the first time the learner hears it asked for, with no text on
   * screen: it costs no heart, like the guess before it (QA, M15).
   */
  const pretestedRef = useRef(new Set<string>(resumed?.pretested));
  /** Last heart gone, but the learner is still reading why. */
  const [heartsSpent, setHeartsSpent] = useState(false);
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
  // Each exercise opens at its top. The body is one scroll view for the whole
  // lesson and every answer scrolls it to the end, so the next exercise
  // opened where the last one finished: a letter card at 320x568 opened 261px
  // down, with the letter it teaches, its name and its sound above the screen
  // (design review, 2026-10-16). The answer's own scroll to the end waits
  // 120ms for the banner and then glides, so a quick Continue let it land on
  // the next exercise instead: its timer is cancelled here, and the top is
  // set again a frame later, after a glide already under way has had its
  // last say (measured: 5 to 34px left over without it, at a fast tap).
  const toEndRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Which exercise is open. An exercise asks for the end with its own timer
  // (a grammar card's next block, 120ms on), and a quick Continue let that
  // timer fire on the next exercise and glide it to its foot: g-past at
  // 320x568 opened its third step at 0px and slid to 106px within 200ms, one
  // run in five caught by check:stability as 20px. Only the exercise still
  // open may scroll the lesson.
  const openStep = `${idx}-${attempt}`;
  const openStepRef = useRef(openStep);
  useEffect(() => {
    openStepRef.current = openStep;
    clearTimeout(toEndRef.current);
    const top = () => bodyRef.current?.scrollTo({ y: 0, animated: false });
    top();
    const frame = requestAnimationFrame(top);
    return () => cancelAnimationFrame(frame);
  }, [openStep]);

  /**
   * Which items this lesson visit has sighted, and each one's most recent
   * grade — not yet applied to SRS. See `useSessionGradeFlush`'s own doc
   * comment for the ref/effect wiring this delegates to (URD-044 extracted
   * it out of this component so it could be tested without a full render),
   * and the doc comment on `recordSighting` (`lib/sessionGrading.ts`) for
   * why grading defers to the *last* sighting rather than the first
   * (URD-019).
   */
  const { record: recordItemGrade, flushNow: flushPendingGrades } = useSessionGradeFlush(exercises, applyGrade);
  // Written down when the tab is hidden or closed too, not only when the
  // screen closes: a reload never unmounts it, and a lesson picked up
  // afterwards would never grade what was answered before (Q-038, second
  // check). An item sighted again later in the visit is graded again at the
  // end; the scheduler leaves a card that is not yet due as it was.
  useEffect(() => onLeavingPage(flushPendingGrades), [flushPendingGrades]);

  /** The re-asks (P-085), planned when the last question is answered. */
  const [reask, setReask] = useState<Exercise[]>([]);
  const steps = useMemo(() => (reask.length ? [...exercises, ...reask] : exercises), [exercises, reask]);
  const current = steps[idx];
  /** Past the lesson proper: graded and saved already, so nothing here grades. */
  const inReask = idx >= exercises.length;
  /**
   * "More below" on any exercise that runs past the screen before it is
   * answered: teaching cards first (P-076), and since then questions too, since
   * at 320x568 "Which position is this letter showing?" put two of its four
   * answers, the right one among them, wholly under the fold with nothing to
   * say so (QA, 2026-10-19, Q-075).
   */
  const more = useMoreBelow(graded == null, `${idx}-${attempt}`, BODY_PAD_BOTTOM);
  // The answer, when the banner is capped and it scrolls inside it: at 200%
  // text in landscape only the card's top showed, and nothing said there was
  // more (QA, 2026-10-21, Q-082).
  const bannerScrollRef = useRef<ScrollView>(null);
  const answerMore = useMoreBelow(graded === false, `answer-${idx}-${attempt}`);
  /** The clip the feedback banner offers to replay, when there is one. */
  const replay = current ? audioOf(current) : null;
  /**
   * The answer, spelled out, and only where spelling it out is the point: a
   * wrong answer on a question that was actually being asked. A teaching card
   * has no wrong answer to reveal, and a correct one does not need telling.
   */
  /**
   * The same question, with the options in a different order, after a refill.
   *
   * Coming back from the hearts wall used to put the identical screen up:
   * same prompt, same four options, in the same order. A playtester met that
   * 62 times out of 67 and described what they were doing as elimination
   * rather than recall, which is exactly right — the answer they had just been
   * shown was still sitting in the same position they had already ruled out.
   *
   * Re-asking straight after feedback is worth doing; it is retrieval practice
   * at the moment the answer is freshest. Re-asking in the same arrangement is
   * not, because position can be remembered without the word being remembered.
   * Shuffling costs nothing and removes the shortcut.
   */
  const retried = useMemo(() => {
    if (!current || attempt === 0) return current;
    if (!('options' in current) || !Array.isArray(current.options)) return current;
    const options = [...current.options];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { ...current, options } as Exercise;
  }, [current, attempt]);

  const reveal = graded === false && current && !isTeaching(current) ? answerReveal(current) : null;
  const answered = graded != null && !!current && !isTeaching(current);
  const bannerRef = useBannerFocus(answered, idx);
  const stepBodyRef = useStepFocus(graded == null, openStep);
  const total = exercises.length;

  /**
   * A re-ask's answer: the banner and nothing else, no grade and no heart.
   * Scrolled to like any answer, since a re-ask's recall grid is the case
   * that scroll was added for (P-085 second check).
   */
  const answerReask = useCallback((correct: boolean) => {
    setGraded(correct);
    clearTimeout(toEndRef.current);
    toEndRef.current = setTimeout(() => bodyRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  /** Keeps the item if it was missed here, forgets it once it is answered right first time. */
  const noteMiss = useCallback(
    (result: GradedResult, at: number) => {
      const ex = exercises[at];
      if (result.items.length !== 1 || isPretest(ex)) return;
      const k = `${result.items[0].type}:${result.items[0].id}`;
      if (result.correct && !result.retried) missRef.current.delete(k);
      else missRef.current.set(k, { ex, at });
    },
    [exercises]
  );

  /** On the lesson's last step, what to ask once more, so its button says Continue. */
  const planReask = useCallback(
    (at: number) => {
      if (at !== exercises.length - 1 || isReview || !lesson) return;
      const known = new Set(Object.keys(useProgressStore.getState().srs));
      reaskRef.current = reaskExercises([...missRef.current.values()], lesson, track, exercises.length, known);
      setReask(reaskRef.current);
    },
    [exercises, isReview, lesson, track]
  );

  /** A step passed over ("Can't trace now"): on to the next, grading and counting nothing. */
  const skipStep = useCallback(
    (at: number) => {
      skippedRef.current += 1;
      setSkippedCount(skippedRef.current);
      planReask(at);
      advanceRef.current();
    },
    [planReask]
  );

  /**
   * A teaching card has nothing to grade, so it goes straight on.
   *
   * It used to end in three steps: "Got it", then a banner reading "Keep that
   * in mind", then "Continue" — two taps and a slide-in animation to
   * acknowledge a card that cannot be got wrong. Teaching cards are 2,362 of
   * the course's 12,061 exercises, so that was a second tap on nearly one
   * screen in five, and what it confirmed was that the learner had pressed the
   * button they had just pressed.
   *
   * The footer's rhythm is the argument for keeping it, and it is a real one —
   * but the rhythm it kept was "every screen ends in a banner", not "every
   * screen ends in a tap", and the tap is the part a thumb notices.
   *
   * The early return below still does everything the old path did apart from
   * opening the banner, so a card counts toward the session's tally exactly as
   * it did before and the "N of M" on the results screen is unchanged.
   */
  const onGraded = useCallback(
    (result: GradedResult) => {
      if (result.skipped) return skipStep(idx);
      if (idx >= exercises.length) return answerReask(result.correct);
      if (isTeaching(exercises[idx])) {
        const seen = srsGradeFor(result.correct, !!result.retried, demandOf(exercises[idx]));
        result.items.forEach((it) => recordItemGrade(it, seen));
        if (result.correct) setCorrectCount((c) => c + 1);
        planReask(idx);
        advanceRef.current();
        return;
      }
      noteMiss(result, idx);
      planReask(idx);
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
      clearTimeout(toEndRef.current);
      toEndRef.current = setTimeout(() => bodyRef.current?.scrollToEnd({ animated: true }), 120);
      // Record this sighting's grade for each item touched — overwriting
      // whatever an earlier sighting this lesson visit recorded, rather than
      // applying it to SRS immediately. See the doc comment on
      // `recordSighting` (`lib/sessionGrading.ts`) for why: only the last
      // sighting of an item in the session is graded, once, when the
      // session is done with it.
      //
      // Every answer used to be graded `good` or `again`, which left the
      // scheduler's `easy` branch dead: recalling a word from nothing but its
      // English and recognising it among four pictures pushed the next review
      // out by exactly the same amount. They are not the same evidence, so a
      // correct answer on an exercise that supplied no options counts as easy.
      const grade = srsGradeFor(result.correct, !!result.retried, demandOf(exercises[idx]));
      result.items.forEach((it) => recordItemGrade(it, grade));
      // Right first time on every sighting this lesson: the evidence a unit
      // review's pass rests on (`lessonsToSkip`).
      const firstTime = result.correct && !result.retried;
      result.items.forEach((it) =>
        firstTryRef.current.set(it.id, (firstTryRef.current.get(it.id) ?? true) && firstTime)
      );
      const answered = exercises[idx];
      const freeListen = isFirstListen(answered, pretestedRef.current);
      if (isPretest(answered) && 'word' in answered) pretestedRef.current.add(answered.word.id);
      if (result.correct) {
        setCorrectCount((c) => c + 1);
      } else if (!isTeaching(exercises[idx]) && !isPretest(exercises[idx]) && !isTrace(exercises[idx]) && !freeListen) {
        // One heart per item per lesson — see `chargedRef`.
        const already = result.items.length > 0 && result.items.every((it) => chargedRef.current.has(it.id));
        result.items.forEach((it) => chargedRef.current.add(it.id));
        if (already) return;
        loseHeart();
        if (useProgressStore.getState().hearts <= 0) {
          // Held until the learner moves on, rather than shown on a timer.
          // The wall replaces the whole screen, so a 500ms timer took the
          // reveal panel away half a second after it appeared — on the one
          // wrong answer where knowing the right answer matters most, and
          // where the learner is least inclined to be generous about it.
          setHeartsSpent(true);
        }
      }
    },
    // `idx` and `exercises` belong here because the body reads
    // `exercises[idx]`. They were missing, so the callback was built once on the
    // first render and every answer for the rest of the lesson was judged
    // against exercise 0 — which in a grammar lesson is the teaching card, and
    // `isTeaching` therefore suppressed the heart loss for every wrong answer in
    // the lesson. Grammar cost nothing to get wrong.
    [loseHeart, exercises, idx, recordItemGrade, noteMiss, planReask, answerReask, skipStep]
  );

  // Stop this lesson's audio the instant the screen is left, however that
  // happens — closing the lesson mid-word shouldn't leave its pronunciation
  // playing into whatever the learner opens next.
  useEffect(() => invalidateSpeech, []);

  /**
   * `advance` closes over state that changes every question, and `onGraded` is
   * memoised, so the teaching-card path above reaches it through a ref rather
   * than capturing a stale copy. Refreshed in an effect rather than during
   * render: the value only has to be current by the time a thumb lands on the
   * card's button, which is always after the commit.
   */
  const advanceRef = useRef<() => void>(() => {});

  const next = () => {
    setGraded(null);
    setIdx(idx + 1);
  };
  /** The results screen, after the lesson and any re-asks (P-085). */
  const finished = () => {
    feedback.levelUp();
    setDone(true);
  };

  /**
   * On to the next step, or, after the last, the lesson saved and its results.
   *
   * The grades are flushed before `finishLesson`, not just on unmount:
   * `finishLesson` persists XP/streak/gems immediately, and `LessonComplete`
   * renders in this same mounted screen rather than a new one — so if this
   * visit's SRS grades waited for unmount alone, closing the app from that
   * results screen (before ever pressing "home") would persist the lesson's
   * rewards while silently losing its SRS grading. Safe to call before the
   * effect's own unmount-time flush later finds an already-emptied map and
   * does nothing.
   */
  const advance = () => {
    invalidateSpeech();
    if (heartsSpent) {
      // Cleared as it fires. Leaving it set meant the wall came back on the
      // next Continue, and the one after that, for the rest of the lesson: a
      // refill bought a single question. A playtest run hit the wall 375 times
      // and spent 15,000 gems on it.
      setHeartsSpent(false);
      setOutOfHearts(true);
      return;
    }
    if (inReask) return idx < steps.length - 1 ? next() : finished();
    if (idx < total - 1) {
      next();
    } else {
      flushPendingGrades();
      const r = finishLesson({
        lessonId: lesson.id,
        correct: correctCount,
        total: total - skippedRef.current,
        xp: lesson.xp,
        isReview,
        unitEvidence: isReview ? unitEvidenceFrom(lesson.id, firstTryRef.current) : undefined,
        romanTrack: track === 'roman',
      });
      setResult(r);
      if (reaskRef.current.length) next();
      else finished();
    }
  };

  useEffect(() => {
    advanceRef.current = advance;
  });

  /**
   * A fresh ledger per lesson.
   *
   * The screen is pushed per lesson and so normally mounts fresh, but "practise
   * again" on the same id reuses it, and a ref outlives a re-render. Without
   * this, a second run of the same lesson would start with every item already
   * paid for and cost no hearts at all.
   */
  useEffect(() => {
    // Or, for a lesson picked up where it was left, the ledger it was left with.
    chargedRef.current = new Set(resumed?.charged);
    firstTryRef.current = new Map(resumed?.firstTry);
    missRef.current = new Map(resumed?.misses);
    pretestedRef.current = new Set(resumed?.pretested);
    reaskRef.current = [];
    skippedRef.current = resumed?.skipped ?? 0;
    setSkippedCount(skippedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `resumed` is derived from `lesson.id` and read once per lesson
  }, [lesson.id]);

  /**
   * Kept as the lesson goes, so it can be picked up where it was left: after
   * each answer, the step to open on is the next one. Not before the first
   * answer, not once it is saved (the re-asks), and not after the results.
   * `finishLesson` drops the copy.
   */
  useEffect(() => {
    if (!resumable(lesson.id) || done || inReask) return;
    // Opening a held lesson is not progress, so it does not restart its week.
    if (resumed && idx === resumed.at && graded == null) return;
    const at = graded != null ? idx + 1 : idx;
    if (at < 1 || at >= exercises.length) return;
    holdLesson(
      takeSnapshot(lesson.id, track, dayKey(), {
        exercises,
        at,
        correct: correctCount,
        skipped: skippedRef.current,
        charged: chargedRef.current,
        firstTry: firstTryRef.current,
        misses: missRef.current,
        pretested: pretestedRef.current,
      })
    );
    // Saved on a step's answer and on moving on; the refs are read as they stand then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, graded]);

  if (done && result) {
    return (
      <LessonComplete
        result={result}
        correct={correctCount}
        total={total - skippedCount}
        skippedSteps={skippedCount}
        onHome={() => nav.popTo('Main')}
      />
    );
  }

  // Nothing this lesson could ask. A white screen is what it used to be (an
  // exercise read off an empty list); this says so and offers the way back.
  if (!exercises.length) {
    // A letter lesson opened by its link on the Roman track, which teaches no
    // script: it said "Nothing to practise here yet", as if the course were
    // empty (QA round 5, L29). Say why, and offer the track that teaches it.
    if (lesson.kind === 'letters' && track === 'roman') {
      return (
        <Screen fill>
          <SafeAreaView className="flex-grow">
            <View className="flex-grow items-center justify-center px-2">
              <Heading className="mb-2 text-center text-2xl">This lesson teaches the script</Heading>
              <Txt className="mb-8 max-w-[300px] text-center text-sm text-paper/60">
                You are learning with Roman letters only, so letter lessons are left out. Switch to Both together to
                learn the Urdu script as well.
              </Txt>
              <View style={{ width: '100%', maxWidth: 360, gap: 12 }}>
                <Button variant="primary" onPress={() => setTrack('both')}>
                  Learn the script too
                </Button>
                <Button variant="ghost" onPress={() => nav.popTo('Main')}>
                  Back home
                </Button>
              </View>
            </View>
          </SafeAreaView>
        </Screen>
      );
    }
    return (
      <Screen fill>
        <SafeAreaView className="flex-grow">
          <View className="flex-grow items-center justify-center px-2">
            <Heading className="mb-2 text-2xl">Nothing to practise here yet</Heading>
            <Txt className="mb-8 max-w-[280px] text-center text-sm text-paper/60">
              Finish a lesson or two and the words you meet will come back here.
            </Txt>
            <Button variant="primary" onPress={() => nav.popTo('Main')}>
              Back home
            </Button>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  if (outOfHearts) {
    // Either the button works, or the learner is told exactly what stands
    // between them and playing again — never a disabled button and a
    // sentence that only talks about the option they can't take yet.
    // A refill is 10 gems and a lesson pays 5 to 10, but a learner who has
    // spent theirs still needs the wait as a real answer, not just implied by
    // a disabled button.
    const canAfford = gems >= REFILL_COST;
    const short = gemsShortOfRefill(gems);
    const waitMin = minutesUntilNextHeart(heartsUpdatedAt);
    return (
      <Screen fill>
        <SafeAreaView className="flex-grow">
          <View className="flex-grow items-center justify-center px-2">
            <Illustration name="heart" tile={false} size={60} />
            <Heading className="mb-2 mt-4 text-2xl">Out of hearts</Heading>
            <Txt className="mb-8 max-w-[280px] text-center text-sm text-paper/60">
              {/* "keep the calm going" was a growth team's sentence, not a
                  teacher's, and it sat directly above a price at the moment a
                  learner had just run out. A playtester read it 67 times and
                  named it the least calm part of the hour. What they need here
                  is what happens next, said plainly. */}
              {/* The rule, said once at the moment it bites: nothing else
                  in the app had stated it (tester report, 2026-10-12). */}
              {'Each wrong answer costs a heart once Unit 1 is behind you. '}
              {canAfford
                ? 'Hearts come back on their own after a while. You can also spend gems to carry on now.'
                : `You’re ${short} gem${short === 1 ? '' : 's'} short for a refill. The next heart arrives ${
                    waitMin <= 0 ? 'any moment now' : `in about ${waitMin} minute${waitMin === 1 ? '' : 's'}`
                  }.`}
            </Txt>
            <View className="w-full gap-3">
              <Button
                variant="primary"
                disabled={!canAfford}
                onPress={() => {
                  if (refillHearts()) {
                    feedback.correct();
                    setOutOfHearts(false);
                    setGraded(null);
                    setAttempt((a) => a + 1);
                  }
                }}
              >
                Refill · {REFILL_COST} gems (you have {gems})
              </Button>
              <Button variant="ghost" onPress={() => nav.popTo('Main')}>
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
          style={{
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
            alignSelf: 'center',
            flexWrap: narrowHeader ? 'wrap' : 'nowrap',
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={inReask ? 'Close and see your results' : 'Close lesson'}
            style={reach(12)}
            onPress={() => {
              feedback.tap();
              // Asks first once anything has been answered. A stray tap on
              // this corner threw a lesson away with no warning, and coming
              // back started it again from nothing (design review,
              // 2026-10-10). Nothing answered yet, nothing to lose: it leaves.
              // A teaching card read is not an answer, so "Got it" alone does
              // not make it ask (QA, 2026-10-11).
              // popTo, not navigate, at every way out of a lesson: in React
              // Navigation 7 navigate pushed a new Home over the old one, so
              // every lesson ever opened stayed mounted underneath, about 6 MB
              // and 1,750 elements each, and lessons opened slower as they
              // piled up (performance review, 2026-10-11).
              const leave = () => nav.popTo('Main');
              // Saved already: closing a re-ask goes to the results, and the
              // "starts again" warning would be untrue (P-085).
              if (inReask) return setDone(true);
              const answered = exercises.slice(0, graded != null ? idx + 1 : idx).some((e) => !isTeaching(e));
              if (!answered) return leave();
              // Said as it is: the lesson and its XP start again, but each
              // answer's review grade is kept on the way out (the unmount
              // flush, useSessionGradeFlush). It said the answers "will not be
              // kept" (QA, 2026-10-24, Q-099).
              confirmAction(
                'Leave this lesson?',
                resumable(lesson.id)
                  ? 'Open it again soon and it picks up where you left off. What you answered still counts towards your reviews.'
                  : 'It starts again from the beginning next time. What you answered still counts towards your reviews.',
                'Leave',
                leave
              );
            }}
          >
            <Txt className="text-2xl text-paper/55">✕</Txt>
          </Pressable>
          {/* A floor, so the hearts badge cannot squeeze the bar and the step
              count out of sight at 200% text (QA round 5, M27). */}
          <View className="flex-1" style={{ minWidth: 72 }}>
            <ProgressBar
              progress={inReask ? 1 : (idx + (graded != null ? 1 : 0)) / total}
              color={palette.jade}
              height={12}
            />
            {/* How far, in steps. The bar alone gave no sense of a 43-step
                lesson's length, and testers concluded the sentence lessons
                never ended (QA report, 2026-10-12). */}
            <Txt
              nativeID={STEP_COUNTER_ID}
              numberOfLines={1}
              className="mt-0.5 text-right text-[0.625rem] text-paper/55"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {inReask ? `${idx - total + 1} of ${reask.length}` : `${Math.min(idx + 1, total)} of ${total}`}
            </Txt>
          </View>
          <Hearts count={hearts} free={heartsFree} />
        </View>
        {inReask || isReview || isWovenReview(current) ? (
          <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }} className="px-4">
            <Eyebrow style={{ color: palette.gold }}>
              {inReask ? 'Once more · the ones you missed' : isReview ? 'Review' : 'Review · from an earlier lesson'}
            </Eyebrow>
            {/* On the first re-ask only: at 200% on 320x568 the header with this
                line took 44% of the screen on every re-ask and pushed the
                question under the fold (design review, 2026-10-26). After the
                first, the eyebrow and ✕'s label carry it. */}
            {idx === total ? <Txt className="mt-1 text-xs text-paper/65">{REASK_SAVED}</Txt> : null}
          </View>
        ) : null}
        {/* On the step a lesson reopens on, until it is answered: without it,
            a lesson opening at step 23 reads as a different lesson (Q-038). */}
        {resumed && idx === resumed.at && graded == null ? (
          <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }} className="px-4">
            <View className="flex-row flex-wrap items-center" style={{ columnGap: 8 }}>
              <Txt className="text-xs text-paper/65">Picking up where you left off.</Txt>
              {/* A clean run, or the teaching again after days away: the
                  copy goes and the lesson is built afresh (second check,
                  2026-10-31). */}
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  // Asks, like ✕: a stray tap here threw away the place kept.
                  confirmAction(
                    'Start this lesson again?',
                    'It opens at the first step. What you answered still counts towards your reviews.',
                    'Start over',
                    () => {
                      dropLesson(lesson.id);
                      nav.replace('Lesson', { lessonId: lesson.id });
                    }
                  )
                }
                style={reach(8)}
              >
                <Bold className="text-xs" style={{ color: palette.gold }}>
                  Start over
                </Bold>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* exercise body */}
        {/* Sit the question in the middle of the space it has, not at the top
            of it. Measured across four consecutive exercises on a 390x844
            screen, the body ended at 490px and the bottom 42% of the screen
            was empty — while every option a thumb had to reach sat in the top
            58%, furthest from the thumb. The footer fills that space, but only
            after the answer, which is the one moment the learner has stopped
            reaching for anything.

            `grow justify-center` is the same pair the onboarding screen
            already uses for the same reason; a body taller than the screen
            fills the container and scrolls as before. */}
        <View className="flex-1" onLayout={(e) => setAboveBody(e.nativeEvent.layout.y)}>
          <Screen
            scroll
            padded={false}
            lattice={false}
            scrollRef={bodyRef}
            contentClassName="grow justify-center"
            scrollProps={more.scrollProps}
          >
            <View ref={stepBodyRef} className="px-5 pt-4" style={{ paddingBottom: BODY_PAD_BOTTOM }}>
              <ExerciseView
                key={`${idx}-${attempt}`}
                exercise={retried}
                track={track}
                showRoman={showRoman}
                locked={graded != null}
                onGraded={onGraded}
                onExpand={() => {
                  if (openStepRef.current === openStep) bodyRef.current?.scrollToEnd({ animated: true });
                }}
              />
            </View>
          </Screen>
          {more.show ? <MoreBelowCue scrollRef={bodyRef} view={more.view} y={more.y} /> : null}
        </View>

        {/* Heard, not seen; see `spokenVerdict`. Always mounted, so the region
            is there before its words change: one that appears together with
            its text is often not read at all. */}
        <View aria-live="polite" style={SPOKEN_ONLY}>
          <Txt>{answered ? spokenVerdict(!!graded, reveal, track) : idx === total ? REASK_SAVED : ''}</Txt>
        </View>

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
              // Never taller than the screen under the header: in landscape at
              // 150% and 200% text a wrong answer's banner was taller than the
              // window, with Continue below it and nothing that scrolled (QA,
              // 2026-10-21). Past this the answer scrolls; Continue stays.
              // A cap of 90% of the window alone still left Continue 41px
              // off, the header being 96px tall at 200%; a cap under the header
              // alone left a review's Continue 2px off, under its "Review"
              // eyebrow (QA, 2026-10-22). So: under everything above the body.
              maxHeight: Math.max(160, windowHeight - aboveBody - 8),
            }}
          >
            <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
              <View
                ref={bannerRef}
                tabIndex={-1}
                // Spacing in px, not rem: it is the room around the answer,
                // not text. In rem it doubled at 200% text, and on a 320x568
                // phone a wrong answer's banner ran 37px past the screen with
                // Continue cut off, 69px for a short sentence (design review,
                // 2026-10-20, Q-070). These are the 100% sizes, so nothing
                // moves at normal text; the words inside still grow.
                style={{
                  width: '100%',
                  maxWidth: CONTENT_MAX_WIDTH,
                  alignSelf: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  flexShrink: 1,
                }}
              >
                <View style={{ flexShrink: 1 }}>
                  <ScrollView ref={bannerScrollRef} style={{ flexGrow: 0, flexShrink: 1 }} {...answerMore.scrollProps}>
                    <View className="flex-row items-center" style={{ marginBottom: 12, gap: 8 }}>
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
                      </View>
                      {/* Hear it again. Only on a wrong answer, which is where it
                      was asked for and where it is worth most: the app says the
                      word once when the answer lands, and before this there was
                      no way to ask for it a second time. */}
                      {!graded && current && !isTeaching(current) && replay ? (
                        <SpeakerButton
                          size={38}
                          // One wording for every speaker: "Hear" and the word, its
                          // marks dropped for the screen reader (QA, L15).
                          label={`Hear ${replay.roman ? plainRoman(replay.roman) : replay.urdu}`}
                          onPress={() => announce(replay.id, replay.urdu, replay.roman)}
                        />
                      ) : null}
                    </View>

                    {/* The answer, in full, and only when it was got wrong.
                    Script at a size worth reading, the transliteration under
                    it the way `Lexeme` sets a word everywhere else, and the
                    English on its own line rather than after a colon.

                    The Roman is shown on every track except `script`, where
                    TrackChooser promises "No transliteration to fall back on"
                    as that track's stated cost. Breaking that promise at the
                    exact moment it is tempting is how a setting stops meaning
                    anything. The same goes the other way: the Roman track
                    promises no alphabet, and this banner set the answer in
                    large Nastaliq on it (QA, 2026-10-09), so it follows the
                    track, and shows the Roman even when "Show Roman Urdu" is
                    off, since a wrong answer is always told how it is said. */}
                    {reveal ? (
                      <View
                        className="rounded-xl"
                        style={{
                          backgroundColor: withAlpha(palette.rose, 0.12),
                          marginBottom: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                        }}
                      >
                        <Eyebrow style={{ color: palette.roseLight, marginBottom: 6 }}>The answer</Eyebrow>
                        {reveal.label ? (
                          <Bold className="text-[0.9375rem]">{reveal.label}</Bold>
                        ) : (
                          <>
                            {/* A word can afford 26; a six-word sentence at that
                            size wraps to three lines and pushes Continue off a
                            small screen. */}
                            {/* Clear of the eyebrow: Nastaliq rises well above its
                            line, and جیکٹ touched "THE ANSWER" (QA report v3,
                            L22). 6px was not enough for بیگم, whose گ
                            rises above the 2.3x line box (2026-10-13). */}
                            <View style={{ paddingTop: 12 }}>
                              <Lexeme
                                urdu={reveal.script ?? ''}
                                roman={reveal.roman}
                                track={track}
                                forceRoman={track !== 'script'}
                                size={(reveal.script ?? '').length > 18 ? 20 : 26}
                                align="left"
                              />
                            </View>
                            {reveal.meaning ? (
                              <Txt className="text-sm text-paper/85" style={{ marginTop: 6 }}>
                                {reveal.meaning}
                              </Txt>
                            ) : null}
                          </>
                        )}
                      </View>
                    ) : null}
                  </ScrollView>
                  {answerMore.show ? (
                    <MoreBelowCue scrollRef={bannerScrollRef} view={answerMore.view} y={answerMore.y} fade={false} />
                  ) : null}
                </View>

                <Button
                  variant={isTeaching(current) ? 'primary' : graded ? 'correct' : 'incorrect'}
                  sound={false}
                  onPress={advance}
                >
                  {idx < steps.length - 1 && idx !== total - 1 ? 'Continue' : 'Finish'}
                </Button>
              </View>
            </SafeAreaView>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}
