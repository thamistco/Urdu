import { describe, expect, it } from 'vitest';

import {
  HEARTS_MAX,
  HEART_REGEN_MINUTES,
  REFILL_COST,
  demote,
  gemsForLesson,
  gemsShortOfRefill,
  getLeague,
  LEAGUES,
  levelFromXp,
  levelProgress,
  levelTitle,
  minutesUntilNextHeart,
  promote,
  xpForLevel,
} from './gamification';
import { ALL_LESSONS } from '../data/units';

/**
 * The XP curve, the league ladder and the gem payout.
 *
 * These decide what a learner sees after every single lesson, and until now
 * nothing checked them — the project had `check:*` scripts for content, audio,
 * pixels and the live site, and no unit tests at all for its own arithmetic.
 * The tests assert *properties* the design promises rather than transcribing
 * the implementation back at itself: a test that says `xpForLevel(4) === 360`
 * only proves the function still does what it does, and breaks on any tuning.
 */

describe('the level curve', () => {
  it('starts at level 1 with no XP owed', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelFromXp(0)).toBe(1);
  });

  it('never asks for less XP to reach a higher level', () => {
    for (let level = 1; level < 60; level++) {
      expect(xpForLevel(level + 1)).toBeGreaterThan(xpForLevel(level));
    }
  });

  it('gets harder as it goes — each level costs more than the one before', () => {
    // The stated design: early levels come fast for momentum, later ones
    // stretch out. That is a claim about the *second* difference, not the first.
    for (let level = 2; level < 40; level++) {
      const thisStep = xpForLevel(level + 1) - xpForLevel(level);
      const lastStep = xpForLevel(level) - xpForLevel(level - 1);
      expect(thisStep).toBeGreaterThan(lastStep);
    }
  });

  it('agrees with itself: the level for a threshold is the level it unlocks', () => {
    for (let level = 1; level < 40; level++) {
      expect(levelFromXp(xpForLevel(level))).toBe(level);
      // One XP short is still the previous level.
      if (level > 1) expect(levelFromXp(xpForLevel(level) - 1)).toBe(level - 1);
    }
  });
});

describe('progress within a level', () => {
  it('reports a ratio between 0 and 1 at every XP total', () => {
    for (let xp = 0; xp < 20_000; xp += 37) {
      const { ratio } = levelProgress(xp);
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(1);
    }
  });

  it('is exactly at the start of a level when the level is just reached', () => {
    for (let level = 2; level < 20; level++) {
      const { into, ratio } = levelProgress(xpForLevel(level));
      expect(into).toBe(0);
      expect(ratio).toBe(0);
    }
  });

  it('never reports progress past the next threshold', () => {
    for (let xp = 0; xp < 20_000; xp += 53) {
      const { into, span } = levelProgress(xp);
      expect(into).toBeLessThan(span);
    }
  });
});

describe('level titles', () => {
  it('never goes backwards as the level rises', () => {
    const order = ['Beginner', 'Apprentice', 'Rising', 'Confident', 'Fluent Reader', 'Calligrapher', 'Master'];
    let lastSeen = 0;
    for (let level = 1; level <= 40; level++) {
      const rank = order.indexOf(levelTitle(level));
      expect(rank).toBeGreaterThanOrEqual(0); // no title outside the ladder
      expect(rank).toBeGreaterThanOrEqual(lastSeen);
      lastSeen = rank;
    }
  });

  // URD-004: the top title used to sit at level 25 (18,000 XP) against a
  // course that pays out about 7,220 XP finished start to finish — nobody
  // could ever see it. Both numbers are derived from the real thing they
  // describe, not hardcoded, so this stays true the next time the course or
  // the curve changes rather than needing to be re-measured by hand — which
  // is exactly how it went stale the first time (measured at 11,552 XP course
  // / level 20 reachable when this item was written, 7,220 / level 16 by the
  // time it was worked, worse both times, never better).
  it('the top title is reachable by finishing the course', () => {
    const topTitle = 'Master';
    // The lowest level carrying the top title — levelTitle's own thresholds,
    // not a number copied out of gamification.ts by hand. Capped: THE CRITIC
    // found that a future rename of the top tier's string (no level ever
    // producing "Master" again) turns this from a failing assertion into an
    // uncapped loop that hangs the whole run, past what vitest's own timeout
    // can interrupt since it depends on the same event loop. Failing loudly
    // inside this test is exactly what a test is for; hanging the suite is not.
    let topTitleLevel = 1;
    while (levelTitle(topTitleLevel) !== topTitle) {
      topTitleLevel++;
      if (topTitleLevel > 1000) throw new Error(`no level up to 1000 carries the title "${topTitle}"`);
    }

    const courseTotalXp = ALL_LESSONS.reduce((n, l) => n + l.xp, 0);

    expect(xpForLevel(topTitleLevel)).toBeLessThanOrEqual(courseTotalXp);
  });
});

describe('the league ladder', () => {
  it('has no duplicate ids', () => {
    expect(new Set(LEAGUES.map((l) => l.id)).size).toBe(LEAGUES.length);
  });

  it('falls back to the first league for an id it does not know', () => {
    // A stored league id from an older build must not crash the profile screen.
    expect(getLeague('not-a-league')).toBe(LEAGUES[0]);
  });

  it('stops at the top rather than running off the end', () => {
    const top = LEAGUES[LEAGUES.length - 1].id;
    expect(promote(top)).toBe(top);
  });

  it('stops at the bottom rather than running off the start', () => {
    const bottom = LEAGUES[0].id;
    expect(demote(bottom)).toBe(bottom);
  });

  it('promote and demote are inverses in the middle of the ladder', () => {
    for (let i = 1; i < LEAGUES.length - 1; i++) {
      const id = LEAGUES[i].id;
      expect(demote(promote(id))).toBe(id);
      expect(promote(demote(id))).toBe(id);
    }
  });
});

describe('gems for a lesson', () => {
  it('never pays a negative amount, at any accuracy', () => {
    for (const review of [true, false]) {
      for (let accuracy = 0; accuracy <= 1.0001; accuracy += 0.05) {
        expect(gemsForLesson(accuracy, review)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('pays a whole number — gems are counted, not measured', () => {
    for (let accuracy = 0; accuracy <= 1.0001; accuracy += 0.05) {
      expect(Number.isInteger(gemsForLesson(accuracy, false))).toBe(true);
    }
  });

  it('never pays less for a better performance', () => {
    for (const review of [true, false]) {
      let previous = -1;
      for (let accuracy = 0; accuracy <= 1.0001; accuracy += 0.05) {
        const paid = gemsForLesson(accuracy, review);
        expect(paid).toBeGreaterThanOrEqual(previous);
        previous = paid;
      }
    }
  });
});

describe('the hearts economy', () => {
  it('allows at least one mistake before a lesson ends', () => {
    // A max of 1 would mean the first wrong answer ends the session, which is
    // not what any screen's copy says.
    expect(HEARTS_MAX).toBeGreaterThan(1);
  });

  // URD-006: the refill button was correctly `disabled={gems < 40}`, but
  // the lockout screen said nothing else — a learner who could not afford
  // it saw a button that did not work and no explanation of why or what to
  // do instead. A fresh profile starts at 20 gems (`useProgressStore.ts`)
  // against a 40-gem refill, so this was not an edge case: it was close to
  // every new learner's first lockout.
  it('a fresh profile is either able to refill, or told something real instead', () => {
    const freshGems = 20; // useProgressStore's starting balance
    const canAfford = freshGems >= REFILL_COST;
    // The two branches this item's own fix reads from. Whichever is true,
    // there is a real thing on screen — a working button, or a wait that
    // means something.
    if (!canAfford) {
      expect(gemsShortOfRefill(freshGems)).toBeGreaterThan(0);
      // THE CRITIC: `toBeGreaterThanOrEqual(0)` here would pass against any
      // implementation, including a broken one — `minutesUntilNextHeart` is
      // clamped to `[0, HEART_REGEN_MINUTES]` regardless of what its inner
      // arithmetic does, so that assertion could never fail. A heart just
      // lost (`now` passed as `heartsUpdatedAt`, zero elapsed) has to wait
      // the full cycle — that is the number the lockout screen actually
      // shows a learner in this exact situation, so it is the number worth
      // asserting.
      const now = Date.now();
      expect(minutesUntilNextHeart(now, now)).toBe(HEART_REGEN_MINUTES);
    } else {
      expect(gemsShortOfRefill(freshGems)).toBe(0);
    }
  });

  it('gemsShortOfRefill is zero exactly when a refill is affordable', () => {
    for (let gems = 0; gems <= REFILL_COST + 10; gems++) {
      expect(gemsShortOfRefill(gems) === 0).toBe(gems >= REFILL_COST);
    }
  });

  it('the wait for the next heart never goes negative or past one full cycle', () => {
    const now = Date.now();
    for (let minutesAgo = -10; minutesAgo <= HEART_REGEN_MINUTES + 10; minutesAgo++) {
      const wait = minutesUntilNextHeart(now - minutesAgo * 60000, now);
      expect(wait).toBeGreaterThanOrEqual(0);
      expect(wait).toBeLessThanOrEqual(HEART_REGEN_MINUTES);
    }
  });

  it('counts down as time passes since the hearts clock last reset', () => {
    const now = Date.now();
    const justLost = minutesUntilNextHeart(now, now);
    const almostThere = minutesUntilNextHeart(now - (HEART_REGEN_MINUTES - 1) * 60000, now);
    expect(almostThere).toBeLessThan(justLost);
  });
});
