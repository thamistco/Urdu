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
const { fixedRoutes, parameterRoutes, MANIFEST } = require('./lib/route-pages');

const DIST = path.join(__dirname, '..', 'dist');
const index = path.join(DIST, 'index.html');
if (!fs.existsSync(index)) {
  console.error('write-route-pages — no dist/index.html. Run the web export first.');
  process.exit(1);
}

const html = fs.readFileSync(index, 'utf8');
const fixed = fixedRoutes();
const withParameter = parameterRoutes();
for (const r of [...fixed, ...withParameter]) {
  const file = path.join(DIST, `${r}.html`);
  // A real file of that name from the export would be overwritten silently.
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') !== html) {
    console.error(
      `write-route-pages — dist/${r}.html already exists and is not the app's page; refusing to replace it.`
    );
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
fs.writeFileSync(path.join(DIST, MANIFEST), JSON.stringify({ fixed, withParameter }));
const kb = Math.round(((fixed.length + withParameter.length) * Buffer.byteLength(html)) / 1024);
console.log(
  `write-route-pages — ${fixed.length} fixed addresses and ${withParameter.length} lessons and letters have their own page (${kb} KB in all).`
);
