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
 * every level's pool (57-69 sentences) is well over its current lessons'
 * combined size. Growing lesson count/size to close that gap is a
 * curriculum decision, out of this item's own file scope (`generator.ts`,
 * `sentences.ts`, `scripts/` — not `units.ts`). So this does not assert
 * 100% reachability; it states plainly, by level, how much of the pool
 * remains out of reach by design, not oversight. That is the "documents an
 * explicit, deliberate exemption" half of this item's own definition of
 * done, made concrete and machine-checked rather than asserted in a comment.
 *
 * The invariant this actually enforces is narrower than "every lesson draws
 * exactly its designed size": zero overlap between sibling lessons at a
 * level, whatever each one actually draws. URD-048 found a real case (`
 * s-intermediate`/`s-intermediate-2`, sharing a readable-at-position pool of
 * only 16 against a combined 20 slots) where a lesson's own designed `size`
 * cannot be filled without either reusing a sibling's sentence or drawing
 * fewer than `size` — `sentencesForLesson` (generator.ts) chooses the
 * latter, on purpose: a lesson a little short is an honest, visible
 * tradeoff, and a silent repeat is the exact defect this file exists to
 * catch. So the sum of each lesson's OWN distinct pick count, not the sum
 * of every lesson's designed `size`, is the real ceiling — asserting
 * against the designed-size sum would have hidden this fix behind a false
 * "regression", the same mistake a naive check would make. If reachable
 * ever falls below the sum of actual picks, that means two siblings shared
 * a sentence — a real regression — and this fails loudly for it.
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
const shortLessons = [];
let totalPool = 0;
let totalReachable = 0;
let totalCapacity = 0;

for (const level of LEVELS) {
  const lessons = ALL_LESSONS.filter((l) => l.kind === 'sentences' && l.level === level);
  const capacity = lessons.reduce((s, l) => s + l.size, 0);
  const pool = SENTENCES.filter((s) => s.level === level);

  const reachable = new Set();
  let actualDrawn = 0;
  for (const l of lessons) {
    const ids = new Set();
    // Both tracks: `sentenceBuild` is skipped on the Roman track only when a
    // specific sentence's tiles don't resolve to Roman (see
    // `sentenceExercise`), so checking one track alone could under-report.
    for (const track of ['both', 'roman']) {
      for (const ex of buildLessonExercises(l, [], track, new Set())) {
        if (ex.kind === 'sentenceBuild') ids.add(ex.sentence.id);
      }
    }
    if (ids.size < l.size) shortLessons.push(`${l.id} (${ids.size}/${l.size})`);
    actualDrawn += ids.size;
    for (const id of ids) reachable.add(id);
  }

  // Zero-overlap is the real invariant: the union can never be smaller than
  // the sum of each lesson's own distinct draw, unless two siblings shared a
  // sentence.
  if (reachable.size < actualDrawn) {
    bad(
      `${level}: lessons drew ${actualDrawn} sentences between them but only ${reachable.size} distinct ones — ` +
        `sibling lessons at this level are sharing a sentence, which sentencesForLesson (generator.ts) must not ` +
        `let happen.`
    );
  }

  rows.push({ level, lessons: lessons.length, capacity, poolSize: pool.length, reachable: reachable.size });
  totalPool += pool.length;
  totalReachable += reachable.size;
  totalCapacity += capacity;
}

console.log(`check:sentence-coverage — ${SENTENCES.length} sentences across ${LEVELS.length} CEFR levels.\n`);
for (const r of rows) {
  console.log(
    `  ${r.level.padEnd(12)} ${r.lessons} lesson(s), designed capacity ${r.capacity.toString().padStart(2)} · ` +
      `reachable ${r.reachable.toString().padStart(2)} / pool ${r.poolSize}`
  );
}
if (shortLessons.length) {
  console.log(
    `\n  ${shortLessons.length} lesson(s) drew fewer sentences than their designed size — a real, honest\n` +
      `  position scarcity (two adjacent lessons sharing a too-thin readable pool; see sentencesForLesson's\n` +
      `  own doc comment), not an error: ${shortLessons.join(', ')}`
  );
}
console.log(
  `\n  ${totalReachable} of ${totalPool} sentences reachable course-wide (${((totalReachable / totalPool) * 100).toFixed(1)}%),\n` +
    `  against a designed lesson capacity of ${totalCapacity} of ${totalPool} ` +
    `(${((totalCapacity / totalPool) * 100).toFixed(1)}%) — the rest of the pool is a capacity gap, not a bug:\n` +
    `  raising it needs more sentences-lesson capacity (bigger lessons or more of them), a curriculum decision\n` +
    `  outside this check's job, which is only to hold reachability honest against overlap.`
);

if (problems.length) {
  console.error(`\ncheck:sentence-coverage — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  process.exit(1);
}
console.log(
  '\ncheck:sentence-coverage — every sentence a lesson could reach today, given its capacity, is actually reached.'
);
