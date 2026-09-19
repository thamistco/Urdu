/**
 * What finishing a lesson pays when you have already finished it.
 *
 * ## The hole this closes
 *
 * `finishLesson` paid a lesson's full XP and gems every time it was completed,
 * with no idea whether it had been completed before. The course's 29 Reading
 * and Talk lessons are a single exercise each — one passage, one screen — and
 * pay 25 XP, more than the 18.8 a forty-exercise vocabulary lesson pays.
 *
 * Driven against the built app, three taps finished "Reading: My family" and
 * banked 30 XP and 10 gems, repeatable without limit:
 *
 *     run 1: 3 taps · totalXp  0 -> 30 · weeklyXp  0 -> 30
 *     run 2: 3 taps · totalXp 30 -> 60 · weeklyXp 30 -> 60
 *     run 3: 3 taps · totalXp 60 -> 90 · weeklyXp 60 -> 90
 *
 * League promotion needs 150 weekly XP, so fifteen taps won a week in a table
 * the app presents as competition. The whole course pays 7,290 XP and level 16
 * needs 7,200, so 729 taps matched a complete playthrough. A heart refill costs
 * 40 gems, so twelve taps bought one, which undoes the hearts economy.
 *
 * ## The rule
 *
 * First completions are untouched — nothing about progressing through the
 * course changes. A repeat is capped by the work actually done in it, at the
 * rate the Practice tab already pays for the same work: `practice-review` is
 * 20 XP for 10 exercises, so two XP an exercise, and a gem an exercise.
 *
 * The cap is a cap, never a top-up: a forty-exercise lesson replayed is forty
 * exercises of real work and still pays what it always did. Only rewards that
 * outran their own effort come down, which is exactly the shape of the hole.
 */
export const REPEAT_XP_PER_EXERCISE = 2;
export const REPEAT_GEMS_PER_EXERCISE = 1;

export type Reward = { xp: number; gems: number };

export function repeatReward(alreadyCompleted: boolean, earned: Reward & { exercises: number }): Reward {
  if (!alreadyCompleted) return { xp: earned.xp, gems: earned.gems };
  return {
    xp: Math.min(earned.xp, earned.exercises * REPEAT_XP_PER_EXERCISE),
    gems: Math.min(earned.gems, earned.exercises * REPEAT_GEMS_PER_EXERCISE),
  };
}
