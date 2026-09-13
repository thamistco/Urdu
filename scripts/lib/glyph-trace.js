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
 * The glyph's pixels, in stroke order: nearest neighbour from the topmost
 * point, so the drawn line stays inside the letter instead of jumping across
 * gaps. Parchment is the lightest thing on the pad (measured: lum 220) and the
 * model glyph a tone below it (measured: 193), so 200 separates them.
 *
 * Returns null when there is not enough dark pixel to be a letter, which is the
 * caller's signal that it is not looking at a trace pad at all.
 */
function glyphStroke(png) {
  const pts = [];
  for (let y = 2; y < png.height - 2; y += 4) {
    for (let x = 2; x < png.width - 2; x += 4) {
      const i = (png.width * y + x) << 2;
      const lum = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
      if (lum < 200) pts.push({ x, y });
    }
  }
  if (pts.length < 12) return null;
  pts.sort((a, b) => a.y - b.y || a.x - b.x);
  const stroke = [pts.shift()];
  while (pts.length && stroke.length < 220) {
    const last = stroke[stroke.length - 1];
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = (pts[i].x - last.x) ** 2 + (pts[i].y - last.y) ** 2;
      if (d < bd) [bd, bi] = [d, i];
    }
    stroke.push(pts.splice(bi, 1)[0]);
  }
  return stroke;
}

module.exports = { glyphStroke };
