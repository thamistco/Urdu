/* eslint-disable */
/**
 * URD-057: fail loudly and by name when a scratch file sits under `src/`
 * or `scripts/` — see `lib/clean-tree.js` for why this exists rather than
 * an ignore pattern. Standalone here (`npm run check:clean-tree`) so it
 * can be run on its own; `check-all.js` runs the same check itself, as an
 * early guard before any real step, since a stray file is cheap to catch
 * and confusing to hit buried inside a `lint`/`format:check` failure.
 */

const { strayFiles } = require('./lib/clean-tree');

const stray = strayFiles();
if (stray.length) {
  console.error(
    `check:clean-tree — ${stray.length} untracked file${stray.length === 1 ? '' : 's'} under src/ or scripts/:\n`
  );
  for (const f of stray) console.error(`  ${f}`);
  console.error(
    '\nlint and format:check glob both directories with no scratch exclusion, so any file left here breaks ' +
      'the next gating run for whoever runs next — attributed to their work, not to this one. Remove it, or ' +
      'move it under the session scratchpad if it needs to exist a little longer.'
  );
  process.exit(1);
}
console.log('check:clean-tree — no untracked files under src/ or scripts/.');
