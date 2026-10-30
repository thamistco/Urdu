/* eslint-disable */
/**
 * Does every lesson row on the path fit on the phone it is read on?
 *
 * A row is a title and one line of subtitle beside a node. The subtitle was
 * clipped to one line (`numberOfLines={1}`) so the zig-zag path kept an even
 * rhythm. That kept the rows even, but it also hid what they said: at 320pt,
 * "1 of 2 · to know, to accept, to want" was cut off. A reader of the live app
 * reported it. No test failed, because a clipped line still renders and still
 * has the right text in the DOM. The clip then ended subtitles in an ellipsis
 * at 1.5x text (Q-026), so it went: the one-line rule is now this check's.
 *
 * So this measures the rendered row, not the string. For every lesson row, on
 * every course stage, on both tracks, at the narrowest phone the project
 * supports:
 *
 *  - the subtitle sits on one line and is no wider than its box;
 *  - the title sits on one line (it did not wrap into a ragged row);
 *
 * and again at 1.5x text, where both may wrap but nothing may be cut off.
 *
 * A character budget can't stand in for this. The text column's width depends
 * on which zig-zag offset the row lands on, and that decides whether a string
 * fits. Two subtitles eight characters apart went opposite ways.
 *
 * Run with:  npm run check:row-fit   (needs `npm run build:web` first)
 */

const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8211;

/** iPhone SE, the narrowest phone `check:home-scroll` already holds Home to. */
const VIEWPORT = { width: 320, height: 568 };

const { LEVEL_ORDER, LEVEL_META } = load('src/data/words.ts');
const { ALL_LESSONS } = load('src/data/units.ts');

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every row currently mounted: its text, and whether either line overflows. */
async function measureRows(page) {
  return page.evaluate(() => {
    const lines = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      return tops.size;
    };
    return [...document.querySelectorAll('[data-testid="row-subtitle"]')].map((sub) => {
      const title = sub.parentElement.querySelector('[data-testid="row-title"]');
      return {
        title: title ? title.textContent : '(no title)',
        subtitle: sub.textContent,
        // A pixel of slack for sub-pixel rounding; a clipped word costs dozens.
        clipped: sub.scrollWidth > sub.clientWidth + 1,
        overBy: sub.scrollWidth - sub.clientWidth,
        titleLines: title ? lines(title) : 0,
        subLines: lines(sub),
      };
    });
  });
}

async function main() {
  const execPath = findChromium();
  const { chromium } = require('playwright');
  const server = await serveDist(DIST, PORT);
  const problems = [];
  const report = [];
  try {
    const browser = await chromium.launch({ executablePath: execPath || undefined });
    for (const [track, large] of [
      ['both', false],
      ['roman', false],
      ['both', true],
      ['roman', true],
    ]) {
      const ctx = await browser.newContext({ viewport: VIEWPORT });
      // 1.5x text, the way check:text-scale sets it.
      if (large)
        await ctx.addInitScript(() => {
          const set = () => (document.documentElement.style.fontSize = '24px');
          document.addEventListener('DOMContentLoaded', set);
          set();
        });
      const page = await ctx.newPage();
      await enterAsGuest(page, `http://localhost:${PORT}/Urdu/`, {}, { track, showRoman: track !== 'script' });
      await page.waitForSelector('[data-testid="row-subtitle"]', { timeout: 20000 });

      const rows = [];
      for (const lvl of LEVEL_ORDER) {
        // The first stage is open on arrival. Tapping its header again would
        // close it, so only the others are tapped. Stages are an accordion, so
        // opening one closes the last and the first row changes.
        if (lvl !== LEVEL_ORDER[0]) {
          const before = await page.locator('[data-testid="row-title"]').first().textContent();
          const btn = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(LEVEL_META[lvl].title)}\\.`) });
          await btn.first().click({ timeout: 5000 });
          await page.waitForFunction(
            (b) => document.querySelector('[data-testid="row-title"]')?.textContent !== b,
            before,
            { timeout: 10000 }
          );
        }
        for (const row of await measureRows(page)) rows.push({ ...row, lvl });
      }
      await ctx.close();

      const at = large ? ' at 1.5x' : '';
      const clipped = rows.filter((r) => r.clipped);
      const wrapped = large ? [] : rows.filter((r) => r.titleLines > 1);
      const twoLine = large ? [] : rows.filter((r) => r.subLines > 1);
      report.push(`  ${track} track${at}: ${rows.length} rows measured across ${LEVEL_ORDER.length} stages`);
      for (const r of clipped)
        problems.push(`${track}${at}: "${r.title}" subtitle "${r.subtitle}" is cut off by ${r.overBy}px (${r.lvl})`);
      for (const r of wrapped)
        problems.push(`${track}: title "${r.title}" wraps onto ${r.titleLines} lines (${r.lvl})`);
      for (const r of twoLine)
        problems.push(`${track}: subtitle "${r.subtitle}" of "${r.title}" takes ${r.subLines} lines (${r.lvl})`);

      // A check that measured nothing would pass. The Roman track drops the
      // letter lessons and nothing else, so each track has an exact count to reach.
      const want = track === 'roman' ? ALL_LESSONS.filter((l) => l.kind !== 'letters').length : ALL_LESSONS.length;
      if (rows.length !== want)
        problems.push(
          `${track}: measured ${rows.length} rows, but the course has ${want} on this track. A stage did not open, or opened twice.`
        );
    }
    await browser.close();
  } finally {
    await server.close();
  }

  console.log(`check:row-fit — lesson rows at ${VIEWPORT.width}x${VIEWPORT.height}, both tracks, at 1x and 1.5x text.`);
  for (const r of report) console.log(r);
  if (problems.length) {
    console.error(`\n${problems.length} row(s) a learner cannot read in full:`);
    for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
    if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
    console.error(`\nShorten the subtitle or title. Don't widen the column or allow a second line at 1x.`);
    process.exit(1);
  }
  console.log('  At 1x every title and subtitle is one line; at 1.5x nothing is cut off.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
