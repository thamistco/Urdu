/**
 * Is every sentence a "sentences" lesson could ever draw actually reached by
 * at least one, up to what the course's current lesson capacity allows?
 *
 * `check:coverage` already holds this exact invariant for vocabulary: every
 * word is taught by exactly one lesson, because `coverTopics` (units.ts)
 * spreads each topic across enough lessons to cover it. Nothing equivalent
 * ever existed for sentences — each `sentences`-kind lesson drew
 * independently (`seededShuffle(pool, lesson.id).slice(0, size)`), with no
 * notion of what a sibling lesson at the same level had already drawn.
 * Measured before URD-027's fix: only 81 of 256 sentences (31.6%) were ever
 * reachable by any lesson course-wide, the same shape of gap
 * gauntlet/ROLES.md names as this project's founding motivation, now
 * confirmed present for sentences too.
 *
 * Unlike vocabulary, a level's `sentences`-lessons cannot be "spread across
 * enough lessons to cover" the whole pool without adding lesson capacity —
 * every level's pool (57-69 sentences) is well over three times its current
 * lessons' combined size (16-32). Growing lesson count/size to close that
 * gap is a curriculum decision, out of this item's own file scope
 * (`generator.ts`, `sentences.ts`, `scripts/` — not `units.ts`). So this
 * does not assert 100% reachability; it asserts the achievable ceiling
 * given today's capacity — the sum of a level's `sentences`-lesson sizes —
 * is actually reached, and states plainly, by level, how much of the pool
 * remains out of reach by design, not oversight. That is the "documents an
 * explicit, deliberate exemption" half of this item's own definition of
 * done, made concrete and machine-checked rather than asserted in a comment.
 *
 * If this ever reports LESS than the ceiling, that is a real regression —
 * `sentencesForLesson` (generator.ts) failing to keep sibling lessons'
 * draws disjoint — and should fail loudly, which is what this checks for.
 *
 * Run with:  npm run check:sentence-coverage
 */

const { load } = require('./lib/load-ts');

const { ALL_LESSONS } = load('src/data/units.ts');
const { SENTENCES } = load('src/data/sentences.ts');
const { buildLessonExercises } = load('src/exercises/generator.ts');

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];

const problems = [];
const bad = (msg) => problems.push(msg);

const rows = [];
let totalPool = 0;
let totalReachable = 0;
let totalCeiling = 0;

for (const level of LEVELS) {
  const lessons = ALL_LESSONS.filter((l) => l.kind === 'sentences' && l.level === level);
  const capacity = lessons.reduce((s, l) => s + l.size, 0);
  const pool = SENTENCES.filter((s) => s.level === level);
  const ceiling = Math.min(capacity, pool.length);

  const reachable = new Set();
  for (const l of lessons) {
    // Both tracks: `sentenceBuild` is skipped on the Roman track only when a
    // specific sentence's tiles don't resolve to Roman (see
    // `sentenceExercise`), so checking one track alone could under-report.
    for (const track of ['both', 'roman']) {
      for (const ex of buildLessonExercises(l, [], track, new Set())) {
        if (ex.kind === 'sentenceBuild') reachable.add(ex.sentence.id);
      }
    }
  }

  if (reachable.size < ceiling) {
    bad(
      `${level}: only ${reachable.size} of ${ceiling} reachable sentences actually reached — ` +
        `sibling lessons at this level are drawing overlapping sentences, wasting capacity ` +
        `(sentencesForLesson, generator.ts, should keep them disjoint).`
    );
  }

  rows.push({ level, lessons: lessons.length, capacity, poolSize: pool.length, reachable: reachable.size, ceiling });
  totalPool += pool.length;
  totalReachable += reachable.size;
  totalCeiling += ceiling;
}

console.log(`check:sentence-coverage — ${SENTENCES.length} sentences across ${LEVELS.length} CEFR levels.\n`);
for (const r of rows) {
  console.log(
    `  ${r.level.padEnd(12)} ${r.lessons} lesson(s), capacity ${r.capacity.toString().padStart(2)} · ` +
      `reachable ${r.reachable.toString().padStart(2)} / ceiling ${r.ceiling.toString().padStart(2)} / pool ${r.poolSize}`
  );
}
console.log(
  `\n  ${totalReachable} of ${totalPool} sentences reachable course-wide (${((totalReachable / totalPool) * 100).toFixed(1)}%).\n` +
    `  Ceiling given today's lesson capacity is ${totalCeiling} of ${totalPool} ` +
    `(${((totalCeiling / totalPool) * 100).toFixed(1)}%) — the rest is a capacity gap, not a bug: ` +
    `raising it needs more sentences-lesson capacity (bigger lessons or more of them), a curriculum\n` +
    `  decision outside this check's job, which is only to hold what today's capacity allows.`
);

if (problems.length) {
  console.error(`\ncheck:sentence-coverage — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  process.exit(1);
}
console.log(
  '\ncheck:sentence-coverage — every sentence a lesson could reach today, given its capacity, is actually reached.'
);
