/* eslint-disable */
/**
 * Serve a web export to a headless browser, for the checks that have to drive
 * the real built app rather than reason about the source.
 *
 * The whole reason this is shared rather than four lines inlined per script is
 * the base path. CI bakes the deploy's subpath (`/<repo-name>`) into the export
 * before the checks run, so `index.html` asks for `/Urdu/_expo/static/js/...`,
 * not `/_expo/static/js/...`. A server rooted at `dist/` 404s that and falls
 * back to index.html, and the browser then tries to *execute* HTML as the
 * script it asked for — `SyntaxError: Unexpected token '<'` on every request,
 * so the app never boots and every assertion downstream reports something
 * mystifying instead of "the bundle did not load".
 *
 * `check:stability` hit this, diagnosed it, and fixed it in its own copy of the
 * server. `check:scenery` was written later with a fresh naive copy and hit the
 * identical bug — passing locally, failing in CI with "could not find the
 * background SVG", blocking two deploys. A fix that lives in one script is not
 * a fix; it is a fix and a trap for the next script. Hence this file.
 *
 * The repo name is deliberately not hardcoded: trying each request as given and
 * again with its first path segment stripped covers any base path without this
 * knowing what the segment is.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function resolveAsset(dist, url) {
  const clean = decodeURIComponent(url.split('?')[0]);
  const direct = path.join(dist, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;

  const parts = clean.split('/').filter(Boolean);
  if (parts.length > 1) {
    const stripped = path.join(dist, ...parts.slice(1));
    if (fs.existsSync(stripped) && fs.statSync(stripped).isFile()) return stripped;
  }
  // Everything else is a client-side route — hand back the SPA shell.
  return path.join(dist, 'index.html');
}

/**
 * Start a server for `dist` on `port`. Resolves once it is listening.
 * Returns the http.Server so the caller can `.close()` it.
 */
async function serveDist(dist, port) {
  const server = http.createServer((req, res) => {
    const p = resolveAsset(dist, req.url);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(port, r));
  return server;
}

/**
 * Find the Chromium to drive.
 *
 * CI installs Playwright's browser and passes its path; the dev container ships
 * one under /opt/pw-browsers, whose directory name carries a build number that
 * goes stale, so it is resolved rather than hardcoded.
 */
function findChromium() {
  const explicit = process.env.CHROMIUM_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;
  const direct = '/opt/pw-browsers/chromium';
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base)) {
      const p = path.join(base, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  try {
    return require('playwright-core').chromium.executablePath();
  } catch {
    return null;
  }
}

/**
 * Get past the sign-in screen and onto Home with a known state.
 *
 * Shared for the same reason the server is: every browser check needs it, and a
 * per-script copy is a per-script way to drift.
 *
 * URD-051: `state` (the third argument) only ever merged into
 * `harf-progress` — the SRS/hearts/completed-lessons store — never into
 * `harf-settings`, which is where `track` (`useSettingsStore.ts`) actually
 * lives. A caller wanting the Roman track had nothing to pass that would
 * reach it: `soak.js` passed `goal: 'speak'` instead, which merges into
 * `harf-progress`'s own unrelated onboarding field and never touches
 * `track` at all — so every `--track roman` run this project has ever done
 * was silently driving the guest default, `'both'`. `settings` is the new,
 * separate fourth argument for exactly this: it merges into the
 * `harf-settings` write the same way `state` merges into `harf-progress`'s,
 * keeping the two stores' overrides from being confused for each other the
 * way `goal`/`track` just were.
 */
/**
 * The one line only the sign-in screen says. Used to tell "we are still at the
 * front door" from "we are already through it", which is the difference a
 * missing button has to be judged against.
 */
const AT_THE_DOOR = /the whole language\./i;

/**
 * Tap whatever opens the door, and fail loudly if nothing does.
 *
 * The label depends on the build: with a backend to sign into, the way in is a
 * ghost "Continue as a guest" under two provider buttons; without one — which
 * is how the site deploys — `LoginScreen.tsx` shows a single "Start learning".
 *
 * The `if (await count())` this replaces is what made the rename dangerous.
 * Three scripts each held their own copy of `text=/CONTINUE AS A GUEST/i`, and
 * every one of them treated "no such button" as "already inside". Measured on
 * a build where the button had been renamed, with the old helper still in
 * place, that cost one check its meaning and two others their diagnosis:
 *
 *  - `check:sizes` passed. "16 screen renders across 8 sizes. Nothing clipped,
 *    nothing scrolling sideways" — while every one of the eight `home` renders
 *    was the sign-in screen it had already measured a line earlier.
 *  - `check:scenery` failed with "the welcome picture is not on the screen",
 *    and `check:stability` with "the Got it button never appeared". Both were
 *    right to fail and neither said why: the app was still at the front door.
 *
 * So it throws rather than shrugs, and names the door.
 */
/**
 * The least text any real screen in this app puts on a page.
 *
 * A booting page holds none. The sign-in screen, the emptiest screen a check
 * ever lands on cold, holds over a hundred characters, so the floor only has
 * to separate "something rendered" from "nothing yet" and is set well under
 * the smaller of the two.
 */
const MOUNTED_CHARS = 20;

/**
 * Wait until a screen is actually on the page, and say so when none arrives.
 *
 * A blank page is not "already inside". `openTheDoor` used to decide from a
 * single read of `document.body.innerText`: text that does not look like the
 * sign-in screen meant the session was seeded and already past it. A page that
 * has not finished booting has no text at all, which does not look like the
 * sign-in screen either — so a slow start was read as a successful entry, and
 * everything downstream drove a signed-out app.
 *
 * That is the same mistake the comment above this function was written about,
 * one level up: there it was "no such button" read as "already inside", here
 * it was "no such text". Both resolve an unknown state to the favourable one.
 *
 * Measured, with a 350-lesson playtest sharing the machine: one `check:links`
 * run in three seeded against a still-blank page. Two of that check's three
 * assertions then failed on the LoginScreen it had silently left up, reported
 * as a deep link that would not open and as back navigation escaping the app.
 * Neither was true, and a re-run cleared both — which is the worst outcome a
 * check can have, because it teaches whoever sees it to run it again.
 *
 * So this waits for the app to say which state it is in, and throws when it
 * never does rather than guessing.
 */
async function renderedScreen(page, timeoutMs = 20000) {
  const started = Date.now();
  let saw = '';
  while (Date.now() - started < timeoutMs) {
    saw = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (saw.trim().length >= MOUNTED_CHARS) return saw;
    await page.waitForTimeout(100);
  }
  throw new Error(
    `the app never rendered a screen: ${Math.round(timeoutMs / 1000)}s after loading, the page still holds ` +
      `${saw.trim().length} characters of text. Nothing measured after this would mean anything, so it stops here.`
  );
}

async function openTheDoor(page) {
  if (!AT_THE_DOOR.test(await renderedScreen(page))) {
    return false; // already through — a seeded session, or a later navigation
  }
  const door = page.locator('text=/^(continue as a guest|start learning)$/i').first();
  if (!(await door.count())) {
    throw new Error(
      'stuck on the sign-in screen: no "Continue as a guest" or "Start learning" button. ' +
        'If LoginScreen.tsx renamed the way in, rename it here too.'
    );
  }
  await door.click();
  // Polled rather than slept off for the same reason as the read above: 1200ms
  // was enough on an idle machine and not on a loaded one, and the shortfall
  // was reported as the door refusing to open.
  const shut = Date.now() + 15000;
  while (Date.now() < shut) {
    if (!AT_THE_DOOR.test(await page.evaluate(() => document.body.innerText).catch(() => ''))) return true;
    await page.waitForTimeout(100);
  }
  throw new Error('tapped the way in and the sign-in screen is still showing 15s later');
}

async function enterAsGuest(page, url, state = {}, settings = {}) {
  await page.goto(url);
  // `openTheDoor` waits for the screen itself; a fixed sleep here is what it
  // used to race against.
  await openTheDoor(page);
  await page.evaluate(
    ({ extra, settingsExtra }) => {
      const raw = JSON.parse(localStorage.getItem('harf-progress') || '{"state":{},"version":0}');
      raw.state = {
        ...raw.state,
        onboarded: true,
        goal: 'family',
        hearts: 5,
        srs: {},
        srsType: {},
        completedLessons: {},
        ...extra,
      };
      localStorage.setItem('harf-progress', JSON.stringify(raw));
      localStorage.setItem(
        'harf-settings',
        JSON.stringify({
          state: { soundEnabled: false, hapticsEnabled: false, reducedMotion: true, ...settingsExtra },
          version: 0,
        })
      );
    },
    { extra: state, settingsExtra: settings }
  );
  await page.goto(url);
  await page.waitForTimeout(2500);
}

module.exports = { serveDist, resolveAsset, findChromium, enterAsGuest, openTheDoor, renderedScreen, AT_THE_DOOR, MIME };
