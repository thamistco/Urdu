/* eslint-disable */
/**
 * Generates Harf's app icon, adaptive icon and splash mark as PNGs — no image
 * libraries, just a tiny hand-rolled RGBA→PNG encoder (zlib is built into Node).
 *
 * The mark is an 8-point Islamic geometric star in reward-gold on deep indigo —
 * the same lattice motif used throughout the app, distilled to a single glyph.
 *
 * Run: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'images');

const INK = [12, 26, 51, 255];
const GOLD = [232, 163, 61, 255];
const GOLD_DK = [201, 134, 42, 255];
const CLEAR = [0, 0, 0, 0];

// ---- PNG encoder ---------------------------------------------------------
function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[p++] = rgba[i];
      raw[p++] = rgba[i + 1];
      raw[p++] = rgba[i + 2];
      raw[p++] = rgba[i + 3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---- drawing -------------------------------------------------------------
function canvas(size, bg) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = bg[0];
    rgba[i * 4 + 1] = bg[1];
    rgba[i * 4 + 2] = bg[2];
    rgba[i * 4 + 3] = bg[3];
  }
  return rgba;
}

function setPx(rgba, size, x, y, c, a = 1) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  const alpha = (c[3] / 255) * a;
  rgba[i] = Math.round(rgba[i] * (1 - alpha) + c[0] * alpha);
  rgba[i + 1] = Math.round(rgba[i + 1] * (1 - alpha) + c[1] * alpha);
  rgba[i + 2] = Math.round(rgba[i + 2] * (1 - alpha) + c[2] * alpha);
  rgba[i + 3] = Math.max(rgba[i + 3], Math.round(c[3] * a));
}

// star polygon: n points, alternating outer/inner radius, rotated
function starPoints(cx, cy, outer, inner, points, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (Math.PI * i) / points;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function fillPoly(rgba, size, poly, c) {
  // 2x supersample for smooth edges
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (const [dx, dy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        if (pointInPoly(x + dx, y + dy, poly)) hits++;
      }
      if (hits) setPx(rgba, size, x, y, c, hits / 4);
    }
  }
}

function drawMark(rgba, size, scale = 0.66) {
  const c = size / 2;
  const outer = (size * scale) / 2;
  const inner = outer * 0.44;
  // outer 8-point star (gold)
  fillPoly(rgba, size, starPoints(c, c, outer, inner, 8), GOLD);
  // inner rotated star punch-out (ink) → lattice depth
  fillPoly(rgba, size, starPoints(c, c, outer * 0.6, inner * 0.62, 8, 0), INK);
  // center gold dot
  fillPoly(rgba, size, starPoints(c, c, outer * 0.24, outer * 0.24 * 0.9, 16, 0), GOLD_DK);
}

// ---- outputs -------------------------------------------------------------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function write(name, size, bg, scale) {
  const rgba = canvas(size, bg);
  drawMark(rgba, size, scale);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(`  ✓ ${name}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

write('icon.png', 512, INK, 0.66);
write('adaptive-icon.png', 512, CLEAR, 0.58); // foreground only; bg from app.json
write('splash.png', 512, INK, 0.5);
write('favicon.png', 64, INK, 0.7);
console.log('Done. Icons written to assets/images/');
