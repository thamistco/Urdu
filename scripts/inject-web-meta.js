/* eslint-disable */
/**
 * Put a description and a share card into the exported web page.
 *
 * Expo's web export writes a `<title>` and nothing else — no description, no
 * Open Graph, no Twitter card. So the hosted app was shipping with no summary
 * for a search engine to show, and a link to it pasted into a message rendered
 * as a bare URL with no picture and no text. For an app whose whole problem is
 * getting someone to click, that is the click being thrown away.
 *
 * `app.json` already holds the name and description; this is only about getting
 * them into the HTML the browser actually receives. Nothing here is invented —
 * if a field is missing from app.json, the tag is left out rather than guessed.
 *
 *   node scripts/inject-web-meta.js [dist]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, process.argv[2] || 'dist');
const INDEX = path.join(DIST, 'index.html');

if (!fs.existsSync(INDEX)) {
  console.error(`No ${path.relative(ROOT, INDEX)} — run the web export first.`);
  process.exit(1);
}

const { expo } = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const name = expo.name || 'App';
const description = expo.description || '';
const baseUrl = (expo.experiments && expo.experiments.baseUrl) || '';

/**
 * The share picture is the app icon, which has to be reachable at a stable URL.
 *
 * Two things make that awkward. Open Graph needs an absolute URL — a relative
 * path renders as a broken image in every chat client — so the deployed origin
 * has to be supplied. And the export hashes every asset into `_expo/static`, so
 * there is no predictable path to point at; the first version of this pointed at
 * `/icon.png`, which was a 404, and a share card with a broken image is worse
 * than one with no image at all.
 *
 * So the icon is copied to a fixed name at the root of the export, and the tag
 * is only written once that copy is on disk.
 */
const origin = process.env.SITE_ORIGIN || '';
const SHARE_NAME = 'share-card.png';
let iconUrl = '';
if (origin) {
  const src = path.join(ROOT, 'assets', 'images', 'icon.png');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, SHARE_NAME));
    iconUrl = `${origin}${baseUrl}/${SHARE_NAME}`;
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const tags = [
  description && `<meta name="description" content="${esc(description)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:title" content="${esc(name)}" />`,
  description && `<meta property="og:description" content="${esc(description)}" />`,
  origin && `<meta property="og:url" content="${esc(origin + baseUrl)}/" />`,
  iconUrl && `<meta property="og:image" content="${esc(iconUrl)}" />`,
  // summary_large_image needs a wide picture; a square app icon belongs in the
  // small card, which crops it to a square rather than letterboxing it.
  `<meta name="twitter:card" content="summary" />`,
  `<meta name="twitter:title" content="${esc(name)}" />`,
  description && `<meta name="twitter:description" content="${esc(description)}" />`,
  iconUrl && `<meta name="twitter:image" content="${esc(iconUrl)}" />`,
  `<meta name="theme-color" content="${esc((expo.splash && expo.splash.backgroundColor) || '#211712')}" />`,
].filter(Boolean);

let html = fs.readFileSync(INDEX, 'utf8');

// Running twice should not stack a second copy of everything.
if (html.includes('<!-- harf:meta -->')) {
  html = html.replace(/\n?\s*<!-- harf:meta -->[\s\S]*?<!-- \/harf:meta -->/, '');
}

const block = `\n    <!-- harf:meta -->\n    ${tags.join('\n    ')}\n    <!-- /harf:meta -->`;
html = html.replace('</title>', `</title>${block}`);
fs.writeFileSync(INDEX, html);

console.log(`Injected ${tags.length} meta tags into ${path.relative(ROOT, INDEX)}`);
if (!origin)
  console.log('  (SITE_ORIGIN not set — share-image tags skipped, since a relative og:image never renders)');
else if (!iconUrl) console.log('  (assets/images/icon.png missing — share-image tags skipped)');
else console.log(`  share card copied to ${SHARE_NAME}, served at ${iconUrl}`);
