/**
 * Content audit — the checks that a typechecker cannot make.
 *
 * The course is now 2,000+ words, 25 grammar concepts, 140 sentences, 17
 * passages, 12 conversations and 233 lessons wired together by string ids.
 * TypeScript will not tell you that a lesson points at a topic that no longer
 * exists, that a question's answer is missing from its own options, that a
 * dialogue has the same person speaking twice in a row, or that a topic has
 * fallen below the four words a lesson needs. Those are the failures that
 * reach a learner as a broken question, so they are checked here.
 *
 * Run with:  npm run audit
 *
 * No test runner needed: the TypeScript that ships with the project transpiles
 * the real data modules, so this audits exactly what the app loads.
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** Minimal CommonJS-ish loader for the app's .ts data modules. */
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

const problems = [];
const bad = (msg) => problems.push(msg);

const words = load('src/data/words.ts');
const letters = load('src/data/letters.ts');
const grammar = load('src/data/grammar.ts');
const sentences = load('src/data/sentences.ts');
const units = load('src/data/units.ts');
const masks = load('src/data/glyphMasks.ts');

/** Icon names, read out of the art registry (a .tsx file we do not transpile). */
const MASK_ICON_NAMES = new Set(
  (fs.readFileSync(path.join(ROOT, 'src/art/icons.tsx'), 'utf8')
    .split('export const ICONS')[1] || '')
    .split('};')[0]
    .match(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)
    ?.map((m) => m.replace(':', '').trim()) ?? []
);

const { WORDS, TOPICS, PHRASES } = words;
const { LETTERS, POSITIONS } = letters;
const { GRAMMAR } = grammar;
const { SENTENCES, PASSAGES, DIALOGUES } = sentences;
const { UNITS, ALL_LESSONS, resolveLesson } = units;

console.log(`vocab ${WORDS.length} words / ${TOPICS.length} topics · phrases ${PHRASES.length}`);
console.log(`letters ${LETTERS.length} · grammar ${GRAMMAR.length} · sentences ${SENTENCES.length}`);
console.log(`passages ${PASSAGES.length} · dialogues ${DIALOGUES.length}`);
console.log(`path ${UNITS.length} units / ${ALL_LESSONS.length} lessons`);

// --- ids unique -----------------------------------------------------------
const dupes = (arr, label) => {
  const seen = new Set(), d = new Set();
  for (const x of arr) (seen.has(x) ? d.add(x) : seen.add(x));
  if (d.size) bad(`duplicate ${label}: ${[...d].slice(0, 6).join(', ')}`);
};
dupes(WORDS.map(w => w.id), 'word ids');
dupes(TOPICS.map(t => t.id), 'topic ids');
dupes(PHRASES.map(p => p.id), 'phrase ids');
dupes(LETTERS.map(l => l.id), 'letter ids');
dupes(GRAMMAR.map(g => g.id), 'grammar ids');
dupes(SENTENCES.map(s => s.id), 'sentence ids');
dupes(PASSAGES.map(p => p.id), 'passage ids');
dupes(DIALOGUES.map(d => d.id), 'dialogue ids');
dupes(ALL_LESSONS.map(l => l.id), 'lesson ids');
dupes(GRAMMAR.flatMap(g => g.drills.map(d => d.id)), 'drill ids');

// --- every answer is among its options ------------------------------------
for (const g of GRAMMAR)
  for (const d of g.drills)
    if (!d.options.includes(d.answer)) bad(`drill ${d.id}: answer not in options`);
for (const p of PASSAGES)
  if (!p.question.options.includes(p.question.answer)) bad(`passage ${p.id}: answer not in options`);
for (const d of DIALOGUES)
  if (!d.question.options.includes(d.question.answer)) bad(`dialogue ${d.id}: answer not in options`);
for (const d of DIALOGUES)
  if (new Set(d.question.options).size !== d.question.options.length) bad(`dialogue ${d.id}: repeated option`);

// --- Urdu fields contain Urdu, roman fields don't -------------------------
const URDU = /[؀-ۿݐ-ݿ]/;
const LATIN = /[A-Za-z]/;
for (const w of WORDS) {
  if (!URDU.test(w.urdu)) bad(`word ${w.id}: urdu field has no Urdu`);
  if (LATIN.test(w.urdu)) bad(`word ${w.id}: Latin letters inside urdu "${w.urdu}"`);
  // Roman should be Latin letters (with the diacritics Urdu romanisation uses),
  // spaces and the punctuation that shows up in ezafe constructions.
  if (!/^[\p{Script=Latin}\p{M}0-9 '’\-]+$/u.test(w.roman))
    bad(`word ${w.id}: non-Latin characters in roman "${w.roman}"`);
  if (!w.meaning.trim()) bad(`word ${w.id}: empty meaning`);
}
for (const s of SENTENCES) {
  for (const t of s.words) if (!URDU.test(t)) bad(`sentence ${s.id}: non-Urdu tile "${t}"`);
  if (s.concept && !GRAMMAR.some(g => g.id === s.concept)) bad(`sentence ${s.id}: unknown concept ${s.concept}`);
  // The Roman track reads a per-word transliteration straight off this pairing
  // (see lib/translit.ts), so the two spellings of a sentence have to line up
  // word for word. One extra Roman token silently shifts every word after it
  // onto the wrong tile.
  const romanTokens = s.roman.trim().split(/\s+/);
  if (romanTokens.length !== s.words.length)
    bad(`sentence ${s.id}: ${s.words.length} words but ${romanTokens.length} roman tokens ("${s.roman}")`);
}
for (const d of DIALOGUES)
  for (const l of d.lines) {
    if (!URDU.test(l.urdu)) bad(`dialogue ${d.id}: line without Urdu`);
    if (LATIN.test(l.urdu)) bad(`dialogue ${d.id}: Latin inside urdu "${l.urdu}"`);
    if (!['A', 'B'].includes(l.speaker)) bad(`dialogue ${d.id}: bad speaker`);
  }
for (const p of PASSAGES)
  for (const l of p.lines) if (LATIN.test(l.urdu)) bad(`passage ${p.id}: Latin inside urdu`);

// --- every dialogue actually alternates speakers ---------------------------
for (const d of DIALOGUES) {
  const names = new Set(d.lines.map(l => l.speaker));
  if (names.size < 2) bad(`dialogue ${d.id}: only one speaker`);
  for (let i = 1; i < d.lines.length; i++)
    if (d.lines[i].speaker === d.lines[i - 1].speaker)
      bad(`dialogue ${d.id}: ${d.lines[i].speaker} speaks twice in a row at line ${i + 1}`);
}

// --- the path reaches everything ------------------------------------------
const usedTopics = new Set(ALL_LESSONS.filter(l => l.topic).map(l => l.topic));
const usedConcepts = new Set(ALL_LESSONS.filter(l => l.conceptId).map(l => l.conceptId));
const usedPassages = new Set(ALL_LESSONS.filter(l => l.passageId).map(l => l.passageId));
const usedDialogues = new Set(ALL_LESSONS.filter(l => l.dialogueId).map(l => l.dialogueId));
for (const t of TOPICS) if (!usedTopics.has(t.id)) bad(`topic never taught: ${t.id}`);
for (const g of GRAMMAR) if (!usedConcepts.has(g.id)) bad(`grammar never taught: ${g.id}`);
for (const p of PASSAGES) if (!usedPassages.has(p.id)) bad(`passage never read: ${p.id}`);
for (const d of DIALOGUES) if (!usedDialogues.has(d.id)) bad(`dialogue never used: ${d.id}`);
for (const t of usedTopics) if (!TOPICS.some(x => x.id === t)) bad(`lesson points at missing topic ${t}`);
for (const c of usedConcepts) if (!GRAMMAR.some(x => x.id === c)) bad(`lesson points at missing concept ${c}`);
for (const p of usedPassages) if (!PASSAGES.some(x => x.id === p)) bad(`lesson points at missing passage ${p}`);
for (const d of usedDialogues) if (!DIALOGUES.some(x => x.id === d)) bad(`lesson points at missing dialogue ${d}`);

// --- every topic has enough words to build a lesson -----------------------
for (const t of TOPICS) {
  const n = WORDS.filter(w => w.topic === t.id).length;
  if (n < 4) bad(`topic ${t.id} has only ${n} words (lessons need 4+)`);
}

// --- letters: no two share a picture or an example word --------------------
// The alif card showed a red apple for انار, the same glyph the seen card used
// for سیب — so the picture said "apple" on the letter whose whole job is to
// say "pomegranate". A shared picture is always either a bug or a confusion.
const byPicture = {};
const byWord = {};
for (const l of LETTERS) {
  const pic = l.icon || l.emoji;
  (byPicture[pic] = byPicture[pic] || []).push(l.id);
  (byWord[l.word] = byWord[l.word] || []).push(l.id);
}
for (const [pic, ids] of Object.entries(byPicture))
  if (ids.length > 1) bad(`letters ${ids.join(' and ')} share the picture ${pic}`);
for (const [word, ids] of Object.entries(byWord))
  if (ids.length > 1) bad(`letters ${ids.join(' and ')} share the example word ${word}`);
for (const l of LETTERS)
  if (l.icon && !MASK_ICON_NAMES.has(l.icon)) bad(`letter ${l.id}: unknown icon "${l.icon}"`);

// --- tracing masks cover every letter and form -----------------------------
for (const l of LETTERS)
  for (const p of POSITIONS)
    if (!masks.GLYPH_MASKS[`${l.id}:${p.key}`]) bad(`no trace mask for ${l.id}:${p.key}`);

// --- practice ids resolve --------------------------------------------------
for (const t of TOPICS) if (!resolveLesson(`practice-topic-${t.id}`)) bad(`practice-topic-${t.id} unresolved`);
for (const g of GRAMMAR) if (!resolveLesson(`practice-grammar-${g.id}`)) bad(`practice-grammar-${g.id} unresolved`);
for (const p of PASSAGES) if (!resolveLesson(`practice-reading-${p.id}`)) bad(`practice-reading-${p.id} unresolved`);
for (const d of DIALOGUES) if (!resolveLesson(`practice-dialogue-${d.id}`)) bad(`practice-dialogue-${d.id} unresolved`);
if (!resolveLesson('practice-review')) bad('practice-review unresolved');

console.log('');
if (problems.length) {
  console.log(`${problems.length} problems:`);
  for (const p of problems.slice(0, 40)) console.log('  •', p);
  process.exit(1);
}
console.log('no problems found');
