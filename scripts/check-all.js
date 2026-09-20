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
const { readSteps } = require('./lib/workflow-steps');

const ROOT = path.join(__dirname, '..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'deploy-preview.yml');
const REPO = 'Urdu'; // matches github.event.repository.name in the workflow

/**
 * URD-057: caught here, first, unconditionally — before the workflow is
 * even read — rather than as a parsed step. A stray scratch file left
 * under `src/`/`scripts/` by a dispatched critic has nothing to do with
 * the workflow's own step list (CI's fresh checkout never has one at
 * all; this is purely a shared-local-checkout hazard), and it is cheap
 * to name directly rather than let it surface, unexplained, as a
 * confusing `lint`/`format:check` failure many steps in. See
 * `lib/clean-tree.js` for why an ignore pattern is the wrong fix.
 */
{
  const { strayFiles } = require('./lib/clean-tree');
  const stray = strayFiles();
  if (stray.length) {
    console.error(
      `check:all — ${stray.length} untracked file${stray.length === 1 ? '' : 's'} under src/ or scripts/ — this is what would have failed lint/format:check confusingly, several steps in:\n`
    );
    for (const f of stray) console.error(`  ${f}`);
    console.error('\nRemove it, or move it under the session scratchpad, then run check:all again.');
    process.exit(1);
  }
}

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
 * The step list, and the rules about parsing it, live in
 * `lib/workflow-steps.js` — shared with `check:fast`, which runs the part of
 * this pipeline that needs no bundle. One parser, so neither runner can drift
 * from the workflow or from the other.
 */
const steps = readSteps(SELF);

if (process.env.HARF_CHECK_ALL_RUNNING) {
  console.error('check:all — refusing to run inside another check:all. Something re-entered it.');
  process.exit(1);
}
process.env.HARF_CHECK_ALL_RUNNING = '1';

/**
 * URD-056: the guard above catches this process calling itself again —
 * useful, but it only ever sees its own environment, so it is blind to a
 * second, independent `npm run check:all` started from another terminal.
 * That collision is real and has fired repeatedly: this file's own header
 * comment already recorded, before any guard existed, that two concurrent
 * runs corrupt each other's `dist/` rebuild — a run started while another
 * holds it dies on `ENOENT: no such file or directory, open
 * 'dist/index.html'`, which reads like a regression in whatever the lead
 * was working on rather than a collision, and was misdiagnosed that way at
 * least twice (URD-041, URD-042) before being traced by inspecting the
 * process tree. A lockfile is visible across processes the way an
 * environment variable is not.
 *
 * The lock is taken here, before the loop that includes the `dist/`
 * rebuild, and named after the one thing that actually races: the build
 * step, not the whole pipeline. Held for the whole run regardless, since a
 * second run's *own* rebuild could still land mid-way through this run's
 * read-the-bundle steps even after the first rebuild is done.
 */
const LOCKFILE = path.join(ROOT, '.check-all.lock');

/**
 * Is `pid` a real, currently-running process? `process.kill(pid, 0)` sends
 * no signal, only asks the kernel whether it could — ESRCH means the
 * process is gone (a stale lock, left behind by a run that was killed
 * rather than exiting normally), EPERM means it exists but is owned by
 * someone else (still alive; still holds the lock).
 *
 * THE CRITIC: this asks only "does *some* process own this PID", not
 * "is it actually a `check:all` run" — a stale lock whose PID a later,
 * unrelated process reuses would read as still held, and the refusal
 * would name the wrong process to look at. Narrow in practice (needs PID
 * reuse after a killed run, on a busy machine, before the next
 * `check:all`), and a start-time/nonce check to close it is more
 * machinery than a single-developer tool's lock is worth — noted rather
 * than fixed.
 */
function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function acquireLock() {
  if (fs.existsSync(LOCKFILE)) {
    const heldPid = Number(fs.readFileSync(LOCKFILE, 'utf8').trim());
    if (isAlive(heldPid)) {
      console.error(
        `check:all — already running as PID ${heldPid} (${path.relative(ROOT, LOCKFILE)}). Two concurrent runs corrupt the same dist/ rebuild — wait for it to finish, or \`kill -9 ${heldPid}\` if it is stuck (see the note above \`acquireLock\`/\`releaseLock\` for why plain \`kill\` often will not while it's inside a step).`
      );
      process.exit(1);
    }
    // The holding process is gone without releasing its own lock — killed
    // rather than exited normally. Stale, safe to take over; say so rather
    // than silently overwriting evidence of what happened.
    console.log(`check:all — found a stale lock from PID ${heldPid} (no longer running); taking it over.`);
  }
  fs.writeFileSync(LOCKFILE, String(process.pid));
}

/** Only removes the lock if it is still this process's own — a run that
 *  lost the race above never wrote it and must not delete the winner's. */
function releaseLock() {
  try {
    if (fs.existsSync(LOCKFILE) && fs.readFileSync(LOCKFILE, 'utf8').trim() === String(process.pid)) {
      fs.unlinkSync(LOCKFILE);
    }
  } catch {
    // Best-effort on the way out — a failed cleanup here leaves a lock a
    // future run's own stale-PID check already knows how to recover from.
  }
}

acquireLock();
process.on('exit', releaseLock);
/**
 * `exit` alone does not fire on a signal — a killed run needs its own
 * handler, the exact gap that first let two runs corrupt each other's
 * `dist/` (this file's own header comment).
 *
 * THE CRITIC, empirically: this handler releases the lock cleanly for a
 * signal that arrives *between* steps — but every step runs via
 * `execSync` (`run()`, below), which blocks Node's single thread for the
 * step's whole duration, and a signal handler cannot run until that
 * block ends. Registering a handler at all also overrides the *default*
 * disposition for that signal — the thing that used to kill this process
 * immediately, with no handler installed, even mid-step. So a plain
 * `kill`/Ctrl-C sent while stuck inside a genuinely hung step now does
 * nothing until the step returns (if it ever does), where before this
 * lock existed the same signal would have ended the process outright.
 * `kill -9` (SIGKILL, uncatchable) still always works — it just leaves
 * the lock behind, correctly recovered as stale by the next run's own
 * `acquireLock` (verified: THE CRITIC SIGKILLed a real run mid-step and
 * confirmed the next run detected and took over the resulting stale
 * lock rather than refusing forever). The refusal message above says
 * `-9` for exactly this reason — do not soften it to plain `kill`.
 */
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    releaseLock();
    process.exit(1);
  });
}

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

/**
 * Leave a note of exactly what passed, for the pre-push hook to read.
 *
 * A green run only licenses pushing the tree it ran against. 71188a6 went
 * straight to the branch the site deploys from without this pipeline having
 * seen it, and the run that finally did see it was red -- so whether the
 * deployed commit was good was unknown for a day, and finding out cost three
 * more full runs.
 *
 * The stamp records the commit, the tree, and whether anything was
 * uncommitted at the time. The tree is the part that matters: two commits with
 * different messages and identical content are the same test, and a commit
 * with one character changed is not.
 */
try {
  const at = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim();
  fs.writeFileSync(
    path.join(ROOT, '.check-all-pass'),
    JSON.stringify(
      {
        head: at('git rev-parse HEAD'),
        tree: at('git rev-parse HEAD^{tree}'),
        dirty: at('git status --porcelain') !== '',
        steps: steps.length,
        at: new Date().toISOString(),
      },
      null,
      2
    ) + '\n'
  );
} catch {
  // Not a git checkout, or git is unavailable. The pipeline still passed; the
  // hook will simply have nothing to read, and says so rather than assuming.
}
