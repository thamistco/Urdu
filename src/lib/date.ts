/** Small date helpers for streak + daily-goal logic (local time). */

export function dayKey(d: Date = new Date()): string {
  // local YYYY-MM-DD
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(aKey + 'T00:00:00');
  const b = new Date(bKey + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function isSameDay(aKey: string, bKey: string): boolean {
  return aKey === bKey;
}

/** Rolling 7-day window ending today, oldest first. */
export function lastSevenDayKeys(today: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}
