/* eslint-disable */
/**
 * Untracked files under `src/` or `scripts/` — the two directories `lint`
 * and `format:check` glob, with no scratch exclusion in either
 * `.gitignore` or `.prettierignore`.
 *
 * URD-057: a dispatched critic's own scratch file left in either directory
 * becomes a gating failure for whoever runs next, attributed to their work
 * rather than to the stray file — it has happened on at least two separate
 * items (URD-041's `verify041.js` broke `format:check`; URD-045
 * accumulated five: `scripts/critic-letterspot.js`, `scripts/debug-nav.js`,
 * `scripts/debug-lesson0.js`, and two `src/exercises/__scratch_*.test.ts`).
 *
 * Deliberately not fixed by adding ignore patterns instead: a scratch file
 * that silently passes every check is worse than one that fails loudly,
 * because it can then sit in the tree indefinitely and get committed by an
 * unrelated `git add -A`. This names the files instead of hiding them.
 */

const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Every untracked file under `src/` or `scripts/`, relative to the repo
 * root. `-uall` is required: without it, `git status --porcelain` reports
 * a wholly-untracked *directory* as a single line (`?? src/newdir/`), not
 * the files inside it, which would hide exactly the case this exists to
 * name.
 *
 * THE CRITIC: `-z` is required too, and its absence was a real bug, not a
 * style choice — plain `--porcelain` quotes and C-escapes any path with a
 * space or other special character (`?? "src/my scratch file.ts"`), and
 * `startsWith('src/')` against a line beginning with `"` fails silently.
 * A scratch file named the way editors and tools actually default to
 * naming one ("Untitled 1.ts") sailed straight past this check and still
 * broke the real `format:check` glob it exists to get ahead of — the
 * exact silent-miss this whole item exists to prevent, reproduced
 * directly, not hypothesised. `-z` reports paths raw, NUL-separated, no
 * quoting at all, so there is nothing here left to unescape.
 *
 * Gitignored files remain outside this function's reach — `git status`
 * cannot see them, by definition. Not a live gap today (no existing
 * ignore pattern touches `.ts`/`.tsx`/`.js` under either directory), but
 * this repo's ESLint config has no `.eslintignore`/gitignore integration
 * of its own, so a future ignore pattern would make a file invisible here
 * while `lint` still sees and fails on it. Worth knowing if this check
 * ever reports clean on a `lint` failure that names a real file.
 */
function strayFiles() {
  const out = execFileSync('git', ['status', '--porcelain', '-uall', '-z'], { cwd: ROOT, encoding: 'utf8' });
  return out
    .split('\0')
    .filter((entry) => entry.startsWith('?? '))
    .map((entry) => entry.slice(3))
    .filter((p) => p.startsWith('src/') || p.startsWith('scripts/'));
}

module.exports = { strayFiles };
