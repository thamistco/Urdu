/* eslint-disable */
/**
 * The web app claims to be installable only if an installed copy can open.
 *
 * Launch bar R6: "Offline is honest". With `display: standalone` Chrome offered
 * to install Qaaf, and the installed icon opened the browser's offline page,
 * because nothing kept the app on the device (design review, 2026-10-24 and
 * 2026-10-28). Until a service worker keeps it (P-111, held), the manifest
 * asks for a browser tab, which Chrome does not offer to install.
 *
 * Asserted against the built manifest: with no dist/sw.js, `display` must be
 * `browser`. With a worker, this leaves the choice to it and its own check.
 *
 * Run with:  npm run check:installable
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const file = path.join(DIST, 'manifest.webmanifest');

if (!fs.existsSync(file)) {
  console.error('check:installable: no dist/manifest.webmanifest. Build the web app and run web:meta first.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
const worker = fs.existsSync(path.join(DIST, 'sw.js'));

if (!worker && manifest.display !== 'browser') {
  console.error(
    `check:installable failed: the manifest asks for display "${manifest.display}", which browsers offer to install, ` +
      'but no service worker keeps the app on the device, so an installed copy opens the offline page. ' +
      'Use "browser" until P-111 ships.'
  );
  process.exit(1);
}
console.log(
  worker
    ? `check:installable: a service worker is present; display "${manifest.display}" is its check's to judge.`
    : 'check:installable: display "browser", so nothing offers to install an app that cannot open offline.'
);
