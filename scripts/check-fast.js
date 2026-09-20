/* eslint-disable */
/**
 * The part of the pipeline that needs no bundle. Run it before committing.
 *
 * `check:all` is the gate and nothing replaces it. But it builds the web
 * bundle and then drives a browser through a dozen checks, and a session that
 * spends ten minutes to be told Prettier wanted double quotes has learned
 * nothing it could not have learned in twenty seconds. That happened here:
 * two harness commits went through the whole pipeline, failed at
 * `format:check`, and the whole pipeline ran again to prove a one-character
 * fix.
 *
 * So this runs the workflow's steps up to the build — secrets, typecheck,
 * lint, formatting, structure, the unit tests, and every content check that
 * reads the course rather than a rendered page.
 *
 * The split is structural rather than a list somebody keeps: the workflow
 * builds exactly once, and everything before that point is by construction a
 * check that needs no bundle. A step added to the workflow lands on the right
 * side of the line without anyone deciding which side that is.
 *
 *   npm run check:fast     before committing
 *   npm run check:all      before pushing
 *
 * It says what it did not cover, every time, because a green run of a subset
 * reported as a green run is exactly the failure `check:all` exists to
 * prevent.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readSteps, beforeTheBuild, ROOT } = require('./lib/workflow-steps');

const SELF = 'check:fast';

{
  const { strayFiles } = require('./lib/clean-tree');
  const stray = strayFiles();
  if (stray.length) {
    console.error(
      `${SELF} — ${stray.length} untracked file${stray.length === 1 ? '' : 's'} under src/ or scripts/, which is what would have failed lint/format:check confusingly:\n`
    );
    for (const f of stray) console.error(`  ${f}`);
    console.error('\nRemove it, or move it under the session scratchpad, then run check:fast again.');
    process.exit(1);
  }
}

/**
 * Is the pre-push hook actually installed?
 *
 * `.githooks/pre-push` refuses to push the deploying branch unless check:all
 * has passed on exactly that tree. Git does not use it until `core.hooksPath`
 * points there, which `npm install` does — so a checkout that skipped that
 * step has a guard sitting in the repository doing nothing, which is worse
 * than not having one, because it is easy to believe it is working.
 *
 * A warning rather than a failure: a fresh clone is in exactly this state
 * before its first install, and failing there would be a confusing first
 * impression of a check that is not about the code at all.
 */
if (!process.env.CI) {
  const hook = path.join(ROOT, '.githooks', 'pre-push');
  let configured = '';
  try {
    configured = execSync('git config --get core.hooksPath', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    configured = '';
  }
  if (fs.existsSync(hook) && configured !== '.githooks') {
    console.warn(
      `\x1b[33m${SELF} — the pre-push hook is present but git is not using it` +
        `${configured ? ` (core.hooksPath is "${configured}")` : ''}.\x1b[0m\n` +
        '  Nothing stops an unverified push to the deploying branch until you run:\n' +
        '    git config core.hooksPath .githooks\n'
    );
  }
}

const all = readSteps(SELF);
const steps = beforeTheBuild(all);
const skipped = all.length - steps.length;

if (!steps.length) {
  console.error(
    `${SELF} — found no steps before the workflow's build. Either the workflow no longer builds, or the parser is broken; ` +
      'either way this would have reported a clean run having checked nothing.'
  );
  process.exit(1);
}

const ENV = {
  ...process.env,
  HARF_BASE_URL: '/Urdu',
  HARF_BUILD_SHA: process.env.HARF_BUILD_SHA || 'local',
};

console.log(`${SELF} — ${steps.length} of ${all.length} steps, everything the workflow runs before it builds.`);

const started = Date.now();
let failed = null;
for (const step of steps) {
  process.stdout.write(`\n\x1b[1m▸ ${step.name}\x1b[0m\n  $ ${step.cmd}\n`);
  try {
    execSync(step.cmd, { cwd: ROOT, stdio: 'inherit', env: ENV });
  } catch {
    failed = step.name;
    break;
  }
}

const took = Math.round((Date.now() - started) / 1000);
if (failed) {
  console.error(`\n\x1b[31m${SELF} — failed at: ${failed}\x1b[0m`);
  console.error(`Caught in ${took}s, without building. Fix it, then run check:all.`);
  process.exit(1);
}
console.log(
  `\n\x1b[32m${SELF} — ${steps.length} steps pass in ${took}s.\x1b[0m\n` +
    `This is not the gate: ${skipped} step${skipped === 1 ? '' : 's'} were not run, including the build itself and ` +
    `every check that drives the built app. Run check:all before pushing.`
);
