/* eslint-disable */
/**
 * Every screen has a URL, and the back button backs out of it.
 *
 * The web build lived at a single URL. Opening a lesson or switching tabs
 * pushed nothing onto history, so the browser's back button — which is the
 * hardware back button on Android — left Qaaf from wherever the learner had
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
const { serveDist, findChromium, enterAsGuest, renderedScreen, atTheDoor } = require('./lib/serve-dist');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8336;

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/** The subpath the deploy wrote into the page, '' when served from the root. */
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const BASE = (/<meta name="qaaf:base" content="([^"]*)"/.exec(html)?.[1] ?? '').replace(/\/+$/, '');

/** Each linkable screen, and a phrase only that screen puts on the page. */
const ROUTES = [
  { path: '/', shows: /Speak with family|Read the script|Come home to it|Explore Urdu/ },
  { path: '/practice', shows: /brings back the words/i },
  { path: '/profile', shows: /Level \d+/i },
  { path: '/league', shows: /League/i },
  { path: '/achievements', shows: /Achievements/i },
  { path: '/settings', shows: /Account/i },
  { path: '/letters', shows: /learned/i },
  // A letter of its own, and not alif: the Lab opened on alif whatever the
  // address said until 2026-10-01, and alif is what the bare /letters shows.
  { path: '/letters/sheen', shows: /sheen\s*·\s*“sh”/i },
  // A fresh guest has learned nothing yet, so Read faster opens on its
  // not-yet state; either screen proves the address reaches it.
  { path: '/read', shows: /Read faster|Learn a few more words first/i },
  { path: '/lesson/l-1', shows: /A NEW LETTER/i },
  // A lesson id that names nothing: a blank page until 2026-10-13 (QA, H11).
  { path: '/lesson/does-not-exist', shows: /That lesson isn.t here/i },
  // This loop runs against a seeded, already-guest session (see main()), so
  // this only proves Privacy/Terms still work once already past the door.
  // The property that actually matters for them -- a cold, unauthenticated
  // load resolving to real content -- is a different claim and has its own
  // check below, with no session seeded at all.
  { path: '/privacy', shows: /Privacy Policy/i },
  { path: '/terms', shows: /Terms of Service/i },
  { path: '/credits', shows: /Whose work is in Qaaf/i },
  { path: '/licences', shows: /Software Qaaf is built on/i },
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
    if (!(await atTheDoor(page))) return;
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
      // An unfilled template on screen: the Privacy Policy and the Terms both
      // showed "{{SUPPORT_EMAIL}}" to everyone who read them (tester report,
      // 2026-10-12).
      const unfilled = body.match(/\{\{[^}]*\}\}/);
      if (unfilled) problems.push(`${url} shows the unfilled placeholder ${unfilled[0]}.`);
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
    const stillInside = await page.evaluate(() => /QAAF|Speak with family|Level/i.test(document.body.innerText));

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
     * with `qaaf-progress`/`qaaf-settings` in localStorage — a returning
     * learner, not the person this screen exists for. An app store reviewer,
     * or anyone else who lands on /privacy, /terms, /credits or /licences cold, has no local
     * storage at all, and RootNavigator's whole reason for registering these
     * outside the auth gate is that they must resolve anyway. A brand new
     * page in the same browser, with nothing written to it first, is what
     * actually tests that.
     */
    for (const route of [
      { path: '/privacy', shows: /Privacy Policy/i },
      { path: '/terms', shows: /Terms of Service/i },
      { path: '/credits', shows: /Whose work is in Qaaf/i },
      { path: '/licences', shows: /Software Qaaf is built on/i },
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

    /**
     * A save is never lost to a version it does not know, and a browser that
     * refuses storage still gets the app.
     *
     * A save marked with another version was discarded and overwritten with a
     * fresh profile, and a browser that threw on storage access drew nothing
     * at all (QA, 2026-10-13, H12 and M21). Each case gets its own context so
     * no storage leaks between them.
     */
    for (const version of [99, -1]) {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 900 } });
      const p = await ctx.newPage();
      try {
        await enterAsGuest(p, `${origin}${BASE}/`, { gems: 77 });
        await p.evaluate((v) => {
          const raw = JSON.parse(localStorage.getItem('qaaf-progress'));
          localStorage.setItem('qaaf-progress', JSON.stringify({ state: raw.state, version: v }));
        }, version);
        await p.goto(`${origin}${BASE}/`);
        await arrived(p);
        // Until the store has read the save back and written it under its own
        // version, or 10s: whatever is there then is the answer.
        await p
          .waitForFunction(() => JSON.parse(localStorage.getItem('qaaf-progress') || '{}').version === 0, null, {
            timeout: 10000,
          })
          .catch(() => {});
        const kept = await p.evaluate(() => JSON.parse(localStorage.getItem('qaaf-progress') || 'null'));
        const backups = await p.evaluate(
          () => Object.keys(localStorage).filter((k) => k.startsWith('qaaf-progress-backup-')).length
        );
        if (!kept?.state?.onboarded || kept.state.gems !== 77) {
          problems.push(
            `A save marked version ${version} was not kept: it came back as ${JSON.stringify(kept?.state ?? null).slice(0, 80)}.`
          );
        }
        if (!backups)
          problems.push(`A save marked version ${version} was read without a backup copy being made first.`);
      } finally {
        await ctx.close();
      }
    }
    /**
     * One field of the save holding the wrong type does not stop the app.
     *
     * `learnedWords: 5` left Profile and every lesson blank, `srs: null`
     * crashed Home on every load and `achieved: null` crashed Profile, with no
     * backup, since the save as a whole looked fine (QA round 5, M29). The
     * field now falls back to its default; the rest of the save is kept.
     */
    for (const [field, value, path, shows] of [
      ['learnedWords', 5, '/profile', /Level \d+/i],
      ['learnedWords', 5, '/lesson/l-1', /A NEW LETTER/i],
      ['srs', null, '/', /Speak with family|Read the script|Come home to it|Explore Urdu/],
      ['achieved', null, '/profile', /Level \d+/i],
    ]) {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 900 } });
      const p = await ctx.newPage();
      try {
        await enterAsGuest(p, `${origin}${BASE}/`, { gems: 77 });
        await p.evaluate(
          ([f, v]) => {
            const raw = JSON.parse(localStorage.getItem('qaaf-progress'));
            raw.state[f] = v;
            localStorage.setItem('qaaf-progress', JSON.stringify(raw));
          },
          [field, value]
        );
        await p.goto(`${origin}${BASE}${path}`);
        await arrived(p);
        await p
          .waitForFunction((re) => new RegExp(re, 'i').test(document.body.innerText), shows.source, { timeout: 10000 })
          .catch(() => {});
        const body = await p.evaluate(() => document.body.innerText);
        const what = `A save with ${field}: ${JSON.stringify(value)}`;
        if (!shows.test(body))
          problems.push(`${what} did not open ${path}: "${body.replace(/\n/g, ' / ').slice(0, 90)}"`);
        const state = await p.evaluate(() => JSON.parse(localStorage.getItem('qaaf-progress') || 'null')?.state);
        if (state?.gems !== 77) problems.push(`${what} lost the rest of the save: gems came back ${state?.gems}.`);
        const backups = await p.evaluate(() =>
          Object.keys(localStorage).filter((k) => k.startsWith('qaaf-progress-backup-'))
        );
        if (!backups.length) problems.push(`${what} was repaired without a backup copy being made first.`);
      } finally {
        await ctx.close();
      }
    }
    {
      const ctx = await browser.newContext({ viewport: { width: 412, height: 900 } });
      const p = await ctx.newPage();
      try {
        await p.addInitScript(() => {
          for (const name of ['localStorage', 'sessionStorage'])
            Object.defineProperty(window, name, {
              get() {
                throw new DOMException('The operation is insecure.', 'SecurityError');
              },
            });
        });
        await p.goto(`${origin}${BASE}/`);
        await p
          .waitForFunction(() => document.body.innerText.trim().length > 40, null, { timeout: 10000 })
          .catch(() => {});
        const body = await p.evaluate(() => document.body.innerText);
        if (!/progress won.t be kept/i.test(body)) {
          problems.push(
            `With storage refused, the app did not say progress won't be kept: "${body.replace(/\n/g, ' / ').slice(0, 90)}"`
          );
        }
        if (body.trim().length < 40) problems.push('With storage refused, the app drew a blank page.');
      } finally {
        await ctx.close();
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
