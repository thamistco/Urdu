/**
 * Put two letters' four forms side by side, at the size the app draws them.
 *
 * `confusableWith` (`src/data/letters.ts`) asserts that two letters are one
 * outline plus a mark. Deciding whether a pair qualifies is a question about
 * rendered Nastaliq, and the glyphs' Unicode names will not answer it — they
 * describe history, not shape. "do chashmi he" (two-eyed he) sounds like "he
 * plus two eyes" and is not: ھ is its own wider letter, not ہ with dots added.
 * So this renders the real thing to look at, and measures what it can.
 *
 * It deliberately prints no verdict, because the two numbers that look like
 * they should give one both fail. That is the finding, from URD-067:
 *
 *   The shipped trace masks (`src/data/glyphMasks.ts`) are the wrong
 *   instrument. `generate-glyph-masks.js` frames every glyph in its own
 *   square, scaled to its own longest edge, because tracing needs each letter
 *   to fill its own card — which discards scale. Scored on them,
 *   choti-he ~ do-chashmi-he comes out at 0.443, effectively tied with the
 *   genuinely confusable baRi-he ~ khe at 0.458, and 114 undeclared pairs
 *   outrank it.
 *
 *   Rendered glyph width, which this file prints, does not discriminate
 *   either. It is 1.00x across all four forms for baRi-he ~ khe and
 *   kaaf ~ gaaf, which invites the rule "a mark adds ink to an outline it
 *   does not widen" — but measured across all 16 declared pairs that rule
 *   misclassifies half of them, because a mark on a narrow glyph dominates
 *   its box: alif ~ alif-madda is 4.00x and noon ~ noon-ghunna 2.29x, both
 *   wider apart than the pair URD-067 was asking about (2.47x).
 *
 * What settled URD-067 instead was the corpus's own documented criterion —
 * whether a letter's curated note describes the shared shape — checked in
 * `letters.test.ts`, with this rendering as the evidence that the notes are
 * telling the truth. Numbers here are for looking at alongside the sheet, not
 * for thresholding.
 *
 * Overlap (IoU) is not reported at all: it swings on how the glyphs are
 * aligned. Centred text shifts sideways when a mark widens the advance
 * (kaaf/gaaf's initial forms differ by 15px from that alone), and aligning
 * bounding boxes instead drags a dotted glyph's body out of place — the same
 * pair reads 0.90 or 0.11 depending on which you pick.
 *
 * A companion to the judgement, not a gate: like `measure-image.js` it answers
 * "is this worth doing" offline, and is not part of `check:all`.
 *
 *   node scripts/measure-glyph-pair.js                        # URD-067's pairs
 *   node scripts/measure-glyph-pair.js choti-he do-chashmi-he --png out.png
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const { load, ROOT } = require('./lib/load-ts.js');
const { findChromium } = require('./lib/serve-dist');

const FONT = path.join(ROOT, 'node_modules/@expo-google-fonts/noto-nastaliq-urdu/NotoNastaliqUrdu_700Bold.ttf');
const FORMS = ['isolated', 'initial', 'medial', 'final'];
const BOX = 300;
const SIZE = 72; // the letter lab's own four-form display: urduGlyph(72)

// Shown when no pair is named: the question URD-067 asked, then the two pairs
// the corpus already declares confusable, as calibration.
const DEFAULT_PAIRS = [
  ['choti-he', 'do-chashmi-he'],
  ['baRi-he', 'khe'],
  ['kaaf', 'gaaf'],
];

function pageHtml() {
  const b64 = fs.readFileSync(FONT).toString('base64');
  return `<html><head><style>
    @font-face { font-family:'N'; src:url(data:font/ttf;base64,${b64}); }
    body { margin:0; width:${BOX}px; height:${BOX}px; background:#fff; }
    #g { font-family:'N'; font-size:${SIZE}px; line-height:${BOX}px; color:#000;
         text-align:center; direction:rtl; }
  </style></head><body><div id="g"></div></body></html>`;
}

/** The glyph's ink: its bounding box and how many pixels it covers. */
function measureInk(png) {
  let x0 = Infinity;
  let x1 = -1;
  let y0 = Infinity;
  let y1 = -1;
  let area = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) << 2;
      if ((png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3 >= 128) continue;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (area === 0) return null;
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, area };
}

async function measureLetters(page, letters) {
  const ink = {};
  for (const l of letters) {
    for (const f of FORMS) {
      // U+200F keeps the isolated forms from being reordered by the browser.
      await page.evaluate((t) => (document.getElementById('g').textContent = t), '‏' + l.forms[f]);
      const m = measureInk(PNG.sync.read(await page.screenshot()));
      if (!m) throw new Error(`${l.id}:${f} rendered no ink — is the font loading?`);
      ink[`${l.id}:${f}`] = m;
    }
  }
  return ink;
}

function report(pairs, byId, ink) {
  const ratio = (a, b) => Math.max(a, b) / Math.min(a, b);
  console.log(`\nGlyph ink at the letter lab's own ${SIZE}px, in the app's own Nastaliq.`);
  console.log('Descriptive only — see this file’s header for why these do not decide anything.\n');
  for (const [a, b] of pairs) {
    console.log(`${byId[a].name} ~ ${byId[b].name}   (${a} ~ ${b})`);
    console.log('    form      width A   width B   width ratio   ink ratio');
    for (const f of FORMS) {
      const A = ink[`${a}:${f}`];
      const B = ink[`${b}:${f}`];
      console.log(
        `    ${f.padEnd(8)}  ${String(A.w).padStart(7)}   ${String(B.w).padStart(7)}   ` +
          `${ratio(A.w, B.w).toFixed(2).padStart(10)}x   ${ratio(A.area, B.area).toFixed(2).padStart(7)}x`
      );
    }
    console.log('');
  }
}

/** A side-by-side sheet of both letters' four forms, for looking at. */
async function writeSheet(page, pairs, byId, out) {
  const row = (l) =>
    `<div class="row"><div class="lbl">${l.name}<br><span>${l.id}</span></div>` +
    FORMS.map((f) => `<div class="cell"><div class="g">‏${l.forms[f]}</div><div class="f">${f}</div></div>`).join('') +
    '</div>';
  await page.setViewportSize({ width: 760, height: 1200 });
  await page.setContent(`<html><head><style>
    @font-face { font-family:'N'; src:url(data:font/ttf;base64,${fs.readFileSync(FONT).toString('base64')}); }
    body { margin:0; background:#efdfc7; font-family:system-ui,sans-serif; }
    .pair { padding:14px 18px; border-bottom:3px solid #2a1f1a; }
    h2 { font-size:13px; margin:0 0 2px; color:#2a1f1a; letter-spacing:.06em; text-transform:uppercase; }
    .row { display:flex; align-items:center; }
    .lbl { width:128px; font-size:12px; color:#2a1f1a; }
    .lbl span { opacity:.55; font-size:10px; }
    .cell { width:150px; text-align:center; }
    .g { font-family:'N'; font-size:${SIZE}px; line-height:194px; color:#2a1f1a;
         transform:translateY(-18px); direction:rtl; }
    .f { font-size:9px; color:#2a1f1a; opacity:.5; margin-top:-14px; }
  </style></head><body>${pairs
    .map(
      ([a, b]) => `<div class="pair"><h2>${byId[a].name} vs ${byId[b].name}</h2>${row(byId[a])}${row(byId[b])}</div>`
    )
    .join('')}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`wrote ${out}`);
}

(async () => {
  const argv = process.argv.slice(2);
  const pngAt = argv.indexOf('--png');
  const out = pngAt === -1 ? null : argv[pngAt + 1];
  const named = (pngAt === -1 ? argv : argv.slice(0, pngAt)).filter(Boolean);
  if (named.length % 2 !== 0) {
    console.error('Name letters in pairs, e.g. `node scripts/measure-glyph-pair.js choti-he do-chashmi-he`.');
    process.exit(1);
  }
  const pairs = named.length ? [] : DEFAULT_PAIRS;
  for (let i = 0; i < named.length; i += 2) pairs.push([named[i], named[i + 1]]);

  const { LETTERS } = load('src/data/letters.ts');
  const byId = Object.fromEntries(LETTERS.map((l) => [l.id, l]));
  const unknown = pairs.flat().filter((id) => !byId[id]);
  if (unknown.length) {
    console.error(`no such letter: ${unknown.join(', ')}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ executablePath: findChromium() || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: BOX, height: BOX } });
    await page.setContent(pageHtml());
    await page.evaluate(() => document.fonts.ready);
    const ink = await measureLetters(
      page,
      [...new Set(pairs.flat())].map((id) => byId[id])
    );
    report(pairs, byId, ink);
    if (out) await writeSheet(page, pairs, byId, out);
  } finally {
    await browser.close();
  }
})();
