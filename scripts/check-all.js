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
 * No file is modified. The subpath arrives as `HARF_BASE_URL`, exactly as it
 * does in CI — see app.config.js. An earlier version of this script rewrote
 * app.json and restored it afterwards, so a killed run left the tree dirty and
 * two concurrent runs corrupted each other's build. Configuration belongs in
 * the environment, not in a file the checker edits behind your back.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'deploy-preview.yml');
const REPO = 'Urdu'; // matches github.event.repository.name in the workflow

/**
 * Pull the runnable commands out of the workflow, in order.
 *
 * Only `npm …` and `node scripts/…` lines are taken. The rest of the job —
 * checkout, setup-node, Pages upload, `playwright install` — is either
 * meaningless locally or already true of this machine.
 *
 * **Comment lines are skipped, and this script excludes itself.** An early
 * version did neither, and the workflow mentions `npm run check:all` by name in
 * prose. So it parsed its own name out of English and ran itself recursively,
 * each level re-exporting the bundle. It did not error; it simply never
 * finished, which is the worst way for a check to fail.
 *
 * **And every command in the workflow is accounted for.** The pattern used to
 * be `npm run <script>`, which does not match `npm test` — so when a unit-test
 * step was added to the workflow, this quietly ran seventeen of eighteen steps
 * and reported a clean pipeline. A checker that silently skips is the exact
 * failure it exists to prevent, so the omission is now impossible: anything
 * that looks like a command and is neither recognised nor on the documented
 * skip list is a hard error.
 */
const SELF = 'check:all';

/**
 * Workflow steps that deliberately do not run locally, and why. Anything not
 * matched and not listed here stops the run rather than being ignored.
 */
const NOT_LOCAL = [
  { re: /^actions\//, why: 'a GitHub Action, not a command' },
  { re: /^npx playwright install/, why: 'the browser is already installed here' },
  { re: /^cp dist\/index\.html|^touch dist\/\.nojekyll/, why: 'Pages packaging, not a check' },
  { re: /^node -e /, why: 'inline scripting in the workflow' },
  { re: /^CHROMIUM_PATH=/, why: 'resolved by the checks themselves locally' },
  { re: /^npm ci$/, why: 'dependencies are already installed in a working checkout' },
];

function stepsFromWorkflow() {
  const yml = fs.readFileSync(WORKFLOW, 'utf8').split('\n');
  const steps = [];
  const unrecognised = [];
  let name = null;
  let inRun = false;

  for (const line of yml) {
    if (/^\s*#/.test(line)) continue; // prose, not pipeline
    const n = line.match(/^\s*- name:\s*(.+?)\s*$/);
    if (n) {
      name = n[1];
      inRun = false;
      continue;
    }
    if (/^\s*(- )?uses:/.test(line)) {
      inRun = false;
      continue;
    }
    if (/^\s*run:\s*\|?\s*$/.test(line)) {
      inRun = true;
      continue;
    }

    // Strip a trailing comment, so `npm run x  # see check:all` contributes
    // the command and not the aside.
    const code = line.replace(/\s#.*$/, '');
    const inline = code.match(/^\s*run:\s*(.+?)\s*$/);
    const body = inline ? inline[1] : inRun && code.trim() ? code.trim() : null;
    if (inline) inRun = false;
    if (!body) continue;

    // URD-027: `[a-z:]+` silently truncated a hyphenated script name at the
    // hyphen — `npm run check:sentence-coverage` parsed as `npm run
    // check:sentence`, a script that doesn't exist, and `check:all` failed
    // with npm's "did you mean" rather than running the real check. Every
    // script name until this one happened to be hyphen-free, so nothing had
    // exercised this before. `[a-z:-]` admits the character actually used.
    const cmd = body.match(/\b(npm (?:run [a-z:-]+|test)|node scripts\/[\w-]+\.js)\b/);
    if (cmd) {
      const found = cmd[1];
      if (found.includes(SELF)) continue;
      if (!steps.some((s) => s.cmd === found)) steps.push({ name: name || found, cmd: found });
      continue;
    }
    if (body.endsWith('\\') || !NOT_LOCAL.some((s) => s.re.test(body))) {
      if (!body.endsWith('\\')) unrecognised.push(body);
    }
  }
  return { steps, unrecognised };
}

const { steps, unrecognised } = stepsFromWorkflow();

if (steps.some((s) => s.cmd.includes(SELF))) {
  console.error(`check:all — parsed itself out of the workflow and would recurse. The comment filter is broken.`);
  process.exit(1);
}
if (unrecognised.length) {
  console.error(
    `check:all — ${unrecognised.length} workflow command${unrecognised.length === 1 ? '' : 's'} neither recognised nor listed as not-runnable-locally:\n`
  );
  for (const u of unrecognised) console.error(`  ${u}`);
  console.error(
    '\nRunning some of the pipeline and calling it clean is how a broken step reaches the deploy.\n' +
      'Teach the parser to run it, or add it to NOT_LOCAL with the reason it cannot run here.'
  );
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

let failed = null;

/**
 * The environment every step runs in — the same one the workflow provides.
 *
 * `CI=1` matters as much as the base path: the browser checks skip when they
 * cannot find a bundle or a browser, and a skip is only forgivable for someone
 * who has not built yet. Here, where the whole point is to stand in for CI, a
 * skip would be a green tick over a check that never ran.
 */
const ENV = {
  ...process.env,
  CI: '1',
  HARF_BASE_URL: `/${REPO}`,
  HARF_BUILD_SHA: process.env.HARF_BUILD_SHA || 'local',
};

function run(label, cmd) {
  process.stdout.write(`\n\x1b[1m\u25b8 ${label}\x1b[0m\n  $ ${cmd}\n`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: ENV });
    return true;
  } catch {
    failed = label;
    return false;
  }
}

/** The one build command, the same one the workflow runs. */
const BUILD = 'rm -rf dist && npm run build:web';

console.log(`check:all \u2014 ${steps.length} steps, read from ${path.relative(ROOT, WORKFLOW)}`);
console.log(`Building with HARF_BASE_URL="/${REPO}", as the deploy does. No files are modified.`);

let exported = false;
for (const step of steps) {
  // Anything that drives the built app needs the bundle to exist first. The
  // workflow builds before those steps, so normally this never fires — it is
  // the safety net for a reordering that would otherwise fail confusingly.
  const needsBuild = /check:(stability|scenery)|web:meta/.test(step.cmd);
  if (needsBuild && !exported) {
    if (!run('Build the web bundle (with the deploy base path)', BUILD)) break;
    exported = true;
  }
  if (!run(step.name, step.cmd)) break;
  if (/build:web/.test(step.cmd)) exported = true;
}

if (failed) {
  console.error(`\n[31mcheck:all — failed at: ${failed}[0m`);
  console.error('This is what CI would have done. Fix it before pushing.');
  process.exit(1);
}
console.log(`\n[32mcheck:all — all ${steps.length} steps pass against a deploy-shaped build.[0m`);
