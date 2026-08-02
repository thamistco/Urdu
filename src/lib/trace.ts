/**
 * Scoring a traced letter.
 *
 * Kept separate from the drawing surface so it can be measured. The thresholds
 * below are not guesses — `npm run check:trace` simulates a good-faith trace of
 * all 160 letter forms and reports what actually passes.
 *
 * The first version scored the single grid cell under the path and asked for 55%
 * of the glyph's ink. Both were wrong the same way: a person traces the
 * *centreline* of a stroke while the mask describes its whole *area*, so a
 * perfect trace of a thick Nastaliq letter touched maybe a third of it and
 * failed. The finger became a disc, and coverage moved to the centreline.
 *
 * That was most of the way there and still asked for the thickness, which is
 * what a learner reported: it was easier to pass by colouring a stroke in than
 * by drawing its shape. The reason is that the centreline is the union of two
 * midline families — the middle of every horizontal run of ink and of every
 * vertical run — and in a heavy stroke those are two paths a few cells apart.
 * Scoring cell against cell asked for both of them.
 *
 * So the drawing is grown rather than the target, and coverage asks whether a
 * line came *within* `NEAR_CELLS` of each part of the skeleton. Offset across a
 * stroke is forgiven; a missing limb or dot is not. Shape is what is left, which
 * is what the exercise was always meant to teach.
 */

export type Pt = { x: number; y: number };

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decode a packed mask. Written out rather than using atob, which React
 *  Native does not provide on every engine. */
export function decodeMask(bits: string, grid: number): Uint8Array {
  const cells = new Uint8Array(grid * grid);
  let bit = 0;
  for (let i = 0; i < bits.length; i += 4) {
    const n =
      (B64.indexOf(bits[i]) << 18) |
      (B64.indexOf(bits[i + 1]) << 12) |
      ((bits[i + 2] === '=' ? 0 : B64.indexOf(bits[i + 2])) << 6) |
      (bits[i + 3] === '=' ? 0 : B64.indexOf(bits[i + 3]));
    for (const b of [(n >> 16) & 255, (n >> 8) & 255, n & 255]) {
      for (let k = 0; k < 8; k++) if (bit < cells.length) cells[bit++] = (b >> k) & 1;
    }
  }
  return cells;
}

/**
 * Grow a mask by `radius` cells in every direction.
 *
 * The offsets step in whole cells while the distance test uses the real radius,
 * so a fractional radius means what it says. Stepping `dy` by the radius itself
 * looked equivalent and was not: at 1.5 the offsets became -1.5, -0.5, 0.5, 1.5,
 * every index landed between cells, and the function quietly returned an empty
 * mask. Nothing that shipped used a fraction, but `NEAR_CELLS` is a dial someone
 * will reasonably turn to 2.5 one day.
 */
export function dilate(mask: Uint8Array, grid: number, radius: number): Uint8Array {
  if (radius <= 0) return mask;
  const out = new Uint8Array(mask.length);
  const r2 = radius * radius;
  const step = Math.ceil(radius);
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (!mask[y * grid + x]) continue;
      for (let dy = -step; dy <= step; dy++) {
        for (let dx = -step; dx <= step; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const ny = y + dy,
            nx = x + dx;
          if (ny < 0 || nx < 0 || ny >= grid || nx >= grid) continue;
          out[ny * grid + nx] = 1;
        }
      }
    }
  }
  return out;
}

/**
 * How wide a finger is, in grid cells. The drawn line is about this wide on
 * screen too, so what is scored is what the learner can see themselves cover.
 */
export const BRUSH_CELLS = 1.6;

/**
 * How far from the letter's skeleton a line still counts as being on it.
 *
 * This is the number that decides whether the exercise is about **shape** or
 * about **thickness**, and it used to be effectively zero.
 *
 * The skeleton is built from the midpoint of every horizontal run of ink and
 * every vertical run. In a thick Nastaliq stroke those are two different paths a
 * few cells apart, so scoring cell-by-cell asked the learner to travel both of
 * them — which is to say, to colour the stroke in. One honest line down the
 * middle of a stroke covered about half of what was demanded of it.
 *
 * Measuring "is there a drawn line within `NEAR_CELLS` of this part of the
 * skeleton" separates the two ideas. Perpendicular offset inside a stroke is
 * forgiven, because both midlines are within reach of one pass. Missing a limb,
 * a dot or the far end of a curve is not, because nothing drawn is anywhere near
 * those cells. Shape is what remains.
 *
 * On a 40x40 grid, 2 is about half the thickness of a heavy stroke. It was
 * chosen by sweeping it against `NEED_COVERAGE` over all 160 forms: it is the
 * only pairing where one pass down the middle passes (97%) and half a letter
 * still fails (3%). Wider forgives a half-drawn letter; narrower goes back to
 * demanding the thickness. `check:trace` fails if either end of that moves.
 */
export const NEAR_CELLS = 2;

/**
 * Pass marks.
 *
 * `coverage` is the share of the letter's skeleton the drawing came near, so 0.7
 * means "you went along most of the letter", not "you coloured most of it in".
 * It reads as a stricter number than the 0.6 it replaces and is far easier to
 * meet, because what is being counted changed: distance to the skeleton, rather
 * than exact overlap with a doubled midline.
 * `precision` is measured against the glyph plus a margin, so ordinary wobble is
 * free and only drawing somewhere else costs.
 */
export const NEED_COVERAGE = 0.7;
export const NEED_PRECISION = 0.5;

/** Cells a stroke set paints, given a brush radius. */
function paintedCells(strokes: Pt[][], side: number, grid: number): Set<number> {
  const cell = side / grid;
  const painted = new Set<number>();
  const brush = BRUSH_CELLS;
  const r = Math.ceil(brush);
  const r2 = brush * brush;

  const stamp = (p: Pt) => {
    const cx = p.x / cell;
    const cy = p.y / cell;
    const gx0 = Math.floor(cx),
      gy0 = Math.floor(cy);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const gx = gx0 + dx,
          gy = gy0 + dy;
        if (gx < 0 || gy < 0 || gx >= grid || gy >= grid) continue;
        // distance from the path to the centre of this cell
        const ddx = gx + 0.5 - cx,
          ddy = gy + 0.5 - cy;
        if (ddx * ddx + ddy * ddy > r2) continue;
        painted.add(gy * grid + gx);
      }
    }
  };

  for (const stroke of strokes) {
    for (let i = 0; i < stroke.length; i++) {
      stamp(stroke[i]);
      const next = stroke[i + 1];
      if (!next) continue;
      // Interpolate: a fast drag reports points several cells apart.
      const steps = Math.ceil(Math.hypot(next.x - stroke[i].x, next.y - stroke[i].y) / (cell / 2));
      for (let s = 1; s < steps; s++) {
        stamp({
          x: stroke[i].x + ((next.x - stroke[i].x) * s) / steps,
          y: stroke[i].y + ((next.y - stroke[i].y) * s) / steps,
        });
      }
    }
  }
  return painted;
}

export type TraceScore = {
  /** how much of the letter the stroke went along, 0..1 */
  coverage: number;
  /** how much of the stroke was on the letter, 0..1 */
  precision: number;
  pass: boolean;
};

/**
 * Score a trace.
 *
 * `skeleton` is the glyph thinned to the path through the middle of its strokes;
 * `tolerant` is the glyph with a margin around it. Both are derived from the
 * shipped mask by `traceTargets` below, once per glyph.
 *
 * The two questions are deliberately asymmetric. Coverage asks *of the letter*,
 * "was something drawn near here" — so it is measured by growing the drawing and
 * intersecting it with the skeleton. Precision asks *of the drawing*, "was this
 * on the letter" — measured the other way round. Coverage alone would pass a
 * scribble; precision alone would pass one confident line down the middle.
 */
export function scoreTrace(
  strokes: Pt[][],
  side: number,
  grid: number,
  skeleton: Uint8Array,
  tolerant: Uint8Array
): TraceScore {
  const painted = paintedCells(strokes, side, grid);

  // Grow the drawing, not the target: a line has to pass *near* each part of the
  // skeleton, not through the exact cells of both of its midlines.
  const drawn = new Uint8Array(grid * grid);
  painted.forEach((i) => (drawn[i] = 1));
  const near = dilate(drawn, grid, NEAR_CELLS);

  let reached = 0;
  let total = 0;
  for (let i = 0; i < skeleton.length; i++) {
    if (!skeleton[i]) continue;
    total++;
    if (near[i]) reached++;
  }

  let onGlyph = 0;
  painted.forEach((i) => {
    if (tolerant[i]) onGlyph++;
  });

  const coverage = total ? reached / total : 0;
  const precision = painted.size ? onGlyph / painted.size : 0;
  const pass = painted.size > 12 && coverage >= NEED_COVERAGE && precision >= NEED_PRECISION;

  return { coverage, precision, pass };
}

/**
 * The two targets a trace is scored against.
 *
 * `skeleton` — the glyph thinned to the middle of its strokes. This is the shape
 * of the letter with its weight taken off, and it is what coverage is measured
 * against. Measured against the inked *area* instead, a flawless trace of a
 * thick Nastaliq stroke scored about a third, and — worse — a sloppier trace
 * scored higher than a careful one, because wobbling painted more cells.
 *
 * It is passed un-dilated now. It used to be grown by a cell, which sounds
 * forgiving and was the opposite: growing the *target* adds cells that must be
 * covered, so a thicker target is a stricter one. The tolerance belongs on the
 * drawing instead — see `NEAR_CELLS`.
 *
 * `tolerant` — the glyph plus a margin, for judging whether the drawing was in
 * the right place at all. Wobble is free; drawing somewhere else is not.
 */
export function traceTargets(mask: Uint8Array, grid: number) {
  return {
    skeleton: centreline(mask, grid),
    tolerant: dilate(mask, grid, 2),
  };
}

/**
 * Thin a glyph to the path through the middle of its strokes.
 *
 * Taking the midpoint of every horizontal run catches vertical strokes, and
 * the midpoint of every vertical run catches horizontal ones; together they
 * follow a letter round its curves without needing a real skeletonisation.
 */
export function centreline(mask: Uint8Array, grid: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  const at = (x: number, y: number) => mask[y * grid + x];

  for (let y = 0; y < grid; y++) {
    let run: number[] = [];
    for (let x = 0; x <= grid; x++) {
      if (x < grid && at(x, y)) run.push(x);
      else if (run.length) {
        out[y * grid + run[(run.length / 2) | 0]] = 1;
        run = [];
      }
    }
  }
  for (let x = 0; x < grid; x++) {
    let run: number[] = [];
    for (let y = 0; y <= grid; y++) {
      if (y < grid && at(x, y)) run.push(y);
      else if (run.length) {
        out[run[(run.length / 2) | 0] * grid + x] = 1;
        run = [];
      }
    }
  }
  return out;
}
