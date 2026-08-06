/* eslint-disable */
/**
 * Hold the app's prose to the house style.
 *
 * Every other check here is about behaviour: does the audio play, is the word
 * taught before it is tested, can the text be read against what is behind it.
 * None of them look at the writing, and the writing is most of what a learner
 * actually meets — a lesson is a few hundred words of English explaining a few
 * words of Urdu.
 *
 * ## The rule this exists for
 *
 * No dashes in user-facing copy. Not hyphens joining words, not en dashes, not
 * the em dashes this codebase reached for in almost every sentence it wrote.
 * A dash is a shrug: it stands in for whichever of a comma, a colon, a
 * semicolon or a full stop the sentence actually needed, and a paragraph full
 * of them reads as one long aside. Rewriting to remove them forces the real
 * punctuation to be chosen, and the sentences come out shorter.
 *
 * ## What counts as user-facing
 *
 * Only what a learner can see. That distinction is the whole difficulty of this
 * check, because a hyphen is also how Tailwind spells `items-center`, how npm
 * spells `react-native`, and how the romanisation spells `zarb-ul-masal`.
 *
 *  - **JSX text nodes** — the words between the tags.
 *  - **Named copy fields** in the content and component sources: `title`,
 *    `label`, `blurb`, `desc`, `summary`, `meaning`, `explain`, `because`,
 *    and the rest of the list below.
 *
 * Deliberately *not* checked: `roman`, because a transliteration is data rather
 * than prose and `zarb-ul-masal` is how the word is spelled; `id`, `icon`,
 * `topic` and every other machine-facing string; class names, import
 * specifiers, and anything inside a comment.
 *
 * The exemption is narrow on purpose. It would have been easier to skip any
 * string containing a slash or looking like an identifier, and that would also
 * have skipped real sentences.
 *
 * Run with:  npm run check:writing
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

/** Hyphen, non-breaking hyphen, figure dash, en dash, em dash, horizontal bar. */
const DASH = /[-‑‒–—―]/;

/**
 * Typewriter quotes, where the app has already chosen typographic ones.
 *
 * This is a consistency rule rather than a taste one. The copy was using curly
 * quotation marks for quoting — `sounds like “aa”` — and straight apostrophes
 * for contractions in the same sentence, which is the one combination that
 * looks like a mistake rather than a style. `letters.ts` had both forms of the
 * same transliteration three lines apart: `to’e` in one entry and `to\'e` in
 * another.
 *
 * So: ’ for apostrophes, “ ” for quotes, everywhere a learner reads.
 */
const TYPEWRITER = /['"]/;

/**
 * Object keys whose values a learner reads.
 *
 * Listed rather than inferred, because the alternative — checking every string
 * in the file — drowns in ids, icon names and topic keys, and a check nobody
 * can act on is a check nobody runs.
 */
const COPY_KEYS = new Set([
  'title',
  'label',
  'blurb',
  'desc',
  'description',
  'summary',
  'meaning',
  'explain',
  'because',
  'question',
  'q',
  'sub',
  'hint',
  'note',
  'name',
  'caption',
  'prompt',
  'answer',
  'english',
  'teach',
  'tip',
]);

/** Files whose strings are machine-facing however they are keyed. */
const SKIP_FILES = [path.join('src', 'lib', 'voiceManifest.ts'), path.join('src', 'data', 'art.ts')];

/**
 * Directories where a `name:` is a key rather than a word.
 *
 * The stores each carry `name: 'harf-progress'` — the localStorage key their
 * persisted state lives under. Renaming one would sign every existing learner
 * out and wipe their streak, so it is the last string in the project that
 * should be edited for style. `name` stays in the list above because a letter's
 * name genuinely is copy.
 */
const KEYS_NOT_COPY = [path.join('src', 'store')];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

/**
 * Blank comments out, keeping newlines so line numbers still point at the code.
 *
 * Without this every doc comment in the project is a finding, and this file's
 * own prose about dashes would fail it.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length;

const findings = [];
const add = (file, line, kind, text) =>
  findings.push({ file: path.relative(ROOT, file), line, kind, text: text.trim().slice(0, 90) });

for (const file of walk(SRC)) {
  if (SKIP_FILES.some((s) => file.endsWith(s))) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const src = stripComments(raw);

  // ---- JSX text nodes: the words between the tags ------------------------
  //
  // A text node is a run between `>` and `<`. Interpolations are cut out of it
  // before the run is judged, rather than the run being thrown away for
  // containing one: the first version required no braces at all, so
  // "All {TOTAL_LESSON_COUNT} lessons are built around this. You can change it
  // any time in Settings — nothing you have learned is lost." was not a
  // sentence as far as this check was concerned. A single `{}` anywhere hid
  // the whole paragraph.
  //
  // Only `.tsx`. Run against plain TypeScript it matches arrow functions and
  // comparisons instead — `w.roman.replace(/[^a-z]/gi, '').length` was reported
  // as a line of prose, because `>` … `<` is also just two operators.
  const jsxNodes = file.endsWith('.tsx') ? src.matchAll(/>([^<>]*)</g) : [];
  for (const m of jsxNodes) {
    const text = m[1].replace(/\{[^{}]*\}/g, ' ');
    const bad = DASH.test(text) ? 'dash' : TYPEWRITER.test(text) ? 'quote' : null;
    if (!bad) continue;
    // A run of only whitespace and a dash is a divider, not a sentence.
    if (!/[A-Za-z]{2}/.test(text)) continue;
    // …and code is not prose. Dropping the no-braces rule above let this match
    // TypeScript as well: `Ref<ScrollView>` and every generic in the file put a
    // `>` and a `<` around ordinary source. A sentence in this app never
    // contains a semicolon, an equals sign, a bracket or a backtick, and every
    // run of code longer than a few characters contains one of them.
    if (/[;=[\]`]/.test(text)) continue;
    // A brace left over after the balanced ones were stripped means the run
    // straddles an expression rather than containing one: `{visible.has('x') &&`
    // is the opening half of a conditional, not a sentence with a quote in it.
    if (/[{}]/.test(text)) continue;
    add(file, lineOf(src, m.index), `jsx ${bad}`, text);
  }

  // ---- named copy props: label="…" and hint="…" ---------------------------
  //
  // The third place copy lives, and the one this check was blind to for its
  // first run. A settings row takes its words as attributes rather than as
  // children, so `hint="Off by default — the Urdu is a recorded voice"` sat in
  // plain sight through a green pipeline. It was found by looking at the
  // screen, which is the thing a check is supposed to make unnecessary.
  //
  // Both quoting styles: `hint="…"` and `hint={'…'}`.
  if (file.endsWith('.tsx')) {
    for (const m of src.matchAll(/(\w+)=\{?\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2\s*\}?/g)) {
      const [, key, , raw] = m;
      if (!COPY_KEYS.has(key)) continue;
      const value = raw.replace(/\\(['"])/g, '$1');
      const bad = DASH.test(value) ? 'dash' : TYPEWRITER.test(value) ? 'quote' : null;
      if (!bad) continue;
      add(file, lineOf(src, m.index), `${key}= ${bad}`, value);
    }
  }

  // ---- named copy fields -------------------------------------------------
  if (KEYS_NOT_COPY.some((d) => file.includes(d))) continue;
  for (const m of src.matchAll(/(\w+)\s*:\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g)) {
    const [, key, , raw] = m;
    if (!COPY_KEYS.has(key)) continue;
    const value = raw.replace(/\\(['"])/g, '$1');
    const bad = DASH.test(value) ? 'dash' : TYPEWRITER.test(value) ? 'quote' : null;
    if (!bad) continue;
    add(file, lineOf(src, m.index), `${key} ${bad}`, value);
  }
}

if (!findings.length) {
  console.log(`check:writing — no dashes and no typewriter quotes in any user-facing string.`);
  process.exit(0);
}

console.error(`check:writing — ${findings.length} user-facing string(s) break the house style:\n`);
for (const f of findings.slice(0, 60)) {
  console.error(`  ${f.file}:${f.line}  [${f.kind}]  ${f.text}`);
}
if (findings.length > 60) console.error(`  … and ${findings.length - 60} more`);
console.error(
  `\n  A dash stands in for whichever of a comma, a colon, a semicolon or a full stop\n` +
    `  the sentence actually needed; choosing one is the fix. A straight quote should be\n` +
    `  ’ for an apostrophe and “ ” for a quotation, which is what the rest of the copy uses.`
);
process.exit(1);
