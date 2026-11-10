/* eslint-disable */
/**
 * Give each of the app's fixed addresses a page of its own, so GitHub Pages
 * answers it with 200 instead of 404. See scripts/lib/route-pages.js for why.
 *
 * Run after the web export and web:meta, which write dist/index.html:
 *   node scripts/write-route-pages.js
 */

const fs = require('fs');
const path = require('path');
const { fixedRoutes } = require('./lib/route-pages');

const DIST = path.join(__dirname, '..', 'dist');
const index = path.join(DIST, 'index.html');
if (!fs.existsSync(index)) {
  console.error('write-route-pages — no dist/index.html. Run the web export first.');
  process.exit(1);
}

const html = fs.readFileSync(index, 'utf8');
const routes = fixedRoutes();
for (const r of routes) {
  const file = path.join(DIST, `${r}.html`);
  // A real file of that name from the export would be overwritten silently.
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') !== html) {
    console.error(`write-route-pages — dist/${r}.html already exists and is not the app's page; refusing to replace it.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
console.log(`write-route-pages — ${routes.length} addresses have their own page: ${routes.join(', ')}.`);
