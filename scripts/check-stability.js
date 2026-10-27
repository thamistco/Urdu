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

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { serveDist, findChromium, openTheDoor } = require('./lib/serve-dist');
const { glyphStrokes } = require('./lib/glyph-trace');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8145;

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

/**
 * The server, the asset resolution and the Chromium lookup all used to live in
 * this file. That copy predates `lib/serve-dist.js`, which was written
 * precisely because a per-script server is a per-script way to drift — and this
 * one had drifted twice.
 *
 * Its MIME table stopped at `.png`: no `.jpg`, `.svg`, `.woff` or
 * `.webmanifest`, so the evening backdrop went out as
 * `application/octet-stream`. That one turned out to be harmless and the
 * measurement is worth keeping, since the obvious guess was wrong — served
 * under the old table the picture still paints (`naturalWidth` 1080, complete),
 * because Chrome sniffs an `<img>` source rather than trusting the header. A
 * trap rather than a bug, and only for whatever this check is asked to look at
 * next.
 *
 * The second is a live difference. `CHROMIUM_PATH || '/opt/pw-browsers/chromium'`
 * has none of the directory scan `findChromium` does, so on a machine whose
 * Playwright build sits under a versioned folder — which is the layout
 * `findChromium` exists to handle — this check alone would fail to launch while
 * every other browser check ran.
 *
 * This file's own header still explains why `resolveAsset` has to try each
 * request twice: CI bakes the deploy's base path into the export, and the first
 * lookup always 404s. That reasoning lives in `lib/serve-dist.js` now, written
 * once, where every caller gets it.
 */

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

/**
 * Each exercise opens at its top. The lesson body is one scroll view for
 * the whole lesson, and every answer scrolls it to the end to show the
 * banner, so on a short phone the next exercise opened where the last one
 * finished: a letter card at 320x568 opened 261px down, with the letter it
 * teaches above the screen (design review, 2026-10-16). On the tall page
 * above nothing overflows, so this walks g-past at 320x568, answering
 * anything, and reads the scroll view each time the step counter moves.
 * Without the fix, steps 3, 4 and 5 opened 106, 116 and 32px down.
 *
 * Read twice: as the step opens, and 300ms later. A grammar card's timer
 * for its next block could fire on the exercise after it and glide that one
 * to its foot (0px, then 57, 89, 96 within 200ms), so a single early read
 * caught it one run in five, as about 20px, and passed the rest.
 */
async function checkExerciseOpensAtTop(browser, url) {
  const short = await browser.newPage({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 1 });
  await short.goto(url);
  await openTheDoor(short);
  await short.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('qaaf-progress') || '{"state":{},"version":0}');
    raw.state = { ...raw.state, onboarded: true, goal: 'family', level: 0, hearts: 99, completedLessons: {} };
    localStorage.setItem('qaaf-progress', JSON.stringify(raw));
    localStorage.setItem(
      'qaaf-settings',
      JSON.stringify({ state: { soundEnabled: false, reducedMotion: true, track: 'both' }, version: 0 })
    );
  });
  await short.goto(await lessonUrl(short, 'g-past'));
  await short.waitForFunction(() => /\d+ of \d+/.test(document.body.innerText), null, { timeout: 20000 });
  let last = null;
  let measured = 0;
  for (let i = 0; i < 14 && measured < 3; i++) {
    const w = await whereInLesson(short);
    if (!w.step) break;
    if (last != null && w.step !== last && w.top != null) {
      measured++;
      await short.waitForTimeout(300);
      const later = await whereInLesson(short);
      if (later.step === w.step && later.top != null) w.top = Math.max(w.top, later.top);
      if (w.top > 4) {
        problems.push(
          `At 320x568, step ${w.step} of g-past opened scrolled ${Math.round(w.top)}px down: ` +
            `the top of the exercise, its question, was above the screen.`
        );
        break;
      }
    }
    last = w.step;
    await stepAnyhow(short);
  }
  if (measured < 2) {
    problems.push(
      `Only ${measured} of g-past's exercises overflowed at 320x568 and were measured, so where an exercise opens was not tested.`
    );
  }
  await short.close();
}

/** A lesson opened for a learner past onboarding, at `w`x`h`. */
async function openLesson(browser, url, id, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(url);
  await openTheDoor(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('qaaf-progress') || '{"state":{},"version":0}');
    raw.state = { ...raw.state, onboarded: true, goal: 'family', level: 0, hearts: 99, completedLessons: {} };
    localStorage.setItem('qaaf-progress', JSON.stringify(raw));
  });
  await page.goto(await lessonUrl(page, id));
  await page.waitForFunction(() => /\d+ of \d+/.test(document.body.innerText), null, { timeout: 20000 });
  return page;
}

/** Answer anything until the matching board is on screen; false if it never comes. */
async function walkToBoard(page) {
  for (let i = 0; i < 70; i++) {
    if (await page.getByText(/^Match each word to its meaning$/).count()) return true;
    const input = page.locator('input:visible, textarea:visible');
    if (await input.count()) await input.first().fill('x');
    // Building a word: tap each letter tile once, in any order.
    await page.evaluate(() =>
      [...document.querySelectorAll('[role="button"]')]
        .filter((n) => {
          const t = (n.textContent || '').replace(/\u200f/g, '').trim();
          return (
            n.getAttribute('aria-disabled') !== 'true' &&
            t.length >= 1 &&
            t.length <= 2 &&
            !/[←✕]/.test(t) &&
            n.getBoundingClientRect().y > 80
          );
        })
        .forEach((n) => n.click())
    );
    await stepAnyhow(page);
  }
  return false;
}

/** The board's answer tiles still open, left column (the words) or right (the meanings). */
function openTiles(page, side) {
  return page.evaluate((side) => {
    const all = [...document.querySelectorAll('[role="button"]')].filter((n) => {
      const r = n.getBoundingClientRect();
      return n.getAttribute('aria-disabled') !== 'true' && r.width > 100 && r.height > 40 && r.y > 80;
    });
    const mid = innerWidth / 2;
    return all.filter((n) => n.getBoundingClientRect().x < mid === (side === 'left')).length;
  }, side);
}

/** Focus the `i`th open tile on `side` and press Space, as a keyboard user does. */
async function pressTile(page, side, i) {
  await page.evaluate(
    ({ side, i }) => {
      const mid = innerWidth / 2;
      const tiles = [...document.querySelectorAll('[role="button"]')].filter((n) => {
        const r = n.getBoundingClientRect();
        return n.getAttribute('aria-disabled') !== 'true' && r.width > 100 && r.height > 40 && r.y > 80;
      });
      tiles.filter((n) => n.getBoundingClientRect().x < mid === (side === 'left'))[i]?.focus();
    },
    { side, i }
  );
  await page.keyboard.press('Space');
}

/** Make one pair on the board by keyboard: the first word against each meaning in turn. */
async function pairOnce(page) {
  const rights = await openTiles(page, 'right');
  let paired = false;
  for (let j = 0; j < rights && !paired; j++) {
    await pressTile(page, 'left', 0);
    const before = await openTiles(page, 'right');
    await pressTile(page, 'right', j);
    paired = await page
      .waitForFunction(
        (n) => {
          const mid = innerWidth / 2;
          return (
            [...document.querySelectorAll('[role="button"]')].filter((x) => {
              const r = x.getBoundingClientRect();
              return x.getAttribute('aria-disabled') !== 'true' && r.width > 100 && r.y > 80 && r.x >= mid;
            }).length < n
          );
        },
        before,
        { timeout: 800 }
      )
      .then(
        () => true,
        () => false
      );
    // A wrong pair stays marked for a moment and takes no taps until it clears.
    if (!paired) {
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll('[data-testid="choice-verdict"]')].some((n) =>
            /your answer/.test(n.textContent)
          ),
        null,
        { timeout: 4000 }
      );
    }
  }
  return paired;
}

/** Whether the "sound didn't load" notice appears within `ms`. */
function soundNoticeWithin(page, ms) {
  return page
    .waitForFunction(() => /The sound didn’t load/.test(document.body.innerText), null, { timeout: ms })
    .then(
      () => true,
      () => false
    );
}

/**
 * A clip that cannot load says so, offline and only offline.
 *
 * Offline, "Hear alif" played nothing and said nothing, and the speaker
 * looked the same (performance review, 2026-10-21). Now a short notice says
 * the sound did not load. It must not cry wolf: online, a first card whose
 * clip a browser declines to autoplay showed it too, so it is gated on the
 * device being offline. Against the build before the notice this reports it
 * missing.
 */
async function checkSoundSaysWhenOffline(browser, url) {
  const page = await openLesson(browser, url, 'l-1', 390, 844);
  if (await soundNoticeWithin(page, 2500))
    problems.push('Online, "The sound didn’t load" showed on l-1 with nothing wrong.');
  await page.context().setOffline(true);
  await page.locator('[aria-label^="Hear"]').first().click();
  if (!(await soundNoticeWithin(page, 4000))) {
    problems.push('Offline, tapping "Hear" on l-1 played nothing and said nothing.');
  }
  await page.close();
}

/** Trace the letter on screen from a picture of it, as the playtest does; false if there is no pad. */
async function traceOnScreen(page) {
  const pad = page.locator('[aria-label^="Drawing area"]').first();
  const box = (await pad.count()) ? await pad.boundingBox() : null;
  if (!box) return false;
  const { PNG } = require('pngjs');
  const area = { x: box.x + 4, y: box.y + 4, width: box.width - 8, height: box.height - 8 };
  const png = PNG.sync.read(await page.screenshot({ clip: area, scale: 'css' }));
  const scale = png.width / area.width;
  for (const walk of (glyphStrokes(png) || []).filter((w) => w.length)) {
    await page.mouse.move(area.x + walk[0].x / scale, area.y + walk[0].y / scale);
    await page.mouse.down();
    for (const q of walk) await page.mouse.move(area.x + q.x / scale, area.y + q.y / scale);
    await page.mouse.up();
  }
  return true;
}

/**
 * A question whose answers run under the fold says so.
 *
 * "More below" was on teaching cards only, so at 320x568 l-1's "Which
 * position is this letter showing?" put Middle and End, one of them the
 * answer, at 547px with nothing to say there was more (QA, 2026-10-19,
 * Q-075). This walks l-1 to that question and requires the cue whenever an
 * answer ends under the screen. Against the build before the fix it reports
 * the missing cue.
 */
async function checkQuestionSaysMoreBelow(browser, url) {
  const page = await openLesson(browser, url, 'l-1', 320, 568);
  // The script track: on the default one the Roman under each answer is gone
  // with the letters' names, and the four answers fit.
  await page.evaluate(() =>
    localStorage.setItem(
      'qaaf-settings',
      JSON.stringify({ state: { soundEnabled: false, reducedMotion: true, track: 'script' }, version: 0 })
    )
  );
  await page.reload();
  await page.waitForFunction(() => /\d+ of \d+/.test(document.body.innerText), null, { timeout: 20000 });
  let found = false;
  for (let i = 0; i < 12 && !found; i++) {
    if (await page.getByText(/^Which position is this letter showing\?$/).count()) {
      found = true;
      break;
    }
    if (await page.getByText(/^Draw over the grey letter$/).count()) await traceOnScreen(page);
    await stepAnyhow(page);
  }
  if (!found) {
    problems.push('l-1 never reached its position question at 320x568, so "More below" on questions was not tested.');
    return page.close();
  }
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 5000 }).catch(() => {});
  const r = await page.evaluate(async () => {
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    const below = [...document.querySelectorAll('[role="button"]')].some(
      (n) => /^(Middle|End)/.test((n.textContent || '').trim()) && n.getBoundingClientRect().bottom > innerHeight
    );
    return { below, cue: !!document.querySelector('[aria-label^="More below"]') };
  });
  if (r.below && !r.cue)
    problems.push('At 320x568 l-1\'s position question has answers under the fold and no "More below".');
  await page.close();
}

/**
 * A passed trace in a lesson is praised once, by the banner.
 *
 * The pad said "That is the shape ✓" and "Nicely done.", then the banner
 * "Beautifully done": three lines for one trace (Q-078). This traces l-1's
 * first letter and fails if the pad still praises it once the banner is up.
 */
async function checkTracePraisedOnce(browser, url) {
  const page = await openLesson(browser, url, 'l-1', 390, 844);
  for (let i = 0; i < 4 && !(await page.getByText(/^Draw over the grey letter$/).count()); i++) await stepAnyhow(page);
  if (!(await traceOnScreen(page))) {
    problems.push('l-1 showed no tracing pad, so praise after a trace was not tested.');
    return page.close();
  }
  await page
    .getByText(/^Check$/)
    .last()
    .click({ force: true });
  const verdict = await spokenVerdictOf(page);
  if (/^Beautifully done/.test(verdict || '') && (await page.getByText(/^That is the shape/).count())) {
    problems.push('A passed trace is praised twice: the pad says "That is the shape" under the banner.');
  }
  await page.close();
}

/**
 * A matched pair leaves focus on the board.
 *
 * Matching disables both tiles of a pair, the focused one with them, so the
 * browser dropped focus to the page after every pair but the last: a keyboard
 * user's next Tab started again at the close button (QA, 2026-10-20). This
 * walks v-road-p2 to its board, makes one pair by keyboard, and requires focus
 * on a live control. Against the build before the fix it reports the page.
 */
async function checkMatchingKeepsFocus(browser, url) {
  const page = await openLesson(browser, url, 'v-road-p2', 390, 844);
  if (!(await walkToBoard(page))) {
    problems.push('v-road-p2 never reached its matching board, so focus after a pair was not tested.');
    return page.close();
  }
  const paired = await pairOnce(page);
  if (!paired) problems.push("No pair was made on v-road-p2's board, so focus after a pair was not tested.");
  else if (!(await focusKept(page))) {
    problems.push('After a pair matched by keyboard, focus fell to the page: the next Tab starts from the top.');
  }
  await page.close();
}

/**
 * Answer the question on screen any way at all, varying the tile with `i` so
 * a run never taps the right one every time, and return what was announced.
 * The first version always took the last tile and gave up after eight steps,
 * and one local run in three never got a wrong answer (2026-10-21).
 */
async function answerSomehow(page, i) {
  const input = page.locator('input:visible, textarea:visible');
  if (await input.count()) {
    await input.first().fill('xq');
    await input.first().press('Enter');
  } else {
    await page.evaluate((i) => {
      const tiles = [...document.querySelectorAll('[role="button"]')].filter((n) => {
        const r = n.getBoundingClientRect();
        return (
          n.getAttribute('aria-disabled') !== 'true' &&
          !/^(Check|Continue|Finish)$/i.test((n.textContent || '').trim()) &&
          r.width > 100 &&
          r.height > 40 &&
          r.y > 80
        );
      });
      tiles[i % Math.max(tiles.length, 1)]?.click();
    }, i);
    const check = page.getByText(/^Check$/);
    if (await check.count())
      await check
        .last()
        .click({ force: true })
        .catch(() => {});
  }
  return spokenVerdictOf(page);
}

/**
 * A wrong answer's banner at 200% text keeps Continue on a small screen.
 *
 * Its spacing was in rem and doubled with the text, so at 320x568 the banner
 * ran 37px past the screen with Continue cut off, 69px for a short sentence
 * (design review, 2026-10-20, Q-070). This answers v-first-words until one
 * answer is wrong, at a 32px root font, and requires Continue to end on the
 * screen once the banner has settled. In landscape the banner outgrew the
 * window and nothing scrolled to Continue (QA, 2026-10-21), so it runs there
 * too.
 */
async function checkWrongBannerFits(browser, url, w, h) {
  const page = await openLesson(browser, url, 'v-first-words', w, h);
  await page.evaluate(() => (document.documentElement.style.fontSize = '32px'));
  let verdict = null;
  for (let i = 0; i < 20 && !/^Not quite/.test(verdict || ''); i++) {
    if (verdict) {
      const before = await page.evaluate(() => document.body.innerText);
      await page
        .getByText(/^Continue$/)
        .last()
        .click({ force: true });
      await changed(page, before);
    }
    if (await page.getByText(/^Got it$/).count()) {
      await stepAnyhow(page);
      verdict = null;
      continue;
    }
    verdict = await answerSomehow(page, i);
  }
  if (!/^Not quite/.test(verdict || '')) {
    problems.push(
      `No wrong answer was reached in v-first-words at ${w}x${h}, so the banner at 200% text was not measured.`
    );
    return page.close();
  }
  const badge = await freeBadge(page);
  if (badge && badge.clipped) {
    problems.push(`At 200% text on ${w}x${h} the hearts badge is cut off: "${badge.text}" in ${badge.width}px.`);
  }
  const bottom = await settledBottom(page, /^(Continue|Finish)$/);
  const answer = await answerScroll(page);
  if (answer.clipped && !answer.cued) {
    problems.push(
      `At 200% text on ${w}x${h} the answer runs ${answer.hidden}px past its box inside the banner with no "More below".`
    );
  }
  if (bottom > h) {
    problems.push(
      `At 200% text on ${w}x${h}, a wrong answer's Continue ends at ${Math.round(bottom)}px, off the screen.`
    );
  }
  await page.close();
}

/**
 * The free-hearts badge's words and whether they are cut off. At 200% text on
 * a 320px phone the full rule needs 265px and had 96, and read "Fre…"
 * (design review, 2026-10-19, Q-072).
 */
function freeBadge(page) {
  return page.evaluate(() => {
    const n = [...document.querySelectorAll('div')].find(
      (d) => !d.children.length && /^Free( until Unit 1 is done)?$/.test((d.textContent || '').trim())
    );
    if (!n) return null;
    return { text: n.textContent.trim(), width: n.clientWidth, clipped: n.scrollWidth > n.clientWidth + 1 };
  });
}

/**
 * Whether the answer scrolls inside the banner, and whether anything says so.
 * At 200% text in landscape only the answer card's top showed and nothing said
 * there was more (QA, 2026-10-21, Q-082).
 */
function answerScroll(page) {
  return page.evaluate(() => {
    const box = [...document.querySelectorAll('div')].find(
      (n) =>
        /auto|scroll/.test(getComputedStyle(n).overflowY) &&
        /the answer/i.test(n.textContent || '') &&
        n.getBoundingClientRect().height < innerHeight * 0.8
    );
    const hidden = box ? box.scrollHeight - box.clientHeight - box.scrollTop : 0;
    const cued = [...document.querySelectorAll('[role="button"]')].some((n) =>
      /^More below/.test(n.getAttribute('aria-label') || '')
    );
    return { clipped: hidden > 24, hidden: Math.round(hidden), cued };
  });
}

/** The bottom of the last element reading `label`, once it stops moving (the banner slides in). */
async function settledBottom(page, label) {
  let last = null;
  for (let i = 0; i < 20; i++) {
    const b = await page.evaluate((src) => {
      const re = new RegExp(src);
      const n = [...document.querySelectorAll('[role="button"]')]
        .filter((x) => re.test((x.textContent || '').trim()))
        .pop();
      return n ? n.getBoundingClientRect().bottom : null;
    }, label.source);
    if (b != null && b === last) return b;
    last = b;
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  }
  return last ?? Infinity;
}

/**
 * An answer given by keyboard is heard, and leaves focus somewhere.
 *
 * The banner said right or wrong only on screen. Nothing announced it, and
 * the tile that had focus was disabled by the answer, so focus fell to the
 * page: a screen-reader user heard nothing and a keyboard user's next Tab
 * started again from the top (design review, 2026-10-19). This answers
 * v-first-words' first question with Enter and requires a polite live region
 * that names the verdict, and focus not on the page itself. Run against the
 * build before the fix it reports both.
 */
async function checkVerdictIsHeard(browser, url) {
  const page = await openLesson(browser, url, 'v-first-words', 390, 844);
  const focused = await page.evaluate(() => {
    const tile = [...document.querySelectorAll('[role="button"]')].find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 100 && r.height > 40 && r.y > 80;
    });
    tile?.focus();
    return !!tile && document.activeElement === tile;
  });
  if (!focused) {
    problems.push('v-first-words opened with no answer tile to focus, so the spoken verdict was not tested.');
    return page.close();
  }
  await page.keyboard.press('Enter');
  const heard = await spokenVerdictOf(page);
  if (!heard) problems.push('An answer given by keyboard was not announced: no polite live region named the verdict.');
  else if (/^Not quite/.test(heard) && !/The answer: \S/.test(heard)) {
    problems.push(`A wrong answer was announced without the answer: "${heard}".`);
  }
  const kept = await focusKept(page);
  if (!kept) {
    problems.push('After an answer given by keyboard, focus fell to the page: the next Tab starts from the top.');
  }
  await page.close();
}

/** The verdict a polite live region says, once one does; null after three seconds. */
function spokenVerdictOf(page) {
  return page
    .waitForFunction(
      () =>
        [...document.querySelectorAll('[aria-live="polite"]')]
          .map((n) => n.textContent.trim())
          .find((t) => /^(Beautifully done|Not quite)/.test(t)),
      null,
      { timeout: 3000 }
    )
    .then((h) => h.jsonValue())
    .catch(() => null);
}

/**
 * Whether focus settles on something live: not the page, and not the tile
 * just disabled, which keeps focus for a moment before the browser drops it.
 * The app moves focus two frames after the answer, once the banner is on the
 * page, so this waits for it rather than reading it at once.
 */
function focusKept(page) {
  return page
    .waitForFunction(
      () => {
        const a = document.activeElement;
        return !!a && a !== document.body && !a.matches('[aria-disabled="true"], :disabled');
      },
      null,
      { timeout: 1500 }
    )
    .then(
      () => true,
      () => false
    );
}

/** The step counter, and the lesson body's scroll position if it overflows. */
function whereInLesson(page) {
  // Two frames first: the app puts a new exercise at its top on the frame
  // after it opens, to beat a glide still running from the answer before.
  return page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const step = (document.body.innerText.match(/(\d+) of \d+/) || [])[1];
    const body = [...document.querySelectorAll('*')].find((n) => {
      const r = n.getBoundingClientRect();
      return (
        n.scrollHeight > n.clientHeight + 4 &&
        /auto|scroll/.test(getComputedStyle(n).overflowY) &&
        r.width > 200 &&
        r.height > 200
      );
    });
    return { step, top: body ? body.scrollTop : null };
  });
}

/** Get past one step any way at all: "Got it", or the first answer and Continue. */
async function stepAnyhow(page) {
  const got = page.getByText(/^Got it$/);
  if (await got.count()) {
    await got.first().evaluate((el) => el.scrollIntoView({ block: 'end' }));
    const before = await page.evaluate(() => document.body.innerText);
    await got.first().click({ force: true });
    await changed(page, before);
    return;
  }
  const before = await page.evaluate(() => document.body.innerText);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('[role="button"]')].find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 100 && r.height > 40 && r.y > 80;
    });
    if (b) {
      b.scrollIntoView({ block: 'center' });
      b.click();
    }
  });
  await changed(page, before);
  for (const label of [/^(Continue|Check)$/i, /^Continue$/i]) {
    const c = page.getByText(label);
    if (await c.count()) {
      const was = await page.evaluate(() => document.body.innerText);
      await c
        .last()
        .click({ force: true })
        .catch(() => {});
      await changed(page, was);
    }
  }
}

/**
 * A lesson's own address on the page's server, under the base path the build
 * was made for: a deploy-shaped build lives at /Urdu/, and a link without it
 * lands on Home.
 */
function lessonUrl(page, id) {
  return page.evaluate((lesson) => {
    const base = document.querySelector('meta[name="qaaf:base"]')?.getAttribute('content') || '';
    return `${location.origin}${base}/lesson/${lesson}`;
  }, id);
}

/** Until the screen's text differs from `before`, or three seconds pass: some taps change nothing. */
function changed(page, before) {
  return page
    .waitForFunction((b) => document.body.innerText !== b, before, { timeout: 3000, polling: 100 })
    .catch(() => {});
}

/** A fresh learner's first lesson, opened on its first letter card at `w`x`h`. */
async function firstLetterCard(browser, url, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(url);
  await openTheDoor(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('qaaf-progress') || '{"state":{},"version":0}');
    raw.state = { ...raw.state, onboarded: true, goal: 'family', level: 0, hearts: 99, completedLessons: {} };
    localStorage.setItem('qaaf-progress', JSON.stringify(raw));
  });
  await page.goto(await lessonUrl(page, 'l-1'));
  await page.waitForFunction(() => /A new letter/i.test(document.body.innerText), null, { timeout: 20000 });
  return page;
}

const CUE = 'More below, show the rest of the card';

/** Whether the cue comes up within three seconds. */
function cueShown(page) {
  return page
    .getByLabel(CUE)
    .waitFor({ timeout: 3000 })
    .then(
      () => true,
      () => false
    );
}

/** Tap the cue: it must go, with the end of the card in view. */
async function cueTakesYouDown(page, where) {
  await page.getByLabel(CUE).click();
  const gone = await page
    .getByLabel(CUE)
    .waitFor({ state: 'detached', timeout: 3000 })
    .then(
      () => true,
      () => false
    );
  const left = await page.evaluate(() => {
    const b = [...document.querySelectorAll('*')].find(
      (n) => n.scrollHeight > n.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(n).overflowY)
    );
    return b ? b.scrollHeight - b.clientHeight - b.scrollTop : 0;
  });
  if (!gone || left > 24) {
    problems.push(
      `${where}, "More below" ${gone ? '' : 'stayed after it was tapped and '}left ${Math.round(left)}px unseen.`
    );
  }
}

/**
 * From l-1's first card to its third: "Got it", then alif traced as the one
 * stroke it is, Check and Continue. Whether the trace is accepted does not
 * matter; reaching the next card does.
 */
async function toThirdCard(page) {
  const got = page.getByText(/^Got it$/).first();
  await got.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await got.click({ force: true });
  const pad = page.locator('[aria-label^="Drawing area"]').first();
  await pad.waitFor({ timeout: 5000 });
  const b = await pad.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.2);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(b.x + b.width / 2, b.y + b.height * (0.2 + (0.6 * k) / 12));
  await page.mouse.up();
  for (const label of [/^Check$/i, /^Continue$/i, /^Continue$/i]) {
    const c = page.getByText(label);
    if (await c.count())
      await c
        .last()
        .click({ force: true })
        .catch(() => {});
    if (await page.getByText(/^3 of \d+$/).count()) break;
  }
  return page
    .getByText(/^3 of \d+$/)
    .waitFor({ timeout: 5000 })
    .then(
      () => true,
      () => false
    );
}

/**
 * "More below" on a teaching card that runs past the screen (P-076). At
 * 320x568 l-1's first letter card runs 225px past the fold: the cue must be
 * there when it opens, take the learner to the end, and then stay gone. Its
 * third card runs past too, and is checked as well: the first version
 * measured each card against the exercise before it and never showed the
 * cue after a lesson's first, and a check that opened only the first card
 * passed it (second check, 2026-10-16). At 412x900 the card fits and there
 * must be no cue at all.
 */
async function checkMoreBelow(browser, url) {
  const tall = await firstLetterCard(browser, url, 412, 900);
  if (await cueShown(tall)) problems.push('At 412x900 the first letter card fits, yet shows "More below".');
  await tall.close();

  const page = await firstLetterCard(browser, url, 320, 568);
  if (!(await cueShown(page))) {
    problems.push('At 320x568 the first letter card runs past the screen with no "More below".');
  } else {
    await cueTakesYouDown(page, 'At 320x568 on the first letter card');
  }
  if (!(await toThirdCard(page))) {
    problems.push(
      "Could not reach l-1's third card at 320x568, so the cue after a lesson's first card was not checked."
    );
  } else if (!(await cueShown(page))) {
    problems.push('At 320x568 the third letter card of l-1 runs past the screen with no "More below".');
  } else {
    await cueTakesYouDown(page, 'At 320x568 on the third letter card');
  }
  await page.close();
}

(async () => {
  const server = await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: findChromium() || undefined });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const url = `http://localhost:${PORT}/`;

  async function seed(track) {
    await page.goto(url);
    await page.waitForTimeout(2200);
    await openTheDoor(page);
    await page.evaluate(
      ([t]) => {
        const raw = JSON.parse(localStorage.getItem('qaaf-progress') || '{"state":{},"version":0}');
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
        localStorage.setItem('qaaf-progress', JSON.stringify(raw));
        localStorage.setItem(
          'qaaf-settings',
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
   * The Practice tab, by position rather than by text: its label also appears
   * in section headings on screens that stay mounted behind the current one,
   * and clicking one of those does nothing. The tab is labelled "Review"; the
   * route behind it is still Practice.
   */
  async function openPracticeTab() {
    const items = page.locator('text=/^Review$/');
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
      if (/Type the Urdu for this/.test(t)) {
        const input = page.locator('input:visible').first();
        if (await input.count()) await input.fill('zzz').catch(() => {});
        await tapOnScreen('text=/^Check$/');
        await page.waitForTimeout(800);
        await advance();
        continue;
      }
      // Case-insensitive because this reads `innerText`, which applies the
      // button's `uppercase` transform and hands back "GOT IT". The selector
      // below matches the untransformed text, so it worked while this test did
      // not, and teaching cards quietly fell through to the answer path
      // instead. That was invisible for as long as acknowledging a card left
      // the card on screen; the moment "Got it" started advancing the lesson
      // — which is what a card that cannot be got wrong should do — this
      // reported the question as having been replaced under the learner.
      //
      // A teaching card is not a question and has never been graded, so it is
      // outside what this check is about. The check is not being relaxed: the
      // branch that was always meant to catch these now actually catches them.
      if (/draw over the grey letter|got it/i.test(t)) {
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
  // A tab that cannot be found is a failure, not a skip. This used to ignore
  // the result, so when the tab's label changed from "Practice" to "Review"
  // the old matcher found nothing, the whole practice half was skipped, and
  // the check still passed: 9 questions checked instead of 24.
  if (!(await openPracticeTab())) {
    problems.push(
      'Could not find the Practice tab (labelled "Review") in the tab bar, so no practice lesson was checked.'
    );
  }
  await page.waitForTimeout(1600);

  const practiceEntries = ['Around the Home', 'Food & Drink', 'Family', 'Daily Review'];
  for (const name of practiceEntries) {
    await openPracticeTab();
    await page.waitForTimeout(1200);
    if (!(await tapOnScreen(`text=/${name}/`))) continue;
    await page.waitForTimeout(2000);
    await walk(`practice · ${name}`, 8);
    // Leaving part way through asks first, in the app's own dialog; this
    // walk means to leave.
    await tapOnScreen('text=/✕/'); // leave the lesson
    const leave = page.locator('[role="alertdialog"]').getByText(/^Leave$/);
    if (
      await leave.waitFor({ timeout: 2000 }).then(
        () => true,
        () => false
      )
    )
      await leave.click();
    await page.waitForTimeout(1400);
  }

  await checkExerciseOpensAtTop(browser, url);
  await checkMoreBelow(browser, url);
  await checkVerdictIsHeard(browser, url);
  // Portrait, and landscape, where the banner outgrew the window (QA, 2026-10-21).
  await checkWrongBannerFits(browser, url, 320, 568);
  await checkWrongBannerFits(browser, url, 844, 390);
  await checkMatchingKeepsFocus(browser, url);
  await checkSoundSaysWhenOffline(browser, url);
  await checkQuestionSaysMoreBelow(browser, url);
  await checkTracePraisedOnce(browser, url);

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
   * call's dismissal into this one: the seeded profile lost to a stale
   * rehydration and the notice never rendered, silently testing an empty
   * screen. Caught only by dumping the live DOM and the actual localStorage
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
    const raw = JSON.parse(localStorage.getItem('qaaf-progress') || '{"state":{},"version":0}');
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
      ...extra,
    };
    // The stores carry no persist version (see useProgressStore.ts), so this
    // blob must not either — zustand discards a state whose stored version
    // does not match, and a seed that is silently thrown away would make every
    // check below pass against a profile that never loaded.
    raw.version = 0;
    localStorage.setItem('qaaf-progress', JSON.stringify(raw));
    localStorage.setItem(
      'qaaf-settings',
      JSON.stringify({
        state: { soundEnabled: false, hapticsEnabled: false, showRoman: true, reducedMotion: true, track: 'both' },
        version: 0,
      })
    );
  }

  /**
   * Signs in as a guest and seeds `qaaf-progress` straight into the state
   * that shows one specific notice, bypassing however many taps it would
   * otherwise take to get a real profile into that shape.
   */
  async function seedNoticeProfile(page, extra) {
    await page.goto(url);
    await page.waitForTimeout(2200);
    await openTheDoor(page);
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

  const pathMovedSeed = { pathSize: 1, pathNoticeSeen: false };
  await checkNoticeExit('path-moved notice', pathMovedSeed, 'Got it');
  await checkNoticeSurvivesDoubleTap('path-moved notice', pathMovedSeed, 'Got it');

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
