/**
 * Does the authored Roman agree with the one canonical spelling?
 *
 * `src/data/translit.ts` exists precisely so a grammatical form has one
 * spelling everywhere: ہم is `hum`, wherever it appears. But `GRAMMAR_TRANSLIT`
 * is a lookup table for *rendering* drill options — nothing ever checked that
 * the Roman hand-typed into `grammar.ts` and `sentences.ts` prose actually
 * agreed with it. It did not: ہم was typed `ham` in grammar.ts and
 * sentences.ts at 37 combined call sites while the table said `hum`, because
 * an author retyping a familiar pronoun reaches for the spelling in their head
 * rather than looking the word up.
 *
 * This walks every authored Urdu/Roman pair — grammar examples and drills,
 * sentence/passage/dialogue lines — and for each Urdu word that is also a
 * `GRAMMAR_TRANSLIT` key, checks the Roman word in the same position matches
 * the canonical spelling. It does not attempt anything cleverer than position:
 * word counts have to agree between the two sides or the pair is skipped
 * outright, because a translated sentence can reorder or drop words and a
 * false alignment is worse than a missed check.
 *
 * Run with: npm run check:translit
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const cache = new Map();
function load(rel) {
  const resolved = path.join(ROOT, rel);
  if (cache.has(resolved)) return cache.get(resolved);
  const js = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(resolved, mod.exports);
  new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
  cache.set(resolved, mod.exports);
  return mod.exports;
}

const { GRAMMAR_TRANSLIT: RAW_TRANSLIT } = load('src/data/translit.ts');

/**
 * Genuine heteronyms: one script spelling, two unrelated pronunciations, and
 * no way to tell which one a given occurrence is without understanding the
 * sentence. `GRAMMAR_TRANSLIT` can only hold one canonical answer per key, so
 * these keys are excluded here rather than given a wrong "canonical" reading
 * that would fail half of their correct uses.
 *
 * میں is both the first-person pronoun (`main`, "I") and the locative
 * postposition (`meñ`, "in") — nasalisation is the only difference and it is
 * not consistently marked in the script. ہوں is both first-person "to be"
 * (`hoon`, "I am") and the polite subjunctive-future form (`hoñ`, as in "aap
 * … hoñ ge", "you will be") — same spelling, different mood.
 *
 * Running this check without the exclusion is what found them: every correct
 * use of `meñ` and the one correct use of `hoñ` reported as disagreeing with
 * a table that was never able to hold both answers.
 */
const HETERONYMS = new Set(['میں', 'ہوں']);
const GRAMMAR_TRANSLIT = Object.fromEntries(Object.entries(RAW_TRANSLIT).filter(([urdu]) => !HETERONYMS.has(urdu)));
const { GRAMMAR } = load('src/data/grammar.ts');
const { SENTENCES, PASSAGES, DIALOGUES } = load('src/data/sentences.ts');

// Urdu sentence-final punctuation, so it doesn't stay glued to the last word.
const URDU_PUNCT = /[۔،؟!]+$/;
const stripUrdu = (w) => w.replace(URDU_PUNCT, '');
// A trailing parenthetical gloss, e.g. "hum khush hain (we are happy)" — strip
// it before splitting into words, or the gloss's English words get compared
// against Urdu words they were never meant to translate one-for-one.
const stripGloss = (s) => s.replace(/\s*\([^)]*\)\s*$/, '');
const stripRoman = (w) => w.replace(/[.,?!]+$/, '').toLowerCase();

const problems = [];

/** Compare one Urdu/Roman pair, word position by word position. */
function checkPair(urdu, roman, where) {
  const uWords = urdu.trim().split(/\s+/).map(stripUrdu);
  const rWords = stripGloss(roman).trim().split(/\s+/).map(stripRoman);
  // Different word counts: no safe alignment, so nothing is asserted rather
  // than guessed at.
  if (uWords.length !== rWords.length) return;
  uWords.forEach((u, i) => {
    const canonical = GRAMMAR_TRANSLIT[u];
    if (!canonical) return;
    if (rWords[i] !== canonical.toLowerCase()) {
      problems.push(`${where} — ${u} is "${canonical}", roman said "${rWords[i]}" (in "${roman}")`);
    }
  });
}

/** A table cell that may be a "/"-joined list of alternatives, e.g. the
 *  pronoun row "ہم / آپ / وہ (pl.)" against "hum / aap / wo (pl.)". Each
 *  alternative is checked as its own pair. */
function checkTableCell(urduCell, romanCell, where) {
  const uParts = urduCell.split('/').map((s) => s.trim());
  const rParts = romanCell.split('/').map((s) => s.trim());
  if (uParts.length !== rParts.length) return;
  uParts.forEach((u, i) => checkPair(u, rParts[i], where));
}

for (const concept of GRAMMAR) {
  concept.examples.forEach((ex, i) => checkPair(ex.urdu, ex.roman, `grammar ${concept.id} example ${i + 1}`));
  concept.drills.forEach((d) => checkPair(d.prompt, d.promptRoman, `grammar ${concept.id} drill ${d.id}`));
  if (concept.table?.rowsRoman) {
    concept.table.rows.forEach((row, r) => {
      const romanRow = concept.table.rowsRoman[r];
      if (!romanRow) return;
      row.forEach((cell, c) => checkTableCell(cell, romanRow[c] || '', `grammar ${concept.id} table row ${r + 1}`));
    });
  }
}

for (const s of SENTENCES) checkPair(s.words.join(' '), s.roman, `sentence ${s.id}`);
for (const p of PASSAGES) p.lines.forEach((l, i) => checkPair(l.urdu, l.roman, `passage ${p.id} line ${i + 1}`));
for (const d of DIALOGUES) d.lines.forEach((l, i) => checkPair(l.urdu, l.roman, `dialogue ${d.id} line ${i + 1}`));

if (problems.length) {
  console.error(`${problems.length} Roman spelling(s) disagree with translit.ts:\n`);
  problems.slice(0, 30).forEach((p) => console.error(`  ${p}`));
  if (problems.length > 30) console.error(`  … and ${problems.length - 30} more`);
  process.exit(1);
}
console.log(
  `checked ${GRAMMAR.length} grammar concepts, ${SENTENCES.length} sentences, ${PASSAGES.length} passages, ` +
    `${DIALOGUES.length} dialogues against ${Object.keys(GRAMMAR_TRANSLIT).length} canonical spellings — all agree`
);
