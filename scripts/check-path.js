/* eslint-disable */
/**
 * Does the learn path mount the whole course, or just what's on screen?
 *
 * The path used to be one flat list of every lesson row, and the course has
 * grown from 174 lessons to 608 (spreading topics across enough lessons to
 * cover their vocabulary) to 348 (URD-A02 attempt 1 regrouping them) — a flat,
 * unvirtualized `ScrollView` mounting all of them is a real and growing cost,
 * and it is exactly the kind of thing that never fails a functional test: the
 * screen looks right, it is just slow and heavy to build.
 *
 * `HomeScreen.tsx` already collapses every course stage except the one the
 * learner is on (`isOpen(lvl) &&` gates each level's lesson rows), which is
 * real virtualization-by-a-different-name — a level's lessons never mount
 * unless that level is open. This check exists to hold that in place rather
 * than assume it: it opens the real built bundle and counts what the DOM
 * actually contains, for a fresh learner and for one deep into the course, so
 * a change that quietly drops the `isOpen` gate (or defaults more than one
 * level open) is caught here rather than by someone noticing the app got
 * slower.
 *
 * Two properties, both measured against real content, not a fixed guess:
 *
 *  1. **Bounded by the largest single level, not the whole course.** The
 *     bound is computed from the real per-level lesson counts, plus headroom
 *     for the handful of non-lesson buttons on the screen (continue card,
 *     letter lab, one header per level) — so it tracks the course as content
 *     is added rather than needing to be hand-raised.
 *  2. **Does not grow with progress.** A learner deep into the course opens
 *     a later level, not an accumulation of every level passed through.
 *
 * Run with:  npm run check:path
 */

const path = require('path');
const { serveDist, findChromium, enterAsGuest } = require('./lib/serve-dist');
const { load } = require('./lib/load-ts');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8205;

const { UNITS, ALL_LESSONS } = load('src/data/units.ts');
const { LEVEL_ORDER, LEVEL_META } = load('src/data/words.ts');

/** How many lesson rows a level's own units hold, in total — the same
 *  computation `maxLevelLessons` below already does across every level,
 *  named so a per-scenario floor can ask it for one level specifically. */
const lessonCountForLevel = (lvl) => UNITS.filter((u) => u.level === lvl).reduce((n, u) => n + u.lessons.length, 0);

/**
 * Which level a learner with this progress would actually see open.
 *
 * Mirrors `HomeScreen.tsx`'s own `currentId`/`currentLevel` derivation
 * exactly (first lesson in path order not completed or skipped, then that
 * lesson's own unit's level; `'beginner'` — `LEVEL_ORDER[0]` — for a fresh
 * guest with nothing completed) rather than assuming which level a
 * scenario lands on. A hand-guessed floor here would drift the moment the
 * course's own length or level boundaries moved, the same "the check
 * stops meaning anything" failure this file's own `BOUND` cap already
 * guards against for the upper bound.
 *
 * `skippedLessons` too, not just `completedLessons` — THE CRITIC noted an
 * earlier version of this checked only the latter while claiming to mirror
 * both. Inert today (no scenario here, nor `enterAsGuest`, ever populates
 * `skippedLessons`), but a real gap between the claim and the code
 * regardless, and one whose direction of error is the wrong kind to leave:
 * ignoring a skip only ever lands this on an earlier-or-equal level than
 * the real app, computing a floor too *low* to catch a real regression
 * rather than too high to false-fail a working one.
 */
function expectedOpenLevel(completedLessons, skippedLessons = {}) {
  const currentId =
    ALL_LESSONS.find((l) => !completedLessons[l.id] && !skippedLessons[l.id])?.id ??
    ALL_LESSONS[ALL_LESSONS.length - 1].id;
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === currentId));
  return unit?.level ?? LEVEL_ORDER[0];
}

/** THE CRITIC's round-2 review of this file noted the level-title regex
 *  below wasn't escaping metacharacters — harmless while every title is a
 *  plain word, but cheap to make actually safe rather than "safe today". */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A lesson row's own accessibility label always ends in one of these four
 *  phrases (see `LessonNode` in `HomeScreen.tsx`) — distinct from every other
 *  button on the screen (level headers end in "Expand"/"Collapse", the
 *  continue card and letter lab have their own unrelated labels), so counting
 *  by suffix counts lesson rows specifically, not "buttons in general". */
const LESSON_ROW_SUFFIXES = ['Completed', 'tap to try it anyway', 'Start this lesson', 'Locked, tap to jump ahead'];

async function countLessonRows(page) {
  return page.evaluate((suffixes) => {
    const nodes = Array.from(document.querySelectorAll('[role="button"]'));
    return nodes.filter((n) => {
      const label = n.getAttribute('aria-label') || '';
      return suffixes.some((s) => label.endsWith(s));
    }).length;
  }, LESSON_ROW_SUFFIXES);
}

async function main() {
  const server = await serveDist(DIST, PORT);
  const chromium = require('playwright-core').chromium;
  const execPath = findChromium();
  const problems = [];

  try {
    const maxLevelLessons = Math.max(...LEVEL_ORDER.map(lessonCountForLevel));
    // Headroom for the level headers (one per level, always rendered) plus
    // the continue card / letter lab / other fixed Home-screen buttons — a
    // small constant, not a fraction of the course, so it can't quietly grow
    // into cover for a real regression.
    //
    // Capped against the course total, not just derived from one level's
    // count: THE CRITIC reviewing this check found that an uncapped bound
    // has no defense against the level *count* changing rather than lesson
    // counts within it — if a future regroup ever concentrated the course
    // into 2 big levels instead of 4, `maxLevelLessons + 20` would climb
    // toward the whole course, and the check would quietly become unable to
    // fail no matter how bad the real regression. Capping at half the
    // course keeps a real floor under the check itself; if a level ever
    // legitimately needs more room than that, this reports it as its own
    // problem rather than silently accepting it.
    const rawBound = maxLevelLessons + 20;
    const BOUND = Math.min(rawBound, Math.ceil(ALL_LESSONS.length / 2));
    if (rawBound > BOUND) {
      problems.push(
        `The largest level (${maxLevelLessons} lessons) is close enough to half the course ` +
          `(${ALL_LESSONS.length} total) that its own natural headroom (${rawBound}) would leave this check ` +
          `unable to fail a real regression. Capped to ${BOUND} instead of raised to fit — if a level ` +
          `genuinely needs more room, split it, don't widen this check to allow it.`
      );
    }

    const browser = await chromium.launch({ executablePath: execPath || undefined });

    const scenarios = [
      { name: 'fresh guest (level 1 open by default)', completedLessons: {} },
      {
        name: 'learner deep into the course',
        completedLessons: Object.fromEntries(
          ALL_LESSONS.slice(0, Math.floor(ALL_LESSONS.length * 0.7)).map((l) => [l.id, { best: 1, done: 1 }])
        ),
      },
    ];

    const counts = [];
    for (const scenario of scenarios) {
      const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
      const url = `http://localhost:${PORT}/Urdu/`;
      await enterAsGuest(page, url, { completedLessons: scenario.completedLessons });
      await page.waitForTimeout(1200);
      const n = await countLessonRows(page);
      counts.push({ name: scenario.name, n });
      await page.close();

      if (n > BOUND) {
        problems.push(
          `${scenario.name}: ${n} lesson rows mounted, over the bound of ${BOUND} ` +
            `(largest single level is ${maxLevelLessons} lessons + 20 headroom). ` +
            `The path is mounting more than one course stage at once.`
        );
      }
      if (n >= ALL_LESSONS.length * 0.5) {
        problems.push(
          `${scenario.name}: ${n} lesson rows mounted is not meaningfully less than the ` +
            `course total of ${ALL_LESSONS.length} — check the level-collapse gate is still in place.`
        );
      }
      // URD-037: this check used to assert only an upper bound, so a
      // scenario mounting zero rows — the accordion silently failing to
      // render anything, or opening a level with no lessons in it —
      // passed exactly as cleanly as one mounting the expected 81 or 95.
      // The floor is the exact level `HomeScreen.tsx`'s own `currentLevel`
      // logic would open for this scenario's progress (`expectedOpenLevel`,
      // mirroring that derivation directly rather than assuming which
      // level a scenario lands on), so a genuine render failure fails
      // loudly instead of reading as an excellent bound.
      const expectedLevel = expectedOpenLevel(scenario.completedLessons, scenario.skippedLessons);
      const floor = lessonCountForLevel(expectedLevel);
      if (n < floor) {
        problems.push(
          `${scenario.name}: only ${n} lesson rows mounted, under the floor of ${floor} — the ` +
            `${expectedLevel} level (the one this progress should open) holds ${floor} lessons, ` +
            `so mounting fewer means rows are missing, not just that the level is small.`
        );
      }
    }

    // A learner can also reach a multi-level-open state by tapping every
    // collapsed level's "tap to open" row, not just by how far they've
    // progressed — the two scenarios above only cover the state on load.
    // Levels are an accordion (`HomeScreen.tsx`'s `openLevel`, a single
    // value, not one flag per level) specifically so this can't accumulate:
    // opening a level closes whichever was open, rather than adding to it.
    // Click every level's own header in turn (by its distinct title, not a
    // generic "first button matching /Expand/" — THE CRITIC reviewing this
    // check found `.first()` always grabs the topmost match in DOM order,
    // so it only ever toggled between the first two levels and never
    // reached Intermediate, the actual largest one) and re-measure after
    // each click, rather than trusting the accordion property from reading
    // the code alone.
    {
      const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
      const url = `http://localhost:${PORT}/Urdu/`;
      await enterAsGuest(page, url);
      await page.waitForTimeout(1200);

      let worst = await countLessonRows(page);
      for (const lvl of LEVEL_ORDER) {
        const title = LEVEL_META[lvl].title;
        const btn = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(title)}\\.`) }).first();
        if ((await btn.count()) === 0) continue;
        await btn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(400);
        const n = await countLessonRows(page);
        worst = Math.max(worst, n);
      }
      counts.push({ name: `tapping every level's header in turn, by identity (worst seen)`, n: worst });
      await page.close();

      if (worst > BOUND) {
        problems.push(
          `tapping every level open in turn: ${worst} lesson rows mounted at some point, over the bound of ` +
            `${BOUND}. Levels used to be independent toggles — a learner curious enough to open all of them ` +
            `reached the full unvirtualized course this way even with the default state fixed.`
        );
      }
      // URD-037: tapping through every level should, at some point, land on
      // the largest one — the worst-seen count should reach exactly
      // `maxLevelLessons`, the same real count the upper bound above is
      // computed from, not just be non-zero. A click that silently fails
      // (a stale locator, a level whose header text stopped matching) would
      // otherwise report a low "worst seen" and pass just as cleanly as a
      // run that genuinely opened every level.
      if (worst < maxLevelLessons) {
        problems.push(
          `tapping every level open in turn: only ${worst} lesson rows mounted at the worst point seen, ` +
            `under the largest level's own ${maxLevelLessons} lessons — some level's header click may have ` +
            `silently failed to open it rather than every level genuinely being reached.`
        );
      }
    }

    await browser.close();

    console.log(`check:path — largest single level is ${maxLevelLessons} of ${ALL_LESSONS.length} lessons.`);
    for (const c of counts) console.log(`  ${c.name}: ${c.n} lesson rows mounted (bound: ${BOUND})`);

    if (problems.length) {
      console.log(`\ncheck:path — ${problems.length} problem${problems.length === 1 ? '' : 's'}\n`);
      for (const p of problems) console.log(`  ${p}\n`);
      process.exitCode = 1;
      return;
    }

    console.log('  Bounded by one course stage, not the whole path, at any point in the course.');
  } finally {
    await server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
