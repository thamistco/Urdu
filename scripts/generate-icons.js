/* eslint-disable */
/**
 * The app icon, drawn from the same Nastaliq the course is set in.
 *
 * What was here before was an eight-pointed gold star on navy: the palette the
 * app used two redesigns ago, and structurally the same ornament that came off
 * the exercise tiles for looking tacky. It said nothing about Urdu and nothing
 * about this app.
 *
 * The mark is ح — the first letter of حرف, the app's name — with the sun caught
 * in its bowl, so the icon carries the sunset the rest of the app is built on.
 * Apple's icon guidance decided three things, and each rules out something that
 * looked better in isolation:
 *
 *  - **A letter, not the word.** The guidance permits a mnemonic like the first
 *    letter and discourages words, because text in an icon neither localises nor
 *    scales. Setting حرف entire was the handsomest draft at 512px and an
 *    unreadable smudge at 32.
 *
 *  - **Hard edges, no baked effects.** Foreground layers want clearly defined
 *    edges so the system's own highlights and shadows land correctly, and custom
 *    glows fight them. The sun was a soft radial gradient in the draft; here it
 *    is a flat disc, and it sits in the *background* so the foreground stays one
 *    clean shape.
 *
 *  - **Sized for the circular mask, not the square.** watchOS and visionOS mask
 *    to a circle, so the corners of the canvas cannot be used. The glyph is
 *    scaled to sit inside the inscribed circle, which is why it reads slightly
 *    generous against a round mask and comfortable rather than cramped against a
 *    rounded rectangle.
 *
 * Checked at every size down to a 32px favicon, in default, dark and monochrome,
 * under both masks. Monochrome is the test that matters — it is where a design
 * carried by colour alone falls apart — and it is why the sun is a tonal step
 * rather than merely a warmer orange.
 *
 * Layers are exported full-bleed and *unmasked*: no rounded corners baked in.
 * The system applies the mask, and a pre-rounded layer gives jagged edges and
 * spoils the specular highlight.
 *
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'images');
const FONT = path.join(
  ROOT,
  'node_modules',
  '@expo-google-fonts',
  'noto-nastaliq-urdu',
  'NotoNastaliqUrdu_600SemiBold.ttf'
);

/** Chromium ships in a versioned directory; find it rather than hard-code it. */
function chromePath() {
  const base = '/opt/pw-browsers';
  const dir = fs
    .readdirSync(base)
    .filter((d) => d.startsWith('chromium-'))
    .sort()
    .pop();
  if (!dir) throw new Error('no chromium under /opt/pw-browsers');
  return path.join(base, dir, 'chrome-linux', 'chrome');
}

const INK = '#2A1A18';
const CREAM = '#FFEEDD';
const SUN = '#FFB877';

/**
 * One icon as SVG.
 *
 * `inset` shrinks the artwork toward the middle for Android's adaptive icon,
 * which crops to a shape covering roughly the central two thirds — anything
 * outside that is not guaranteed to survive on every launcher.
 */
function iconSvg({ size, transparent = false, inset = 1 }) {
  const s = 1024;
  const c = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2A1A18"/>
      <stop offset="0.55" stop-color="#7A3520"/>
      <stop offset="1" stop-color="#D9701F"/>
    </linearGradient>
  </defs>
  ${transparent ? '' : `<rect width="${s}" height="${s}" fill="url(#sky)"/>`}
  <g transform="translate(${c} ${c}) scale(${inset}) translate(${-c} ${-c})">
    <circle cx="524" cy="470" r="176" fill="${SUN}"/>
    <text x="512" y="700" text-anchor="middle" font-family="Nastaliq" font-size="660" fill="${CREAM}">ح</text>
  </g>
</svg>`;
}

/** The name in full, for the splash — the one place with room to read it. */
function splashSvg(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <text x="${w / 2}" y="${h / 2 + 110}" text-anchor="middle" font-family="Nastaliq" font-size="300" fill="#FF8C42">حرف</text>
</svg>`;
}

const TARGETS = [
  // Full-bleed square, unmasked. iOS, iPadOS, macOS and the web mask this
  // themselves; baking in corners is what makes the edges look chewed.
  { file: 'icon.png', size: 1024, opts: {} },
  // Android's adaptive foreground sits on its own background colour and is
  // cropped toward the middle, so the art is inset to match.
  { file: 'adaptive-icon.png', size: 1024, opts: { transparent: true, inset: 0.62 } },
  { file: 'favicon.png', size: 256, opts: {} },
];

(async () => {
  if (!fs.existsSync(FONT)) {
    console.error(`Nastaliq not found at ${path.relative(ROOT, FONT)} — run npm ci first.`);
    process.exit(1);
  }
  const fontData = fs.readFileSync(FONT).toString('base64');
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });

  const shoot = async (markup, w, h, file) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(
      `<style>@font-face{font-family:Nastaliq;src:url(data:font/ttf;base64,${fontData});}
       html,body{margin:0;padding:0;background:transparent}</style>${markup}`
    );
    // The face has to resolve before the glyph is drawn, or the shot lands on a
    // fallback font and the letter comes out in the wrong script entirely.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, file), omitBackground: true });
    await page.close();
    console.log(`  ${file.padEnd(20)} ${w}×${h}`);
  };

  console.log('Writing icons:');
  for (const t of TARGETS) await shoot(iconSvg({ size: t.size, ...t.opts }), t.size, t.size, t.file);
  await shoot(splashSvg(1284, 2778), 1284, 2778, 'splash.png');

  await browser.close();
  console.log('\nDone. Layers are full-bleed and unmasked — the system rounds them.');
})();
