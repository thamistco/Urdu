/* eslint-disable */
/**
 * The CI pipeline's step list, parsed out of the workflow.
 *
 * Extracted from `check-all.js` so a second runner can share it. The reason
 * the list is read from `.github/workflows/deploy-preview.yml` rather than
 * copied anywhere is unchanged and is the whole point: a local mirror of a CI
 * pipeline drifts from it the same way `tailwind.config.js` drifted from
 * `colors.ts`. Two local mirrors would drift twice as fast.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'deploy-preview.yml');

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

/** The step that produces the bundle. Everything after it may depend on one. */
const BUILDS = /build:web/;

function stepsFromWorkflow(self) {
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
      if (found.includes(self)) continue;
      if (!steps.some((s) => s.cmd === found)) steps.push({ name: name || found, cmd: found });
      continue;
    }
    if (body.endsWith('\\') || !NOT_LOCAL.some((s) => s.re.test(body))) {
      if (!body.endsWith('\\')) unrecognised.push(body);
    }
  }
  return { steps, unrecognised };
}

/**
 * The parsed steps, or a named explanation and a non-zero exit.
 *
 * `self` is the caller's own script name, kept out of the list so a runner
 * mentioned by name in the workflow's prose cannot parse itself out of English
 * and recurse.
 */
function readSteps(self) {
  const { steps, unrecognised } = stepsFromWorkflow(self);

  if (steps.some((s) => s.cmd.includes(self))) {
    console.error(`${self} — parsed itself out of the workflow and would recurse. The comment filter is broken.`);
    process.exit(1);
  }
  if (unrecognised.length) {
    console.error(
      `${self} — ${unrecognised.length} workflow command${unrecognised.length === 1 ? '' : 's'} neither recognised nor listed as not-runnable-locally:\n`
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
      `${self} — only found ${steps.length} runnable steps in the workflow. This parser is broken, not the pipeline; fix it rather than trusting a short green run.`
    );
    process.exit(1);
  }
  return steps;
}

/**
 * The steps that run before the bundle is built.
 *
 * Structural rather than a hand-kept list, so a step added to the workflow
 * lands on the right side of the line without anyone deciding: the workflow
 * builds once, and everything before that point is by definition a check that
 * needs no bundle and drives no browser.
 */
function beforeTheBuild(steps) {
  const at = steps.findIndex((s) => BUILDS.test(s.cmd));
  return at === -1 ? [] : steps.slice(0, at);
}

module.exports = { readSteps, beforeTheBuild, stepsFromWorkflow, NOT_LOCAL, BUILDS, WORKFLOW, ROOT };
