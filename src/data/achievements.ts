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
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first lessons.',
    icon: '🌱',
    metric: 'lessonsCompleted',
    tiers: [1, 5, 15, 40],
  },
  {
    id: 'flame-keeper',
    title: 'Flame Keeper',
    description: 'Keep your daily streak alive.',
    icon: '🔥',
    metric: 'streak',
    tiers: [3, 7, 30, 100],
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Earn experience points.',
    icon: '📚',
    metric: 'totalXp',
    /**
     * URD-033: the top tier used to sit at 10,000 XP against a course that
     * pays out ~7,220 XP finished start to finish — the identical bug class
     * URD-004 fixed for `levelTitle`'s "Master" tier (a sibling XP-gated
     * system that item was never scoped to touch), found by THE CRITIC
     * asking the same question of this one. Re-spaced to the same ~4-5x
     * per-tier ratio as before, scaled so the top tier lands at ~69% of the
     * real course total rather than 138% of it — comfortable room below the
     * ceiling, not landing on it exactly, matching `levelTitle`'s own
     * precedent (Master sits at ~76%). See `achievements.test.ts`, which
     * derives the course total from real content and asserts this stays
     * true rather than trusting these numbers to keep up with the course by
     * hand — the course's own real total has only ever measured *lower*
     * than assumed so far (11,552 → 7,220 XP across `levelTitle`'s history),
     * never higher, so margin here is not a one-time nicety.
     */
    tiers: [50, 250, 1000, 5000],
  },
  {
    id: 'wordsmith',
    title: 'Wordsmith',
    description: 'Learn new words.',
    icon: '💠',
    metric: 'wordsLearned',
    tiers: [10, 30, 60, 100],
  },
  {
    id: 'calligrapher',
    title: 'Calligrapher',
    description: 'Master letters in all four forms.',
    icon: '🖋️',
    metric: 'lettersLearned',
    tiers: [5, 15, 30, 40],
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Finish lessons with no mistakes.',
    icon: '💎',
    metric: 'perfectLessons',
    tiers: [1, 10, 25, 50],
  },
];

/**
 * Daily-goal presets — a gentle contract, not a demand.
 *
 * `xp` is the real target `HomeScreen.tsx`'s progress ring and daily-goal
 * check are built on; `minutes`/`desc` are description only, nothing reads
 * them. URD-009: they were hand-set once, assumed at 12.54 XP/min against a
 * course that has since paid as little as 3.95, then 4.77 (script track),
 * and now — after URD-025 gave `sentences`/`grammar` lessons two
 * `sentenceBuild` reps per sentence instead of one, lengthening every one of
 * them — 4.53. Re-derived from that real, current measurement rather than
 * the assumption, and held honest going forward by `achievements.test.ts`,
 * which fails (and says to re-tune these by hand) the next time the real
 * pace drifts more than a minute from what these numbers claim. See
 * `src/lib/achievements.ts` for why that check is a test rather than
 * something the app computes on every load.
 */
export const DAILY_GOALS = [
  { id: 'calm', label: 'Calm', minutes: 4, xp: 20, desc: '4 min a day' },
  { id: 'steady', label: 'Steady', minutes: 8, xp: 40, desc: '8 min a day' },
  { id: 'serious', label: 'Serious', minutes: 15, xp: 70, desc: '15 min a day' },
  { id: 'intense', label: 'Intense', minutes: 26, xp: 120, desc: '26 min a day' },
] as const;

export type DailyGoalId = (typeof DAILY_GOALS)[number]['id'];
