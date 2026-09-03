/* eslint-disable */
/**
 * Does `soak.js` actually refuse an unrecognised `--track` value?
 *
 * URD-064: `arg('track', 'both')` used to hand the raw CLI string straight
 * to `trackSettingsFor` with no validation against the app's own
 * `LearnTrack` union (`'script' | 'roman' | 'both'`, `useSettingsStore.ts`)
 * — a typo like `--track roams` wrote `{track: 'roams'}` into
 * `harf-settings` and ran the whole session anyway, silently behaving like
 * `'both'` under a label nobody chose (`generator.ts`'s own checks treat
 * anything that isn't literally `'roman'` as script-teaching).
 *
 * Spawns the real `soak.js` as a child process rather than importing its
 * internals — the fix exits before `dist/` is even checked for, and this
 * checks a different mechanism from `check-soak-track.js` (which needs a
 * real build and browser to confirm `enterAsGuest`'s settings argument
 * reaches `harf-settings`, once a *valid* track is already in hand). This
 * check only needs `soak.js`'s very first line of output — see
 * `runUntilOutput` below for why that changes how it drives the child.
 *
 * Run with:  npm run check:soak-track-arg
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOAK = path.join(ROOT, 'scripts', 'soak.js');

const problems = [];

/**
 * THE CRITIC: a first version used `spawnSync` with a fixed 5s timeout on
 * the theory that `--lessons 0` makes a valid run "exit immediately after
 * passing validation." Measured directly, that theory was false: even with
 * `--lessons 0`, `soak.js`'s own IIFE still launches a real headless
 * Chromium, serves `dist/`, and runs a full guest onboarding *before* it
 * ever checks the loop bound — about 10 real seconds, not "immediately."
 * The fixed 5s timeout fired on every ordinary run here, not only a slow
 * one, and `spawnSync`'s timeout kill only ever reached the immediate
 * `node` process, not the Chromium it had already launched as its own
 * child — leaving zombie `chrome`/`chrome_crashpad_handler` processes
 * behind after every single run of this check.
 *
 * Fixed by not waiting for a full run at all: this only ever needs to know
 * what `soak.js`'s very first line of output is (the rejection message, or
 * the startup banner proving validation passed) — nothing before that
 * point depends on `dist/`, a browser, or a real lesson attempt (confirmed
 * by reading `soak.js` top to bottom: no `console` call happens before the
 * `--track` check). Resolving on the first `data` event, and killing the
 * whole process *group* (`-child.pid`, requiring `detached: true` — a
 * plain `child.kill()` again only reaches the immediate `node` process,
 * not Chromium) as soon as that first line arrives, closes both the
 * flakiness and the zombie-process leak at once: a real run only ever
 * costs the time to print one line, not the time to finish one.
 */
function runUntilOutput(args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const child = spawn('node', [SOAK, ...args], { cwd: ROOT, detached: true });
    let out = '';
    let done = false;
    const finish = (timedOut) => {
      if (done) return;
      done = true;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        // Already gone — nothing to clean up.
      }
      resolve({ out, timedOut });
    };
    child.stdout.on('data', (d) => {
      out += d;
      finish(false);
    });
    child.stderr.on('data', (d) => {
      out += d;
      finish(false);
    });
    child.on('exit', () => finish(false));
    child.on('error', () => finish(false));
    setTimeout(() => finish(true), timeoutMs);
  });
}

(async () => {
  // The bad value: must produce output naming both the bad value and the
  // three it accepts, before anything else runs.
  const bad = await runUntilOutput(['--track', 'roams']);
  if (bad.timedOut) {
    problems.push('--track roams: process produced no output at all within the timeout');
  } else {
    if (!bad.out.includes('roams'))
      problems.push(`--track roams: error message does not name the bad value: ${bad.out}`);
    for (const valid of ['script', 'roman', 'both']) {
      if (!bad.out.includes(valid))
        problems.push(`--track roams: error message does not name "${valid}" as accepted: ${bad.out}`);
    }
  }

  // The `--name=value` form: an equally ordinary CLI convention `arg()`
  // used to silently ignore (THE CRITIC) — same bad-value check, this
  // time reached through `=` rather than a typo.
  const badEq = await runUntilOutput(['--track=roams']);
  if (badEq.timedOut) {
    problems.push('--track=roams: process produced no output at all within the timeout');
  } else if (!/unrecognised --track/.test(badEq.out)) {
    problems.push(`--track=roams: expected the same rejection as the space-separated form, got: ${badEq.out}`);
  }

  // The three real values, both forms: must not be rejected. Resolves the
  // moment the process says anything at all (its startup banner, if
  // validation passed) rather than waiting for a full soak run to finish.
  for (const valid of ['script', 'roman', 'both']) {
    for (const args of [['--track', valid], [`--track=${valid}`]]) {
      const ok = await runUntilOutput(args);
      if (ok.timedOut) {
        problems.push(`${args.join(' ')}: process produced no output at all within the timeout`);
      } else if (/unrecognised --track/.test(ok.out)) {
        problems.push(`${args.join(' ')}: wrongly rejected as unrecognised`);
      }
    }
  }

  if (problems.length) {
    console.error(`check:soak-track-arg — ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    'check:soak-track-arg — an unrecognised --track value (space- or equals-separated) is rejected by name before anything else runs.'
  );
})();
