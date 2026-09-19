import { describe, expect, it } from 'vitest';

import { ALL_LESSONS } from '../data/units';
import { needsPathMoveNotice } from './progress';

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
