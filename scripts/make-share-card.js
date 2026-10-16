#!/usr/bin/env node
/**
 * Draws the picture a shared link shows: `assets/images/share-card.jpg`,
 * 1200x630, the evening scene with the name and the headline.
 *
 * The share card was the square app icon in the small "summary" card, so a
 * link pasted into a chat showed an orange letter and nothing of what the app
 * is (marketing review, 2026-10-11 and 2026-10-16, P-040). This puts the
 * script itself in the preview, which is the app's whole case.
 *
 * Drawn from the course's own picture and fonts, so it cannot drift from the
 * app's look, and with no number in it that could go stale. Meta asks for
 * under 600 KB and some clients cut off at 300 KB, so it is a JPEG and the
 * script fails over 300 KB, or if the words measure under 4.5:1 on it.
 *
 *   node scripts/make-share-card.js
 *
 * Run by hand when the scene, the name or the headline changes; the output is
 * committed, and `inject-web-meta.js` copies it into the export.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { findChromium } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');
const { palette } = load('src/theme/colors');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'images', 'share-card.jpg');
// Written beside the card and moved over it only once it passes, so a
// failed run never leaves a failing card for the build to ship.
const draft = `${OUT}.draft`;
const MAX_BYTES = 300 * 1024;
const MIN_CONTRAST = 4.5;
const HEADLINE = 'Speak Urdu? Now read it.';

const font = (pkg, file) => `file://${path.join(ROOT, 'node_modules', '@expo-google-fonts', pkg, file)}`;
const scene = `file://${path.join(ROOT, 'assets', 'images', 'evening.jpg')}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Nastaliq; src: url(${font('noto-nastaliq-urdu', 'NotoNastaliqUrdu_700Bold.ttf')}); }
@font-face { font-family: Fraunces; src: url(${font('fraunces', 'Fraunces_900Black.ttf')}); }
@font-face { font-family: PublicSans; src: url(${font('public-sans', 'PublicSans_700Bold.ttf')}); }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: ${palette.ink}; }
/* The portrait scene, cropped so the sunset sits low and the night sky above
   carries the words, with the same kind of scrim the front door uses: words
   on the bright band measured 1.04:1 there. */
.scene { position: absolute; inset: 0; background: url(${scene}) center 50% / cover no-repeat; }
.scrim { position: absolute; inset: 0;
  background: linear-gradient(rgba(33, 23, 18, 0.6) 0%, rgba(33, 23, 18, 0.45) 50%, rgba(33, 23, 18, 0) 72%); }
.words { position: absolute; left: 0; right: 0; top: 30px; text-align: center; color: ${palette.paper}; }
.urdu { font-family: Nastaliq; font-size: 132px; line-height: 1.35; color: ${palette.goldLight};
  text-shadow: 0 0 24px rgba(255, 140, 66, 0.55), 0 0 6px rgba(255, 140, 66, 0.7); direction: rtl; }
.name { font-family: Fraunces; font-size: 40px; letter-spacing: 6px; margin-top: -8px; }
.line { font-family: PublicSans; font-size: 38px; margin-top: 26px; }
</style></head><body><div class="scene"></div><div class="scrim"></div><div class="words">
<div class="urdu">قاف</div><div class="name">QAAF</div><div class="line">${HEADLINE}</div>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch({ executablePath: findChromium() || undefined });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const tmp = path.join(require('os').tmpdir(), `share-card-${process.pid}.html`);
  fs.writeFileSync(tmp, html);
  await page.goto(`file://${tmp}`);
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length);
  if (loaded < 3) throw new Error(`only ${loaded} of 3 fonts loaded; the card would fall back to a system face`);
  await page.screenshot({ path: draft, type: 'jpeg', quality: 82 });

  // Measured, not judged by eye: the worst pixel of the picture behind the
  // name and the headline, against their colour, with the words taken away.
  const boxes = await page.evaluate(() =>
    ['.name', '.line'].map((sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    })
  );
  await page.evaluate(() => (document.querySelector('.words').style.visibility = 'hidden'));
  const bare = (await page.screenshot({ type: 'png' })).toString('base64');
  const worst = await page.evaluate(
    async ({ bare, boxes, text }) => {
      const img = new Image();
      await new Promise((r) => {
        img.onload = r;
        img.src = `data:image/png;base64,${bare}`;
      });
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      const L = (r, gg, bb) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(bb);
      const Lt = L(...text);
      let min = Infinity;
      for (const b of boxes) {
        for (let y = Math.floor(b.y); y < Math.ceil(b.y + b.h); y++) {
          for (let x = Math.floor(b.x); x < Math.ceil(b.x + b.w); x++) {
            const i = (y * c.width + x) * 4;
            min = Math.min(min, (Lt + 0.05) / (L(d[i], d[i + 1], d[i + 2]) + 0.05));
          }
        }
      }
      return min;
    },
    { bare, boxes, text: [1, 3, 5].map((i) => parseInt(palette.paper.slice(i, i + 2), 16)) }
  );
  await browser.close();
  fs.unlinkSync(tmp);
  const bytes = fs.statSync(draft).size;
  console.log(`share-card.jpg: 1200x630, ${(bytes / 1024).toFixed(0)} KB`);
  console.log(`worst contrast behind the name and headline: ${worst.toFixed(2)}:1`);
  const refuse = (why) => {
    fs.unlinkSync(draft);
    console.error(why);
    process.exit(1);
  };
  if (worst < MIN_CONTRAST) refuse(`under ${MIN_CONTRAST}:1: the words are not readable on the picture`);
  if (bytes > MAX_BYTES) refuse(`over ${MAX_BYTES / 1024} KB: some chat clients drop the preview`);
  fs.renameSync(draft, OUT);
})().catch((e) => {
  if (fs.existsSync(draft)) fs.unlinkSync(draft);
  console.error(e.message);
  process.exit(1);
});
