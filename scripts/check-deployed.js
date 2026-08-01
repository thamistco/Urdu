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
 *
 * It reports two different failures, and the difference is the point. If it
 * *read* the page and the stamp disagreed, the publish is genuinely broken and
 * it says so. If it never managed to read the page — blocked host, DNS, a
 * non-2xx — it has observed nothing about the publish and says only that. The
 * first version of this script made the strong claim in both cases and was
 * caught accusing a perfectly good deploy from inside a sandbox that could not
 * reach the site.
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

/**
 * One attempt at reading the stamp.
 *
 * Returns `{ ok: true }` if this commit is live, otherwise a reason and — the
 * part that matters — a `kind` saying which *sort* of failure it was:
 *
 *   'read'        we fetched the page and it disagreed with us
 *   'unreachable' we never got to read the page at all
 *
 * Those two justify completely different sentences, and collapsing them is a
 * bug this script shipped with: behind a proxy that blocks the site, every
 * attempt came back HTTP 403 and it announced that the publish was broken. It
 * wasn't. Nothing had been observed about the publish either way. A check that
 * accuses on no evidence is as bad as one that passes on no evidence, because
 * both teach you to stop believing it.
 */
async function probe() {
  try {
    // Cache-bust: Pages sits behind a CDN, and the question is what the
    // origin has now, not what an edge cached a minute ago.
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    // A non-2xx is the origin refusing to hand over the page — that is a
    // failure to read it, not a reading of a stale page.
    if (!res.ok) return { kind: 'unreachable', why: `HTTP ${res.status}` };

    const html = await res.text();
    const served = shaFrom(html);
    if (served === null) return { kind: 'read', why: 'the page has no harf:build stamp' };
    if (served === expected.slice(0, served.length)) return { ok: true, served };
    return { kind: 'read', why: `serving ${served}, expected ${expected.slice(0, served.length)}` };
  } catch (e) {
    return { kind: 'unreachable', why: e.message };
  }
}

/** The verdict, worded to match what was actually observed. */
function fail(kind, why) {
  if (kind === 'read') {
    console.error(
      `check:deployed — after ${ATTEMPTS} attempts, ${url} is not serving this commit.\n` +
        `  last result: ${why}\n` +
        `  The page was read and it disagreed, so the build is fine and the publish is not.\n` +
        `  Check the deploy job and the Pages settings before telling anyone it is live.`
    );
    process.exit(1);
  }

  // Never read the page. Say only that, and nothing about the deploy.
  const lines = [
    `check:deployed — could not read ${url} after ${ATTEMPTS} attempts.`,
    `  last result: ${why}`,
    `  This says nothing about the deploy: the page was never fetched, so the`,
    `  commit it serves is still unknown. A sandbox or proxy that blocks the`,
    `  site looks exactly like this.`,
  ];
  // In CI the site is reachable, so failing to reach it is a real outage worth
  // going red for. Anywhere else, an unreachable host is a fact about the
  // machine, and turning the pipeline red for it trains people to ignore it.
  if (process.env.CI) {
    console.error(lines.join('\n'));
    process.exit(1);
  }
  console.log(lines.join('\n'));
  process.exit(0);
}

(async () => {
  let last = { kind: 'unreachable', why: 'no attempt made' };
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const result = await probe();
    if (result.ok) {
      console.log(`check:deployed — ${url} is serving ${result.served}, which is this commit. Live and verified.`);
      process.exit(0);
    }
    last = result;
    if (attempt < ATTEMPTS) {
      const wait = FIRST_WAIT_MS * attempt;
      console.log(`  attempt ${attempt}/${ATTEMPTS}: ${last.why} — retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  fail(last.kind, last.why);
})();
