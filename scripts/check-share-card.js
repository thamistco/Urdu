/* eslint-disable */
/**
 * A link to Qaaf pastes as a card with its picture, and the picture is there.
 *
 * `web:meta` writes the share tags only when it knows the deployed origin,
 * because a relative og:image renders as a broken picture in every chat
 * client. Locally it was never told the origin, so the page `check:all` built
 * had no picture tags at all while still asking for the large card, and
 * nothing anywhere looked at what a pasted link would show (Q-109).
 *
 * Asserted, against the built page in dist/:
 *   - og:image and twitter:image are the same absolute https URL, and it is
 *     the page's own address (og:url) plus share-card.jpg;
 *   - dist/share-card.jpg exists, is a JPEG, 1200x630 by its own header, and
 *     no larger than 300 KB (what make-share-card.js promises);
 *   - the picture has alt text, and the large card is asked for only when
 *     there is a picture to put in it.
 *
 * Needs a web build in dist/ with web:meta run on it and SITE_ORIGIN set.
 *
 * Run with:  npm run check:share-card
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const NAME = 'share-card.jpg';
const MAX_BYTES = 300 * 1024;

const problems = [];
const page = path.join(DIST, 'index.html');
if (!fs.existsSync(page)) {
  console.error('check:share-card: no dist/index.html. Build the web app and run web:meta first.');
  process.exit(1);
}
const html = fs.readFileSync(page, 'utf8');

/** The content of the one meta tag with this property or name, or null. */
function meta(key) {
  const found = [...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)"/g)].filter((m) => m[1] === key);
  if (found.length > 1) problems.push(`${key} appears ${found.length} times`);
  return found.length ? found[0][2] : null;
}

const pageUrl = meta('og:url');
const image = meta('og:image');
const twitterImage = meta('twitter:image');

if (!pageUrl) problems.push('no og:url, so the page does not know its own address (was SITE_ORIGIN set for web:meta?)');
if (!image) problems.push('no og:image: a pasted link shows no picture (was SITE_ORIGIN set for web:meta?)');
if (image && !/^https:\/\//.test(image)) problems.push(`og:image is not an absolute https URL: ${image}`);
if (image && twitterImage !== image) problems.push(`twitter:image (${twitterImage}) differs from og:image (${image})`);
if (image && pageUrl && image !== pageUrl.replace(/\/?$/, '/') + NAME) {
  problems.push(`og:image ${image} is not this page's ${NAME} (${pageUrl})`);
}
if (image && !meta('og:image:alt')) problems.push('the picture has no og:image:alt');
const card = meta('twitter:card');
if (card === 'summary_large_image' && !image)
  problems.push('twitter:card asks for the large card with no picture to fill it');
if (image && card !== 'summary_large_image') problems.push(`twitter:card is "${card}" with a wide picture written`);

/** Width and height from a JPEG's start-of-frame marker, or null. */
function jpegSize(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const length = buf.readUInt16BE(i + 2);
    // SOF0 to SOF15, less DHT (C4), JPG (C8) and DAC (CC), which share the range.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

const file = path.join(DIST, NAME);
if (!fs.existsSync(file)) {
  problems.push(`dist/${NAME} is missing, so the og:image URL is a 404`);
} else {
  const buf = fs.readFileSync(file);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) problems.push(`dist/${NAME} is not a JPEG`);
  const size = jpegSize(buf);
  if (!size || size.width !== 1200 || size.height !== 630) {
    problems.push(`dist/${NAME} is ${size ? `${size.width}x${size.height}` : 'of unknown size'}, not 1200x630`);
  }
  if (buf.length > MAX_BYTES) problems.push(`dist/${NAME} is ${Math.round(buf.length / 1024)} KB, over 300 KB`);
}

if (problems.length) {
  console.error('check:share-card failed:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check:share-card: ${image} is a 1200x630 JPEG with alt text, in the large card.`);
