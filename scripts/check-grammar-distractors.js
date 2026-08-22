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
 * Run with:  npm run check:grammar-distractors
 */

const { load } = require('./lib/load-ts');

const { ALL_LESSONS } = load('src/data/units.ts');
const gen = load('src/exercises/generator.ts');

const grammarLessons = ALL_LESSONS.filter((l) => l.kind === 'grammar');

let total = 0;
let sameConcept = 0;
const byConcept = new Map();

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
      total++;
      const hit = ex.options.some((o) => o.id !== answer.id && o.concept === answer.concept);
      if (hit) sameConcept++;
      const c = byConcept.get(answer.concept) ?? { total: 0, hit: 0 };
      c.total++;
      if (hit) c.hit++;
      byConcept.set(answer.concept, c);
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

const thin = [...byConcept]
  .filter(([, c]) => c.hit < c.total)
  .sort((a, b) => a[1].hit / a[1].total - b[1].hit / b[1].total);
if (thin.length) {
  console.log(
    `\n${thin.length} of ${byConcept.size} concepts fall short of 100% at least once — expected wherever a ` +
      `concept's own tagged-sentence pool is small (a near-miss pool this thin can run out mid-draw), not a bug:`
  );
  for (const [c, n] of thin.slice(0, 8)) {
    console.log(`      ${c} — ${n.hit}/${n.total} (${((n.hit / n.total) * 100).toFixed(0)}%)`);
  }
  if (thin.length > 8) console.log(`      … and ${thin.length - 8} more`);
}
