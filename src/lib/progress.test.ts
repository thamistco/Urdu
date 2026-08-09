import { describe, expect, it } from 'vitest';

import { ALL_LESSONS } from '../data/units';
import { pathMoveNotice } from './progress';

/**
 * The rule is "exactly once, and never to somebody it is not true of".
 *
 * Both halves have teeth. A notice that fires twice is worse than none, because
 * the second one teaches the learner that the app's messages are noise. A notice
 * that fires for a new learner is a false statement about their account on their
 * first session.
 *
 * The lesson ids here are derived from the real path rather than typed out. A
 * test that hardcodes `v-first-words-p4` passes forever after that id stops
 * being the example, and the thing it is guarding — that the path moves — is
 * precisely the thing that will invalidate a hardcoded id.
 */

const KNOWN = new Set(ALL_LESSONS.map((l) => l.id));

/** Ids from a path that no longer exists.
 *
 *  `coverTopics` caps a topic at 3 parts and numbers them `-p2`, `-p3`, so a
 *  `-p4` suffix names a lesson from the 608-lesson era by construction rather
 *  than by assumption. Asserted below rather than assumed, because "by
 *  construction" is how a test quietly stops testing. */
const preSplit = (n: number) =>
  ALL_LESSONS.filter((l) => l.kind === 'vocab')
    .slice(0, n)
    .map((l) => `${l.id}-p4`);

const profile = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { best: 100, done: 1 }]));

describe('the ids this test is built on', () => {
  it('really are absent from the path', () => {
    // If this fails, every "gone" assertion below is vacuous.
    for (const id of preSplit(5)) expect(KNOWN.has(id)).toBe(false);
  });

  it('really are present for the ids taken straight from the path', () => {
    for (const l of ALL_LESSONS.slice(0, 5)) expect(KNOWN.has(l.id)).toBe(true);
  });
});

describe('telling a learner their progress moved', () => {
  it('says nothing to a learner who has finished nothing', () => {
    expect(pathMoveNotice({ completed: {}, skipped: {}, known: KNOWN, seen: false })).toBeNull();
  });

  it('says nothing to a learner whose finished lessons all still exist', () => {
    const completed = profile(ALL_LESSONS.slice(0, 12).map((l) => l.id));
    expect(pathMoveNotice({ completed, skipped: {}, known: KNOWN, seen: false })).toBeNull();
  });

  it('tells a learner whose finished lessons were regrouped away', () => {
    const completed = profile([...ALL_LESSONS.slice(0, 8).map((l) => l.id), ...preSplit(4)]);
    const notice = pathMoveNotice({ completed, skipped: {}, known: KNOWN, seen: false });
    expect(notice).not.toBeNull();
    expect(notice?.gone).toBe(4);
    expect(notice?.ticked).toBe(12);
  });

  it('counts a lesson skipped at onboarding as progress that can move', () => {
    // A heritage learner ticks lessons without attempting them. Their
    // percentage falls the same way, so they are owed the same sentence.
    const notice = pathMoveNotice({
      completed: {},
      skipped: Object.fromEntries(preSplit(3).map((id) => [id, true])),
      known: KNOWN,
      seen: false,
    });
    expect(notice?.gone).toBe(3);
    expect(notice?.ticked).toBe(3);
  });

  it('counts a lesson in both maps once', () => {
    const ids = preSplit(2);
    const notice = pathMoveNotice({
      completed: profile(ids),
      skipped: Object.fromEntries(ids.map((id) => [id, true])),
      known: KNOWN,
      seen: false,
    });
    expect(notice?.ticked).toBe(2);
    expect(notice?.gone).toBe(2);
  });

  it('fires exactly once — the second launch is silent', () => {
    const completed = profile(preSplit(6));
    const first = pathMoveNotice({ completed, skipped: {}, known: KNOWN, seen: false });
    expect(first).not.toBeNull();

    // `seen` is what dismissal sets. Nothing else about the profile changes,
    // which is the case that matters: the learner has not done a lesson since.
    const second = pathMoveNotice({ completed, skipped: {}, known: KNOWN, seen: true });
    expect(second).toBeNull();
  });

  it('stays silent through every later launch, not just the second', () => {
    const completed = profile(preSplit(6));
    for (let launch = 0; launch < 20; launch++) {
      expect(pathMoveNotice({ completed, skipped: {}, known: KNOWN, seen: true })).toBeNull();
    }
  });

  it('says nothing when handed an empty path rather than claiming it all vanished', () => {
    const completed = profile(ALL_LESSONS.slice(0, 5).map((l) => l.id));
    expect(pathMoveNotice({ completed, skipped: {}, known: new Set(), seen: false })).toBeNull();
  });
});
