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

/**
 * The config is read through `app.config.js`, not straight out of `app.json`.
 *
 * `baseUrl` is a function of the environment now (see app.config.js for why),
 * so app.json no longer holds the whole truth. Reading the resolved config is
 * the difference between this script agreeing with the bundle Expo just built
 * and this script guessing.
 */
const expo = require(path.join(ROOT, 'app.config.js'))();
const name = expo.name || 'App';
const description = expo.description || '';
const baseUrl = (expo.experiments && expo.experiments.baseUrl) || '';
const buildSha = (expo.extra && expo.extra.buildSha) || '';
/**
 * What a shared link shows: the store name and one line, not "Qaaf" and the
 * 380-character course description, which chat previews cut off mid-sentence
 * (marketing review, 2026-10-11, P-037). The description stays the page's own,
 * for search, where its numbers are what check:claims audits.
 */
const shareTitle = (expo.extra && expo.extra.storeName) || name;
const shareLine = (expo.extra && expo.extra.shareLine) || description;

/**
 * The share picture is `share-card.jpg`, 1200x630, drawn by
 * `scripts/make-share-card.js` from the evening scene with the name and the
 * headline (P-040). Before it existed this was the square app icon, and the
 * icon is still the fallback. Either has to be reachable at a stable URL.
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
const CARD = path.join(ROOT, 'assets', 'images', 'share-card.jpg');
const wide = fs.existsSync(CARD);
const SHARE_NAME = wide ? 'share-card.jpg' : 'share-card.png';
const CARD_ALT = 'Qaaf (قاف): Speak Urdu? Now read it.';
let iconUrl = '';
if (origin) {
  const src = wide ? CARD : path.join(ROOT, 'assets', 'images', 'icon.png');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, SHARE_NAME));
    iconUrl = `${origin}${baseUrl}/${SHARE_NAME}`;
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The name an installed shortcut is given.
 *
 * There was no manifest at all, so "Add to home screen" had nothing to read and
 * Chrome fell back to `document.title` — which React Navigation rewrites on
 * every navigation. Whoever installed the app while sitting on the first screen
 * got a shortcut called **Onboarding**, permanently: Android captures the label
 * once, at creation, and never revisits it.
 *
 * A manifest takes that decision away from whatever route happened to be open.
 * `short_name` is what actually appears under the icon — a launcher gives it
 * about twelve characters — and `name` is the longer form used in the install
 * prompt and the app switcher.
 *
 * Both are read from the config rather than written here, so the phone, the
 * stores and the browser cannot drift apart.
 *
 * Note this cannot rename a shortcut that already exists. Anyone holding an
 * "Onboarding" icon has to remove it and add it again.
 */
const MANIFEST_NAME = 'manifest.webmanifest';
const ICON_NAME = 'app-icon.png';
let manifestWritten = false;
{
  const icon = path.join(ROOT, 'assets', 'images', 'icon.png');
  const icons = [];
  if (fs.existsSync(icon)) {
    fs.copyFileSync(icon, path.join(DIST, ICON_NAME));
    // `purpose: any maskable` lets Android crop it to the launcher's own shape
    // instead of dropping the square onto a white plate.
    icons.push({ src: `${baseUrl}/${ICON_NAME}`, sizes: '1024x1024', type: 'image/png', purpose: 'any maskable' });
  }
  const background = (expo.splash && expo.splash.backgroundColor) || '#211712';
  fs.writeFileSync(
    path.join(DIST, MANIFEST_NAME),
    JSON.stringify(
      {
        name: (expo.extra && expo.extra.storeName) || name,
        short_name: name,
        description,
        start_url: `${baseUrl}/`,
        scope: `${baseUrl}/`,
        display: 'standalone',
        orientation: 'portrait',
        background_color: background,
        theme_color: background,
        icons,
      },
      null,
      2
    )
  );
  manifestWritten = true;
}

const tags = [
  description && `<meta name="description" content="${esc(description)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:title" content="${esc(shareTitle)}" />`,
  shareLine && `<meta property="og:description" content="${esc(shareLine)}" />`,
  origin && `<meta property="og:url" content="${esc(origin + baseUrl)}/" />`,
  iconUrl && `<meta property="og:image" content="${esc(iconUrl)}" />`,
  iconUrl && wide && `<meta property="og:image:width" content="1200" />`,
  iconUrl && wide && `<meta property="og:image:height" content="630" />`,
  iconUrl && wide && `<meta property="og:image:type" content="image/jpeg" />`,
  // Latin first: a string that opens in Urdu script is laid out right to left
  // by any client that picks direction from the first letter.
  iconUrl && wide && `<meta property="og:image:alt" content="${CARD_ALT}" />`,
  // summary_large_image needs a wide picture; a square app icon belongs in the
  // small card, which crops it to a square rather than letterboxing it. With no
  // image written at all (no origin), a large card would promise one it lacks.
  `<meta name="twitter:card" content="${iconUrl && wide ? 'summary_large_image' : 'summary'}" />`,
  `<meta name="twitter:title" content="${esc(shareTitle)}" />`,
  shareLine && `<meta name="twitter:description" content="${esc(shareLine)}" />`,
  iconUrl && `<meta name="twitter:image" content="${esc(iconUrl)}" />`,
  iconUrl && wide && `<meta name="twitter:image:alt" content="${CARD_ALT}" />`,
  `<meta name="theme-color" content="${esc((expo.splash && expo.splash.backgroundColor) || '#211712')}" />`,
  // Without this the manifest is a file nobody asks for. It is what stops an
  // installed shortcut being named after whichever route was open at the time.
  manifestWritten && `<link rel="manifest" href="${esc(baseUrl)}/${MANIFEST_NAME}" />`,
  // iOS ignores the manifest's short_name for home-screen labels and reads this.
  `<meta name="apple-mobile-web-app-title" content="${esc(name)}" />`,
  // The commit this bundle was built from. Not decoration: `check:deployed`
  // fetches the live page and asserts this matches, which is the only way to
  // know a deploy actually published rather than merely reporting success.
  buildSha && `<meta name="qaaf:build" content="${esc(buildSha)}" />`,
  // The subpath the site is served from, for the router.
  //
  // Expo writes absolute asset URLs under this prefix but emits no <base> tag
  // and no runtime constant for it, and react-navigation's web linking matches
  // against the whole `location.pathname` — so without this the deployed app
  // at /Urdu/ would try to resolve "/Urdu/settings" against routes named
  // "settings" and find nothing. Absent means served from the root, which is
  // what a local `npm run build:web` produces.
  baseUrl && `<meta name="qaaf:base" content="${esc(baseUrl)}" />`,
  ...fontPreloads(),
].filter(Boolean);

/**
 * Start the fonts the first screen waits for as the page loads, not after the
 * bundle has run.
 *
 * App.tsx holds the first screen until the fonts in its `useFonts` have
 * loaded (or 2.5s pass), and those requests began only once the 900 KB bundle
 * had downloaded and run: at 6.9s on slow 4G with a 4x slower CPU (QA round
 * 5, M24). Preloaded, they download alongside the bundle. Measured locally,
 * gzip served, three cold runs each: usable at 10.3s before, 9.2s after.
 *
 * The list is read from App.tsx's `useFonts` call, so the two cannot drift;
 * a name there with no file in the export stops the build rather than
 * preloading nothing.
 */
function fontPreloads() {
  const app = fs.readFileSync(path.join(ROOT, 'App.tsx'), 'utf8');
  const call = app.match(/useFonts\(\{([\s\S]*?)\}\)/);
  if (!call) throw new Error('inject-web-meta: no useFonts({...}) call found in App.tsx');
  const names = [...call[1].matchAll(/:\s*([A-Za-z]+_\d{3}[A-Za-z_]*)/g)].map((m) => m[1]);
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (f.endsWith('.ttf')) files.push(f);
    }
  };
  walk(path.join(DIST, 'assets'));
  return names.map((n) => {
    const file = files.find((f) => path.basename(f).startsWith(`${n}.`));
    if (!file) throw new Error(`inject-web-meta: ${n} is in useFonts but no ${n}.*.ttf is in the export`);
    const href = `${baseUrl}/${path.relative(DIST, file).split(path.sep).join('/')}`;
    return `<link rel="preload" href="${esc(href)}" as="font" type="font/ttf" crossorigin />`;
  });
}

let html = fs.readFileSync(INDEX, 'utf8');

// Running twice should not stack a second copy of everything.
if (html.includes('<!-- qaaf:meta -->')) {
  html = html.replace(/\n?\s*<!-- qaaf:meta -->[\s\S]*?<!-- \/qaaf:meta -->/, '');
}

const block = `\n    <!-- qaaf:meta -->\n    ${tags.join('\n    ')}\n    <!-- /qaaf:meta -->`;
html = html.replace('</title>', `</title>${block}`);
fs.writeFileSync(INDEX, html);

console.log(`Injected ${tags.length} meta tags into ${path.relative(ROOT, INDEX)}`);
if (manifestWritten)
  console.log(`  wrote ${MANIFEST_NAME} — installs as "${expo.extra?.storeName || name}", labelled "${name}"`);
if (!origin) console.log('  (SITE_ORIGIN not set — share-image tags skipped, since a relative og:image never renders)');
else if (!iconUrl) console.log('  (assets/images/icon.png missing — share-image tags skipped)');
else console.log(`  share card copied to ${SHARE_NAME}, served at ${iconUrl}`);
