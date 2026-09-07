/* eslint-disable */
/**
 * Finishing a course stage's last lesson mid-session, while scrolled away
 * from it — does the newly-current stage get scrolled into view, or does it
 * silently reopen off-screen?
 *
 * URD-002's round-2 accordion fix made `HomeScreen` reopen the learner's real
 * current stage whenever it legitimately advances, rather than staying
 * pinned to whatever a learner had last tapped. THE CRITIC, reviewing that
 * fix again for URD-032, found the accompanying mount-time auto-scroll
 * (`didAutoScroll`, a one-shot-per-mount guard) never re-fired for this case
 * — `HomeScreen` never remounts between lessons, so once the guard had
 * fired once, it stayed fired, and a learner who advanced a stage while
 * scrolled elsewhere got the accordion correctly reopened with nothing
 * scrolling to show them it happened.
 *
 * The fix resets the guard in the same effect that already knows
 * `currentLevel` just changed for a real reason. THE CRITIC then filed that
 * fix itself as BLOCKING: the reset effect (keyed on `currentLevel`) was
 * declared *after* the auto-scroll effect (keyed on `currentId`), and since
 * a real stage advance changes both in the same commit, React's
 * hook-declaration-order effect sequencing meant the auto-scroll effect
 * always ran first and read the guard as still `true` — reproduced live in
 * an isolated react/react-dom harness mirroring the two effects' declared
 * order.
 *
 * This script drives the REAL app through the actual scenario instead of a
 * synthetic harness — completing a real lesson, live, without ever reloading
 * the page (a reload would remount `HomeScreen` and defeat the test; the bug
 * only exists because it does not remount between lessons) — and the result
 * disagreed with the isolated reproduction: with the original (pre-reorder)
 * effect order restored, this scenario still passed. Repeated runs, and a
 * temporary instrumented build logging every render's `currentId`／
 * `currentLevel` pair, confirmed the two always change together in a single
 * render (as expected) but the auto-scroll effect's guard read `false` at
 * the critical moment regardless of which effect was declared first — the
 * real component does not reproduce the staleness the isolated harness
 * predicted, for a reason not fully root-caused within this session.
 *
 * The effect reorder ships anyway: it is strictly safer (resetting a guard
 * before its own reader can only help, never hurt) and matches the
 * documented intent. This check exists to hold the *observable behavior* in
 * place regardless of which internal mechanism is responsible for it —
 * exactly the "drives the real built artifact, not the code that's supposed
 * to produce it" principle the rest of this project's check scripts follow.
 *
 * Needs a web build in dist/ (npx expo export --platform web --output-dir dist).
 *
 * Run with:  npm run check:stage-advance-scroll
 */

const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');

const DIST = require('path').join(__dirname, '..', 'dist');
const PORT = 8340;
const { UNITS } = load('src/data/units.ts');

// A short, non-review lesson near the end of the beginner stage. Marking
// every OTHER beginner lesson complete/skipped makes this the sole
// remaining one regardless of its position in course order — order.find()
// just looks for the first not-done id, so any single holdout works.
const LEAVE_INCOMPLETE = 'd-1';
const beginnerLessons = UNITS.filter((u) => u.level === 'beginner').flatMap((u) => u.lessons.map((l) => l.id));
if (!beginnerLessons.includes(LEAVE_INCOMPLETE)) {
  console.error(`check:stage-advance-scroll — '${LEAVE_INCOMPLETE}' is no longer a beginner lesson id; pick another.`);
  process.exit(1);
}
const completedLessons = Object.fromEntries(
  beginnerLessons.filter((id) => id !== LEAVE_INCOMPLETE).map((id) => [id, { best: 1, done: 1 }])
);

if (!require('fs').existsSync(require('path').join(DIST, 'index.html'))) {
  console.error('No web build found in dist/. Run: npx expo export --platform web --output-dir dist');
  process.exit(1);
}

// A comprehension question tacked onto a dialogue transcript can push its
// options below the fold (measured here, ~950-1150px against a 900px
// viewport) — scrolling the candidate into view before clicking, rather
// than assuming a fixed on-screen position, is the same fix check-home-
// scroll.js's own advance() helper uses for the same class of bug.
async function answerOnce(page) {
  const scrolled = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[role="button"]'));
    for (const n of nodes) {
      if (n.offsetParent === null) continue;
      const r = n.getBoundingClientRect();
      if (r.width > 110 && r.height > 40 && r.width < 380) {
        n.scrollIntoView({ block: 'center' });
        return true;
      }
    }
    return false;
  });
  if (!scrolled) return false;
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[role="button"]'));
    for (const n of nodes) {
      if (n.offsetParent === null) continue;
      const r = n.getBoundingClientRect();
      if (r.width > 110 && r.height > 40 && r.width < 380 && r.top >= 0 && r.top < 900) {
        n.click();
        return true;
      }
    }
    return false;
  });
}

async function tapOnScreen(page, selector) {
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

async function advance(page) {
  // Not always role="button" — a wrong-answer feedback screen's CONTINUE is
  // a plain leaf text node whose ancestor Pressable owns the click handler.
  // Dialogue exercises label the same control FINISH instead of CONTINUE.
  const scrolled = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.children.length > 0) continue;
      if (!/^(continue|finish)$/i.test((el.textContent || '').trim())) continue;
      if (el.offsetParent === null) continue;
      el.scrollIntoView({ block: 'center' });
      return true;
    }
    return false;
  });
  if (!scrolled) return false;
  await page.waitForTimeout(300);
  const clicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.children.length > 0) continue;
      if (!/^(continue|finish)$/i.test((el.textContent || '').trim())) continue;
      if (el.offsetParent === null) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      (el.closest('[role="button"]') || el).click();
      return true;
    }
    return false;
  });
  if (clicked) await page.waitForTimeout(700);
  return clicked;
}

/** Walk a lesson to completion. Correctness doesn't matter — `finishLesson`
 *  records completion regardless of accuracy — only reaching the end does. */
async function walk(page, steps) {
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
    if (/Lesson complete|You're done|Keep it warm|FLAWLESS SESSION|SESSION COMPLETE|ACCURACY/i.test(t)) return true;
    if (/Type this word/.test(t)) {
      const input = page.locator('input:visible').first();
      if (await input.count()) await input.fill('zzz').catch(() => {});
      await tapOnScreen(page, 'text=/^Check$/');
      await page.waitForTimeout(800);
      await advance(page);
      continue;
    }
    if (/draw over the grey letter|Got it/.test(t)) {
      if (await tapOnScreen(page, 'text=/^Got it$/')) {
        await page.waitForTimeout(700);
        await advance(page);
        continue;
      }
    }
    if (/I.VE READ IT|CONVERSATION ·/.test(t)) {
      const scrolled = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(
          (n) => n.children.length === 0 && /I.VE READ IT/i.test((n.textContent || '').trim())
        );
        if (!el) return false;
        el.scrollIntoView({ block: 'center' });
        return true;
      });
      if (scrolled) {
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          const el = Array.from(document.querySelectorAll('*')).find(
            (n) => n.children.length === 0 && /I.VE READ IT/i.test((n.textContent || '').trim())
          );
          if (el) (el.closest('[role="button"]') || el).click();
        });
        await page.waitForTimeout(700);
        continue;
      }
    }
    if (!(await answerOnce(page))) break;
    await page.waitForTimeout(700);
    if (!(await advance(page))) break;
  }
  return false;
}

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

    await enterAsGuest(page, url, { completedLessons, hearts: 999, gems: 9999 });
    await page.waitForTimeout(2000); // let the mount-time auto-scroll fire and settle

    // Scroll away from wherever the mount-time auto-scroll landed, to
    // simulate "the learner isn't looking at the current lesson".
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
    const scrolledAway = await page.evaluate(findScrollTop);

    // Find and tap the sole "current" lesson row, scrolling incrementally
    // to find it since it may not be near the bottom we just scrolled to.
    let tapped = false;
    for (let attempt = 0; attempt < 20 && !tapped; attempt++) {
      const positioned = await page.evaluate(() => {
        const n = Array.from(document.querySelectorAll('[role="button"]')).find((n) =>
          /start this lesson/i.test(n.getAttribute('aria-label') || '')
        );
        if (!n) return false;
        n.scrollIntoView({ block: 'center' });
        return true;
      });
      if (positioned) {
        await page.waitForTimeout(300);
        tapped = await page.evaluate(() => {
          const n = Array.from(document.querySelectorAll('[role="button"]')).find(
            (n) => /start this lesson/i.test(n.getAttribute('aria-label') || '') && n.offsetParent !== null
          );
          if (!n) return false;
          const r = n.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return false;
          n.click();
          return true;
        });
      }
      if (!tapped) {
        await page.evaluate(() => {
          for (const el of document.querySelectorAll('*')) {
            const style = getComputedStyle(el);
            if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 50) {
              el.scrollTop = Math.max(0, el.scrollTop - 600);
              break;
            }
          }
        });
        await page.waitForTimeout(200);
      }
    }

    if (!tapped) {
      problems.push(`Could not find/tap the current lesson row ('${LEAVE_INCOMPLETE}') — cannot exercise this at all.`);
    } else {
      await page.waitForTimeout(1800);
      const reached = await walk(page, 20);
      if (!reached) {
        problems.push(`Never reached lesson-complete walking '${LEAVE_INCOMPLETE}' within 20 steps.`);
      } else {
        await tapOnScreen(page, 'text=/CONTINUE|DONE|CLAIM/i');
        await page.waitForTimeout(2200);

        const afterText = await page.evaluate(() => document.body.innerText);
        const afterScroll = await page.evaluate(findScrollTop);
        const newLessonVisible = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('*')).some((n) => {
            if (n.children.length > 0) return false;
            const r = n.getBoundingClientRect();
            return (
              n.offsetParent !== null &&
              r.width > 0 &&
              r.height > 0 &&
              r.top >= 0 &&
              r.top < 900 &&
              /daily routine/i.test(n.textContent || '')
            );
          });
        });

        if (!/Elementary/.test(afterText)) {
          problems.push('After finishing the last beginner lesson, the accordion never opened the elementary stage.');
        }
        if (afterScroll === scrolledAway) {
          problems.push(
            `Scroll position after returning (${afterScroll}px) is identical to where it was left before starting the lesson (${scrolledAway}px) — no auto-scroll happened.`
          );
        }
        if (!newLessonVisible) {
          problems.push(
            'The new current lesson (first elementary lesson) is not visible on screen after returning — the re-armed auto-scroll did not reveal it.'
          );
        }
        if (!problems.length) {
          console.log(
            `check:stage-advance-scroll — scrolled away to ${scrolledAway}px, finished '${LEAVE_INCOMPLETE}', returned to Home landed at ${afterScroll}px with the new current lesson visible.`
          );
        }
      }
    }

    await page.close();
    await browser.close();
  } finally {
    server.close();
  }

  if (problems.length) {
    console.error(`\ncheck:stage-advance-scroll — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
    for (const p of problems) console.error(`  ${p}\n`);
    process.exit(1);
  }
  console.log('check:stage-advance-scroll — finishing a stage mid-session, scrolled away, still reveals the new one.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
