/* eslint-disable */
/**
 * Does `enterAsGuest`'s new `settings` argument actually reach the app's
 * learn-track setting?
 *
 * URD-051: `npm run soak -- --track roman` looked like it drove the Roman
 * track — it named the flag, printed it in the run's own banner line, and
 * even set a real onboarding field (`goal: 'speak'`) — but `enterAsGuest`
 * only ever merged its `state` argument into `harf-progress`, never into
 * `harf-settings`, which is where `track` (`useSettingsStore.ts`) actually
 * lives. Every soak run that ever passed `--track roman` was silently
 * driving the guest default, `'both'`, under a label that said otherwise —
 * the exact "the workflow said success and it was wrong" shape CLAUDE.md's
 * first non-negotiable warns about, found inside shared test
 * infrastructure rather than CI itself.
 *
 * This does not re-run soak itself (too slow for a gate); it drives the
 * one call this bug lived in directly, the same real exported bundle every
 * other browser-driven check here uses, and reads real `localStorage` back
 * rather than trusting `enterAsGuest`'s own return value or the CLI flag's
 * name — the same mistake this item exists to fix.
 *
 *   npx expo export --platform web --output-dir dist && npm run check:soak-track
 */

const fs = require('fs');
const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8312;

function missing(msg) {
  console.log(`check:soak-track — ${msg}, skipping.`);
  process.exit(0);
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) missing('no dist/, run the web export first');

let chromium;
try {
  chromium = require('playwright-core').chromium;
} catch {
  missing('playwright-core is not installed');
}

/** Read back the one field this bug was about, from the real store's own
 *  persisted shape (`{state: {...}, version}`), not a guess at it. */
async function readTrack(page) {
  return page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('harf-settings') || 'null');
    return raw?.state?.track;
  });
}

(async () => {
  const exe = findChromium();
  if (!exe) missing('no Chromium found');

  const server = await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: exe });
  const url = `http://localhost:${PORT}/`;

  const fail = async (msg) => {
    console.error(`check:soak-track — ${msg}`);
    await browser.close();
    server.close();
    process.exit(1);
  };

  let problems = 0;
  const check = async (label, settings, expected) => {
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
    await enterAsGuest(page, url, {}, settings);
    const track = await readTrack(page);
    if (track !== expected) {
      console.error(
        `check:soak-track — ${label}: expected track ${JSON.stringify(expected)}, got ${JSON.stringify(track)}`
      );
      problems++;
    } else {
      console.log(`check:soak-track — ${label}: track is ${JSON.stringify(track)}, as expected.`);
    }
    await page.close();
  };

  try {
    // The regression itself: this is the exact call soak.js's `--track roman`
    // makes (see `soak.js`'s own `enterAsGuest` call).
    await check('--track roman', { track: 'roman' }, 'roman');
    await check('--track script', { track: 'script' }, 'script');
    // The unset case has to stay the guest default — a fix that always wrote
    // `track` regardless of the caller would silently change every *other*
    // browser check's entry state, not only soak's.
    await check('no override (plain soak / every other browser check)', {}, 'both');
  } catch (e) {
    await fail(`threw: ${e.message}`);
  }

  await browser.close();
  server.close();

  if (problems) {
    console.error(`\ncheck:soak-track — ${problems} problem${problems === 1 ? '' : 's'}.`);
    process.exit(1);
  }
  console.log("\ncheck:soak-track — enterAsGuest's settings argument reaches harf-settings, and track with it.");
})();
