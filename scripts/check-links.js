/* eslint-disable */
/**
 * Every screen has a URL, and the back button backs out of it.
 *
 * The web build lived at a single URL. Opening a lesson or switching tabs
 * pushed nothing onto history, so the browser's back button — which is the
 * hardware back button on Android — left Harf from wherever the learner had
 * got to, and no link could point at a lesson, the Letter Lab or the Practice
 * tab.
 *
 * Two things are asserted, because either alone can pass while the app is
 * broken: a link opens the screen it names *and keeps its address*, and going
 * back moves within the app rather than out of it.
 *
 * Runs against whatever is in dist/, at the root or under a subpath. The
 * subpath is read from the page the same way the app reads it, so a build
 * deployed to /Urdu and a local build to / are both covered by the same
 * assertions rather than by two copies of them.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:links
 */

const path = require('path');
const fs = require('fs');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8336;

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/** The subpath the deploy wrote into the page, '' when served from the root. */
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const BASE = (/<meta name="harf:base" content="([^"]*)"/.exec(html)?.[1] ?? '').replace(/\/+$/, '');

/** Each linkable screen, and a phrase only that screen puts on the page. */
const ROUTES = [
  { path: '/', shows: /Speak with them|Read the script|Come home to it|Explore Urdu/ },
  { path: '/practice', shows: /brings back the words/i },
  { path: '/profile', shows: /Level \d+/i },
  { path: '/league', shows: /League/i },
  { path: '/achievements', shows: /Achievements/i },
  { path: '/settings', shows: /Account/i },
  { path: '/letters', shows: /learned/i },
  { path: '/lesson/l-1', shows: /A NEW LETTER/i },
];

async function main() {
  const server = await serveDist(DIST, PORT);
  const { chromium } = require('playwright-core');
  const problems = [];
  let browser;

  const origin = `http://localhost:${PORT}`;
  const seed = { xp: 640, streak: 3, gems: 145 };

  try {
    browser = await chromium.launch({ executablePath: findChromium() || undefined });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });

    // Seeded once; every goto below reuses the same storage, so these are cold
    // loads of a learner who is already past the front door.
    await enterAsGuest(page, `${origin}/Urdu/`, seed);
    await page.waitForTimeout(1500);

    for (const route of ROUTES) {
      const url = `${BASE}${route.path}`;
      await page.goto(`${origin}${url}`);
      await page.waitForTimeout(2200);
      const landed = await page.evaluate(() => location.pathname);
      const body = await page.evaluate(() => document.body.innerText);

      // "/Urdu" and "/Urdu/" are the same page; a server serving a directory
      // redirects between them. Everything deeper is compared exactly.
      const same = (a, b) => a.replace(/\/$/, '') === b.replace(/\/$/, '');
      if (!same(landed, url)) {
        problems.push(
          `${url} ended up at ${landed} — the address bar now holds a URL that cannot be opened or shared.`
        );
      }
      if (!route.shows.test(body)) {
        problems.push(`${url} did not open the screen it names: ${body.replace(/\n/g, ' / ').slice(0, 90)}`);
      }
    }

    // Back has to move inside the app. Three screens deep, then back twice.
    await page.goto(`${origin}${BASE}/`);
    await page.waitForTimeout(2000);
    await page.goto(`${origin}${BASE}/profile`);
    await page.waitForTimeout(1600);
    await page.goto(`${origin}${BASE}/achievements`);
    await page.waitForTimeout(1600);

    await page.goBack();
    await page.waitForTimeout(1400);
    const afterOne = await page.evaluate(() => location.pathname);
    await page.goBack();
    await page.waitForTimeout(1400);
    const afterTwo = await page.evaluate(() => location.pathname);
    const stillInside = await page.evaluate(() => /HARF|Speak with them|Level/i.test(document.body.innerText));

    if (afterOne !== `${BASE}/profile`) {
      problems.push(`Back from Achievements went to ${afterOne}, not ${BASE}/profile.`);
    }
    if (afterTwo.replace(/\/$/, '') !== BASE) {
      problems.push(`Two backs from Achievements went to ${afterTwo}, not the learn path.`);
    }
    if (!stillInside) {
      problems.push('Going back twice left the app rather than returning to a screen inside it.');
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (problems.length) {
    console.error(`check:links — ${problems.length} broken link${problems.length === 1 ? '' : 's'}:\n`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log(
    `check:links — ${ROUTES.length} screens each open from their own URL under "${BASE || '/'}", and back stays inside the app.`
  );
}

main().catch((err) => {
  console.error('check:links — failed to run:', err);
  process.exit(1);
});
