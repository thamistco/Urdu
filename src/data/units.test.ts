import { describe, expect, it } from 'vitest';
import { unitsForTrack } from './units';

const SCRIPT = /[؀-ۿ]/;

describe('the Roman track path', () => {
  // QA, 2026-10-15: grammar lessons titled "The نے construction" showed the
  // script on the Roman track's Home, a track that promises none.
  it('shows no Urdu script in any unit or lesson title or subtitle', () => {
    const leaks: string[] = [];
    for (const u of unitsForTrack('roman')) {
      for (const t of [u.title, u.subtitle]) if (SCRIPT.test(t)) leaks.push(`${u.id}: ${t}`);
      for (const l of u.lessons) for (const t of [l.title, l.subtitle]) if (SCRIPT.test(t)) leaks.push(`${l.id}: ${t}`);
    }
    expect(leaks).toEqual([]);
  });
});
