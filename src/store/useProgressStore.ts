import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

import { SrsCard, SrsGrade, newCard, review, dueCount } from '../lib/srs';
import { testerFlags } from './useTesterStore';
import { dayKey, daysBetween } from '../lib/date';
import {
  HEARTS_MAX,
  HEART_REGEN_MINUTES,
  REFILL_COST,
  levelFromXp,
  gemsForLesson,
  promote,
  demote,
  LeagueId,
} from '../lib/gamification';
import { ACHIEVEMENTS } from '../data/achievements';
import { migrateProgress } from '../lib/progress';

export type Goal = 'family' | 'read' | 'heritage' | 'curious';
/**
 * Whether the learner already has spoken Urdu, distinct from `Goal` — that's
 * *why* they're here (which shapes what we teach first), this is *what they
 * already carry in* (which shapes what we can skip). Named to avoid colliding
 * with `Goal`'s `'heritage'` value, which means something different: a
 * motivation ("reconnect with heritage"), not a skill.
 */
export type Background = 'new' | 'speaker';
export type ItemType = 'letter' | 'word';

export type FinishResult = {
  xpGained: number;
  gemsGained: number;
  leveledUp: boolean;
  newLevel: number;
  streak: number;
  streakIncreased: boolean;
  perfect: boolean;
  newAchievements: { id: string; title: string; icon: string; tier: number }[];
};

const weekKeyOf = (d: Date = new Date()) => {
  const epochDays = Math.floor(d.getTime() / (24 * 60 * 60 * 1000));
  // anchor weeks on Monday-ish; exact anchor doesn't matter, only that it rolls
  return Math.floor((epochDays + 3) / 7);
};

/** XP thresholds that trigger promotion / demotion at week's end. */
const PROMOTE_XP = 150;
const DEMOTE_XP = 20;

type MetricSnapshot = {
  lessonsCompleted: number;
  streak: number;
  totalXp: number;
  wordsLearned: number;
  lettersLearned: number;
  perfectLessons: number;
};

function tierReached(value: number, tiers: number[]): number {
  let t = 0;
  for (const threshold of tiers) if (value >= threshold) t++;
  return t;
}

type ProgressState = {
  // onboarding
  onboarded: boolean;
  goal: Goal | null;
  startLevel: number;
  background: Background | null;

  // economy
  totalXp: number;
  gems: number;
  hearts: number;
  heartsUpdatedAt: number;

  // streak
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  freezes: number;

  // daily goal
  dailyGoalId: string;
  todayKey: string;
  todayXp: number;

  // league
  leagueId: LeagueId;
  weekKey: number;
  weeklyXp: number;

  // learning state
  completedLessons: Record<string, { best: number; done: number }>;
  /** Lessons pre-satisfied at onboarding for a learner who already speaks
   *  Urdu — basic vocab they already know, not a real attempt. Kept separate
   *  from `completedLessons` so they don't inflate lesson-completion
   *  achievements, but they still count toward unlocking the next lesson. */
  skippedLessons: Record<string, boolean>;
  learnedLetters: string[];
  learnedWords: string[];
  perfectLessons: number;
  srs: Record<string, SrsCard>;
  srsType: Record<string, ItemType>;

  // xp history for the weekly chart: dayKey -> xp
  xpHistory: Record<string, number>;

  // achievement tiers already reached (for "new unlock" detection)
  achieved: Record<string, number>;

  /** Whether this learner has been told that the path was regrouped under them.
   *  Set on dismissal rather than on render, so a notice that was drawn and
   *  never read is still owed. See lib/progress.ts for who is owed one. */
  pathNoticeSeen: boolean;
  /** How many lessons the path held when this learner last opened the app.
   *  `null` means a profile written before this was recorded, which is the
   *  evidence that the path has moved since. Re-recorded on dismissal, so the
   *  next regroup announces itself without anyone bumping the persist version:
   *  detecting the move by which lesson ids died could not see the learner it
   *  mattered to, because a topic's first part keeps the topic's own id. */
  pathSize: number | null;

  /**
   * True for a profile whose v0/v1 → v2 lesson-id migration emptied
   * `completedLessons`/`skippedLessons` because it genuinely had some — the
   * second, worse silence `needsPathMoveNotice` alone cannot see, since that
   * function's evidence is exactly what this migration deleted. See
   * `lib/progress.ts`'s `migrateProgress`. Cleared on dismissal, not
   * re-armed: unlike the path-move notice this describes a one-time
   * historical fact about an upgrade that already happened, not a
   * recurring condition to detect again.
   */
  ticksWipedByMigration: boolean;

  // ---- actions ----
  completeOnboarding: (goal: Goal, startLevel: number, background: Background, skipLessonIds: string[]) => void;
  regenHearts: () => void;
  loseHeart: () => void;
  refillHearts: () => boolean;
  gradeItem: (id: string, type: ItemType, grade: SrsGrade) => void;
  finishLesson: (args: {
    lessonId: string;
    correct: number;
    total: number;
    xp: number;
    isReview: boolean;
  }) => FinishResult;
  setDailyGoal: (id: string) => void;
  useFreeze: () => void;
  /** Dismiss the path-moved notice and record the path it was about. */
  dismissPathNotice: (pathSize: number) => void;
  /** Record the path this learner has seen without showing them anything.
   *  For the launches where nothing is owed, so a learner is never told about
   *  a move they lived through. */
  notePathSize: (pathSize: number) => void;
  /** Dismiss the ticks-wiped notice. See `ticksWipedByMigration`. */
  dismissTicksWipedNotice: () => void;
  addGems: (n: number) => void;
  resetAll: () => void;

  // selectors
  metrics: () => MetricSnapshot;
  reviewDueCount: () => number;
};

const rollDay = (state: ProgressState): Partial<ProgressState> => {
  const today = dayKey();
  if (state.todayKey !== today) {
    return { todayKey: today, todayXp: 0 };
  }
  return {};
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      goal: null,
      startLevel: 0,
      background: null,

      totalXp: 0,
      gems: 20,
      hearts: HEARTS_MAX,
      heartsUpdatedAt: Date.now(),

      streak: 0,
      longestStreak: 0,
      lastActiveDay: null,
      freezes: 1,

      dailyGoalId: 'steady',
      todayKey: dayKey(),
      todayXp: 0,

      leagueId: 'clay',
      weekKey: weekKeyOf(),
      weeklyXp: 0,

      completedLessons: {},
      skippedLessons: {},
      learnedLetters: [],
      learnedWords: [],
      perfectLessons: 0,
      srs: {},
      srsType: {},
      xpHistory: {},
      achieved: {},
      // A profile created now has nothing to be told: it starts on the path as
      // it is. `needsPathMoveNotice` reaches the same answer from the empty
      // lesson maps, so this default is belt and braces rather than the guard.
      pathNoticeSeen: true,
      pathSize: null,
      // A profile created now was never migrated, so it has nothing to
      // report — set for the same belt-and-braces reason as
      // `pathNoticeSeen` above.
      ticksWipedByMigration: false,

      completeOnboarding: (goal, startLevel, background, skipLessonIds) =>
        set({
          onboarded: true,
          goal,
          startLevel,
          background,
          skippedLessons: Object.fromEntries(skipLessonIds.map((id) => [id, true])),
        }),

      regenHearts: () => {
        const s = get();
        if (s.hearts >= HEARTS_MAX) {
          if (s.heartsUpdatedAt !== 0) set({ heartsUpdatedAt: Date.now() });
          return;
        }
        const elapsedMin = (Date.now() - s.heartsUpdatedAt) / 60000;
        const gained = Math.floor(elapsedMin / HEART_REGEN_MINUTES);
        if (gained > 0) {
          const hearts = Math.min(HEARTS_MAX, s.hearts + gained);
          const consumedMin = gained * HEART_REGEN_MINUTES;
          set({
            hearts,
            heartsUpdatedAt: hearts >= HEARTS_MAX ? Date.now() : s.heartsUpdatedAt + consumedMin * 60000,
          });
        }
      },

      loseHeart: () => {
        // Tester mode watches the app rather than plays it; see useTesterStore.
        if (testerFlags().infiniteHearts) return;
        const s = get();
        const hearts = Math.max(0, s.hearts - 1);
        set({
          hearts,
          // start the regen clock the moment we drop below full
          heartsUpdatedAt: s.hearts === HEARTS_MAX ? Date.now() : s.heartsUpdatedAt,
        });
      },

      refillHearts: () => {
        const s = get();
        if (s.hearts >= HEARTS_MAX) return false;
        if (s.gems < REFILL_COST) return false;
        set({ hearts: HEARTS_MAX, gems: s.gems - REFILL_COST, heartsUpdatedAt: Date.now() });
        return true;
      },

      gradeItem: (id, type, grade) => {
        const s = get();
        const existing = s.srs[id] ?? newCard(id);
        const updated = review(existing, grade);
        const learnedLetters = new Set(s.learnedLetters);
        const learnedWords = new Set(s.learnedWords);
        if (grade !== 'again') {
          if (type === 'letter') learnedLetters.add(id);
          else learnedWords.add(id);
        }
        set({
          srs: { ...s.srs, [id]: updated },
          srsType: { ...s.srsType, [id]: type },
          learnedLetters: [...learnedLetters],
          learnedWords: [...learnedWords],
        });
      },

      finishLesson: ({ lessonId, correct, total, xp, isReview }) => {
        const s = get();
        set(rollDay(s));
        const s2 = get();

        const accuracy = total > 0 ? correct / total : 1;
        const perfect = correct === total && total > 0;
        const bonusXp = perfect ? 5 : 0;
        const xpGained = xp + bonusXp;
        const gemsGained = gemsForLesson(accuracy, isReview);

        // --- streak ---
        const today = dayKey();
        let streak = s2.streak;
        let freezes = s2.freezes;
        let streakIncreased = false;
        if (s2.lastActiveDay !== today) {
          if (!s2.lastActiveDay) {
            streak = 1;
            streakIncreased = true;
          } else {
            const gap = daysBetween(s2.lastActiveDay, today);
            if (gap === 1) {
              streak += 1;
              streakIncreased = true;
            } else if (gap === 2 && freezes > 0) {
              freezes -= 1; // a freeze covered the single missed day
              streak += 1;
              streakIncreased = true;
            } else {
              streak = 1;
              streakIncreased = true;
            }
          }
        }
        const longestStreak = Math.max(s2.longestStreak, streak);

        // --- league week roll ---
        let leagueId = s2.leagueId;
        let weekKey = s2.weekKey;
        let weeklyXp = s2.weeklyXp;
        const wk = weekKeyOf();
        if (wk !== weekKey) {
          if (weeklyXp >= PROMOTE_XP) leagueId = promote(leagueId);
          else if (weeklyXp < DEMOTE_XP) leagueId = demote(leagueId);
          weekKey = wk;
          weeklyXp = 0;
        }
        weeklyXp += xpGained;

        // --- xp / level ---
        const beforeLevel = levelFromXp(s2.totalXp);
        const totalXp = s2.totalXp + xpGained;
        const newLevel = levelFromXp(totalXp);
        const leveledUp = newLevel > beforeLevel;

        // --- daily + history ---
        const todayXp = s2.todayXp + xpGained;
        const xpHistory = { ...s2.xpHistory, [today]: (s2.xpHistory[today] ?? 0) + xpGained };

        // --- lesson record ---
        const prev = s2.completedLessons[lessonId];
        const completedLessons = {
          ...s2.completedLessons,
          [lessonId]: {
            best: Math.max(prev?.best ?? 0, correct),
            done: (prev?.done ?? 0) + 1,
          },
        };
        const lessonsCompleted = Object.keys(completedLessons).length;
        const perfectLessons = s2.perfectLessons + (perfect ? 1 : 0);

        // commit
        set({
          totalXp,
          gems: s2.gems + gemsGained,
          streak,
          longestStreak,
          lastActiveDay: today,
          freezes,
          leagueId,
          weekKey,
          weeklyXp,
          todayXp,
          xpHistory,
          completedLessons,
          perfectLessons,
        });

        // --- achievements ---
        const m: MetricSnapshot = {
          lessonsCompleted,
          streak,
          totalXp,
          wordsLearned: get().learnedWords.length,
          lettersLearned: get().learnedLetters.length,
          perfectLessons,
        };
        const achieved = { ...s2.achieved };
        const newAchievements: FinishResult['newAchievements'] = [];
        for (const a of ACHIEVEMENTS) {
          const reached = tierReached(m[a.metric], a.tiers);
          const had = achieved[a.id] ?? 0;
          if (reached > had) {
            achieved[a.id] = reached;
            newAchievements.push({ id: a.id, title: a.title, icon: a.icon, tier: reached });
          }
        }
        if (newAchievements.length) set({ achieved });

        return {
          xpGained,
          gemsGained,
          leveledUp,
          newLevel,
          streak,
          streakIncreased,
          perfect,
          newAchievements,
        };
      },

      setDailyGoal: (id) => set({ dailyGoalId: id }),
      useFreeze: () => {
        const s = get();
        if (s.gems >= 30 && s.freezes < 3) set({ gems: s.gems - 30, freezes: s.freezes + 1 });
      },
      addGems: (n) => set((s) => ({ gems: s.gems + n })),

      dismissPathNotice: (pathSize: number) => set({ pathNoticeSeen: true, pathSize }),
      notePathSize: (pathSize: number) => set({ pathSize }),
      dismissTicksWipedNotice: () => set({ ticksWipedByMigration: false }),

      resetAll: () =>
        set({
          onboarded: false,
          goal: null,
          startLevel: 0,
          background: null,
          totalXp: 0,
          gems: 20,
          hearts: HEARTS_MAX,
          heartsUpdatedAt: Date.now(),
          streak: 0,
          longestStreak: 0,
          lastActiveDay: null,
          freezes: 1,
          dailyGoalId: 'steady',
          todayKey: dayKey(),
          todayXp: 0,
          leagueId: 'clay',
          weekKey: weekKeyOf(),
          weeklyXp: 0,
          completedLessons: {},
          skippedLessons: {},
          learnedLetters: [],
          learnedWords: [],
          perfectLessons: 0,
          srs: {},
          srsType: {},
          xpHistory: {},
          achieved: {},
          // Whatever this profile was owed, it no longer has the progress the
          // notice would be about.
          pathNoticeSeen: true,
          pathSize: null,
          ticksWipedByMigration: false,
        }),

      metrics: () => {
        const s = get();
        return {
          lessonsCompleted: Object.keys(s.completedLessons).length,
          streak: s.streak,
          totalXp: s.totalXp,
          wordsLearned: s.learnedWords.length,
          lettersLearned: s.learnedLetters.length,
          perfectLessons: s.perfectLessons,
        };
      },

      reviewDueCount: () => dueCount(get().srs),
    }),
    {
      name: 'harf-progress',
      storage: createJSONStorage(() => safeStorage),
      version: 3,
      /**
       * v1 → v2: lesson ids stopped being positional.
       *
       * They used to be counted along the path (`v-12`), so they named a slot
       * rather than a lesson; they are now derived from the content a lesson
       * teaches (`v-colours`). Only the two lesson-keyed maps are affected, and
       * neither can be translated — the old key genuinely does not say which
       * lesson it meant, because that depended on a path layout that no longer
       * exists. They are dropped.
       *
       * Everything that represents actual learning survives: `srs`, `srsType`,
       * `learnedWords` and `learnedLetters` are keyed by word and letter ids,
       * which never moved, and XP, streak, gems and achievements are scalars.
       * So a learner loses their ticked-off lessons and keeps their review
       * schedule, their streak and their level.
       *
       * URD-014: that wipe used to say nothing. `needsPathMoveNotice`
       * (`lib/progress.ts`) requires a surviving completed or skipped
       * lesson to have anything to report, which is exactly the evidence
       * this migration deletes — so the learner who lost the most was told
       * the least. `ticksWipedByMigration` records that it happened, for a
       * learner who genuinely had ticks to lose.
       */
      /**
       * v2 → v3: the path was regrouped twice and the learner was not told.
       *
       * Nothing is dropped here. Splitting each topic across enough lessons to
       * cover its vocabulary kept the first part's id, and regrouping those into
       * sittings kept it again, so a ticked lesson that survived stays ticked and
       * one that did not is simply absent — which is what `pathMoveNotice` reads.
       * The only change is that this learner is now owed a sentence about it.
       *
       * `pathNoticeSeen: false` and `pathSize: null` rather than a stored
       * message, because whether there is anything to say depends on whether
       * *this* profile has a place on the path at all, which is a question about
       * the profile rather than about the upgrade. A profile that finished
       * nothing is migrated the same way and told nothing.
       *
       * `pathSize: null` is also what makes this the last migration that has to
       * think about the notice. From here the size of the path is recorded as
       * the learner sees it, so the next regroup is detected by the path
       * changing rather than by somebody remembering to bump this number.
       */
      // Extracted to lib/progress.ts as `migrateProgress` so the decision is
      // a plain function a test can drive directly, not an inline arrow
      // reachable only through zustand's persist middleware.
      migrate: (persisted, from) => migrateProgress(persisted as Partial<ProgressState>, from) as ProgressState,
    }
  )
);
