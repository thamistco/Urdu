/* eslint-disable */
/**
 * Opening a collapsed course stage from a scrolled-down position — does it
 * land near the accordion, or reset all the way to the top?
 *
 * URD-002's own accordion fix (round 2) chose `y: 0` deliberately: two
 * precise-positioning approaches (`measureLayout` against the ScrollView,
 * and tracking scroll offset via `onScroll`) were tried and measured wrong
 * against the real react-native-web build (see `HomeScreen.tsx`'s own
 * comment on `toggleLevel` for the full history). `y: 0` is always a valid,
 * labeled, non-empty landing spot — but it costs a full ~8,000px return
 * scroll on a beginner-stage-open Home screen, when the accordion itself
 * sits only ~500px down.
 *
 * URD-032 lands at the height of everything above the accordion instead
 * (`fixedHeaderHeight`, captured once via `onLayout` — content whose height
 * never changes when a stage collapses or expands, so it can't go stale the
 * way the two failed measure-at-toggle-time approaches did). This drives
 * the real built bundle, scrolls to the bottom, opens a collapsed stage, and
 * measures where the scroll position actually lands — against real content,
 * not the code that's supposed to produce it.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:home-scroll
 */

const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');

const DIST = require('path').join(__dirname, '..', 'dist');
const PORT = 8330;

const { ALL_LESSONS } = load('src/data/units.ts');

if (!require('fs').existsSync(require('path').join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/** The app's own scrolling container: a nested `overflow: auto` div per
 *  screen (see `check-sizes.js`'s own note on this structure), not the
 *  window — `window.scrollY` is always 0 in this layout. */
function findScrollTop() {
  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 50) return el.scrollTop;
  }
  return null;
}

async function main() {
  const server = await serveDist(DIST, PORT);
  const { chromium } = require('playwright-core');
  const execPath = findChromium();
  const problems = [];

  try {
    const browser = await chromium.launch({ executablePath: execPath || undefined });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
    const url = `http://localhost:${PORT}/Urdu/`;

    // Deep into the course (matching check-path.js's own scenario), so
    // several stages carry real progress and at least one sits collapsed
    // below the open one.
    await enterAsGuest(page, url, {
      completedLessons: Object.fromEntries(
        ALL_LESSONS.slice(0, Math.floor(ALL_LESSONS.length * 0.7)).map((l) => [l.id, { best: 1, done: 1 }])
      ),
    });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 50) {
          el.scrollTop = el.scrollHeight;
          break;
        }
      }
    });
    await page.waitForTimeout(300);
    const scrolledToBottom = await page.evaluate(findScrollTop);

    const headers = page.locator('[role="button"][aria-label*="Expand"]');
    const headerCount = await headers.count();
    if (headerCount === 0) {
      problems.push(
        'No collapsed ("Expand") stage header found at this progress level — cannot exercise the toggle at all.'
      );
    } else {
      const before = await headers.first().getAttribute('aria-label');
      await headers.first().scrollIntoViewIfNeeded();
      await headers.first().click({ force: true });
      await page.waitForTimeout(1200); // let the animated scrollTo finish

      const scrolledAfterOpen = await page.evaluate(findScrollTop);

      // The regression this guards against: a full reset to 0 (URD-002's
      // trade, now tightened) or, worse, a stale mid-list position with no
      // header in sight (the two failed measure-at-toggle-time attempts'
      // own failure mode). 1500px is well under the ~8,000px a full-stage
      // round trip would cost, and well above 0 — proving this isn't the
      // old full reset either.
      if (scrolledAfterOpen === null) {
        problems.push('Could not read the scroll position after opening a stage.');
      } else if (scrolledAfterOpen === 0) {
        problems.push(
          `Opening "${before}" reset scroll to the very top (0px) — the pre-URD-032 full reset, not the tightened landing.`
        );
      } else if (scrolledAfterOpen > 1500) {
        problems.push(
          `Opening "${before}" left scroll at ${scrolledAfterOpen}px — expected a tight landing near the accordion (under 1500px), not a near-full return scroll.`
        );
      }

      // Confirm the landing is actually useful: the newly-opened stage's
      // own header text should be visible near the top of the viewport, not
      // scrolled past into its lesson list with "no header in sight" — the
      // exact defect DESIGN CRITIC filed against the two failed approaches.
      const levelName = (before || '').split('.')[0].trim();
      const headerVisible = await page.evaluate((name) => {
        return Array.from(document.querySelectorAll('*')).some((n) => {
          const r = n.getBoundingClientRect();
          return r.top >= 0 && r.top < 300 && n.children.length === 0 && (n.textContent || '').includes(name);
        });
      }, levelName);
      if (!headerVisible) {
        problems.push(
          `After opening "${before}", its own stage header text ("${levelName}") is not visible near the top of the screen.`
        );
      }

      console.log(
        `check:home-scroll — scrolled to bottom (${scrolledToBottom}px), opened "${before}", landed at ${scrolledAfterOpen}px.`
      );
    }

    await page.close();
    await browser.close();
  } finally {
    server.close();
  }

  if (problems.length) {
    console.error(`\ncheck:home-scroll — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
    for (const p of problems) console.error(`  ${p}\n`);
    process.exit(1);
  }
  console.log(
    'check:home-scroll — opening a collapsed stage lands tightly near the accordion, header visible, never a full reset.'
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
