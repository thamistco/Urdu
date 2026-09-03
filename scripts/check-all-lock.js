/* eslint-disable */
/**
 * Prove URD-056's lockfile actually stops two concurrent `check:all` runs
 * from corrupting each other's `dist/` rebuild — by starting two real ones
 * and watching the second refuse, not by unit-testing the lock helper in
 * isolation (non-negotiable 2: a guard never seen to fire is a hypothesis).
 *
 * A full `check:all` run takes several minutes; this doesn't wait for
 * either to finish. The lock is taken before any step runs, so the loser
 * always refuses before any real work starts — this only needs to watch
 * long enough to see that happen, then kills the survivor rather than
 * letting it run the real pipeline twice. How long "long enough" actually
 * is depends on host load, not on the lock: measured directly in this
 * project's own sandboxed session, a fresh `node` process reaching that
 * point took anywhere from under a second to ~25s under contention from
 * this session's own other background work — trivial next to the several
 * minutes a step can take, but real enough that this file's own timeouts
 * are set generously rather than to a specific "should be instant" figure
 * nothing here actually measured.
 *
 * That kill happens early — at or just past the survivor's first step —
 * which is also where signal-based release is at its most reliable (see
 * `check-all.js`'s own comment above its signal handlers): every step runs
 * via a blocking `execSync`, and a signal cannot be handled until that
 * block ends, so this script's own SIGTERM assertion proves release works
 * *between* steps, not that it preempts a step already hung mid-run. That
 * harder case is what `kill -9` (SIGKILL, always uncatchable) is for, and
 * why the tool's own refusal message says `-9` rather than plain `kill`.
 *
 *   npm run check:all-lock
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LOCKFILE = path.join(ROOT, '.check-all.lock');
const SCRIPT = path.join(__dirname, 'check-all.js');

function fail(msg) {
  console.error(`check:all-lock — ${msg}`);
  process.exit(1);
}

// A stale lock from an earlier killed run would let the "first" process
// below win by luck rather than by the guard — start from a known-clean
// state, the same way any test clears its own fixture first.
if (fs.existsSync(LOCKFILE)) fs.unlinkSync(LOCKFILE);

function launch() {
  const child = spawn(process.execPath, [SCRIPT], { cwd: ROOT, env: process.env });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));
  return {
    child,
    get output() {
      return out;
    },
  };
}

(async () => {
  const a = launch();
  // Real concurrency, not a head start — both processes reach `acquireLock`
  // within milliseconds of each other, the actual race this item is about.
  const b = launch();

  const exitOf = (p) => new Promise((resolve) => p.child.on('exit', (code) => resolve(code)));

  const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve('timeout'), ms));

  // The lock decision itself is near-instant — acquireLock runs before any
  // step. This window is generous rather than tight anyway: a cold Node
  // start plus parsing the workflow YAML can take a real few seconds under
  // load, and this should fail on an actual hang, not on the host being
  // briefly busy (measured: one run under this session's own background
  // load took over 15s to resolve with nothing wrong — 30s has real margin
  // without coming anywhere near a step's own multi-second-to-minutes cost).
  const first = await Promise.race([
    exitOf(a).then((code) => ({ which: 'a', code })),
    exitOf(b).then((code) => ({ which: 'b', code })),
    timeout(30000),
  ]);

  if (first === 'timeout') {
    a.child.kill('SIGKILL');
    b.child.kill('SIGKILL');
    fail('neither run exited within 30s — the lock check should refuse well before any step runs. Something hung.');
  }

  const loser = first.which === 'a' ? a : b;
  const survivor = first.which === 'a' ? b : a;

  if (first.code === 0)
    fail(`the run that exited first (${first.which}) exited 0 — expected the loser to refuse (exit 1).`);
  if (!/already running as PID \d+/.test(loser.output)) {
    fail(
      `the run that exited first (${first.which}) did not print the expected refusal message. Output:\n${loser.output}`
    );
  }

  console.log('check:all-lock — the second run refused by name, real PID and all:');
  console.log(
    loser.output
      .split('\n')
      .filter((l) => l.includes('already running'))
      .map((l) => `  ${l}`)
      .join('\n')
  );

  // The point is proven — stop the survivor rather than let a verification
  // run pay for a full deploy-shaped pipeline.
  //
  // THE CRITIC: SIGTERM only releases the lock in the gaps *between*
  // steps — every step runs via a blocking `execSync`, and the signal
  // handler cannot run until that block ends (see `check-all.js`'s own
  // comment above its handlers). Confirmed live: the first version of
  // this script asserted SIGTERM always releases within 300ms and hung
  // for minutes the one time the survivor was genuinely mid-step when
  // killed, then reported a false "release-on-signal is not working"
  // once it was force-killed from outside. Racing a short wait against
  // SIGKILL, and treating *either* outcome as correct, is what makes this
  // script honest about which path actually happened rather than
  // asserting the fast one always does.
  survivor.child.kill('SIGTERM');
  const exited = await Promise.race([exitOf(survivor).then(() => true), timeout(3000).then(() => false)]);

  if (exited) {
    await new Promise((r) => setTimeout(r, 300));
    if (fs.existsSync(LOCKFILE)) {
      fail(`survivor exited after SIGTERM but the lockfile is still there — release-on-exit is not working.`);
    }
    console.log('check:all-lock — the survivor exited on SIGTERM (between steps) and released the lock cleanly.');
  } else {
    // Still blocked inside a step — the realistic "stuck" case. SIGKILL
    // is uncatchable, so this always ends it; the lock is *expected* to
    // survive, exactly as a real killed run's would, recovered as stale
    // by the next `check:all` (verified separately by THE CRITIC against
    // a real SIGKILLed run) rather than by this process cleaning up after
    // itself.
    survivor.child.kill('SIGKILL');
    await exitOf(survivor);
    if (!fs.existsSync(LOCKFILE)) {
      fail(
        'survivor was SIGKILLed mid-step but left no lockfile behind — the stale-lock recovery path has nothing to recover.'
      );
    }
    console.log(
      'check:all-lock — SIGTERM did not land before the survivor’s own step finished (the documented gap); ' +
        'SIGKILL ended it and left the expected stale lock for the next run to recover.'
    );
    fs.unlinkSync(LOCKFILE);
  }

  console.log('\ncheck:all-lock — clean. The lock is real, not a hypothesis.');
})();
