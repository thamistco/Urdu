/**
 * Build the ink masks the letter-tracing exercise scores against.
 *
 * Tracing is only worth shipping if the score means something, and scoring
 * means answering "is the point the learner touched actually on the letter?".
 * Nastaliq has no stroke-order data to compare against the way Hanzi does, and
 * the glyph outlines live inside the font, so the honest way to get that answer
 * is to rasterise each glyph once, offline, and ship the result.
 *
 * For each of the 40 letters in each of its four position forms this renders
 * the glyph in the app's own font, finds its ink, frames it in a square, and
 * emits two things:
 *
 *   bits          a GRID×GRID bitmask of where the ink is inside that square
 *   fs / cx / by  how to draw the same glyph at the same place in a square
 *                 card of any size, so the mask lines up with what is on screen
 *
 * At runtime a touch is then a lookup — exact, identical on web and native, no
 * font parsing or canvas on the device.
 *
 * The mask is dilated by one cell before it ships. That is deliberate: it makes
 * tracing forgiving of a fingertip's width, and absorbs any sub-cell
 * disagreement between this rasterisation and the device's own text layout.
 *
 * Run with:  npm run gen:masks     (needs the Playwright chromium in the image)
 * Output:    src/data/glyphMasks.ts
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const FONT = path.join(ROOT, 'node_modules/@expo-google-fonts/noto-nastaliq-urdu/NotoNastaliqUrdu_700Bold.ttf');
const OUT = path.join(ROOT, 'src/data/glyphMasks.ts');

const FONT_SIZE = 160; // rasterisation size; the emitted numbers are ratios
const PAD = 1.18; // square side as a multiple of the glyph's longest edge
const GRID = 40; // mask resolution per axis

function loadLetters() {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/letters.ts'), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
  return mod.exports.LETTERS;
}

(async () => {
  const letters = loadLetters();
  const fontB64 = fs.readFileSync(FONT).toString('base64');

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await browser.newPage();
  await page.setContent('<html><body style="margin:0"></body></html>');
  await page.evaluate(async (b64) => {
    const face = new FontFace('TraceNastaliq', `url(data:font/ttf;base64,${b64})`);
    await face.load();
    document.fonts.add(face);
    await document.fonts.ready;
  }, fontB64);

  const jobs = [];
  for (const l of letters) {
    for (const form of ['isolated', 'initial', 'medial', 'final']) {
      jobs.push({ key: `${l.id}:${form}`, text: l.forms[form] });
    }
  }

  // This whole function is serialised and run inside the browser, so it cannot
  // call helpers from this file — everything it needs has to be inside it.
  // Splitting it would mean either duplicating the helpers on both sides or
  // marshalling them across as strings, both of which are worse than one long
  // function with a clear top-to-bottom shape. See rule 160 in
  // docs/ENGINEERING_STANDARDS.md.
  const result = await page.evaluate(
    // eslint-disable-next-line max-lines-per-function, complexity
    ({ jobs, FONT_SIZE, PAD, GRID }) => {
      const W = FONT_SIZE * 5;
      const H = FONT_SIZE * 5;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.font = `${FONT_SIZE}px TraceNastaliq`;

      // The font's own vertical metrics, so the runtime can work out where a
      // line box puts the baseline without hard-coding anything.
      const fm = ctx.measureText('ا');
      const ascent = fm.fontBoundingBoxAscent / FONT_SIZE;
      const descent = fm.fontBoundingBoxDescent / FONT_SIZE;

      const anchorX = W / 2;
      const anchorY = H / 2; // the baseline we draw on
      const out = {};

      for (const job of jobs) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `${FONT_SIZE}px TraceNastaliq`;
        ctx.fillText(job.text, anchorX, anchorY);

        const px = ctx.getImageData(0, 0, W, H).data;
        let minX = W,
          minY = H,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (px[(y * W + x) * 4 + 3] > 60) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0) {
          out[job.key] = null;
          continue;
        }

        // Frame the ink in a square with a little air around it.
        const side = Math.max(maxX - minX + 1, maxY - minY + 1) * PAD;
        const cxPx = (minX + maxX) / 2;
        const cyPx = (minY + maxY) / 2;
        const left = cxPx - side / 2;
        const top = cyPx - side / 2;

        const cell = side / GRID;
        const grid = new Uint8Array(GRID * GRID);
        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const x0 = Math.max(0, Math.floor(left + gx * cell));
            const x1 = Math.min(W, Math.ceil(left + (gx + 1) * cell));
            const y0 = Math.max(0, Math.floor(top + gy * cell));
            const y1 = Math.min(H, Math.ceil(top + (gy + 1) * cell));
            let hit = 0;
            for (let y = y0; y < y1 && !hit; y++) {
              for (let x = x0; x < x1; x++) {
                if (px[(y * W + x) * 4 + 3] > 60) {
                  hit = 1;
                  break;
                }
              }
            }
            grid[gy * GRID + gx] = hit;
          }
        }

        const dilated = new Uint8Array(GRID * GRID);
        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            let on = 0;
            for (let dy = -1; dy <= 1 && !on; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = gy + dy,
                  nx = gx + dx;
                if (ny < 0 || nx < 0 || ny >= GRID || nx >= GRID) continue;
                if (grid[ny * GRID + nx]) {
                  on = 1;
                  break;
                }
              }
            }
            dilated[gy * GRID + gx] = on;
          }
        }

        const bytes = new Uint8Array(Math.ceil(dilated.length / 8));
        for (let i = 0; i < dilated.length; i++) if (dilated[i]) bytes[i >> 3] |= 1 << (i & 7);
        let bin = '';
        for (const b of bytes) bin += String.fromCharCode(b);

        out[job.key] = {
          bits: btoa(bin),
          ink: dilated.reduce((n, v) => n + v, 0),
          // as fractions of the square's side:
          fs: FONT_SIZE / side, // font size to draw at
          cx: (anchorX - left) / side, // where the text's centre sits
          by: (anchorY - top) / side, // where its baseline sits
        };
      }
      return { out, ascent, descent };
    },
    { jobs, FONT_SIZE, PAD, GRID }
  );

  await browser.close();

  const { out: masks, ascent, descent } = result;
  const blank = Object.entries(masks).filter(([, m]) => !m || m.ink < 8);
  if (blank.length) {
    console.error(`${blank.length} glyphs rendered blank — did the font load?`);
    console.error(
      blank
        .slice(0, 8)
        .map(([k]) => k)
        .join(', ')
    );
    process.exit(1);
  }

  const entries = Object.entries(masks)
    .map(([k, m]) => `  '${k}': ['${m.bits}', ${m.fs.toFixed(4)}, ${m.cx.toFixed(4)}, ${m.by.toFixed(4)}],`)
    .join('\n');

  fs.writeFileSync(
    OUT,
    `/**
 * Ink masks for letter tracing — GENERATED, do not edit by hand.
 * Regenerate with \`npm run gen:masks\` (see scripts/generate-glyph-masks.js).
 *
 * One ${GRID}×${GRID} bitmask per letter per position form. A set bit means the
 * glyph's ink covers that cell; the mask is already dilated by one cell so
 * tracing is forgiving of a fingertip.
 *
 * Each entry also carries the three numbers needed to draw the same glyph in
 * the same place inside a square card of side S, so the mask lines up with what
 * the learner can see:
 *
 *   fontSize   = fs * S
 *   centre x   = cx * S      (the text is centre-aligned on this)
 *   baseline y = by * S
 */

export const MASK_GRID = ${GRID};

/** The font's own vertical metrics, as multiples of the font size. A line box
 *  of height L puts the baseline at (L - (ascent + descent) * F) / 2 + ascent * F. */
export const FONT_ASCENT = ${ascent.toFixed(4)};
export const FONT_DESCENT = ${descent.toFixed(4)};

/** [bits, fs, cx, by] — key is \`\${letterId}:\${position}\` */
export type GlyphMask = [string, number, number, number];

export const GLYPH_MASKS: Record<string, GlyphMask> = {
${entries}
};
`,
    'utf8'
  );

  const bytes = fs.statSync(OUT).size;
  console.log(
    `wrote ${Object.keys(masks).length} masks (${GRID}×${GRID}) → src/data/glyphMasks.ts, ${(bytes / 1024).toFixed(0)} kB`
  );
  console.log(`font metrics: ascent ${ascent.toFixed(3)}em, descent ${descent.toFixed(3)}em`);
})();
