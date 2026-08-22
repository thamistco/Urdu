import { describe, it, expect } from 'vitest';
import { UNITS, ALL_LESSONS } from '../data/units';
import {
  taughtInUnit,
  taughtUpTo,
  taughtConceptsUpTo,
  prioritizedPool,
  reviewWordPool,
  reviewLetterPool,
  reviewLetterShare,
} from './review';

describe('taughtInUnit', () => {
  it('scopes to the unit a review lesson actually closes, not the whole course', () => {
    // u6 · "Gender & Number": one letter lesson (group 5), two colour-topic
    // vocab lessons, two grammar lessons, one sentence lesson, then its review.
    const u6 = taughtInUnit('rev-gender-and-number');
    expect(u6).not.toBeNull();
    expect(u6!.letters).toEqual(['toe', 'zoe', 'ain', 'ghain']);
    // Real course numbers, not guessed: the colours topic split across two
    // lessons teaches 20 words total by the time this review is reached.
    expect(u6!.words.length).toBe(20);
  });

  it('is empty, not a crash, for a unit that teaches no vocabulary of its own', () => {
    // u10 · "Your First Readings": reading, sentence and dialogue lessons
    // only — no letters or vocab lesson at all. This is the item's own named
    // case for why the fallback to the wider course has to exist.
    const u10 = taughtInUnit('rev-your-first-readings');
    expect(u10).not.toBeNull();
    expect(u10!.words).toEqual([]);
    expect(u10!.letters).toEqual([]);
  });

  it('scales to a unit with many vocabulary lessons', () => {
    // u29 · "Senses & Seasons": six vocab topics split across lessons, 96
    // words by the time its review is reached — re-measured after URD-A02
    // split the old, single 'u39' (117 words, the previous holder of this
    // test's target) into two smaller units, each sized and reviewed on its
    // own half; see units.ts's own comment on the split for why that is the
    // fix working as intended, not a regression to route around.
    const u29 = taughtInUnit('rev-senses-and-seasons');
    expect(u29!.words.length).toBeGreaterThan(50);
  });

  it('returns null for a lesson id placed in no unit', () => {
    expect(taughtInUnit('practice-review')).toBeNull();
    expect(taughtInUnit('not-a-real-lesson-id')).toBeNull();
  });

  it('never invents a unit that is not actually in the course', () => {
    // Sanity check on the fixture itself, so the tests above stay meaningful
    // if the course is ever restructured.
    expect(UNITS.some((u) => u.id === 'u6')).toBe(true);
    expect(UNITS.some((u) => u.id === 'u10')).toBe(true);
  });
});

describe('prioritizedPool', () => {
  it('exhausts the highest-priority tier before drawing from the next', () => {
    const pool = prioritizedPool(
      [
        ['a', 'b'],
        ['c', 'd', 'e'],
      ],
      'seed-a'
    );
    expect(pool.slice(0, 2).sort()).toEqual(['a', 'b']);
    expect(pool.slice(2).sort()).toEqual(['c', 'd', 'e']);
  });

  it('dedupes an id that appears in more than one tier, keeping it in the earliest', () => {
    const pool = prioritizedPool(
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
      'seed-b'
    );
    expect(pool).toHaveLength(3);
    expect(new Set(pool)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('skips an empty tier without disturbing tier order', () => {
    const pool = prioritizedPool([[], ['a', 'b'], [], ['c']], 'seed-c');
    expect(pool.slice(0, 2).sort()).toEqual(['a', 'b']);
    expect(pool[2]).toBe('c');
  });

  it('is deterministic for the same tiers and seed', () => {
    const tiers = [
      ['a', 'b', 'c', 'd', 'e'],
      ['f', 'g'],
    ];
    expect(prioritizedPool(tiers, 'same-seed')).toEqual(prioritizedPool(tiers, 'same-seed'));
  });

  it('shuffles within a tier rather than preserving input order verbatim', () => {
    // Not guaranteed for any single seed, but true across enough of them —
    // otherwise this is a sort, not a shuffle, and every review would draw
    // the same handful of words in the same order every time it regenerates.
    const tier = Array.from({ length: 30 }, (_, i) => `w${i}`);
    const orders = new Set(Array.from({ length: 10 }, (_, i) => prioritizedPool([tier], `s${i}`).join(',')));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('reviewWordPool / reviewLetterPool — a review draws mostly from the unit it closes', () => {
  it('rev-gender-and-number: every word offered comes from u6, not the wider course', () => {
    // A default-sized review (size 9) asks for Math.floor(9 / 2) = 4 words.
    // u6 alone teaches 20 — comfortably enough to fill that without ever
    // reaching for the course-wide fallback.
    const pool = reviewWordPool(
      'rev-gender-and-number',
      new Set(),
      ['w-from-elsewhere-1', 'w-from-elsewhere-2'],
      [],
      ['w-corpus-1']
    );
    const unitWords = new Set(taughtInUnit('rev-gender-and-number')!.words);
    const offered = pool.slice(0, 4);
    expect(offered.every((id) => unitWords.has(id))).toBe(true);
  });

  it('rev-gender-and-number: letters also come from u6 first', () => {
    const pool = reviewLetterPool('rev-gender-and-number', new Set(), [], ['toe-from-course-wide'], ['corpus-letter']);
    // u6 teaches exactly 4 letters (toe, zoe, ain, ghain) — a review asking
    // for up to Math.ceil(9 / 2) = 5 letters gets all 4 of them before ever
    // touching the fallback tiers.
    expect(pool.slice(0, 4).sort()).toEqual(['ain', 'ghain', 'toe', 'zoe']);
  });

  it('rev-your-first-readings: a unit with no vocabulary of its own falls back to the course-wide pool', () => {
    const courseWide = ['w-course-a', 'w-course-b', 'w-course-c'];
    const pool = reviewWordPool('rev-your-first-readings', new Set(), courseWide, [], ['w-corpus']);
    expect(pool.slice(0, 3).sort()).toEqual([...courseWide].sort());
  });

  it('with no lesson context at all (practice review), falls back straight to the corpus', () => {
    const pool = reviewWordPool(undefined, new Set(), ['w-course-wide'], [], ['w-corpus-only']);
    expect(pool).toEqual(['w-course-wide', 'w-corpus-only']);
  });

  it('restricts to known material the moment anything reachable has been graded, unit-known first', () => {
    const unitWords = taughtInUnit('rev-gender-and-number')!.words;
    const courseWide = [...unitWords, 'w-course-wide-only'];
    const known = new Set([unitWords[3], 'w-course-wide-only']);
    const pool = reviewWordPool('rev-gender-and-number', known, courseWide, [], ['w-corpus']);
    // Both known ids appear, the unit one first — but nothing ungraded does,
    // even though the unit alone has 20 words it could otherwise offer.
    expect(pool).toEqual([unitWords[3], 'w-course-wide-only']);
  });

  it("regression: grading only material outside this unit never lets the unit's own ungraded words leak in", () => {
    // The exact shape `check-srs.js` guards against: a learner graded on
    // words from a *different* unit than the one this review closes. Before
    // this fix, once the unit's own known-words tier came up empty, the pool
    // widened to the unit's full taught list — untaught-to-the-learner but
    // taught-by-the-course — which is precisely the material a review with
    // nothing due is supposed to stay off of.
    const unitWords = taughtInUnit('rev-gender-and-number')!.words;
    const knownElsewhere = 'w-known-from-a-different-unit';
    const courseWide = [...unitWords, knownElsewhere];
    const known = new Set([knownElsewhere]);
    const pool = reviewWordPool('rev-gender-and-number', known, courseWide, [], ['w-corpus']);
    expect(pool).toEqual([knownElsewhere]);
  });

  it('regression (THE CRITIC): grading words but zero letters must not unlock every untaught letter', () => {
    // The BLOCKING finding: a learner graded on words, never on a letter —
    // reachable by studying the Roman track (which drops letter lessons from
    // the path entirely) and then switching to Script or Both, reaching the
    // very next review in exactly this state. Deciding "is anything known"
    // per type, rather than jointly, found the letter side empty and
    // widened it to every letter ever taught — this asserts the letter pool
    // instead stays correctly empty (nothing graded on that side, and
    // nothing is manufactured to fill it here — that is the generator's
    // topup-from-words job, not this pool's).
    const unitWords = taughtInUnit('rev-food-and-nature')!.words;
    const courseWords = [...unitWords, 'w-elsewhere'];
    const courseLetters = ['fe', 'qaaf', 'kaaf', 'gaaf'];
    const known = new Set([unitWords[0], 'w-elsewhere']); // words only, no letters
    const letterPool = reviewLetterPool('rev-food-and-nature', known, courseWords, courseLetters, ['corpus-letter']);
    expect(letterPool).toEqual([]);
  });

  it('regression (THE CRITIC): grading letters but zero words must not unlock every untaught word', () => {
    // The mirror image of the above, for completeness — the joint check has
    // to work symmetrically in both directions.
    const unitLetters = taughtInUnit('rev-gender-and-number')!.letters;
    const courseWords = ['w-untaught-1', 'w-untaught-2'];
    const courseLetters = [...unitLetters, 'l-elsewhere'];
    const known = new Set([unitLetters[0], 'l-elsewhere']); // letters only, no words
    const wordPool = reviewWordPool('rev-gender-and-number', known, courseWords, courseLetters, ['corpus-word']);
    expect(wordPool).toEqual([]);
  });
});

describe("reviewLetterShare — a review's letter share decays once the alphabet is behind it", () => {
  it('is higher for a review early in the course than one late in it', () => {
    // URD-017: the old split was a flat Math.ceil(n/2)/Math.floor(n/2)
    // regardless of how far the review sits from the alphabet units. Real
    // course data instead: rev-first-faces (u1) is still mid-alphabet, so a
    // meaningful share of everything taught so far is still letters;
    // rev-the-wider-world (u41, the course's last unit) is thirty-two units
    // past the last letter lesson, so letters are a rounding error against
    // the words taught since.
    const early = taughtUpTo('rev-first-faces');
    const late = taughtUpTo('rev-the-wider-world');
    const earlyShare = reviewLetterShare(early.words, early.letters);
    const lateShare = reviewLetterShare(late.words, late.letters);
    expect(earlyShare).toBeGreaterThan(lateShare);
  });

  it('reaches near zero by the units this measurement covers', () => {
    const late = taughtUpTo('rev-the-wider-world');
    expect(reviewLetterShare(late.words, late.letters)).toBeLessThan(0.05);
  });

  it("is exactly the letters' share of everything taught, not some other function of it", () => {
    expect(reviewLetterShare(['w1', 'w2', 'w3'], ['l1'])).toBeCloseTo(0.25);
    expect(reviewLetterShare([], [])).toBe(0.5);
  });
});

describe('URD-026: taughtConceptsUpTo', () => {
  // Real path order (measured directly, not assumed): g-pronouns is the
  // first grammar concept taught; g-future is the 16th of 25, many lessons
  // later. Named explicitly rather than picked arbitrarily, the same way
  // taughtUpTo's own tests use real early/late review lessons.
  it("does not include a concept the path hasn't reached yet", () => {
    const early = taughtConceptsUpTo('g-pronouns');
    expect(early.has('g-future')).toBe(false);
    expect(early.has('g-obligation')).toBe(false);
  });

  it('includes a concept by the time its own lesson is reached — inclusive of the lesson itself', () => {
    // Matches taughtUpTo's own inclusive boundary (a vocab lesson's own
    // words count as taught by the time that lesson is reached); grammar
    // concepts follow the same rule; a concept lesson's own reinforcement
    // climb draws sentences tagged to itself, which would be impossible if
    // "reached" excluded the lesson's own teaching.
    const atItself = taughtConceptsUpTo('g-future');
    expect(atItself.has('g-future')).toBe(true);
    expect(atItself.has('g-pronouns')).toBe(true); // taught long before it
    expect(atItself.has('g-obligation')).toBe(false); // taught one lesson later
  });

  it('accumulates monotonically along the real path — never loses a concept already taught', () => {
    const grammarLessons = ALL_LESSONS.filter((l) => l.kind === 'grammar');
    let prevSize = 0;
    for (const l of grammarLessons) {
      const size = taughtConceptsUpTo(l.id).size;
      expect(size, l.id).toBeGreaterThanOrEqual(prevSize);
      prevSize = size;
    }
    expect(prevSize).toBe(grammarLessons.length);
  });

  it('returns every concept the course teaches for a lesson id placed nowhere on the path', () => {
    // The same honest fallback taughtUpTo gives for letters/words: a
    // synthetic lesson with no position has nothing to stop the walk at.
    const grammarLessons = ALL_LESSONS.filter((l) => l.kind === 'grammar');
    const everything = taughtConceptsUpTo('not-a-real-lesson-id');
    expect(everything.size).toBe(grammarLessons.length);
  });
});
