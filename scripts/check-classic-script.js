/* eslint-disable */
/**
 * Does every script the page loads parse the way the browser will load it?
 *
 * Expo's web export writes `<script src=… defer>`, a classic script, not a
 * module. A classic script may not contain module syntax: `import.meta`,
 * `import`/`export` statements, or a top-level `await`. One that does is a
 * syntax error before a single line runs, and the learner sees a blank page.
 *
 * That is what Expo SDK 54 shipped to CI. Metro started resolving packages'
 * ES-module builds, zustand's middleware reads `import.meta.env`, and the page
 * stayed empty with "Cannot use 'import.meta' outside a module" (2026-11-02).
 * No check said so in a way anyone could act on: the browser checks only saw a
 * page with no text. Builds here hid it entirely, because Metro's cache still
 * held the transforms from before the upgrade.
 *
 * So this parses each classic script in `dist/index.html` with Node's
 * `vm.Script`, which parses exactly as a classic script does, and names the
 * first module-only construct it meets. Module scripts (`type="module"`) are
 * parsed as modules instead.
 *
 * Run with:  npm run check:classic-script [-- <export folder>]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
// dist/ by default; another export folder may be named, to try this on a known-bad build.
const DIST = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
const index = path.join(DIST, 'index.html');

if (!fs.existsSync(index)) {
  console.error('check:classic-script — no dist/index.html. Run the web export first.');
  process.exit(1);
}

const html = fs.readFileSync(index, 'utf8');
const tags = [...html.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"[^>]*>/g)].map(([, attrs, src]) => ({
  src,
  module: /\btype="module"/.test(attrs),
}));
if (!tags.length) {
  console.error('check:classic-script — dist/index.html loads no script, so the app cannot start.');
  process.exit(1);
}

const base = (process.env.HARF_BASE_URL || '').replace(/\/$/, '');
const problems = [];
for (const { src, module } of tags) {
  const rel = src.startsWith(base + '/') ? src.slice(base.length) : src;
  const file = path.join(DIST, rel.replace(/^\//, ''));
  if (!fs.existsSync(file)) {
    problems.push(`${src}: the page loads it, but there is no such file in dist/`);
    continue;
  }
  const code = fs.readFileSync(file, 'utf8');
  try {
    if (module) new vm.SourceTextModule(code);
    else new vm.Script(code, { filename: rel });
  } catch (e) {
    if (module && /SourceTextModule is not a constructor/.test(String(e))) continue; // needs --experimental-vm-modules
    const at = code.indexOf('import.meta');
    const where =
      at >= 0 ? ` (first "import.meta" at offset ${at}: …${code.slice(Math.max(0, at - 80), at + 40)}…)` : '';
    problems.push(`${src}: ${e.message}${where}`);
  }
}

if (problems.length) {
  console.error('check:classic-script — a script the page loads would not run:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('\nThe browser stops at the syntax error, before the app draws anything.');
  process.exit(1);
}
console.log(
  `check:classic-script — ${tags.length === 1 ? '1 script parses' : `${tags.length} scripts parse`} as the page loads ${tags.length === 1 ? 'it' : 'them'}.`
);
