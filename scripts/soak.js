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
 * That is the intent for `typeWord`, `letterTrace` and the tile-tray kinds
 * (`sentenceBuild`/`wordBuild`); the generic tap-fallback covering the other
 * seven kinds does not read this flag at all and picks uniformly at random
 * among the on-screen options regardless of it, so its real wrong-rate is
 * whatever `1 - 1/optionCount` works out to (typically 65-75%), not the 25%
 * this paragraph describes — see the queue for the open item on this.
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
 *   npm run soak -- --start 40        # skip the guest profile past the
 *                                      # first 40 lessons of the path, so a
 *                                      # short budget still reaches vocab,
 *                                      # grammar and sentences rather than
 *                                      # spending it all on the alphabet
 *   npm run soak -- --require typeWord,wordBuild,matching,sentenceBuild
 *                                      # fail if any of these exercise kinds
 *                                      # is never seen — the run is only
 *                                      # worth its time if it visits the
 *                                      # parts of the app static checks
 *                                      # cannot reason about, not the two
 *                                      # kinds every alphabet lesson opens
 *                                      # with. Under the real hearts economy
 *                                      # a single --start commonly cannot
 *                                      # satisfy kinds from two different
 *                                      # lesson kinds in one run (e.g. a
 *                                      # vocab kind plus a grammar kind) —
 *                                      # `matching` in particular sits at
 *                                      # the very end of a vocab lesson and
 *                                      # needs that lesson to actually
 *                                      # finish, which today it rarely does;
 *                                      # see the queue for why. Prefer one
 *                                      # `--require` per lesson-kind family
 *                                      # and a `--start` landing on it.
 */

const fs = require('fs');
const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');

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
const START = Number(arg('start', 0));
const REQUIRE = (arg('require', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Everything before `START` in path order is marked complete before the run
 * begins, so the guest's "current lesson" — the one `openNextLesson` opens —
 * is already `START` lessons in. Built from the real path (`load()`, the
 * same helper every other check script uses to read `.ts` content without a
 * build step), not a lesson count guessed by hand.
 *
 * Without this, a budget has to survive the alphabet (9 lessons, unlocked
 * one glyph at a time) before it can ever see `typeWord`, `wordBuild`,
 * `matching`, `sentenceBuild`, `grammarDrill`, `dialogue` or `reading` —
 * which is the whole reason this item exists (see the module doc comment).
 */
const { ALL_LESSONS } = load('src/data/units.ts');
const START_COMPLETED = Object.fromEntries(ALL_LESSONS.slice(0, START).map((l) => [l.id, { best: 1, done: 1 }]));

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
/**
 * `attempts` counts every trip through the loop below — opening a lesson and
 * playing until it stops, for whatever reason. `lessonsCompleted` counts only
 * the ones that reached "Lesson complete". PLAYER reviewing URD-001 found
 * these collapsed into one counter that incremented on every attempt, so a
 * run stuck retrying a single lesson after repeated heart loss (`--start`
 * above exists so that need not happen) printed a large, reassuring number
 * — "34 lessons, 220 exercises, 0 failures" — while never actually leaving
 * lesson one. Both are reported from here on, honestly.
 */
let attempts = 0;
let lessonsCompleted = 0;
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

/**
 * `locator.click({ force: true })` is what `tap` above uses, and it is fine
 * for most of this file's controls (Continue, Check, the plain multiple-
 * choice buttons) — those are unmodified and still pass. It is NOT fine for
 * the tile Pressables in Matching and the word/sentence build trays: found
 * by instrumenting `solveMatching` and watching the same three-tile board
 * report identically across eight straight rounds with different random
 * target tiles each time — not a wrong-pair reset (that still leaves the
 * count unchanged only until a lucky guess lands, which eight rounds at
 * three candidates would have hit), a click that silently isn't landing.
 * The fix already established for this exact RN-web Pressable click quirk
 * elsewhere in this codebase is a real pointer event at the element's own
 * coordinates rather than a synthetic `.click()`, so that is what tile taps
 * use here.
 */
const clickAt = async (page, locator) => {
  const b = await locator.boundingBox().catch(() => null);
  if (!b) return false;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  return true;
};

const screenText = (page) => page.evaluate(() => document.body.innerText);

/**
 * The banner's own Continue, at the foot; the Learn screen behind has its
 * own. On a lesson's last exercise the same button reads "Finish" instead
 * (`LessonScreen.tsx`: `idx < total - 1 ? 'Continue' : 'Finish'`) — missed
 * originally, and not a cosmetic gap: every lesson's final answer landed on
 * a banner this could not dismiss, so no lesson driven by this file could
 * ever reach "Lesson complete" regardless of hearts or luck. Confirmed by
 * screenshotting a `dead end` failure mid-diagnosis: a fully solved
 * `matching` board, "Beautifully done", and an un-tapped Finish button.
 */
const advance = async (page) => {
  const ok = await tap(page.locator('text=/CONTINUE|^Finish$/i'), 780, 900);
  if (ok) await page.waitForTimeout(500);
  return ok;
};

/**
 * Answer whatever is on screen, by whichever means this exercise takes.
 *
 * Returns the kind it thinks it saw, for the run summary, or null if it found
 * nothing it could act on — which is invariant 3 failing.
 *
 * Every exercise's `<Question>` is fixed text (see the relevant component in
 * src/exercises/), so it identifies the kind directly rather than guessing
 * from shape — necessary for `--require` to mean anything (the tap-one-
 * option fallback used to report every one of nine different kinds as the
 * same generic `'tap'`, which no `--require` list could ever distinguish).
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
  if (/Build the sentence/i.test(text)) {
    return (await solveTileBuild(page, 'Word tile', wrongOnPurpose)) ? 'sentenceBuild' : null;
  }
  if (/Build the word/i.test(text)) {
    return (await solveTileBuild(page, 'Letter tile', wrongOnPurpose)) ? 'wordBuild' : null;
  }
  if (/Match each word to its picture/i.test(text)) {
    return (await solveMatching(page)) ? 'matching' : null;
  }
  const buttonOnly = await answerButtonOnlyScreen(page, text);
  if (buttonOnly !== undefined) return buttonOnly;
  return tapNamedKind(page, text);
}

/**
 * `reading`'s and `dialogue`'s intro stage ("I've read it") and
 * `grammarTeach`'s reveal-a-stage buttons ("Show the pattern"/"Show
 * examples"/"Got it") are all `<Button>`, not `<Choice>` — and unlike
 * `Choice`, `Button` (`src/components/Button.tsx`) never sets
 * `accessibilityRole="button"`, so it renders no ARIA role at all
 * (confirmed by walking its DOM ancestry: six levels of plain `<div>`,
 * no `role` anywhere). `tapNamedKind`'s `[role="button"]` query is
 * structurally blind to it. Without this, every run through a reading or
 * dialogue passage's intro screen, or a teaching card past its first
 * stage, hit "unanswerable screen" and stalled — found chasing down THE
 * CRITIC's BLOCKING finding that `reading`/`dialogue`/`grammarTeach`
 * couldn't be named, which turned out to be blocking more than naming. The
 * answer stage that follows *is* `Choice`-built (role="button" works
 * there), so only the intro/reveal buttons need a text-based tap — this
 * returns `undefined` (not `null`) to mean "not one of these screens", so
 * `answer()` can fall through to the generic candidate tap.
 */
async function answerButtonOnlyScreen(page, text) {
  if (/^Reading · /im.test(text) || /^Conversation · /im.test(text)) {
    const kind = /^Reading · /im.test(text) ? 'reading' : 'dialogue';
    const readIt = page.locator('text=/read it/i').first();
    if (await readIt.count()) {
      // The button sits after every line of the passage/exchange, so a
      // longer dialogue pushes it below the fold — found live: a 5-turn
      // conversation left it well past y=900 on this driver's fixed
      // viewport, and `tap`'s bounding-box check (which never scrolls,
      // unlike Playwright's own un-forced `.click()`) correctly reported
      // it as not on screen. `scrollIntoViewIfNeeded` first, then the
      // usual forced click.
      await readIt.scrollIntoViewIfNeeded().catch(() => {});
      await readIt.click({ force: true }).catch(() => {});
      return kind;
    }
    // Past the "read it" stage, the Question and its Choice options sit
    // below the whole passage/exchange — for a long dialogue, past y=800,
    // outside `tapNamedKind`'s candidate window, the exact same "found live"
    // reachability problem the "read it" tap above has already been fixed
    // for, on the next screen. `Choice` (unlike `Button`) does carry
    // `role="button"`, so once scrolled the ordinary candidate search works.
    // `page.mouse.wheel` was tried first and did nothing — confirmed live,
    // same failure screenshot before and after — because it dispatches at
    // the current mouse position (the origin, having never been moved),
    // not necessarily over RN-web's actual scrolling container (a nested
    // `overflow: auto` div per screen, per `check-sizes.js`'s own note on
    // this exact structure). Scrolling every such container directly finds
    // the real one regardless of where the mouse happens to be.
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('*')) {
          const style = getComputedStyle(el);
          if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
            el.scrollTop = el.scrollHeight;
          }
        }
      })
      .catch(() => {});
    await page.waitForTimeout(150);
    return tapNamedKind(page, text);
  }
  if (/^Grammar$/im.test(text)) {
    const acted = await tap(page.locator('text=/^(Show the pattern|Show examples|Got it)$/i'), 0, 900);
    // The card reveals its next stage via `setTimeout(() => onExpand?.(), 120)`
    // (`GrammarExercises.tsx`) to let the layout settle before scrolling — a
    // bare `tap` return races that. Waiting it out here, not just relying on
    // the 450ms the outer loop already adds after every answer, because that
    // wait runs after this function returns a kind, one JS tick later.
    if (acted) await page.waitForTimeout(200);
    return acted ? 'grammarTeach' : null;
  }
  return undefined;
}

// multipleChoice, meaningPick, listenTap, wordFromMeaning, letterForm,
// letterPick and grammarDrill all resolve with one tap on an answer-shaped
// control — they share this shape, just with different fixed question text,
// checked in order of how early each one appears in the course (letters
// first, so a run without --start still labels them).
//
// reading and dialogue have no fixed `<Question>` — it's drawn from the
// passage/exchange itself — so THE CRITIC reviewing this item found they
// fell through to `'tap'` regardless of what they actually were, which meant
// `--require reading` (or dialogue) reported "never seen" even on a run that
// had genuinely visited and answered one — the tool actively lying about
// what it saw, worse than not tracking it at all. Each still carries one
// thing that IS fixed: the screen's own `Eyebrow` caption
// (`SentenceReading.tsx`, `DialogueExercise.tsx`), present on both its intro
// stage and its dynamic-question stage, so that is matched instead. (The
// intro stage is handled above this table, by text, not here — see the
// `<Button>`-has-no-role comment above `answer()`'s reading/dialogue branch.
// grammarTeach is handled entirely above this table for the same reason and
// never reaches this lookup at all.)
const NAMED_TAP_KIND = [
  [/Which position is this letter showing\?/i, 'letterForm'],
  [/Which letter is this\?/i, 'letterPick'],
  [/Which word is this\?|Which word means this\?/i, 'multipleChoice'],
  [/What does it mean\?/i, 'meaningPick'],
  [/Which one did you hear\?/i, 'listenTap'],
  [/How do you say it\?/i, 'wordFromMeaning'],
  [/Complete the sentence/i, 'grammarDrill'],
  [/^Reading · /im, 'reading'],
  [/^Conversation · /im, 'dialogue'],
];

/** The generic fallback: pick one of the answer-shaped controls at random. */
async function tapNamedKind(page, text) {
  const kind = (NAMED_TAP_KIND.find(([re]) => re.test(text)) ?? [null, 'tap'])[1];
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
  return kind;
}

/**
 * Tile-and-check exercises (sentenceBuild, wordBuild): tap every available
 * tile, then Check. The single-random-tap fallback above cannot solve these
 * on its own — the placed tiles are themselves tappable ("tap to take it
 * back"), so a random candidate among them is as likely to undo progress as
 * make it, and the Check button does not exist until at least one tile is
 * placed, so it is never the very first thing tapped either.
 *
 * `wrongOnPurpose` taps from the end of the tile list instead of the start.
 * That does not guarantee a wrong order, but it is a different one than the
 * correct-leaning default, and — like `traceTheLetter`'s partial trace —
 * getting it wrong sometimes is the point: the run needs to see the
 * incorrect-answer explanation, not just the correct-answer path.
 */
async function solveTileBuild(page, tileLabelPrefix, wrongOnPurpose) {
  const available = () => page.locator(`[role="button"][aria-label^="${tileLabelPrefix}"]`);
  if ((await available().count()) === 0) return false;
  for (let guard = 0; guard < 20; guard++) {
    const tiles = available();
    const n = await tiles.count();
    if (n === 0) break;
    const el = wrongOnPurpose ? tiles.last() : tiles.first();
    await clickAt(page, el);
    await page.waitForTimeout(150);
  }
  return tap(page.locator('text=/^Check$/i'), 0, 900);
}

/**
 * Matching: tap one tile from the left column, then one from the right,
 * repeatedly. Left and right are told apart by screen position (the board
 * is two `w-[48%]` columns), not content — Matching shows Urdu on the left
 * and the English gloss on the right, which this driver has no way to read
 * as "the same word" from rendered text alone, unlike everything else here.
 *
 * A wrong pair costs nothing but a ~550ms reset (see `Matching.tsx`'s
 * `tryPair`), so trying every right tile against a left one before moving
 * on always finds the match eventually — it just is not fast. `rounds` is
 * generous (worst case for an n-item board is on the order of n² attempts)
 * rather than tuned tight, since a board this small settling a little slow
 * is a better failure mode than a false "unanswerable" from cutting it off
 * early.
 *
 * The y lower bound is 80, not the 150 the generic tap-fallback uses.
 * Measured directly (instrumented, then screenshotted): `Match each word to
 * its picture` is a one-line question with no picture prompt above the
 * board, unlike every exercise the 150 bound was tuned against, so the
 * board's own first row rendered at y≈104 — inside a `y < 150` filter's
 * blind spot. That clipped exactly one of four pairs on both sides,
 * capping `matched.size` at 3 of the `words.length === 4` `finish()` needs,
 * so the exercise could never complete. Board size is fixed at 4 (see
 * generator.ts), so this is not a threshold to retune if the board ever
 * grows — it would need a real per-row layout read, not a wider constant.
 *
 * `:not([aria-disabled="true"])` matters just as much: `Matching.tsx` never
 * unmounts a matched tile, it disables it and colours it green
 * (`disabled={matched.has(w.id)}`), so a query that does not exclude
 * disabled tiles keeps finding the *same* four-per-side count forever —
 * `left[0]` in DOM order is stable, and once it is the tile from the
 * board's first real pair, an already-matched, disabled tile, every future
 * round clicks it, nothing selects, and the exercise can never see a
 * second pair. Screenshotted mid-run to confirm: the first pair does
 * genuinely match (goes green) on an early lucky guess, and the board
 * still stalls right there, which is what pointed at "still being
 * selected" rather than "never selectable" as the bug.
 */
async function solveMatching(page) {
  for (let round = 0; round < 24; round++) {
    const btns = page.locator('[role="button"]:not([aria-disabled="true"])');
    const n = await btns.count();
    const left = [];
    const right = [];
    for (let k = 0; k < n; k++) {
      const b = await btns
        .nth(k)
        .boundingBox()
        .catch(() => null);
      if (!b || b.y < 80 || b.y > 800 || b.width < 60) continue;
      (b.x < 200 ? left : right).push(b);
    }
    if (!left.length || !right.length) break; // nothing left to pair — done
    await page.mouse.click(left[0].x + left[0].width / 2, left[0].y + left[0].height / 2);
    await page.waitForTimeout(120);
    const r = right[Math.floor(rnd() * right.length)];
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await page.waitForTimeout(650);
  }
  return true;
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

/**
 * Out of hearts is an ending, not an error.
 *
 * The first version of this tapped REFILL and looped until the step budget
 * ran out, then reported the lesson as never finishing. It was tapping a
 * button the learner could not afford: the screen offers
 * "REFILL · 40 GEMS (YOU HAVE 20)", and tapping it does nothing at all. That
 * is the app behaving reasonably and the driver failing to read.
 *
 * So the cost is read off the button and refill is only used when it is
 * affordable. Otherwise the exit is the one a learner would take, which is
 * the second control, and the lesson ends there. Returns the outer loop's
 * exit reason ('stuck' or 'out of hearts'), or null when a refill was
 * affordable and taken, meaning the caller should keep playing.
 */
async function handleOutOfHearts(page, text) {
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
  return affordable ? null : 'out of hearts';
}

/**
 * Play one lesson to its completion screen. Returns why it stopped.
 *
 * `/Lesson complete|Keep it warm|You're done/i` never matches anything in
 * the app as it stands today — grepped the whole of src/screens: none of
 * those three phrases appear anywhere. There is no separate lesson-complete
 * screen to match at all; the last exercise's Finish button (see `advance`)
 * returns straight to the path. That means this driver could not have
 * reported a single genuine completion for as long as that screen has been
 * gone — every "0 lessons completed" result this session, hearts economy
 * aside, was this dead regex, not (only) bad luck against the wrong-answer
 * rate. Found by screenshotting a `dead end` and following it forward: the
 * final Finish tap (once `advance` recognised it) landed the driver back on
 * Home mid-loop with nothing in the completion regex able to see it, so it
 * kept trying to answer a screen with no question on it and failed loudly
 * instead of returning 'complete'. `Harf · حرف` is Home's own brand eyebrow
 * (`HomeScreen.tsx`) and, matched as a whole line, distinguishes it from
 * the same string's other appearance in the Settings footer ("Harf · حرف ·
 * v1.0") — the only two places it renders anywhere in the app. Matched
 * case-insensitively: the eyebrow is styled uppercase, so `innerText`
 * reports it as "HARF · حرف", not the mixed-case string the source
 * literally contains — confirmed by the first attempt at this fix still
 * failing on that exact text.
 */
async function playLesson(page, budget = 90) {
  let idle = 0;
  let last = '';
  for (let step = 0; step < budget; step++) {
    const text = await screenText(page);

    if (/Lesson complete|Keep it warm|You're done/i.test(text) || /^Harf · حرف$/im.test(text)) return 'complete';

    if (/Out of hearts/i.test(text)) {
      const outcome = await handleOutOfHearts(page, text);
      if (outcome) return outcome;
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

/** Everything that can fail before a browser ever opens, checked up front. */
function findRunner() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('soak — no dist/. Run `npm run build:web` first.');
    process.exit(1);
  }
  const exe = findChromium();
  if (!exe) {
    console.error('soak — no Chromium found.');
    process.exit(1);
  }
  try {
    return { exe, chromium: require('playwright-core').chromium };
  } catch {
    console.error('soak — playwright-core is not installed.');
    process.exit(1);
  }
}

/**
 * Hearts regenerate over real time, which a soak does not have. Topping them
 * up between lessons keeps the run exercising *exercises* rather than
 * re-reading the same lockout screen, while still visiting the lockout
 * itself every time it is genuinely reached.
 */
async function refillHearts(page) {
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

/** Prints the --require verdict and exits 1 if anything asked for was missed. */
function reportRequired(seen) {
  if (!REQUIRE.length) return;
  const missing = REQUIRE.filter((k) => !kinds.has(k));
  if (missing.length) {
    console.error(
      `\nsoak — required kind${missing.length === 1 ? '' : 's'} never seen: ${missing.join(', ')}\n` +
        `  seen instead: ${seen || '(none)'}\n` +
        `  Try a bigger budget, or --start further into the path — some kinds (grammarDrill, sentenceBuild,\n` +
        `  matching, dialogue, reading...) only appear well past the alphabet lessons this run started at.\n` +
        `  Replay with:  npm run soak -- --seed ${SEED}`
    );
    process.exit(1);
  }
  console.log(`  required kinds all seen: ${REQUIRE.join(', ')}`);
}

/** After one attempt: refill hearts, print progress, and recover from a stuck lesson. */
async function settleAttempt(page, url, why) {
  if (why === 'complete') lessonsCompleted++;
  if (why === 'out of hearts') await refillHearts(page);
  process.stdout.write(
    `\r  ${lessonsCompleted} lessons completed, ${attempts} attempts, ${exercisesAnswered} exercises, ${failures.length} failures  `
  );
  if (why === 'stuck' || why === 'ran out') {
    // Get out and keep going: one broken lesson should not end the run, and
    // the rest of the path is still worth playing. `ran out` needs this too,
    // not just `stuck` — found live: a run-out lesson can leave the browser
    // mid-screen (e.g. an "Out of hearts" prompt reached right at the step
    // budget), and without a reset the *next* attempt's `openNextLesson`
    // fails against that stale screen instead of the path, cascading into a
    // second, unrelated "no lesson to open" failure.
    await page.goto(url);
    await page.waitForTimeout(2000);
  }
}

(async () => {
  const { exe, chromium } = findRunner();

  console.log(
    `soak — seed ${SEED}, track ${TRACK}, budget ${MINUTES === Infinity ? `${MAX_LESSONS} lesson attempts` : `${MINUTES} min`}` +
      `${START > 0 ? `, starting ${START} lessons in` : ''}.\n` +
      `  Replay this exact run with:  npm run soak -- --seed ${SEED}\n`
  );

  const server = await serveDist(DIST, PORT);
  const browser = await chromium.launch({ executablePath: exe, headless: !HEADED });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });

  // Invariant 1, running the whole time rather than sampled.
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

  const url = `http://localhost:${PORT}/`;
  await enterAsGuest(page, url, {
    ...(TRACK === 'roman' ? { goal: 'speak' } : {}),
    ...(START > 0 ? { completedLessons: START_COMPLETED } : {}),
  });
  await page.reload();
  await page.waitForTimeout(2200);

  // `--lessons N` still bounds attempts, not completions: measured directly
  // (see gauntlet/LEDGER.md) that gating this loop on completions instead
  // made runtime genuinely unbounded rather than merely generous — even 40
  // lessons into the path, past the alphabet, a real run answered 97
  // exercises across 14 attempts without completing a single lesson, the
  // wrong-answer rate and HEARTS_MAX combination making survival to the end
  // of a 25-40 exercise lesson a low-probability event per attempt. That is
  // real information about the hearts economy (see URD-006), not something
  // this item's `--start`/`--require` addition should paper over by quietly
  // making the run take however long it takes. "Make the counter honest" —
  // this item's own instruction — is about the *summary* no longer
  // misrepresenting attempts as completions, not about redefining what a
  // lesson budget bounds.
  const deadline = Date.now() + MINUTES * 60_000;
  while (Date.now() < deadline && attempts < MAX_LESSONS && failures.length < 12) {
    const opened = await openNextLesson(page);
    if (!opened) {
      await fail(page, 'no lesson to open', 'the path offered nothing playable');
      break;
    }
    const why = await playLesson(page);
    attempts++;
    await settleAttempt(page, url, why);
    for (const e of errors.splice(0)) await fail(page, 'uncaught error', e);
  }

  await browser.close();
  server.close();

  console.log(
    `\n\nsoak — ${lessonsCompleted} lessons completed, ${attempts} attempts, ${exercisesAnswered} exercises answered.`
  );
  const seen = [...kinds].map(([k, n]) => `${k} ${n}`).join(' · ');
  if (seen) console.log(`  exercise kinds exercised: ${seen}`);

  if (failures.length) {
    console.error(`\nsoak — ${failures.length} failure${failures.length === 1 ? '' : 's'}:\n`);
    for (const f of failures) console.error(`  ${f.rule}\n    ${f.detail}\n    ${f.shot}`);
    console.error(`\n  Replay with:  npm run soak -- --seed ${SEED}`);
    process.exit(1);
  }

  reportRequired(seen);

  console.log(`  Nothing broke. Seed ${SEED}.`);
})().catch((e) => {
  console.error('soak — ' + e.message);
  process.exit(1);
});
