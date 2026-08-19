import { describe, expect, it } from 'vitest';

import { ALL_LESSONS } from '../data/units';
import { migrateProgress, needsPathMoveNotice } from './progress';

/**
 * The rule is "once per move, and never to somebody it is not true of".
 *
 * Both halves have teeth. A notice that fires twice is worse than none, because
 * the second one teaches the learner that the app's messages are noise. A notice
 * that fires for a new learner is a false statement about their account on their
 * first session.
 *
 * The first version of these tests was ten green assertions over a function that
 * could not see the learner the feature was written for, because both the
 * function and the tests asked the same wrong question — which of your ticked
 * lesson ids no longer exists. Review measured the answer for the pre-split
 * path: zero of its 237 ids are missing today, so that learner was silently
 * excluded while the suite passed. The first test below is that learner, and it
 * is the reason this file exists in this shape.
 */

const PATH = ALL_LESSONS.length;
const profile = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { best: 100, done: 1 }]));

/** A learner whose every finished lesson still exists under the same id. This
 *  is not an edge case; it is the majority, because `coverTopics` gives a
 *  topic's first part the topic's own id. */
const survivor = profile(ALL_LESSONS.slice(0, 40).map((l) => l.id));

describe('the premise these tests rest on', () => {
  it('the surviving profile really has nothing missing', () => {
    // If this fails, the first test below is passing for the wrong reason.
    const known = new Set(ALL_LESSONS.map((l) => l.id));
    for (const id of Object.keys(survivor)) expect(known.has(id)).toBe(true);
  });
});

describe('telling a learner their place on the path moved', () => {
  it('tells a learner whose lessons all still exist but whose path grew', () => {
    // The whole finding. Their ticks are live, their denominators are not.
    expect(
      needsPathMoveNotice({ completed: survivor, skipped: {}, pathSize: PATH, seen: false, lastPathSize: null })
    ).toBe(true);
  });

  it('tells a learner whose path changed size under them', () => {
    expect(
      needsPathMoveNotice({ completed: survivor, skipped: {}, pathSize: PATH, seen: false, lastPathSize: 608 })
    ).toBe(true);
    expect(
      needsPathMoveNotice({ completed: survivor, skipped: {}, pathSize: PATH, seen: false, lastPathSize: 174 })
    ).toBe(true);
  });

  it('says nothing to a learner who was last here on this same path', () => {
    expect(
      needsPathMoveNotice({ completed: survivor, skipped: {}, pathSize: PATH, seen: false, lastPathSize: PATH })
    ).toBe(false);
  });

  it('says nothing to a learner who has finished nothing', () => {
    // A fresh profile. It has never seen a path, so no path moved under it.
    expect(needsPathMoveNotice({ completed: {}, skipped: {}, pathSize: PATH, seen: false, lastPathSize: null })).toBe(
      false
    );
  });

  it('counts a lesson skipped at onboarding as a place on the path', () => {
    // A heritage learner ticks lessons without attempting them. Their unit
    // percentages fall the same way, so they are owed the same sentence.
    expect(
      needsPathMoveNotice({
        completed: {},
        skipped: { 'v-first-words': true, 'v-colours': true },
        pathSize: PATH,
        seen: false,
        lastPathSize: null,
      })
    ).toBe(true);
  });

  it('fires once — the second launch is silent', () => {
    const args = { completed: survivor, skipped: {}, pathSize: PATH, lastPathSize: null };
    expect(needsPathMoveNotice({ ...args, seen: false })).toBe(true);
    // `seen` is what dismissal sets. Nothing else about the profile changes,
    // which is the case that matters: the learner has not done a lesson since.
    expect(needsPathMoveNotice({ ...args, seen: true })).toBe(false);
  });

  it('stays silent through every later launch, not just the second', () => {
    for (let launch = 0; launch < 20; launch++) {
      expect(
        needsPathMoveNotice({ completed: survivor, skipped: {}, pathSize: PATH, seen: true, lastPathSize: null })
      ).toBe(false);
    }
  });

  it('re-arms when the path moves again', () => {
    // Dismissal records the path size as well as the flag, so the *next*
    // regroup is announced without anyone remembering to bump a version. This
    // is the difference between a fix and a fix that only works once.
    const dismissed = { completed: survivor, skipped: {}, pathSize: PATH, seen: true, lastPathSize: PATH };
    expect(needsPathMoveNotice(dismissed)).toBe(false);
    expect(needsPathMoveNotice({ ...dismissed, seen: false, pathSize: PATH + 60 })).toBe(true);
  });

  it('says nothing when handed an empty path rather than claiming it all changed', () => {
    expect(
      needsPathMoveNotice({ completed: survivor, skipped: {}, pathSize: 0, seen: false, lastPathSize: null })
    ).toBe(false);
  });
});

/**
 * URD-014: the v1 → v2 migration empties `completedLessons`/`skippedLessons`
 * because old positional ids genuinely cannot be translated — correct — but
 * that also destroys the only evidence `needsPathMoveNotice` reads, so the
 * learner who lost the most was told the least. `migrateProgress` is the
 * function `useProgressStore.ts`'s `persist` config calls; these tests drive
 * it directly rather than through zustand's middleware.
 */
describe('migrating a profile whose lesson ids were positional', () => {
  it('a v1 profile with completions is told something', () => {
    // The item's own acceptance test, verbatim: the whole point is that
    // *some* signal survives the wipe, even though `needsPathMoveNotice`
    // itself — reading the now-empty maps this same migration just
    // produced — cannot see it.
    const migrated = migrateProgress({ completedLessons: survivor, skippedLessons: {} }, 1);
    expect(migrated.ticksWipedByMigration).toBe(true);
  });

  it('empties completedLessons and skippedLessons — the old ids really cannot be translated', () => {
    const migrated = migrateProgress({ completedLessons: survivor, skippedLessons: { 'v-1': true } }, 1);
    expect(migrated.completedLessons).toEqual({});
    expect(migrated.skippedLessons).toEqual({});
  });

  it('a v0 profile is migrated the same way as v1 — both predate content-derived ids', () => {
    const migrated = migrateProgress({ completedLessons: survivor, skippedLessons: {} }, 0);
    expect(migrated.ticksWipedByMigration).toBe(true);
    expect(migrated.completedLessons).toEqual({});
  });

  it('says nothing to a v1 profile that had nothing ticked — there is nothing to lose', () => {
    // Matches needsPathMoveNotice's own "nothing ticked" branch: a profile
    // that finished nothing is migrated the same way and, correctly, told
    // nothing new.
    const migrated = migrateProgress({ completedLessons: {}, skippedLessons: {} }, 1);
    expect(migrated.ticksWipedByMigration).toBe(false);
  });

  it('counts a skipped-at-onboarding lesson as something to lose, same as a completed one', () => {
    const migrated = migrateProgress({ completedLessons: {}, skippedLessons: { 'v-1': true } }, 1);
    expect(migrated.ticksWipedByMigration).toBe(true);
  });

  it('a v2 profile is not wiped — only pre-content-id profiles are', () => {
    const migrated = migrateProgress({ completedLessons: survivor, skippedLessons: {} }, 2);
    expect(migrated.completedLessons).toBe(survivor);
    // No claim about `ticksWipedByMigration` here: the v2→v3 branch does not
    // set it, and the store's own default (`false`) fills the gap on merge
    // — this function's contract is only about what it *changes*.
    expect(migrated.ticksWipedByMigration).toBeUndefined();
  });

  it('still resets the path notice for every migrated profile, wiped or not', () => {
    // v2→v3 (nothing dropped) and v0/v1→v2 (dropped) both owe a fresh look
    // at the path-moved notice — that part of the fix this item is not about.
    for (const from of [0, 1, 2]) {
      const migrated = migrateProgress({ completedLessons: {}, skippedLessons: {} }, from);
      expect(migrated.pathNoticeSeen).toBe(false);
      expect(migrated.pathSize).toBeNull();
    }
  });
});
