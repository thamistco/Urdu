/* eslint-disable */
/**
 * Give each of the app's addresses a page of its own, so GitHub Pages answers
 * it with 200 instead of 404. See scripts/lib/route-pages.js for why.
 *
 * Also writes route-pages.json, the list of what was given a page. The deploy
 * job has no node_modules and cannot read the course, so check-deployed
 * fetches that list from the live site and holds every address in it to 200.
 *
 * Run after the web export and web:meta, which write dist/index.html:
 *   node scripts/write-route-pages.js
 */

const fs = require('fs');
const path = require('path');
const { fixedRoutes, parameterRoutes, parameterPrefixes, MANIFEST } = require('./lib/route-pages');

const DIST = path.join(__dirname, '..', 'dist');
const index = path.join(DIST, 'index.html');
if (!fs.existsSync(index)) {
  console.error('write-route-pages — no dist/index.html. Run the web export first.');
  process.exit(1);
}

const html = fs.readFileSync(index, 'utf8');
const fixed = fixedRoutes();
const withParameter = parameterRoutes();
/**
 * An address that is a page and also a folder: /letters is the Letter Lab,
 * and letters/ holds a page for each letter. Pages answers /letters from
 * letters.html or by sending the browser to /letters/, and which it does is
 * its own business, seen by nobody here (second check, 2026-11-10). So the
 * folder gets the page as its index too, and either way the Lab opens.
 */
const folders = parameterPrefixes()
  .filter((p) => fixed.includes(p))
  .map((p) => `${p}/`);

const write = (rel) => {
  const file = path.join(DIST, rel);
  // A real file of that name from the export would be overwritten silently.
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') !== html) {
    console.error(`write-route-pages — dist/${rel} already exists and is not the app's page; refusing to replace it.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};
for (const r of [...fixed, ...withParameter]) write(`${r}.html`);
for (const f of folders) write(`${f}index.html`);

fs.writeFileSync(path.join(DIST, MANIFEST), JSON.stringify({ fixed, withParameter, folders }));
const pages = fixed.length + withParameter.length + folders.length;
console.log(
  `write-route-pages — ${fixed.length} fixed addresses and ${withParameter.length} lessons and letters have their own page (${Math.round((pages * Buffer.byteLength(html)) / 1024)} KB in all).`
);
