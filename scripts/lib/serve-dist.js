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
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
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
 */
async function enterAsGuest(page, url, state = {}) {
  await page.goto(url);
  await page.waitForTimeout(2000);
  const guest = page.locator('text=/CONTINUE AS A GUEST/i').first();
  if (await guest.count()) {
    await guest.click();
    await page.waitForTimeout(1200);
  }
  await page.evaluate((extra) => {
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
      JSON.stringify({ state: { soundEnabled: false, hapticsEnabled: false, reducedMotion: true }, version: 0 })
    );
  }, state);
  await page.goto(url);
  await page.waitForTimeout(2500);
}

module.exports = { serveDist, resolveAsset, findChromium, enterAsGuest, MIME };
