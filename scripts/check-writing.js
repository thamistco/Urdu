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
 * No dashes standing in for punctuation in user-facing copy: not en dashes,
 * not the em dashes this codebase reached for in almost every sentence it
 * wrote, and not a hyphen left floating between two spaces. A dash is a shrug:
 * it stands in for whichever of a comma, a colon, a semicolon or a full stop
 * the sentence actually needed, and a paragraph full of them reads as one long
 * aside. Rewriting to remove them forces the real punctuation to be chosen,
 * and the sentences come out shorter.
 *
 * A hyphen joining two words is not that and never was; see `SPACED_HYPHEN`
 * for why the original wording of this rule was wrong and how it survived
 * being wrong for so long.
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
 *  - **Those same fields when they hold an array**, which is how every grammar
 *    lesson holds its teaching prose.
 *  - **Every prose-shaped literal** under `src/screens`, `src/components`,
 *    `src/exercises`, `src/store` and `src/navigation`, wherever it is parked:
 *    a `const`, a ternary, a template literal.
 *
 * The last two were added after this check reported the app clean while an em
 * dash and two straight apostrophes were on screen, and while 47 straight
 * quotes sat in the grammar lessons. Both were the same failure: the check
 * could only see copy written in one shape, so copy written in another shape
 * was never held to any rule at all. Roughly 2,900 words of `grammar.ts` had
 * never been read by it.
 *
 * Deliberately *not* checked: `roman`, because a transliteration is data rather
 * than prose and `zarb-ul-masal` is how the word is spelled; `id`, `icon`,
 * `topic` and every other machine-facing string; class names, import
 * specifiers, anything inside a comment; and `*.test.ts` descriptions, which
 * are prose addressed to whoever reads the failure.
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

/**
 * Figure dash, en dash, em dash, horizontal bar: never anything but punctuation.
 */
const HARD_DASH = /[‒–—―]/;

/**
 * A hyphen doing a dash's job, which is the only way a hyphen breaks this rule.
 *
 * The rule used to read "not hyphens joining words" and banned every hyphen
 * anywhere. Nothing on the surface this check could see had one, so the clause
 * was never tested, and it was wrong: widening the check (below) put it up
 * against `in-laws`, `sign-in`, and the linguistic convention this course needs
 * most, the leading hyphen that marks a suffix (`nouns ending in ‑ا (‑a)`,
 * `add ‑یے (‑iye)`). Sixteen of the twenty-two hyphens the wider scan found
 * were that convention. Stripping them would not tidy the prose, it would
 * delete the thing the sentence is about.
 *
 * So a hyphen is judged by what it is doing rather than by being a hyphen. The
 * rule's own reason has always been about clause-level dashes ("a dash is a
 * shrug: it stands in for whichever of a comma, a colon, a semicolon or a full
 * stop the sentence actually needed"), and a hyphen only shrugs when it stands
 * apart from the words on either side.
 */
const SPACED_HYPHEN = /\s[-‑]\s|^[-‑]\s|\s[-‑]$/;

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

/** What, if anything, is wrong with this string. Null when it is clean. */
const badOf = (v) => (HARD_DASH.test(v) || SPACED_HYPHEN.test(v) ? 'dash' : TYPEWRITER.test(v) ? 'quote' : null);

/**
 * Cut `${…}` out of a template literal, nesting included.
 *
 * A single regex cannot do this, and the difference is a false accusation. The
 * out-of-hearts message interpolates a ternary that itself interpolates one:
 * `${short === 1 ? '' : 's'}`. Those quotes are code. Reported as prose, they
 * are a violation nobody can fix, and an unfixable finding is how a check
 * loses its authority.
 */
function stripInterpolations(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '$' && s[i + 1] === '{') {
      let depth = 1;
      i += 2;
      while (i < s.length && depth > 0) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') depth--;
        i++;
      }
      i--;
      out += ' ';
    } else out += s[i];
  }
  return out;
}

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
  'functionNote',
  // TrackChooser's bullets, which are the copy on the step a tester singled
  // out and were invisible here until arrays were scanned at all.
  'gains',
  'costs',
  'forWhom',
]);

/**
 * Where every prose-shaped literal is copy, however it happens to be held.
 *
 * The keyed scan below finds `desc: '…'`. It cannot find a sentence parked in
 * a module-level `const`, returned from a ternary, or built as a template
 * literal, and all three ship: an em dash sat in `TICKS_WIPED_NOTICE_BODY`,
 * and two straight apostrophes in a ternary and a backtick string, through a
 * green pipeline, until they were found by reading the screen. That is the
 * failure this check exists to make impossible.
 *
 * Restricted to the directories that are all interface, because `src/data`
 * also holds build-time guards whose thrown error messages are prose to a
 * developer and invisible to a learner.
 */
const UI_DIRS = ['screens', 'components', 'exercises', 'store', 'navigation'].map((d) => path.join('src', d));

/** Attribute and key names whose values are machine-facing however they read. */
const NOT_COPY_ATTR = new Set([
  'className',
  'style',
  'key',
  'testID',
  'name',
  'icon',
  'source',
  'accessibilityRole',
  'id',
  'topic',
  'kind',
  'color',
  'to',
  'from',
]);

/**
 * Does this literal read as a sentence rather than as code?
 *
 * Several words, one of them long, and at least one lowercase letter. A
 * className (`mb-4 text-sm text-paper/55`) is all lowercase punctuation, an id
 * is a single token, and a voice name (`ur-IN-Chirp3-HD-Kore`) has no spaces.
 */
function looksLikeProse(s) {
  const t = s.trim();
  if (!/\s/.test(t)) return false;
  const words = t.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length < 4) return false;
  if (!/[a-z]/.test(t)) return false;
  if (!words.some((w) => w.replace(/[^A-Za-z]/g, '').length >= 4)) return false;
  if (/^[a-z0-9\-:/[\]. ]+$/.test(t)) return false;
  if (/https?:\/\//.test(t)) return false;
  return true;
}

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
    const bad = badOf(text);
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
      const bad = badOf(value);
      if (!bad) continue;
      add(file, lineOf(src, m.index), `${key}= ${bad}`, value);
    }
  }

  // ---- copy fields whose value is an array -------------------------------
  //
  // `explain: [ '…', '…' ]` is how every grammar lesson holds its teaching
  // prose, and the keyed scan below cannot see any of it: that regex wants a
  // quote straight after the colon, and here it finds a bracket. It was blind
  // to 237 strings and roughly 2,900 words in `grammar.ts` alone, which is the
  // largest single body of prose in the app, plus TrackChooser's gains and
  // costs bullets. Forty-seven straight quotes were sitting in there while
  // this check reported the app clean.
  for (const m of src.matchAll(/(\w+)\s*:\s*\[/g)) {
    if (!COPY_KEYS.has(m[1])) continue;
    const open = m.index + m[0].length;
    let depth = 1;
    let i = open;
    while (i < src.length && depth > 0) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') depth--;
      i++;
    }
    for (const s of src.slice(open, i).matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
      const value = stripInterpolations(s[2].replace(/\\(['"])/g, '$1'));
      if (!/[A-Za-z]{2}/.test(value)) continue;
      const bad = badOf(value);
      if (bad) add(file, lineOf(src, open + s.index), `${m[1]}[] ${bad}`, value);
    }
  }

  // ---- every prose literal in the interface directories -------------------
  //
  // Not test files: `it('never opens a lesson on a context word — …')` is
  // prose, and is addressed to whoever is reading the failure, not to a
  // learner. Thirteen of them were the entire false-positive set on the first
  // run of this rule.
  if (!/\.test\.tsx?$/.test(file) && UI_DIRS.some((d) => path.relative(ROOT, file).startsWith(d))) {
    for (const m of src.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
      const before = src.slice(Math.max(0, m.index - 40), m.index);
      const attr = before.match(/(\w+)\s*=\s*\{?\s*$/) || before.match(/(\w+)\s*:\s*$/);
      if (attr && NOT_COPY_ATTR.has(attr[1])) continue;
      const value = stripInterpolations(m[2].replace(/\\(['"])/g, '$1'));
      if (!looksLikeProse(value)) continue;
      const bad = badOf(value);
      if (bad) add(file, lineOf(src, m.index), `literal ${bad}`, value);
    }
  }

  // ---- named copy fields -------------------------------------------------
  if (KEYS_NOT_COPY.some((d) => file.includes(d))) continue;
  for (const m of src.matchAll(/(\w+)\s*:\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g)) {
    const [, key, , raw] = m;
    if (!COPY_KEYS.has(key)) continue;
    const value = raw.replace(/\\(['"])/g, '$1');
    const bad = badOf(value);
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
