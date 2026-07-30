/**
 * The build configuration — one source of truth, for every environment.
 *
 * ## Why this file exists
 *
 * The deploy broke four times in a row, and every time the cause was the same
 * shape: **CI built a different artifact from the one anybody built locally.**
 *
 * The site is served from a subpath (`https://<user>.github.io/Urdu/`), so the
 * bundle has to be built with `experiments.baseUrl = '/Urdu'` or every asset
 * request 404s. That value was injected by a `node -e` one-liner inside the
 * workflow YAML, which rewrote `app.json` on disk mid-job. Four consequences,
 * all of which bit:
 *
 *  1. **Local builds never had it.** So a check could pass on this machine and
 *     fail in CI for a reason invisible in the source — which is exactly what
 *     happened to `check:scenery`: it served the export from `/`, right
 *     locally, wrong in CI, and reported the symptom ("could not find the
 *     background SVG") rather than the cause.
 *  2. **Every browser-driven check had to cope with the base path itself**, so
 *     each grew its own static server, and each got it wrong separately.
 *  3. **The build config lived in two places** — this file's data in app.json,
 *     and one crucial field in a shell string inside a YAML comment block,
 *     where nothing type-checks it and nobody reads it.
 *  4. **A failed step left the working tree dirty**, because the rewrite was a
 *     side effect on a tracked file with no guaranteed restore.
 *
 * Expo loads `app.config.js` in preference to `app.json` and lets it read
 * app.json as its base, so the fix is to make the one varying field a function
 * of the environment instead of a mutation of the repo. CI now sets an
 * environment variable and changes no files; `npm run build:web` is the single
 * way to produce a bundle, and it behaves identically wherever it is run.
 *
 * ## The knobs
 *
 * - `HARF_BASE_URL` — the subpath the app is served from, e.g. `/Urdu`. Empty
 *   (the default) means served from the domain root, which is what `expo start`
 *   and a local `dist/` want.
 * - `HARF_BUILD_SHA` — the commit being built. Stamped into the page so a
 *   deploy can be *verified* rather than assumed; see `check-deployed.js`.
 *
 * Nothing else belongs here. Content, colour and copy stay where they live.
 */

const base = require('./app.json');

/** Normalise a base path to `''` or `/thing` — no trailing slash, one leading. */
function normaliseBaseUrl(raw) {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const baseUrl = normaliseBaseUrl(process.env.HARF_BASE_URL);
const buildSha = (process.env.HARF_BUILD_SHA || '').trim();

module.exports = () => ({
  ...base.expo,
  experiments: {
    ...base.expo.experiments,
    // Only set when non-empty: Expo treats the presence of the key as intent,
    // and `baseUrl: ''` is not the same as no baseUrl for every code path.
    ...(baseUrl ? { baseUrl } : {}),
  },
  extra: {
    ...(base.expo.extra || {}),
    buildSha,
  },
});
