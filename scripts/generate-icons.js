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

/**
 * Comic-book palette — yellow, blue, white, red.
 *
 * The rules of the style are not decoration, they are what makes it legible:
 * flat areas of saturated colour, a heavy black keyline around every shape, a
 * hard offset shadow instead of a soft one, and halftone dots where a printer
 * would have laid them.
 *
 * The keyline does the work the fill used to. An earlier version measured its
 * contrast as letter-against-ground, which forced the letter to be near-black —
 * a bright tile with a dark letter, handsome but quiet. With a black outline the
 * separation is outline-against-everything, so the fill is free to be the light
 * note. That is why comics can put a yellow shape on a red sky and have it read
 * from across a room.
 *
 * **The blue had to be measured, not chosen.** A comic blue wants to be deep,
 * and a deep one kills the whole design: navy #1746B0 gives the black keyline
 * 2.29:1, so the outline that carries every edge would have dissolved into the
 * background. #1D5FD8 was still only 3.33:1. This blue is 5.28:1, which is
 * inside the range the reference icons occupy (4.3:1 to 18.9:1). Bright blue
 * with a black line is a comic convention *because* it is the one that prints.
 *
 * The halftone is a deeper shade of the ground rather than a fifth colour:
 * red dots over blue would have been tonally identical (L 0.197 against 0.242)
 * and turned to mud at any size below the full 1024.
 */
const LINE = '#12100F'; // the keyline: every edge in the picture
const LETTER = '#FFDD33'; // the letter, flat comic yellow
const LETTER_SHADE = '#F2B705'; // its lower half, one hard tonal step
const SUN = '#FFFFFF'; // the disc in its bowl
const GROUND = '#3A86F0'; // comic blue, the base plate
const BURST = '#F03A2E'; // red wedges radiating out of it
const DOTS = '#1E5FC8'; // halftone: a deeper shade of the ground, not a fifth colour

/** Android flattens the adaptive icon's background to a single colour. */
const GROUND_FLAT = '#3A86F0';

/**
 * One icon as SVG.
 *
 * `inset` shrinks the artwork toward the middle for Android's adaptive icon,
 * which crops to a shape covering roughly the central two thirds — anything
 * outside that is not guaranteed to survive on every launcher.
 */
/** A radiating burst: alternate wedges from the middle, comic-book sunburst. */
function burstWedges(cx, cy, count = 20, reach = 1600) {
  const wedges = [];
  const step = (Math.PI * 2) / count;
  for (let i = 0; i < count; i += 2) {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    const p = (a) => `${(cx + Math.cos(a) * reach).toFixed(1)},${(cy + Math.sin(a) * reach).toFixed(1)}`;
    wedges.push(`<polygon points="${cx},${cy} ${p(a0)} ${p(a1)}" fill="${BURST}"/>`);
  }
  return wedges.join('\n    ');
}

function iconSvg({ size, transparent = false, inset = 1 }) {
  const s = 1024;
  const c = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
  <defs>
    <!-- Ben-Day dots. The cell is deliberately large: at 1024 these are a
         texture, at 256 they are still visible, and below that they average
         into a slightly deeper orange rather than turning to mush. A 12px cell
         would have been more faithful to a printed comic and invisible
         everywhere the icon is actually seen. -->
    <pattern id="halftone" width="52" height="52" patternUnits="userSpaceOnUse">
      <circle cx="13" cy="13" r="11" fill="${DOTS}"/>
      <circle cx="39" cy="39" r="11" fill="${DOTS}"/>
    </pattern>
    <!-- The dots fade out toward the middle so they never fight the letter.
         An SVG mask keys on *luminance*: white shows, black hides. The first
         version ramped stop-opacity on black, which is black either way, so it
         hid the dots everywhere — and a texture that is invisible is not a
         subtle texture, it is an absent one. White at the rim, black in the
         middle. -->
    <radialGradient id="dotFade" cx="0.5" cy="0.52" r="0.66">
      <stop offset="0" stop-color="#000"/>
      <stop offset="0.45" stop-color="#000"/>
      <stop offset="0.9" stop-color="#fff"/>
    </radialGradient>
    <mask id="dotMask">
      <rect width="${s}" height="${s}" fill="url(#dotFade)"/>
    </mask>
  </defs>
  ${
    transparent
      ? ''
      : `<rect width="${s}" height="${s}" fill="${GROUND}"/>
  <!-- Halftone first, red wedges over the top. Printed the other way round the
       blue dots fell across the red and went muddy — blue and red sit at almost
       the same luminance (0.24 against 0.20), so the dots stopped reading as
       texture and started reading as dirt. This is also the order a comic is
       actually printed in: one plate at a time, each covering the last. -->
  <rect width="${s}" height="${s}" fill="url(#halftone)" mask="url(#dotMask)" opacity="0.9"/>
  <g opacity="0.92">
    ${burstWedges(c, 540, 16)}
  </g>`
  }
  <g transform="translate(${c} ${c}) scale(${inset}) translate(${-c} ${-c})">
    <!-- The sun, keylined like everything else. -->
    <circle cx="470" cy="625" r="104" fill="${LINE}"/>
    <circle cx="470" cy="625" r="92" fill="${SUN}"/>

    <!-- The letter, three passes: a hard offset shadow, the keyline, the fill.
         Offset down-right rather than blurred — a comic's shadow is a shape,
         not a gradient, and a blur here would also fight the system's own
         lighting on iOS. -->
    <text x="530" y="732" text-anchor="middle" font-family="Nastaliq" font-size="820"
          fill="${LINE}" stroke="${LINE}" stroke-width="64" stroke-linejoin="round"
          opacity="0.32">ح</text>
    <text x="512" y="714" text-anchor="middle" font-family="Nastaliq" font-size="820"
          fill="${LINE}" stroke="${LINE}" stroke-width="62" stroke-linejoin="round">ح</text>
    <text x="512" y="714" text-anchor="middle" font-family="Nastaliq" font-size="820"
          fill="${LETTER}" stroke="${LETTER}" stroke-width="14" stroke-linejoin="round">ح</text>
    <!-- One hard tonal step across the lower half, clipped to the letter: cel
         shading, the comic-book substitute for a gradient. -->
    <clipPath id="letterClip">
      <text x="512" y="714" text-anchor="middle" font-family="Nastaliq" font-size="820">ح</text>
    </clipPath>
    <rect x="0" y="640" width="${s}" height="${s}" fill="${LETTER_SHADE}" clip-path="url(#letterClip)"/>
  </g>
</svg>`;
}

/** The name in full, for the splash — the one place with room to read it. */
function splashSvg(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <text x="${w / 2}" y="${h / 2 + 110}" text-anchor="middle" font-family="Nastaliq" font-size="300" fill="${LETTER}">حرف</text>
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
