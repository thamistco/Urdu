/* eslint-disable */
/**
 * The app's fixed addresses, read from the router's own config.
 *
 * GitHub Pages has no rewrite rules. Any address without a file of its own is
 * answered with 404.html and the status 404, so /privacy drew the app
 * correctly in a browser while telling every link checker, share preview and
 * app-store review that the page did not exist (QA, 2026-11-10). The privacy
 * policy is the address a store listing has to link to.
 *
 * Pages does answer /privacy with privacy.html, so each fixed address gets a
 * copy of the app's page under its own name. The list comes out of
 * src/navigation/linking.ts, not a copy of it here, so a screen added there
 * gets its page without anyone remembering this file.
 *
 * Addresses with a parameter (/lesson/:lessonId, /letters/:letterId) are left
 * to the 404 fallback: there are hundreds, and they open correctly in a
 * browser either way. The bare /letters is fixed, so it gets a page.
 */

const fs = require('fs');
const path = require('path');

const LINKING = path.join(__dirname, '..', '..', 'src', 'navigation', 'linking.ts');

/** Each fixed path in linking.ts, without the deploy's subpath: ['sign-in', 'practice', …]. */
function fixedRoutes(source = fs.readFileSync(LINKING, 'utf8')) {
  const out = new Set();
  for (const [, p] of source.matchAll(/\bat\('([^']*)'\)/g)) {
    // `letters/:letterId?`: the parameter is optional, so `letters` is an address.
    const fixed = p.replace(/\/:[A-Za-z]+\?$/, '');
    if (!fixed || fixed.includes(':')) continue; // the root has index.html; the rest take a parameter
    out.add(fixed);
  }
  if (!out.size) throw new Error(`route-pages: found no routes in ${LINKING}; has the at('…') form changed?`);
  return [...out];
}

module.exports = { fixedRoutes };
