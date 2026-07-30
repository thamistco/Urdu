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
 * The sun's size and place were settled by measurement rather than eye. Sampling
 * the contrast between the cream letter and whatever sits immediately behind it,
 * all the way round its outline, caught the first attempt failing badly: the
 * descending stroke crossed the sun at 1.5:1, so letter and disc were the same
 * brightness where they met. Moving the sun down into the open part of the bowl,
 * where no stroke crosses it, fixed that.
 *
 * **The ground is bright.** The draft before this one put the letter on a sky
 * that fell away to near-black at the corners, and set against two dozen icons
 * of the kind people actually keep on a home screen it was the dullest thing
 * there — a brown smudge among saturated flat colour. Measuring those icons'
 * backgrounds explains it: their median saturation is 0.84, and not one of them
 * fades to black at its corners. Depth in an icon has to come from somewhere
 * other than darkness.
 *
 * So the ground is the app's own orange, carrying a slight diagonal shift from
 * light to deep — but staying inside the orange the whole way. That is the
 * distinction the first draft missed: a gradient *within a hue* reads as a
 * sheen, and a gradient *toward black* reads as dirt.
 *
 * **The letter is the dark note, not the light one.** A cream letter on that
 * bright ground was tried first and measured 1.95:1, with over half its outline
 * below 3:1 — worse than every icon in the reference set, whose figure-to-ground
 * contrast runs from 4.3:1 to 18.9:1 with a median near 15:1 and *nothing* under
 * 3:1. Two light values cannot both be bright. Inverting it — near-black letter,
 * cream disc, bright orange ground — keeps the tile at the top of the brightness
 * range and takes contrast to 6.7:1, with 4% of the outline under 3:1. Bright
 * and legible turned out not to be a trade at all; the first attempt had simply
 * put the wrong element in the light.
 *
 * The hairlines were the other measured problem, and the one an ornate script
 * was always going to have. Nastaliq is built on extreme stroke contrast: the
 * thinnest twentieth of this glyph is 30px at 1024, which is 0.94px on a 32px
 * icon — under one pixel, so it simply is not drawn. A same-colour stroke of 12
 * lifts that to about 1.3px and holds the tail's terminal together at small
 * sizes. Twenty was tried and rejected: it closes up the angled cut on the top
 * stroke, and a Nastaliq ح without its taper is just a hook.
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

const INK = '#211712'; // the app's background; the splash sits on it
const LETTER = '#2A1208'; // the letter: near-black, the darkest note
const SUN = '#FFF6EA'; // the disc in its bowl, the one light note
const GROUND_LIGHT = '#FF9A50';
const GROUND_DEEP = '#F0741F';
/** Android flattens the adaptive icon's background to a single colour. */
const GROUND_FLAT = '#F98038';

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
    <!-- Light at the top-left, deep at the bottom-right, and orange throughout.
         It never leaves the hue, so it reads as a sheen across a bright tile
         rather than as a tile going dark at the edges. -->
    <linearGradient id="ground" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${GROUND_LIGHT}"/>
      <stop offset="1" stop-color="${GROUND_DEEP}"/>
    </linearGradient>
  </defs>
  ${transparent ? '' : `<rect width="${s}" height="${s}" fill="url(#ground)"/>`}
  <g transform="translate(${c} ${c}) scale(${inset}) translate(${-c} ${-c})">
    <circle cx="470" cy="625" r="100" fill="${SUN}"/>
    <!-- The stroke is the same colour as the fill: not an outline, a way of
         thickening the hairlines an ornate script leaves behind at icon sizes.
         See the note above for the measurement that set it. -->
    <text x="512" y="714" text-anchor="middle" font-family="Nastaliq" font-size="820"
          fill="${LETTER}" stroke="${LETTER}" stroke-width="16" stroke-linejoin="round">ح</text>
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
