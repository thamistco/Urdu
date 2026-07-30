/* eslint-disable */
/**
 * Enforce the parts of the engineering standard that are about *shape*.
 *
 * `docs/ENGINEERING_STANDARDS.md` marks each rule with who enforces it: a robot
 * or a reviewer. That distinction is only honest if the robot rules are
 * actually wired to a robot — a rule tagged "fails CI" that nothing checks is
 * the same broken promise as a comment claiming a contrast ratio nothing
 * measured. This is the script behind three of those tags.
 *
 *   20 — the folder layout is the layout; no catch-all directories
 *   21 — nothing nests more than two deep under src/
 *   71 — no file named final, temp, test2, copy, new, or old
 *
 * Run with `npm run check:structure`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

/**
 * Directories whose names say "I could not decide where this goes". They are
 * where a codebase starts to rot: nobody can predict what is in them, so
 * nobody looks, so everything ends up there.
 */
const CATCH_ALL = ['misc', 'other', 'stuff', 'helpers', 'utils', 'common', 'shared', 'temp', 'tmp', 'new', 'old'];

/**
 * Filenames that describe a moment in someone's afternoon rather than the
 * contents of the file.
 */
const BAD_STEM = /^(final|finalfinal|temp|tmp|test\d+|copy|copycopy|new|old|untitled|foo|bar|asdf|backup|draft)\d*$/i;

const MAX_DEPTH = 2;

const problems = [];
const bad = (where, msg) => problems.push(`${where}  ${msg}`);

function walk(dir, depth = 0) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs);

    if (entry.isDirectory()) {
      if (CATCH_ALL.includes(entry.name.toLowerCase())) {
        bad(
          rel,
          `\`${entry.name}/\` is a catch-all name — nobody can predict what is in it, so nobody looks. Name the directory for its subject (rule 20).`
        );
      }
      if (depth + 1 > MAX_DEPTH) {
        bad(rel, `nested ${depth + 1} deep under src/; the limit is ${MAX_DEPTH} (rule 21)`);
      }
      walk(abs, depth + 1);
      continue;
    }

    const stem = entry.name.replace(/\.[^.]+$/, '').replace(/\.(test|spec)$/, '');
    if (BAD_STEM.test(stem)) {
      bad(rel, `\`${entry.name}\` is named for a moment, not for its contents (rule 71)`);
    }
  }
}

/**
 * Self-test: the checks must actually fire on the things they claim to catch.
 * A structure checker that quietly stops matching reports a tidy repo forever.
 */
const SELF_TESTS = [
  ['final.ts', true],
  ['test2.tsx', true],
  ['copy.js', true],
  ['LatticeBackground.tsx', false],
  ['useSettingsStore.ts', false],
  ['gamification.test.ts', false],
];
for (const [name, shouldFlag] of SELF_TESTS) {
  const stem = name.replace(/\.[^.]+$/, '').replace(/\.(test|spec)$/, '');
  if (BAD_STEM.test(stem) !== shouldFlag) {
    console.error(
      `check:structure — the filename rule is broken: "${name}" should ${shouldFlag ? '' : 'not '}be flagged.`
    );
    process.exit(1);
  }
}
if (!CATCH_ALL.includes('utils')) {
  console.error('check:structure — the catch-all list is broken.');
  process.exit(1);
}

walk(SRC);

if (problems.length) {
  console.error(`check:structure — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nSee docs/ENGINEERING_STANDARDS.md §2 and §5.');
  process.exit(1);
}
console.log('check:structure — folder layout and file names follow the standard.');
