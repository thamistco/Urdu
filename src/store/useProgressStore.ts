import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

import { SrsCard, SrsGrade, newCard, review, dueCount } from '../lib/srs';
import { testerFlags } from './useTesterStore';
import { dayKey } from '../lib/date';
import { rollStreak, markActiveToday } from '../lib/streak';
import { retireWordIds } from '../lib/retiredIds';
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
import { heartsAreFree } from '../lib/hearts';
import { repeatReward } from '../lib/repeatReward';

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
  /**
   * Set when a streak freeze was spent since the learner was last told, with
   * how many are left. Reported once: the lesson that reports it clears it.
   */
  freezeUsed: { left: number; days: number } | null;
};

/** What a streak freeze costs, and how many a learner can hold. */
export const FREEZE_COST = 30;
export const FREEZE_MAX = 3;

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
  /**
   * The day a freeze was last spent, until a lesson has told the learner.
   * Persisted because the freeze can be spent when the app opens, before any
   * lesson, and the notice is owed to whichever lesson comes next.
   */
  freezeNotice: string | null;
  /** Freezes spent on the current gap since the last lesson; see lib/streak.ts. */
  freezesOnHold: number;

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

  /** Best pace in Read faster, in words a minute; 0 before the first round. */
  readingBestWpm: number;

  // achievement tiers already reached (for "new unlock" detection)
  achieved: Record<string, number>;

  /** Whether this learner has been told that the path was regrouped under them.
   *  Set on dismissal rather than on render, so a notice that was drawn and
   *  never read is still owed. See lib/progress.ts for who is owed one. */
  pathNoticeSeen: boolean;
  /** How many lessons the path held when this learner last opened the app,
   *  `null` until a Home render records one. Re-recorded on dismissal, so the
   *  next regroup announces itself without anyone bumping the persist version:
   *  detecting the move by which lesson ids died could not see the learner it
   *  mattered to, because a topic's first part keeps the topic's own id. */
  pathSize: number | null;

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
  /** Buy one streak freeze. False, and nothing spent, when it cannot. */
  buyFreeze: () => boolean;
  /**
   * Apply the days missed since the learner was last active: spend a freeze
   * on a single missed day, or break the streak. Run once when the app opens,
   * so Home and Profile never show a streak that has already lapsed.
   */
  rolloverStreak: () => void;
  /** Move progress off word ids the course retired (lib/retiredIds.ts). */
  retireOldIds: () => void;
  /** Dismiss the path-moved notice and record the path it was about. */
  dismissPathNotice: (pathSize: number) => void;
  /** Record the path this learner has seen without showing them anything.
   *  For the launches where nothing is owed, so a learner is never told about
   *  a move they lived through. */
  notePathSize: (pathSize: number) => void;
  addGems: (n: number) => void;
  resetAll: () => void;
  /** Keeps a Read faster pace if it beats the best; true when it did. */
  recordReadingPace: (wpm: number) => boolean;

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
      freezeNotice: null,
      freezesOnHold: 0,

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
      readingBestWpm: 0,
      achieved: {},
      // A profile created now has nothing to be told: it starts on the path as
      // it is. `needsPathMoveNotice` reaches the same answer from the empty
      // lesson maps, so this default is belt and braces rather than the guard.
      pathNoticeSeen: true,
      pathSize: null,

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
        // Unit 1 costs no hearts. See lib/hearts.ts for why: before it is
        // finished a refill is unaffordable by construction, so the wall there
        // is not a choice between waiting and paying, it is just waiting.
        if (heartsAreFree(s.completedLessons, s.skippedLessons)) return;
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
        // A lesson already finished pays for the work done in it, not for
        // being that lesson again. See `repeatReward` for the measurements.
        const repeat = !!s2.completedLessons[lessonId];
        const { xp: xpGained, gems: gemsGained } = repeatReward(repeat, {
          xp: xp + bonusXp,
          gems: gemsForLesson(accuracy, isReview),
          exercises: total,
        });

        // --- streak ---
        // The same two rules the app runs when it opens (`rolloverStreak`):
        // account for any missed days, then count today. One implementation,
        // in lib/streak.ts, so the launch path and this one cannot disagree.
        const today = dayKey();
        const rolled = rollStreak(s2, today, FREEZE_MAX);
        const active = markActiveToday(rolled, today);
        const streak = active.streak;
        const freezes = active.freezes;
        const streakIncreased = active.increased;
        // Every freeze spent since the last lesson, at launch or just now. A
        // notice left by a store saved before freezesOnHold existed counts as
        // one, which is all the old rule ever spent. Nothing is reported over
        // a streak that broke anyway: those freezes were handed back.
        const frozeDays = rolled.streak > 0 ? rolled.freezesOnHold || (s2.freezeNotice ? 1 : 0) : 0;
        const freezeUsed = frozeDays ? { left: freezes, days: frozeDays } : null;
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
          freezeNotice: null,
          freezesOnHold: active.freezesOnHold,
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
          freezeUsed,
        };
      },

      setDailyGoal: (id) => set({ dailyGoalId: id }),
      buyFreeze: () => {
        const s = get();
        if (s.gems < FREEZE_COST || s.freezes >= FREEZE_MAX) return false;
        set({ gems: s.gems - FREEZE_COST, freezes: s.freezes + 1 });
        return true;
      },
      retireOldIds: () => {
        const patch = retireWordIds(get());
        if (patch) set(patch);
      },
      rolloverStreak: () => {
        const s = get();
        const r = rollStreak(s, dayKey(), FREEZE_MAX);
        if (r.streak === s.streak && r.freezes === s.freezes && r.lastActiveDay === s.lastActiveDay) return;
        set({
          streak: r.streak,
          freezes: r.freezes,
          lastActiveDay: r.lastActiveDay,
          freezesOnHold: r.freezesOnHold,
          // A notice owed from an earlier launch is dropped when the streak
          // breaks: it would say a freeze saved a streak that just ended.
          ...(r.froze ? { freezeNotice: dayKey() } : r.streak === 0 ? { freezeNotice: null } : {}),
        });
      },
      addGems: (n) => set((s) => ({ gems: s.gems + n })),

      dismissPathNotice: (pathSize: number) => set({ pathNoticeSeen: true, pathSize }),
      notePathSize: (pathSize: number) => set({ pathSize }),

      recordReadingPace: (wpm) => {
        if (!(wpm > get().readingBestWpm)) return false;
        set({ readingBestWpm: wpm });
        return true;
      },

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
          freezeNotice: null,
          freezesOnHold: 0,
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
          readingBestWpm: 0,
          achieved: {},
          // Whatever this profile was owed, it no longer has the progress the
          // notice would be about.
          pathNoticeSeen: true,
          pathSize: null,
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
      name: 'qaaf-progress',
      storage: createJSONStorage(() => safeStorage),
      // Once per session, as soon as the saved progress is back: a learner
      // returning after days away sees the streak as it now stands, not as it
      // stood the last time a lesson was finished.
      onRehydrateStorage: () => (state) => {
        state?.retireOldIds();
        state?.rolloverStreak();
      },
      /**
       * No `version`, and so no `migrate`. The app has not launched, so no
       * profile written by an older shape of this store exists anywhere to
       * migrate from, and both the v1 → v2 lesson-id wipe and the v2 → v3
       * path-notice reset were code with no population. Zustand defaults the
       * version to 0; a stored blob whose version does not match is discarded,
       * which is the right answer for a shape change before launch and needs
       * nothing written.
       *
       * The first release after launch that changes the persisted shape adds
       * both back: `version: 1`, and a `migrate` that either translates the old
       * shape or records what it could not. The path-moved notice is
       * deliberately not one of those changes — it re-arms off the recorded
       * path size (`lib/progress.ts`), so regrouping the course never needs a
       * version bump.
       */
    }
  )
);
