/**
 * Behavioural check for the typed-answer matcher (src/lib/roman.ts).
 *
 * The matcher decides whether a learner who typed something knew the word, and
 * it is deliberately lossy — so the interesting question is not "does it
 * compile" but "which spellings does it let through, and which does it still
 * hold apart". This table is that answer, written down.
 *
 * Run with:  npm run check:roman
 *
 * No test runner needed: the TypeScript that ships with the project transpiles
 * the real module, so this checks the code the app actually uses.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'src', 'lib', 'roman.ts');
const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
const { matchesWord } = mod.exports;

/** [what the learner typed, the word's script, the word's roman, should pass] */
const CASES = [
  // the same word, spelled the many ways people spell it
  ['kitab', 'کتاب', 'kitaab', true],
  ['kitaab', 'کتاب', 'kitaab', true],
  ['kitāb', 'کتاب', 'kitaab', true],
  ['  Kitab ', 'کتاب', 'kitaab', true],
  ['کتاب', 'کتاب', 'kitaab', true],
  ['hun', 'ہوں', 'hoon', true],
  ['hoon', 'ہوں', 'hoon', true],
  ['wo', 'وہ', 'wo', true],
  ['vo', 'وہ', 'wo', true],
  ['daktar', 'ڈاکٹر', 'ḍākṭar', true],
  ['bhuk', 'بھوک', 'bhook', true],
  ['khoosh', 'خوش', 'khush', true],
  ['pita', 'پیتا', 'peeta', true],
  ['chay', 'چائے', 'chai', true],
  ['ap', 'آپ', 'aap', true],
  ['mein', 'میں', 'main', true],
  ['narangi', 'نارنگی', 'naarangi', true],
  ['talibeilm', 'طالبِ علم', 'taalib-e-ilm', true],

  // distinctions that carry meaning and must survive the reduction
  ['gar', 'گھر', 'ghar', false], // aspiration: گر is a different word
  ['ke', 'کی', 'ki', false], // کے / کی / کا is a grammar lesson
  ['dakter', 'ڈاکٹر', 'ḍākṭar', false],
  ['', 'کتاب', 'kitaab', false],
  ['   ', 'کتاب', 'kitaab', false],
  ['seb', 'کتاب', 'kitaab', false], // a different word entirely
];

let failed = 0;
for (const [typed, urdu, roman, want] of CASES) {
  const got = matchesWord(typed, urdu, roman);
  if (got !== want) {
    failed++;
    console.log(`FAIL  ${JSON.stringify(typed).padEnd(16)} vs ${roman.padEnd(14)} → ${got}, wanted ${want}`);
  }
}

if (failed) {
  console.log(`\n${failed} of ${CASES.length} cases behave differently than intended.`);
  process.exit(1);
}
console.log(`roman matcher: ${CASES.length} cases all behave as intended`);
