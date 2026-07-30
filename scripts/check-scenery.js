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
 *   npm run web:build && npm run check:scenery
 *
 * Needs `dist/` (an `expo export --platform web`) and Chromium. Skips with a
 * clear message rather than failing if either is missing, so it can sit in a
 * chain without becoming the reason an unrelated build goes red.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8199;

/** WCAG AA for body text is 4.5:1. The scenery is held to 6:1 because it is
 *  decoration — it should lose to legibility with room to spare, not scrape
 *  past the floor. */
const FLOOR = 6;
/** The body text colour this is measured against — palette.paper. */
const TEXT = [0xff, 0xee, 0xdd];

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('check:scenery — no dist/, run the web export first. Skipping.');
  process.exit(0);
}

let chromium;
try {
  chromium = require('playwright-core').chromium;
} catch {
  console.log('check:scenery — playwright-core not installed. Skipping.');
  process.exit(0);
}

/** The bundled Chromium's version is in the directory name, so resolve it
 *  rather than hard-coding a path that goes stale on the next image. */
function findChromium() {
  for (const p of ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH].filter(Boolean)) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  for (const d of fs.readdirSync(base)) {
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.png': 'image/png',
};

(async () => {
  const exe = findChromium();
  if (!exe) {
    console.log('check:scenery — no Chromium found. Skipping.');
    process.exit(0);
  }

  const server = http.createServer((q, r) => {
    let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(DIST, 'index.html');
    r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  });
  await new Promise((r) => server.listen(PORT, r));

  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
  const url = `http://localhost:${PORT}/`;
  await page.goto(url);
  await page.waitForTimeout(2000);

  const guest = page.locator('text=/CONTINUE AS A GUEST/i').first();
  if (await guest.count()) {
    await guest.click();
    await page.waitForTimeout(1200);
  }
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('harf-progress') || '{"state":{},"version":0}');
    raw.state = { ...raw.state, onboarded: true, goal: 'family', hearts: 5, srs: {}, srsType: {}, completedLessons: {} };
    localStorage.setItem('harf-progress', JSON.stringify(raw));
    localStorage.setItem(
      'harf-settings',
      JSON.stringify({ state: { soundEnabled: false, hapticsEnabled: false, reducedMotion: true }, version: 0 })
    );
  });
  await page.goto(url);
  await page.waitForTimeout(2500);

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
    console.error('check:scenery — could not find the background SVG. The scene may have been restructured; update the selector.');
    await browser.close();
    server.close();
    process.exit(1);
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
      let below = 0;
      const total = c.width * c.height;
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
      return { worst, at, total, below };
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
  console.log(`check:scenery — brightest point of the scenery is ${worst}:1 against the body text (floor ${FLOOR}:1). Clear.`);
})().catch((e) => {
  console.error('check:scenery — ' + e.message);
  process.exit(1);
});
