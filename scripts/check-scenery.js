/* eslint-disable */
/**
 * Measure the scenery's contrast against the text that sits on it.
 *
 * `LatticeBackground` is behind *every* screen — lessons, grammar tables, whole
 * reading passages — so it is the one decorative thing in the app that can make
 * body copy unreadable. The file has always carried a comment promising every
 * part of it clears 6:1 against the cream text colour. Nothing checked that.
 *
 * It was not true. Three warm layers stack where the low cloud crosses the sun —
 * two cloud bodies and a lit crown — and alpha compositing is not additive in a
 * way anyone estimates correctly by eye: at their first values the pile-up came
 * to 4.47:1, under even the WCAG AA floor of 4.5, on a background whose comment
 * said 6. The picture looked fine. The maths was never done.
 *
 * So this does the only thing that settles it: renders the real exported app,
 * hides every layer above the background, and reads the actual pixels.
 *
 *   npx expo export --platform web --output-dir dist && npm run check:scenery
 *
 * The server, the Chromium lookup and the guest-entry dance come from
 * `lib/serve-dist.js` rather than being repeated here — the first version of
 * this file had its own naive copy of the server, which 404'd every asset once
 * CI baked the deploy's base path into the export, and so failed with "could
 * not find the background SVG" while passing locally. It blocked two deploys.
 */

const fs = require('fs');
const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8199;

/** WCAG AA for body text is 4.5:1. The scenery is held to 6:1 because it is
 *  decoration — it should lose to legibility with room to spare, not scrape
 *  past the floor. */
const FLOOR = 6;
/** The body text colour this is measured against — palette.paper. */
const TEXT = [0xff, 0xee, 0xdd];

/**
 * Skipping is for a developer who has not built the web bundle. In CI it would
 * be a green tick over a check that never ran, which is worse than a red one —
 * so there, a missing prerequisite is a failure.
 */
function missing(reason) {
  if (process.env.CI) {
    console.error(`check:scenery — ${reason}. In CI that is a failure, not a skip.`);
    process.exit(1);
  }
  console.log(`check:scenery — ${reason}. Skipping.`);
  process.exit(0);
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) missing('no dist/, run the web export first');

let chromium;
try {
  chromium = require('playwright-core').chromium;
} catch {
  missing('playwright-core is not installed');
}

(async () => {
  const exe = findChromium();
  if (!exe) missing('no Chromium found');

  const server = await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
  const url = `http://localhost:${PORT}/`;

  const fail = async (msg) => {
    console.error(`check:scenery — ${msg}`);
    await browser.close();
    server.close();
    process.exit(1);
  };

  // A bundle that did not load is the failure this check has actually hit, so
  // say so in those words rather than reporting a missing element downstream.
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await enterAsGuest(page, url);

  // Hide everything above the scenery, so what is measured is the background a
  // paragraph would actually be set on rather than whatever card covers it here.
  const found = await page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox="0 0 400 900"]');
    if (!svg) return false;
    let n = svg.parentElement;
    while (n && n !== document.body) {
      for (const sib of Array.from(n.parentElement.children)) if (sib !== n) sib.style.visibility = 'hidden';
      n = n.parentElement;
    }
    return true;
  });
  if (!found) {
    const syntax = errors.find((e) => /Unexpected token '<'|Failed to fetch|SyntaxError/.test(e));
    await fail(
      syntax
        ? `the app bundle never loaded — ${syntax}\n` +
            `  This is the base-path failure: the export asks for /<base>/_expo/... and the\n` +
            `  server is not serving it. lib/serve-dist.js is meant to handle that; check it.`
        : 'could not find the background SVG. The scene may have been restructured; update the selector.' +
            (errors.length ? `\n  page errors: ${errors.slice(0, 3).join(' | ')}` : '')
    );
  }
  await page.waitForTimeout(400);

  const shot = await page.screenshot();
  const result = await page.evaluate(
    async ({ dataUrl, text }) => {
      const img = new Image();
      await new Promise((r) => {
        img.onload = r;
        img.src = dataUrl;
      });
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lin = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const L = (r, gg, bb) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(bb);
      const Lt = L(text[0], text[1], text[2]);
      let worst = Infinity;
      let at = null;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const ratio = (Lt + 0.05) / (L(d[i], d[i + 1], d[i + 2]) + 0.05);
          if (ratio < worst) {
            worst = ratio;
            at = { x, y, hex: '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('') };
          }
        }
      }
      return { worst, at };
    },
    { dataUrl: 'data:image/png;base64,' + shot.toString('base64'), text: TEXT }
  );

  await browser.close();
  server.close();

  const worst = Math.round(result.worst * 100) / 100;
  if (worst < FLOOR) {
    console.error(
      `check:scenery — the brightest point of the scenery is ${worst}:1 against the body text, under the ${FLOOR}:1 floor.\n` +
        `  worst pixel ${result.at.hex} at ${result.at.x},${result.at.y} of the 412x900 frame\n` +
        `  ${worst < 4.5 ? 'This is below WCAG AA (4.5:1) — body copy on it is failing outright.' : 'Still clears WCAG AA, but decoration should not be scraping the floor that text has to clear.'}\n` +
        `  Lower the alpha where layers stack; two soft shapes at alpha a composite to about 2a-a², not a.`
    );
    process.exit(1);
  }
  console.log(
    `check:scenery — brightest point of the scenery is ${worst}:1 against the body text (floor ${FLOOR}:1). Clear.`
  );
})().catch((e) => {
  console.error('check:scenery — ' + e.message);
  process.exit(1);
});
