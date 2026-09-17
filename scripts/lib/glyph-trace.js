/* eslint-disable */
/**
 * Where the pen has to go to trace a letter, read off the screen.
 *
 * Shared, because two drivers now need to trace and the algorithm is subtle
 * enough that two copies would drift: `soak.js`, which traces to get deep into
 * the course, and `playtest.js`, which traces because a beginner's very first
 * screen in this app is a tracing exercise and a playtester that cannot get
 * past it has nothing to report.
 *
 * The first version of the soak harness scribbled across the panel and called
 * the screen unanswerable when the app refused it. The app was right: tracing
 * is graded on coverage *and* precision, and `check:trace` proves a scribble
 * scores 100% coverage at 23% precision and is correctly turned down. A driver
 * that cannot draw is not evidence of a broken exercise.
 */

/**
 * The glyph's pixels, in stroke order, one path per piece of the letter.
 *
 * Parchment is the lightest thing on the pad (measured: lum 220) and the model
 * glyph a tone below it (measured: 193), so 200 separates them.
 *
 * Returns null when there is not enough dark pixel to be a letter, which is the
 * caller's signal that it is not looking at a trace pad at all.
 *
 * Why pieces rather than one path: an Urdu letter is rarely one connected
 * shape. ش is a body and three dots; ض is a body and one. A single
 * nearest-neighbour walk crosses the gap between them, and the app scores a
 * trace on coverage *and* precision — the line drawn through empty parchment
 * to reach a dot is painted cells that are not on the glyph. Worse, the walk
 * used to stop at 220 points, so on a big form it never reached the dots at
 * all.
 *
 * Measured against the real app: careful traces were accepted 13 times out of
 * 50, and 0 of 7 in the lesson that teaches seen, sheen, swaad and zwaad —
 * every one of them dotted. `check:trace` drives all 160 forms with a
 * simulated hand that walks each piece and passes 160 of 160, so the exercise
 * was calibrated and this file was the thing that could not draw.
 */
function glyphStrokes(png) {
  const step = 4;
  const pts = [];
  for (let y = 2; y < png.height - 2; y += step) {
    for (let x = 2; x < png.width - 2; x += step) {
      const i = (png.width * y + x) << 2;
      const lum = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
      if (lum < 200) pts.push({ x, y });
    }
  }
  if (pts.length < 12) return null;

  // Pieces: points within a sample or so of each other are the same piece of
  // the letter. A diagonal neighbour on the sampling grid is 5.7px away, so
  // the radius has to clear that and stay well under the gap to a dot.
  const RADIUS2 = (step * 2.2) ** 2;
  const unclaimed = pts.slice();
  const pieces = [];
  while (unclaimed.length) {
    const piece = [unclaimed.pop()];
    for (let i = 0; i < piece.length; i++) {
      for (let j = unclaimed.length - 1; j >= 0; j--) {
        const d = (unclaimed[j].x - piece[i].x) ** 2 + (unclaimed[j].y - piece[i].y) ** 2;
        if (d <= RADIUS2) piece.push(unclaimed.splice(j, 1)[0]);
      }
    }
    pieces.push(piece);
  }

  // Body first, dots after, the way a hand writes it.
  pieces.sort((a, b) => b.length - a.length);

  const strokes = [];
  for (const piece of pieces) {
    if (piece.length < 2) {
      // A single sample is still part of the letter — a small dot at this
      // sampling step — and dropping it costs the coverage it carries.
      strokes.push(piece.slice());
      continue;
    }
    const rest = piece.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const path = [rest.shift()];
    while (rest.length) {
      const last = path[path.length - 1];
      let bi = 0;
      let bd = Infinity;
      for (let i = 0; i < rest.length; i++) {
        const d = (rest[i].x - last.x) ** 2 + (rest[i].y - last.y) ** 2;
        if (d < bd) [bd, bi] = [d, i];
      }
      path.push(rest.splice(bi, 1)[0]);
    }
    // The app interpolates between the points it is given, so a thinned path
    // covers exactly as much as the full one at a fraction of the mouse moves.
    const LIMIT = 140;
    if (path.length <= LIMIT) strokes.push(path);
    else {
      const k = Math.ceil(path.length / LIMIT);
      const thin = path.filter((_, i) => i % k === 0);
      if (thin[thin.length - 1] !== path[path.length - 1]) thin.push(path[path.length - 1]);
      strokes.push(thin);
    }
  }
  return strokes;
}

/** The letter's largest piece alone. Kept for callers that draw one stroke. */
function glyphStroke(png) {
  const strokes = glyphStrokes(png);
  return strokes ? strokes[0] : null;
}

module.exports = { glyphStroke, glyphStrokes };
