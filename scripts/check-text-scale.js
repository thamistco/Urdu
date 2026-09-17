/* eslint-disable */
/**
 * Small text has to grow when the reader asks for bigger text.
 *
 * Tailwind's preset sizes (`text-xs`, `text-2xl`) come out as rem and follow
 * the browser's font-size setting. Arbitrary sizes — `text-[11px]` — and inline
 * `style={{ fontSize: 9 }}` come out as px and do not. The app had 108 of those,
 * and 52 of them were at 11px or below, so at twice the default text size the
 * body copy doubled while every small label stayed exactly where it was: the
 * type hierarchy inverted, and the labels a learner most needs magnified were
 * the ones that refused to move.
 *
 * Only the label range is asserted. A few sizes are deliberately graphic rather
 * than typographic — the 80pt letter inside the tracing pad, the tick drawn in
 * a lesson node — and doubling those would burst the boxes they are centred in
 * rather than help anybody read them.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:text-scale
 */

const path = require('path');
const fs = require('fs');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8334;

/** Sizes at or below this are labels, and labels must scale. */
const LABEL_MAX_PX = 16;

/** The multiple the root font size is raised by. */
const FACTOR = 2;

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/** Every visible run of text, with its computed size and what it says. */
function sample() {
  return Array.from(document.querySelectorAll('div,span,p')).flatMap((n) => {
    if (n.children.length) return [];
    const text = (n.textContent || '').trim();
    if (!text) return [];
    const r = n.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return [];
    return [{ text: text.slice(0, 40), size: Math.round(parseFloat(getComputedStyle(n).fontSize) * 100) / 100 }];
  });
}

async function main() {
  const server = await serveDist(DIST, PORT);
  const { chromium } = require('playwright-core');
  const problems = [];
  let browser;
  let checked = 0;

  try {
    browser = await chromium.launch({ executablePath: findChromium() || undefined });

    const read = async (root, seed) => {
      const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
      await enterAsGuest(page, `http://localhost:${PORT}/Urdu/`, seed);
      await page.waitForTimeout(1800);
      await page.evaluate((r) => {
        document.documentElement.style.fontSize = `${r}px`;
      }, root);
      await page.waitForTimeout(600);
      const out = await page.evaluate(sample);
      await page.close();
      return out;
    };

    // Home carries the densest mix of label sizes in the app — the counters,
    // the level card, the two cards under it, the path's own unit headers.
    const seed = { xp: 640, streak: 3, gems: 145 };
    const normal = await read(16, seed);
    const large = await read(16 * FACTOR, seed);

    const grown = new Map(large.map((l) => [l.text, l.size]));
    for (const line of normal) {
      if (line.size > LABEL_MAX_PX) continue;
      const after = grown.get(line.text);
      // A line that moved or changed between the two reads is not evidence
      // either way; only compare like with like.
      if (after === undefined) continue;
      checked++;
      if (after < line.size * 1.5) {
        problems.push(
          `"${line.text}" stays at ${after}px when the reader asks for ${FACTOR}x text (it was ${line.size}px) — ` +
            `everything around it grows and the hierarchy inverts.`
        );
      }
    }

    // A check that compared nothing would pass in silence, which is how the
    // fixed-pixel sizes survived this long in the first place.
    if (checked < 8) {
      problems.push(
        `Only ${checked} label-sized lines were comparable across the two reads — this check proved nothing.`
      );
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (problems.length) {
    console.error(
      `check:text-scale — ${problems.length} label${problems.length === 1 ? '' : 's'} that will not grow:\n`
    );
    for (const p of problems.slice(0, 12)) console.error(`  ✗ ${p}`);
    if (problems.length > 12) console.error(`  … and ${problems.length - 12} more`);
    process.exit(1);
  }
  console.log(`check:text-scale — all ${checked} label-sized lines on Home grow with the browser's text setting.`);
}

main().catch((err) => {
  console.error('check:text-scale — failed to run:', err);
  process.exit(1);
});
