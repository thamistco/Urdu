/**
 * Is the tracing exercise passable?
 *
 * The first version was not. It scored the single grid cell under the finger
 * and demanded 55% of the glyph's ink, which is a contradiction: a person
 * traces the *centreline* of a stroke while the mask describes its *area*, so
 * a perfect trace of a thick Nastaliq letter covered barely a third of it and
 * was told to try again.
 *
 * The bug survived my own test because the test drove the pad from the mask's
 * own coordinates — it walked every inked cell, which no hand does. So this
 * simulates a hand instead: it thins each glyph to a centreline, walks it in a
 * plausible order, and adds wobble. Three grades of trace are run against all
 * 160 letter forms, and the thresholds have to let the good ones through and
 * keep the bad ones out.
 *
 * Run with:  npm run check:trace
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

function load(rel) {
  const js = ts.transpileModule(fs.readFileSync(path.join(ROOT, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
  return mod.exports;
}

const { GLYPH_MASKS, MASK_GRID } = load('src/data/glyphMasks.ts');
const { decodeMask, traceTargets, scoreTrace, NEED_COVERAGE, NEED_PRECISION } = load('src/lib/trace.ts');

const SIDE = 340; // the card on a typical phone, in px
const CELL = SIDE / MASK_GRID;

/**
 * Thin a glyph to the cells a finger would travel through: the middle of each
 * horizontal run and each vertical run. Cheap, and close enough to how someone
 * actually draws a stroke.
 */
function centreline(mask) {
  const pts = new Set();
  const at = (x, y) => mask[y * MASK_GRID + x];
  for (let y = 0; y < MASK_GRID; y++) {
    let run = [];
    for (let x = 0; x <= MASK_GRID; x++) {
      if (x < MASK_GRID && at(x, y)) run.push(x);
      else if (run.length) {
        pts.add(`${run[(run.length / 2) | 0]},${y}`);
        run = [];
      }
    }
  }
  for (let x = 0; x < MASK_GRID; x++) {
    let run = [];
    for (let y = 0; y <= MASK_GRID; y++) {
      if (y < MASK_GRID && at(x, y)) run.push(y);
      else if (run.length) {
        pts.add(`${x},${run[(run.length / 2) | 0]}`);
        run = [];
      }
    }
  }
  return [...pts].map((s) => {
    const [x, y] = s.split(',').map(Number);
    return { x, y };
  });
}

/** A hand cuts corners; smooth the path so the simulation is not simply
 *  replaying the target it is scored against. */
function smooth(stroke, window) {
  if (stroke.length < window) return stroke;
  return stroke.map((_, i) => {
    let x = 0,
      y = 0,
      n = 0;
    for (let k = -window; k <= window; k++) {
      const p = stroke[i + k];
      if (!p) continue;
      x += p.x;
      y += p.y;
      n++;
    }
    return { x: x / n, y: y / n };
  });
}

/** Order points into a path the way a hand would: nearest neighbour, lifting
 *  the pen when the next point is far away (dots, disjoint strokes). */
function toStrokes(pts, jitter, rng) {
  const left = new Set(pts.map((p) => `${p.x},${p.y}`));
  const strokes = [];
  let cur = pts.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x < a.x) ? b : a), pts[0]);
  let stroke = [];
  while (left.size) {
    left.delete(`${cur.x},${cur.y}`);
    stroke.push({
      x: (cur.x + 0.5 + (rng() - 0.5) * 2 * jitter) * CELL,
      y: (cur.y + 0.5 + (rng() - 0.5) * 2 * jitter) * CELL,
    });
    let best = null,
      bd = Infinity;
    left.forEach((k) => {
      const [x, y] = k.split(',').map(Number);
      const d = (x - cur.x) ** 2 + (y - cur.y) ** 2;
      if (d < bd) {
        bd = d;
        best = { x, y };
      }
    });
    if (!best) break;
    if (bd > 16) {
      strokes.push(stroke);
      stroke = [];
    } // pen lift
    cur = best;
  }
  if (stroke.length) strokes.push(stroke);
  return strokes.map((st) => smooth(st, 2));
}

/** A deterministic RNG so the report is the same every run. */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const GRADES = [
  { name: 'careful trace', jitter: 0.4, want: 'pass' },
  { name: 'sloppy trace', jitter: 1.1, want: 'pass' },
  { name: 'half the letter', jitter: 0.4, want: 'fail', half: true },
];

let failures = 0;
console.log(`thresholds: coverage ≥ ${NEED_COVERAGE}, precision ≥ ${NEED_PRECISION}\n`);

for (const grade of GRADES) {
  const rng = makeRng(12345);
  let passed = 0,
    n = 0;
  let worstCov = 1,
    worstKey = '';
  for (const [key, entry] of Object.entries(GLYPH_MASKS)) {
    const mask = decodeMask(entry[0], MASK_GRID);
    const targets = traceTargets(mask, MASK_GRID);
    let pts = centreline(mask);
    if (grade.half) pts = pts.slice(0, Math.ceil(pts.length / 2));
    if (pts.length < 3) continue;
    const strokes = toStrokes(pts, grade.jitter, rng);
    const r = scoreTrace(strokes, SIDE, MASK_GRID, targets.reachable, targets.tolerant);
    n++;
    if (r.pass) passed++;
    if (grade.want === 'pass' && r.coverage < worstCov) {
      worstCov = r.coverage;
      worstKey = key;
    }
  }
  const rate = (passed / n) * 100;
  const ok = grade.want === 'pass' ? rate >= 95 : rate <= 5;
  if (!ok) failures++;
  console.log(
    `${grade.name.padEnd(18)} ${passed}/${n} pass (${rate.toFixed(0)}%)  ` +
      `want ${grade.want === 'pass' ? '≥95%' : '≤5%'}  ${ok ? 'ok' : 'PROBLEM'}` +
      (grade.want === 'pass' ? `   worst: ${worstKey} at ${(worstCov * 100).toFixed(0)}% coverage` : '')
  );
}

// a scribble that fills the card must still be refused
{
  const key = Object.keys(GLYPH_MASKS)[0];
  const mask = decodeMask(GLYPH_MASKS[key][0], MASK_GRID);
  const targets = traceTargets(mask, MASK_GRID);
  const stroke = [];
  for (let row = 0; row * 6 < SIDE; row++) {
    const y = row * 6;
    const xs = row % 2 ? [SIDE - 4, 4] : [4, SIDE - 4];
    for (let t = 0; t <= 1; t += 0.05) stroke.push({ x: xs[0] + (xs[1] - xs[0]) * t, y });
  }
  const r = scoreTrace([stroke], SIDE, MASK_GRID, targets.reachable, targets.tolerant);
  const ok = !r.pass;
  if (!ok) failures++;
  console.log(
    `${'scribble'.padEnd(18)} coverage ${(r.coverage * 100).toFixed(0)}% · ` +
      `precision ${(r.precision * 100).toFixed(0)}% → ${r.pass ? 'PASSES (PROBLEM)' : 'refused, ok'}`
  );
}

console.log('');
if (failures) {
  console.log(`${failures} of the grades behave wrongly — the exercise is not calibrated.`);
  process.exit(1);
}
console.log('tracing is calibrated: honest attempts pass, half-drawn and scribbled ones do not');
