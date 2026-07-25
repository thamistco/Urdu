/**
 * Gamification math — XP → level curve, hearts economy, and weekly-league
 * tiers. Kept pure and framework-free so it can be unit-reasoned about and
 * reused by the store, the profile screen, and the lesson summary.
 */

export const HEARTS_MAX = 5;
/** Minutes to regenerate one heart. */
export const HEART_REGEN_MINUTES = 30;

/**
 * Level curve: gently super-linear so early levels come fast (momentum for new
 * users) while later levels stretch out (long-term goals). XP needed to REACH
 * level n from level 1.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 60, 150, 270, 420, ... quadratic-ish growth
  return Math.round(30 * (level - 1) * level);
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export function levelProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = totalXp - base;
  const span = next - base;
  return { level, into, span, ratio: span > 0 ? into / span : 1, next };
}

/** Named tiers give the level a sense of journey, not just a number. */
export function levelTitle(level: number): string {
  if (level >= 25) return 'Master';
  if (level >= 18) return 'Calligrapher';
  if (level >= 12) return 'Fluent Reader';
  if (level >= 8) return 'Confident';
  if (level >= 5) return 'Rising';
  if (level >= 3) return 'Apprentice';
  return 'Beginner';
}

// ---- Weekly leagues (Duolingo-style competitive layer) ------------------

export const LEAGUES = [
  { id: 'clay', name: 'Clay', icon: '🟤', color: '#B07C55' },
  { id: 'copper', name: 'Copper', icon: '🟠', color: '#C98A3B' },
  { id: 'silver', name: 'Silver', icon: '⚪', color: '#C3BECB' },
  { id: 'gold', name: 'Gold', icon: '🟡', color: '#E2A13C' },
  { id: 'sapphire', name: 'Sapphire', icon: '🔵', color: '#7FA6D8' },
  { id: 'ruby', name: 'Ruby', icon: '🔴', color: '#DE8496' },
  { id: 'emerald', name: 'Emerald', icon: '🟢', color: '#93BE72' },
] as const;

export type LeagueId = (typeof LEAGUES)[number]['id'];

export const getLeague = (id: string) =>
  LEAGUES.find((l) => l.id === id) ?? LEAGUES[0];

export function promote(current: LeagueId): LeagueId {
  const i = LEAGUES.findIndex((l) => l.id === current);
  return LEAGUES[Math.min(i + 1, LEAGUES.length - 1)].id;
}

export function demote(current: LeagueId): LeagueId {
  const i = LEAGUES.findIndex((l) => l.id === current);
  return LEAGUES[Math.max(i - 1, 0)].id;
}

/** Gems awarded for a completed lesson, scaled by accuracy. */
export function gemsForLesson(accuracy: number, isReview: boolean): number {
  const base = isReview ? 8 : 5;
  const bonus = accuracy >= 1 ? 5 : accuracy >= 0.8 ? 2 : 0;
  return base + bonus;
}
