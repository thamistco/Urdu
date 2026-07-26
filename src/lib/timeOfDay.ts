/**
 * The current local time, as a fractional hour (e.g. 14.5 for 2:30pm) — the
 * continuous input `LatticeBackground` interpolates its sky against, so the
 * scenery shifts steadily through the day rather than jumping between a
 * handful of fixed states.
 */
export function currentHour(date: Date = new Date()): number {
  return date.getHours() + date.getMinutes() / 60;
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * A fixed representative hour for each named time of day — regular sunrise
 * (6am) and sunset (6pm), not any particular date or place — for pinning one
 * sky explicitly (previews, screenshots) instead of reading the clock.
 */
export const TIME_OF_DAY_HOUR: Record<TimeOfDay, number> = {
  night: 0,
  dawn: 6,
  day: 12,
  dusk: 18,
};
