/* eslint-disable */
/**
 * Prove the live site is serving the commit we just built.
 *
 * A green pipeline is not a deploy. Twice in one afternoon the answer to "is it
 * live?" was "the workflow said success", and twice that was wrong — once
 * because the build failed before the upload step, once because the person
 * asking had been told it was live without anyone looking. The only honest
 * answer comes from fetching the deployed URL and reading what it actually
 * serves.
 *
 * `app.config.js` stamps `HARF_BUILD_SHA` into the bundle, and
 * `inject-web-meta.js` writes it into the HTML as a meta tag. This fetches the
 * page and asserts that tag matches the commit under test. If Pages is still
 * serving the previous build — CDN lag, a skipped upload, a deploy that
 * reported success and published nothing — this says so in those words.
 *
 *   SITE_URL=https://user.github.io/Urdu/ HARF_BUILD_SHA=$GITHUB_SHA \
 *     node scripts/check-deployed.js
 *
 * GitHub Pages can take a little while to swap the CDN copy, so this retries
 * with a backoff before failing. A stale read is the expected transient state,
 * not an error, right up until it stops resolving.
 */

const ATTEMPTS = 6;
const FIRST_WAIT_MS = 10_000;

const url = (process.env.SITE_URL || '').trim();
const expected = (process.env.HARF_BUILD_SHA || '').trim();

if (!url) {
  console.log('check:deployed — SITE_URL not set, nothing to verify. Skipping.');
  process.exit(0);
}
if (!expected) {
  console.error('check:deployed — HARF_BUILD_SHA is not set, so there is nothing to compare against.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pull the stamp out of the served HTML. Returns null if the tag is absent. */
function shaFrom(html) {
  const m = html.match(/<meta\s+name="harf:build"\s+content="([0-9a-f]+)"/i);
  return m ? m[1] : null;
}

(async () => {
  let last = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      // Cache-bust: Pages sits behind a CDN, and the question is what the
      // origin has now, not what an edge cached a minute ago.
      const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (!res.ok) {
        last = `HTTP ${res.status}`;
      } else {
        const html = await res.text();
        const served = shaFrom(html);
        if (served === null) {
          last = 'the page has no harf:build stamp';
        } else if (served === expected.slice(0, served.length)) {
          console.log(`check:deployed — ${url} is serving ${served}, which is this commit. Live and verified.`);
          process.exit(0);
        } else {
          last = `serving ${served}, expected ${expected.slice(0, served.length)}`;
        }
      }
    } catch (e) {
      last = e.message;
    }
    if (attempt < ATTEMPTS) {
      const wait = FIRST_WAIT_MS * attempt;
      console.log(`  attempt ${attempt}/${ATTEMPTS}: ${last} — retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }

  console.error(
    `check:deployed — after ${ATTEMPTS} attempts, ${url} is not serving this commit.\n` +
      `  last result: ${last}\n` +
      `  The pipeline reported success, so the build is fine and the publish is not.\n` +
      `  Check the deploy job and the Pages settings before telling anyone it is live.`
  );
  process.exit(1);
})();
