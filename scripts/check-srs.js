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

const { newCard, review, dueQueue, dueCount, isDue, strength, dueBudget } = load('src/lib/srs.ts');
const { buildLessonExercises } = load('src/exercises/generator.ts');
const { ALL_LESSONS } = load('src/data/units.ts');
const { WORDS } = load('src/data/words.ts');

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
  let good = newCard('w-g', NOW);
  let easy = newCard('w-e', NOW);
  let t = NOW;
  for (let i = 0; i < 3; i++) {
    good = review(good, 'good', t);
    easy = review(easy, 'easy', t);
    t += DAY;
  }
  check(
    'producing a word from memory earns a longer interval than picking it',
    easy.interval > good.interval,
    `easy ${easy.interval}d vs good ${good.interval}d`
  );
  check('the easy path raises ease, the good path does not', easy.ease > good.ease, `${easy.ease.toFixed(2)} vs ${good.ease.toFixed(2)}`);
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
  const reviewLesson = ALL_LESSONS.filter((l) => l.kind === 'review').pop();

  // The budget itself, which is where the bug lived.
  check(
    'a review lesson asks for a full lesson of due items, not a fixed handful',
    dueBudget(reviewLesson.kind, reviewLesson.size) === reviewLesson.size,
    `asked for ${dueBudget(reviewLesson.kind, reviewLesson.size)} of ${reviewLesson.size} slots`
  );
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

// ---- due items are woven into ordinary lessons too ------------------------

{
  const vocab = ALL_LESSONS.find((l) => l.kind === 'vocab');
  const due = [{ id: WORDS[0].id, type: 'word' }, { id: WORDS[1].id, type: 'word' }];
  const withDue = buildLessonExercises(vocab, due, 'both');
  const ids = new Set(withDue.map((ex) => ex.word?.id).filter(Boolean));
  check(
    'an ordinary lesson weaves in what is due',
    due.every((d) => ids.has(d.id)),
    `${vocab.id}`
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
