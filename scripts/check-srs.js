/* eslint-disable */
/**
 * Does spaced repetition actually do what the app claims?
 *
 * "The words you got wrong come back first" is written in the scheduler's own
 * doc comment and printed on the Practice screen, and nothing anywhere checked
 * it. The engine is small enough to reason about but the *wiring* is not: the
 * lesson screen decides how many due items to ask for and what grade an answer
 * earns, and both were wrong in ways no type would catch — one flat cap of four
 * meant a fifteen-question review revisited four due items and filled the rest
 * from everything ever taught, and every answer was graded `good`, so the
 * scheduler's `easy` branch never ran once.
 *
 * So this drives the real scheduler and the real generator, and asserts the
 * behaviour a learner is promised.
 *
 * Run with:  npm run check:srs
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const cache = new Map();
function load(rel) {
  const resolved = [rel, rel + '.ts', path.join(rel, 'index.ts')]
    .map((p) => path.join(ROOT, p))
    .find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!resolved) throw new Error(`cannot resolve ${rel}`);
  if (cache.has(resolved)) return cache.get(resolved);
  const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(resolved, mod.exports);
  const here = path.relative(ROOT, path.dirname(resolved));
  new Function('exports', 'module', 'require', js)(mod.exports, mod, (id) =>
    id.startsWith('.') ? load(path.join(here, id)) : require(id)
  );
  cache.set(resolved, mod.exports);
  return mod.exports;
}

const { newCard, review, dueQueue, dueCount, isDue, strength, dueBudget, cardsOnTrack, reviewFirst, CATCH_UP_SIZE } =
  load('src/lib/srs.ts');
const { buildLessonExercises, itemsOf } = load('src/exercises/generator.ts');
const { ALL_LESSONS, UNITS, resolveLesson } = load('src/data/units.ts');
const { testOutLessons, testOutRefs } = load('src/lib/unitSkip.ts');
const { WORDS, wordsByTopic } = load('src/data/words.ts');
const { LETTERS } = load('src/data/letters.ts');

const problems = [];
const ok = [];
const check = (claim, pass, detail = '') => (pass ? ok : problems).push(`${claim}${detail ? ` — ${detail}` : ''}`);

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

// ---- a missed item comes back within the session --------------------------

{
  let c = newCard('w-x', NOW);
  c = review(c, 'good', NOW); // interval 1 day
  c = review(c, 'again', NOW);
  const minutes = (c.due - NOW) / 60000;
  check('a missed item is due again within minutes', minutes <= 5, `due in ${minutes.toFixed(0)} min`);
  check('a miss resets the streak of correct answers', c.reps === 0, `reps ${c.reps}`);
}

// ---- getting it right repeatedly pushes it further out --------------------

{
  let c = newCard('w-y', NOW);
  const intervals = [];
  let t = NOW;
  for (let i = 0; i < 5; i++) {
    c = review(c, 'good', t);
    intervals.push(c.interval);
    t = c.due;
  }
  const rising = intervals.every((v, i) => i === 0 || v > intervals[i - 1]);
  check('each correct answer pushes the next review further out', rising, intervals.join(' → ') + ' days');
  check('five correct answers reach at least three weeks', c.interval >= 21, `${c.interval} days`);
}

// ---- recall is worth more than recognition -------------------------------

{
  // Three correct answers each, one graded as the lesson grades a typed answer
  // and one as it grades a multiple choice.
  // Each is answered when it falls due: an answer before then is an early
  // review, which by design earns no step (P-009), so stepping both a day at
  // a time compared the early-review rule rather than the two grades.
  let good = newCard('w-g', NOW);
  let easy = newCard('w-e', NOW);
  for (let i = 0; i < 3; i++) {
    good = review(good, 'good', good.due);
    easy = review(easy, 'easy', easy.due);
  }
  check(
    'producing a word from memory earns a longer interval than picking it',
    easy.interval > good.interval,
    `easy ${easy.interval}d vs good ${good.interval}d`
  );
  check(
    'the easy path raises ease, the good path does not',
    easy.ease > good.ease,
    `${easy.ease.toFixed(2)} vs ${good.ease.toFixed(2)}`
  );
}

// ---- the queue is ordered by how overdue, and only holds what is due ------

{
  const cards = {
    fresh: { ...newCard('fresh', NOW), due: NOW + 5 * DAY },
    late: { ...newCard('late', NOW), due: NOW - 9 * DAY },
    later: { ...newCard('later', NOW), due: NOW - 2 * DAY },
    now: { ...newCard('now', NOW), due: NOW },
  };
  const q = dueQueue(cards, 10, NOW);
  check('nothing not yet due appears in the queue', !q.includes('fresh'), q.join(','));
  check('the most overdue comes first', q[0] === 'late', q.join(' → '));
  check('the due count matches the queue', dueCount(cards, NOW) === q.length, `${dueCount(cards, NOW)} vs ${q.length}`);
  check('the queue honours its limit', dueQueue(cards, 2, NOW).length === 2);
}

// ---- a review lesson actually reviews what is due -------------------------

/**
 * The one that was broken. With more due items than a review lesson has slots,
 * every question it asks should come from the queue — not from the general pool
 * of everything taught so far.
 */
{
  // The Daily Review (practice-review) exists to work through the queue, so it
  // asks for a full lesson of due items. A unit review keeps 70% of itself for
  // its own unit since 2026-10-13 (QA, H8), and is checked for that below.
  const reviewLesson = resolveLesson('practice-review');

  // The budget itself, which is where the bug lived.
  check(
    'the Daily Review asks for a full lesson of due items, not a fixed handful',
    dueBudget(reviewLesson.kind, reviewLesson.size, reviewLesson.id) === reviewLesson.size,
    `asked for ${dueBudget(reviewLesson.kind, reviewLesson.size, reviewLesson.id)} of ${reviewLesson.size} slots`
  );
  {
    const unitReview = ALL_LESSONS.filter((l) => l.kind === 'review').pop();
    const share = dueBudget(unitReview.kind, unitReview.size, unitReview.id) / unitReview.size;
    check(
      'a unit review keeps most of itself for its own unit',
      share > 0 && share <= 0.35,
      `${unitReview.id} gives ${Math.round(share * 100)}% of its slots to due items`
    );
  }
  const vocabBudget = dueBudget('vocab', 12);
  check('a lesson teaching new material takes only a few', vocabBudget > 0 && vocabBudget < 12, `${vocabBudget}`);

  const due = WORDS.slice(0, dueBudget(reviewLesson.kind, reviewLesson.size)).map((w) => ({ id: w.id, type: 'word' }));
  const dueIds = new Set(due.map((d) => d.id));
  const exercises = buildLessonExercises(reviewLesson, due, 'both');
  const asked = exercises.map((ex) => ex.word?.id).filter(Boolean);
  const fromQueue = asked.filter((id) => dueIds.has(id)).length;
  check(
    'a review lesson asks about due items, not the general pool',
    asked.length > 0 && fromQueue === asked.length,
    `${fromQueue} of ${asked.length} questions came from the due queue (${reviewLesson.id})`
  );
}

// ---- a review with nothing due yet still only asks about words seen ------

/**
 * The one a learner actually hit. Before this, a review reached with nothing
 * due fell back to `wordsByTopic(topic)` for every topic touched so far — the
 * whole category, not the handful of words a single vocab lesson actually
 * shows. Colours alone is 19 words against a lesson that introduces well under
 * ten, so most early reviews could ask about a colour nobody had been taught.
 *
 * This reproduces exactly that shape without depending on which lesson the
 * path currently positions where: take a topic bigger than any one lesson
 * could cover, pretend the learner has only ever been graded on three of its
 * words, and demand a review generated with nothing due never asks about a
 * fourth.
 */
{
  const reviewLesson = ALL_LESSONS.filter((l) => l.kind === 'review').pop();
  const colours = wordsByTopic('colours');
  check('the fixture topic is bigger than a single lesson could teach', colours.length > 10, `${colours.length}`);

  const known = new Set(colours.slice(0, 3).map((w) => w.id));
  const heldOut = new Set(colours.slice(3).map((w) => w.id));

  // `n` deliberately exceeds the entire corpus. `fallbackReviewRefs` takes
  // `shuffle(pool).slice(0, n)`, so a small `n` against the real course-wide
  // pool only has a modest chance of drawing any specific held-out word — a
  // held-out id could fail to come up by chance and the test would pass
  // whether or not the filtering it exists to catch was actually happening.
  // A huge `n` forces the whole pool into the slice regardless of shuffle
  // order, which is what makes this deterministic rather than a coin flip.
  const hugeReviewLesson = { ...reviewLesson, size: 5000 };
  const exercises = buildLessonExercises(hugeReviewLesson, [], 'both', known);
  const asked = exercises.map((ex) => ex.word?.id).filter(Boolean);
  const untaught = asked.filter((id) => heldOut.has(id));
  check(
    'a review with nothing due never asks about a word outside what the learner has been graded on',
    untaught.length === 0,
    untaught.length ? `asked about ${untaught.join(', ')}, never graded` : `${asked.length} questions, all known`
  );
}

// ---- a unit review opened ahead of its unit tests out of it (P-137) -------

/**
 * The one exception to the rule above, and it must stay one. A unit review
 * opened before its unit is finished is a test-out: it asks a few of each
 * unfinished lesson's own items, which the learner has not been graded on,
 * because certifying them is the point. Nothing else ungraded may come with
 * them, and a review reached in order, with its unit done, is never one.
 */
{
  const reviews = UNITS.flatMap((u) => u.lessons.filter((l) => l.kind === 'review').map((r) => ({ u, r })));
  // Reached in order: every lesson done; or half done and half skipped (a
  // speaker who tested out at onboarding); or on the Roman track with only
  // the letter lessons left, which that track never shows.
  const inOrder = reviews.filter(({ u, r }) => {
    const lessons = u.lessons.filter((l) => l.id !== r.id);
    const all = new Set(lessons.map((l) => l.id));
    const notLetters = new Set(lessons.filter((l) => l.kind !== 'letters').map((l) => l.id));
    return (
      testOutLessons(r.id, (id) => all.has(id), false).length > 0 ||
      testOutLessons(r.id, (id) => notLetters.has(id), true).length > 0
    );
  });
  check(
    'a unit review reached with its unit done is never a test-out',
    inOrder.length === 0,
    inOrder.length ? inOrder.map(({ r }) => r.id).join(', ') : `${reviews.length} reviews`
  );

  const graded = new Set(WORDS.slice(0, 40).map((w) => w.id));
  let asked = 0;
  const missing = [];
  const strays = [];
  const weak = [];
  for (const track of ['both', 'roman']) {
    for (const { r } of reviews) {
      const refs = testOutRefs(
        testOutLessons(r.id, () => false, track === 'roman'),
        track === 'roman'
      );
      // A review with nothing on its track to test out of is an ordinary one.
      if (!refs.length) continue;
      const wanted = new Set(refs.map((x) => x.id));
      const built = buildLessonExercises(r, [], track, graded, 0, refs);
      const ids = new Set(built.flatMap(itemsOf).map((it) => it.id));
      weak.push(
        ...built
          .filter((ex) => (ex.kind === 'letterTrace' || ex.kind === 'letterContrast') && wanted.has(ex.letter.id))
          .map((ex) => `${r.id}/${track}:${ex.kind} ${ex.letter.id}`)
      );
      asked += refs.length;
      missing.push(...refs.filter((x) => !ids.has(x.id)).map((x) => `${r.id}/${track}:${x.id}`));
      strays.push(...[...ids].filter((id) => !wanted.has(id)).map((id) => `${r.id}/${track}:${id}`));
    }
  }
  check(
    'a test-out asks every one of the unfinished lessons’ items it drew',
    missing.length === 0,
    missing.length ? `not asked: ${missing.slice(0, 6).join(', ')}` : `${asked} items over every review, both tracks`
  );
  check(
    'a test-out asks no letter by a trace or a two-way contrast, which a guess or the prompt can pass',
    weak.length === 0,
    weak.length ? weak.slice(0, 6).join(', ') : 'one-of-four letter questions only'
  );
  check(
    // Not even what the learner has been graded on: topped up with earlier
    // words, "22 questions on the 5 lessons" held two of Unit 1's (tester,
    // 2026-10-31).
    'a test-out asks its own items and nothing else',
    strays.length === 0,
    strays.length ? `also asked: ${strays.slice(0, 6).join(', ')}` : 'only the items it drew'
  );
}

// ---- the catch-up review brings back what is due, on every track ----------

{
  // Home offers it in place of a new lesson while more than REVIEW_FIRST_AT
  // items are due (P-026), and the lesson screen fills it with
  // dueQueue(cardsOnTrack(...), size). On the Roman track a learner's old due
  // letters, which it cannot show, once took every slot: with no words the
  // screen was blank, with words the review fell back to other known words
  // and asked none of the due ones. So this counts questions about the due
  // items themselves, built the way the screen builds them.
  const catchUp = resolveLesson('practice-catchup');
  const srs = {};
  const types = {};
  for (const l of LETTERS.slice(0, 32)) {
    srs[l.id] = { ...newCard(l.id, NOW - 2 * DAY), interval: 1, reps: 1, due: NOW - DAY };
    types[l.id] = 'letter';
  }
  for (const w of WORDS.slice(0, 35)) {
    srs[w.id] = { ...newCard(w.id, NOW - 3 * DAY), interval: 2, reps: 1, due: NOW - DAY };
    types[w.id] = 'word';
  }
  for (const track of ['both', 'roman']) {
    const shown = cardsOnTrack(srs, types, track);
    const due = dueQueue(shown, dueBudget(catchUp.kind, catchUp.size), NOW).map((id) => ({ id, type: types[id] }));
    const wanted = new Set(Object.keys(shown));
    const asked = new Set(
      buildLessonExercises(catchUp, due, track)
        .flatMap(itemsOf)
        .map((it) => it.id)
        .filter((id) => wanted.has(id))
    );
    check(
      `the catch-up review Home offers on the ${track} track asks ${CATCH_UP_SIZE} of the due items`,
      reviewFirst(shown, NOW) && asked.size >= CATCH_UP_SIZE,
      `${asked.size} due items asked, of ${dueCount(shown, NOW)} due on this track`
    );
  }
}

// ---- due items are woven into ordinary lessons too ------------------------

{
  const vocab = ALL_LESSONS.find((l) => l.kind === 'vocab');
  // As many as dueBudget gives an ordinary lesson. It took only two of the
  // four, so half of what was due went unshown (learning review, 2026-10-10).
  // Words the lesson does not teach anyway, or it would pass with no weave.
  const own = new Set(buildLessonExercises(vocab, [], 'both').map((ex) => ex.word?.id));
  const due = WORDS.filter((w) => !own.has(w.id))
    .slice(0, dueBudget(vocab.kind, vocab.size))
    .map((w) => ({ id: w.id, type: 'word' }));
  const withDue = buildLessonExercises(vocab, due, 'both');
  const ids = new Set(withDue.map((ex) => ex.word?.id).filter(Boolean));
  check(
    'an ordinary lesson weaves in everything its due budget asks for',
    due.every((d) => ids.has(d.id)),
    `${vocab.id}: ${due.filter((d) => ids.has(d.id)).length} of ${due.length}`
  );
}

// ---- the strength meter the Practice screen draws ------------------------

{
  check('a brand new card reads as no strength', strength(newCard('n', NOW)) === 0);
  const mature = { ...newCard('m', NOW), interval: 30 };
  check('a long interval reads as full strength', strength(mature) === 1, `${strength(mature)}`);
  check('a card due today is due', isDue({ ...newCard('d', NOW) }, NOW));
}

// ---- report ---------------------------------------------------------------

console.log(`${ok.length + problems.length} claims about spaced repetition checked\n`);
for (const o of ok) console.log('  ok  ', o);
if (problems.length) {
  console.log(`\n${problems.length} not true:`);
  for (const p of problems) console.log('  ✗', p);
  process.exit(1);
}
console.log('\nspaced repetition behaves as the app promises');
