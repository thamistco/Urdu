/* eslint-disable */
/**
 * Who is using `dist/` right now.
 *
 * `check:all` opens with `rm -rf dist && npm run build:web`; a playtest serves
 * `dist/` to a browser for anything from ten minutes to two hours. Run them at
 * the same time and the playtest's server loses the files underneath it
 * mid-run, or the build races a reader. Neither fails in a way that says so —
 * the playtest reports screens it could not read as findings about the app.
 *
 * This session serialised the two by hand every single time, and one 40-minute
 * run was lost to getting it wrong. A lock is cheaper than remembering.
 *
 * The staleness rule is the same one `check:all`'s own lock uses, and matters
 * as much as the lock: a lock file left behind by a killed run, refusing every
 * later run until somebody deletes it, is worse than no lock at all — that is
 * how locks get removed for good.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Is `pid` a real, currently-running process? `process.kill(pid, 0)` sends no
 * signal, only asks the kernel whether it could — ESRCH means the process is
 * gone, EPERM means it exists but belongs to someone else, and is therefore
 * still holding whatever it holds.
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

/** `{ pid, who, since }` if a live process holds `file`, otherwise null. */
function holderOf(file) {
  const full = path.isAbsolute(file) ? file : path.join(ROOT, file);
  if (!fs.existsSync(full)) return null;
  let held;
  try {
    const raw = fs.readFileSync(full, 'utf8').trim();
    held = raw.startsWith('{') ? JSON.parse(raw) : { pid: Number(raw), who: path.basename(full) };
  } catch {
    return null; // unreadable is treated as absent; it cannot name anyone to wait for
  }
  return isAlive(held.pid) ? held : null;
}

/**
 * Take `file` for `who`, and give it back on the way out — including on
 * Ctrl-C and on an uncaught throw, since a tool that only releases on the
 * happy path leaves exactly the stale locks that make people delete the
 * mechanism.
 */
function take(file, who) {
  const full = path.isAbsolute(file) ? file : path.join(ROOT, file);
  fs.writeFileSync(full, JSON.stringify({ pid: process.pid, who, since: new Date().toISOString() }) + '\n');
  const release = () => {
    try {
      const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (raw.pid === process.pid) fs.unlinkSync(full);
    } catch {}
  };
  process.on('exit', release);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => {
      release();
      process.exit(130);
    });
  }
  return release;
}

/**
 * Stop, naming who is using dist and since when — or return, having said
 * nothing, when nobody is.
 */
function refuseIfBusy(self, file) {
  const held = holderOf(file);
  if (!held) return;
  console.error(
    `${self} — ${held.who} is using dist/ (PID ${held.pid}, since ${held.since || 'an unknown time'}).\n` +
      `  They cannot overlap: check:all deletes and rebuilds dist/, and a playtest serves it for the\n` +
      `  length of a run. Wait for it, or kill -9 ${held.pid} if it is stuck.`
  );
  process.exit(1);
}

const CHECK_ALL_LOCK = '.check-all.lock';
const PLAYTEST_LOCK = '.playtest.lock';

module.exports = { isAlive, holderOf, take, refuseIfBusy, CHECK_ALL_LOCK, PLAYTEST_LOCK, ROOT };
