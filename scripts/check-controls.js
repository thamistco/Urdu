/* eslint-disable */
/**
 * Every control the app offers has to lead somewhere.
 *
 * Settings used to show a **Sign in** button to a guest. It called
 * `signOut()`, which clears guest mode and returns the learner to the front
 * door — exactly right when that door offers Google and Apple. When no
 * backend is configured the door has a single "Start learning" button, so the
 * round trip ejected someone from the app and handed them back precisely
 * where they were. Nothing was lost, and nothing could be gained: a control
 * that promised something the build cannot do.
 *
 * `LoginScreen` had already been taught to hide its providers on
 * `authConfigured`; Settings had not, and no check noticed, because a button
 * that navigates somewhere real-looking is invisible to every test that only
 * asks whether screens render.
 *
 * This drives the real built bundle to Settings as a guest and reads what is
 * on offer. It is deliberately the *shipped* build rather than the source:
 * the defect was a screen rendering a live button, and only a rendered screen
 * can show that.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:controls
 */

const path = require('path');
const fs = require('fs');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8332;

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/**
 * The same test `src/lib/supabase.ts` makes, spelled out rather than imported.
 *
 * Importing it would drag `@supabase/supabase-js` and the react-native URL
 * polyfill into a plain node script for the sake of two `process.env` reads.
 * The cost of restating it is that the two could drift; the guard against
 * that is that this check asserts nothing at all when the keys *are* present,
 * so a drift makes the check quiet rather than wrong.
 */
const AUTH_CONFIGURED = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Every control on the mounted screen, by the words on it.
 *
 * Not filtered to the viewport: a screen taller than the window is the normal
 * case here, and a dead button two scrolls down is still a dead button.
 */
function controlsOnScreen() {
  return Array.from(document.querySelectorAll('[role="button"], [tabindex]')).flatMap((n) => {
    const r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return [];
    const label = (n.getAttribute('aria-label') || n.textContent || '').trim();
    return label ? [label] : [];
  });
}

/** Tap the first thing whose visible text or label matches. */
async function tapByText(page, re) {
  const box = await page.evaluate((src) => {
    const r = new RegExp(src, 'i');
    for (const n of document.querySelectorAll('div,span,p,[role="button"]')) {
      const t = (n.getAttribute('aria-label') || n.textContent || '').trim();
      if (!r.test(t)) continue;
      const b = n.getBoundingClientRect();
      if (b.width < 8 || b.height < 8) continue;
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }
    return null;
  }, re.source);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  return true;
}

async function main() {
  if (AUTH_CONFIGURED) {
    console.log('check:controls — Supabase keys are configured, so Settings offering sign-in is correct. Skipping.');
    return;
  }

  const server = await serveDist(DIST, PORT);
  const { chromium } = require('playwright-core');
  const problems = [];
  let browser;

  try {
    browser = await chromium.launch({ executablePath: findChromium() || undefined });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
    await enterAsGuest(page, `http://localhost:${PORT}/Urdu/`, { xp: 640, streak: 3 });
    await page.waitForTimeout(1200);

    if (!(await tapByText(page, /^Profile$/))) {
      problems.push('Could not find the Profile tab — the route to Settings is gone, so this check proves nothing.');
    } else {
      await page.waitForTimeout(900);
      if (!(await tapByText(page, /^Settings$/))) {
        problems.push('Could not open Settings from Profile — this check proves nothing.');
      } else {
        await page.waitForTimeout(1000);
        const controls = await page.evaluate(controlsOnScreen);
        const body = await page.evaluate(() => document.body.innerText);
        // The Account card is the part under test, so prove we are looking at
        // the screen that holds it rather than at whatever else rendered.
        const onSettings = /Settings/.test(body) && /Account/i.test(body);
        if (!onSettings) {
          problems.push(`Settings did not open — what is on screen is: ${controls.slice(0, 8).join(' · ')}`);
        }
        const signIn = controls.filter((c) => /^sign in$/i.test(c));
        if (signIn.length) {
          problems.push(
            'Settings offers "Sign in" to a guest while no backend is configured. It calls signOut(), which drops ' +
              'the learner on a sign-in screen whose only button puts them back where they were.'
          );
        }
        // The card itself must still say where progress lives — removing the
        // button must not also remove the answer to "am I signed in".
        if (!/progress is saved on this device/i.test(body)) {
          problems.push('Settings no longer tells a guest where their progress is saved.');
        }
      }
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (problems.length) {
    console.error('check:controls — dead or missing controls:\n');
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log(
    'check:controls — Settings offers a guest no sign-in it cannot honour, and still says where progress lives.'
  );
}

main().catch((err) => {
  console.error('check:controls — failed to run:', err);
  process.exit(1);
});
