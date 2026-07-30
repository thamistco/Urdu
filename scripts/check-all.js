/* eslint-disable */
/**
 * Run what CI runs, the way CI runs it, before pushing.
 *
 * Every individual check passed locally and the deploy failed twice anyway.
 * `check:scenery` served the export from `/`, which is right locally and wrong
 * in CI, because CI first writes the deploy's base path (`/<repo>`) into
 * app.json — so every asset 404s, the bundle never loads, and the check fails
 * with a message about a missing SVG. Two commits sat unpublished while the
 * site looked unchanged.
 *
 * The lesson is not "remember the base path". It is that running the checks
 * one at a time, against a build made differently from the real one, is not
 * the same test — and nothing said so. This makes it one command.
 *
 * The step list is READ FROM `.github/workflows/deploy-preview.yml` rather than
 * copied here, because a local mirror of a CI pipeline drifts from it the same
 * way `tailwind.config.js` drifted from `colors.ts`. If a step is added to the
 * workflow, it runs here the next time without anyone updating this file.
 *
 *   npm run check:all
 *
 * app.json is modified (base path) and restored, including on failure.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'deploy-preview.yml');
const APP_JSON = path.join(ROOT, 'app.json');
const REPO = 'Urdu'; // matches github.event.repository.name in the workflow

/**
 * Pull the runnable commands out of the workflow, in order.
 *
 * Only `npm run …` and `node scripts/…` lines are taken. The rest of the job —
 * checkout, setup-node, Pages upload, `playwright install` — is either
 * meaningless locally or already true of this machine.
 *
 * **Comment lines are skipped, and this script excludes itself.** The first
 * version did neither, and the workflow contains a comment that mentions
 * `npm run check:all` by name. So it parsed its own name out of English prose
 * and ran itself, recursively, each level re-exporting the bundle. It did not
 * error; it simply never finished, which is the worst way for a check to fail.
 * Both guards below are asserted, not assumed.
 */
const SELF = 'check:all';

function stepsFromWorkflow() {
  const yml = fs.readFileSync(WORKFLOW, 'utf8').split('\n');
  const steps = [];
  let name = null;
  for (const line of yml) {
    if (/^\s*#/.test(line)) continue; // prose, not pipeline
    const n = line.match(/^\s*- name:\s*(.+?)\s*$/);
    if (n) {
      name = n[1];
      continue;
    }
    // Strip a trailing comment before matching, so `npm run x  # see check:all`
    // contributes the command and not the aside.
    const code = line.replace(/\s#.*$/, '');
    for (const m of code.matchAll(/\b(npm run [a-z:]+|node scripts\/[\w-]+\.js)\b/g)) {
      const cmd = m[1];
      if (cmd.includes(SELF)) continue;
      if (steps.some((s) => s.cmd === cmd)) continue;
      steps.push({ name: name || cmd, cmd });
    }
  }
  return steps;
}

const steps = stepsFromWorkflow();

if (steps.some((s) => s.cmd.includes(SELF))) {
  console.error(`check:all — parsed itself out of the workflow and would recurse. The comment filter is broken.`);
  process.exit(1);
}
if (steps.length < 6) {
  console.error(
    `check:all — only found ${steps.length} runnable steps in the workflow. This parser is broken, not the pipeline; fix it rather than trusting a short green run.`
  );
  process.exit(1);
}
if (process.env.HARF_CHECK_ALL_RUNNING) {
  console.error('check:all — refusing to run inside another check:all. Something re-entered it.');
  process.exit(1);
}
process.env.HARF_CHECK_ALL_RUNNING = '1';

const original = fs.readFileSync(APP_JSON, 'utf8');
let failed = null;

function restore() {
  fs.writeFileSync(APP_JSON, original);
}
process.on('exit', restore);
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

function run(label, cmd) {
  process.stdout.write(`\n[1m▸ ${label}[0m\n  $ ${cmd}\n`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, CI: '1' } });
    return true;
  } catch {
    failed = label;
    return false;
  }
}

// The export has to happen where the workflow puts it: after the base path is
// written, and before the checks that drive the built app.
const EXPORT = 'rm -rf dist && npx expo export --platform web --output-dir dist';

console.log(`check:all — ${steps.length} steps, read from ${path.relative(ROOT, WORKFLOW)}`);
console.log(`Building with baseUrl "/${REPO}", as the deploy does. app.json is restored afterwards.`);

const app = JSON.parse(original);
app.expo.experiments = { ...(app.expo.experiments || {}), baseUrl: `/${REPO}` };
fs.writeFileSync(APP_JSON, JSON.stringify(app, null, 2));

let exported = false;
for (const step of steps) {
  // Anything that drives the built app needs the export to exist first.
  const needsBuild = /check:(stability|scenery)|web:meta/.test(step.cmd);
  if (needsBuild && !exported) {
    if (!run('Export web bundle (with the deploy base path)', EXPORT)) break;
    exported = true;
  }
  if (!run(step.name, step.cmd)) break;
}

restore();

if (failed) {
  console.error(`\n[31mcheck:all — failed at: ${failed}[0m`);
  console.error('This is what CI would have done. Fix it before pushing.');
  process.exit(1);
}
console.log(`\n[32mcheck:all — all ${steps.length} steps pass against a deploy-shaped build.[0m`);
