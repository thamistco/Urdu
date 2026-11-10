/* eslint-disable */
/**
 * The app's addresses, read from the router's own config.
 *
 * GitHub Pages has no rewrite rules. Any address without a file of its own is
 * answered with 404.html and the status 404, so /privacy drew the app
 * correctly in a browser while telling every link checker, share preview and
 * app-store review that the page did not exist (QA, 2026-11-10). The privacy
 * policy is the address a store listing has to link to.
 *
 * Pages does answer /privacy with privacy.html, so each address gets a copy of
 * the app's page under its own name. The list comes out of
 * src/navigation/linking.ts, not a copy of it here, so a screen added there
 * gets its page without anyone remembering this file.
 *
 * Two kinds of address:
 *   - fixed (/privacy, /practice): one page each.
 *   - with a parameter (/lesson/:lessonId, /letters/:letterId): one page for
 *     each lesson on the path and each letter. These were first left to the
 *     404 fallback; a shared lesson link then looked dead to anything that is
 *     not a browser. An id that names nothing still answers 404, which is
 *     now the truth. Practice sets built on demand (a topic drill, the daily
 *     review) are not on the path and keep the fallback.
 */

const fs = require('fs');
const path = require('path');

const LINKING = path.join(__dirname, '..', '..', 'src', 'navigation', 'linking.ts');

/** Every path pattern in linking.ts, without the deploy's subpath. */
function patterns(source = fs.readFileSync(LINKING, 'utf8')) {
  const out = [...source.matchAll(/\bat\('([^']*)'\)/g)].map((m) => m[1]);
  if (!out.length) throw new Error(`route-pages: found no routes in ${LINKING}; has the at('…') form changed?`);
  return out;
}

/** Each fixed path: ['sign-in', 'practice', …]. Needs nothing but the source, so the deploy job can call it. */
function fixedRoutes(source) {
  const out = new Set();
  for (const p of patterns(source)) {
    // `letters/:letterId?`: the parameter is optional, so `letters` is an address.
    const fixed = p.replace(/\/:[A-Za-z]+\?$/, '');
    if (!fixed || fixed.includes(':')) continue; // the root has index.html; the rest take a parameter
    out.add(fixed);
  }
  return [...out];
}

/**
 * The values each route parameter can take. A parameter this does not know
 * stops the build: a new kind of address needs someone to say which pages it
 * has, not to be left on the 404 fallback by default.
 */
function idsFor(param) {
  const { load } = require('./load-ts');
  if (param === 'lessonId') return load('src/data/units').ALL_LESSONS.map((l) => l.id);
  if (param === 'letterId') return load('src/data/letters').LETTERS.map((l) => l.id);
  throw new Error(
    `route-pages: linking.ts has a route parameter ":${param}" and nothing here says which pages it has.`
  );
}

/** Each address with a parameter filled in: ['lesson/l-1', …, 'letters/alif', …]. Reads the course, so needs node_modules. */
function parameterRoutes(source) {
  const out = [];
  for (const p of patterns(source)) {
    const m = /^([^:]*)\/:([A-Za-z]+)\??$/.exec(p);
    if (!m) {
      if (p.includes(':'))
        throw new Error(`route-pages: cannot read the route "${p}"; one trailing parameter is all this handles.`);
      continue;
    }
    for (const id of idsFor(m[2])) {
      if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`route-pages: "${id}" is not safe as a file name.`);
      out.push(`${m[1]}/${id}`);
    }
  }
  return out;
}

/** The start of each address that takes a parameter: ['lesson', 'letters']. Needs nothing but the source. */
function parameterPrefixes(source) {
  return patterns(source)
    .map((p) => /^([^:]*)\/:[A-Za-z]+\??$/.exec(p))
    .filter(Boolean)
    .map((m) => m[1]);
}

/** The file, in the export, that lists every address given a page. check-deployed reads it back from the live site. */
const MANIFEST = 'route-pages.json';

module.exports = { fixedRoutes, parameterRoutes, parameterPrefixes, MANIFEST };
