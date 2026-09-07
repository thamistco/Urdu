/**
 * Does the question stay put when you answer it?
 *
 * It did not. Practice lessons are constructed on demand rather than looked up
 * on the path, and `resolveLesson` returned a new object every call — so the
 * exercise set, which is memoised on the lesson and generated randomly, was
 * rebuilt on every render of the lesson screen. Answering caused a render.
 * The prompt and all four options were therefore replaced at the instant of
 * the tap, and the answer was graded against a question the learner had never
 * been shown. Every practice lesson in the app was unwinnable.
 *
 * That is not a thing to fix and hope about. This drives a real browser through
 * a lesson of every kind, on both tracks, and asserts that the prompt and the
 * options are byte-identical immediately before and immediately after the
 * answer is given. Anything that reintroduces a re-render into the generator
 * fails here.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:stability
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8145;
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
};

/**
 * CI bakes the deploy's base path (`/<repo-name>`) into the export before this
 * check runs, so index.html asks for `/Urdu/_expo/static/js/...`, not
 * `/_expo/static/js/...`. This server has no subpath — it serves `dist/`
 * straight from `/` — so the first, subpath-prefixed lookup always 404s and
 * fell back to index.html. The browser then tried to *execute* that HTML as
 * the script it had asked for: `SyntaxError: Unexpected token '<'`, on every
 * single request, which is why the very first navigation failed and nothing
 * downstream ever ran. Not hardcoding the repo name here — trying the request
 * both as given and with its first path segment stripped covers any base path
 * generically, without this script needing to know what that segment is.
 */
function resolveAsset(url) {
  const clean = decodeURIComponent(url.split('?')[0]);
  const direct = path.join(DIST, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;

  const parts = clean.split('/').filter(Boolean);
  if (parts.length > 1) {
    const stripped = path.join(DIST, ...parts.slice(1));
    if (fs.existsSync(stripped) && fs.statSync(stripped).isFile()) return stripped;
  }
  return path.join(DIST, 'index.html');
}

const server = http.createServer((req, res) => {
  const p = resolveAsset(req.url);
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

/** The part of the screen that is the question: everything above the feedback banner. */
async function questionText(page) {
  return page.evaluate(() => {
    const t = document.body.innerText;
    // cut at the feedback banner, which only exists after answering
    const cut = t.search(
      /Beautifully done|Not quite|Perfectly built|Exactly right|That is the shape|Flawless board|Solved with|From memory|The word is|Correct order/
    );
    return (
      (cut > 0 ? t.slice(0, cut) : t)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        // the transliteration under each option is revealed by answering, and the
        // speaker's hint likewise — those are meant to change
        .join(' | ')
    );
  });
}

/** Strip the parts that are *supposed* to appear once answered. */
const core = (s) =>
  s
    .replace(/Tap to hear[^|]*/g, 'Tap to hear')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (s) =>
  core(s)
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Answering is allowed to *add* to the screen — the transliteration appears
 * under each option, a hint appears under the speaker — but never to remove or
 * replace. So the question is stable exactly when everything that was on
 * screen before is still there afterwards, in the same order.
 *
 * A subsequence test rather than a prefix test, because the added text is
 * interleaved: "کتاب | نام" becomes "کتاب | kitaab | نام | naam".
 */
function isSubsequence(before, after) {
  let i = 0;
  for (const tok of after) {
    if (i < before.length && before[i] === tok) i++;
  }
  return i === before.length;
}

const problems = [];
const checked = [];

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const url = `http://localhost:${PORT}/`;

  async function seed(track) {
    await page.goto(url);
    await page.waitForTimeout(2200);
    const guest = page.locator('text=/CONTINUE AS A GUEST/i').first();
    if (await guest.count()) {
      await guest.click();
      await page.waitForTimeout(1600);
    }
    await page.evaluate(
      ([t]) => {
        const raw = JSON.parse(localStorage.getItem('harf-progress') || '{"state":{},"version":0}');
        raw.state = {
          ...raw.state,
          onboarded: true,
          goal: 'family',
          level: 0,
          hearts: 99,
          gems: 9000,
          totalXp: 400,
          streak: 2,
          completedLessons: { 'l-1': true },
          srs: {},
          srsType: {},
          dailyGoalId: 'steady',
          todayXp: 0,
        };
        localStorage.setItem('harf-progress', JSON.stringify(raw));
        localStorage.setItem(
          'harf-settings',
          JSON.stringify({
            state: { soundEnabled: false, hapticsEnabled: false, showRoman: true, reducedMotion: true, track: t },
            version: 0,
          })
        );
      },
      [track]
    );
    await page.goto(url);
    await page.waitForTimeout(2400);
  }

  /** Click the first answer-shaped control in the exercise body. */
  async function answerOnce() {
    const btns = page.locator('[role="button"]');
    const n = await btns.count();
    for (let k = 0; k < n; k++) {
      const b = await btns
        .nth(k)
        .boundingBox()
        .catch(() => null);
      if (b && b.y > 150 && b.y < 800 && b.width > 110 && b.height > 40) {
        await btns
          .nth(k)
          .click({ force: true })
          .catch(() => {});
        return true;
      }
    }
    return false;
  }

  /**
   * Tap the first match that is actually within the viewport.
   *
   * React Navigation keeps previous screens mounted, so the same label often
   * exists several times over — once on the screen in front of you and once on
   * a screen behind it. Clicking the hidden one silently does nothing, which
   * looks exactly like the app being broken.
   */
  async function tapOnScreen(selector) {
    const items = page.locator(selector);
    for (let k = 0; k < (await items.count()); k++) {
      const b = await items
        .nth(k)
        .boundingBox()
        .catch(() => null);
      if (b && b.y >= 0 && b.y < 880 && b.width > 0 && b.height > 0) {
        await items
          .nth(k)
          .click({ force: true })
          .catch(() => {});
        return true;
      }
    }
    return false;
  }

  /**
   * The Practice tab, by position rather than by text: "Practice" also appears
   * in section headings on screens that stay mounted behind the current one,
   * and clicking one of those does nothing.
   */
  async function openPracticeTab() {
    const items = page.locator('text=/^Practice$/');
    for (let k = 0; k < (await items.count()); k++) {
      const b = await items
        .nth(k)
        .boundingBox()
        .catch(() => null);
      if (b && b.y > 780) {
        await items.nth(k).click({ force: true });
        await page.waitForTimeout(1400);
        return true;
      }
    }
    return false;
  }

  async function advance() {
    const conts = page.locator('text=/CONTINUE/i');
    for (let k = 0; k < (await conts.count()); k++) {
      const b = await conts
        .nth(k)
        .boundingBox()
        .catch(() => null);
      // only the banner's CONTINUE, at the foot — the Learn screen stays mounted
      // behind the lesson and has its own "Continue" hero card
      if (b && b.y > 780) {
        await conts.nth(k).click({ force: true });
        await page.waitForTimeout(700);
        return true;
      }
    }
    return false;
  }

  /** Walk one lesson, checking the question does not move under the answer. */
  async function walk(label, steps) {
    for (let i = 0; i < steps; i++) {
      const t = await page.evaluate(() => document.body.innerText);
      if (/Out of hearts/.test(t)) {
        const r = page.locator('text=/REFILL/i').first();
        if (await r.count()) {
          await r.click({ force: true });
          await page.waitForTimeout(900);
        }
        continue;
      }
      if (/Lesson complete|You're done|Keep it warm/i.test(t)) break;

      // typing and drawing are not answered by tapping an option
      if (/Type this word/.test(t)) {
        const input = page.locator('input:visible').first();
        if (await input.count()) await input.fill('zzz').catch(() => {});
        await tapOnScreen('text=/^Check$/');
        await page.waitForTimeout(800);
        await advance();
        continue;
      }
      if (/draw over the grey letter|Got it/.test(t)) {
        if (await tapOnScreen('text=/^Got it$/')) {
          await page.waitForTimeout(700);
          await advance();
          continue;
        }
      }

      const before = await questionText(page);
      if (!(await answerOnce())) break;
      await page.waitForTimeout(700);
      const after = await questionText(page);

      const a = tokens(before);
      const b = tokens(after);
      checked.push(`${label} step ${i}`);
      if (!isSubsequence(a, b)) {
        problems.push(
          `${label} step ${i}: the question changed when it was answered\n` +
            `      before: ${a.join(' | ').slice(0, 160)}\n` +
            `      after : ${b.join(' | ').slice(0, 160)}`
        );
        return; // one report per lesson is enough
      }
      if (!(await advance())) break;
    }
  }

  // ---- path lessons, both tracks -----------------------------------------
  for (const track of ['both', 'roman']) {
    await seed(track);
    if (await tapOnScreen('text=/START HERE|Continue/i')) {
      await page.waitForTimeout(1800);
      await walk(`path lesson (${track})`, 12);
    }
  }

  // ---- practice lessons: the ones that were broken ------------------------
  await seed('both');
  await openPracticeTab();
  await page.waitForTimeout(1600);

  const practiceEntries = ['Around the Home', 'Food & Drink', 'Family', 'Daily Review'];
  for (const name of practiceEntries) {
    await openPracticeTab();
    await page.waitForTimeout(1200);
    if (!(await tapOnScreen(`text=/${name}/`))) continue;
    await page.waitForTimeout(2000);
    await walk(`practice · ${name}`, 8);
    await tapOnScreen('text=/✕/'); // leave the lesson
    await page.waitForTimeout(1400);
  }

  /**
   * Screens outside the lesson flow don't get walked above, but a bad
   * selector can crash one just as completely — Achievements did, with an
   * unstable Zustand selector rebuilding its snapshot on every render until
   * React gave up (error #185). Visiting them is cheap insurance against the
   * same shape of bug reappearing somewhere else that answering a question
   * would never reach.
   */
  await seed('both');
  await tapOnScreen('text=/^Profile$/');
  await page.waitForTimeout(1000);
  await tapOnScreen('text=/Achievements/');
  await page.waitForTimeout(1200);
  await tapOnScreen('text=/^Back$/');
  await page.waitForTimeout(800);
  await tapOnScreen('text=/League/');
  await page.waitForTimeout(1200);

  /**
   * URD-015: dismissing a notice card used to remove its whole card — 275px
   * of layout — in the same instant as the tap that dismissed it, so a
   * finger still settling from that tap could land on whatever had already
   * snapped into its place underneath. Seeds the profile straight into the
   * state that shows one specific notice, taps its dismiss button, and
   * checks whatever is at that exact screen point — not by label, by the
   * literal coordinates the finger is still over — immediately after the
   * tap and shortly after. A different control there is the bug; the same
   * fading control, or nothing tappable at all, is safe.
   *
   * A fresh page per call, not the `page` reused everywhere else above.
   * Reusing it once carried a live hydration race from the *previous*
   * call's dismissal into this one — the ticks-wiped scenario's own
   * persisted `ticksWipedByMigration: true` lost to a stale rehydration
   * and the *other* notice rendered instead, silently testing the wrong
   * card. Caught only by dumping the live DOM and the actual localStorage
   * value side by side after the fact — the reported "no problems found"
   * looked identical either way.
   */
  async function checkNoticeExit(label, extraState, dismissText) {
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });
    try {
      await checkNoticeExitOn(page, label, extraState, dismissText);
    } finally {
      await page.close();
    }
  }

  /**
   * The `page.evaluate` half of `seedNoticeProfile`, split out only so both
   * functions clear the house line-count limit — this one still runs
   * entirely inside the page, between the two `page.goto` calls around it.
   */
  function writeNoticeProfile(extra) {
    const raw = JSON.parse(localStorage.getItem('harf-progress') || '{"state":{},"version":0}');
    raw.state = {
      ...raw.state,
      onboarded: true,
      goal: 'family',
      level: 0,
      hearts: 99,
      gems: 9000,
      totalXp: 400,
      streak: 2,
      completedLessons: { 'l-1': true },
      /**
       * A due review card and the "next lesson" card both sit directly
       * below this notice, so at least one real, full-width Pressable is
       * guaranteed to be exactly where the notice's own content ends — the
       * same shape of thing ("start a lesson") the notice card displaced
       * in the original report. Without a due card here, the point this
       * check taps can land on a plain, non-interactive card instead
       * depending on incidental content height, which would make this
       * check pass on both the fixed *and* the broken code — true of an
       * earlier draft, caught only by deliberately breaking the fix and
       * watching this not notice.
       */
      srs: { 'w-check-stability': { id: 'w-check-stability', ease: 2.5, interval: 0, reps: 0, due: 1, lastSeen: 1 } },
      srsType: {},
      dailyGoalId: 'steady',
      todayXp: 0,
      pathNoticeSeen: false,
      pathSize: null,
      ticksWipedByMigration: false,
      ...extra,
    };
    raw.version = 3;
    localStorage.setItem('harf-progress', JSON.stringify(raw));
    localStorage.setItem(
      'harf-settings',
      JSON.stringify({
        state: { soundEnabled: false, hapticsEnabled: false, showRoman: true, reducedMotion: true, track: 'both' },
        version: 0,
      })
    );
  }

  /**
   * Signs in as a guest and seeds `harf-progress` straight into the state
   * that shows one specific notice, bypassing however many taps it would
   * otherwise take to get a real profile into that shape.
   */
  async function seedNoticeProfile(page, extra) {
    await page.goto(url);
    await page.waitForTimeout(2200);
    const guest = page.locator('text=/CONTINUE AS A GUEST/i').first();
    if (await guest.count()) {
      await guest.click();
      await page.waitForTimeout(1600);
    }
    await page.evaluate(writeNoticeProfile, extra);
    await page.goto(url);
    await page.waitForTimeout(2400);
  }

  async function checkNoticeExitOn(page, label, extraState, dismissText) {
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await seedNoticeProfile(page, extraState);

    const btn = page.locator(`text=/^${dismissText}$/`).first();
    if (!(await btn.count())) {
      problems.push(`${label}: the "${dismissText}" button never appeared — could not test its exit`);
      return;
    }
    const box = await btn.boundingBox();
    if (!box) {
      problems.push(`${label}: the "${dismissText}" button has no bounding box`);
      return;
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    /**
     * Whichever tappable control, if any, sits under this exact point right
     * now. `Button` (this dismiss control included) does not set an explicit
     * `accessibilityRole`, so react-native-web renders it as a plain `<div
     * tabindex="0">` rather than `role="button"` — confirmed by dumping the
     * live DOM at this exact point rather than assumed. `tabindex` is what
     * actually marks a Pressable here; role would silently match nothing and
     * make this whole check pass no matter what is underneath.
     */
    const labelAt = () =>
      page.evaluate(
        ([px, py]) => {
          const el = document.elementFromPoint(px, py);
          const tappable = el && el.closest ? el.closest('[tabindex]') : null;
          return tappable ? tappable.textContent.trim() : null;
        },
        [x, y]
      );

    await btn.click({ force: true });

    const immediate = await labelAt();
    await page.waitForTimeout(150);
    const settled = await labelAt();

    for (const [when, found] of [
      ['immediately after the tap', immediate],
      ['150ms after the tap', settled],
    ]) {
      if (found !== null && !found.includes(dismissText)) {
        problems.push(
          `${label}: ${when}, the released point belongs to "${found}" — a different control snapped in ` +
            `under the finger before the dismissed card finished leaving`
        );
        return;
      }
    }
    checked.push(`${label}: exit`);
  }

  /**
   * THE CRITIC, URD-015: a second tap on the dismiss button — the same
   * finger, not yet lifted, landing again before the exit finishes — used
   * to cancel the pending reduced-motion exit timer with nothing left to
   * reschedule it, so the "dismissed" card never actually left the screen.
   * `writeNoticeProfile` always seeds `reducedMotion: true`, which is
   * exactly the branch that broke. This taps twice in quick succession and
   * asserts the card is actually gone well after the exit window — the
   * pixel-safety check above only proves nothing wrong was tappable during
   * the fade, not that the fade itself ever finishes.
   */
  async function checkNoticeSurvivesDoubleTap(label, extraState, dismissText) {
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });
    try {
      page.on('pageerror', (e) => pageErrors.push(String(e)));
      await seedNoticeProfile(page, extraState);

      const btn = page.locator(`text=/^${dismissText}$/`).first();
      if (!(await btn.count())) {
        problems.push(`${label}: the "${dismissText}" button never appeared — could not test a double-tap`);
        return;
      }
      await btn.click({ force: true });
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);

      if (await page.locator(`text=/^${dismissText}$/`).count()) {
        problems.push(`${label}: a double-tap on "${dismissText}" left the card on screen well past its exit window`);
        return;
      }
      checked.push(`${label}: double-tap`);
    } finally {
      await page.close();
    }
  }

  const pathMovedSeed = { pathSize: 1, pathNoticeSeen: false, ticksWipedByMigration: false };
  await checkNoticeExit('path-moved notice', pathMovedSeed, 'Got it');
  await checkNoticeSurvivesDoubleTap('path-moved notice', pathMovedSeed, 'Got it');

  /**
   * `pathNoticeSeen: true` here matters: the base seed above otherwise also
   * satisfies the path-moved notice's own condition, so dismissing the
   * ticks-wiped card — correctly, by design — reveals that second, real
   * notice queued right behind it (URD-014's stacking fix). Its "Got it"
   * button lands close enough to the just-dismissed one that this check
   * mistook the new card for the old one still fading: a false pass, found
   * only by dumping the post-click page and seeing the *other* notice's
   * body text where "nothing tappable" was expected.
   */
  const ticksWipedSeed = { ticksWipedByMigration: true, pathNoticeSeen: true };
  await checkNoticeExit('ticks-wiped notice', ticksWipedSeed, 'Got it');
  await checkNoticeSurvivesDoubleTap('ticks-wiped notice', ticksWipedSeed, 'Got it');

  await browser.close();
  server.close();

  console.log(
    `checked ${checked.length} answered questions and notice dismissals across path and practice lessons, both tracks`
  );
  console.log('also visited: Profile, Achievements, League standings');
  if (pageErrors.length) {
    console.log(`\n${pageErrors.length} page errors — a screen crashed:`);
    pageErrors.slice(0, 5).forEach((e) => console.log('  •', e));
    process.exit(1);
  }
  if (problems.length) {
    console.log(`\n${problems.length} lessons where the question moved:`);
    problems.forEach((p) => console.log('  •', p));
    process.exit(1);
  }
  console.log('the question and its options stay put when answered');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
