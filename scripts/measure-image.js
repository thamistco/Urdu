/* eslint-disable */
/**
 * Would this image survive as the scenery?
 *
 * `check:scenery` drives the real built app and measures the scenery it
 * renders. That is the right check and the wrong tool for choosing artwork:
 * you cannot ask it about a PNG sitting in a downloads folder, so a candidate
 * background has to be built and wired in before anyone learns whether it can
 * carry text — which is a long way to walk to find out the answer is no.
 *
 * This asks the same question of a loose file, using the same rule: the single
 * brightest pixel against the body-text colour, held to the same floor. It is
 * a companion to `check:scenery`, not a replacement — it says whether a
 * candidate is worth building on.
 *
 * The pale golden-hour mockup measured 1.10:1 here. The evening one measured
 * 1.29:1 until it was dimmed 42%, which brought it to 6.14:1. Both answers
 * took seconds and neither needed a line of app code.
 *
 * Run with:  node scripts/measure-image.js <image> [more images…]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { PNG } = require(path.join(ROOT, 'node_modules', 'pngjs'));

/** Body copy, and the floor the scenery is held to. Both mirror check-scenery.js. */
const TEXT = '#FFEEDD';
const FLOOR = 6;

const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hexLum = (hex) =>
  lum(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * How much every pixel would have to be scaled down to clear the floor.
 *
 * Reported because "it fails" is not actionable and "dim it to 42%" is. The
 * scale is found by bisection rather than solved for: luminance is not linear
 * in the channel values, so halving a colour does not halve its luminance.
 */
function dimNeeded(pixels) {
  const target = hexLum(TEXT);
  const ok = (k) => {
    let max = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const L = lum(pixels[i] * k, pixels[i + 1] * k, pixels[i + 2] * k);
      if (L > max) max = L;
    }
    return ratio(target, max) >= FLOOR;
  };
  if (ok(1)) return 1;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/measure-image.js <image.png> [more…]');
  process.exit(2);
}

let anyFailed = false;
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`  ${file}: not found`);
    anyFailed = true;
    continue;
  }
  if (path.extname(file).toLowerCase() !== '.png') {
    console.error(`  ${file}: only PNG is read here — export or convert first`);
    anyFailed = true;
    continue;
  }

  const png = PNG.sync.read(fs.readFileSync(file));
  const d = png.data;
  let max = 0;
  let at = null;
  let sum = 0;
  const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const L = lum(d[i], d[i + 1], d[i + 2]);
    sum += L;
    if (L > max) {
      max = L;
      const px = (i / 4) % png.width;
      at = {
        x: px,
        y: Math.floor(i / 4 / png.width),
        hex: '#' + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''),
      };
    }
  }
  const r = ratio(hexLum(TEXT), max);
  const pass = r >= FLOOR;
  if (!pass) anyFailed = true;

  console.log(`\n${path.basename(file)}  ${png.width}×${png.height}`);
  console.log(`  brightest pixel  ${at.hex} at (${at.x}, ${at.y})   L=${max.toFixed(4)}`);
  console.log(`  mean luminance   ${(sum / n).toFixed(4)}`);
  console.log(
    `  against ${TEXT}  ${r.toFixed(2)}:1   ${pass ? `clears the ${FLOOR}:1 floor` : `UNDER the ${FLOOR}:1 floor`}`
  );
  if (!pass) {
    const k = dimNeeded(d);
    console.log(`  would clear it at ${Math.round(k * 100)}% brightness — or put a scrim behind the text`);
  }
}

console.log('');
process.exit(anyFailed ? 1 : 0);
