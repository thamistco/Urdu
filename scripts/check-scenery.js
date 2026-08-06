/* eslint-disable */
/**
 * Measure the scenery's contrast against the text that sits on it.
 *
 * Something is behind *every* screen — lessons, grammar tables, whole reading
 * passages — so the backdrop is the one decorative thing in the app that can
 * make body copy unreadable. Whatever it is, it carries a comment promising it
 * clears 6:1 against the cream text colour, and for a long time nothing checked.
 *
 * It was not true of the drawn landscape this replaced. Three warm layers
 * stacked where the low cloud crossed the sun — two cloud bodies and a lit crown
 * — and alpha compositing is not additive in a way anyone estimates correctly by
 * eye: the pile-up came to 4.47:1, under even the WCAG AA floor of 4.5, on a
 * background whose comment said 6. The picture looked fine. The maths was never
 * done.
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
 *
 * ## Two passes, because there are two kinds of background
 *
 * The rule above — *the brightest pixel anywhere must clear the floor* — is the
 * right rule for a backdrop that arbitrary text lands on, and the only rule
 * that can be stated without knowing where the text is.
 *
 * It is the wrong rule for a picture. `EveningScene` on the sign-in screen has
 * a sun in it, and its brightest pixel is 1.04:1: as a general backdrop that is
 * hopeless, and dimming it until it passes turns the sunset brown. What makes
 * it legible is not that the picture is dark but that the *text* is placed in
 * the bands of it that are. Pass one cannot see that distinction, so pass two
 * measures the thing that actually matters — the pixels behind each line of
 * text — and lets the sun alone.
 *
 * Pass two is the stronger check of the two. It is only not used everywhere
 * because on a scrolling screen the text moves and the guarantee has to hold
 * for wherever it lands.
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
 * The backdrop behind every screen that is not the front door.
 *
 * This used to be `svg[viewBox="0 0 400 900"]` — the drawn landscape — and when
 * that was replaced this check failed rather than passing over a screen it
 * could no longer see, which is the behaviour its own error message promised.
 */
const INTERIOR = 'img[src*="/evening-dusk."]';

/**
 * How pass two finds the picture it is measuring against, per screen.
 *
 * The two front screens fail in different ways: sign-in keeps its text inside
 * two dark bands of a picture at full brightness, and the welcome screen puts
 * text anywhere it likes on a darkened one. Measuring what is behind each run
 * of text covers both without either needing to know how the other is built.
 */
const SCENES = [
  { name: 'sign-in', selector: 'img[src*="/evening."]', minRuns: 6 },
  { name: 'welcome', selector: 'img[src*="/evening-dusk."]', minRuns: 8 },
];

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

/**
 * Worst contrast against the body text, over the whole frame or a set of boxes.
 *
 * Runs inside the page rather than over a decoded PNG here because the frame is
 * already a data URL on that side and canvas gives the pixels for free.
 */
async function worstPixel(page, shot, text, regions) {
  return page.evaluate(
    async ({ dataUrl, text, regions }) => {
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
      // The screenshot is in device pixels and the boxes came from CSS ones.
      const scale = c.width / window.innerWidth;
      const areas = regions ?? [{ x: 0, y: 0, w: c.width / scale, h: c.height / scale, label: null }];
      let worst = Infinity;
      let at = null;
      for (const a of areas) {
        const x0 = Math.max(0, Math.floor(a.x * scale));
        const y0 = Math.max(0, Math.floor(a.y * scale));
        const x1 = Math.min(c.width, Math.ceil((a.x + a.w) * scale));
        const y1 = Math.min(c.height, Math.ceil((a.y + a.h) * scale));
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * c.width + x) * 4;
            const ratio = (Lt + 0.05) / (L(d[i], d[i + 1], d[i + 2]) + 0.05);
            if (ratio < worst) {
              worst = ratio;
              at = {
                x: Math.round(x / scale),
                y: Math.round(y / scale),
                hex: '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''),
                label: a.label,
              };
            }
          }
        }
      }
      return { worst, at };
    },
    { dataUrl: 'data:image/png;base64,' + shot.toString('base64'), text, regions }
  );
}

/**
 * Every run of text on the screen whose backdrop is the picture itself.
 *
 * Text on an opaque surface — the cream sign-in buttons, any card — is excluded,
 * because what is behind that surface has nothing to do with whether the label
 * on it can be read. Including it would fail the screen for a bright pixel no
 * one can see, which is how a check teaches people to ignore it.
 *
 * "Opaque" is only asked of the ancestors *between* the text and the picture,
 * and that qualifier is the whole of it. The first version walked to `body` and
 * found the app's own ink ground on the way — which is opaque, and is the thing
 * the picture is painted on — so every string on the screen looked covered and
 * the check reported nothing to measure. A check with an empty subject passes.
 *
 * The elements are then hidden, so the pixels measured in their boxes are the
 * background rather than the text itself. `visibility: hidden` and not `display:
 * none`, or the boxes just collected would all move.
 *
 * Returns null if the picture is not on the screen at all, which is its own
 * failure and not something to measure around.
 */
async function textBoxes(page, sceneSelector) {
  return page.evaluate((sel) => {
    const scene = document.querySelector(sel);
    if (!scene) return null;
    const opaque = (el) => {
      const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const p = m[1].split(',').map(Number);
      return (p.length < 4 ? 1 : p[3]) > 0.5;
    };
    const found = [];
    for (const el of document.querySelectorAll('*')) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > window.innerHeight) continue;
      let n = el;
      let covered = false;
      while (n && !n.contains(scene)) {
        if (opaque(n)) {
          covered = true;
          break;
        }
        n = n.parentElement;
      }
      if (covered) continue;
      found.push({ x: r.x, y: r.y, w: r.width, h: r.height, label: el.textContent.trim().slice(0, 44) });
      el.style.visibility = 'hidden';
    }
    return found;
  }, sceneSelector);
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

  // ── Pass two, first, because sign-in is where the app opens ──────────────
  //
  // Both pictures fail pass one's rule and are meant to: what is checked is
  // that no line of text sits on the part of either that does.
  const photo = [];
  for (const scene of SCENES) {
    await page.goto(url);
    await page.waitForTimeout(2500);
    // The welcome screen is one guest tap past sign-in.
    if (scene.name === 'welcome') {
      const guest = page.locator('text=/CONTINUE AS A GUEST/i').first();
      if (await guest.count()) {
        await guest.click();
        await page.waitForTimeout(1500);
      }
    }
    const boxes = await textBoxes(page, scene.selector);
    if (!boxes) {
      await fail(
        `the ${scene.name} picture is not on the screen — nothing matched ${scene.selector}.\n` +
          `  Either the app did not boot, or that screen no longer renders the image it should.` +
          (errors.length ? `\n  page errors: ${errors.slice(0, 3).join(' | ')}` : '')
      );
    }
    if (boxes.length < scene.minRuns) {
      await fail(
        `only found ${boxes.length} runs of text on the ${scene.name} screen, where there should be at least ${scene.minRuns}.\n` +
          `  A check with nothing to measure passes, so this is a failure rather than a clear result.` +
          (errors.length ? `\n  page errors: ${errors.slice(0, 3).join(' | ')}` : '')
      );
    }
    const r = await worstPixel(page, await page.screenshot(), TEXT, boxes);
    const worst = Math.round(r.worst * 100) / 100;
    if (worst < FLOOR) {
      await fail(
        `on the ${scene.name} screen, "${r.at.label}" sits on a background of ${worst}:1, under the ${FLOOR}:1 floor.\n` +
          `  worst pixel ${r.at.hex} at ${r.at.x},${r.at.y} of the 412x900 frame\n` +
          `  The bright picture is legible only inside the bands it declares (SAFE_TOP\n` +
          `  and SAFE_BOTTOM in src/components/EveningScene.tsx); the dusk one is legible\n` +
          `  everywhere but only because it is darkened. Either text moved onto the sunset,\n` +
          `  or an asset was replaced with a brighter one.`
      );
    }
    photo.push({ name: scene.name, worst, runs: boxes.length });
  }

  // ── Pass one: the scenery every other screen stands on ──────────────────
  await enterAsGuest(page, url);

  // Hide everything above the scenery, so what is measured is the background a
  // paragraph would actually be set on rather than whatever card covers it here.
  const found = await page.evaluate((sel) => {
    const scene = document.querySelector(sel);
    if (!scene) return false;
    let n = scene.parentElement;
    while (n && n !== document.body) {
      for (const sib of Array.from(n.parentElement.children)) if (sib !== n) sib.style.visibility = 'hidden';
      n = n.parentElement;
    }
    return true;
  }, INTERIOR);
  if (!found) {
    const syntax = errors.find((e) => /Unexpected token '<'|Failed to fetch|SyntaxError/.test(e));
    await fail(
      syntax
        ? `the app bundle never loaded — ${syntax}\n` +
            `  This is the base-path failure: the export asks for /<base>/_expo/... and the\n` +
            `  server is not serving it. lib/serve-dist.js is meant to handle that; check it.`
        : `could not find the scenery behind Home — nothing matched ${INTERIOR}.\n` +
            `  The scene may have been restructured; update the selector.` +
            (errors.length ? `\n  page errors: ${errors.slice(0, 3).join(' | ')}` : '')
    );
  }
  await page.waitForTimeout(400);

  const result = await worstPixel(page, await page.screenshot(), TEXT, null);

  await browser.close();
  server.close();

  const worst = Math.round(result.worst * 100) / 100;
  if (worst < FLOOR) {
    console.error(
      `check:scenery — the brightest point of the scenery is ${worst}:1 against the body text, under the ${FLOOR}:1 floor.\n` +
        `  worst pixel ${result.at.hex} at ${result.at.x},${result.at.y} of the 412x900 frame\n` +
        `  ${worst < 4.5 ? 'This is below WCAG AA (4.5:1) — body copy on it is failing outright.' : 'Still clears WCAG AA, but decoration should not be scraping the floor that text has to clear.'}\n` +
        `  The backdrop is a photograph now, so the fix is the asset or INTERIOR_DIM in\n` +
        `  src/components/EveningScene.tsx, not an alpha inside a drawing.`
    );
    process.exit(1);
  }
  console.log(
    `check:scenery — brightest point of the scenery is ${worst}:1 against the body text (floor ${FLOOR}:1).\n` +
      photo
        .map((p) => `  ${p.name}: worst backdrop under any of its ${p.runs} runs of text is ${p.worst}:1.`)
        .join('\n') +
      `\n  Clear.`
  );
})().catch((e) => {
  console.error('check:scenery — ' + e.message);
  process.exit(1);
});
