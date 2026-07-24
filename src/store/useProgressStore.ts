import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

import { SrsCard, SrsGrade, newCard, review, dueCount } from '../lib/srs';
import { dayKey, daysBetween } from '../lib/date';
import {
  HEARTS_MAX,
  HEART_REGEN_MINUTES,
  levelFromXp,
  gemsForLesson,
  promote,
  demote,
  LeagueId,
} from '../lib/gamification';
import { ACHIEVEMENTS } from '../data/achievements';

export type Goal = 'family' | 'read' | 'heritage' | 'curious';
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
  learnedLetters: string[];
  learnedWords: string[];
  perfectLessons: number;
  srs: Record<string, SrsCard>;
  srsType: Record<string, ItemType>;

  // xp history for the weekly chart: dayKey -> xp
  xpHistory: Record<string, number>;

  // achievement tiers already reached (for "new unlock" detection)
  achieved: Record<string, number>;

  // ---- actions ----
  completeOnboarding: (goal: Goal, startLevel: number) => void;
  regenHearts: () => void;
  loseHeart: () => void;
  refillHearts: () => boolean;
  gradeItem: (id: string, type: ItemType, grade: SrsGrade) => void;
  finishLesson: (args: { lessonId: string; correct: number; total: number; xp: number; isReview: boolean }) => FinishResult;
  setDailyGoal: (id: string) => void;
  useFreeze: () => void;
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
      learnedLetters: [],
      learnedWords: [],
      perfectLessons: 0,
      srs: {},
      srsType: {},
      xpHistory: {},
      achieved: {},

      completeOnboarding: (goal, startLevel) =>
        set({ onboarded: true, goal, startLevel }),

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
            heartsUpdatedAt:
              hearts >= HEARTS_MAX ? Date.now() : s.heartsUpdatedAt + consumedMin * 60000,
          });
        }
      },

      loseHeart: () => {
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
        const COST = 40;
        if (s.gems < COST) return false;
        set({ hearts: HEARTS_MAX, gems: s.gems - COST, heartsUpdatedAt: Date.now() });
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

      resetAll: () =>
        set({
          onboarded: false,
          goal: null,
          startLevel: 0,
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
          learnedLetters: [],
          learnedWords: [],
          perfectLessons: 0,
          srs: {},
          srsType: {},
          xpHistory: {},
          achieved: {},
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
      version: 1,
    }
  )
);
