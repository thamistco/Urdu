/* eslint-disable */
/**
 * Does a grammar lesson's own reinforcement climb actually test the
 * construction it claims to reinforce?
 *
 * `grammar`'s sentence-reinforcement tail draws `meaningPick`/
 * `wordFromMeaning` distractors from every sentence at the concept's CEFR
 * level, with no notion of which of those sentences illustrate the *same*
 * construction. Measured before URD-030: of 290 such exercises the grammar
 * climb emits, only 78 (26.9%) offered even one distractor tagged to the
 * same concept as the correct answer. The other 73.1% offered a correct
 * sentence — a comparative, say — against three topically unrelated
 * options, answerable by recognising the topic or vocabulary alone, without
 * parsing the comparative marker, passive auxiliary, or plural ending the
 * lesson is actually about.
 *
 * This is not "wrong" in the sense `check:answerable` cares about — every
 * sampled exercise was still fluent, answerable, and free of exact-meaning
 * giveaways — so this is a measurement, not a gate: it states the rate a
 * fix can be checked against, the same way `check:shape` states a target
 * `check:all` does not enforce.
 *
 * CURRICULUM CRITIC, reviewing URD-030's first attempt: a single "has at
 * least one" rate hid two failures a binary number can't distinguish. Every
 * `meaningPick` exercise sat at 0% and every `wordFromMeaning` exercise sat
 * at "all three distractors same-concept" — not "one added as a near-miss."
 * The rate alone read as "biased," when the reality was two-thirds fully
 * saturated and one-third completely untouched by kind, which only showed up
 * once the count was broken out by `ex.kind` and by how MANY distractors
 * matched, not merely whether any did. This check now reports both splits
 * directly rather than requiring a reader to re-derive them, the way the
 * first version made this reviewer instrument the generator by hand to find
 * a shortfall this file's own output should have shown.
 *
 * Run with:  npm run check:grammar-distractors
 */

const { load } = require('./lib/load-ts');

const { ALL_LESSONS } = load('src/data/units.ts');
const gen = load('src/exercises/generator.ts');

const grammarLessons = ALL_LESSONS.filter((l) => l.kind === 'grammar');

let total = 0;
let sameConcept = 0;
const byConcept = new Map();
const byKind = new Map(); // kind -> { total, hit, byCount: Map<n, count> }

for (const lesson of grammarLessons) {
  for (const track of ['both', 'roman']) {
    const exercises = gen.buildLessonExercises(lesson, [], track);
    for (const ex of exercises) {
      if (ex.kind !== 'meaningPick' && ex.kind !== 'wordFromMeaning') continue;
      // Only the grammar climb's own sentence-derived questions are in
      // scope here — a concept's `grammarTeach`/`grammarDrill` exercises
      // don't go through `distractorsFor` the same way, and a plain
      // vocabulary word (drawn elsewhere in the app) has no `concept` to
      // reinforce in the first place.
      const answer = ex.word;
      if (!answer || answer.topic !== 'sentences' || !answer.concept) continue;
      const n = ex.options.filter((o) => o.id !== answer.id && o.concept === answer.concept).length;
      const hit = n > 0;

      total++;
      if (hit) sameConcept++;

      const c = byConcept.get(answer.concept) ?? { total: 0, hit: 0 };
      c.total++;
      if (hit) c.hit++;
      byConcept.set(answer.concept, c);

      const k = byKind.get(ex.kind) ?? { total: 0, hit: 0, byCount: new Map() };
      k.total++;
      if (hit) k.hit++;
      k.byCount.set(n, (k.byCount.get(n) ?? 0) + 1);
      byKind.set(ex.kind, k);
    }
  }
}

if (total === 0) {
  console.error('check:grammar-distractors — no grammar-climb meaningPick/wordFromMeaning exercises found at all.');
  console.error(
    '  Either the grammar lessons emitted nothing, or buildLessonExercises no longer shapes them this way —'
  );
  console.error('  either way this check is not measuring anything, which is worse than a bad number.');
  process.exit(1);
}

const rate = sameConcept / total;
console.log(
  `check:grammar-distractors — ${sameConcept} of ${total} grammar-climb meaningPick/wordFromMeaning exercises ` +
    `(${(rate * 100).toFixed(1)}%) offer at least one same-concept distractor.`
);

console.log(`\nBy exercise kind (a binary "at least one" rate hides whether it's a near-miss or a saturation):`);
for (const [kind, k] of [...byKind].sort((a, b) => a[0].localeCompare(b[0]))) {
  const counts = [...k.byCount]
    .sort((a, b) => a[0] - b[0])
    .map(([n, c]) => `${n}:${c}`)
    .join(' ');
  console.log(
    `      ${kind} — ${k.hit}/${k.total} (${((k.hit / k.total) * 100).toFixed(0)}%) have ≥1; ` +
      `same-concept-distractor-count distribution: ${counts}`
  );
}

// A concept's own rate tracks the same-level pool the *climb's turn cycle*
// draws from, not how many sentences are tagged to it — g-postpositions (21
// tagged, the largest pool in the course) and g-plurals (4 tagged) land at
// the same rate for the same reason every concept does: only some of the
// climb's turns (`meet`, always `meaningPick`) can ever hit at all, and the
// rest (`recall`, always `wordFromMeaning`) hit whenever the concept has any
// other same-level tagged sentence, which is true for all 25 today.
const thin = [...byConcept]
  .filter(([, c]) => c.hit < c.total)
  .sort((a, b) => a[1].hit / a[1].total - b[1].hit / b[1].total);
if (thin.length) {
  console.log(
    `\n${thin.length} of ${byConcept.size} concepts fall short of 100% at least once — driven by the ` +
      `meet/recall turn split above (see the by-kind breakdown), not by a concept's own pool size:`
  );
  for (const [c, n] of thin.slice(0, 8)) {
    console.log(`      ${c} — ${n.hit}/${n.total} (${((n.hit / n.total) * 100).toFixed(0)}%)`);
  }
  if (thin.length > 8) console.log(`      … and ${thin.length - 8} more`);
}
