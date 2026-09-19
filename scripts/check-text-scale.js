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

/**
 * Every screen with its own URL, not just Home.
 *
 * This checked Home alone, on the reasoning that Home carries the densest mix
 * of label sizes in the app. It does — and it was also the one screen with
 * nothing wrong. Walking the rest found 34 label-sized lines that stayed put
 * while everything around them doubled: the leaderboard's rank column and its
 * avatar initials (30 of the 34, on a screen that is nothing but a list of
 * small labels), the row chevrons on Profile and Practice, and the destructive
 * "Reset all progress" label in Settings. All of them are a `Txt` or a `Bold`
 * with no size class at all, falling through to react-native-web's fixed 14px
 * — a fourth way to get a px size, and the one the original note above missed.
 *
 * `''` is Home. The floor below is per screen, because the Letter Lab honestly
 * has about sixteen comparable lines and Practice has 262.
 */
const SCREENS = ['', 'practice', 'profile', 'settings', 'league', 'achievements', 'letters'];

/** Below this many comparable lines, a screen's reading proves nothing. */
const FLOOR = 8;

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
  const counts = [];

  try {
    browser = await chromium.launch({ executablePath: findChromium() || undefined });

    /**
     * `label` names the read in any complaint, because the two are otherwise
     * indistinguishable once they are a pair of arrays — and "0 lines were
     * comparable" is what this check says when *either* of them came back
     * empty, which sent one failure inside `check:all` to be diagnosed by
     * hand. A read that never reached Home now says so, and says what it was
     * looking at instead.
     */
    const read = async (root, seed, label, where) => {
      const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
      /**
       * The base path this build was made with, read from the page.
       *
       * Hard-coding `/Urdu/` works for the deploy-shaped build `check:all`
       * makes and silently does not for a plain `npm run build:web`: the SPA
       * fallback answers every unknown path with `index.html`, so each screen
       * came back as Home and all seven read identically, at exactly the same
       * line counts, which is what gave it away.
       */
      await page.goto(`http://localhost:${PORT}/`);
      const base = await page
        .evaluate(() =>
          (document.querySelector('meta[name="harf:base"]')?.getAttribute('content') || '').replace(/^\/+|\/+$/g, '')
        )
        .catch(() => '');
      await enterAsGuest(page, `http://localhost:${PORT}/${base ? `${base}/` : ''}${where}`, seed);
      /**
       * Wait for the path to be on screen, not for a number of milliseconds.
       *
       * This check passed on its own and failed inside `check:all` at "0
       * label-sized lines were comparable" — it had sampled a half-mounted
       * Home, because 1800ms is a guess about how loaded the machine is and
       * the full pipeline is the most loaded it ever gets. The refusal was
       * right and the cause was the clock.
       */
      // Home is known to have mounted when the path is on it; every other
      // screen, when it has drawn some text of its own.
      await page
        .waitForFunction(
          (home) =>
            home
              ? Array.from(document.querySelectorAll('[role="button"]')).some((n) =>
                  /start this lesson/i.test(n.getAttribute('aria-label') || '')
                )
              : document.body.innerText.trim().length > 40,
          where === '',
          { timeout: 30000 }
        )
        .catch(() => {});
      /**
       * Whether Home is actually on screen, asked rather than assumed.
       *
       * The wait above swallows its own timeout — deliberately, so a slow
       * mount that still arrives is not turned into a failure — which used to
       * mean a read that never got past the sign-in screen sampled it anyway
       * and reported nothing at all. The two reads then had no text in common
       * and this check refused to claim a pass, correctly, with a message
       * about comparability that pointed nowhere near the cause.
       */
      const mounted = await page
        .evaluate(
          (home) =>
            home
              ? Array.from(document.querySelectorAll('[role="button"]')).some((n) =>
                  /start this lesson/i.test(n.getAttribute('aria-label') || '')
                )
              : document.body.innerText.trim().length > 40,
          where === ''
        )
        .catch(() => false);
      if (!mounted) {
        const saw = await page
          .evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 160))
          .catch(() => '(the page could not be read)');
        problems.push(
          `The ${label} read of /${where || '(home)'} never mounted, so nothing was measured. On screen: "${saw}"`
        );
      }
      /**
       * Wait for the screen to stop changing, rather than for a number.
       *
       * Every screen here staggers its content in, and 600ms was enough for
       * five of the seven: Settings and the leaderboard read eleven lines on
       * their first pass and fifty and sixty-six on their second, so nothing
       * was comparable and both were reported as proving nothing. The first
       * read of a screen pays for cold fonts and cold JIT and the second does
       * not, which is a difference no constant can be right about.
       *
       * The count of drawn text nodes is what settles; two identical readings
       * a quarter-second apart is settled enough, and the ceiling keeps a
       * screen that genuinely never stops animating from hanging the check.
       */
      const settle = async () => {
        let last = -1;
        for (let i = 0; i < 24; i++) {
          const n = await page.evaluate(sample).then(
            (x) => x.length,
            () => -1
          );
          if (n === last && n > 0) return;
          last = n;
          await page.waitForTimeout(250);
        }
      };
      await settle();
      await page.evaluate((r) => {
        document.documentElement.style.fontSize = `${r}px`;
      }, root);
      await settle();
      const out = await page.evaluate(sample);
      await page.close();
      return out;
    };

    // Home carries the densest mix of label sizes in the app — the counters,
    // the level card, the two cards under it, the path's own unit headers.
    const seed = { xp: 640, streak: 3, gems: 145 };
    for (const where of SCREENS) {
      const normal = await read(16, seed, 'normal-text', where);
      const large = await read(16 * FACTOR, seed, `${FACTOR}x-text`, where);
      const screen = `/${where || '(home)'}`;
      let here = 0;

      const grown = new Map(large.map((l) => [l.text, l.size]));
      for (const line of normal) {
        if (line.size > LABEL_MAX_PX) continue;
        const after = grown.get(line.text);
        // A line that moved or changed between the two reads is not evidence
        // either way; only compare like with like.
        if (after === undefined) continue;
        here++;
        checked++;
        if (after < line.size * 1.5) {
          problems.push(
            `${screen}: "${line.text}" stays at ${after}px when the reader asks for ${FACTOR}x text ` +
              `(it was ${line.size}px) — everything around it grows and the hierarchy inverts.`
          );
        }
      }

      // A screen that compared nothing would pass in silence, which is how the
      // fixed-pixel sizes survived this long in the first place — and how the
      // leaderboard's thirty survived a check that only ever looked at Home.
      if (here < FLOOR) {
        problems.push(
          `${screen}: only ${here} label-sized lines were comparable across the two reads — this proved nothing. ` +
            `(${normal.length} lines read at normal text, ${large.length} at ${FACTOR}x.)`
        );
      }
      counts.push(`${screen} ${here}`);
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
  console.log(
    `check:text-scale — all ${checked} label-sized lines grow with the browser's text setting, ` +
      `across ${SCREENS.length} screens (${counts.join(', ')}).`
  );
}

main().catch((err) => {
  console.error('check:text-scale — failed to run:', err);
  process.exit(1);
});
