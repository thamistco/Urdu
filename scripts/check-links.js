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
const { serveDist, findChromium, enterAsGuest, renderedScreen, AT_THE_DOOR } = require('./lib/serve-dist');

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
  // This loop runs against a seeded, already-guest session (see main()), so
  // this only proves Privacy/Terms still work once already past the door.
  // The property that actually matters for them -- a cold, unauthenticated
  // load resolving to real content -- is a different claim and has its own
  // check below, with no session seeded at all.
  { path: '/privacy', shows: /Privacy Policy/i },
  { path: '/terms', shows: /Terms of Service/i },
  { path: '/credits', shows: /Whose work is in Harf/i },
];

/**
 * A screen is up and it is not the front door.
 *
 * Every wait in this check used to be a fixed sleep, and each one was long
 * enough on an idle machine. Under the load of a playtest on the same box, one
 * run in three read a screen mid-boot: a deep link was reported as opening the
 * wrong screen, and back navigation as leaving the app, because what the check
 * was looking at was the sign-in screen rather than the app. Both diagnoses
 * were wrong and both cleared on a re-run.
 *
 * This waits for the state the assertions are written against — an app past
 * the door — without waiting for any particular *screen*, so what each
 * assertion then checks is still its own to prove.
 */
async function arrived(page) {
  await renderedScreen(page);
  const until = Date.now() + 15000;
  while (Date.now() < until) {
    if (!AT_THE_DOOR.test(await page.evaluate(() => document.body.innerText).catch(() => ''))) return;
    await page.waitForTimeout(100);
  }
}

/**
 * The address has stopped moving.
 *
 * Used after `goBack`, where waiting for a particular path would decide the
 * thing the next two assertions exist to decide. Two identical reads a fifth
 * of a second apart, after a screen is up, is as far as this can go without
 * answering its own question.
 */
async function settled(page) {
  await renderedScreen(page);
  let last = null;
  for (let i = 0; i < 40; i++) {
    const now = await page.evaluate(() => location.pathname).catch(() => null);
    if (now && now === last) return;
    last = now;
    await page.waitForTimeout(200);
  }
}

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

    for (const route of ROUTES) {
      const url = `${BASE}${route.path}`;
      await page.goto(`${origin}${url}`);
      await arrived(page);
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
    await arrived(page);
    await page.goto(`${origin}${BASE}/profile`);
    await arrived(page);
    await page.goto(`${origin}${BASE}/achievements`);
    await arrived(page);

    await page.goBack();
    await settled(page);
    const afterOne = await page.evaluate(() => location.pathname);
    await page.goBack();
    await settled(page);
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

    /**
     * The one property none of the above actually proves.
     *
     * Every route above ran against a page `enterAsGuest` had already seeded
     * with `harf-progress`/`harf-settings` in localStorage — a returning
     * learner, not the person this screen exists for. An app store reviewer,
     * or anyone else who lands on /privacy, /terms or /credits cold, has no local
     * storage at all, and RootNavigator's whole reason for registering these
     * outside the auth gate is that they must resolve anyway. A brand new
     * page in the same browser, with nothing written to it first, is what
     * actually tests that.
     */
    for (const route of [
      { path: '/privacy', shows: /Privacy Policy/i },
      { path: '/terms', shows: /Terms of Service/i },
      { path: '/credits', shows: /Whose work is in Harf/i },
    ]) {
      const url = `${BASE}${route.path}`;
      const cold = await browser.newPage({ viewport: { width: 412, height: 900 } });
      await cold.goto(`${origin}${url}`);
      await arrived(cold);
      const body = await cold.evaluate(() => document.body.innerText);
      const landed = await cold.evaluate(() => location.pathname);
      await cold.close();
      if (!route.shows.test(body)) {
        problems.push(
          `${url} with NO session seeded did not open the screen it names — a signed-out reviewer would ` +
            `hit this first: "${body.replace(/\n/g, ' / ').slice(0, 90)}"`
        );
      }
      if (landed.replace(/\/$/, '') !== url.replace(/\/$/, '')) {
        problems.push(`${url} with no session seeded redirected to ${landed} instead of staying put.`);
      }
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
