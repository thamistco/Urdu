/**
 * Achievements — layered like Duolingo's: easy early wins for new users, and
 * rarer long-horizon targets that keep committed learners reaching. Each has a
 * tiered threshold so a badge visibly levels up rather than being one-and-done.
 */

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** which tracked stat drives it */
  metric: 'lessonsCompleted' | 'streak' | 'totalXp' | 'wordsLearned' | 'lettersLearned' | 'perfectLessons';
  tiers: number[];
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-steps', title: 'First Steps', description: 'Complete your first lessons.',
    icon: '🌱', metric: 'lessonsCompleted', tiers: [1, 5, 15, 40],
  },
  {
    id: 'flame-keeper', title: 'Flame Keeper', description: 'Keep your daily streak alive.',
    icon: '🔥', metric: 'streak', tiers: [3, 7, 30, 100],
  },
  {
    id: 'scholar', title: 'Scholar', description: 'Earn experience points.',
    icon: '📚', metric: 'totalXp', tiers: [100, 500, 2000, 10000],
  },
  {
    id: 'wordsmith', title: 'Wordsmith', description: 'Learn new words.',
    icon: '💠', metric: 'wordsLearned', tiers: [10, 30, 60, 100],
  },
  {
    id: 'calligrapher', title: 'Calligrapher', description: 'Master letters in all four forms.',
    icon: '🖋️', metric: 'lettersLearned', tiers: [5, 15, 30, 40],
  },
  {
    id: 'flawless', title: 'Flawless', description: 'Finish lessons with no mistakes.',
    icon: '💎', metric: 'perfectLessons', tiers: [1, 10, 25, 50],
  },
];

/** Daily-goal presets — a gentle contract, not a demand. */
export const DAILY_GOALS = [
  { id: 'calm', label: 'Calm', minutes: 3, xp: 20, desc: '3 min a day' },
  { id: 'steady', label: 'Steady', minutes: 7, xp: 40, desc: '7 min a day' },
  { id: 'serious', label: 'Serious', minutes: 12, xp: 70, desc: '12 min a day' },
  { id: 'intense', label: 'Intense', minutes: 20, xp: 120, desc: '20 min a day' },
] as const;

export type DailyGoalId = (typeof DAILY_GOALS)[number]['id'];
