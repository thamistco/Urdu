/**
 * Which part of the day it is right now, in the learner's own local time —
 * used by `LatticeBackground` to pick the sky's mood. Four coarse buckets,
 * not a smooth animation: the sky is meant to change between sessions
 * depending on when someone actually practices, not visibly move during one,
 * so a bucket read once per screen mount is honest about what this does.
 */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export function currentTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}
