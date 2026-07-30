/**
 * Scoring a traced letter.
 *
 * Kept separate from the drawing surface so it can be measured. The thresholds
 * below are not guesses — `npm run check:trace` simulates a good-faith trace of
 * all 160 letter forms and reports what actually passes.
 *
 * The first version of this scored the single grid cell under the path, and
 * asked for 55% of the glyph's ink to be covered. Both were wrong, in the same
 * way: a person traces the *centreline* of a stroke, while the mask describes
 * its whole *area*. A perfect trace of a thick Nastaliq stroke touches maybe a
 * third of the cells it contains, so a perfect trace failed.
 *
 * So: the finger paints a disc, not a point, and coverage is measured against
 * what a centreline can reach.
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

/** Grow a mask by `radius` cells in every direction. */
export function dilate(mask: Uint8Array, grid: number, radius: number): Uint8Array {
  if (radius <= 0) return mask;
  const out = new Uint8Array(mask.length);
  const r2 = radius * radius;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (!mask[y * grid + x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
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
 * Pass marks.
 *
 * `coverage` is measured against the glyph thinned to what a centreline can
 * reach, so 0.6 means "you went along most of the letter", not "you coloured
 * most of it in". `precision` is measured against the glyph plus a margin, so
 * ordinary wobble is free and only drawing somewhere else costs.
 */
export const NEED_COVERAGE = 0.6;
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
 * `reachable` is the glyph reduced to the cells a centreline can plausibly
 * touch; `tolerant` is the glyph with a margin around it. Both are derived
 * from the shipped mask by `traceTargets` below, once per glyph.
 */
export function scoreTrace(
  strokes: Pt[][],
  side: number,
  grid: number,
  reachable: Uint8Array,
  tolerant: Uint8Array
): TraceScore {
  const painted = paintedCells(strokes, side, grid);

  let reached = 0;
  let onGlyph = 0;
  painted.forEach((i) => {
    if (reachable[i]) reached++;
    if (tolerant[i]) onGlyph++;
  });

  const total = reachable.reduce((n, v) => n + v, 0);
  const coverage = total ? reached / total : 0;
  const precision = painted.size ? onGlyph / painted.size : 0;
  const pass = painted.size > 12 && coverage >= NEED_COVERAGE && precision >= NEED_PRECISION;

  return { coverage, precision, pass };
}

/**
 * The two targets a trace is scored against.
 *
 * `reachable` — the glyph's centreline: the middle of each horizontal and each
 * vertical run of ink. This is the part a finger actually travels through, and
 * measuring coverage against it is the whole fix. Measured against the inked
 * *area* instead, a flawless trace of a thick Nastaliq stroke scored about a
 * third, and — worse — a sloppier trace scored higher than a careful one,
 * because wobbling painted more cells.
 *
 * `tolerant` — the glyph plus a margin, for judging whether the drawing was in
 * the right place at all. Wobble is free; drawing somewhere else is not.
 */
export function traceTargets(mask: Uint8Array, grid: number) {
  return {
    reachable: dilate(centreline(mask, grid), grid, 1),
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
