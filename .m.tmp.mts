import { ALL_LESSONS, UNITS } from './src/data/units.ts';
import { wordsByTopic } from './src/data/words.ts';

const vocab = ALL_LESSONS.filter((l) => l.kind === 'vocab');
const words = vocab.map((l) => (l.wordIds ?? []).length);
const sizes = ALL_LESSONS.map((l) => l.size);
const avgWords = words.reduce((a, b) => a + b, 0) / words.length;
const avgSize = vocab.reduce((s, l) => s + l.size, 0) / vocab.length;

// ~9 s per exercise is the honest middle for tap-to-answer with feedback;
// typing and tracing are slower, matching is faster.
const SECS = 9;
console.log(`HARF today`);
console.log(`  vocab lessons            ${vocab.length}`);
console.log(`  new words per lesson     ${Math.min(...words)} to ${Math.max(...words)}, mean ${avgWords.toFixed(1)}`);
console.log(`  exercises per lesson     mean ${avgSize.toFixed(1)}`);
console.log(`  est. minutes per lesson  ${((avgSize * SECS) / 60).toFixed(1)}`);
console.log(`  total lessons            ${ALL_LESSONS.length}`);
console.log(`  est. hours to finish     ${((sizes.reduce((a, b) => a + b, 0) * SECS) / 3600).toFixed(1)}`);

const parts = new Map<string, number>();
for (const l of vocab) parts.set(l.topic!, (parts.get(l.topic!) ?? 0) + 1);
const p = [...parts.values()].sort((a, b) => a - b);
console.log(`  lessons per topic        ${p[0]} to ${p[p.length - 1]}, median ${p[Math.floor(p.length / 2)]}`);

const perUnit = UNITS.map((u) => u.lessons.length).sort((a, b) => a - b);
console.log(`  lessons per unit         ${perUnit[0]} to ${perUnit[perUnit.length - 1]}, median ${perUnit[Math.floor(perUnit.length / 2)]}`);

console.log(`\nBENCHMARKS`);
console.log(`  Drops      5 min capped session; topic lists of ~20 words; ~15 drilled per session`);
console.log(`  Duolingo   5 to 10 min per lesson; units chunked for intermediate learners`);
console.log(`\nGAP`);
console.log(`  a Harf vocab lesson is ~${((avgSize * SECS) / 60).toFixed(1)} min against a 5 min Drops session`);
console.log(`  it teaches ~${avgWords.toFixed(1)} words against a Drops topic list of ~20`);
console.log(`  to hit 5 min a lesson needs ~${Math.round((5 * 60) / SECS)} exercises, i.e. ~${Math.round((5 * 60) / SECS) - 4} new words`);
const target = Math.round((5 * 60) / SECS) - 4;
console.log(`  at ${target} new words per lesson the course would be ~${Math.ceil(2281 / target)} vocab lessons, not ${vocab.length}`);
