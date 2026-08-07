/* eslint-disable */
/**
 * The gauntlet: play the app, for as long as you like, and report what breaks.
 *
 * Every other check in this repo asserts one property once and exits. That is
 * the right shape for a gate, and it has a blind spot the size of the app: a
 * property nobody thought to assert is a property nobody checks. The
 * vocabulary coverage bug lived through twenty three green checks and was found
 * by a person playing the app, noticing that a finished lesson kept producing
 * words they had never seen.
 *
 * So this does the thing that found it. It opens the real built bundle in a real
 * browser, plays lessons end to end, one after another, for a budget of minutes
 * or lessons, and holds the app to the handful of properties that are true of
 * *any* working version of it:
 *
 *  1. **Nothing throws.** An uncaught error is a failure even if the screen
 *     still looks fine, because the next learner gets the broken render.
 *  2. **There is always a way forward.** If nothing on screen responds for
 *     several attempts running, the learner is stuck, and stuck is the one
 *     failure they cannot work around.
 *  3. **Every exercise can be answered.** A question with no tappable option, no
 *     input and no confirm control is unanswerable by definition.
 *  4. **Answering moves.** The screen after answering must differ from the
 *     screen before it. A question that reappears identical has eaten the answer.
 *  5. **Lessons finish.** A lesson entered must reach its completion screen
 *     within a sane number of steps, and completing it must return to the path.
 *  6. **Hearts never trap.** Running out must offer a way back in. There was a
 *     soft lock here once, where the only control led to the screen you were
 *     already on.
 *
 * It answers deliberately wrongly some of the time, on a seeded coin flip, so
 * the wrong answer path, the hearts drain and the refill are exercised rather
 * than assumed. A run that only ever answers correctly never visits half the app.
 *
 * ## Why it is not in `check:all`
 *
 * Because it does not terminate in a useful time, and a gate that takes twenty
 * minutes stops being run. It is deliberately a soak: run it while working on
 * something else, or overnight, or against a suspicion. `check:all` stays the
 * fast honest gate; this is the slow one that finds what the gate cannot.
 *
 * ## Reproducing a failure
 *
 * Everything random here comes from one seeded generator, and the seed is
 * printed at the top of every run and again with any failure. Passing it back
 * replays the same run: same lessons, same wrong answers, same order.
 *
 *   npm run soak                      # ten minutes, random seed
 *   npm run soak -- --minutes 60      # a long one
 *   npm run soak -- --lessons 25      # a fixed amount of work instead
 *   npm run soak -- --seed 1837462    # replay a run that failed
 *   npm run soak -- --track roman     # only the Roman path
 *   npm run soak -- --headed          # watch it play
 */

const fs = require('fs');
const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8311;
const SHOTS = path.join(ROOT, '.soak');

// ---------------------------------------------------------------- arguments

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const SEED = Number(arg('seed', Math.floor(Math.random() * 1e7)));
const MINUTES = Number(arg('minutes', has('lessons') ? Infinity : 10));
const MAX_LESSONS = Number(arg('lessons', Infinity));
const TRACK = arg('track', 'both');
const HEADED = has('headed');

/** One generator for everything, so a seed replays a whole run. */
let rngState = SEED >>> 0;
const rnd = () => {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ------------------------------------------------------------------ reporting

const failures = [];
const kinds = new Map();
let lessonsPlayed = 0;
let exercisesAnswered = 0;

const fail = async (page, rule, detail) => {
  const shot = path.join(SHOTS, `${failures.length + 1}-${rule.replace(/[^a-z]+/gi, '-')}.png`);
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: shot }).catch(() => {});
  failures.push({ rule, detail, shot: path.relative(ROOT, shot) });
  console.error(`  ✗ ${rule} — ${detail}`);
};

// --------------------------------------------------------------- the driving
//
// These mirror check-stability.js deliberately rather than importing from it:
// that script is a gate with one narrow job and its helpers are tuned to it.
// The note that matters is the one about React Navigation, and it is repeated
// here because it is the single thing most likely to make a change to this file
// wrong: previous screens stay mounted, so the same text exists several times
// over, and clicking the copy on the screen behind does nothing at all. Every
// interaction below is filtered by where it sits on screen for that reason.

const onScreen = async (locator, lo = 0, hi = 900) => {
  const n = await locator.count();
  for (let k = 0; k < n; k++) {
    const b = await locator
      .nth(k)
      .boundingBox()
      .catch(() => null);
    if (b && b.y >= lo && b.y < hi && b.width > 0 && b.height > 0) return locator.nth(k);
  }
  return null;
};

const tap = async (locator, lo, hi) => {
  const el = await onScreen(locator, lo, hi);
  if (!el) return false;
  await el.click({ force: true }).catch(() => {});
  return true;
};

const screenText = (page) => page.evaluate(() => document.body.innerText);

/** The banner's own Continue, at the foot; the Learn screen behind has its own. */
const advance = async (page) => {
  const ok = await tap(page.locator('text=/CONTINUE/i'), 780, 900);
  if (ok) await page.waitForTimeout(500);
  return ok;
};

/**
 * Answer whatever is on screen, by whichever means this exercise takes.
 *
 * Returns the kind it thinks it saw, for the run summary, or null if it found
 * nothing it could act on — which is invariant 3 failing.
 */
async function answer(page, text, wrongOnPurpose) {
  if (/Type this word|Write it from memory/i.test(text)) {
    const input = await onScreen(page.locator('input:visible'));
    if (!input) return null;
    // A deliberately wrong answer here is a real string, not empty: an empty
    // field is a different code path (the button is disabled) and it is the
    // wrong one to be exercising.
    await input.fill(wrongOnPurpose ? 'qqqq' : await bestGuess(page)).catch(() => {});
    if (!(await tap(page.locator('text=/^Check$/'), 0, 900))) return null;
    return 'typeWord';
  }
  if (/draw over the grey letter/i.test(text)) {
    if (await traceTheLetter(page, wrongOnPurpose)) return 'letterTrace';
    // A later state of the same exercise shows the answer with a confirm.
    if (await tap(page.locator('text=/^Got it$/'), 0, 900)) return 'letterTrace';
    return null;
  }
  // Everything else is tap-an-option: pick one of the answer-shaped controls.
  const btns = page.locator('[role="button"]');
  const n = await btns.count();
  const candidates = [];
  for (let k = 0; k < n; k++) {
    const b = await btns
      .nth(k)
      .boundingBox()
      .catch(() => null);
    if (b && b.y > 150 && b.y < 800 && b.width > 110 && b.height > 40) candidates.push(k);
  }
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(rnd() * candidates.length)];
  await btns
    .nth(pick)
    .click({ force: true })
    .catch(() => {});
  return 'tap';
}

/**
 * Trace the letter by actually tracing it.
 *
 * The first version of this harness scribbled across the panel and reported the
 * screen as unanswerable when the app refused. The app was right: tracing is
 * graded on coverage *and* precision, and `check:trace` proves a scribble scores
 * 100% coverage at 23% precision and is turned down. A driver that cannot draw
 * is not evidence of a broken exercise.
 *
 * So it reads the glyph off the screen rather than guessing where it is. The
 * panel is screenshotted, pixels darker than the parchment are the letter, and
 * the pointer is walked through them nearest neighbour from the topmost point.
 * That is high coverage and, because it never leaves the glyph, high precision.
 *
 * `wrongOnPurpose` deliberately traces only the first third, which is the
 * "half the letter" case `check:trace` calibrates against and expects to fail.
 * Both outcomes are legitimate answers, which is the point: the run needs to
 * visit the refusal path as well as the accepting one.
 */
async function traceTheLetter(page, wrongOnPurpose) {
  const panel = await onScreen(page.locator('text=/Draw over the grey letter/i'), 0, 900);
  if (!panel) return false;
  const box = await panel.boundingBox().catch(() => null);
  if (!box) return false;
  // The caption sits at the foot of the card; the drawing area is above it.
  const area = { x: box.x - 4, y: box.y - 330, width: 348, height: 330 };
  if (area.y < 0) return false;

  let png;
  try {
    const { PNG } = require(path.join(ROOT, 'node_modules', 'pngjs'));
    png = PNG.sync.read(await page.screenshot({ clip: area }));
  } catch {
    return false;
  }

  // Parchment is the lightest thing in the panel; the glyph is a tone below it.
  const pts = [];
  for (let y = 2; y < png.height - 2; y += 4) {
    for (let x = 2; x < png.width - 2; x += 4) {
      const i = (png.width * y + x) << 2;
      const lum = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
      if (lum < 200) pts.push({ x, y });
    }
  }
  if (pts.length < 12) return false;

  // Nearest neighbour from the topmost pixel: a stroke order, not a raster scan,
  // so the drawn line stays inside the glyph instead of jumping across gaps.
  pts.sort((a, b) => a.y - b.y || a.x - b.x);
  const path0 = [pts.shift()];
  while (pts.length && path0.length < 220) {
    const last = path0[path0.length - 1];
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = (pts[i].x - last.x) ** 2 + (pts[i].y - last.y) ** 2;
      if (d < bd) [bd, bi] = [d, i];
    }
    path0.push(pts.splice(bi, 1)[0]);
  }

  const walk = wrongOnPurpose ? path0.slice(0, Math.max(4, Math.floor(path0.length / 3))) : path0;
  await page.mouse.move(area.x + walk[0].x, area.y + walk[0].y);
  await page.mouse.down();
  for (const p of walk) await page.mouse.move(area.x + p.x, area.y + p.y);
  await page.mouse.up();
  await page.waitForTimeout(200);
  return tap(page.locator('text=/^CHECK$/i'), 0, 900);
}

/**
 * For a typing exercise, the transliteration is on screen under the prompt, and
 * that is what the field wants. Not knowing it is fine — a wrong answer is a
 * legitimate thing for this to be doing — but always being wrong would mean
 * never seeing the correct-answer path.
 */
async function bestGuess(page) {
  const roman = await page
    .evaluate(() => {
      const m = document.body.innerText.match(/^[a-z]{2,14}$/im);
      return m ? m[0] : '';
    })
    .catch(() => '');
  return roman || 'aap';
}

/** Play one lesson to its completion screen. Returns why it stopped. */
async function playLesson(page, budget = 90) {
  let idle = 0;
  let last = '';
  for (let step = 0; step < budget; step++) {
    const text = await screenText(page);

    if (/Lesson complete|Keep it warm|You're done/i.test(text)) return 'complete';

    if (/Out of hearts/i.test(text)) {
      /**
       * Out of hearts is an ending, not an error.
       *
       * The first version of this tapped REFILL and looped until the step budget
       * ran out, then reported the lesson as never finishing. It was tapping a
       * button the learner could not afford: the screen offers
       * "REFILL · 40 GEMS (YOU HAVE 20)", and tapping it does nothing at all.
       * That is the app behaving reasonably and the driver failing to read.
       *
       * So the cost is read off the button and refill is only used when it is
       * affordable. Otherwise the exit is the one a learner would take, which is
       * the second control, and the lesson ends there.
       */
      const m = text.match(/REFILL[^\n]*?(\d+)\s*GEMS?\s*\(YOU HAVE (\d+)\)/i);
      const affordable = m ? Number(m[2]) >= Number(m[1]) : false;
      const acted = affordable
        ? await tap(page.locator('text=/REFILL/i'), 0, 900)
        : await tap(page.locator('text=/LEAVE FOR NOW/i'), 0, 900);
      // Invariant 6: whichever it is, something has to lead somewhere.
      if (!acted) {
        await fail(page, 'hearts soft lock', 'out of hearts with no control that leads anywhere');
        return 'stuck';
      }
      await page.waitForTimeout(900);
      if (!affordable) return 'out of hearts';
      continue;
    }

    // Invariant 4: the screen has to move.
    if (text === last) {
      idle++;
      if (idle >= 4) {
        await fail(page, 'dead end', `the screen did not change across ${idle} attempts`);
        return 'stuck';
      }
    } else {
      idle = 0;
    }
    last = text;

    const wrong = rnd() < 0.25;
    const kind = await answer(page, text, wrong);
    if (!kind) {
      // Maybe it is a between-questions banner rather than a question.
      if (await advance(page)) continue;
      await fail(
        page,
        'unanswerable screen',
        `nothing on screen could be acted on: ${text.slice(0, 90).replace(/\n/g, ' / ')}`
      );
      return 'stuck';
    }
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    exercisesAnswered++;
    await page.waitForTimeout(450);
    await advance(page);
  }
  // Invariant 5: a lesson that never ends is as broken as one that crashes.
  await fail(page, 'lesson never finished', `still going after ${budget} steps`);
  return 'ran out';
}

/** Back to the path, and open whatever is playable next. */
async function openNextLesson(page) {
  // The lesson's own back control, else the Learn tab at the foot.
  await tap(page.locator('text=/CONTINUE|Back to path|^Learn$/i'), 780, 900);
  await page.waitForTimeout(900);
  const started =
    (await tap(page.locator('text=/^START$/i'), 100, 800)) || (await tap(page.locator('text=/^Continue$/i'), 100, 780));
  await page.waitForTimeout(1200);
  return started;
}

// -------------------------------------------------------------------- run it

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('soak — no dist/. Run `npm run build:web` first.');
    process.exit(1);
  }
  const exe = findChromium();
  if (!exe) {
    console.error('soak — no Chromium found.');
    process.exit(1);
  }

  let chromium;
  try {
    chromium = require('playwright-core').chromium;
  } catch {
    console.error('soak — playwright-core is not installed.');
    process.exit(1);
  }

  console.log(
    `soak — seed ${SEED}, track ${TRACK}, budget ${MINUTES === Infinity ? `${MAX_LESSONS} lessons` : `${MINUTES} min`}.\n` +
      `  Replay this exact run with:  npm run soak -- --seed ${SEED}\n`
  );

  const server = await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: exe, headless: !HEADED });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });

  // Invariant 1, running the whole time rather than sampled.
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

  const url = `http://localhost:${PORT}/`;
  await enterAsGuest(page, url, TRACK === 'roman' ? { goal: 'speak' } : {});
  await page.reload();
  await page.waitForTimeout(2200);

  const deadline = Date.now() + MINUTES * 60_000;
  while (Date.now() < deadline && lessonsPlayed < MAX_LESSONS && failures.length < 12) {
    const opened = await openNextLesson(page);
    if (!opened) {
      await fail(page, 'no lesson to open', 'the path offered nothing playable');
      break;
    }
    const why = await playLesson(page);
    lessonsPlayed++;
    if (why === 'out of hearts') {
      // Hearts regenerate over real time, which a soak does not have. Topping
      // them up between lessons keeps the run exercising *exercises* rather
      // than re-reading the same lockout screen, while still visiting the
      // lockout itself every time it is genuinely reached.
      await page
        .evaluate(() => {
          const raw = JSON.parse(localStorage.getItem('harf-progress') || '{"state":{},"version":0}');
          raw.state = { ...raw.state, hearts: 5 };
          localStorage.setItem('harf-progress', JSON.stringify(raw));
        })
        .catch(() => {});
      await page.reload();
      await page.waitForTimeout(2000);
    }
    process.stdout.write(
      `\r  played ${lessonsPlayed} lessons, ${exercisesAnswered} exercises, ${failures.length} failures  `
    );
    if (why === 'stuck') {
      // Get out and keep going: one broken lesson should not end the run, and
      // the rest of the path is still worth playing.
      await page.goto(url);
      await page.waitForTimeout(2000);
    }
    for (const e of errors.splice(0)) await fail(page, 'uncaught error', e);
  }

  await browser.close();
  server.close();

  console.log(`\n\nsoak — ${lessonsPlayed} lessons, ${exercisesAnswered} exercises answered.`);
  const seen = [...kinds].map(([k, n]) => `${k} ${n}`).join(' · ');
  if (seen) console.log(`  exercise kinds exercised: ${seen}`);

  if (failures.length) {
    console.error(`\nsoak — ${failures.length} failure${failures.length === 1 ? '' : 's'}:\n`);
    for (const f of failures) console.error(`  ${f.rule}\n    ${f.detail}\n    ${f.shot}`);
    console.error(`\n  Replay with:  npm run soak -- --seed ${SEED}`);
    process.exit(1);
  }
  console.log(`  Nothing broke. Seed ${SEED}.`);
})().catch((e) => {
  console.error('soak — ' + e.message);
  process.exit(1);
});
