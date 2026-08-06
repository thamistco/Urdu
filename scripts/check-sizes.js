/* eslint-disable */
/**
 * Does the app fit on the phone it is opened on?
 *
 * Every other visual check here runs at one viewport, 412x900, because that is
 * what a Pixel reports and it is a reasonable stand-in for a phone. It is not a
 * stand-in for *phones*. The sign-in screen was laid out against two bands of
 * the background picture, expressed as fractions of the height, and the numbers
 * were tuned while looking at 900pt. At 844 the ح was already clipped by the top
 * of the screen; at 568 the button stack ran off the bottom and "Continue as a
 * guest" was half visible. Every check was green throughout, because none of
 * them ever opened a small window.
 *
 * So this opens eight of them, from the smallest phone still in circulation to a
 * desktop browser, and asserts two things that are true of any working layout:
 *
 *  1. **Nothing sits outside the window horizontally.** A phone that scrolls
 *     sideways is broken, and it is the failure people notice first.
 *  2. **No text is cut off by an edge.** Measured on the text itself rather than
 *     on the document, because these screens scroll inside a React Native
 *     `ScrollView`: the document is always exactly one screen tall, so document
 *     level metrics report success on a screen whose content is being sliced in
 *     half.
 *
 * The second is the one that caught the real bug. `document.scrollHeight` was
 * equal to the window height at every size, on every screen, the whole time.
 *
 * Run with:  npm run check:sizes
 */

const fs = require('fs');
const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8201;

/**
 * The sizes, and why each is here.
 *
 * The small end matters more than the large: a 320pt screen is the one that
 * breaks, and it is still a device people learn on. The desktop entries are
 * there because the web preview is how this app is shared.
 */
const SIZES = [
  [320, 568, 'iPhone SE, 1st gen'],
  [360, 640, 'small Android'],
  [375, 667, 'iPhone SE, current'],
  [390, 844, 'iPhone 14'],
  [412, 915, 'Pixel'],
  [430, 932, 'iPhone Pro Max'],
  [768, 1024, 'iPad portrait'],
  [1280, 800, 'desktop browser'],
];

function missing(reason) {
  if (process.env.CI) {
    console.error(`check:sizes — ${reason}. In CI that is a failure, not a skip.`);
    process.exit(1);
  }
  console.log(`check:sizes — ${reason}. Skipping.`);
  process.exit(0);
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) missing('no dist/, run the web export first');

let chromium;
try {
  chromium = require('playwright-core').chromium;
} catch {
  missing('playwright-core is not installed');
}

/**
 * Text the window is cutting off, and anything reaching past its sides.
 *
 * Only elements holding a real text node are judged for clipping. A decorative
 * layer is allowed to overflow: the sign-in picture is deliberately wider than
 * the window so that it can be cropped to a portrait, and it lives inside an
 * `overflow: hidden` box, so it never produces a scrollbar and never hides a
 * word. Words are the thing that must not be cut.
 *
 * One pixel of tolerance throughout, because a half-pixel layout rounds either
 * way and a check that fails on 0.4pt teaches people to ignore it.
 */
async function problems(page) {
  return page.evaluate(() => {
    const out = { sideways: 0, clipped: [] };
    const d = document.documentElement;
    out.sideways = Math.max(0, d.scrollWidth - window.innerWidth);
    for (const el of document.querySelectorAll('*')) {
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      // Outside the window is not the same as unreachable. The lesson path
      // opens scrolled to where the learner got to, so its header sits several
      // hundred points above the top of the window and is one flick away. What
      // matters is whether anything can bring the text back: if a scrollable
      // ancestor exists, this is scrolling, and only if none does is it
      // clipping. That distinction is the whole check — sign-in is the screen
      // with no scroll view, which is exactly why it was the one losing text.
      let scrollable = false;
      for (let n = el.parentElement; n && !scrollable; n = n.parentElement) {
        const os = getComputedStyle(n);
        if (/(auto|scroll)/.test(os.overflowY) && n.scrollHeight > n.clientHeight + 1) scrollable = true;
      }
      if (scrollable) continue;
      const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
      if (r.top < -1) out.clipped.push({ text, edge: 'top', by: Math.round(-r.top) });
      else if (r.bottom > window.innerHeight + 1)
        out.clipped.push({ text, edge: 'bottom', by: Math.round(r.bottom - window.innerHeight) });
      else if (r.left < -1) out.clipped.push({ text, edge: 'left', by: Math.round(-r.left) });
      else if (r.right > window.innerWidth + 1)
        out.clipped.push({ text, edge: 'right', by: Math.round(r.right - window.innerWidth) });
    }
    // The same string is often several stacked copies (the wordmark's glow is
    // four), so report each distinct one once.
    const seen = new Set();
    out.clipped = out.clipped.filter((c) => {
      const k = `${c.text}|${c.edge}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return out;
  });
}

(async () => {
  const exe = findChromium();
  if (!exe) missing('no Chromium found');

  const server = await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: exe });
  const url = `http://localhost:${PORT}/`;
  const failures = [];
  let checked = 0;

  for (const [width, height, label] of SIZES) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Sign-in first, which is the screen that does not scroll and so the one
    // with nowhere to put content that does not fit.
    await page.goto(url);
    await page.waitForTimeout(2200);
    const signIn = await problems(page);

    await enterAsGuest(page, url);
    const home = await problems(page);

    for (const [screen, p] of [
      ['sign-in', signIn],
      ['home', home],
    ]) {
      checked++;
      if (p.sideways > 0) {
        failures.push(`${label} ${width}x${height} · ${screen}: the window scrolls sideways by ${p.sideways}pt`);
      }
      for (const c of p.clipped.slice(0, 3)) {
        failures.push(`${label} ${width}x${height} · ${screen}: "${c.text}" is ${c.by}pt past the ${c.edge} edge`);
      }
    }
    if (errors.length) failures.push(`${label} ${width}x${height}: page error — ${errors[0].slice(0, 80)}`);
    await page.close();
  }

  await browser.close();
  server.close();

  if (failures.length) {
    console.error(`check:sizes — ${failures.length} layout problem(s) across ${SIZES.length} screen sizes:\n`);
    for (const f of failures.slice(0, 30)) console.error(`  ${f}`);
    if (failures.length > 30) console.error(`  … and ${failures.length - 30} more`);
    console.error(
      `\n  A fraction of the height is not a layout. Something sized against one screen\n` +
        `  has been opened on another; measure what the content needs and let the\n` +
        `  decoration give way, rather than the other way round.`
    );
    process.exit(1);
  }
  console.log(
    `check:sizes — ${checked} screen renders across ${SIZES.length} sizes, from ${SIZES[0][0]}x${SIZES[0][1]} to ${SIZES[SIZES.length - 1][0]}x${SIZES[SIZES.length - 1][1]}. Nothing clipped, nothing scrolling sideways.`
  );
})().catch((e) => {
  console.error('check:sizes — ' + e.message);
  process.exit(1);
});
