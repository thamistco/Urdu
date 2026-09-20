/* eslint-disable */
/**
 * A gate may not wait for a duration where it means to wait for a condition.
 *
 * `check:links` failed on a commit that was already deployed, reporting that
 * back navigation had left the app. It had not. Under the load of a playtest
 * on the same machine, a fixed 1400ms sleep ran out before the screen
 * re-rendered, so the check read a page mid-boot and described what it saw.
 * A re-run passed. A third run failed differently, blaming a deep link and
 * then the sign-in screen — three diagnoses, none of them true, one cause.
 *
 * The cost is not the failure, it is the re-run. A check that fails for a
 * reason that is not in the code teaches whoever sees it to run it again, and
 * the next real failure gets the same treatment. Two full pipelines went on
 * that one, plus the investigation.
 *
 * So the number of long fixed sleeps in the gates is a ratchet. It may fall,
 * and every time it does this file says so; it may not rise.
 *
 * ## Why a length threshold rather than a ban
 *
 * `await page.waitForTimeout(100)` inside a polling loop is the correct
 * shape — it is the interval between two reads of a condition, not a guess
 * about when something will be ready. What goes wrong is the other kind: a
 * second or two after an action, with an assertion immediately after it, which
 * is a guess about a machine's speed written as a constant. Everything at or
 * above LONG_MS is that second kind or close enough to be worth justifying.
 *
 * ## The escape hatch
 *
 * Some waits genuinely have no condition to poll — an animation that must be
 * allowed to finish before a screenshot, a debounce with no observable end.
 * Mark those `fixed-wait-ok: <reason>` on the line or the line above. They are
 * still counted and still shown, so the justification is visible rather than
 * invisible.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/** At or above this, a sleep is standing in for a condition. */
const LONG_MS = 500;

/**
 * How many long fixed sleeps the gates currently hold.
 *
 * Measured, not chosen. When this falls, lower it in the same commit — a
 * ratchet nobody tightens is a ceiling nobody notices.
 */
const LONG_SLEEPS = 44;

/** The gates. `playtest.js` is a tool rather than a gate and is not counted. */
function gateFiles() {
  const dirs = [ROOT + '/scripts', ROOT + '/scripts/lib'];
  const out = [];
  for (const dir of dirs) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (!f.endsWith('.js') || !fs.statSync(full).isFile()) continue;
      if (dir.endsWith('/lib') || f.startsWith('check-')) out.push(full);
    }
  }
  return out.filter((f) => path.basename(f) !== 'check-waits.js');
}

const OK = /fixed-wait-ok:/;
const found = [];
for (const file of gateFiles()) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const m = [...line.matchAll(/waitForTimeout\(\s*(\d+)\s*\)/g)];
    for (const hit of m) {
      const ms = Number(hit[1]);
      if (ms < LONG_MS) continue;
      const justified = OK.test(line) || OK.test(lines[i - 1] || '');
      found.push({ file: path.relative(ROOT, file), line: i + 1, ms, justified });
    }
  });
}

const total = found.length;
const justified = found.filter((f) => f.justified).length;

if (total > LONG_SLEEPS) {
  const byFile = {};
  for (const f of found) byFile[f.file] = (byFile[f.file] || 0) + 1;
  console.error(`check:waits — ${total} fixed sleeps of ${LONG_MS}ms or more in the gates, up from ${LONG_SLEEPS}.\n`);
  for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1]))
    console.error(`  ${n.toString().padStart(3)}  ${f}`);
  console.error(
    `\nA gate that sleeps for a second and then asserts is guessing at a machine's speed.\n` +
      `Wait for the condition instead — see renderedScreen in scripts/lib/serve-dist.js — or,\n` +
      `if there is genuinely nothing to poll, mark the line "fixed-wait-ok: <reason>".`
  );
  process.exit(1);
}

if (total < LONG_SLEEPS) {
  console.error(
    `check:waits — down to ${total} long fixed sleeps from ${LONG_SLEEPS}. Lower LONG_SLEEPS in\n` +
      `scripts/check-waits.js to ${total} in this commit, so the ceiling actually descends.`
  );
  process.exit(1);
}

console.log(
  `check:waits — ${total} fixed sleeps of ${LONG_MS}ms or more across ${new Set(found.map((f) => f.file)).size} gate scripts` +
    `${justified ? `, ${justified} justified in place` : ''}. Not rising.`
);
